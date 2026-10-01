// Classes reprises telles quelles du site UFOLEP : même rendu, mêmes couleurs.
export const champ =
  "w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none";
export const champPetit =
  "rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none";
export const etiquette = "mb-1 block text-xs font-medium text-muted";
export const btnDegrade = "accent-gradient rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";
export const btnContour =
  "rounded border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-transform hover:border-accent-solid/60 active:scale-95 active:bg-surface-alt disabled:opacity-50";
export const btnDanger = "rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10";
export const btnRenommer =
  "rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground";
export const lienDegrade = "text-sm accent-gradient-text font-medium";
export const panneau = "rounded-lg border border-border-subtle bg-surface p-4";
export const titrePanneau = "mb-3 text-sm font-bold uppercase tracking-wide text-muted";
export const titreSection = "mb-4 text-lg font-semibold text-foreground";
export const carteLigne =
  "flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm transition hover:border-accent-solid/60";
export const pastille = "rounded-full border border-border-strong px-2 py-0.5 text-xs text-muted";
export const vide = "rounded-lg border border-dashed border-border-strong bg-surface/60 p-6 text-sm text-muted";

// Couleur des équipes : 1 turquoise, 2 vert, 3 jaune, puis d'autres teintes de la palette UFOLEP.
const COULEURS_EQUIPE = [
  { text: "text-cyan-300", border: "border-cyan-500/40", bg: "bg-cyan-500/10", dot: "bg-cyan-400" },
  { text: "text-green-300", border: "border-green-500/40", bg: "bg-green-500/10", dot: "bg-green-400" },
  { text: "text-yellow-300", border: "border-yellow-500/40", bg: "bg-yellow-500/10", dot: "bg-yellow-400" },
  { text: "text-fuchsia-300", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/10", dot: "bg-fuchsia-400" },
  { text: "text-orange-300", border: "border-orange-500/40", bg: "bg-orange-500/10", dot: "bg-orange-400" },
  { text: "text-indigo-300", border: "border-indigo-500/40", bg: "bg-indigo-500/10", dot: "bg-indigo-400" },
  { text: "text-rose-300", border: "border-rose-500/40", bg: "bg-rose-500/10", dot: "bg-rose-400" },
  { text: "text-sky-300", border: "border-sky-500/40", bg: "bg-sky-500/10", dot: "bg-sky-400" },
];

// Le numéro du nom (« Équipe 2 ») décide de la couleur ; sans numéro, on prend l'ordre de création dans le club.
export function couleurEquipe(nom: string, rang: number) {
  const n = parseInt(nom.match(/\d+/)?.[0] ?? "", 10);
  const numero = Number.isFinite(n) && n > 0 ? n : rang;
  return COULEURS_EQUIPE[(numero - 1) % COULEURS_EQUIPE.length];
}

// Même champ sans largeur imposée, pour les formulaires en ligne.
export const champLibre = champ.replace("w-full ", "");
export const onglets = "flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1";
export const ongletBouton = (actif: boolean, extra = "flex-1 px-2 py-1.5") =>
  `${extra} rounded text-xs font-semibold uppercase tracking-wide ${actif ? "accent-gradient text-white" : "text-muted hover:text-foreground"}`;

// Tags de catégorie : A vert, A2 bleu clair, A3 jaune (teintes du site UFOLEP).
export const STYLE_NIVEAU: Record<"A" | "A2" | "A3" | "B1" | "B2" | "B3", string> = {
  B1: "bg-blue-400/15 text-blue-300 border-blue-400/40",
  B2: "bg-violet-400/15 text-violet-300 border-violet-400/40",
  B3: "bg-teal-400/15 text-teal-300 border-teal-400/40",
  A: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  A2: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  A3: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
};
