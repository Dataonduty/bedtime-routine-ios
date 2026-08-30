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
import mimetypes
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

# Deux versions d'API, volontairement.
# - Les pages et la base restent en 2022-06-28 : depuis 2025-09-03 une base
#   contient des « data sources » et le parent d'une page se designe autrement.
# - L'API d'envoi de fichiers, elle, exige une version recente.
# Notion-Version se pose par requete, ce cloisonnement est donc sans risque.
# Les deux se surchargent dans .env si Notion fait encore evoluer tout ca.
NOTION_VERSION = "2022-06-28"
NOTION_UPLOAD_VERSION = "2026-03-11"

# Notion refuse un bloc texte au-dela de 2000 caracteres, et une page ne peut
# pas naitre avec plus de 100 blocs enfants. On garde de la marge pour les images.
NOTION_TEXT_CHUNK = 1900
NOTION_MAX_BLOCKS = 60
NOTION_MAX_CHILDREN = 95

# Au-dela, l'envoi doit etre decoupe en plusieurs morceaux : on ne le fait pas,
# le fichier reste alors dans Gmail.
NOTION_SINGLE_UPLOAD_LIMIT = 20 * 1024 * 1024

# Separateur de signature normalise (RFC 3676) : une ligne « -- » et rien d'autre.
SIGNATURE_SEPARATOR_RE = re.compile(r"^\s*--\s*$")

# Ligne de tirets, underscores ou egales servant de separateur decoratif.
RULE_LINE_RE = re.compile(r"^\s*(?:[-_=~*–—]\s*){4,}$")

# Pieds de page ajoutes par les clients mobiles.
MOBILE_FOOTER_RE = re.compile(
    r"^\s*(?:envoy[ée]\s+(?:de|depuis)\s+mon\b"
    r"|sent\s+from\s+my\b"
    r"|(?:obtenez|t[ée]l[ée]charg(?:er|ez))\s+outlook\s+pour\b"
    r"|get\s+outlook\s+for\b)",
    re.I,
)

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


def ensure_labels(service, names: list[str]) -> list[str]:
    """Renvoie les IDs des labels, en creant ceux qui manquent.

    La liste des labels n'est demandee qu'une fois, quel que soit leur nombre.
    """
    existing = {
        label["name"]: label["id"]
        for label in service.users().labels().list(userId="me").execute().get("labels", [])
    }
    ids: list[str] = []
    for name in names:
        if name in existing:
            ids.append(existing[name])
            continue
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
        ids.append(label["id"])
    return ids


def parse_label_names(raw: str, exclude: str = "") -> list[str]:
    """Decoupe une liste de labels separes par des virgules, sans doublon."""
    names: list[str] = []
    for name in raw.split(","):
        name = name.strip()
        if name and name != exclude and name not in names:
            names.append(name)
    return names


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


def collect_attachments(payload: dict) -> list[dict]:
    """Toutes les pieces jointes, y compris les images inserees dans le corps.

    Une image collee dans un mail est une partie MIME comme une autre : elle
    porte juste un Content-ID et un Content-Disposition « inline ». On la traite
    donc exactement comme une piece jointe classique.
    """
    found: list[dict] = []

    def walk(part: dict) -> None:
        body = part.get("body", {}) or {}
        mime = part.get("mimeType", "") or ""
        filename = (part.get("filename") or "").strip()
        attachment_id = body.get("attachmentId")
        inline_data = body.get("data")

        is_attachment = bool(attachment_id) or bool(filename)
        if is_attachment and not mime.startswith("multipart/"):
            disposition = header(part, "Content-Disposition").lower()
            found.append(
                {
                    "filename": filename or default_filename(mime, len(found) + 1),
                    "mime_type": mime or "application/octet-stream",
                    "attachment_id": attachment_id,
                    "inline_data": inline_data,
                    "size": int(body.get("size") or 0),
                    "inline": "inline" in disposition or bool(header(part, "Content-ID")),
                }
            )
        for child in part.get("parts", []) or []:
            walk(child)

    walk(payload)
    return found


def default_filename(mime_type: str, index: int) -> str:
    """Les images collees dans le corps arrivent souvent sans nom de fichier."""
    extension = mimetypes.guess_extension(mime_type.split(";")[0].strip()) or ".bin"
    if extension == ".jpe":
        extension = ".jpg"
    return f"image-{index}{extension}"


def is_image(attachment: dict) -> bool:
    return attachment["mime_type"].lower().startswith("image/")


def worth_uploading(attachment: dict, upload_other: bool, min_image_bytes: int) -> bool:
    """Decide si une piece jointe merite d'etre televersee dans Notion.

    Les mails HTML trainent des pixels de suivi et des logos de signature : sous
    le seuil, une image n'a jamais rien a dire. Le seuil ne s'applique qu'aux
    images — un petit fichier joint volontairement, lui, compte.
    """
    if is_image(attachment):
        return attachment["size"] >= min_image_bytes
    return upload_other


