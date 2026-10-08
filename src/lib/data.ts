import { deleteMusique } from "@/lib/musique";
import { supprimerResultatsCible } from "@/lib/resultats";
import { pousserVersCloud } from "@/lib/sync";
import type { Agres, Appareil, NiveauId } from "@/regulation/types";

export interface Club {
  id: string;
  nom: string;
}

export type StatutCompetence = "APPRENTISSAGE" | "MAITRISE";

export interface Gymnaste {
  id: string;
  clubId: string;
  prenom: string;
  nom: string;
  anneeNaissance: number;
  // Absent = non disponible. Clé = id d'élément ou de saut.
  competences?: Record<string, StatutCompetence>;
  // Réglages du matériel propres à la gymnaste (écart des barres, position du tremplin).
  reglages?: ReglagesCompetition;
}

export type SerieType = "MIXTE" | "GYMNIQUE" | "ACRO";

export interface Mouvement {
  id: string;
  gymnasteId: string;
  nom: string;
  agres: Agres;
  niveau: NiveauId;
  elementIds: string[];
  bonifIds: string[];
  sauts: { idSaut: string; appareil: Appareil }[];
  // Éléments pointés comme faisant partie d'une série : clé de l'élément dans la liste → type de série.
  series?: Record<string, SerieType>;
}

// Réglages du matériel à transmettre à un entraîneur remplaçant (saisis librement, en texte).
export interface ReglagesCompetition {
  ecartBarres?: string;
  tremplinCm?: string;
  tremplinPas?: string;
}

export interface Equipe {
  id: string;
  clubId: string;
  nom: string;
  niveau: NiveauId;
  categorieId: string;
  gymnasteIds: string[];
  // Ordre de passage par agrès : ids des gymnastes dans l'ordre. Propre à l'équipe, une gymnaste pouvant être dans plusieurs équipes.
  ordrePassage?: Partial<Record<Agres, string[]>>;
  reglages?: ReglagesCompetition;
  // Ordre des musiques de l'équipe : ids des gymnastes dans l'ordre.
  ordreMusique?: string[];
}

export interface Instantane {
  id: string;
  mouvementId: string;
  date: string;
  noteD: number;
  elementIds: string[];
  bonifIds: string[];
  sauts: Mouvement["sauts"];
  series?: Mouvement["series"];
  // Nom donné à l'instantané (facultatif).
  nom?: string;
}

export type TypeProgramme = "TECHNIQUE" | "PHYSIQUE";

// Séance d'un journal d'entraînement, rattachée à une gymnaste ou à une équipe entière.
export interface Seance {
  id: string;
  cible: { genre: "gymnaste" | "equipe"; id: string };
  type: TypeProgramme;
  date: string;
  contenu: string;
  createdAt: string;
}


export interface Store {
  clubs: Club[];
  gymnastes: Gymnaste[];
  equipes: Equipe[];
  mouvements?: Mouvement[];
  instantanes?: Instantane[];
  seances?: Seance[];
}

function sansOrphelins(s: Store): Store {
  const ids = new Set((s.mouvements ?? []).map((m) => m.id));
  const cibles = new Set([...s.gymnastes.map((g) => g.id), ...s.equipes.map((e) => e.id)]);
  return {
    ...s,
    instantanes: (s.instantanes ?? []).filter((i) => ids.has(i.mouvementId)),
    seances: (s.seances ?? []).filter((x) => cibles.has(x.cible.id)),
  };
}

// Stockage local (rapide, marche hors ligne) ; chaque écriture est ensuite recopiée dans Firestore par lib/sync.ts quand
// la synchronisation est active. Seules ces fonctions touchent au stockage : les pages ne savent rien du cloud.
const CLE = "ffg:v1";

function lire(): Store {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as Store;
  } catch {}
  return { clubs: [], gymnastes: [], equipes: [] };
}

function ecrireLocal(s: Store) {
  try {
    localStorage.setItem(CLE, JSON.stringify(s));
  } catch {}
}

function ecrire(s: Store) {
  ecrireLocal(s);
  pousserVersCloud(s);
}

// Pour lib/sync.ts : lecture de l'appareil et écriture venue du cloud (sans la renvoyer).
export const accesLocal = { lire, appliquer: ecrireLocal };

// Déconnexion : la copie locale est effacée pour ne pas laisser les données sur un appareil partagé ; le cloud les garde.
export function viderCopieLocale() {
  try {
    localStorage.removeItem(CLE);
  } catch {}
}

const nouvelId = () => crypto.randomUUID();

export async function getClubs(): Promise<Club[]> {
  return lire().clubs;
}

export async function createClub(nom: string): Promise<Club> {
  const s = lire();
  const club = { id: nouvelId(), nom };
  ecrire({ ...s, clubs: [...s.clubs, club] });
  return club;
}

