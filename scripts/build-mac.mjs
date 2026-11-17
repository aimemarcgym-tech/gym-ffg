// Fabrique public/aide/Installer-aide-musique-mac.zip : l'installeur de l'aide « Faire ces musiques » pour macOS.
//
// Un fichier .command téléchargé perd son droit d'exécution : double-cliqué, il ne s'ouvrirait pas. Dans un zip, le droit
// d'exécution (755) est conservé, et le Mac le garde en décompressant. Le script est mis en fins de ligne Unix (LF).
// Lancé par `npm run build`. Date fixée pour que le fichier ne change que si son contenu change.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(racine, "scripts", "aide-mac", "Installer-aide-musique.command");
const sortie = join(racine, "public", "aide", "Installer-aide-musique-mac.zip");
const NOM = "Installer-aide-musique.command";

const script = Buffer.from(readFileSync(source, "utf8").replace(/\r\n/g, "\n"), "utf8");
const compresse = deflateRawSync(script, { level: 9 });
const nom = Buffer.from(NOM, "utf8");
const somme = crc32(script);

const DATE_DOS = (1 << 5) | 1; // 1er janvier 1980
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };

const local = Buffer.concat([
  u32(0x04034b50), u16(20), u16(0x0800), u16(8), u16(0), u16(DATE_DOS),
  u32(somme), u32(compresse.length), u32(script.length), u16(nom.length), u16(0), nom, compresse,
]);
const central = Buffer.concat([
  u32(0x02014b50), u16((3 << 8) | 20), u16(20), u16(0x0800), u16(8), u16(0), u16(DATE_DOS),
  u32(somme), u32(compresse.length), u32(script.length), u16(nom.length), u16(0), u16(0), u16(0), u16(0),
  u32((0o100755 << 16) >>> 0), u32(0), nom,
]);
const fin = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(1), u16(1), u32(central.length), u32(local.length), u16(0)]);

mkdirSync(dirname(sortie), { recursive: true });
const zip = Buffer.concat([local, central, fin]);
writeFileSync(sortie, zip);
console.log(`Installeur Mac : ${sortie} (${zip.length} octets)`);
