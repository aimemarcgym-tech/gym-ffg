@echo off
title Installer l'aide Faire ces musiques
setlocal
set "VBS=%~dp0tools\lancer-aide-discret.vbs"
set "DEMARRAGE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FFG-aide-musique.vbs"

echo.
echo Cette installation (une seule fois, sans droits administrateur) :
echo   1. lance l'aide automatiquement a l'ouverture de Windows, sans fenetre ;
echo   2. permet au bouton "Demarrer l'aide" de l'appli de la lancer.
echo.

rem Demarrage automatique avec Windows.
> "%DEMARRAGE%" echo CreateObject("WScript.Shell").Run "wscript.exe ""%VBS%""", 0, False

rem Lien ffg-aide:// utilise par le bouton de l'appli (enregistre pour l'utilisateur courant uniquement).
reg add "HKCU\Software\Classes\ffg-aide" /ve /d "URL:FFG Aide" /f >nul
reg add "HKCU\Software\Classes\ffg-aide" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\ffg-aide\shell\open\command" /ve /d "wscript.exe \"%VBS%\"" /f >nul

rem Lancement immediat.
wscript.exe "%VBS%"

echo Termine : l'aide est lancee et demarrera toute seule avec Windows.
echo Pour l'enlever : Desinstaller-aide-musique.bat
echo.
if not "%~1"=="/silencieux" pause
