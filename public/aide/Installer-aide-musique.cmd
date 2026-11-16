@echo off
rem Aide "Faire ces musiques" pour Windows : un seul fichier qui installe, lance et desinstalle.
rem   double-clic        : installe SANS fenetre noire ce qui manque (Node.js, yt-dlp, ffmpeg), copie l'aide et la lance ;
rem                        une seule fenetre d'avancement (carres bleus + pourcentage) reste affichee du debut a la fin ;
rem                        le detail est dans installation.log
rem   /visible           : meme installation avec la fenetre noire (pour comprendre un probleme)
rem   /lancer            : fait tourner l'aide (appele sans fenetre au demarrage de Windows et par l'appli)
rem   /desinstaller      : enleve l'aide (les programmes Node.js, yt-dlp et ffmpeg restent installes)
rem Ce fichier doit garder des fins de ligne Windows (CRLF) et rester sans accent. Dans les messages de la fenetre :
rem "#e" donne e accent aigu, "#a" a accent grave, "#f" e accent circonflexe, "#r" e accent grave, "#c" c cedille
rem (remplaces par PowerShell) et "|" donne un retour a la ligne.
rem La fin du fichier (apres le dernier "exit") est du PowerShell : la fenetre d'avancement. cmd ne la lit jamais.
rem L'avancement est donne par etapes : "call :etat COURS 5 35" = l'etape commence a 5 % et avance doucement jusqu'a 35 %.
setlocal EnableExtensions
set "SITE=https://gym-ffg.web.app/aide"
set "DOSSIER=%LOCALAPPDATA%\ffg-aide"
set "DEMARRAGE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FFG-aide-musique.vbs"
set "FFG_CMD=%~f0"
set "FFG_ETAT=%LOCALAPPDATA%\ffg-aide\etat.txt"
set "MODE=visible"

if /i "%~1"=="/lancer" goto lancer
if /i "%~1"=="/desinstaller" goto desinstaller
if /i "%~1"=="/visible" goto visible
if /i "%~1"=="/cache" goto cache

rem Double-clic : on se relance sans fenetre noire (cette fenetre-ci se ferme tout de suite).
> "%TEMP%\ffg-aide-cache.vbs" echo CreateObject("WScript.Shell").Run "cmd /c """"%~f0"" /cache""", 0, False
wscript.exe "%TEMP%\ffg-aide-cache.vbs"
exit /b 0

:visible
set "MODE=visible"
call :principal
exit /b %errorlevel%

:cache
set "MODE=cache"
del "%TEMP%\ffg-aide-cache.vbs" >nul 2>&1
if not exist "%DOSSIER%" mkdir "%DOSSIER%"
> "%DOSSIER%\installation.log" echo Installation de l'aide - %DATE% %TIME%
del "%FFG_ETAT%" >nul 2>&1
set "FFG_MSG=Pr#eparation de l'installation...|Cela prend quelques minutes : ne fermez pas cette fen#ftre."
call :etat COURS 0 4
rem Fenetre d'avancement : le PowerShell situe a la fin de ce fichier, lu et lance ici.
start "" /b powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText($env:FFG_CMD); . ([scriptblock]::Create($t.Substring($t.IndexOf('#PS'+'-DEBUT'))))"
call :principal >> "%DOSSIER%\installation.log" 2>&1
exit /b 0

:etat
rem Ecrit l'etat lu par la fenetre : %1 = COURS, FIN ou ERREUR, %2 et %3 = pourcentage de debut et de fin d'etape, puis FFG_MSG.
if /i not "%MODE%"=="cache" exit /b 0
set "FFG_ET=%~1:%~2:%~3"
<nul set /p "=%FFG_ET%:%FFG_MSG%" > "%FFG_ETAT%"
exit /b 0

:pause
if /i "%MODE%"=="visible" pause
exit /b 0

:installer
rem %1 = nom affiche, %2 = identifiant winget, %3 et %4 = pourcentage de debut et de fin, %5 = remarque facultative
echo  - Installation de %~1...
set "FFG_MSG=Installation de %~1...|Cela prend quelques minutes : ne fermez pas cette fen#ftre.|%~5"
call :etat COURS %~3 %~4
winget install --id %~2 -e --source winget --silent --accept-source-agreements --accept-package-agreements
call :chemin
exit /b 0

