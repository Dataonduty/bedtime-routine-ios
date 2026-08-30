#!/usr/bin/env python3
"""Autorisation Gmail — a lancer UNE SEULE FOIS sur le Pi (puis si le jeton casse).

Le Pi n'a pas de navigateur : on ouvre un mini serveur local sur le Pi et on y
accede depuis le PC via un tunnel SSH. Depuis le PC, avant de lancer ce script :

    ssh -L 8765:localhost:8765 geoffrey@192.168.1.2

puis, dans cette session SSH :

    cd ~/vrac-notion && ./.venv/bin/python authorize.py

Le script affiche une URL : la coller dans le navigateur du PC. Google renvoie
ensuite vers http://localhost:8765/, capte par le tunnel. Le jeton est ecrit
dans token.json (permissions 600) et n'a plus besoin d'etre refait.
"""

from __future__ import annotations

import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

BASE_DIR = Path(__file__).resolve().parent
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
PORT = 8765


def main() -> int:
    credentials_path = BASE_DIR / "credentials.json"
    token_path = BASE_DIR / "token.json"

    if not credentials_path.exists():
        print(
            "credentials.json introuvable.\n"
            "Le creer sur https://console.cloud.google.com/apis/credentials :\n"
            "  1. activer l'API Gmail sur le projet ;\n"
            "  2. ecran de consentement OAuth en mode « Externe », se declarer\n"
            "     testeur avec sa propre adresse Gmail ;\n"
            "  3. « ID client OAuth » de type « Application de bureau » ;\n"
            "  4. telecharger le JSON et le deposer ici sous le nom credentials.json.",
            file=sys.stderr,
        )
        return 1

    if token_path.exists():
        answer = input(f"{token_path.name} existe deja. Le remplacer ? [o/N] ").strip().lower()
        if answer not in {"o", "oui", "y", "yes"}:
            print("Annule.")
            return 0

    flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
    print(
        f"\nTunnel attendu : ssh -L {PORT}:localhost:{PORT} geoffrey@192.168.1.2\n"
        "Ouvrir l'URL ci-dessous dans le navigateur du PC.\n"
    )
    creds = flow.run_local_server(
        host="localhost",
        port=PORT,
        open_browser=False,
        access_type="offline",
        prompt="consent",
        authorization_prompt_message="URL a ouvrir : {url}",
        success_message="Autorisation accordee. Cette fenetre peut etre fermee.",
    )

    token_path.write_text(creds.to_json(), encoding="utf-8")
    token_path.chmod(0o600)
    print(f"\nJeton enregistre dans {token_path}")
    print("Verification : ./.venv/bin/python vrac_sync.py --dry-run")
    return 0


if __name__ == "__main__":
    sys.exit(main())
