#!/usr/bin/env bash
# Installe le service Gmail -> Notion sur le Pi « flex1 ».
# Idempotent : relancable sans casse.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$DIR/.venv"
CRON_MINUTE="${CRON_MINUTE:-23}"
CRON_LINE="$CRON_MINUTE * * * * $DIR/net-run.sh $VENV/bin/python $DIR/vrac_sync.py >> $DIR/vrac-sync.log 2>&1"

echo "== Environnement Python"
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$DIR/requirements.txt"
echo "   venv pret : $VENV"

echo "== Configuration"
if [ ! -f "$DIR/.env" ]; then
  cp "$DIR/.env.example" "$DIR/.env"
  chmod 600 "$DIR/.env"
  echo "   .env cree depuis .env.example — y renseigner NOTION_TOKEN avant de continuer."
else
  chmod 600 "$DIR/.env"
  echo "   .env deja present, conserve tel quel."
fi

echo "== Cron (horaire, minute $CRON_MINUTE)"
if crontab -l 2>/dev/null | grep -Fq "$DIR/vrac_sync.py"; then
  echo "   entree deja presente, inchangee."
else
  { crontab -l 2>/dev/null || true; echo "$CRON_LINE"; } | crontab -
  echo "   ajoutee : $CRON_LINE"
fi

echo
echo "Reste a faire :"
echo "  1. renseigner NOTION_TOKEN dans $DIR/.env"
echo "  2. deposer credentials.json (ID client OAuth Google) dans $DIR"
echo "  3. $VENV/bin/python $DIR/authorize.py     (une seule fois, via tunnel SSH)"
echo "  4. $VENV/bin/python $DIR/vrac_sync.py --dry-run"
