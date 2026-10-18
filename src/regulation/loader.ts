import elementsJson from "./data/gaf/federal-a/elements.json";
import sautJson from "./data/gaf/federal-a/saut.json";
import reglesJson from "./data/gaf/federal-a/regles.json";
import referenceJson from "./data/gaf/federal-a/reference.json";
import niveauxJson from "./data/gaf/niveaux.json";
import categoriesAgeJson from "./data/gaf/categories-age.json";
import perf79Json from "./data/gaf/performance-79/programmes.json";
import elementsPFJson from "./data/gaf/performance-12/elements.json";
import sautsPFJson from "./data/gaf/performance-12/sauts.json";
import reglesPFJson from "./data/gaf/performance-12/regles.json";
import referencePFJson from "./data/gaf/performance-12/reference.json";
import reference79Json from "./data/gaf/performance-79/reference.json";
import referenceBJson from "./data/gaf/federal-b/reference.json";
import elementsBJson from "./data/gaf/federal-b/elements.json";
import sautBJson from "./data/gaf/federal-b/saut.json";
import reglesBJson from "./data/gaf/federal-b/regles.json";
import type {
  Agres,
  AgresAvecGrille,
  BonificationDef,
  CategorieAge,
  ElementFedA,
  NiveauFed,
  NiveauId,
  Programme,
  ReglesFedA,
  ReglesFedB,
  SautFedA,
} from "./types";

// Poutre, tous niveaux : les sauts gymniques et les éléments acrobatiques peuvent être doublés (compter deux fois).
const FAMILLES_POUTRE_DOUBLABLES = new Set([
  "SAUTS_GYMNIQUES",
  "ACRO_AVANT",
  "ACRO_ARRIERE",
  "B_GYM",
  "B_ACRO",
  "PF_PO_2",
  "PF_PO_3",
  "PF_PO_5",
]);
const elements = [
  ...(elementsJson as ElementFedA[]),
  ...(elementsBJson as ElementFedA[]),
  ...(elementsPFJson.elements as unknown as ElementFedA[]),
].map((e) =>
  e.agres === "POUTRE" && FAMILLES_POUTRE_DOUBLABLES.has(e.famille)
    ? { ...e, doublable: true }
    : e,
);
const parId = new Map(elements.map((e) => [e.id, e]));

export const reglesFedA = reglesJson as unknown as ReglesFedA;
export const sautsFedA = sautJson.sauts as SautFedA[];
export const reglesFedB = reglesBJson as unknown as ReglesFedB;

// Fédéral B : un saut a une seule note D par niveau, la même avec tremplin ou trampo-tremp.
export const sautsFedB: SautFedA[] = sautBJson.sauts.flatMap((s) =>
  Object.entries(s.valeurs).map(([niv, v]) => ({
    id: `${s.id}-${niv}`,
    nom: s.nom,
    valeurTrampoTremp: v as number,
    valeurTremplin: v as number,
    unique: true,
    niveaux: [niv as NiveauId],
  })),
);
export const regleSautB = sautBJson.regle;

// Performance (1 et 2) : valeurs du tableau des sauts ; avec le trampo-tremp, la valeur est celle du tremplin moins 1 point.
export const sautsPF: SautFedA[] = sautsPFJson.sauts.map((s) => ({
  id: s.id,
  nom: `${s.code} · ${s.nom}`,
  valeurTremplin: s.valeur,
  valeurTrampoTremp: Math.round((s.valeur - 1) * 100) / 100,
  niveaux: ["PF1", "PF2"] as NiveauId[],
}));
export const reglesPF = reglesPFJson as unknown as {
  noteD: {
    nbElementsMax: number;
    valeurMin: number;
    maxExigences: number;
    pointsParExigence: number;
    maxBonifElements: number;
    pointsParBonif: number;
  };
  penalitesNbElements: { min: number; penalite: number }[];
  exigences: Record<Agres, BonificationDef[]>;
  bonifsElements: Record<Agres, BonificationDef[]>;
  bonifNoteD: Partial<Record<Agres, { min: number; points: number }[]>>;
};
export const groupesSautsPF = sautsPFJson.groupes as Record<string, string>;

export const referenceFedA = referenceJson as {
  temps: { agres: string; label: string; valeur: string }[];
  infos: Record<string, string[]>;
  lexique: { terme: string; definition: string }[];
};

