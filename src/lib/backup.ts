import { exporterDonnees, remplacerDonnees, type Store } from "@/lib/data";
import { remplacerMusiques, toutesLesMusiques } from "@/lib/musique";
import { remplacerContenu, toutLeContenu, type TypeMedia } from "@/lib/medias";
import { remplacerResultats, tousLesResultats } from "@/lib/resultats";
import type { AlbumMedia, MediaStocke, ResultatStocke } from "@/lib/idb";

type MediaSauvegarde = Omit<MediaStocke, "blob"> & { dataBase64: string };
type ResultatSauvegarde = Omit<ResultatStocke, "blob"> & { dataBase64: string };

interface MusiqueSauvegardee {
  id: string;
  gymnasteId: string;
  fileName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
  dataBase64: string;
}

export interface Sauvegarde extends Partial<Store> {
  version: number;
  exportedAt: string;
  musiques?: MusiqueSauvegardee[];
  photoAlbums?: AlbumMedia[];
  photos?: MediaSauvegarde[];
  videoAlbums?: AlbumMedia[];
  videos?: MediaSauvegarde[];
  resultats?: ResultatSauvegarde[];
}

const VERSIONS_LUES = [1, 2, 3];

function blobEnBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const texte = String(lecteur.result);
      resolve(texte.slice(texte.indexOf(",") + 1));
    };
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.readAsDataURL(blob);
  });
}

function base64EnBlob(base64: string, type: string): Blob {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return new Blob([octets], { type });
}

async function exporterMedias(type: TypeMedia): Promise<{ albums: AlbumMedia[]; medias: MediaSauvegarde[] }> {
  const { albums, medias } = await toutLeContenu(type);
  return {
    albums,
    medias: await Promise.all(
      medias.map(async (m) => {
        const { blob, ...reste } = m;
        return { ...reste, dataBase64: await blobEnBase64(blob) };
      }),
    ),
  };
}

async function importerMedias(type: TypeMedia, albums: AlbumMedia[], medias: MediaSauvegarde[]) {
  await remplacerContenu(
    type,
    albums,
    medias.map((m) => {
      const { dataBase64, ...reste } = m;
      return { ...reste, tags: reste.tags ?? [], blob: base64EnBlob(dataBase64, m.mimeType) };
    }),
  );
}

// Données légères (clubs, équipes, gymnastes, mouvements) + fichiers lourds de cet appareil (musiques) dans un seul JSON.
export async function exporterSauvegarde(): Promise<Sauvegarde> {
  const donnees = await exporterDonnees();
  const musiques = await Promise.all(
    (await toutesLesMusiques()).map(async (m) => ({
      id: m.id,
      gymnasteId: m.gymnasteId,
      fileName: m.fileName,
      mimeType: m.mimeType,
      size: m.size,
      updatedAt: m.updatedAt,
      dataBase64: await blobEnBase64(m.blob),
    })),
  );
  const p = await exporterMedias("photo");
  const v = await exporterMedias("video");
  const resultats = await Promise.all(
    (await tousLesResultats()).map(async (r) => {
      const { blob, ...reste } = r;
      return { ...reste, dataBase64: await blobEnBase64(blob) };
    }),
  );
  return { version: 3, exportedAt: new Date().toISOString(), ...donnees, musiques, photoAlbums: p.albums, photos: p.medias, videoAlbums: v.albums, videos: v.medias, resultats };
}

export async function importerSauvegarde(s: Sauvegarde | null): Promise<Record<string, number>> {
  if (!s || !VERSIONS_LUES.includes(s.version)) throw new Error("Fichier de sauvegarde invalide ou d’une version non prise en charge.");
  await remplacerDonnees(s);
  const musiques = s.musiques ?? [];
  await remplacerMusiques(
    musiques.map((m) => ({
      id: m.id,
      gymnasteId: m.gymnasteId,
      fileName: m.fileName,
      mimeType: m.mimeType,
      size: m.size,
      updatedAt: m.updatedAt,
      blob: base64EnBlob(m.dataBase64, m.mimeType),
    })),
  );
  await importerMedias("photo", s.photoAlbums ?? [], s.photos ?? []);
  await importerMedias("video", s.videoAlbums ?? [], s.videos ?? []);
  await remplacerResultats(
    (s.resultats ?? []).map((r) => {
      const { dataBase64, ...reste } = r;
      return { ...reste, blob: base64EnBlob(dataBase64, r.mimeType) };
    }),
  );
  return {
    resultats: s.resultats?.length ?? 0,
    photos: s.photos?.length ?? 0,
    videos: s.videos?.length ?? 0,
    clubs: s.clubs?.length ?? 0,
    equipes: s.equipes?.length ?? 0,
    gymnastes: s.gymnastes?.length ?? 0,
    mouvements: s.mouvements?.length ?? 0,
    musiques: musiques.length,
  };
}

// showSaveFilePicker (Chrome, Edge) laisse choisir l'emplacement ; repli sur un téléchargement classique.
export async function telechargerSauvegarde(s: Sauvegarde): Promise<"picked" | "cancelled" | "downloaded"> {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const nom = `ffg-gaf-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  const w = window as unknown as {
    showSaveFilePicker?: (o: unknown) => Promise<{ createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }> }>;
  };
  if (w.showSaveFilePicker) {
    try {
      const fichier = await w.showSaveFilePicker({ suggestedName: nom, types: [{ description: "Sauvegarde JSON", accept: { "application/json": [".json"] } }] });
      const flux = await fichier.createWritable();
      await flux.write(blob);
      await flux.close();
      return "picked";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