:principal
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
if errorlevel 1 goto sanswinget

where node >nul 2>&1
if errorlevel 1 call :installer Node.js OpenJS.NodeJS.LTS 5 35 "Windows peut demander votre autorisation : r#epondez Oui."
where yt-dlp >nul 2>&1
if errorlevel 1 call :installer yt-dlp yt-dlp.yt-dlp 35 50
where ffmpeg >nul 2>&1
if errorlevel 1 call :installer ffmpeg yt-dlp.FFmpeg 50 85

set "MANQUE="
where node >nul 2>&1 || set "MANQUE=Node.js"
where yt-dlp >nul 2>&1 || set "MANQUE=%MANQUE% yt-dlp"
where ffmpeg >nul 2>&1 || set "MANQUE=%MANQUE% ffmpeg"
if defined MANQUE goto incomplet

:copie
echo  - Copie de l'aide...
set "FFG_MSG=Installation de l'aide...|Copie des fichiers de l'aide."
call :etat COURS 85 90
call :arreter
if not exist "%DOSSIER%" mkdir "%DOSSIER%"
if exist "%~dp0aide-musique.mjs" (
  copy /y "%~dp0aide-musique.mjs" "%DOSSIER%\aide-musique.mjs" >nul
) else (
  curl.exe -fsSL "%SITE%/aide-musique.mjs" -o "%DOSSIER%\aide-musique.mjs"
)
if not exist "%DOSSIER%\aide-musique.mjs" goto sansaide
type "%~f0" > "%DOSSIER%\aide.cmd"

rem Lanceur sans fenetre, demarrage avec Windows et lien ffg-aide:// utilise par l'appli : pour l'utilisateur courant uniquement.
> "%DOSSIER%\lancer.vbs" echo CreateObject("WScript.Shell").Run "cmd /c """"%DOSSIER%\aide.cmd"" /lancer""", 0, False
> "%DEMARRAGE%" echo CreateObject("WScript.Shell").Run "wscript.exe ""%DOSSIER%\lancer.vbs""", 0, False
reg add "HKCU\Software\Classes\ffg-aide" /ve /d "URL:FFG Aide" /f >nul
reg add "HKCU\Software\Classes\ffg-aide" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\ffg-aide\shell\open\command" /ve /d "wscript.exe \"%DOSSIER%\lancer.vbs\"" /f >nul

echo  - Lancement de l'aide...
set "FFG_MSG=Installation de l'aide...|D#emarrage de l'aide."
call :etat COURS 90 98
wscript.exe "%DOSSIER%\lancer.vbs"
set "PRETE="
for /l %%i in (1,1,10) do if not defined PRETE (
  ping -n 2 127.0.0.1 >nul
  curl.exe -s -m 3 http://127.0.0.1:47615/etat >nul 2>&1 && set "PRETE=1"
)
echo.
if not defined PRETE goto muette
echo  Termine : l'aide est lancee et demarrera toute seule avec Windows.
echo  Retournez sur la page "Faire ces musiques" : elle la detecte toute seule.
set "FFG_MSG=L'aide est install#ee.|Elle se lancera toute seule avec Windows.|Vous pouvez revenir sur la page Faire ces musiques : elle d#etecte l'aide toute seule."
call :etat FIN 100 100
call :pause
exit /b 0

:muette
echo  L'aide est installee mais ne repond pas encore.
echo  Redemarrez l'ordinateur, puis rouvrez la page "Faire ces musiques".
echo  Journal : %DOSSIER%\installation.log
set "FFG_MSG=L'aide est install#ee mais ne r#epond pas encore.|Red#emarrez l'ordinateur, puis rouvrez la page Faire ces musiques.|Journal : %DOSSIER%\installation.log"
call :etat ERREUR 0 0
call :pause
exit /b 2

