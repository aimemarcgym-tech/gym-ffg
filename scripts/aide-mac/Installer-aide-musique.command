#!/bin/bash
# Aide « Faire ces musiques » pour macOS : installe Homebrew (si besoin), Node.js, yt-dlp, ffmpeg et Deno, copie l'aide,
# la lance et la fait démarrer à chaque ouverture de session (LaunchAgent).
# ATTENTION : ce fichier n'a jamais été essayé sur un Mac par son auteur.
#   Installer-aide-musique.command               installe
#   Installer-aide-musique.command desinstaller  enlève l'aide (les programmes Homebrew restent installés)
# Ce fichier doit garder des fins de ligne Unix (LF) : scripts/build-mac.mjs s'en occupe en le mettant dans le zip.
set -u

SITE="https://gym-ffg.web.app/aide"
DOSSIER="$HOME/Library/Application Support/ffg-aide"
AGENT="$HOME/Library/LaunchAgents/fr.ffg.aide-musique.plist"
ETIQUETTE="fr.ffg.aide-musique"
JOURNAL="$DOSSIER/installation.log"

# Boîte de message du Mac (le texte ne doit pas contenir de guillemets droits).
boite() {
  /usr/bin/osascript -e "display dialog \"$2\" with title \"$1\" buttons {\"OK\"} default button \"OK\" with icon note" >/dev/null 2>&1 || true
}

erreur() {
  echo
  echo "ERREUR : $1"
  echo "Journal : $JOURNAL"
  boite "Installation de l'aide" "$1"
  exit 1
}

arreter_aide() {
  launchctl bootout "gui/$(id -u)/$ETIQUETTE" >/dev/null 2>&1 || launchctl unload "$AGENT" >/dev/null 2>&1 || true
  pkill -f "$DOSSIER/aide-musique.mjs" >/dev/null 2>&1 || true
  pkill -f "node aide-musique.mjs" >/dev/null 2>&1 || true
}

if [ "${1:-}" = "desinstaller" ]; then
  arreter_aide
  rm -f "$AGENT"
  rm -rf "$DOSSIER"
  echo "L'aide est enlevée. Node.js, yt-dlp, ffmpeg et Deno (Homebrew) restent installés."
  exit 0
fi

mkdir -p "$DOSSIER"
exec > >(tee -a "$JOURNAL") 2>&1
echo
echo "Aide « Faire ces musiques » : convertir un lien YouTube ou autre en MP3"
echo "---------------------------------------------------------------------"
echo "Cette installation, à faire une seule fois sur ce Mac :"
echo "  1. installe Homebrew (l'installeur de programmes du Mac) s'il manque ;"
echo "  2. installe Node.js, yt-dlp, ffmpeg et Deno s'ils manquent ;"
echo "  3. copie l'aide, la lance maintenant, puis à chaque ouverture de votre session."
echo "Ne fermez pas cette fenêtre avant la fin : cela peut prendre plusieurs minutes."
echo

# Cherche Homebrew (Mac récents : /opt/homebrew ; Mac Intel : /usr/local) et l'ajoute au chemin de cette fenêtre.
chercher_brew() {
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$b" ]; then
      eval "$("$b" shellenv)"
      return 0
    fi
  done
  command -v brew >/dev/null 2>&1
}

if ! chercher_brew; then
  echo "- Installation de Homebrew (le Mac va demander le mot de passe de votre session)..."
  sudo -v || erreur "Le mot de passe de votre session est nécessaire pour installer Homebrew, et ce compte doit être administrateur du Mac."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || erreur "Homebrew n'a pas pu être installé. Relancez ce fichier ; si le problème reste, regardez le journal."
  chercher_brew || erreur "Homebrew est installé mais introuvable. Fermez cette fenêtre, rouvrez le Terminal puis relancez ce fichier."
fi

for programme in node yt-dlp ffmpeg deno; do
  if command -v "$programme" >/dev/null 2>&1; then
    continue
  fi
  echo "- Installation de $programme..."
  brew install "$programme" || erreur "$programme n'a pas pu être installé. Relancez ce fichier ; si le problème reste, regardez le journal."
done

echo "- Copie de l'aide..."
arreter_aide
curl -fsSL "$SITE/aide-musique.mjs" -o "$DOSSIER/aide-musique.mjs" || erreur "Impossible de télécharger l'aide : vérifiez la connexion internet puis relancez ce fichier."
# Copie de cet installeur : permet de désinstaller plus tard sans retrouver le fichier téléchargé.
cp "$0" "$DOSSIER/installeur.command" 2>/dev/null && chmod +x "$DOSSIER/installeur.command" || true

# Lanceur : relance l'aide si elle s'arrête sur une erreur (code 0 : déjà lancée ou arrêtée normalement).
cat > "$DOSSIER/lancer.sh" <<'FIN_LANCEUR'
#!/bin/sh
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$(dirname "$0")" || exit 1
while true; do
  node aide-musique.mjs >> aide-musique.log 2>&1 && exit 0
  sleep 5
done
FIN_LANCEUR
chmod +x "$DOSSIER/lancer.sh"

# Démarrage automatique à chaque ouverture de session (pour cet utilisateur seulement).
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$AGENT" <<FIN_AGENT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$ETIQUETTE</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>$DOSSIER/lancer.sh</string></array>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
FIN_AGENT

echo "- Lancement de l'aide..."
launchctl bootstrap "gui/$(id -u)" "$AGENT" >/dev/null 2>&1 || launchctl load -w "$AGENT" >/dev/null 2>&1 || true

PRETE=""
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -s -m 3 http://127.0.0.1:47615/etat >/dev/null 2>&1; then
    PRETE=1
    break
  fi
  sleep 2
done

echo
if [ -n "$PRETE" ]; then
  echo "Terminé : l'aide est lancée et démarrera toute seule à l'ouverture de votre session."
  echo "Retournez sur la page « Faire ces musiques » : elle détecte l'aide toute seule."
  boite "Installation de l'aide" "L'aide est installée. Elle démarrera toute seule à l'ouverture de votre session. Vous pouvez revenir sur la page Faire ces musiques : elle détecte l'aide toute seule."
else
  echo "L'aide est installée mais ne répond pas encore."
  echo "Redémarrez le Mac, puis rouvrez la page « Faire ces musiques »."
  echo "Journal : $DOSSIER/aide-musique.log"
  boite "Installation de l'aide" "L'aide est installée mais ne répond pas encore. Redémarrez le Mac, puis rouvrez la page Faire ces musiques."
fi
exit 0
