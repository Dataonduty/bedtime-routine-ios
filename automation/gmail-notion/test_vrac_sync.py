#!/usr/bin/env python3
"""Tests hors ligne du parsing (aucun appel reseau, aucune dependance requise).

    python3 test_vrac_sync.py
"""

from __future__ import annotations

import base64
import sys
import types


def _stub_dependencies() -> None:
    """Permet d'importer vrac_sync sans le venv (les stubs ne sont jamais appeles)."""
    for name in (
        "requests",
        "google",
        "google.auth",
        "google.auth.transport",
        "google.auth.transport.requests",
        "google.oauth2",
        "google.oauth2.credentials",
        "googleapiclient",
        "googleapiclient.discovery",
        "googleapiclient.errors",
    ):
        sys.modules.setdefault(name, types.ModuleType(name))
    sys.modules["google.auth.transport.requests"].Request = object
    sys.modules["google.oauth2.credentials"].Credentials = object
    sys.modules["googleapiclient.discovery"].build = lambda *a, **k: None
    sys.modules["googleapiclient.errors"].HttpError = Exception


_stub_dependencies()
import vrac_sync as v  # noqa: E402

PREFIX = "Vrac -"
failures: list[str] = []


def check(label: str, got, expected) -> None:
    if got != expected:
        failures.append(f"{label}\n    attendu : {expected!r}\n    obtenu  : {got!r}")


def b64(text: str) -> str:
    return base64.urlsafe_b64encode(text.encode()).decode()


def test_match_prefix() -> None:
    cases = [
        ("Vrac - Devis cloture a relancer", "Devis cloture a relancer"),
        ("vrac - insensible a la casse", "insensible a la casse"),
        ("Re: Vrac - reponse", "reponse"),
        ("TR: Fwd: Vrac - transfert imbrique", "transfert imbrique"),
        ("  Vrac -   espaces superflus  ", "espaces superflus"),
        ("Vrac -", "Vrac -"),
        ("Un vrac - au milieu de l'objet", None),
        ("Vracuum cleaner", None),
        ("Facture EDF", None),
    ]
    for subject, expected in cases:
        check(f"match_prefix({subject!r})", v.match_prefix(subject, PREFIX), expected)


def test_extract_body() -> None:
    multipart = {
        "mimeType": "multipart/alternative",
        "parts": [
            {"mimeType": "text/plain", "body": {"data": b64("Ligne un.\r\n\r\n\r\nLigne deux.  \n")}},
            {"mimeType": "text/html", "body": {"data": b64("<p>version HTML ignoree</p>")}},
        ],
    }
    check("extract_body prefere text/plain", v.extract_body(multipart), "Ligne un.\n\nLigne deux.")

    html_only = {
        "mimeType": "text/html",
        "body": {"data": b64("<style>a{}</style><p>Bonjour &amp; salut</p><br>Suite<script>x</script>")},
    }
    check("extract_body detague le HTML", v.extract_body(html_only), "Bonjour & salut\n\nSuite")

    check("extract_body sans corps", v.extract_body({"mimeType": "text/plain"}), "")


def test_extract_attachments() -> None:
    # Cas reel : mail « Vrac - finalisation vrac e-mail » — une photo, aucun texte.
    photo_only = {
        "mimeType": "multipart/mixed",
        "parts": [
            {"mimeType": "text/plain", "filename": "", "body": {"size": 0}},
            {
                "mimeType": "image/jpeg",
                "filename": "88983.jpg",
                "body": {"attachmentId": "ANGjdJ", "size": 1280000},
            },
        ],
    }
    check("extract_attachments photo seule", v.extract_attachments(photo_only), ["88983.jpg"])
    check("extract_body photo seule", v.extract_body(photo_only), "")

    blocks = v.body_blocks(v.extract_body(photo_only), v.extract_attachments(photo_only))
    types = [b["type"] for b in blocks]
    check(
        "body_blocks signale la piece jointe",
        types,
        ["paragraph", "heading_3", "bulleted_list_item", "paragraph"],
    )

    # Un corps de texte sans piece jointe ne doit pas gagner de section parasite.
    check(
        "body_blocks sans piece jointe",
        [b["type"] for b in v.body_blocks("du texte", [])],
        ["paragraph"],
    )


def test_received_at() -> None:
    dated = {"headers": [{"name": "Date", "value": "Sat, 29 Aug 2026 09:12:00 +0200"}]}
    check("received_at depuis l'en-tete", v.received_at(dated, None), "2026-08-29T09:12:00+02:00")
    check(
        "received_at replie sur internalDate",
        v.received_at({"headers": []}, "1756458720000"),
        "2025-08-29T09:12:00+00:00",
    )
    check("received_at sans rien", v.received_at({}, None), None)


def test_body_blocks() -> None:
    sizes = lambda blocks: [
        len(b["paragraph"]["rich_text"][0]["text"]["content"]) for b in blocks
    ]

    check("body_blocks corps court", len(v.body_blocks("court")), 1)
    check(
        "body_blocks corps vide",
        v.body_blocks("")[0]["paragraph"]["rich_text"][0]["text"]["content"],
        "(Mail sans corps texte.)",
    )

    # Notion rejette tout bloc texte au-dela de 2000 caracteres.
    long_blocks = v.body_blocks("mot " * 3000)
    if max(sizes(long_blocks)) > 2000:
        failures.append("body_blocks depasse la limite Notion de 2000 caracteres")

    # Et pas plus de NOTION_MAX_BLOCKS (+1 pour la mention de troncature).
    many_blocks = v.body_blocks("\n\n".join(f"paragraphe {i}" for i in range(500)))
    if len(many_blocks) > v.NOTION_MAX_BLOCKS + 1:
        failures.append(f"body_blocks renvoie {len(many_blocks)} blocs, trop pour Notion")


def main() -> int:
    for test in (
        test_match_prefix,
        test_extract_body,
        test_extract_attachments,
        test_received_at,
        test_body_blocks,
    ):
        test()
    if failures:
        print(f"{len(failures)} echec(s) :\n")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("Tous les tests passent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