export const referenceFedB =
  referenceBJson as unknown as typeof referenceFedA & {
    infos: Record<string, string[]>;
  };

// Référence affichée dans le constructeur selon le programme du niveau.
export function getReference(niveau: NiveauId) {
  const programme = niveauxJson.niveaux.find((n) => n.id === niveau)?.programme;
  // Chaque programme a sa référence : temps, lexique et informations.
  return programme === "B"
    ? referenceFedB
    : programme === "PF"
      ? (referencePFJson as unknown as typeof referenceFedA)
      : programme === "P"
        ? (reference79Json as unknown as typeof referenceFedA)
        : referenceFedA;
}

export const niveauxFed = niveauxJson.niveaux as NiveauFed[];
// Niveaux proposés pour une équipe (hors niveaux de mouvement propres à Performance 7-9 ans) et pour un mouvement (hors niveau d'équipe).
export const niveauxEquipe = niveauxFed.filter((n) => n.pour !== "mouvement");
export const niveauxMouvement = niveauxFed.filter((n) => n.pour !== "equipe");
export const niveauxDuProgramme = (p: Programme) =>
  niveauxEquipe.filter((n) => n.programme === p);
export const anneeSaison = niveauxJson.anneeSaison;

export function getNiveau(id: NiveauId): NiveauFed {
  return niveauxFed.find((n) => n.id === id)!;
}

// L'âge se calcule sur l'année de naissance : 10 ans = né en 2017 pour la saison 2026-2027.
export function ageEnSaison(anneeNaissance: number): number {
  return anneeSaison - anneeNaissance;
}

// Nombre de notes de départ qui comptent par agrès dans un total d'équipe : celui de la catégorie s'il est précisé, sinon celui du programme.
export function getNotesComptees(
  niveau: NiveauId,
  categorieId?: string,
): number {
  const n = getNiveau(niveau);
  return (
    (categorieId
      ? n.categories.find((c) => c.id === categorieId)?.notesComptees
      : undefined) ?? n.format.notesComptees
  );
}

export function getCategorie(
  niveau: NiveauId,
  categorieId: string,
): CategorieAge | undefined {
  return getNiveau(niveau).categories.find((c) => c.id === categorieId);
}

export function ageDansCategorie(age: number, c: CategorieAge): boolean {
  return age >= c.ageMin && (c.ageMax === undefined || age <= c.ageMax);
}

export const categoriesIndividuel = categoriesAgeJson.individuel
  .categories as CategorieAge[];
export const sourceIndividuel = categoriesAgeJson.individuel.source;

// Années de naissance d'une catégorie, dans le style du site UFOLEP : « 2017/2014 » ou « 2017 et avant ».
export function anneesCategorie(c: CategorieAge): string {
  const debut = anneeSaison - c.ageMin;
  if (c.ageMax === undefined) return `${debut} et avant`;
  return c.ageMax === c.ageMin
    ? String(debut)
    : `${debut}/${anneeSaison - c.ageMax}`;
}

// Individuelle : en Fédéral A les catégories sont les âges un par un (10 ans … 18 ans et plus) ; les autres programmes gardent leurs catégories.
export function categoriesIndividuelles(niveau: NiveauId): CategorieAge[] {
  return programmeDe(niveau) === "A"
    ? categoriesIndividuel
    : getNiveau(niveau).categories;
}

// Catégorie d'une individuelle ; si l'identifiant enregistré n'existe pas dans la liste, celle de l'âge de la gymnaste.
export function categorieIndividuelle(
  niveau: NiveauId,
  categorieId: string,
  anneeNaissance: number,
): CategorieAge {
  const liste = categoriesIndividuelles(niveau);
  return (
    liste.find((c) => c.id === categorieId) ??
    liste.find((c) => ageDansCategorie(ageEnSaison(anneeNaissance), c)) ??
    liste[0]
  );
}

// Une catégorie convient quand toutes les gymnastes de l'équipe entrent dans sa tranche d'âge.
export function categoriesPossibles(
  niveau: NiveauId,
  anneesNaissance: number[],
): CategorieAge[] {
  if (!anneesNaissance.length) return [];
  return getNiveau(niveau).categories.filter((c) =>
    anneesNaissance.every((a) => ageDansCategorie(ageEnSaison(a), c)),
  );
}