export async function deleteClub(id: string): Promise<void> {
  const s = lire();
  for (const g of s.gymnastes.filter((x) => x.clubId === id)) {
    await deleteMusique(g.id).catch(() => undefined);
    await supprimerResultatsCible({ genre: "gymnaste", id: g.id }).catch(() => undefined);
  }
  for (const e of s.equipes.filter((x) => x.clubId === id)) await supprimerResultatsCible({ genre: "equipe", id: e.id }).catch(() => undefined);
  ecrire(
    sansOrphelins({
      ...s,
      clubs: s.clubs.filter((c) => c.id !== id),
      gymnastes: s.gymnastes.filter((g) => g.clubId !== id),
      equipes: s.equipes.filter((e) => e.clubId !== id),
      mouvements: (s.mouvements ?? []).filter((m) => {
        const g = s.gymnastes.find((x) => x.id === m.gymnasteId);
        return g && g.clubId !== id;
      }),
    }),
  );
}

export async function findOrCreateClub(nom: string): Promise<Club> {
  const s = lire();
  const existant = s.clubs.find((c) => c.nom.toLowerCase() === nom.toLowerCase());
  if (existant) return existant;
  const club = { id: nouvelId(), nom };
  ecrire({ ...s, clubs: [...s.clubs, club] });
  return club;
}

export async function renameClub(id: string, nom: string): Promise<void> {
  const s = lire();
  ecrire({ ...s, clubs: s.clubs.map((c) => (c.id === id ? { ...c, nom } : c)) });
}

export async function getGymnastes(clubId?: string): Promise<Gymnaste[]> {
  return lire().gymnastes.filter((g) => !clubId || g.clubId === clubId);
}

export async function createGymnaste(data: Omit<Gymnaste, "id">): Promise<Gymnaste> {
  const s = lire();
  const g = { id: nouvelId(), ...data };
  ecrire({ ...s, gymnastes: [...s.gymnastes, g] });
  return g;
}

export async function deleteGymnaste(id: string): Promise<void> {
  await deleteMusique(id).catch(() => undefined);
  await supprimerResultatsCible({ genre: "gymnaste", id }).catch(() => undefined);
  const s = lire();
  ecrire(
    sansOrphelins({
      ...s,
      gymnastes: s.gymnastes.filter((g) => g.id !== id),
      equipes: s.equipes.map((e) => ({ ...e, gymnasteIds: e.gymnasteIds.filter((x) => x !== id) })),
      mouvements: (s.mouvements ?? []).filter((m) => m.gymnasteId !== id),
    }),
  );
}

export async function getEquipes(clubId?: string): Promise<Equipe[]> {
  return lire().equipes.filter((e) => !clubId || e.clubId === clubId);
}

export async function updateEquipe(id: string, patch: Partial<Pick<Equipe, "nom" | "niveau" | "categorieId">>): Promise<void> {
  const s = lire();
  ecrire({ ...s, equipes: s.equipes.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
}

export async function createEquipe(data: Omit<Equipe, "id" | "gymnasteIds">): Promise<Equipe> {
  const s = lire();
  const e = { id: nouvelId(), gymnasteIds: [], ...data };
  ecrire({ ...s, equipes: [...s.equipes, e] });
  return e;
}

export async function deleteEquipe(id: string): Promise<void> {
  await supprimerResultatsCible({ genre: "equipe", id }).catch(() => undefined);
  const s = lire();
  ecrire(sansOrphelins({ ...s, equipes: s.equipes.filter((e) => e.id !== id) }));
}

export async function setEquipeMembres(id: string, gymnasteIds: string[]): Promise<void> {
  const s = lire();
  ecrire({ ...s, equipes: s.equipes.map((e) => (e.id === id ? { ...e, gymnasteIds } : e)) });
}

export async function getGymnaste(id: string): Promise<Gymnaste | undefined> {
  return lire().gymnastes.find((g) => g.id === id);
}

export async function setCompetence(gymnasteId: string, elementId: string, statut: StatutCompetence | null): Promise<void> {
  const s = lire();
  ecrire({
    ...s,
    gymnastes: s.gymnastes.map((g) => {
      if (g.id !== gymnasteId) return g;
      const competences = { ...g.competences };
      if (statut) competences[elementId] = statut;
      else delete competences[elementId];
      return { ...g, competences };
    }),
  });
}

// Toujours dans l'ordre des agrès : saut, barres, poutre, sol (quel que soit le programme).
const ORDRE_AGRES: Agres[] = ["SAUT", "BARRES", "POUTRE", "SOL"];

export async function getMouvements(gymnasteId?: string): Promise<Mouvement[]> {
  return (lire().mouvements ?? [])
    .filter((m) => !gymnasteId || m.gymnasteId === gymnasteId)
    .sort((a, b) => ORDRE_AGRES.indexOf(a.agres) - ORDRE_AGRES.indexOf(b.agres));
}

export async function getMouvement(id: string): Promise<Mouvement | undefined> {
  return (lire().mouvements ?? []).find((m) => m.id === id);
}

export async function createMouvement(data: Pick<Mouvement, "gymnasteId" | "nom" | "agres" | "niveau">): Promise<Mouvement> {
  const s = lire();
  const m: Mouvement = { id: nouvelId(), elementIds: [], bonifIds: [], sauts: [], ...data };
  ecrire({ ...s, mouvements: [...(s.mouvements ?? []), m] });
  return m;
}

export async function updateMouvement(id: string, patch: Partial<Omit<Mouvement, "id" | "gymnasteId">>): Promise<void> {
  const s = lire();
  ecrire({ ...s, mouvements: (s.mouvements ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)) });
}

export async function deleteMouvement(id: string): Promise<void> {
  const s = lire();
  ecrire(sansOrphelins({ ...s, mouvements: (s.mouvements ?? []).filter((m) => m.id !== id) }));
}

export async function getInstantanes(mouvementId: string): Promise<Instantane[]> {
  return (lire().instantanes ?? []).filter((i) => i.mouvementId === mouvementId);
}

export async function createInstantane(data: Omit<Instantane, "id" | "date">): Promise<Instantane> {
  const s = lire();
  const i = { id: nouvelId(), date: new Date().toISOString(), ...data };
  ecrire({ ...s, instantanes: [...(s.instantanes ?? []), i] });
  return i;
}

// Instantanés d'un mouvement sous la forme embarquée dans un lien de partage (consultation seule).
export async function instantanesPourPartage(mouvementId: string) {
  return (await getInstantanes(mouvementId)).map((i) => ({ nom: i.nom, date: i.date, noteD: i.noteD, elementIds: i.elementIds, bonifIds: i.bonifIds, sauts: i.sauts, series: i.series }));
}

export async function modifierInstantane(id: string, patch: Partial<Pick<Instantane, "noteD" | "elementIds" | "bonifIds" | "sauts" | "series">>): Promise<void> {
  const s = lire();
  ecrire({ ...s, instantanes: (s.instantanes ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)) });
}

