# CLAUDE.md — instructions de travail sur ce dépôt

Ce dépôt produit un site public de formation à la finance et à la fiscalité françaises.
Lis ce fichier en entier avant toute modification.

---

## 1. Règle absolue : la rigueur fiscale prime sur tout

L'exactitude passe avant la vitesse, la longueur et l'élégance. Un seul chiffre faux ruine
la confiance dans l'ensemble du site. Les règles suivantes s'appliquent sans exception.

**1.1 Aucun paramètre chiffré ou daté n'est écrit de mémoire.** Barèmes, taux, seuils,
abattements, plafonds, délais, dates d'entrée en vigueur, numéros d'article : chacun doit
être vérifié par recherche sur une source faisant autorité (Légifrance, BOFiP,
impots.gouv.fr, service-public.fr, economie.gouv.fr) **avant** d'être écrit, jamais après.
Si tu ne peux pas vérifier, tu n'écris pas la valeur : tu crées l'entrée avec
`valeur: null` et `statut: "a_verifier"`.

**1.2 Recouper au moins deux sources concordantes**, dont une officielle quand elle existe.
Distingue toujours l'année de perception des revenus de l'année d'imposition, et le seuil
de déclenchement de la valeur utilisée dans la formule. Exemple concret présent dans ce
dépôt : la décote a un seuil d'application de 1 982 € et un forfait de formule de 897 € —
ce sont deux nombres différents qui se confondent facilement.

**1.3 Tout barème par tranches est copié depuis la source ligne par ligne, puis relu tranche
par tranche.** Ne reconstitue jamais un barème de tête. Un décalage d'une tranche est
inacceptable.

**1.4 Chaque exemple chiffré est recalculé à la main, étape par étape.** Quand un paramètre
alimente plusieurs endroits, liste d'abord tous les points d'emploi, puis vérifie-les un
par un.

**1.5 Avant toute livraison, exécuter la passe d'audit** (voir § 5). Ne livre pas tant que
la liste des chiffres n'est pas entièrement cochée contre sa source.

**1.6 Distinguer le certain de l'incertain.** Chaque paramètre porte sa base légale et sa
date de valeur. Signale la doctrine BOFiP encore en attente, les dispositifs temporaires
avec leur date de fin, et les points où les sources divergent — sans jamais lisser un doute
en fausse certitude.

**1.7 Être honnête sur les limites.** Si une vérification complète n'a pas été faite, dis-le.
Ne présente jamais un travail comme « parfait » ou « définitif » sans l'avoir contrôlé ligne
par ligne.

**1.8 En cas de doute, arrête-toi et demande**, ou marque clairement l'incertitude. Ne comble
jamais un trou par une valeur plausible.

---

## 2. Le fichier central : `assets/js/params.js`

C'est la colonne vertébrale du projet. **Aucun chiffre fiscal ne doit apparaître ailleurs**
— ni dans les simulateurs, ni dans les pages HTML, ni en dur dans le JavaScript.

Chaque entrée respecte ce gabarit :

```js
cle_du_parametre: {
  libelle:   "Intitulé lisible affiché sur le site",
  valeur:    …,            // nombre, objet, ou tableau de tranches — null si non vérifié
  base:      "CGI art. X · LOI n° … du … (art. …)",
  doctrine:  "BOI-…-…" ,   // null si le BOFiP n'a pas encore intégré la mesure
  source:    "https://…",  // URL réellement consultée
  verifieLe: "AAAA-MM-JJ",
  statut:    "confirme" | "divergence" | "a_verifier",
  note:      "Réserve, limite d'application, divergence de sources, cas exclus"
}
```

- `statut: "a_verifier"` impose `valeur: null`. La fonction `exiger()` lève alors une erreur :
  aucun calcul ne peut utiliser un paramètre non vérifié. **Ne contourne jamais ce garde-fou.**
- `statut: "divergence"` sert quand des sources sérieuses se contredisent : la valeur retenue
  est celle qui s'appuie sur le texte légal, et la `note` décrit la divergence.
- La page `parametres.html` publie ce registre tel quel. Tout ce que tu écris ici est visible.

