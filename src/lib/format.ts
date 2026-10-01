export function formatTaille(octets: number): string {
  return octets < 1048576 ? `${Math.round(octets / 1024)} Ko` : `${(octets / 1048576).toFixed(1)} Mo`;
}

export function formatDuree(secondes: number): string {
  if (!Number.isFinite(secondes) || secondes < 0) return "0:00";
  return `${Math.floor(secondes / 60)}:${Math.floor(secondes % 60).toString().padStart(2, "0")}`;
}

// Nom de fichier sûr pour une clé USB : sans accents ni caractères spéciaux.
export function nomFichierSur(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
}
