// Partage par lien public : un instantané figé (jamais une référence vivante) est encodé dans le lien lui-même,
// ce qui marche sans serveur. Avec Firebase, seules ces deux fonctions passeront à la collection publique « shares ».
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

export async function createShare<T>(type: TypePartage, data: T): Promise<string> {
  return encoder(JSON.stringify({ type, data }));
}

export async function getShare<T = unknown>(id: string): Promise<Partage<T> | null> {
  try {
    const p = JSON.parse(decoder(id)) as Partage<T>;
    return p && typeof p === "object" && p.type ? p : null;
  } catch {
    return null;
  }
}
