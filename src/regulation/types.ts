export type Agres = "SAUT" | "BARRES" | "POUTRE" | "SOL";
export type AgresAvecGrille = Exclude<Agres, "SAUT">;

export type BonifFamille = "BASCULE" | "TOUR_PROCHE" | "ELAN";

// Un élément qui compte dans une autre catégorie se déclare avec extraFamilles, jamais en dupliquant la ligne.
export interface ElementFedA {
  id: string;
  agres: AgresAvecGrille;
  famille: string;
  nom: string;
  valeur: number;
  bonifFamille?: BonifFamille;
  sortie?: boolean;
  extraFamilles?: string[];
  // Appel des sauts gymniques. appelAConfirmer : classement d'usage courant, non écrit dans la brochure.
  appel?: "UN" | "DEUX";
  appelAConfirmer?: boolean;
  // Grille Fédéral B (Île-de-France) : absent = grille Fédéral A.
  grille?: "B";
  // Non autorisé en Fédéral B3.
  interditB3?: boolean;
  // Élément identique à un autre (même case de la grille) : compté une seule fois.
  identiqueA?: string;
  verified: boolean;
  sourcePage: number;
}

export interface SautFedA {
  id: string;
  nom: string;
  valeurTrampoTremp: number;
  valeurTremplin: number;
  // Fédéral A3 7/9 ans (hauteur de saut 1,00 m) : note D du saut, absente pour les sauts non autorisés à cet âge.
  valeur79?: number;
  // Fédéral B : une seule note D, quel que soit l'appareil ; niveaux où le saut existe.
  unique?: boolean;
  niveaux?: NiveauId[];
}

// ANS79 : Fédéral A3 7/9 ans, table de saut à 1,00 m, trampo-tremp uniquement.
export type Appareil = "TRAMPO_TREMP" | "TREMPLIN" | "ANS79";

export type NiveauId = "A" | "A2" | "A3" | "B1" | "B2" | "B3";
export type Programme = "A" | "B";

export interface CategorieAge {
  id: string;
  label: string;
  ageMin: number;
  ageMax?: number;
}

export interface NiveauFed {
  id: NiveauId;
  label: string;
  detail: string;
  programme: Programme;
  plafondD: number;
  // Fédéral B : règles de note D propres au niveau (Fédéral A : reglesFedA.noteD).
  regles?: { nbElementsMax: number; nbElementsMin: number; penaliteMin: number; maxBonifications: number; pointsParBonification: number };
  format: { max: number; min: number; parAgres: number; notesComptees: number };
  note?: string;
  categories: CategorieAge[];
}

export type CheckSpec =
  | { type: "FAMILLE_MIN"; famille: string; min: number }
  | { type: "BONIF_FAMILLE"; famille: BonifFamille }
  | { type: "VALEUR_FAMILLES"; valeur?: number; valeurMin?: number; familles?: string[]; min: number; sansSortie?: boolean }
  | { type: "NB_ELEMENTS"; min: number }
  | { type: "ANY_OF"; checks: CheckSpec[] }
  | { type: "ALL_OF"; checks: CheckSpec[] }
  | { type: "MANUAL" };

export interface BonificationDef {
  id: string;
  label: string;
  // Nom court affiché en tag sur les éléments qui servent cette bonification.
  court: string;
  // Éléments qui peuvent contribuer : par famille, ou par famille de bonification (barres).
  contribue: { familles?: string[]; bonifFamille?: BonifFamille; valeur?: number; valeurMin?: number; sansSortie?: boolean };
  check: CheckSpec;
}

export interface ReglesFedA {
  programme: "FEDERAL_A";
  noteD: { nbElementsMax: number; maxBonifications: number; pointsParBonification: number; maxTotal: number };
  dureeMaxSecondes: { POUTRE: number; SOL: number };
  // Fédéral A (national) ; les niveaux A2 et A3 ont leurs propres bonifications.
  bonifications: Record<AgresAvecGrille, BonificationDef[]>;
  bonificationsParNiveau?: Partial<Record<NiveauId, Record<AgresAvecGrille, BonificationDef[]>>>;
}

export interface ReglesFedB {
  programme: "FEDERAL_B";
  dureeMaxSecondes: { POUTRE: number; SOL: number };
  bonifications: Record<"B1" | "B2" | "B3", Record<AgresAvecGrille, BonificationDef[]>>;
}
