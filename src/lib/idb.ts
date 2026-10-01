import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface MusiqueStockee {
  id: string;
  gymnasteId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  updatedAt: string;
}

export interface AlbumMedia {
  id: string;
  name: string;
  date: string | null;
  team: string | null;
  club: string | null;
  createdAt: string;
}

export interface MediaStocke {
  id: string;
  albumId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  tags: string[];
  createdAt: string;
}

// Document de résultats (classement, feuille de notes…) rattaché à une équipe ou à une gymnaste : cible = « equipe:ID » ou « gymnaste:ID ».
export interface ResultatStocke {
  id: string;
  cible: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  date: string | null;
  createdAt: string;
}

interface Schema extends DBSchema {
  resultats: { key: string; value: ResultatStocke; indexes: { cible: string } };
  musiques: { key: string; value: MusiqueStockee; indexes: { gymnasteId: string } };
  photoAlbums: { key: string; value: AlbumMedia };
  photos: { key: string; value: MediaStocke; indexes: { albumId: string } };
  videoAlbums: { key: string; value: AlbumMedia };
  videos: { key: string; value: MediaStocke; indexes: { albumId: string } };
}

// Les fichiers lourds (musiques, photos, vidéos, résultats) restent dans le navigateur (IndexedDB) et ne partent pas dans le cloud :
// l'export JSON manuel sert de sauvegarde et de transfert.
let base: Promise<IDBPDatabase<Schema>> | null = null;

export function getDb() {
  base ??= openDB<Schema>("ffg-medias", 3, {
    upgrade(db, ancienne) {
      if (ancienne < 1) db.createObjectStore("musiques", { keyPath: "id" }).createIndex("gymnasteId", "gymnasteId");
      if (ancienne < 2) {
        db.createObjectStore("photoAlbums", { keyPath: "id" });
        db.createObjectStore("photos", { keyPath: "id" }).createIndex("albumId", "albumId");
        db.createObjectStore("videoAlbums", { keyPath: "id" });
        db.createObjectStore("videos", { keyPath: "id" }).createIndex("albumId", "albumId");
      }
      if (ancienne < 3) db.createObjectStore("resultats", { keyPath: "id" }).createIndex("cible", "cible");
    },
  });
  return base;
}
