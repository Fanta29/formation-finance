# Mise en ligne — guide pas à pas

Ce guide part de zéro et suppose seulement un compte GitHub et un compte Vercel
(le même que pour l'appli planning). Aucune installation sur votre Mac n'est requise :
tout se fait dans le navigateur. Comptez une vingtaine de minutes la première fois.

---

## Étape 1 — Déposer le code sur GitHub

1. Aller sur **github.com**, cliquer sur le **+** en haut à droite → **New repository**.
2. Nom du dépôt : `formation-finance` (par exemple). Le laisser en **Private** pour
   commencer — vous pourrez le passer en public plus tard.
3. Ne cocher **aucune** case (pas de README, pas de .gitignore : ils sont déjà dans le zip).
   Cliquer **Create repository**.
4. Sur la page qui suit, cliquer sur le lien **« uploading an existing file »**
   (au milieu du texte).
5. **Glisser-déposer tout le contenu du dossier** (pas le dossier lui-même : son contenu —
   `index.html`, les dossiers `assets`, `data`, `pdf`, `tools`, etc.). GitHub accepte le
   glisser-déposer de dossiers entiers.
6. En bas, cliquer **Commit changes**.

> Le dossier `_sources/` contient le fichier QCM d'origine, conservé pour archive.
> Le fichier `.vercelignore` l'exclut du site publié, ainsi que `tools/` et les fichiers
> de documentation : ils restent dans le dépôt mais ne sont pas servis en ligne.

---

## Étape 2 — Publier avec Vercel

1. Aller sur **vercel.com**, se connecter, cliquer **Add New… → Project**.
2. **Import** le dépôt `formation-finance` (autoriser Vercel à accéder à GitHub si demandé).
3. Écran de configuration — **le point important** :
   - **Framework Preset** : choisir **Other** (surtout pas Next.js ni un autre framework).
   - **Build Command** : **laisser vide**.
   - **Output Directory** : **laisser vide** (la racine est utilisée).
   - **Install Command** : **laisser vide**.
4. Cliquer **Deploy**. Après une minute, le site est en ligne à une adresse en
   `…vercel.app`. C'est votre site.

À partir de là, **chaque modification poussée sur GitHub redéploie automatiquement**, et
chaque proposition de modification (pull request) génère sa propre adresse de prévisualisation.

---

## Étape 3 — L'installer comme application sur le téléphone

1. Ouvrir l'adresse `…vercel.app` dans Safari (iPhone) ou Chrome (Android).
2. Menu de partage → **Ajouter à l'écran d'accueil**.
3. Le site s'ouvre désormais en plein écran, avec son icône, et fonctionne hors ligne.

Aucun store, aucune installation classique : c'est déjà une application (PWA).

---

## Étape 4 — Brancher Claude Code (pour les modifications futures)

Une fois le dépôt sur GitHub, connecter Claude Code au dépôt. À partir de là, les
modifications se demandent en langage courant : Claude Code lit le dépôt, écrit les
changements, les pousse sur une branche et ouvre une pull request que vous validez d'un clic.
Plus aucun copier-coller.

Le fichier **`CLAUDE.md`** à la racine est lu automatiquement par Claude Code : il y trouve
le protocole de rigueur fiscale, le rôle du fichier central de paramètres, et les contrôles
à lancer avant chaque livraison.

**Répartition des rôles conseillée :**
- *Claude Code* → structure, styles, simulateurs, déploiement, corrections visuelles.
- *L'atelier de contenu (le fil de conversation habituel)* → recherche des sources fiscales,
  vérification et datation des paramètres, rédaction des questions et des chapitres. C'est là
  que la rigueur se joue.

---

## Un domaine personnalisé (optionnel)

Dans Vercel → onglet **Domains**, on peut brancher un nom de domaine acheté ailleurs
(une dizaine d'euros par an pour un `.fr`). Non nécessaire pour démarrer.

---

## Avant d'ouvrir le site au public — rappels

- **Mentions légales** : `mentions-legales.html` est un gabarit à compléter (éditeur,
  hébergeur, licence) et à faire relire.
- **Réserves fiscales connues** : voir `README.md` — taxe sur les plus-values élevées non
  calculée, 10 paramètres encore « à vérifier », doctrine BOFiP en attente sur la CSG.
- Rien de tout cela n'empêche une mise en ligne privée ou un partage à quelques proches dès
  maintenant.
