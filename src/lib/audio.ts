import { Mp3Encoder } from "@breezystack/lamejs";

// Tout se passe dans le navigateur : décodage (Web Audio) puis encodage MP3 (lamejs). Aucun fichier ne quitte l'appareil.

export interface Segment {
  debut: number;
  fin: number;
}

export async function decoderFichier(fichier: Blob): Promise<AudioBuffer> {
  const contexte = new AudioContext();
  try {
    return await contexte.decodeAudioData(await fichier.arrayBuffer());
  } finally {
    void contexte.close();
  }
}

// Amplitude maximale par tranche, pour dessiner la forme d'onde.
export function pics(buffer: AudioBuffer, nb: number): number[] {
  const canaux = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const taille = Math.max(1, Math.floor(buffer.length / nb));
  return Array.from({ length: nb }, (_, i) => {
    let max = 0;
    const debut = i * taille;
    const fin = Math.min(buffer.length, debut + taille);
    for (const c of canaux) for (let j = debut; j < fin; j += Math.max(1, Math.floor(taille / 40))) max = Math.max(max, Math.abs(c[j]));
    return max;
  });
}

// Passages conservés : tout le morceau moins les passages retirés (fusionnés s'ils se chevauchent).
export function fusionner(retraits: Segment[]): Segment[] {
  const tries = retraits.filter((r) => r.fin > r.debut).sort((a, b) => a.debut - b.debut);
  const resultat: Segment[] = [];
  for (const r of tries) {
    const dernier = resultat[resultat.length - 1];
    if (dernier && r.debut <= dernier.fin) dernier.fin = Math.max(dernier.fin, r.fin);
    else resultat.push({ ...r });
  }
  return resultat;
}

export function passagesConserves(duree: number, retraits: Segment[]): Segment[] {
  const garde: Segment[] = [];
  let curseur = 0;
  for (const r of fusionner(retraits)) {
    if (r.debut > curseur) garde.push({ debut: curseur, fin: Math.min(r.debut, duree) });
    curseur = Math.max(curseur, r.fin);
  }
  if (curseur < duree) garde.push({ debut: curseur, fin: duree });
  return garde.filter((s) => s.fin - s.debut > 0.001);
}

const cede = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const FREQUENCES_MP3 = [32000, 44100, 48000];

