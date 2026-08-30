# Vrac Gmail → Notion

Tout mail dont l'objet commence par **`Vrac -`** devient une entrée dans la base
Notion **[Vrac à classer](https://app.notion.com/p/c3e6ee5fcd8742b3a08c70e20cb4cb5d)**
(sous *2nd brain*). Tourne en cron sur le Raspberry Pi « flex1 ».

## Principe

```
Cron horaire (minute 23)
   ↓  net-run.sh + venv Python
vrac_sync.py
   ↓  API Gmail : objet commençant par « Vrac - », sans le label « importé »
   ↓  API Notion : création d'une page dans « Vrac à classer »
   ↓  API Gmail : pose du label « Notion/Vrac importe » sur le mail
```

**L'anti-doublon, c'est le label Gmail.** Un mail déjà étiqueté est ignoré au
passage suivant. Filet secondaire : avant chaque création, le script vérifie
qu'aucune page ne porte déjà cet `ID message` — utile si le script meurt entre
la création Notion et la pose du label.

L'ordre est volontaire : **Notion d'abord, label ensuite**. En cas de crash au
milieu, on risque un doublon (rattrapé par le filet) plutôt qu'un mail perdu.

## Schéma de la base

| Propriété | Type | Contenu |
|---|---|---|
| Nom | Titre | Objet du mail, préfixe retiré |
| Statut | Sélection | `À classer` à la création, puis `En cours` / `Classé` / `Abandonné` |
| Source | Sélection | `Gmail` (auto) ou `Manuel` (saisie directe) |
| Expéditeur | Texte | `Nom <adresse>` |
| Date réception | Date | Date d'envoi du mail |
| Lien Gmail | URL | Ouvre le fil dans Gmail |
| ID message | Texte | Identifiant Gmail — garde anti-doublon |
| Créé le | Date auto | Horodatage Notion |

Le corps du mail est recopié dans le contenu de la page (texte brut de
préférence, sinon HTML détagué), tronqué à `MAX_BODY_CHARS`.

### Pièces jointes

Les **noms** des pièces jointes sont listés en bas de la page ; les fichiers
eux-mêmes restent dans Gmail, accessibles via le lien de la page. Un mail sans
texte mais avec une photo — le cas du « je me photographie un truc et je me
l'envoie » — donne donc une entrée explicite plutôt qu'une page vide.

Téléverser réellement les fichiers dans Notion est possible (API *file upload*,
en trois appels par fichier) mais n'est pas fait : ça alourdirait la base et
dupliquerait un stockage que Gmail assure déjà.

## Installation sur le Pi

```bash
ssh geoffrey@192.168.1.2
git clone <ce dépôt> ~/src/bedtime-routine-ios     # ou copie du dossier
cp -r ~/src/bedtime-routine-ios/automation/gmail-notion ~/vrac-notion
cd ~/vrac-notion
./install.sh
```

`install.sh` crée le venv, installe les dépendances, copie `.env.example` vers
`.env` et pose la ligne cron. Il est relançable sans risque.

### 1. Jeton Notion

1. Créer une intégration interne sur <https://www.notion.so/profile/integrations>
   (capacités : lire + insérer du contenu).
2. Copier le secret (`ntn_…`) dans `NOTION_TOKEN` de `~/vrac-notion/.env`.
3. **Partager la base avec l'intégration** : ouvrir « Vrac à classer » → menu
   `···` → *Connexions* → ajouter l'intégration. Sans cette étape, l'API renvoie
   `object_not_found` même avec un jeton valide.

### 2. Identifiants Gmail

1. Sur <https://console.cloud.google.com/apis/credentials>, activer l'**API Gmail**.
2. Écran de consentement OAuth en mode *Externe*, s'ajouter comme testeur avec
   sa propre adresse Gmail.
3. Créer un **ID client OAuth** de type *Application de bureau*, télécharger le
   JSON et le déposer dans `~/vrac-notion/credentials.json`.
4. Autoriser, une seule fois. Le Pi n'ayant pas de navigateur, on passe par un
   tunnel SSH depuis le PC :

   ```bash
   # sur le PC
   ssh -L 8765:localhost:8765 geoffrey@192.168.1.2
   # dans cette session SSH
   cd ~/vrac-notion && ./.venv/bin/python authorize.py
   ```

   Coller l'URL affichée dans le navigateur du PC. Le retour de Google arrive
   sur `http://localhost:8765/`, capté par le tunnel. Le jeton atterrit dans
   `token.json` (chmod 600) et se rafraîchit ensuite tout seul.

### 3. Vérification

```bash
cd ~/vrac-notion
./.venv/bin/python vrac_sync.py --dry-run   # liste sans rien écrire
./.venv/bin/python vrac_sync.py             # premier vrai passage
tail -f vrac-sync.log
```

## Réglages (`.env`)

| Variable | Défaut | Rôle |
|---|---|---|
| `NOTION_TOKEN` | — | Secret de l'intégration Notion |
| `NOTION_DATABASE_ID` | `c3e6ee5f…` | Base « Vrac à classer » |
| `GMAIL_SUBJECT_PREFIX` | `Vrac -` | Préfixe déclencheur, insensible à la casse |
| `GMAIL_PROCESSED_LABEL` | `Notion/Vrac importe` | Label anti-doublon, créé au 1er passage |
| `GMAIL_SEARCH_WINDOW_DAYS` | `30` | Fenêtre de recherche |
| `GMAIL_ARCHIVE_AFTER_IMPORT` | `false` | Sort le mail de la boîte de réception |
| `GMAIL_MAX_PER_RUN` | `25` | Garde-fou par passage |
| `MAX_BODY_CHARS` | `12000` | Longueur max du corps recopié |

`.env`, `token.json` et `credentials.json` sont dans le `.gitignore` : **aucun
secret ne part dans le dépôt.**

## Le chemin réseau : toujours `net-run.sh`

Comme pour Garmin, le cron passe par `net-run.sh` et jamais par
`mullvad-exclude` en direct. Le script sonde l'exclusion (curl vers ipify, 8 s)
et bascule dans le VPN si elle reste muette — le kill-switch `lockdown-mode`
bloque le trafic hors tunnel, et un timeout de 30 s est pire qu'un passage par
le VPN. Sortir du tunnel quand c'est possible évite que l'IP de sortie Mullvad,
partagée, déclenche les protections anti-abus de Google sur le compte.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `object_not_found` côté Notion | Base non partagée avec l'intégration (étape 1.3) |
| `Jeton Gmail absent` | `authorize.py` jamais lancé |
| `invalid_grant` au refresh | Mot de passe Google changé, ou appli OAuth restée en mode *Test* (jeton à 7 jours) → publier l'appli ou relancer `authorize.py` |
| Un mail correspondant est ignoré | Il porte déjà le label ; ou il est plus vieux que la fenêtre ; ou l'objet ne **commence** pas par le préfixe |
| Doublons dans Notion | Label retiré manuellement ET `ID message` modifié |
| Page Notion sans contenu | Mail sans corps ni pièce jointe |

Les mails que l'on s'envoie à soi-même portent le label `SENT` : ils sont bien
pris en compte, la recherche ne se limite pas à la boîte de réception.

Journal : `~/vrac-notion/vrac-sync.log`. Cron : `crontab -l`.

## Écrire un mail « vrac »

Depuis n'importe quel appareil, à soi-même :

```
Objet : Vrac - Devis clôture à relancer
Corps : le texte, les liens, ce qu'on veut.
```

Au passage suivant, l'entrée **« Devis clôture à relancer »** apparaît dans
« Vrac à classer », statut *À classer*. `Re:` et `Fwd:` devant le préfixe sont
tolérés — un transfert marche donc aussi.
