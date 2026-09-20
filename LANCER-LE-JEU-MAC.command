#!/bin/bash
cd "$(dirname "$0")"

# Assurer que les chemins habituels de Node sur Mac (Intel et Apple Silicon M1/M2/M3/M4) sont presents
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "==================================================="
echo "            DIT-PAULO - LANCEMENT (MAC)"
echo "==================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas encore installe sur ton Mac."
    echo "Installe-le gratuitement sur https://nodejs.org (version LTS),"
    echo "puis relance ce fichier."
    echo ""
    read -p "Appuie sur Entree pour fermer..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Premiere utilisation detectee !"
    echo "Installation automatique des composants en cours..."
    echo "(Cela prend environ 30 secondes, merci de patienter)"
    echo ""
    npm install
    echo ""
    echo "Installation terminee avec succes !"
    echo ""
fi

echo "Lancement du jeu dans ton navigateur..."
echo "(Laisse cette fenetre ouverte pendant que tu joues)"
echo ""

npm run web