:incomplet
echo.
echo  Installation incomplete, il manque : %MANQUE%
echo  Relancez ce fichier. Si le probleme reste, redemarrez l'ordinateur puis relancez-le.
set "FFG_MSG=L'installation n'a pas pu se terminer : il manque %MANQUE%.|Relancez Installer-aide-musique.cmd. Si le probl#reme reste, red#emarrez l'ordinateur puis relancez-le.|Journal : %DOSSIER%\installation.log"
call :etat ERREUR 0 0
call :pause
exit /b 1

:sanswinget
echo.
echo  Windows ne trouve pas son installeur de programmes, winget.
echo  Ouvrez le Microsoft Store, mettez a jour "Programme d'installation d'application",
echo  puis relancez ce fichier.
set "FFG_MSG=Windows ne trouve pas son installeur de programmes (winget).|Ouvrez le Microsoft Store, mettez #a jour Programme d'installation d'application, puis relancez ce fichier."
call :etat ERREUR 0 0
call :pause
exit /b 1

:sansaide
echo.
echo  Impossible de telecharger l'aide : verifiez la connexion internet puis relancez ce fichier.
set "FFG_MSG=Impossible de t#el#echarger l'aide : v#erifiez la connexion internet puis relancez Installer-aide-musique.cmd."
call :etat ERREUR 0 0
call :pause
exit /b 3

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

#PS-DEBUT
# Fenetre d'avancement de l'installation : une seule fenetre, du debut a la fin. Elle lit le fichier d'etat ecrit par l'installeur
# (ETAT:debut:fin:message) et affiche des carres bleus qui s'ajoutent, avec le pourcentage.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function T([string]$s) {
  return $s.Replace('|', [string][char]10).Replace('#e', [string][char]233).Replace('#a', [string][char]224).Replace('#f', [string][char]234).Replace('#r', [string][char]232).Replace('#c', [string][char]231)
}

$global:fichier = $env:FFG_ETAT
$global:parent = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID").ParentProcessId
$global:fini = $false
$global:echec = $false
$global:debut = Get-Date
$global:pct = 0.0
$global:max = 4.0
$global:ligne = ''
$global:nbCarres = 25

$global:f = New-Object System.Windows.Forms.Form
$global:f.Text = T "Installation de l'aide"
$global:f.ClientSize = New-Object System.Drawing.Size(460, 240)
$global:f.StartPosition = 'CenterScreen'
$global:f.FormBorderStyle = 'FixedDialog'
$global:f.ControlBox = $false
$global:f.MaximizeBox = $false
$global:f.MinimizeBox = $false
$global:f.TopMost = $true
$global:f.UseWaitCursor = $true
$global:f.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$global:l = New-Object System.Windows.Forms.Label
$global:l.Location = New-Object System.Drawing.Point(20, 15)
$global:l.Size = New-Object System.Drawing.Size(420, 110)
$global:l.Text = T "Pr#eparation de l'installation...|Cela prend quelques minutes : ne fermez pas cette fen#ftre."

# Rangee de petits carres : un carre bleu de plus tous les 4 %.
$global:g = New-Object System.Windows.Forms.Panel
$global:g.Location = New-Object System.Drawing.Point(20, 135)
$global:g.Size = New-Object System.Drawing.Size(420, 14)
[void]$global:g.GetType().GetProperty('DoubleBuffered', [Reflection.BindingFlags]'NonPublic,Instance').SetValue($global:g, $true, $null)

function Dessiner($gr) {
  $n = [int][math]::Floor($global:pct / 100.0 * $global:nbCarres)
  if ($global:fini -and -not $global:echec) { $n = $global:nbCarres }
  $pas = 420.0 / $global:nbCarres
  $cote = $pas - 4.0
  if ($global:echec) { $couleur = [System.Drawing.Color]::FromArgb(200, 60, 60) } else { $couleur = [System.Drawing.Color]::FromArgb(0, 120, 215) }
  $plein = New-Object System.Drawing.SolidBrush($couleur)
  $creux = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(222, 222, 222))
  for ($k = 0; $k -lt $global:nbCarres; $k++) {
    if ($k -lt $n) { $pinceau = $plein } else { $pinceau = $creux }
    $gr.FillRectangle($pinceau, [single]($k * $pas), [single]0, [single]$cote, [single]13)
  }
  $plein.Dispose()
  $creux.Dispose()
}
$global:g.Add_Paint({ param($expediteur, $arguments) Dessiner $arguments.Graphics })

