# Sources d'origine (non publiées)

Ce dossier conserve les fichiers de départ à partir desquels le site a été généré.
Il n'est PAS servi en ligne et n'est utile que pour régénérer le contenu.

- `fiscalite-qcm.html` — ancien QCM monolithique. Les 1 000 questions en ont été
  extraites vers `data/qcm/*.json` par `tools/extract-qcm.js`. Ne plus éditer ce
  fichier : les questions vivent désormais dans les JSON par thème.

Le texte du livre (extrait des .docx d'origine) a été converti en fragments HTML
dans `data/cours/chapitres/` par `tools/build-cours.py`.
