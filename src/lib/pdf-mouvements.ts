// PDF des mouvements : chaque page de la feuille d'impression est capturée en image (la même mise en page que l'impression), puis
// les images sont assemblées dans un PDF, une par page A4. Aucune bibliothèque de PDF : le format est écrit à la main (une image
// JPEG par page). Le PDF est donc fidèle à l'écran mais son texte n'est pas sélectionnable.

export type Orientation = "portrait" | "paysage";

export interface PageImage {
  jpeg: Uint8Array;
  largeur: number; // pixels
  hauteur: number;
}

// Capture chaque « .page-impression » de la feuille. Chargée à la demande : la bibliothèque n'alourdit pas le reste de l'appli.
export async function capturerPages(racine: HTMLElement): Promise<PageImage[]> {
  const { toCanvas } = await import("html-to-image");
  if (document.fonts) await document.fonts.ready;
  const pages = [...racine.querySelectorAll<HTMLElement>(".page-impression")];
  const images: PageImage[] = [];
  for (const page of pages) {
    const canvas = await toCanvas(page, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture impossible."))), "image/jpeg", 0.92),
    );
    images.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), largeur: canvas.width, hauteur: canvas.height });
  }
  return images;
}

const POINTS_PAR_MM = 72 / 25.4;

// Assemble les images dans un PDF A4 (marges de 10 mm), chaque image réduite pour tenir dans la page.
export function pdfDepuisImages(images: PageImage[], orientation: Orientation): Blob {
  const portrait = orientation === "portrait";
  const largeurPage = (portrait ? 210 : 297) * POINTS_PAR_MM;
  const hauteurPage = (portrait ? 297 : 210) * POINTS_PAR_MM;
  const marge = 10 * POINTS_PAR_MM;
  const utileL = largeurPage - 2 * marge;
  const utileH = hauteurPage - 2 * marge;

  const encodeur = new TextEncoder();
  const morceaux: Uint8Array[] = [];
  const decalages: number[] = [];
  let longueur = 0;
  const ecrire = (contenu: string | Uint8Array) => {
    const octets = typeof contenu === "string" ? encodeur.encode(contenu) : contenu;
    morceaux.push(octets);
    longueur += octets.length;
  };
  const debutObjet = (n: number) => {
    decalages[n] = longueur;
    ecrire(`${n} 0 obj\n`);
  };
  const nb = (x: number) => x.toFixed(2);

  ecrire("%PDF-1.4\n");
  ecrire(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // indique un fichier binaire

  debutObjet(1);
  ecrire("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  debutObjet(2);
  const kids = images.map((_, i) => `${3 + 3 * i} 0 R`).join(" ");
  ecrire(`<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>\nendobj\n`);

  images.forEach((image, i) => {
    const page = 3 + 3 * i;
    const contenu = 4 + 3 * i;
    const img = 5 + 3 * i;
    const echelle = Math.min(utileL / image.largeur, utileH / image.hauteur);
    const w = image.largeur * echelle;
    const h = image.hauteur * echelle;
    const x = marge;
    const y = hauteurPage - marge - h; // alignée en haut de la zone utile
    const flux = `q ${nb(w)} 0 0 ${nb(h)} ${nb(x)} ${nb(y)} cm /Im0 Do Q`;

    debutObjet(page);
    ecrire(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${nb(largeurPage)} ${nb(hauteurPage)}] ` +
        `/Resources << /XObject << /Im0 ${img} 0 R >> >> /Contents ${contenu} 0 R >>\nendobj\n`,
    );
    debutObjet(contenu);
    ecrire(`<< /Length ${flux.length} >>\nstream\n${flux}\nendstream\nendobj\n`);
    debutObjet(img);
    ecrire(
      `<< /Type /XObject /Subtype /Image /Width ${image.largeur} /Height ${image.hauteur} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`,
    );
    ecrire(image.jpeg);
    ecrire("\nendstream\nendobj\n");
  });

  const total = 3 + 3 * images.length;
  const debutXref = longueur;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) xref += `${String(decalages[n]).padStart(10, "0")} 00000 n \n`;
  ecrire(xref);
  ecrire(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF\n`);

  return new Blob(morceaux as BlobPart[], { type: "application/pdf" });
}

// Nom de fichier sûr : sans les caractères interdits par Windows et les autres systèmes.
export function nomFichierPdf(nom: string): string {
  const propre = nom.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return `${propre || "Mouvements"}.pdf`;
}

export function telecharger(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
