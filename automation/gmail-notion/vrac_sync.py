#!/usr/bin/env python3
"""Gmail -> Notion : importe les mails « Vrac - ... » dans la base « Vrac a classer ».

Un passage :
  1. cherche dans Gmail les mails dont l'objet commence par le prefixe ;
  2. ignore ceux qui portent deja le label « importe » ;
  3. cree une page dans la base Notion (objet, expediteur, date, lien, corps) ;
  4. pose le label sur le mail — c'est ce qui rend le script idempotent.

Concu pour tourner en cron sur le Pi « flex1 ». Voir README.md.
"""

from __future__ import annotations

import argparse
import base64
import html
import os
import re
import sys
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime, parseaddr
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

BASE_DIR = Path(__file__).resolve().parent
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

# Notion refuse un bloc texte au-dela de 2000 caracteres.
NOTION_TEXT_CHUNK = 1900
NOTION_MAX_BLOCKS = 90

# Prefixes de reponse/transfert tolere devant le prefixe declencheur.
REPLY_PREFIX_RE = re.compile(r"^\s*(?:re|ref|rep|rép|fw|fwd|tr)\s*(?:\[\d+\])?\s*:\s*", re.I)


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

def load_env(path: Path) -> None:
    """Charge un fichier .env minimaliste sans ecraser l'environnement existant."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def env_str(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def env_int(name: str, default: int) -> int:
    try:
        return int(env_str(name) or default)
    except ValueError:
        return default


def env_bool(name: str, default: bool = False) -> bool:
    value = env_str(name).lower()
    if not value:
        return default
    return value in {"1", "true", "yes", "oui", "on"}


def log(message: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {message}", flush=True)


# --------------------------------------------------------------------------
# Gmail
# --------------------------------------------------------------------------

def gmail_service(token_path: Path, credentials_path: Path):
    if not token_path.exists():
        raise SystemExit(
            f"Jeton Gmail absent ({token_path}). Lancer d'abord : ./authorize.py"
        )
    creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            token_path.write_text(creds.to_json(), encoding="utf-8")
            token_path.chmod(0o600)
            log("Jeton Gmail rafraichi.")
        else:
            raise SystemExit(
                "Jeton Gmail invalide et non rafraichissable. Relancer : ./authorize.py"
            )
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def ensure_label(service, name: str) -> str:
    """Renvoie l'ID du label, en le creant (avec ses parents) si besoin."""
    existing = {
        label["name"]: label["id"]
        for label in service.users().labels().list(userId="me").execute().get("labels", [])
    }
    if name in existing:
        return existing[name]
    label = (
        service.users()
        .labels()
        .create(
            userId="me",
            body={
                "name": name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show",
            },
        )
        .execute()
    )
    log(f"Label Gmail cree : {name}")
    return label["id"]


def header(payload: dict, name: str) -> str:
    for entry in payload.get("headers", []):
        if entry.get("name", "").lower() == name.lower():
            return entry.get("value", "")
    return ""


def decode_part(data: str) -> str:
    return base64.urlsafe_b64decode(data.encode("utf-8")).decode("utf-8", errors="replace")


