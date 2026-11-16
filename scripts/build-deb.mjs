// Fabrique public/aide/ffg-aide-musique.deb : l'aide « Faire ces musiques » en paquet Debian (Deepin, Ubuntu, Kubuntu, Mint, Debian).
//
// Un double-clic sur le .deb ouvre le gestionnaire de paquets du système, qui installe Node.js, ffmpeg et python3 tout seul,
// puis le paquet télécharge yt-dlp, lance l'aide à chaque ouverture de session et enregistre le lien ffg-aide://.
// Lancé par `npm run build` : le paquet contient toujours l'aide actuelle (tools/aide-musique.mjs).
// Remplace scripts/build-deb.py (même paquet, mais sans avoir besoin de Python) ; la date est fixée à 0 pour que le fichier
// ne change que si son contenu change.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = join(racine, "public", "aide", "ffg-aide-musique.deb");
const VERSION = "1.3";

const control = `Package: ffg-aide-musique
Version: ${VERSION}
Section: sound
Priority: optional
Architecture: all
Depends: nodejs, ffmpeg, python3, curl
Maintainer: Gestion Competitions FFG <noreply@gym-ffg.web.app>
Description: Aide Faire ces musiques (conversion de liens en MP3)
 Petit programme local qui permet a l'application Gestion Competitions et
 Entrainements de convertir un lien YouTube ou web en MP3 avec yt-dlp et ffmpeg.
 Il ecoute uniquement sur 127.0.0.1 et demarre avec la session.
`;

const postinst = `#!/bin/sh
set -e
if ! command -v yt-dlp >/dev/null 2>&1; then
  curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp || true
  chmod 755 /usr/local/bin/yt-dlp 2>/dev/null || true
fi
# yt-dlp a besoin d'un moteur JavaScript (Deno) pour YouTube : sans lui, YouTube répond « HTTP Error 403 ».
if ! command -v deno >/dev/null 2>&1; then
  case "$(uname -m)" in
    x86_64) cible=x86_64-unknown-linux-gnu ;;
    aarch64) cible=aarch64-unknown-linux-gnu ;;
    *) cible= ;;
  esac
  if [ -n "$cible" ]; then
    tmp=$(mktemp -d)
    if curl -fsSL "https://github.com/denoland/deno/releases/latest/download/deno-$cible.zip" -o "$tmp/deno.zip"; then
      python3 -c "import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extract('deno', sys.argv[2])" "$tmp/deno.zip" "$tmp" && install -m 755 "$tmp/deno" /usr/local/bin/deno || true
    fi
    rm -rf "$tmp"
  fi
fi
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
exit 0
`;

const prerm = `#!/bin/sh
pkill -f /opt/ffg-aide/aide-musique.mjs 2>/dev/null || true
exit 0
`;

const lanceur = `#!/bin/sh
# Relance l'aide si elle s'arrete sur une erreur ; code 0 : deja lancee ou arretee normalement.
mkdir -p "$HOME/.cache"
while true; do
  node /opt/ffg-aide/aide-musique.mjs >> "$HOME/.cache/ffg-aide.log" 2>&1 && exit 0
  sleep 5
done
`;

const autostart = `[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=/opt/ffg-aide/lancer.sh
Terminal=false
X-GNOME-Autostart-enabled=true
`;

const lien = `[Desktop Entry]
Type=Application
Name=FFG aide musique
Exec=/opt/ffg-aide/lancer.sh
Terminal=false
NoDisplay=true
MimeType=x-scheme-handler/ffg-aide;
`;

const aide = readFileSync(join(racine, "tools", "aide-musique.mjs"));
// Le paquet est fabriqué pour Linux : l'aide doit y avoir des fins de ligne Unix (même si le dépôt est en CRLF sous Windows).
const aideLinux = Buffer.from(aide.toString("utf8").replace(/\r\n/g, "\n"), "utf8");

const octal = (n, largeur) => n.toString(8).padStart(largeur - 1, "0") + "\0";

// Entête tar au format ustar : 512 octets.
function enteteTar(nom, taille, mode, dossier) {
  const e = Buffer.alloc(512);
  e.write(nom, 0, 100, "latin1");
  e.write(octal(mode, 8), 100, 8, "latin1");
  e.write(octal(0, 8), 108, 8, "latin1"); // uid
  e.write(octal(0, 8), 116, 8, "latin1"); // gid
  e.write(octal(taille, 12), 124, 12, "latin1");
  e.write(octal(0, 12), 136, 12, "latin1"); // date fixée à 0
  e.write("        ", 148, 8, "latin1"); // somme de contrôle : 8 espaces pendant le calcul
  e.write(dossier ? "5" : "0", 156, 1, "latin1");
  e.write("ustar\0", 257, 6, "latin1");
  e.write("00", 263, 2, "latin1");
  e.write("root", 265, 32, "latin1");
  e.write("root", 297, 32, "latin1");
  let somme = 0;
  for (const octet of e) somme += octet;
  e.write(somme.toString(8).padStart(6, "0") + "\0 ", 148, 8, "latin1");
  return e;
}

function tarGz(fichiers) {
  const blocs = [];
  const dossiers = new Set();
  for (const [chemin] of fichiers) {
    const parties = chemin.split("/");
    for (let i = 1; i < parties.length; i++) dossiers.add(parties.slice(0, i).join("/"));
  }
  for (const d of [...dossiers].sort()) blocs.push(enteteTar(`./${d}/`, 0, 0o755, true));
  for (const [chemin, donnees, mode] of fichiers) {
    blocs.push(enteteTar(`./${chemin}`, donnees.length, mode, false));
    blocs.push(donnees);
    const reste = donnees.length % 512;
    if (reste) blocs.push(Buffer.alloc(512 - reste));
  }
  blocs.push(Buffer.alloc(1024)); // fin d'archive
  return gzipSync(Buffer.concat(blocs), { level: 9 });
}

function ar(membres) {
  const blocs = [Buffer.from("!<arch>\n", "latin1")];
  for (const [nom, donnees] of membres) {
    const entete = nom.padEnd(16) + "0".padEnd(12) + "0".padEnd(6) + "0".padEnd(6) + "100644".padEnd(8) + String(donnees.length).padEnd(10) + "`\n";
    blocs.push(Buffer.from(entete, "latin1"), donnees);
    if (donnees.length % 2) blocs.push(Buffer.from("\n", "latin1"));
  }
  return Buffer.concat(blocs);
}

const controle = tarGz([
  ["control", Buffer.from(control), 0o644],
  ["postinst", Buffer.from(postinst), 0o755],
  ["prerm", Buffer.from(prerm), 0o755],
]);
const donnees = tarGz([
  ["opt/ffg-aide/aide-musique.mjs", aideLinux, 0o644],
  ["opt/ffg-aide/lancer.sh", Buffer.from(lanceur), 0o755],
  ["etc/xdg/autostart/ffg-aide.desktop", Buffer.from(autostart), 0o644],
  ["usr/share/applications/ffg-aide.desktop", Buffer.from(lien), 0o644],
]);

mkdirSync(dirname(sortie), { recursive: true });
const paquet = ar([
  ["debian-binary", Buffer.from("2.0\n")],
  ["control.tar.gz", controle],
  ["data.tar.gz", donnees],
]);
writeFileSync(sortie, paquet);
console.log(`Paquet Linux : ${sortie} (${paquet.length} octets)`);
