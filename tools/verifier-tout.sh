#!/usr/bin/env bash
# verifier-tout.sh — lance tous les contrôles du dépôt avant une livraison.
# Usage (depuis la racine) :  bash tools/verifier-tout.sh
set -e
echo "▸ Audit structurel (paramètres, sources, données)…"
node tools/audit.mjs
echo
echo "▸ Contrôle des calculs (cas de référence publiés)…"
node tools/verif-calculs.mjs
echo
echo "▸ Syntaxe JavaScript…"
for f in assets/js/*.js tools/*.js tools/*.mjs; do node --check "$f"; done
echo "  ✓ tous les fichiers JS sont syntaxiquement valides"
echo
echo "▸ Validité des fichiers de données JSON…"
python3 -c "import json,glob; [json.load(open(f)) for f in glob.glob('data/**/*.json',recursive=True)]; print('  ✓ tous les JSON sont valides')"
echo
echo "Tous les contrôles sont passés."