def html_to_text(raw: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?</\1>", " ", raw)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p\s*>", "\n\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(text)


def extract_body(payload: dict) -> str:
    """Parcourt l'arbre MIME et renvoie le meilleur corps texte disponible."""
    plain: list[str] = []
    rich: list[str] = []

    def walk(part: dict) -> None:
        mime = part.get("mimeType", "")
        data = part.get("body", {}).get("data")
        if data:
            if mime == "text/plain":
                plain.append(decode_part(data))
            elif mime == "text/html":
                rich.append(html_to_text(decode_part(data)))
        for child in part.get("parts", []) or []:
            walk(child)

    walk(payload)
    text = "\n".join(plain) if plain else "\n".join(rich)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_attachments(payload: dict) -> list[str]:
    """Noms des pieces jointes. Un mail « vrac » est souvent une photo sans texte."""
    names: list[str] = []

    def walk(part: dict) -> None:
        filename = (part.get("filename") or "").strip()
        if filename and part.get("body", {}).get("attachmentId"):
            names.append(filename)
        for child in part.get("parts", []) or []:
            walk(child)

    walk(payload)
    return names


def strip_reply_prefixes(subject: str) -> str:
    cleaned = subject
    while True:
        stripped = REPLY_PREFIX_RE.sub("", cleaned, count=1)
        if stripped == cleaned:
            return cleaned
        cleaned = stripped


def match_prefix(subject: str, prefix: str) -> str | None:
    """Renvoie le titre sans le prefixe, ou None si l'objet ne correspond pas."""
    candidate = strip_reply_prefixes(subject).lstrip()
    if not candidate.lower().startswith(prefix.lower()):
        return None
    title = candidate[len(prefix):].strip(" \t-–—:")
    return title or candidate.strip()


# --------------------------------------------------------------------------
# Notion
# --------------------------------------------------------------------------

class Notion:
    def __init__(self, token: str, database_id: str) -> None:
        self.database_id = database_id
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            }
        )

    def _request(self, method: str, path: str, **kwargs) -> dict:
        """Appel HTTP avec retentative sur 429 et erreurs serveur."""
        delay = 2
        last_error = ""
        for attempt in range(4):
            response = self.session.request(
                method, f"{NOTION_API}{path}", timeout=30, **kwargs
            )
            if response.status_code < 400:
                return response.json()
            last_error = f"{response.status_code} {response.text[:300]}"
            if response.status_code == 429 or response.status_code >= 500:
                wait = float(response.headers.get("Retry-After", delay))
                log(f"Notion {response.status_code}, nouvelle tentative dans {wait:.0f}s")
                time.sleep(wait)
                delay *= 2
                continue
            break
        raise RuntimeError(f"Appel Notion {method} {path} en echec : {last_error}")

    def check_access(self) -> str:
        data = self._request("GET", f"/databases/{self.database_id}")
        title = "".join(part.get("plain_text", "") for part in data.get("title", []))
        return title or self.database_id

    def already_imported(self, message_id: str) -> bool:
        """Garde-fou secondaire : le label Gmail reste la reference."""
        data = self._request(
            "POST",
            f"/databases/{self.database_id}/query",
            json={
                "filter": {"property": "ID message", "rich_text": {"equals": message_id}},
                "page_size": 1,
            },
        )
        return bool(data.get("results"))

    def create_entry(self, entry: dict) -> str:
        payload = {
            "parent": {"database_id": self.database_id},
            "icon": {"type": "emoji", "emoji": "📥"},
            "properties": {
                "Nom": {"title": [{"text": {"content": entry["title"][:2000]}}]},
                "Statut": {"select": {"name": "À classer"}},
                "Source": {"select": {"name": "Gmail"}},
                "Expéditeur": {
                    "rich_text": [{"text": {"content": entry["sender"][:2000]}}]
                },
                "Lien Gmail": {"url": entry["link"]},
                "ID message": {
                    "rich_text": [{"text": {"content": entry["message_id"]}}]
                },
            },
            "children": body_blocks(entry["body"], entry["attachments"]),
        }
        if entry["received_at"]:
            payload["properties"]["Date réception"] = {
                "date": {"start": entry["received_at"]}
            }
        return self._request("POST", "/pages", json=payload)["url"]


def paragraph(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [{"text": {"content": text}}]},
    }


def body_blocks(body: str, attachments: list[str] | None = None) -> list[dict]:
    """Decoupe le corps du mail en blocs paragraphe acceptes par Notion."""
    attachments = attachments or []

    if not body:
        if attachments:
            # Cas courant : une photo envoyee a soi-meme, sans un mot.
            note = "(Aucun texte — le mail ne contient que sa ou ses pieces jointes.)"
        else:
            note = "(Mail sans corps texte.)"
        return [paragraph(note)] + attachment_blocks(attachments)

    chunks: list[str] = []
    for block in body.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        while len(block) > NOTION_TEXT_CHUNK:
            cut = block.rfind("\n", 0, NOTION_TEXT_CHUNK)
            if cut <= 0:
                cut = block.rfind(" ", 0, NOTION_TEXT_CHUNK)
            if cut <= 0:
                cut = NOTION_TEXT_CHUNK
            chunks.append(block[:cut].strip())
            block = block[cut:].strip()
        if block:
            chunks.append(block)

    truncated = len(chunks) > NOTION_MAX_BLOCKS
    chunks = chunks[:NOTION_MAX_BLOCKS]
    if truncated:
        chunks.append("(…) Corps du mail tronque — ouvrir le lien Gmail pour la suite.")

    return [paragraph(chunk) for chunk in chunks] + attachment_blocks(attachments)


def attachment_blocks(attachments: list[str]) -> list[dict]:
    """Liste les pieces jointes : le fichier reste dans Gmail, mais il est signale."""
    if not attachments:
        return []
    blocks = [
        {
            "object": "block",
            "type": "heading_3",
            "heading_3": {"rich_text": [{"text": {"content": "Pièces jointes"}}]},
        }
    ]
    blocks += [
        {
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": [{"text": {"content": name[:2000]}}]},
        }
        for name in attachments[:20]
    ]
    blocks.append(paragraph("Fichiers consultables via le lien Gmail de cette page."))
    return blocks