def fetch_attachment(service, message_id: str, attachment: dict) -> bytes | None:
    """Telecharge le contenu binaire d'une piece jointe."""
    if attachment.get("inline_data"):
        return base64.urlsafe_b64decode(attachment["inline_data"])
    if not attachment.get("attachment_id"):
        return None
    payload = (
        service.users()
        .messages()
        .attachments()
        .get(userId="me", messageId=message_id, id=attachment["attachment_id"])
        .execute()
    )
    data = payload.get("data")
    return base64.urlsafe_b64decode(data) if data else None


def strip_signature(body: str, max_signature_chars: int = 400) -> str:
    """Retire le bloc de signature en fin de mail.

    Trois marqueurs, du plus sur au moins sur :
      - la ligne « -- » normalisee, qui ne veut jamais dire autre chose ;
      - un pied de page de client mobile (« Envoye de mon iPhone ») ;
      - une ligne decorative de tirets, mais seulement si ce qui suit est court.
        Sans cette condition, un simple trait de separation au milieu d'une note
        emporterait tout le reste du texte.
    """
    if not body:
        return body

    lines = body.split("\n")
    for index, line in enumerate(lines):
        if SIGNATURE_SEPARATOR_RE.match(line) or MOBILE_FOOTER_RE.match(line):
            return "\n".join(lines[:index]).strip()
        if RULE_LINE_RE.match(line):
            tail = "\n".join(lines[index + 1 :]).strip()
            if len(tail) <= max_signature_chars:
                return "\n".join(lines[:index]).strip()
    return body.strip()


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
    def __init__(self, token: str, database_id: str, upload_version: str) -> None:
        self.database_id = database_id
        self.token = token
        self.upload_version = upload_version
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            }
        )

    def _request(self, method: str, path: str, version: str = "", **kwargs) -> dict:
        """Appel HTTP avec retentative sur 429 et erreurs serveur."""
        delay = 2
        last_error = ""
        headers = {"Notion-Version": version} if version else None
        for attempt in range(4):
            response = self.session.request(
                method, f"{NOTION_API}{path}", timeout=30, headers=headers, **kwargs
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

    def upload_file(self, filename: str, mime_type: str, data: bytes) -> str | None:
        """Televerse un fichier et renvoie son identifiant, utilisable dans un bloc.

        Notion procede en deux temps : on declare le fichier, puis on l'envoie a
        l'URL renvoyee. Au-dela de 20 Mo il faudrait decouper l'envoi ; on ne le
        fait pas, le fichier reste alors dans Gmail.

        L'identifiant renvoye expire au bout d'une heure s'il n'est rattache a
        aucun bloc — d'ou l'envoi juste avant la creation de la page.
        """
        if len(data) > NOTION_SINGLE_UPLOAD_LIMIT:
            log(f"  {filename} : {len(data) / 1e6:.1f} Mo, trop gros pour un envoi simple — ignore.")
            return None

        created = self._request(
            "POST",
            "/file_uploads",
            version=self.upload_version,
            json={"filename": filename[:900], "content_type": mime_type},
        )
        upload_url = created.get("upload_url")
        upload_id = created.get("id")
        if not upload_url or not upload_id:
            log(f"  {filename} : reponse d'upload inattendue — ignore.")
            return None

        # L'envoi est en multipart : requests pose lui-meme le bon Content-Type,
        # celui de la session (application/json) ferait echouer l'appel.
        response = requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Notion-Version": self.upload_version,
            },
            files={"file": (filename, data, mime_type)},
            timeout=120,
        )
        if response.status_code >= 400:
            log(f"  {filename} : envoi refuse ({response.status_code}) — ignore.")
            return None
        return upload_id

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
            "children": page_children(
                entry["body"], entry["images"], entry["other_files"]
            ),
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


def page_children(body: str, images: list[dict], other_files: list[str]) -> list[dict]:
    """Assemble le contenu de la page : texte, puis images, puis fichiers restants.

    Notion refuse une page creee avec plus de 100 blocs. Les images et la liste
    des fichiers reservent leur place d'abord : c'est le texte qui est rogne, pas
    une piece jointe qui disparait.
    """
    tail = image_blocks(images) + attachment_blocks(other_files)
    budget = max(1, NOTION_MAX_CHILDREN - len(tail))
    text = body_blocks(body, has_files=bool(images or other_files))
    if len(text) > budget:
        text = text[: budget - 1] + [paragraph("(…) Texte tronque — voir le mail d'origine.")]
    return text + tail


def body_blocks(body: str, has_files: bool = False) -> list[dict]:
    """Decoupe le corps du mail en blocs paragraphe acceptes par Notion."""
    if not body:
        if has_files:
            # Cas courant : une photo envoyee a soi-meme, sans un mot.
            return [paragraph("(Aucun texte — le mail ne contient que ses fichiers.)")]
        return [paragraph("(Mail sans corps texte.)")]

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

    return [paragraph(chunk) for chunk in chunks]


def heading(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_3",
        "heading_3": {"rich_text": [{"text": {"content": text}}]},
    }


