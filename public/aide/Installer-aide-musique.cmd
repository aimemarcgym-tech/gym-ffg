@echo off
rem Aide "Faire ces musiques" pour Windows : un seul fichier qui installe, lance et desinstalle.
rem   double-clic        : installe ce qui manque (Node.js, yt-dlp, ffmpeg), copie l'aide et la lance
rem   /lancer            : fait tourner l'aide (appele sans fenetre au demarrage de Windows et par l'appli)
rem   /desinstaller      : enleve l'aide (les programmes Node.js, yt-dlp et ffmpeg restent installes)
rem Ce fichier doit garder des fins de ligne Windows (CRLF) et rester sans accent.
setlocal EnableExtensions
set "SITE=https://gym-ffg.web.app/aide"
set "DOSSIER=%LOCALAPPDATA%\ffg-aide"
set "DEMARRAGE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FFG-aide-musique.vbs"

if /i "%~1"=="/lancer" goto lancer
if /i "%~1"=="/desinstaller" goto desinstaller

title Installer l'aide Faire ces musiques
echo.
echo  Aide "Faire ces musiques" : convertir un lien YouTube ou autre en MP3
echo  ------------------------------------------------------------------
echo  Cette installation, a faire une seule fois sur cet ordinateur :
echo    1. installe les programmes necessaires s'ils manquent : Node.js, yt-dlp, ffmpeg ;
echo    2. copie l'aide dans votre dossier personnel ;
echo    3. la lance maintenant, puis a chaque ouverture de Windows, sans fenetre.
echo.

where node >nul 2>&1 && where yt-dlp >nul 2>&1 && where ffmpeg >nul 2>&1 && goto copie

where winget >nul 2>&1
if errorlevel 1 (
  echo  Windows ne trouve pas son installeur de programmes, winget.
  echo  Ouvrez le Microsoft Store, mettez a jour "Programme d'installation d'application",
  echo  puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo  - Installation de Node.js : Windows peut demander votre autorisation...
  winget install --id OpenJS.NodeJS.LTS -e --source winget --silent --accept-source-agreements --accept-package-agreements
)
where yt-dlp >nul 2>&1
if errorlevel 1 (
  echo  - Installation de yt-dlp...
  winget install --id yt-dlp.yt-dlp -e --source winget --silent --accept-source-agreements --accept-package-agreements
)
call :chemin
where ffmpeg >nul 2>&1
if errorlevel 1 (
  echo  - Installation de ffmpeg...
  winget install --id yt-dlp.FFmpeg -e --source winget --silent --accept-source-agreements --accept-package-agreements
)
call :chemin

set "MANQUE="
where node >nul 2>&1 || set "MANQUE=Node.js"
where yt-dlp >nul 2>&1 || set "MANQUE=%MANQUE% yt-dlp"
where ffmpeg >nul 2>&1 || set "MANQUE=%MANQUE% ffmpeg"
if defined MANQUE (
  echo.
  echo  Installation incomplete, il manque : %MANQUE%
  echo  Relancez ce fichier. Si le probleme reste, redemarrez l'ordinateur puis relancez-le.
  echo.
  pause
  exit /b 1
)

:copie
echo  - Copie de l'aide...
call :arreter
if not exist "%DOSSIER%" mkdir "%DOSSIER%"
if exist "%~dp0aide-musique.mjs" (
  copy /y "%~dp0aide-musique.mjs" "%DOSSIER%\aide-musique.mjs" >nul
) else (
  curl.exe -fsSL "%SITE%/aide-musique.mjs" -o "%DOSSIER%\aide-musique.mjs"
)
if not exist "%DOSSIER%\aide-musique.mjs" (
  echo.
  echo  Impossible de telecharger l'aide : verifiez la connexion internet puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)
type "%~f0" > "%DOSSIER%\aide.cmd"

rem Lanceur sans fenetre, demarrage avec Windows et lien ffg-aide:// utilise par l'appli : pour l'utilisateur courant uniquement.
> "%DOSSIER%\lancer.vbs" echo CreateObject("WScript.Shell").Run "cmd /c """"%DOSSIER%\aide.cmd"" /lancer""", 0, False
> "%DEMARRAGE%" echo CreateObject("WScript.Shell").Run "wscript.exe ""%DOSSIER%\lancer.vbs""", 0, False
reg add "HKCU\Software\Classes\ffg-aide" /ve /d "URL:FFG Aide" /f >nul
reg add "HKCU\Software\Classes\ffg-aide" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\ffg-aide\shell\open\command" /ve /d "wscript.exe \"%DOSSIER%\lancer.vbs\"" /f >nul

echo  - Lancement de l'aide...
wscript.exe "%DOSSIER%\lancer.vbs"
set "PRETE="
for /l %%i in (1,1,10) do if not defined PRETE (
  ping -n 2 127.0.0.1 >nul
  curl.exe -s -m 3 http://127.0.0.1:47615/etat >nul 2>&1 && set "PRETE=1"
)
echo.
if defined PRETE (
  echo  Termine : l'aide est lancee et demarrera toute seule avec Windows.
  echo  Retournez sur la page "Faire ces musiques" : elle la detecte toute seule.
) else (
  echo  L'aide est installee mais ne repond pas encore.
  echo  Redemarrez l'ordinateur, puis rouvrez la page "Faire ces musiques".
  echo  Journal : %DOSSIER%\aide-musique.log
)
echo.
if /i not "%~1"=="/silencieux" pause
exit /b 0

:lancer
rem Fait tourner l'aide et la relance si elle s'arrete sur une erreur. Journal : aide-musique.log
cd /d "%~dp0"
call :chemin
where node >nul 2>&1
if errorlevel 1 (
  >> aide-musique.log echo Node.js est introuvable : relancez l'installation de l'aide.
  exit /b 1
)
for %%f in (aide-musique.log) do if exist "%%f" if %%~zf GTR 1000000 del "%%f"
:boucle
node aide-musique.mjs >> aide-musique.log 2>&1
if errorlevel 1 (
  ping -n 6 127.0.0.1 >nul
  goto boucle
)
exit /b 0

:desinstaller
title Desinstaller l'aide Faire ces musiques
call :arreter
del "%DEMARRAGE%" 2>nul
reg delete "HKCU\Software\Classes\ffg-aide" /f >nul 2>&1
echo.
echo  L'aide est enlevee. Node.js, yt-dlp et ffmpeg restent installes.
echo.
pause
rem Sur une seule ligne : ce fichier peut etre celui du dossier qu'on supprime.
cd /d "%TEMP%" & rmdir /s /q "%DOSSIER%" 2>nul & exit /b 0

:arreter
rem Arrete une aide deja lancee (boucle de relance puis programme), pour repartir sur la nouvelle copie.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*aide.cmd*/lancer*' -or $_.CommandLine -like '*aide-boucle*' -or $_.CommandLine -like '*aide-musique.mjs*' } | Where-Object { $_.Name -in 'cmd.exe','node.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
exit /b 0

:chemin
rem Relit le PATH de Windows : un programme qui vient d'etre installe n'est pas encore connu de cette fenetre.
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"`) do set "PATH=%%p"
exit /b 0
