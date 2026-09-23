@echo off
chcp 65001 >nul
title Dit-Paulo - Lancement du Jeu
cd /d "%~dp0"

echo ===================================================
echo             DIT-PAULO - LANCEMENT
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 goto :node_found

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :node_found
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    goto :node_found
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    goto :node_found
)

goto :no_node

:node_found

:: Création automatique du raccourci sur le Bureau s'il n'existe pas
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $lnk = Join-Path $desktop 'Dit-Paulo.lnk'; if (-not (Test-Path $lnk)) { $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut($lnk); $s.TargetPath = '%~dp0LANCER-LE-JEU-WINDOWS.bat'; $s.WorkingDirectory = '%~dp0'; if (Test-Path '%~dp0assets\icon.ico') { $s.IconLocation = '%~dp0assets\icon.ico,0' }; $s.Description = 'Lancer Dit-Paulo'; $s.Save() }" >nul 2>nul

if not exist "node_modules\" (
    echo Première utilisation détectée !
    echo Installation automatique des composants en cours...
    echo (Cela prend environ 30 secondes, merci de patienter)
    echo.
    call npm install
    echo.
    echo Installation terminée avec succès !
    echo.
)

echo Lancement du jeu dans votre navigateur...
echo (Laissez cette fenêtre ouverte pendant que vous jouez)
echo.

npm run web
exit /b

:no_node
echo [ERREUR] Node.js n'est pas installé sur votre PC.
echo.
echo Pour faire tourner le jeu, vous devez installer Node.js (gratuit) :
echo 1. Rendez-vous sur : https://nodejs.org
echo 2. Cliquez sur le bouton "LTS" pour télécharger l'installateur
echo 3. Installez-le avec les options par défaut
echo 4. Relancez ensuite ce fichier "%~nx0"
echo.
pause
exit /b