// Tableau âge / année de naissance de la saison.
export const anneesParAge: { age: number; annee: string }[] = Object.entries(
  categoriesAgeJson.anneesNaissance,
)
  .map(([age, annee]) => ({ age: Number(age), annee: String(annee) }))
  .sort((a, b) => a.age - b.age);

export function getElementsFedA(agres: AgresAvecGrille): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && !e.grille);
}

export function getElementsFedPF(agres: AgresAvecGrille): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && e.grille === "PF");
}

export function getElementsFedB(agres: AgresAvecGrille): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && e.grille === "B");
}

// Un identifiant « XXX#2 » désigne la seconde occurrence d'un élément doublable.
export function getElementFedA(id: string): ElementFedA | undefined {
  return parId.get(id.split("#")[0]);
}

export type ElementChoisi = ElementFedA & { cle: string };

// Éléments d'un mouvement, avec une clé unique par occurrence (utile quand un élément est doublé).
export function elementsChoisis(
  ids: string[],
  agres: string,
  niveau: NiveauId,
): ElementChoisi[] {
  return ids
    .map((cle) => {
      const e = getElementFedA(cle);
      return e ? { ...e, cle } : undefined;
    })
    .filter(
      (e): e is ElementChoisi =>
        !!e && e.agres === agres && elementAutorise(e, niveau),
    );
}

export function getSautFedA(id: string): SautFedA | undefined {
  return (
    sautsFedA.find((s) => s.id === id) ??
    sautsFedB.find((s) => s.id === id) ??
    sautsPF.find((s) => s.id === id)
  );
}

export function programmeDe(niveau: NiveauId): Programme {
  return getNiveau(niveau).programme;
}

// ——— Performance 7-9 ans : mouvements imposés, chaque option validée rapporte 0,50 point ———
export interface ItemPerf79 {
  id: string;
  texte: string;
  type?: "OU" | "ET";
  option?: number;
}
export interface SequencePerf79 {
  nom: string;
  items: ItemPerf79[];
}

export const estPerf79 = (niveau: NiveauId) => programmeDe(niveau) === "P";

export const perf79 = perf79Json as unknown as {
  pointsParOption: number;
  niveaux: Record<string, { base: number; max: number }>;
  saut: { niveau: string; valeur: number; texte: string }[];
  barres: Record<string, SequencePerf79[]>;
  poutre: Record<string, SequencePerf79[]>;
  sol: Record<string, SequencePerf79[]>;
};

// Niveaux possibles d'un agrès : saut et barres de 1 à 3, poutre et sol de 1 à 4.
export function niveauxPerf79(agres: Agres): NiveauId[] {
  return (
    agres === "POUTRE" || agres === "SOL"
      ? ["P1", "P2", "P3", "P4"]
      : ["P1", "P2", "P3"]
  ) as NiveauId[];
}

// Niveau le plus haut autorisé selon l'âge (7 ans : niveau 1 ; 8 ans : niveaux 1 à 3 ; 9 ans : 1 à 3 au saut et aux barres, 1 à 4 à la poutre et au sol)
// et selon la catégorie de l'équipe (7 ans : 1 ; 7-8 ans : 1 à 3 ; 7-9 ans : 1 à 2 ou 1 à 4).
export function niveauxPerf79Autorises(
  agres: Agres,
  age: number | null,
  categorieId?: string,
): NiveauId[] {
  const parAge = age === null ? 4 : age <= 7 ? 1 : age === 8 ? 3 : 4;
  const parCategorie = categorieId
    ? (NIVEAU_HAUT_CATEGORIE[categorieId] ?? 4)
    : 4;
  const haut = Math.min(parAge, parCategorie);
  return niveauxPerf79(agres).filter((id) => Number(id.slice(1)) <= haut);
}

export function sequencesPerf79(
  agres: Agres,
  niveau: NiveauId,
): SequencePerf79[] {
  if (agres === "SAUT") return [];
  return (
    perf79[
      agres === "BARRES" ? "barres" : agres === "POUTRE" ? "poutre" : "sol"
    ][niveau] ?? []
  );
}

// Identifiants des options d'un mouvement imposé.
export function optionsPerf79(agres: Agres, niveau: NiveauId): string[] {
  return sequencesPerf79(agres, niveau).flatMap((s) =>
    s.items.filter((i) => i.option).map((i) => i.id),
  );
}

