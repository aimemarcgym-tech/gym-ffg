import { getDb, type MusiqueStockee } from "@/lib/idb";

export async function getMusique(gymnasteId: string): Promise<MusiqueStockee | undefined> {
  return (await getDb()).getFromIndex("musiques", "gymnasteId", gymnasteId);
}

export async function saveMusique(gymnasteId: string, fichier: File): Promise<MusiqueStockee> {
  const db = await getDb();
  const existante = await db.getFromIndex("musiques", "gymnasteId", gymnasteId);
  const musique: MusiqueStockee = {
    id: existante?.id ?? crypto.randomUUID(),
    gymnasteId,
    fileName: fichier.name,
    mimeType: fichier.type || "audio/mpeg",
    size: fichier.size,
    blob: fichier,
    updatedAt: new Date().toISOString(),
  };
  await db.put("musiques", musique);
  return musique;
}

export async function deleteMusique(gymnasteId: string): Promise<void> {
  const db = await getDb();
  const existante = await db.getFromIndex("musiques", "gymnasteId", gymnasteId);
  if (existante) await db.delete("musiques", existante.id);
}

export async function toutesLesMusiques(): Promise<MusiqueStockee[]> {
  return (await getDb()).getAll("musiques");
}

export async function remplacerMusiques(liste: MusiqueStockee[]): Promise<void> {
  const tx = (await getDb()).transaction("musiques", "readwrite");
  await tx.store.clear();
  for (const m of liste) await tx.store.put(m);
  await tx.done;
}
