@echo off
rem Relance l'aide si elle s'arrete sur une erreur (code different de 0) ; journal dans aide-musique.log
cd /d "%~dp0.."
:debut
node tools\aide-musique.mjs >> tools\aide-musique.log 2>&1
if errorlevel 1 (
  timeout /t 5 /nobreak >nul
  goto debut
)
