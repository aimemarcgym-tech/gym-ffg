"""Fabrique public/aide/ffg-aide-musique.deb : l'aide « Faire ces musiques » en paquet Debian (Deepin, Ubuntu, Mint, Debian).

Un double-clic sur le .deb ouvre le gestionnaire de paquets du système, qui installe Node.js, ffmpeg et python3 tout seul,
puis le paquet télécharge yt-dlp, lance l'aide à chaque ouverture de session et enregistre le lien ffg-aide://.
Relancer ce script après toute modification de tools/aide-musique.mjs.
"""
import gzip
import io
import os
import tarfile
import time

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "public", "aide", "ffg-aide-musique.deb")
VERSION = "1.1"

control = f"""Package: ffg-aide-musique
Version: {VERSION}
Section: sound
Priority: optional
Architecture: all
Depends: nodejs, ffmpeg, python3, curl
Maintainer: Gestion Competitions FFG <aime.marc.gym@gmail.com>
Description: Aide Faire ces musiques (conversion de liens en MP3)
 Petit programme local qui permet a l'application Gestion Competitions et
 Entrainements de convertir un lien YouTube ou web en MP3 avec yt-dlp et ffmpeg.
 Il ecoute uniquement sur 127.0.0.1 et demarre avec la session.
"""

postinst = """#!/bin/sh
set -e
if ! command -v yt-dlp >/dev/null 2>&1; then
  curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp || true
  chmod 755 /usr/local/bin/yt-dlp 2>/dev/null || true
fi
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
exit 0
"""

prerm = """#!/bin/sh
pkill -f /opt/ffg-aide/aide-musique.mjs 2>/dev/null || true
exit 0
"""

lanceur = """#!/bin/sh
# Relance l'aide si elle s'arrete sur une erreur ; code 0 : deja lancee ou arretee normalement.
mkdir -p "$HOME/.cache"
while true; do
  node /opt/ffg-aide/aide-musique.mjs >> "$HOME/.cache/ffg-aide.log" 2>&1 && exit 0
  sleep 5
done
"""

autostart = """[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=/opt/ffg-aide/lancer.sh
Terminal=false
X-GNOME-Autostart-enabled=true
"""

lien = """[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=/opt/ffg-aide/lancer.sh
Terminal=false
NoDisplay=true
MimeType=x-scheme-handler/ffg-aide;
"""

with open(os.path.join(RACINE, "tools", "aide-musique.mjs"), "rb") as f:
    aide = f.read()


def tar_gz(fichiers):
    tampon = io.BytesIO()
    with gzip.GzipFile(fileobj=tampon, mode="wb", mtime=0) as gz:
        with tarfile.open(fileobj=gz, mode="w", format=tarfile.GNU_FORMAT) as t:
            dossiers = set()
            for chemin, _, _ in fichiers:
                parties = chemin.strip("/").split("/")
                for i in range(1, len(parties)):
                    dossiers.add("/".join(parties[:i]))
            for d in sorted(dossiers):
                info = tarfile.TarInfo("./" + d)
                info.type, info.mode, info.mtime = tarfile.DIRTYPE, 0o755, int(time.time())
                info.uname = info.gname = "root"
                t.addfile(info)
            for chemin, donnees, mode in fichiers:
                info = tarfile.TarInfo("./" + chemin.strip("/"))
                info.size, info.mode, info.mtime = len(donnees), mode, int(time.time())
                info.uname = info.gname = "root"
                t.addfile(info, io.BytesIO(donnees))
    return tampon.getvalue()


def ar(membres):
    out = b"!<arch>\n"
    for nom, donnees in membres:
        entete = f"{nom:<16}{int(time.time()):<12}{0:<6}{0:<6}{'100644':<8}{len(donnees):<10}`\n"
        out += entete.encode() + donnees
        if len(donnees) % 2:
            out += b"\n"
    return out


controle = tar_gz(
    [
        ("control", control.encode(), 0o644),
        ("postinst", postinst.encode(), 0o755),
        ("prerm", prerm.encode(), 0o755),
    ]
)
donnees = tar_gz(
    [
        ("opt/ffg-aide/aide-musique.mjs", aide, 0o644),
        ("opt/ffg-aide/lancer.sh", lanceur.encode(), 0o755),
        ("etc/xdg/autostart/ffg-aide.desktop", autostart.encode(), 0o644),
        ("usr/share/applications/ffg-aide.desktop", lien.encode(), 0o644),
    ]
)

os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
with open(SORTIE, "wb") as f:
    f.write(ar([("debian-binary", b"2.0\n"), ("control.tar.gz", controle), ("data.tar.gz", donnees)]))
print("Paquet écrit :", SORTIE, os.path.getsize(SORTIE), "octets")
