// Fabrique un fichier ZIP dans le navigateur, sans bibliothèque. Les fichiers sont stockés tels quels (méthode « store ») :
// les MP3 sont déjà compressés, le ZIP sert à les réunir en un seul fichier facile à envoyer.
const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(octets: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < octets.length; i++)
    c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export async function creerZip(
  fichiers: { nom: string; blob: Blob }[],
): Promise<Blob> {
  const encodeur = new TextEncoder();
  const morceaux: BlobPart[] = [];
  const centrale: Uint8Array[] = [];
  let decalage = 0;
  // Date du fichier au format MS-DOS.
  const maintenant = new Date();
  const heure =
    (maintenant.getHours() << 11) |
    (maintenant.getMinutes() << 5) |
    (maintenant.getSeconds() >> 1);
  const date =
    ((maintenant.getFullYear() - 1980) << 9) |
    ((maintenant.getMonth() + 1) << 5) |
    maintenant.getDate();

  for (const f of fichiers) {
    const donnees = new Uint8Array(await f.blob.arrayBuffer());
    const nom = encodeur.encode(f.nom);
    const crc = crc32(donnees);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // noms en UTF-8
    local.setUint16(8, 0, true); // stocké
    local.setUint16(10, heure, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, donnees.length, true);
    local.setUint32(22, donnees.length, true);
    local.setUint16(26, nom.length, true);
    local.setUint16(28, 0, true);
    morceaux.push(local.buffer, nom, donnees);

    const entree = new DataView(new ArrayBuffer(46));
    entree.setUint32(0, 0x02014b50, true);
    entree.setUint16(4, 20, true);
    entree.setUint16(6, 20, true);
    entree.setUint16(8, 0x0800, true);
    entree.setUint16(10, 0, true);
    entree.setUint16(12, heure, true);
    entree.setUint16(14, date, true);
    entree.setUint32(16, crc, true);
    entree.setUint32(20, donnees.length, true);
    entree.setUint32(24, donnees.length, true);
    entree.setUint16(28, nom.length, true);
    entree.setUint32(42, decalage, true);
    const ligne = new Uint8Array(46 + nom.length);
    ligne.set(new Uint8Array(entree.buffer), 0);
    ligne.set(nom, 46);
    centrale.push(ligne);

    decalage += 30 + nom.length + donnees.length;
  }

  const tailleCentrale = centrale.reduce((t, l) => t + l.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, fichiers.length, true);
  fin.setUint16(10, fichiers.length, true);
  fin.setUint32(12, tailleCentrale, true);
  fin.setUint32(16, decalage, true);
  return new Blob(
    [...morceaux, ...centrale.map((l) => l.buffer as ArrayBuffer), fin.buffer],
    { type: "application/zip" },
  );
}
