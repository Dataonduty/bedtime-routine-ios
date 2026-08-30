#!/usr/bin/env bash
# Choisit le chemin reseau avant de lancer la commande passee en argument.
#
# Meme logique que ~/domo/garmin/net-run.sh : sur ce Pi, Mullvad tourne avec un
# kill-switch. Sortir du tunnel (mullvad-exclude) evite qu'une IP de sortie
# partagee declenche les protections anti-abus de Google, mais si le mode
# lockdown est actif le trafic hors tunnel est bloque et la commande expire.
# On sonde donc l'exclusion, et on bascule dans le VPN si elle reste muette :
# mieux vaut passer par le VPN qu'attendre un timeout.

set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <commande> [args...]" >&2
  exit 2
fi

if ! command -v mullvad-exclude >/dev/null 2>&1; then
  exec "$@"
fi

if mullvad-exclude curl -fsS --max-time 8 https://api.ipify.org >/dev/null 2>&1; then
  exec mullvad-exclude "$@"
fi

echo "net-run: exclusion Mullvad muette, passage par le VPN." >&2
exec "$@"