// Le bip de départ des musiques de gym (public/bip.mp3), décodé une seule fois.
let bip: Promise<AudioBuffer> | null = null;
export function chargerBip(): Promise<AudioBuffer> {
  bip ??= fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/bip.mp3`)
    .then((r) => {
      if (!r.ok) throw new Error("Le bip est introuvable.");
      return r.blob();
    })
    .then(decoderFichier)
    .catch((e) => {
      bip = null;
      throw e;
    });
  return bip;
}

// Même fréquence d'échantillonnage que la musique, pour pouvoir coller le bip devant.
async function auMemeFormat(source: AudioBuffer, frequence: number): Promise<AudioBuffer> {
  if (source.sampleRate === frequence) return source;
  const hors = new OfflineAudioContext(source.numberOfChannels, Math.ceil(source.duration * frequence), frequence);
  const lecteur = hors.createBufferSource();
  lecteur.buffer = source;
  lecteur.connect(hors.destination);
  lecteur.start();
  return hors.startRendering();
}

// Assemble les passages conservés (avec un fondu de 8 ms à chaque raccord pour éviter les claquements) et les encode en MP3.
// `prefixe` : son à placer tout au début (le bip), avant le premier passage conservé.
export async function encoderMp3(buffer: AudioBuffer, conserves: Segment[], kbps: number, progression?: (p: number) => void, prefixe?: AudioBuffer): Promise<Blob> {
  const frequence = buffer.sampleRate;
  if (!FREQUENCES_MP3.includes(frequence)) {
    // Fréquence rare : on rééchantillonne à 44,1 kHz avant l'encodage.
    const cible = 44100;
    const hors = new OfflineAudioContext(buffer.numberOfChannels, Math.ceil(buffer.duration * cible), cible);
    const source = hors.createBufferSource();
    source.buffer = buffer;
    source.connect(hors.destination);
    source.start();
    return encoderMp3(await hors.startRendering(), conserves, kbps, progression, prefixe);
  }

  const nbCanaux = Math.min(2, buffer.numberOfChannels);
  const fondu = Math.round(frequence * 0.008);
  const morceaux: Float32Array[][] = Array.from({ length: nbCanaux }, () => []);
  let total = 0;
  if (prefixe) {
    const p = await auMemeFormat(prefixe, frequence);
    // Bip mono sur une musique stéréo : on le double ; bip stéréo sur musique mono : on garde le premier canal.
    for (let c = 0; c < nbCanaux; c++) morceaux[c].push(p.getChannelData(Math.min(c, p.numberOfChannels - 1)).slice());
    total += p.length;
  }
  conserves.forEach((s, index) => {
    const a = Math.max(0, Math.floor(s.debut * frequence));
    const b = Math.min(buffer.length, Math.floor(s.fin * frequence));
    if (b <= a) return;
    for (let c = 0; c < nbCanaux; c++) {
      const copie = buffer.getChannelData(c).slice(a, b);
      // Fondu seulement aux raccords : pas au tout début ni à la toute fin du morceau d'origine.
      if (index > 0 || s.debut > 0 || prefixe) for (let i = 0; i < Math.min(fondu, copie.length); i++) copie[i] *= i / fondu;
      if (index < conserves.length - 1 || s.fin < buffer.duration) for (let i = 0; i < Math.min(fondu, copie.length); i++) copie[copie.length - 1 - i] *= i / fondu;
      morceaux[c].push(copie);
    }
    total += b - a;
  });
  if (total === 0) throw new Error("Il ne reste rien à conserver : le montage est vide.");

  const encodeur = new Mp3Encoder(nbCanaux, frequence, kbps);
  const sorties: Uint8Array[] = [];
  const pas = 1152 * 16;
  const enEntiers = (f: Float32Array) => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) out[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
    return out;
  };
  const canaux = morceaux.map((liste) => {
    const plat = new Float32Array(total);
    let decalage = 0;
    for (const m of liste) {
      plat.set(m, decalage);
      decalage += m.length;
    }
    return plat;
  });

  for (let i = 0; i < total; i += pas) {
    const gauche = enEntiers(canaux[0].subarray(i, i + pas));
    const bloc = nbCanaux === 2 ? encodeur.encodeBuffer(gauche, enEntiers(canaux[1].subarray(i, i + pas))) : encodeur.encodeBuffer(gauche);
    if (bloc.length) sorties.push(bloc);
    progression?.(Math.min(1, i / total));
    await cede();
  }
  const fin = encodeur.flush();
  if (fin.length) sorties.push(fin);
  progression?.(1);
  return new Blob(sorties as BlobPart[], { type: "audio/mpeg" });
}

export const QUALITES = [
  { id: "eco", label: "Économique (128 kbps)", kbps: 128 },
  { id: "equilibree", label: "Équilibrée (192 kbps)", kbps: 192 },
  { id: "haute", label: "Haute (320 kbps)", kbps: 320 },
] as const;

export function nomMp3(nom: string, suffixe = ""): string {
  return nom.replace(/\.[^./\\]+$/, "") + suffixe + ".mp3";
}

// « 1:30 », « 90 », « 1m30 », « 1:02:03 » → secondes ; null si illisible.
export function lireTemps(texte: string): number | null {
  const t = texte.trim().toLowerCase().replace(",", ".");
  if (!t) return null;
  const m = t.match(/^(\d+)\s*m(?:in)?\s*(\d+(?:\.\d+)?)?\s*s?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  if (/^\d+(?:\.\d+)?$/.test(t)) return Number(t);
  const parties = t.split(":");
  if (parties.length < 2 || parties.length > 3 || parties.some((p) => !/^\d+(?:\.\d+)?$/.test(p))) return null;
  return parties.map(Number).reduce((total, p) => total * 60 + p, 0);
}

export function formaterTemps(secondes: number): string {
  if (!Number.isFinite(secondes) || secondes < 0) return "0:00";
  const m = Math.floor(secondes / 60);
  const s = secondes - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
