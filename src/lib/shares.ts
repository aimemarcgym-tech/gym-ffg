// Partage par lien public : un instantané figé (jamais une référence vivante).
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigure } from "@/lib/firebase";

export type TypePartage =
  | "ordrePassage"
  | "ordresPassage"
  | "programme"
  | "tableaux"
  | "mouvements"
  | "categories"
  | "reglages"
  | "equipe"
  | "panneaux";

export interface Partage<T = unknown> {
  type: TypePartage;
  data: T;
}

function encoder(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  octets.forEach((o) => (binaire += String.fromCharCode(o)));
  return btoa(binaire)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decoder(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(
    Uint8Array.from(binaire, (c) => c.charCodeAt(0)),
  );
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function idCourt(): string {
  const octets = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join("");
}

// Avec Firebase : l'instantané est enregistré dans la collection publique « shares » et le lien ne contient qu'un code court.
// Sans connexion ou si l'enregistrement échoue (document trop gros…), on garde l'ancien lien qui contient les données.
export async function createShare<T>(
  type: TypePartage,
  data: T,
): Promise<string> {
  const json = JSON.stringify({ type, data });
  if (firebaseConfigure && auth.currentUser) {
    try {
      if (json.length < 900_000) {
        const id = idCourt();
        await setDoc(doc(db, "shares", id), {
          ownerUid: auth.currentUser.uid,
          json,
          createdAt: Date.now(),
        });
        return id;
      }
    } catch {
      // repli sur le lien long
    }
  }
  return encoder(json);
}

export async function getShare<T = unknown>(
  id: string,
): Promise<Partage<T> | null> {
  try {
    // Un code court (10 caractères) désigne un document ; un lien plus long contient directement les données.
    const brut =
      id.length <= 20
        ? ((await getDoc(doc(db, "shares", id))).data()?.json as
            string | undefined)
        : decoder(id);
    if (!brut) return null;
    const p = JSON.parse(brut) as Partage<T>;
    return p && typeof p === "object" && p.type ? p : null;
  } catch {
    return null;
  }
}

// ——— Liens avec un fichier joint (PDF…) : valables 7 jours, le fichier est découpé en morceaux ———
// Un enregistrement Firestore est limité à 1 Mo : le fichier (encodé en texte) est rangé en morceaux dans shares/{id}/pieces/{n}.
export const DUREE_LIEN_AVEC_FICHIER = 7 * 24 * 3600 * 1000;
const TAILLE_MORCEAU = 700_000;

export interface PieceJointePartagee {
  fileName: string;
  mimeType: string;
  morceaux: number;
  taille: number;
}

export async function createShareAvecPiece<T extends object>(
  type: TypePartage,
  data: T,
  piece: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
    taille: number;
  },
): Promise<string> {
  if (!firebaseConfigure || !auth.currentUser)
    throw new Error("Connectez-vous pour joindre un fichier à un lien.");
  const id = idCourt();
  const morceaux: string[] = [];
  for (let i = 0; i < piece.dataBase64.length; i += TAILLE_MORCEAU)
    morceaux.push(piece.dataBase64.slice(i, i + TAILLE_MORCEAU));
  const attachment: PieceJointePartagee = {
    fileName: piece.fileName,
    mimeType: piece.mimeType,
    morceaux: morceaux.length,
    taille: piece.taille,
  };
  const json = JSON.stringify({ type, data: { ...data, attachment } });
  if (json.length >= 900_000)
    throw new Error(
      "Le lien serait trop volumineux : raccourcissez le texte ou partagez une seule séance.",
    );
  const expireAt = Date.now() + DUREE_LIEN_AVEC_FICHIER;
  await setDoc(doc(db, "shares", id), {
    ownerUid: auth.currentUser.uid,
    json,
    createdAt: Date.now(),
    expireAt,
  });
  for (let i = 0; i < morceaux.length; i++)
    await setDoc(doc(db, "shares", id, "pieces", String(i)), {
      data: morceaux[i],
    });
  return id;
}

// Lit le fichier d'un lien et le renvoie sous forme de Blob.
export async function lirePiece(
  id: string,
  p: PieceJointePartagee,
): Promise<Blob> {
  let b64 = "";
  for (let i = 0; i < p.morceaux; i++) {
    const m = await getDoc(doc(db, "shares", id, "pieces", String(i)));
    const texte = m.data()?.data as string | undefined;
    if (!texte) throw new Error("Ce fichier n'est plus disponible.");
    b64 += texte;
  }
  const bin = atob(b64);
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
  return new Blob([octets], { type: p.mimeType });
}

// Au lancement : supprime les liens expirés de l'utilisateur, avec leurs fichiers (le serveur refuse déjà de les servir).
export async function nettoyerPartagesExpires(): Promise<void> {
  const u = auth.currentUser;
  if (!firebaseConfigure || !u) return;
  try {
    const { collection, getDocs, query, where, deleteDoc } =
      await import("firebase/firestore");
    const lot = await getDocs(
      query(collection(db, "shares"), where("ownerUid", "==", u.uid)),
    );
    const maintenant = Date.now();
    for (const d of lot.docs) {
      const exp = d.data().expireAt as number | undefined;
      if (!exp || exp > maintenant) continue;
      const n =
        (
          JSON.parse(d.data().json as string) as {
            data?: { attachment?: { morceaux?: number } };
          }
        ).data?.attachment?.morceaux ?? 0;
      for (let i = 0; i < n; i++)
        await deleteDoc(doc(db, "shares", d.id, "pieces", String(i)));
      await deleteDoc(d.ref);
    }
  } catch {
    // Pas bloquant : le nettoyage sera retenté au prochain lancement.
  }
}
