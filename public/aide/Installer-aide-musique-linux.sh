#!/usr/bin/env bash
# Installe l'aide « Faire ces musiques » sur Linux (sans droits administrateur) :
#   1. copie l'aide dans ~/.local/share/ffg-aide ;
#   2. la lance automatiquement à l'ouverture de session ;
#   3. enregistre le lien ffg-aide:// utilisé par l'appli pour la démarrer toute seule.
# Node.js et ffmpeg sont installés automatiquement s'ils manquent (une fenêtre demande le mot de passe) ; yt-dlp est téléchargé ici.
set -euo pipefail

DEPOT="https://raw.githubusercontent.com/aimemarcgym-tech/gym-ffg/main/tools/aide-musique.mjs"
DOSSIER="$HOME/.local/share/ffg-aide"
BIN="$HOME/.local/bin"

manque=()
command -v node >/dev/null || manque+=("nodejs")
command -v ffmpeg >/dev/null || manque+=("ffmpeg")
if [ ${#manque[@]} -gt 0 ]; then
  # Installation automatique : une fenêtre demande le mot de passe de la session (pkexec), rien à taper.
  if command -v apt-get >/dev/null; then pkexec apt-get install -y "${manque[@]}" || true
  elif command -v dnf >/dev/null; then pkexec dnf install -y "${manque[@]}" || true
  elif command -v pacman >/dev/null; then pkexec pacman -S --noconfirm "${manque[@]}" || true
  fi
  if ! command -v node >/dev/null || ! command -v ffmpeg >/dev/null; then
    echo "Impossible d'installer automatiquement : ${manque[*]}. Installez-les avec le gestionnaire de logiciels de votre système, puis relancez ce fichier."
    exit 1
  fi
fi

mkdir -p "$DOSSIER" "$BIN" "$HOME/.config/autostart" "$HOME/.local/share/applications"
export PATH="$BIN:$PATH"

# yt-dlp : version officielle publiée par le projet, placée dans ~/.local/bin.
if ! command -v yt-dlp >/dev/null; then
  echo "Téléchargement de yt-dlp…"
  curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BIN/yt-dlp"
  chmod +x "$BIN/yt-dlp"
fi

# L'aide elle-même : la copie à côté de ce script si elle existe, sinon celle du dépôt.
ICI="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$ICI" ] && [ -f "$ICI/aide-musique.mjs" ]; then
  cp "$ICI/aide-musique.mjs" "$DOSSIER/aide-musique.mjs"
else
  curl -fsSL "$DEPOT" -o "$DOSSIER/aide-musique.mjs"
fi

# Lanceur : relance l'aide si elle s'arrête sur une erreur (code 0 : déjà lancée ou arrêtée normalement).
cat > "$DOSSIER/lancer.sh" <<EOF
#!/usr/bin/env bash
export PATH="$BIN:\$PATH"
cd "$DOSSIER"
while true; do
  node aide-musique.mjs >> "$DOSSIER/aide-musique.log" 2>&1 && exit 0
  sleep 5
done
EOF
chmod +x "$DOSSIER/lancer.sh"

# Démarrage automatique à l'ouverture de session.
cat > "$HOME/.config/autostart/ffg-aide.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=$DOSSIER/lancer.sh
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

# Lien ffg-aide:// : permet à l'appli de lancer l'aide d'un clic (ou toute seule en ouvrant « Faire ces musiques »).
cat > "$HOME/.local/share/applications/ffg-aide.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=$DOSSIER/lancer.sh
Terminal=false
NoDisplay=true
MimeType=x-scheme-handler/ffg-aide;
EOF
command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true
command -v xdg-mime >/dev/null && xdg-mime default ffg-aide.desktop x-scheme-handler/ffg-aide || true

# Lancement immédiat.
nohup "$DOSSIER/lancer.sh" >/dev/null 2>&1 &
sleep 2
if curl -fs http://127.0.0.1:47615/etat >/dev/null; then
  echo "Terminé : l'aide est lancée et démarrera toute seule à l'ouverture de session. Vous pouvez fermer cette fenêtre et retourner dans l'appli."
else
  echo "Installée, mais elle ne répond pas encore : regardez $DOSSIER/aide-musique.log"
fi
