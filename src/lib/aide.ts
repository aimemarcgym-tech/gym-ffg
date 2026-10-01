// Aide locale (tools/aide-musique.mjs) : un petit programme lancé sur l'ordinateur qui convertit un lien YouTube ou autre en MP3
// avec yt-dlp et ffmpeg. L'appli web ne fait que lui parler via 127.0.0.1 ; rien n'est hébergé en ligne.
const ADRESSE = "http://127.0.0.1:47615";

export interface EtatAide {
  ok: boolean;
  ytdlp: string | null;
  ffmpeg: boolean;
}

export async function etatAide(): Promise<EtatAide | null> {
  try {
    const r = await fetch(`${ADRESSE}/etat`, { signal: AbortSignal.timeout(1500) });
    return r.ok ? ((await r.json()) as EtatAide) : null;
  } catch {
    return null;
  }
}

// Demande à Windows de lancer l'aide via le lien ffg-aide:// (enregistré par Installer-aide-musique.bat), puis attend qu'elle réponde.
export async function demarrerAide(attenteMax = 12000): Promise<EtatAide | null> {
  const a = document.createElement("a");
  a.href = "ffg-aide://demarrer";
  a.click();
  const fin = Date.now() + attenteMax;
  while (Date.now() < fin) {
    await new Promise((r) => setTimeout(r, 700));
    const etat = await etatAide();
    if (etat) return etat;
  }
  return null;
}

export interface ResultatAide {
  blob: Blob;
  nom: string;
}

// Lance la conversion, suit sa progression, puis récupère le MP3.
export async function convertirLien(url: string, kbps: number, progression: (p: number, message: string) => void, playlist = false): Promise<ResultatAide> {
  const lancement = await fetch(`${ADRESSE}/lancer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, kbps, playlist }) });
  if (!lancement.ok) throw new Error("L’aide locale a refusé cette adresse.");
  const { id } = (await lancement.json()) as { id: string };
  try {
    for (;;) {
      await new Promise((r) => setTimeout(r, 700));
      const r = await fetch(`${ADRESSE}/travail/${id}`);
      if (!r.ok) throw new Error("Le travail a disparu côté aide locale.");
      const t = (await r.json()) as { statut: "encours" | "ok" | "erreur"; progression: number; message: string };
      progression(t.progression, t.message);
      if (t.statut === "erreur") throw new Error(t.message || "La conversion a échoué.");
      if (t.statut === "ok") break;
    }
    const fichier = await fetch(`${ADRESSE}/travail/${id}/fichier`);
    if (!fichier.ok) throw new Error("Le fichier MP3 n’a pas pu être récupéré.");
    const nom = decodeURIComponent(fichier.headers.get("X-Nom-Fichier") ?? "musique.mp3");
    return { blob: await fichier.blob(), nom };
  } finally {
    void fetch(`${ADRESSE}/travail/${id}`, { method: "DELETE" }).catch(() => undefined);
  }
}
