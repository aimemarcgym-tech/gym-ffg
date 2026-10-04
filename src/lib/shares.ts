// Partage par lien public : un instantané figé (jamais une référence vivante).
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigure } from "@/lib/firebase";

export type TypePartage = "ordrePassage" | "ordresPassage" | "programme" | "mouvements" | "categories";

export interface Partage<T = unknown> {
  type: TypePartage;
  data: T;
}

function encoder(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  octets.forEach((o) => (binaire += String.fromCharCode(o)));
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decoder(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)));
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function idCourt(): string {
  const octets = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join("");
}

// Avec Firebase : l'instantané est enregistré dans la collection publique « shares » et le lien ne contient qu'un code court.
// Sans connexion ou si l'enregistrement échoue (document trop gros…), on garde l'ancien lien qui contient les données.
export async function createShare<T>(type: TypePartage, data: T): Promise<string> {
  const json = JSON.stringify({ type, data });
  if (firebaseConfigure && auth.currentUser) {
    try {
      if (json.length < 900_000) {
        const id = idCourt();
        await setDoc(doc(db, "shares", id), { ownerUid: auth.currentUser.uid, json, createdAt: Date.now() });
        return id;
      }
    } catch {
      // repli sur le lien long
    }
  }
  return encoder(json);
}

export async function getShare<T = unknown>(id: string): Promise<Partage<T> | null> {
  try {
    // Un code court (10 caractères) désigne un document ; un lien plus long contient directement les données.
    const brut = id.length <= 20 ? ((await getDoc(doc(db, "shares", id))).data()?.json as string | undefined) : decoder(id);
    if (!brut) return null;
    const p = JSON.parse(brut) as Partage<T>;
    return p && typeof p === "object" && p.type ? p : null;
  } catch {
    return null;
  }
}
