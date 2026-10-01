import type { Agres } from "./types";

export const AGRES: { id: Agres; label: string }[] = [
  { id: "SAUT", label: "Saut" },
  { id: "BARRES", label: "Barres" },
  { id: "POUTRE", label: "Poutre" },
  { id: "SOL", label: "Sol" },
];

export const LIBELLE_FAMILLE: Record<string, string> = {
  BASCULES: "Bascules",
  PROCHES: "Éléments proches de la barre",
  ELANS: "Élans",
  AUTRES: "Autres",
  ENTREES: "Entrées",
  SAUTS_GYMNIQUES: "Sauts gymniques",
  TOURS: "Tours",
  ACRO_AVANT: "Acrobaties avant",
  ACRO_ARRIERE: "Acrobaties arrière",
  SORTIES: "Sorties",
  SAUTS: "Sauts",
  ACROBATIES: "Acrobaties",
  B_ENTREE: "Entrées",
  B_APPUI: "Appuis",
  B_SUSPENSION: "Suspensions",
  B_SORTIE: "Sorties",
  B_ACRO: "Acrobaties",
  B_GYM: "Éléments gymniques",
  B_MAINTIENS: "Maintiens et éléments de souplesse",
  B_ACRO_AVANT: "Acrobaties avant",
  B_ACRO_ARRIERE: "Acrobaties arrière",
  B_ACRO_LATERAL: "Acrobaties latérales",
};

export const fmt = (n: number) => n.toFixed(2).replace(".", ",");

export const ORDRE_APPEL = ["UN", "DEUX"] as const;

export const LIBELLE_APPEL: Record<(typeof ORDRE_APPEL)[number], string> = {
  UN: "Appel 1 pied",
  DEUX: "Appel 2 pieds",
};

// Valeur d'un élément : « Sans valeur » pour les éléments à 0 de la grille Fédéral B.
export const fmtValeur = (e: { valeur: number; grille?: string }) => (e.grille === "B" && e.valeur === 0 ? "Sans valeur" : fmt(e.valeur));
