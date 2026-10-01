import { getDb, type ResultatStocke } from "@/lib/idb";

export type CibleResultat = { genre: "equipe" | "gymnaste"; id: string };

export const cleCible = (c: CibleResultat) => `${c.genre}:${c.id}`;

// Les plus récents d'abord, comme sur le site UFOLEP ; les documents sans date viennent après.
export async function getResultats(c: CibleResultat): Promise<ResultatStocke[]> {
  const liste = await (await getDb()).getAllFromIndex("resultats", "cible", cleCible(c));
  return liste.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt.localeCompare(a.createdAt));
}

export async function addResultat(c: CibleResultat, fichier: File, date: string | null): Promise<ResultatStocke> {
  const r: ResultatStocke = {
    id: crypto.randomUUID(),
    cible: cleCible(c),
    fileName: fichier.name,
    mimeType: fichier.type || "application/octet-stream",
    size: fichier.size,
    blob: fichier,
    date,
    createdAt: new Date().toISOString(),
  };
  await (await getDb()).put("resultats", r);
  return r;
}

export async function setDateResultat(id: string, date: string): Promise<void> {
  const db = await getDb();
  const r = await db.get("resultats", id);
  if (r) await db.put("resultats", { ...r, date: date || null });
}

export async function deleteResultat(id: string): Promise<void> {
  await (await getDb()).delete("resultats", id);
}

// Suppression d'une équipe ou d'une gymnaste : ses documents partent avec elle.
export async function supprimerResultatsCible(c: CibleResultat): Promise<void> {
  const db = await getDb();
  const liste = await db.getAllFromIndex("resultats", "cible", cleCible(c));
  await Promise.all(liste.map((r) => db.delete("resultats", r.id)));
}

// Sauvegarde : lecture et remplacement complets.
export async function tousLesResultats(): Promise<ResultatStocke[]> {
  return (await getDb()).getAll("resultats");
}

export async function remplacerResultats(liste: ResultatStocke[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("resultats", "readwrite");
  await tx.store.clear();
  for (const r of liste) await tx.store.put(r);
  await tx.done;
}
