import elementsJson from "./data/gaf/federal-a/elements.json";
import sautJson from "./data/gaf/federal-a/saut.json";
import reglesJson from "./data/gaf/federal-a/regles.json";
import referenceJson from "./data/gaf/federal-a/reference.json";
import niveauxJson from "./data/gaf/niveaux.json";
import categoriesAgeJson from "./data/gaf/categories-age.json";
import referenceBJson from "./data/gaf/federal-b/reference.json";
import elementsBJson from "./data/gaf/federal-b/elements.json";
import sautBJson from "./data/gaf/federal-b/saut.json";
import reglesBJson from "./data/gaf/federal-b/regles.json";
import type { AgresAvecGrille, BonificationDef, CategorieAge, ElementFedA, NiveauFed, NiveauId, Programme, ReglesFedA, ReglesFedB, SautFedA } from "./types";

const elements = [...(elementsJson as ElementFedA[]), ...(elementsBJson as ElementFedA[])];
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

export const referenceFedA = referenceJson as {
  temps: { agres: string; label: string; valeur: string }[];
  infos: Record<string, string[]>;
  lexique: { terme: string; definition: string }[];
};

export const referenceFedB = referenceBJson as unknown as typeof referenceFedA & { infos: Record<string, string[]> };

// Référence affichée dans le constructeur selon le programme du niveau.
export function getReference(niveau: NiveauId) {
  return niveauxJson.niveaux.find((n) => n.id === niveau)?.programme === "B" ? referenceFedB : referenceFedA;
}

export const niveauxFed = niveauxJson.niveaux as NiveauFed[];
export const niveauxDuProgramme = (p: Programme) => niveauxFed.filter((n) => n.programme === p);
export const anneeSaison = niveauxJson.anneeSaison;

export function getNiveau(id: NiveauId): NiveauFed {
  return niveauxFed.find((n) => n.id === id)!;
}

// L'âge se calcule sur l'année de naissance : 10 ans = né en 2017 pour la saison 2026-2027.
export function ageEnSaison(anneeNaissance: number): number {
  return anneeSaison - anneeNaissance;
}

export function getCategorie(niveau: NiveauId, categorieId: string): CategorieAge | undefined {
  return getNiveau(niveau).categories.find((c) => c.id === categorieId);
}

export function ageDansCategorie(age: number, c: CategorieAge): boolean {
  return age >= c.ageMin && (c.ageMax === undefined || age <= c.ageMax);
}

export const categoriesIndividuel = categoriesAgeJson.individuel.categories as CategorieAge[];
export const sourceIndividuel = categoriesAgeJson.individuel.source;

// Années de naissance d'une catégorie, dans le style du site UFOLEP : « 2017/2014 » ou « 2017 et avant ».
export function anneesCategorie(c: CategorieAge): string {
  const debut = anneeSaison - c.ageMin;
  if (c.ageMax === undefined) return `${debut} et avant`;
  return c.ageMax === c.ageMin ? String(debut) : `${debut}/${anneeSaison - c.ageMax}`;
}

// Une catégorie convient quand toutes les gymnastes de l'équipe entrent dans sa tranche d'âge.
export function categoriesPossibles(niveau: NiveauId, anneesNaissance: number[]): CategorieAge[] {
  if (!anneesNaissance.length) return [];
  return getNiveau(niveau).categories.filter((c) => anneesNaissance.every((a) => ageDansCategorie(ageEnSaison(a), c)));
}

// Tableau âge / année de naissance de la saison.
export const anneesParAge: { age: number; annee: string }[] = Object.entries(categoriesAgeJson.anneesNaissance)
  .map(([age, annee]) => ({ age: Number(age), annee: String(annee) }))
  .sort((a, b) => a.age - b.age);

export function getElementsFedA(agres: AgresAvecGrille): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && e.grille !== "B");
}

export function getElementsFedB(agres: AgresAvecGrille): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && e.grille === "B");
}

export function getElementFedA(id: string): ElementFedA | undefined {
  return parId.get(id);
}

export function getSautFedA(id: string): SautFedA | undefined {
  return sautsFedA.find((s) => s.id === id) ?? sautsFedB.find((s) => s.id === id);
}

export function programmeDe(niveau: NiveauId): Programme {
  return getNiveau(niveau).programme;
}

// Sauts proposés pour un niveau : la table Fédéral A, ou celle du niveau Fédéral B.
export function getSautsNiveau(niveau: NiveauId): SautFedA[] {
  return (programmeDe(niveau) === "A" ? sautsFedA : sautsFedB).filter((s) => s.niveaux?.includes(niveau));
}

// Éléments réellement autorisés dans un niveau (les éléments C sont interdits en B2 et B3, certains éléments aux barres en B3).
export function elementAutorise(e: ElementFedA, niveau: NiveauId): boolean {
  if ((e.grille === "B") !== (programmeDe(niveau) === "B")) return false;
  if (e.grille !== "B") return true;
  if ((niveau === "B2" || niveau === "B3") && e.valeur >= 0.8) return false;
  if (niveau === "B3" && e.interditB3) return false;
  return true;
}

export function getElementsNiveau(agres: AgresAvecGrille, niveau: NiveauId): ElementFedA[] {
  return elements.filter((e) => e.agres === agres && elementAutorise(e, niveau));
}

export function getBonifications(niveau: NiveauId, agres: AgresAvecGrille): BonificationDef[] {
  if (programmeDe(niveau) === "B") return reglesFedB.bonifications[niveau as "B1" | "B2" | "B3"][agres];
  return reglesFedA.bonificationsParNiveau?.[niveau]?.[agres] ?? reglesFedA.bonifications[agres];
}

// Règles de la note D d'un niveau : nombre d'éléments comptés, bonifications, pénalité en cas d'éléments insuffisants.
export function reglesNiveau(niveau: NiveauId) {
  const n = getNiveau(niveau);
  if (n.regles) return n.regles;
  const r = reglesFedA.noteD;
  return { nbElementsMax: r.nbElementsMax, nbElementsMin: 0, penaliteMin: 0, maxBonifications: r.maxBonifications, pointsParBonification: r.pointsParBonification };
}