export function noteDPerf79(
  agres: Agres,
  niveau: NiveauId,
  choisies: string[],
): number {
  if (agres === "SAUT")
    return perf79.saut.find((s) => s.niveau === niveau)?.valeur ?? 0;
  const valides = new Set(optionsPerf79(agres, niveau));
  const n = new Set(choisies.filter((id) => valides.has(id))).size;
  return (perf79.niveaux[niveau]?.base ?? 0) + n * perf79.pointsParOption;
}

// Niveau le plus haut autorisé à un agrès pour une catégorie d'équipe : 7 ans niveau 1 ; 7-8 ans niveaux 1 à 3 ; 7-9 ans niveaux 1 à 2 ou 1 à 4.
const NIVEAU_HAUT_CATEGORIE: Record<string, number> = {
  "7": 1,
  "7-8": 3,
  "7-9a": 2,
  "7-9b": 4,
};

export function noteDMaxPerf79(
  agres: Agres,
  niveau: NiveauId,
  categorieId?: string,
): number {
  if (niveau === "P79") {
    const permis = niveauxPerf79(agres).filter(
      (id) =>
        Number(id.slice(1)) <=
        (NIVEAU_HAUT_CATEGORIE[categorieId ?? "7-9b"] ?? 4),
    );
    return Math.max(0, ...permis.map((id) => noteDMaxPerf79(agres, id)));
  }
  return agres === "SAUT"
    ? (perf79.saut.find((s) => s.niveau === niveau)?.valeur ?? 0)
    : (perf79.niveaux[niveau]?.max ?? 0);
}

// Sauts proposés pour un niveau : la table Fédéral A, ou celle du niveau Fédéral B.
export function getSautsNiveau(niveau: NiveauId): SautFedA[] {
  const p = programmeDe(niveau);
  return (
    p === "A" ? sautsFedA : p === "B" ? sautsFedB : p === "PF" ? sautsPF : []
  ).filter((s) => s.niveaux?.includes(niveau));
}

// Éléments réellement autorisés dans un niveau (les éléments C sont interdits en B2 et B3, certains éléments aux barres en B3).
export function elementAutorise(e: ElementFedA, niveau: NiveauId): boolean {
  const attendue =
    programmeDe(niveau) === "B"
      ? "B"
      : programmeDe(niveau) === "PF"
        ? "PF"
        : undefined;
  if (e.grille !== attendue) return false;
  if (e.grille === "PF") return true;
  if (e.grille !== "B") return true;
  if ((niveau === "B2" || niveau === "B3") && e.valeur >= 0.8) return false;
  if (niveau === "B3" && e.interditB3) return false;
  return true;
}

export function getElementsNiveau(
  agres: AgresAvecGrille,
  niveau: NiveauId,
): ElementFedA[] {
  return elements.filter(
    (e) => e.agres === agres && elementAutorise(e, niveau),
  );
}

export function getBonifications(
  niveau: NiveauId,
  agres: AgresAvecGrille,
): BonificationDef[] {
  if (programmeDe(niveau) === "PF") return reglesPF.exigences[agres] ?? [];
  if (programmeDe(niveau) === "B")
    return reglesFedB.bonifications[niveau as "B1" | "B2" | "B3"][agres];
  return (
    reglesFedA.bonificationsParNiveau?.[niveau]?.[agres] ??
    reglesFedA.bonifications[agres]
  );
}

// Règles de la note D d'un niveau : nombre d'éléments comptés, bonifications, pénalité en cas d'éléments insuffisants.
export function reglesNiveau(niveau: NiveauId) {
  const n = getNiveau(niveau);
  if (n.programme === "PF")
    return {
      nbElementsMax: reglesPF.noteD.nbElementsMax,
      nbElementsMin: 0,
      penaliteMin: 0,
      maxBonifications: reglesPF.noteD.maxExigences,
      pointsParBonification: reglesPF.noteD.pointsParExigence,
    };
  if (n.regles) return n.regles;
  const r = reglesFedA.noteD;
  return {
    nbElementsMax: r.nbElementsMax,
    nbElementsMin: 0,
    penaliteMin: 0,
    maxBonifications: r.maxBonifications,
    pointsParBonification: r.pointsParBonification,
  };
}
