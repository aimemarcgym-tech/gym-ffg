@echo off
title Desinstaller l'aide Faire ces musiques
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FFG-aide-musique.vbs" 2>nul
reg delete "HKCU\Software\Classes\ffg-aide" /f >nul 2>&1
echo L'aide ne demarrera plus avec Windows. Si elle est lancee en ce moment, elle s'arretera a la fermeture de la session.
pause
