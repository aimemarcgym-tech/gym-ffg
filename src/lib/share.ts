// Partage natif (Web Share API) avec repli sur le presse-papiers ; distinct du partage par lien public.
export async function partagerTexte(titre: string, texte: string): Promise<"partage" | "copie" | "echec"> {
  try {
    if (navigator.share) {
      await navigator.share({ title: titre, text: texte });
      return "partage";
    }
    await navigator.clipboard.writeText(texte);
    return "copie";
  } catch {
    return "echec";
  }
}

// Partage natif de fichiers (feuille de partage du téléphone) ; « unsupported » quand le navigateur ne sait pas.
export async function partagerFichiers(fichiers: File[], options?: { title?: string; text?: string }): Promise<"shared" | "cancelled" | "unsupported" | "error"> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.share || !nav.canShare) return "unsupported";
  const donnees: ShareData = { files: fichiers, title: options?.title, text: options?.text };
  if (!nav.canShare(donnees)) return "unsupported";
  try {
    await nav.share(donnees);
    return "shared";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : "error";
  }
}