def image_blocks(images: list[dict]) -> list[dict]:
    """Images reellement televersees dans Notion, affichees dans la page."""
    if not images:
        return []
    blocks = [heading("Images")]
    for image in images:
        blocks.append(
            {
                "object": "block",
                "type": "image",
                "image": {
                    "type": "file_upload",
                    "file_upload": {"id": image["upload_id"]},
                    "caption": [{"text": {"content": image["filename"][:2000]}}],
                },
            }
        )
    return blocks


def attachment_blocks(names: list[str]) -> list[dict]:
    """Fichiers non televerses : ils restent dans Gmail, mais sont signales."""
    if not names:
        return []
    blocks = [heading("Autres pièces jointes")]
    blocks += [
        {
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": [{"text": {"content": name[:2000]}}]},
        }
        for name in names[:20]
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
    extra_label_names = parse_label_names(
        env_str("GMAIL_EXTRA_LABELS", "Vrac 2nd cerveau"), exclude=label_name
    )
    window_days = env_int("GMAIL_SEARCH_WINDOW_DAYS", 30)
    max_per_run = env_int("GMAIL_MAX_PER_RUN", 25)
    max_body = env_int("MAX_BODY_CHARS", 12000)
    archive_after = env_bool("GMAIL_ARCHIVE_AFTER_IMPORT", True)
    strip_sig = env_bool("STRIP_SIGNATURE", True)
    signature_max = env_int("SIGNATURE_MAX_CHARS", 400)
    upload_images = env_bool("UPLOAD_IMAGES", True)
    upload_other = env_bool("UPLOAD_OTHER_ATTACHMENTS", False)
    min_image_bytes = env_int("MIN_IMAGE_BYTES", 8000)
    max_files = env_int("MAX_FILES_PER_MAIL", 10)

    token = env_str("NOTION_TOKEN")
    database_id = env_str("NOTION_DATABASE_ID")
    if not token or not database_id:
        raise SystemExit("NOTION_TOKEN et NOTION_DATABASE_ID sont obligatoires (voir .env).")

    notion = Notion(
        token, database_id, env_str("NOTION_UPLOAD_VERSION", NOTION_UPLOAD_VERSION)
    )
    log(f"Base Notion cible : {notion.check_access()}")

    service = gmail_service(BASE_DIR / "token.json", BASE_DIR / "credentials.json")
    label_id, *extra_label_ids = ensure_labels(service, [label_name] + extra_label_names)
    if extra_label_names:
        log(f"Libelle(s) supplementaire(s) : {', '.join(extra_label_names)}")

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
        body = extract_body(payload)
        if strip_sig:
            body = strip_signature(body, signature_max)
        body = body[:max_body]
        attachments = collect_attachments(payload)

        to_upload = (
            [a for a in attachments if worth_uploading(a, upload_other, min_image_bytes)][
                :max_files
            ]
            if upload_images
            else []
        )
        retained = {id(a) for a in to_upload}
        skipped_files = [a["filename"] for a in attachments if id(a) not in retained]

        entry = {
            "title": title,
            "sender": sender_label,
            "received_at": received_at(payload, message.get("internalDate")),
            "link": f"https://mail.google.com/mail/u/0/#all/{message.get('threadId', stub['id'])}",
            "message_id": stub["id"],
            "body": body,
            "images": [],
            "other_files": skipped_files,
        }

        if args.dry_run:
            detail = ""
            if to_upload:
                names = ", ".join(
                    f"{a['filename']} ({a['size'] / 1000:.0f} ko)" for a in to_upload
                )
                detail += f" — a televerser : {names}"
            if skipped_files:
                detail += f" — ignores : {', '.join(skipped_files)}"
            log(f"[essai] « {title} » — de {sender_label}{detail} (aucune ecriture)")
            imported += 1
            continue

        try:
            if notion.already_imported(stub["id"]):
                log(f"Deja present dans Notion, on pose juste le label : « {title} »")
            else:
                for attachment in to_upload:
                    # Un envoi qui echoue degrade le fichier en simple mention :
                    # mieux vaut une page sans l'image qu'un mail jamais importe.
                    upload_id = None
                    try:
                        data = fetch_attachment(service, stub["id"], attachment)
                        if data:
                            upload_id = notion.upload_file(
                                attachment["filename"], attachment["mime_type"], data
                            )
                    except (RuntimeError, HttpError, requests.RequestException) as error:
                        log(f"  {attachment['filename']} : envoi impossible ({error})")

                    if upload_id:
                        entry["images"].append(
                            {"upload_id": upload_id, "filename": attachment["filename"]}
                        )
                    else:
                        entry["other_files"].append(attachment["filename"])

                url = notion.create_entry(entry)
                joined = f", {len(entry['images'])} fichier(s)" if entry["images"] else ""
                log(f"Cree : « {title} »{joined} -> {url}")

            # Un seul appel : le mail ne peut pas sortir de la boite de reception
            # sans avoir recu ses libelles.
            body_changes: dict = {"addLabelIds": [label_id] + extra_label_ids}
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