**Mise à jour annuelle** (loi de finances, LFSS) : le travail consiste à rouvrir chaque
entrée, revérifier la valeur à la source, et actualiser `verifieLe`. Mets aussi à jour
`MILLESIME` en tête de fichier. C'est le seul fichier à toucher pour un changement de
millésime — sauf si le cours cite des chiffres dans son texte (voir § 4).

---

## 3. Architecture

```
index.html                    accueil : une seule fenêtre, sans défilement, pyramide 3D
cours.html  qcm.html  outils.html  parametres.html  mentions-legales.html
assets/css/app.css            feuille de style unique
assets/js/params.js           registre des paramètres fiscaux  ← le cœur
assets/js/calculs.js          moteur de calcul pur, sans DOM, testable en Node
assets/js/ui.js               en-tête, pied de page, formats, cartouches de source
assets/js/store.js            progression locale (localStorage)
assets/js/pyramide.js         objet 3D de l'accueil (canvas, sans dépendance)
assets/js/cours.js  qcm.js  outils.js  parametres.js     un script par page
data/cours/index.json + chapitres/*.html     33 chapitres + 14 sections
data/qcm/index.json + <theme>.json           1 000 questions, 17 thèmes
pdf/                          39 documents générés (33 chapitres, 5 parties, livre complet)
tools/verifier-tout.sh        lance tous les contrôles d'un coup
tools/audit.mjs               cohérence paramètres, données, références, classes CSS
tools/build-pdf.py            (re)génère les PDF depuis les fragments de cours
tools/verif-calculs.mjs       contrôle des calculs contre des cas de référence
tools/biais-longueur.mjs      la bonne réponse est-elle devinable à sa longueur ?
tools/extract-qcm.js          extraction depuis l'ancien fichier HTML monolithique
tools/build-cours.py          conversion du livre Word en fragments HTML
```

Contraintes techniques volontaires, à respecter :

- **Aucune étape de build, aucun framework, aucune dépendance npm.** HTML + CSS + modules ES
  natifs. Le site se déploie en copiant les fichiers.
- **Aucun serveur, aucune base de données, aucun compte.** La progression vit dans
  `localStorage`. Ne propose pas d'authentification.
- Les modules ES et `fetch` imposent un serveur HTTP pour le développement local :
  `python3 -m http.server 8000` puis `http://localhost:8000`. Ouvrir les fichiers en
  `file://` ne fonctionnera pas.
- **Un seul système de style.** Toutes les couleurs, familles de caractères et arrondis sont
  des variables CSS déclarées dans `:root` en tête de `app.css`. Ne jamais écrire une couleur
  en dur dans le JavaScript ou le HTML : changer la direction visuelle doit rester une
  modification de ces variables. Les trois couleurs des branches (cours indigo, QCM menthe,
  simulateurs ambre) sont aussi portées par `BRANCHES` dans `pyramide.js` — les garder
  cohérentes avec le CSS.
- Un fichier par sujet. Ne refusionne pas le QCM en monolithe : le découpage par thème existe
  pour que l'ajout de questions ne touche qu'un petit fichier.

---

## 4. Ajouter du contenu

**Des questions de QCM** — éditer `data/qcm/<theme>.json`. Format :

```json
{ "id": "ir-098", "q": "Énoncé", "o": ["A","B","C","D"], "c": 1, "e": "Explication" }
```

`c` est l'index de la bonne réponse, ou un tableau d'index pour une question à réponses
multiples. Les identifiants doivent rester uniques et suivre le motif `<theme>-<numéro>`.
Après ajout : mettre à jour `total` et le `count` du thème dans `data/qcm/index.json`, puis
lancer le contrôle du § 5.

**La bonne réponse ne doit pas être identifiable à sa longueur.** C'est le défaut de
conception le plus répandu dans le corpus actuel, et le plus coûteux : il permet de
répondre juste sans aucune connaissance fiscale. Un audit a montré que, sur les questions
existantes à réponse unique, la proposition la plus longue est la bonne dans environ 80 %
des cas — et dans 97 % des cas où elle est nettement plus longue que les autres.

