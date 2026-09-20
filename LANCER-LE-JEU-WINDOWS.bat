@echo off
title Dit-Paulo - Lancement du Jeu
cd /d "%~dp0"

echo ===================================================
echo             DIT-PAULO - LANCEMENT
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe sur votre PC.
    echo Veuillez installer Node.js gratuitement sur https://nodejs.org (version LTS)
    echo puis relancer ce fichier.
    echo.
    pause
    exit /b
)

if not exist "node_modules\" (
    echo Premiere utilisation detectee !
    echo Installation automatique des composants en cours...
    echo (Cela prend environ 30 secondes, merci de patienter)
    echo.
    call npm install
    echo.
    echo Installation terminee avec succes !
    echo.
)

echo Lancement du jeu dans votre navigateur...
echo (Laissez cette fenetre ouverte pendant que vous jouez)
echo.

npm run web