# --------------------------------------------------------------------------
# Traitement
# --------------------------------------------------------------------------

def received_at(payload: dict, internal_date: str | None) -> str | None:
    raw = header(payload, "Date")
    if raw:
        try:
            return parsedate_to_datetime(raw).isoformat()
        except (TypeError, ValueError):
            pass
    if internal_date:
        try:
            moment = datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc)
            return moment.isoformat()
        except (TypeError, ValueError, OSError):
            pass
    return None


def run(args: argparse.Namespace) -> int:
    load_env(BASE_DIR / ".env")

    prefix = env_str("GMAIL_SUBJECT_PREFIX", "Vrac -")
    label_name = env_str("GMAIL_PROCESSED_LABEL", "Notion/Vrac importe")
    window_days = env_int("GMAIL_SEARCH_WINDOW_DAYS", 30)
    max_per_run = env_int("GMAIL_MAX_PER_RUN", 25)
    max_body = env_int("MAX_BODY_CHARS", 12000)
    archive_after = env_bool("GMAIL_ARCHIVE_AFTER_IMPORT", False)

    token = env_str("NOTION_TOKEN")
    database_id = env_str("NOTION_DATABASE_ID")
    if not token or not database_id:
        raise SystemExit("NOTION_TOKEN et NOTION_DATABASE_ID sont obligatoires (voir .env).")

    notion = Notion(token, database_id)
    log(f"Base Notion cible : {notion.check_access()}")

    service = gmail_service(BASE_DIR / "token.json", BASE_DIR / "credentials.json")
    label_id = ensure_label(service, label_name)

    query = f'subject:"{prefix}" newer_than:{window_days}d -in:chats'
    listing = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=max_per_run * 2)
        .execute()
    )
    messages = listing.get("messages", [])
    log(f"Recherche Gmail « {query} » : {len(messages)} message(s) candidat(s).")

    imported = skipped = failed = 0

    for stub in messages:
        if imported >= max_per_run:
            log(f"Garde-fou atteint ({max_per_run} imports) — reste pour le prochain passage.")
            break

        message = (
            service.users()
            .messages()
            .get(userId="me", id=stub["id"], format="full")
            .execute()
        )

        if label_id in message.get("labelIds", []):
            skipped += 1
            continue

        payload = message.get("payload", {})
        subject = header(payload, "Subject")
        title = match_prefix(subject, prefix)
        if title is None:
            # Gmail elargit "subject:" aux mots proches ; on revalide nous-memes.
            skipped += 1
            continue

        sender = header(payload, "From")
        name, address = parseaddr(sender)
        sender_label = f"{name} <{address}>" if name else (address or sender)
        body = extract_body(payload)[:max_body]
        attachments = extract_attachments(payload)
        entry = {
            "title": title,
            "sender": sender_label,
            "received_at": received_at(payload, message.get("internalDate")),
            "link": f"https://mail.google.com/mail/u/0/#all/{message.get('threadId', stub['id'])}",
            "message_id": stub["id"],
            "body": body,
            "attachments": attachments,
        }

        if args.dry_run:
            joined = f" + {len(attachments)} piece(s) jointe(s)" if attachments else ""
            log(f"[essai] « {title} » — de {sender_label}{joined} (aucune ecriture)")
            imported += 1
            continue

        try:
            if notion.already_imported(stub["id"]):
                log(f"Deja present dans Notion, on pose juste le label : « {title} »")
            else:
                url = notion.create_entry(entry)
                log(f"Cree : « {title} » -> {url}")

            body_changes: dict = {"addLabelIds": [label_id]}
            if archive_after:
                body_changes["removeLabelIds"] = ["INBOX"]
            service.users().messages().modify(
                userId="me", id=stub["id"], body=body_changes
            ).execute()
            imported += 1
        except (RuntimeError, HttpError) as error:
            failed += 1
            log(f"ECHEC sur « {subject} » : {error}")

    log(f"Bilan : {imported} importe(s), {skipped} ignore(s), {failed} en echec.")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Importe les mails « Vrac - ... » de Gmail vers la base Notion « Vrac a classer »."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Liste ce qui serait importe, sans rien ecrire dans Notion ni dans Gmail.",
    )
    return run(parser.parse_args())


if __name__ == "__main__":
    sys.exit(main())
