@echo off
setlocal enabledelayedexpansion
title Dit-Paulo - Lancement du Jeu
cd /d "%~dp0"

echo ===================================================
echo             DIT-PAULO - LANCEMENT
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;!PATH!"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;!PATH!"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'a pas ete detecte sur votre PC.
    echo.
    echo Pour jouer, installez gratuitement Node.js :
    echo 1. Rendez-vous sur https://nodejs.org
    echo 2. Telechargez la version LTS
    echo 3. Installez-le avec les options par defaut
    echo 4. Relancez ensuite ce fichier
    echo.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop');$l=Join-Path $d 'Dit-Paulo.lnk';if(-not(Test-Path $l)){$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut($l);$s.TargetPath='%~dp0LANCER-LE-JEU-WINDOWS.bat';$s.WorkingDirectory='%~dp0';if(Test-Path '%~dp0assets\icon.ico'){$s.IconLocation='%~dp0assets\icon.ico,0'};$s.Save()}" >nul 2>nul

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

call npm run web
