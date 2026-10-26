// Compression d'un PDF dans le navigateur : chaque page est redessinée en image JPEG réduite puis remise dans un nouveau PDF.
// Le texte n'est plus sélectionnable, mais le fichier devient beaucoup plus léger (schémas, circuits, plaquettes).
// Les bibliothèques sont chargées seulement au moment de la compression.

// Du plus fin au plus léger : on s'arrête au premier résultat qui passe sous la taille visée.
const PALIERS = [
  { ppp: 130, qualite: 0.72 },
  { ppp: 110, qualite: 0.65 },
  { ppp: 90, qualite: 0.55 },
  { ppp: 72, qualite: 0.5 },
];

export interface ResultatCompression {
  fichier: File;
  avant: number;
  apres: number;
}

function enBlob(canvas: HTMLCanvasElement, qualite: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image impossible à créer."))),
      "image/jpeg",
      qualite,
    ),
  );
}

export async function compresserPdf(
  fichier: File,
  tailleVisee: number,
): Promise<ResultatCompression> {
  const [pdfjs, { PDFDocument }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdf-lib"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pdf.worker.min.mjs`;
  const source = new Uint8Array(await fichier.arrayBuffer());

  let meilleur: Uint8Array | null = null;
  for (const palier of PALIERS) {
    const lecture = await pdfjs.getDocument({ data: source.slice() }).promise;
    const sortie = await PDFDocument.create();
    for (let n = 1; n <= lecture.numPages; n++) {
      const page = await lecture.getPage(n);
      const naturel = page.getViewport({ scale: 1 });
      const vue = page.getViewport({ scale: palier.ppp / 72 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(vue.width);
      canvas.height = Math.ceil(vue.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossible de dessiner la page.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vue }).promise;
      const jpeg = new Uint8Array(
        await (await enBlob(canvas, palier.qualite)).arrayBuffer(),
      );
      const image = await sortie.embedJpg(jpeg);
      const p = sortie.addPage([naturel.width, naturel.height]);
      p.drawImage(image, {
        x: 0,
        y: 0,
        width: naturel.width,
        height: naturel.height,
      });
      page.cleanup();
    }
    await lecture.destroy();
    meilleur = await sortie.save();
    if (meilleur.length <= tailleVisee) break;
  }

  const octets = meilleur as Uint8Array;
  const copie = new Uint8Array(octets.length);
  copie.set(octets);
  const nom = fichier.name.replace(/\.pdf$/i, "") + "-compresse.pdf";
  return {
    fichier: new File([copie], nom, { type: "application/pdf" }),
    avant: fichier.size,
    apres: octets.length,
  };
}
