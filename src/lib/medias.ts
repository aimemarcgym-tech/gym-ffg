import { getDb, type AlbumMedia, type MediaStocke } from "@/lib/idb";

export type TypeMedia = "photo" | "video";

const magasins = {
  photo: { albums: "photoAlbums", medias: "photos", mime: "image/jpeg" },
  video: { albums: "videoAlbums", medias: "videos", mime: "video/mp4" },
} as const;

const maintenant = () => new Date().toISOString();
const ouNull = (t: string) => t.trim() || null;

export async function getAlbums(type: TypeMedia): Promise<AlbumMedia[]> {
  const albums = await (await getDb()).getAll(magasins[type].albums);
  return albums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAlbum(type: TypeMedia, nom: string, date: string, equipe: string, club: string): Promise<AlbumMedia> {
  const album: AlbumMedia = { id: crypto.randomUUID(), name: nom.trim(), date: ouNull(date), team: ouNull(equipe), club: ouNull(club), createdAt: maintenant() };
  await (await getDb()).put(magasins[type].albums, album);
  return album;
}

export async function updateAlbum(type: TypeMedia, id: string, nom: string, date: string, equipe: string, club: string): Promise<void> {
  const db = await getDb();
  const album = await db.get(magasins[type].albums, id);
  if (!album) return;
  await db.put(magasins[type].albums, { ...album, name: nom.trim() || album.name, date: ouNull(date), team: ouNull(equipe), club: ouNull(club) });
}

export async function deleteAlbum(type: TypeMedia, id: string): Promise<void> {
  const db = await getDb();
  const { albums, medias } = magasins[type];
  const contenu = await db.getAllFromIndex(medias, "albumId", id);
  const tx = db.transaction([albums, medias], "readwrite");
  await Promise.all([tx.objectStore(albums).delete(id), ...contenu.map((m) => tx.objectStore(medias).delete(m.id)), tx.done]);
}

export async function getMedias(type: TypeMedia, albumId: string): Promise<MediaStocke[]> {
  const liste = await (await getDb()).getAllFromIndex(magasins[type].medias, "albumId", albumId);
  return liste.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addMedia(type: TypeMedia, albumId: string, fichier: File): Promise<MediaStocke> {
  const media: MediaStocke = {
    id: crypto.randomUUID(),
    albumId,
    fileName: fichier.name,
    mimeType: fichier.type || magasins[type].mime,
    size: fichier.size,
    blob: fichier,
    tags: [],
    createdAt: maintenant(),
  };
  await (await getDb()).put(magasins[type].medias, media);
  return media;
}

export async function setTags(type: TypeMedia, id: string, tags: string[]): Promise<void> {
  const db = await getDb();
  const media = await db.get(magasins[type].medias, id);
  if (media) await db.put(magasins[type].medias, { ...media, tags });
}

export async function deleteMedia(type: TypeMedia, id: string): Promise<void> {
  await (await getDb()).delete(magasins[type].medias, id);
}

// Pour la sauvegarde : tout le contenu d'un type, et son remplacement complet.
export async function toutLeContenu(type: TypeMedia): Promise<{ albums: AlbumMedia[]; medias: MediaStocke[] }> {
  const db = await getDb();
  return { albums: await db.getAll(magasins[type].albums), medias: await db.getAll(magasins[type].medias) };
}

export async function remplacerContenu(type: TypeMedia, albums: AlbumMedia[], medias: MediaStocke[]): Promise<void> {
  const db = await getDb();
  const { albums: nomAlbums, medias: nomMedias } = magasins[type];
  const tx = db.transaction([nomAlbums, nomMedias], "readwrite");
  await tx.objectStore(nomAlbums).clear();
  await tx.objectStore(nomMedias).clear();
  for (const a of albums) await tx.objectStore(nomAlbums).put(a);
  for (const m of medias) await tx.objectStore(nomMedias).put(m);
  await tx.done;
}