Toute nouvelle question doit donc porter des propositions de **longueurs comparables**,
l'écart entre la plus courte et la plus longue restant modéré. Repère chiffré : la bonne
réponse ne doit pas dépasser de plus de 40 % la deuxième proposition la plus longue. Le
piège vient presque toujours des réserves — la bonne réponse est complétée d'une condition
(« … sauf si le bien est détenu depuis plus de vingt-deux ans ») que les distracteurs ne
portent pas. Écris alors les distracteurs avec une précision de même poids, ou déplace la
réserve dans l'énoncé.

```bash
node tools/biais-longueur.mjs            # taux sur tout le corpus + questions au-delà du seuil
node tools/biais-longueur.mjs --max 20   # limiter la liste
```

L'outil mesure ce taux et liste les questions où la bonne réponse dépasse de plus de 40 %
la deuxième plus longue. Le lancer après tout ajout de questions, et vérifier que les
nouvelles n'y figurent pas. Il n'est pas dans `verifier-tout.sh` et ne fait échouer aucun
contrôle : le corpus existant dépasse massivement le seuil.

**Ne corrige pas les questions existantes pour faire baisser ce taux.** La reprise du
corpus est un chantier distinct, à décider séparément.

Trois formats de questions sont attendus et doivent rester représentés dans chaque thème :
les **mini-cas** chiffrés qui exigent un calcul, les **cas pratiques** (« Cas : … ») qui
posent une situation de décision réelle, et les **définitions** de chaque terme important.
Le format « cas pratique » est le plus utile : c'est celui qui prépare aux vraies
conversations avec un conseiller. Privilégie des lots réduits et rigoureusement vérifiés
plutôt que de gros ajouts approximatifs ; quand un thème est saturé, cherche un angle
réellement nouveau plutôt que de reformuler l'existant.

**Un chapitre de cours** — ajouter le fragment dans `data/cours/chapitres/` et l'entrée
correspondante dans `data/cours/index.json`. Le fragment ne contient que le corps
(`<p>`, `<h3>`, `<ul>`, `<aside class="encadre">`, `<div class="tbl"><table>`) — ni `<html>`
ni titre de chapitre, qui sont injectés par `cours.js`.

**Attention** : le texte du cours contient des chiffres fiscaux en dur, hérités du livre
d'origine. Ils ne sont pas branchés sur `params.js`. À chaque changement de millésime, il
faut donc aussi relire les chapitres concernés — au minimum le chapitre 8 (fiscalité des
particuliers), 10 (retraite), 17 (immobilier) et 32 (patrimoine et transmission).
Améliorer ce point est une évolution souhaitable : marquer ces valeurs dans le HTML pour
qu'elles soient injectées depuis `params.js` au chargement.

**Un simulateur** — la fonction de calcul va dans `calculs.js` (pure, sans DOM, lisant ses
paramètres via `exiger()`), l'interface dans `outils.js`. Tout résultat doit être décomposé
étape par étape, porter son cartouche de sources (`sourceTag(...)`) et énoncer explicitement
ce qu'il ne calcule pas.

---

## 5. Contrôles à passer avant chaque livraison

`bash tools/verifier-tout.sh` enchaîne l'ensemble. Ce que l'audit vérifie, au-delà des
paramètres fiscaux : que tout fichier référencé par une page existe, que tout module importé
existe et exporte bien ce qui lui est demandé, et que **toute classe CSS employée par le code
est définie dans `app.css`**. Ce dernier contrôle existe parce que des changements de
direction visuelle successifs avaient laissé du balisage orphelin, invisible à l'œil nu mais
sans style. Ne pas le contourner : si l'audit signale une classe manquante, c'est soit la
classe à ajouter, soit le balisage à nettoyer.

```bash
node tools/verif-calculs.mjs     # les calculs contre des cas de référence publiés
node --check assets/js/*.js      # syntaxe
python3 -c "import json,glob; [json.load(open(f)) for f in glob.glob('data/**/*.json', recursive=True)]"
```

Puis, manuellement :

