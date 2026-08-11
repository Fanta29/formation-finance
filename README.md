# Formation Finance &amp; Fiscalité

Site public et gratuit de formation à la finance et à la fiscalité françaises :
un cours de 33 chapitres, 1 000 questions corrigées et trois simulateurs.

Particularité du projet : **chaque chiffre fiscal affiché porte sa base légale, sa source et
sa date de vérification**, et l'ensemble est publié sur une page de registre consultable.
Ce qui n'a pas été vérifié n'est pas affiché.

---

## Contenu

| Section | Volume |
|---|---|
| Cours | 33 chapitres + 14 sections (avant-propos, introductions et synthèses), ~35 000 mots |
| QCM | 1 000 questions sur 17 thèmes, dont 126 à réponses multiples |
| Simulateurs | Impôt sur le revenu · Dividendes (PFU ou barème) · Plus-value immobilière |
| Registre | 29 paramètres fiscaux datés et sourcés |
| PDF | 33 chapitres + 5 parties + le livre complet (107 pages), générés depuis les mêmes sources |

---

## Technique

Site statique : HTML, CSS et modules ES natifs. **Aucune dépendance, aucune étape de build,
aucun serveur, aucune base de données.** La progression de lecture et les réponses aux
questions restent dans le navigateur (`localStorage`) : pas de compte, pas de cookie de
suivi, pas de bandeau à afficher.

Le site est installable comme application (PWA) sur téléphone et fonctionne hors ligne une
fois consulté.

### Développement local

Les modules ES et `fetch` exigent un serveur HTTP. Ouvrir les fichiers en `file://`
ne fonctionne pas.

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

### Contrôles avant publication

```bash
node tools/audit.mjs                               # cohérence des paramètres et des données
node tools/verif-calculs.mjs                       # calculs vs cas de référence publiés
node --check assets/js/*.js                        # syntaxe
python3 -c "import json,glob;[json.load(open(f)) for f in glob.glob('data/**/*.json',recursive=True)]"
```

---

## Déploiement (sans rien installer)

### Cloudflare Pages ou Netlify, via GitHub

1. Créer un dépôt sur github.com et y déposer le contenu de ce dossier
   (bouton « Add file » → « Upload files », ou glisser-déposer du dossier entier).
2. Sur [Cloudflare Pages](https://pages.cloudflare.com) ou [Netlify](https://netlify.com) :
   connecter le dépôt.
3. Réglages de build : **commande de build vide**, **répertoire de publication : `/`**
   (racine). Il n'y a rien à compiler.
4. Chaque modification poussée sur GitHub redéploie le site automatiquement.

### Sans dépôt Git

Glisser-déposer le dossier sur [Netlify Drop](https://app.netlify.com/drop). Le site est en
ligne immédiatement, mais chaque mise à jour impose de redéposer le dossier entier.

### Nom de domaine

Optionnel. Un domaine en `.fr` coûte une dizaine d'euros par an et se raccorde depuis
l'interface de l'hébergeur.

---

## Mise à jour annuelle de la fiscalité

Après chaque loi de finances et loi de financement de la sécurité sociale :

1. Rouvrir `assets/js/params.js`, revérifier **chaque** entrée à la source, actualiser
   `valeur`, `base`, `source`, `verifieLe` et `statut`.
2. Mettre à jour le bloc `MILLESIME` en tête du fichier.
3. Régénérer les PDF : `python3 tools/build-pdf.py`
4. Relire les chapitres du cours qui citent des chiffres en dur — au minimum les
   chapitres 8, 10, 17 et 32 (ces valeurs ne sont pas encore branchées sur le registre).
5. Relire les questions du QCM des thèmes touchés.
6. Relancer les contrôles ci-dessus.

Le protocole complet de vérification figure dans `CLAUDE.md`.

---

## Réserves connues

- La taxe sur les plus-values élevées (CGI art. 1609 nonies G) n'est pas calculée : son
  barème n'a pas été relu tranche par tranche. Le simulateur le signale au-delà de
  50 000 € de plus-value nette.
- Onze paramètres (succession, assurance-vie, PEA, IFI, micro-foncier, micro-BIC,
  apport-cession…) sont déclarés « à vérifier » et n'entrent dans aucun calcul.
- Au moment de la rédaction, la doctrine BOFiP n'avait pas encore intégré la hausse de CSG
  issue de la LFSS 2026 : le site s'appuie sur le texte légal et l'indique.
- Les mentions légales sont un gabarit à compléter et à faire relire.
- Les polices sont chargées depuis Google Fonts. Les héberger localement supprimerait cette
  dépendance et la transmission d'adresses IP à Google.

## Licence

À définir avant publication (voir `mentions-legales.html`).