export async function renommerInstantane(id: string, nom: string): Promise<void> {
  const s = lire();
  ecrire({ ...s, instantanes: (s.instantanes ?? []).map((i) => (i.id === id ? { ...i, nom } : i)) });
}

export async function deleteInstantane(id: string): Promise<void> {
  const s = lire();
  ecrire({ ...s, instantanes: (s.instantanes ?? []).filter((i) => i.id !== id) });
}

export async function updateGymnaste(id: string, patch: Partial<Pick<Gymnaste, "prenom" | "nom" | "anneeNaissance" | "clubId">>): Promise<void> {
  const s = lire();
  ecrire({ ...s, gymnastes: s.gymnastes.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
}

export async function setReglagesGymnaste(gymnasteId: string, patch: ReglagesCompetition): Promise<void> {
  const s = lire();
  ecrire({
    ...s,
    gymnastes: s.gymnastes.map((g) => (g.id === gymnasteId ? { ...g, reglages: { ...g.reglages, ...patch } } : g)),
  });
}

export async function setReglagesEquipe(equipeId: string, patch: ReglagesCompetition): Promise<void> {
  const s = lire();
  ecrire({
    ...s,
    equipes: s.equipes.map((e) => (e.id === equipeId ? { ...e, reglages: { ...e.reglages, ...patch } } : e)),
  });
}

export async function setOrdrePassage(equipeId: string, agres: Agres, gymnasteIds: string[]): Promise<void> {
  const s = lire();
  ecrire({
    ...s,
    equipes: s.equipes.map((e) => (e.id === equipeId ? { ...e, ordrePassage: { ...e.ordrePassage, [agres]: gymnasteIds } } : e)),
  });
}

export async function setOrdreMusique(equipeId: string, gymnasteIds: string[]): Promise<void> {
  const s = lire();
  ecrire({ ...s, equipes: s.equipes.map((e) => (e.id === equipeId ? { ...e, ordreMusique: gymnasteIds } : e)) });
}

// Sauvegarde : lecture et remplacement complets des données de l'appareil.
export async function exporterDonnees(): Promise<Store> {
  return lire();
}

export async function remplacerDonnees(s: Partial<Store>): Promise<void> {
  ecrire({
    clubs: s.clubs ?? [],
    gymnastes: s.gymnastes ?? [],
    equipes: s.equipes ?? [],
    mouvements: s.mouvements ?? [],
    instantanes: s.instantanes ?? [],
    seances: s.seances ?? [],
  });
}

export async function getSeances(cible: Seance["cible"], type: TypeProgramme): Promise<Seance[]> {
  return (lire().seances ?? [])
    .filter((x) => x.cible.genre === cible.genre && x.cible.id === cible.id && x.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function addSeance(cible: Seance["cible"], type: TypeProgramme, date: string, contenu: string): Promise<Seance> {
  const s = lire();
  const x = { id: nouvelId(), cible, type, date, contenu, createdAt: new Date().toISOString() };
  ecrire({ ...s, seances: [...(s.seances ?? []), x] });
  return x;
}

export async function updateSeance(id: string, date: string, contenu: string): Promise<void> {
  const s = lire();
  ecrire({ ...s, seances: (s.seances ?? []).map((x) => (x.id === id ? { ...x, date, contenu } : x)) });
}

export async function deleteSeance(id: string): Promise<void> {
  const s = lire();
  ecrire({ ...s, seances: (s.seances ?? []).filter((x) => x.id !== id) });
}