1. Lister tous les chiffres nouveaux ou modifiés et cocher chacun contre sa source.
2. Vérifier que la page `parametres.html` n'affiche aucune valeur sans `verifieLe`.
3. Vérifier que les entrées `a_verifier` ont bien `valeur: null`.
4. Relire les `note` : une réserve périmée est aussi trompeuse qu'un chiffre faux.

Quand tu ajoutes un cas de référence à `verif-calculs.mjs`, indique en commentaire la source
publiée dont provient le résultat attendu.

---

## 6. Déploiement

Le site est publié sur Vercel depuis GitHub : **aucun build**, framework « Other », commande
de build et répertoire de sortie vides. `vercel.json` fixe les en-têtes de cache et de
sécurité ; `.vercelignore` écarte du site publié ce qui n'a pas à y être (`_sources/`,
`tools/`, la documentation). `cleanUrls` est volontairement à `false` : tous les liens
internes portent l'extension `.html`, et l'activer provoquerait une redirection à chaque
navigation ainsi qu'un décalage avec les clés de cache du service worker.

Après toute modification de la liste des fichiers du socle, penser à incrémenter `VERSION`
dans `sw.js`, sinon les navigateurs continueront de servir l'ancienne version en cache.

---

## 7. Ton et écriture

- Français, vouvoiement, phrases courtes, pas de jargon marketing.
- Le registre est celui d'un manuel, pas d'un site de conseil : on explique, on ne vend pas.
- Ne jamais formuler de recommandation personnalisée ni suggérer une décision
  d'investissement. Le site est pédagogique ; la limite est posée dans les mentions légales
  et doit être tenue dans chaque page.
- Les avertissements de limite (« ce calcul ne fait pas… ») font partie du produit : ne les
  raccourcis pas pour gagner de la place.

---

## 8. Pistes non engagées (idées, pas des décisions)

Ces évolutions ont été évoquées mais ne sont pas arbitrées. Ne rien mettre en chantier
sans une demande explicite. Elles sont notées ici uniquement pour que le contexte soit prêt
le jour où l'une d'elles est décidée.

**Comptes de connexion + historique individuel.** Aujourd'hui le site n'a aucun serveur :
toute la progression vit dans le navigateur via `store.js` (localStorage). L'idée serait de
permettre à chaque personne de retrouver son historique de QCM et de simulateurs sur
plusieurs appareils. Points à garder en tête si ce chantier est lancé :

- Cette évolution a été anticipée dans l'architecture : `store.js` est le seul point de
  contact avec les données de progression. Le basculer d'un stockage local vers un service
  distant ne doit pas obliger à toucher le reste du site. Conserver cette isolation.
- Voie recommandée : un service géré type **Supabase** (authentification + base de données
  clé en main), plutôt qu'un serveur et une gestion de mots de passe codés à la main. Choisir
  une région d'hébergement dans l'UE.
- Dès qu'un compte est stocké, le site détient des données personnelles : politique de
  confidentialité et conformité RGPD deviennent obligatoires (registre, base UE, droit à
  l'effacement). Mettre à jour `mentions-legales.html` en conséquence. Ce volet n'est pas
  technique et ne disparaît pas parce que l'outil est simple.
- Les PDF sont déjà librement téléchargeables et n'ont pas besoin de compte. Le compte
  n'apporte que l'historique personnel synchronisé — ne pas verrouiller le contenu derrière
  une connexion sans raison.
- Ordre conseillé : ne lancer ce chantier que si l'usage réel le justifie. Un site utilisé
  sans comptes vaut mieux qu'un projet de comptes qui retarde tout.

**Version « application de store ».** Le site est déjà une PWA installable (manifeste, icône,
mode hors-ligne en place) : « Ajouter à l'écran d'accueil » suffit à la plupart des besoins.
Un empaquetage pour l'App Store / Play Store (via Capacitor ou équivalent) reste possible à
partir du même code, mais implique comptes développeurs payants et validation Apple. À ne
considérer que si un besoin précis apparaît que la PWA ne couvre pas. Le choix de
l'hébergeur n'a aucune incidence sur ce point.