$global:q = New-Object System.Windows.Forms.Label
$global:q.Location = New-Object System.Drawing.Point(20, 162)
$global:q.Size = New-Object System.Drawing.Size(200, 36)
$global:q.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$global:q.Text = '0 %'

$global:b = New-Object System.Windows.Forms.Button
$global:b.Text = 'Fermer'
$global:b.Location = New-Object System.Drawing.Point(340, 192)
$global:b.Size = New-Object System.Drawing.Size(100, 32)
$global:b.Visible = $false
$global:b.Add_Click({ $global:f.Close() })

$global:f.Controls.Add($global:l)
$global:f.Controls.Add($global:g)
$global:f.Controls.Add($global:q)
$global:f.Controls.Add($global:b)

function Terminer([string]$etat, [string]$msg) {
  $global:fini = $true
  $global:t.Stop()
  if ($etat -eq 'FIN') { $global:pct = 100.0 } else { $global:echec = $true }
  $global:q.Text = ([string][int][math]::Floor($global:pct)) + ' %'
  $global:l.Text = $msg
  $global:f.UseWaitCursor = $false
  $global:b.Visible = $true
  $global:g.Invalidate()
}

function Verifier {
  $s = ''
  try {
    $fs = [IO.File]::Open($global:fichier, 'Open', 'Read', 'ReadWrite')
    $r = New-Object IO.StreamReader($fs)
    $s = $r.ReadToEnd()
    $r.Close()
  } catch { }
  # Quatre morceaux au plus : le message lui-meme peut contenir des ":".
  $morceaux = $s.Split([char[]]@([char]58), 4)
  $etat = ''
  $msg = ''
  $deb = 0.0
  $fin = 0.0
  if ($morceaux.Count -ge 4) {
    $etat = $morceaux[0].Trim()
    [void][double]::TryParse($morceaux[1], [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$deb)
    [void][double]::TryParse($morceaux[2], [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$fin)
    $msg = T ($morceaux[3].Trim())
  }
  $journal = Join-Path $env:LOCALAPPDATA 'ffg-aide\installation.log'
  if ($etat -eq 'COURS') {
    if ($s -ne $global:ligne) {
      $global:ligne = $s
      if ($deb -gt $global:pct) { $global:pct = $deb }
      $global:max = [math]::Max($fin, $global:pct)
      if ($global:l.Text -ne $msg) { $global:l.Text = $msg }
    }
    # Pendant une etape longue, l'avancement monte doucement sans jamais atteindre la fin de l'etape.
    $plafond = $global:max - 1.0
    if ($global:pct -lt $plafond) { $global:pct = $global:pct + ($plafond - $global:pct) * 0.015 }
    $global:q.Text = ([string][int][math]::Floor($global:pct)) + ' %'
    $global:g.Invalidate()
  }
  elseif ($etat -eq 'FIN' -or $etat -eq 'ERREUR') {
    Terminer $etat $msg
  }
  elseif (-not (Get-Process -Id $global:parent -ErrorAction SilentlyContinue)) {
    Terminer 'ERREUR' (T ("L'installation s'est arr#ft#ee avant la fin.|Journal : " + $journal))
  }
  elseif (((Get-Date) - $global:debut).TotalMinutes -gt 30) {
    Terminer 'ERREUR' (T ("L'installation est trop longue : elle est peut-#ftre bloqu#ee.|Journal : " + $journal))
  }
}

$global:f.Add_FormClosing({ param($expediteur, $arguments) if (-not $global:fini) { $arguments.Cancel = $true } })
$global:t = New-Object System.Windows.Forms.Timer
$global:t.Interval = 500
$global:t.Add_Tick({ Verifier })
$global:f.Add_Shown({ $global:t.Start() })
[void]$global:f.ShowDialog()
