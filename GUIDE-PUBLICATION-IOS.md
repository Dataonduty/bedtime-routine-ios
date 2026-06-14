# Guide de publication — Bedtime Routine sur l'App Store

Tout le projet iOS est prêt et **sa compilation est validée** sur un vrai Mac via le CI
GitHub Actions (job `build-check` vert). Ce guide liste **tes actions** : elles nécessitent
toutes un compte Apple Developer, qu'aucun outil ne peut contourner.

---

## Pré-requis incontournable : compte Apple Developer (99 €/an)

1. Inscription sur https://developer.apple.com/programs/ (99 €/an, à renouveler).
   Vérification d'identité Apple : compte 24-48 h.
2. Une fois membre, note ton **Team ID** (Apple Developer → Membership details).

⚠️ Sans ce compte, impossible de signer, d'uploader ou de publier — c'est une règle Apple,
pas une limite de notre projet.

---

## Étape 1 — Créer l'app dans App Store Connect

1. https://appstoreconnect.apple.com → Mes apps → **+** → Nouvelle app.
2. Plateforme iOS · Nom : `Bedtime Routine` · Langue principale : Anglais (US).
3. **Bundle ID** : `io.github.dataonduty.bedtimeroutine` — il faut d'abord l'enregistrer
   dans Certificates, IDs & Profiles → Identifiers → **+** → App IDs → App, puis le choisir ici.
4. SKU : `bedtime-routine` (identifiant interne libre).

---

## Étape 2 — Créer la clé API App Store Connect (pour le CI)

C'est ce qui permet au CI de signer et d'uploader **sans Mac de ta part**.

1. App Store Connect → **Users and Access → Integrations → App Store Connect API**.
2. Génère une clé avec le rôle **App Manager** (ou Admin).
3. Récupère : **Key ID**, **Issuer ID**, et télécharge le fichier **AuthKey_XXXX.p8**
   (téléchargeable une seule fois — garde-le précieusement).

---

## Étape 3 — Configurer les secrets GitHub du CI

Dans le repo `bedtime-routine-ios` → Settings → Secrets and variables → Actions → New secret :

| Secret | Valeur |
|---|---|
| `APP_STORE_CONNECT_KEY_ID` | le Key ID (ex. `2X9ABC3DEF`) |
| `APP_STORE_CONNECT_ISSUER_ID` | l'Issuer ID (UUID) |
| `APP_STORE_CONNECT_API_KEY` | le contenu du `.p8` encodé en base64 |
| `APPLE_TEAM_ID` | ton Team ID (ex. `AB12CD34EF`) |

Pour encoder le .p8 en base64 (sous Windows PowerShell) :
```
[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8"))
```
Colle la chaîne obtenue comme valeur de `APP_STORE_CONNECT_API_KEY`.

---

## Étape 4 — Lancer le build signé + envoi TestFlight

1. Repo `bedtime-routine-ios` → onglet **Actions** → workflow **iOS build** → **Run workflow**.
2. Coche l'option **release** → Run.
3. Le CI macOS archive, signe (signature automatique via la clé API) et **upload vers
   TestFlight**. L'IPA est aussi conservé en artefact téléchargeable.
4. Dans App Store Connect → TestFlight, le build apparaît après quelques minutes
   (traitement Apple). Ajoute-toi comme testeur interne pour l'installer sur ton iPhone
   via l'app **TestFlight**.

---

## Étape 5 — Remplir la fiche et soumettre

1. Tout est dans `APP-STORE-LISTING.md` (à copier-coller) : nom, sous-titre, mots-clés,
   description, catégories.
2. Captures 6.7" : `store-assets/screenshots/en-*.png` (et `fr-*` pour la localisation FR).
3. **App Privacy** : déclare **Data Not Collected** (l'app native n'exécute pas Umami —
   désactivé automatiquement car servie depuis `localhost`).
4. Classification d'âge : **4+**.
5. Politique de confidentialité : https://dataonduty.github.io/rituel-dodo/privacy.html
6. Soumets pour examen.

---

## ⚠️ Risque réel à connaître : guideline 4.2 (« minimum functionality »)

Apple rejette plus volontiers que Google les apps perçues comme un « simple site web
emballé ». Notre app embarque le contenu (pas un simple lien distant) et utilise des
capacités natives (barre d'état, splash, retours haptiques) pour appuyer son caractère
d'app — mais le risque de refus existe. En cas de rejet 4.2 :
- répondre dans Resolution Center en expliquant la valeur (outil parental hors-ligne,
  multilingue, retours haptiques, pensé pour un usage enfant au coucher) ;
- au besoin, ajouter une fonctionnalité native supplémentaire (notifications locales de
  rappel du coucher, widget, etc.) pour renforcer le dossier.

---

## Mises à jour ultérieures

L'app embarque les fichiers web (dossier `www/`). Pour publier une nouvelle version :
1. Copier les fichiers web mis à jour depuis `rituel-dodo` dans `www/` (script à venir si besoin).
2. Incrémenter `MARKETING_VERSION` (et `CURRENT_PROJECT_VERSION`) dans le projet Xcode.
3. Relancer le workflow **release**.

Note : contrairement à la TWA Android, l'app iOS ne se met PAS à jour toute seule depuis
le site — chaque mise à jour passe par un nouveau build TestFlight/App Store.
