import { programmeDe, reglesPF, estPerf79, noteDMaxPerf79, noteDPerf79, elementAutorise, getBonifications, getElementFedA, getElementsNiveau, getNiveau, getSautFedA, getSautsNiveau, reglesNiveau } from "@/regulation/loader";
import type { Agres, Appareil, AgresAvecGrille, BonificationDef, CheckSpec, ElementFedA, NiveauId } from "@/regulation/types";

export interface CheckResult {
  ok: boolean;
  manual?: boolean;
}

function dansFamille(e: ElementFedA, famille: string) {
  return e.famille === famille || !!e.extraFamilles?.includes(famille);
}

export function evaluateCheck(spec: CheckSpec, elements: ElementFedA[]): CheckResult {
  switch (spec.type) {
    case "FAMILLE_MIN":
      return { ok: elements.filter((e) => dansFamille(e, spec.famille)).length >= spec.min };
    case "BONIF_FAMILLE":
      return { ok: elements.some((e) => e.bonifFamille === spec.famille) };
    case "VALEUR_FAMILLES":
      return {
        ok:
          elements.filter(
            (e) =>
              (spec.valeur === undefined || e.valeur === spec.valeur) &&
              (spec.valeurMin === undefined || e.valeur >= spec.valeurMin) &&
              !(spec.sansSortie && e.sortie) &&
              (!spec.familles || spec.familles.some((f) => dansFamille(e, f))),
          ).length >= spec.min,
      };
    case "NB_ELEMENTS":
      return { ok: elements.length >= spec.min };
    case "ELEMENTS":
      return { ok: elements.some((e) => spec.ids.includes(e.id)) };
    case "ANY_OF": {
      const resultats = spec.checks.map((c) => evaluateCheck(c, elements));
      return { ok: resultats.some((r) => r.ok), manual: resultats.some((r) => r.manual) };
    }
    case "ALL_OF":
      return { ok: spec.checks.every((c) => evaluateCheck(c, elements).ok) };
    case "MANUAL":
      return { ok: false, manual: true };
  }
}

export interface BonifEtat {
  def: BonificationDef;
  eligible: boolean;
  manuelle: boolean;
}

export function etatBonifications(agres: AgresAvecGrille, elements: ElementFedA[], niveau: NiveauId = "A"): BonifEtat[] {
  return getBonifications(niveau, agres).map((def) => {
    const r = evaluateCheck(def.check, elements);
    return { def, eligible: r.ok, manuelle: !!r.manual };
  });
}

export interface NoteD {
  elementsRetenus: ElementFedA[];
  totalElements: number;
  bonifsRetenues: string[];
  nbBonifications: number;
  totalBonifications: number;
  total: number;
  plafonne: boolean;
  // Fédéral B : pénalité (négative) quand la gymnaste présente trop peu d'éléments, à déduire de la note finale.
  penalite: number;
  nbDistincts: number;
  // Performance 1 : bonifications de la note finale (note D + éléments), qui ne font pas partie de la note D.
  bonifsFinale: number;
  // Performance, poutre et sol : éléments gymniques et acrobatiques parmi les éléments retenus (3 et 3 minimum).
  nbGymRetenus: number;
  nbAcroRetenus: number;
}

// Éléments identiques comptés une fois; un élément ne compte que s'il est reconnu, ce que le coach garantit en ne le saisissant pas sinon.
// Une bonification validée ne compte que si elle reste possible avec les éléments choisis.
export function calculerNoteD(
  agres: AgresAvecGrille,
  idsElements: string[],
  idsBonifsValidees: string[],
  niveau: NiveauId = "A",
): NoteD {
  const { nbElementsMax, nbElementsMin, penaliteMin, maxBonifications, pointsParBonification } = reglesNiveau(niveau);

  // Un élément identique à un autre (même case de la grille) n'est compté qu'une fois ; un élément interdit dans le niveau ne compte pas.
  const vus = new Set<string>();
  const occurrences = new Map<string, number>();
  const distincts = [...new Set(idsElements)]
    .map(getElementFedA)
    .filter((e): e is ElementFedA => !!e && e.agres === agres && elementAutorise(e, niveau))
    .filter((e) => {
      // Un élément doublable peut compter deux fois ; les autres une seule.
      if (e.doublable) {
        const n = occurrences.get(e.id) ?? 0;
        occurrences.set(e.id, n + 1);
        return n < 2;
      }
      const cle = e.identiqueA ?? e.id;
      const doublon = vus.has(cle) || vus.has(e.id);
      vus.add(cle);
      vus.add(e.id);
      return !doublon;
    });

  // Performance : seuls les éléments de valeur 0,10 minimum comptent dans les 8 meilleures valeurs (les autres comptent pour l'exercice trop court).
  const pf = programmeDe(niveau) === "PF";
  const comptables = pf ? distincts.filter((e) => e.valeur >= reglesPF.noteD.valeurMin) : distincts;
  // Poutre et sol (Performance) : parmi les 8 éléments pris en compte, 3 gymniques, 3 acrobatiques et 2 au choix au minimum, de valeur 0,10 minimum.
  const parValeur = (l: ElementFedA[]) => [...l].sort((a, b) => b.valeur - a.valeur);
  const elementsRetenus =
    pf && (agres === "POUTRE" || agres === "SOL")
      ? (() => {
          const gym = parValeur(comptables.filter((e) => e.nature === "g")).slice(0, 3);
          const acro = parValeur(comptables.filter((e) => e.nature === "a" || e.nature === "s" || e.nature === "o")).slice(0, 3);
          const pris = new Set([...gym, ...acro]);
          const choix = parValeur(comptables.filter((e) => !pris.has(e))).slice(0, Math.max(0, nbElementsMax - pris.size));
          return parValeur([...gym, ...acro, ...choix]);
        })()
      : parValeur(comptables).slice(0, nbElementsMax);
  const totalElements = round2(elementsRetenus.reduce((s, e) => s + e.valeur, 0));

  // Les bonifications que les éléments prouvent (eligible) sont retenues d'office, dans l'ordre du règlement, jusqu'au maximum ;
  // seules celles qui ne se vérifient pas toutes seules (manuelles) demandent une confirmation.
  const etats = etatBonifications(agres, distincts, niveau);
  const manuellesConfirmees = new Set(idsBonifsValidees);
  const bonifsRetenues = [
    ...etats.filter((b) => !b.eligible && b.manuelle && manuellesConfirmees.has(b.def.id)),
    ...etats.filter((b) => b.eligible),
  ]
    .map((b) => b.def.id)
    .slice(0, maxBonifications);
  const nbBonifications = bonifsRetenues.length;
  const totalBonifications = round2(nbBonifications * pointsParBonification);

  // Le plafond du niveau s'applique bonifications comprises.
  const plafond = getNiveau(niveau).plafondD;
  const brut = round2(totalElements + totalBonifications);
  const total = Math.min(brut, plafond);
  const penalite = pf ? (reglesPF.penalitesNbElements.find((p) => distincts.length >= p.min)?.penalite ?? 0) : nbElementsMin > 0 && distincts.length < nbElementsMin ? penaliteMin : 0;
  return { elementsRetenus, totalElements, bonifsRetenues, nbBonifications, totalBonifications, total, plafonne: total < brut, penalite, nbDistincts: distincts.length, bonifsFinale: bonifsFinalePF(niveau, agres, total, idsBonifsValidees), nbGymRetenus: elementsRetenus.filter((e) => e.nature === "g").length, nbAcroRetenus: elementsRetenus.filter((e) => e.nature === "a" || e.nature === "s" || e.nature === "o").length };
}

// Performance 1 uniquement : bonification sur la note D (selon sa valeur) + bonifications sur éléments confirmées (2 points au maximum, 0,50 au saut) ;
// elles s'ajoutent à la note finale et ne font pas partie de la note D.
export function bonifsFinalePF(niveau: NiveauId, agres: Agres, noteD: number, confirmees: string[]): number {
  if (niveau !== "PF1") return 0;
  const defs = reglesPF.bonifsElements[agres] ?? [];
  const nb = defs.filter((b) => confirmees.includes(b.id)).length;
  const sursElements = Math.min(nb * reglesPF.noteD.pointsParBonif, agres === "SAUT" ? 0.5 : reglesPF.noteD.maxBonifElements);
  const palier = [...(reglesPF.bonifNoteD[agres] ?? [])].reverse().find((p) => noteD >= p.min);
  return round2(sursElements + (palier?.points ?? 0));
}

// Bonifications que cet élément peut servir (données de regles.json, rien de codé par agrès).
export function bonifsServies(element: ElementFedA, niveau: NiveauId = "A"): BonificationDef[] {
  return getBonifications(niveau, element.agres).filter((b) => {
    const { familles, bonifFamille, valeur, valeurMin, sansSortie } = b.contribue;
    if (valeur !== undefined && element.valeur !== valeur) return false;
    if (valeurMin !== undefined && element.valeur < valeurMin) return false;
    if (sansSortie && element.sortie) return false;
    return (!!bonifFamille && element.bonifFamille === bonifFamille) || (!!familles && familles.some((f) => dansFamille(element, f))) || (valeur !== undefined && !familles);
  });
}

// Éléments « Bonus » (tag) : en Fédéral A, uniquement ceux marqués dans la brochure (les éléments en bleu) ; ils sont distincts des
// bonifications de chaque niveau, qui se valident dans l'Analyse. En Fédéral B, les éléments qui servent une bonification du niveau.
export function bonifsElement(element: ElementFedA, niveau: NiveauId = "A"): BonificationDef[] {
  if (element.grille === "B") return bonifsServies(element, niveau);
  return element.bonifFamille ? bonifsServies(element, "A").filter((b) => !!b.contribue.bonifFamille) : [];
}

// Acrobatie : famille « Acrobaties » du sol (Fédéral A) ou acrobaties de la grille Fédéral B.
export function estAcro(e: ElementFedA): boolean {
  return e.famille === "ACROBATIES" || e.famille.startsWith("ACRO") || e.famille.startsWith("B_ACRO");
}

// Au sol, le mouvement doit finir par une acrobatie : renvoie un avertissement quand le dernier élément n'en est pas une.
export function avertissementFinMouvement(agres: Agres, elements: ElementFedA[]): string | null {
  if (elements.length > 0 && elements[0].grille === "PF") {
    if ((agres === "BARRES" || agres === "POUTRE") && !elements.some((e) => e.famille.endsWith("_6") && e.valeur >= 0.1)) {
      return "Pas de sortie : 7 éléments seulement sont comptés et −0,50 sur la note finale.";
    }
    return null;
  }
  if (agres !== "SOL" || elements.length === 0) return null;
  return estAcro(elements[elements.length - 1]) ? null : "Le sol doit finir par une acrobatie : le dernier élément n’en est pas une.";
}

export interface SautChoisi {
  idSaut: string;
  appareil: Appareil;
}

// Le meilleur des deux sauts est pris en compte.
export function calculerNoteDSaut(sauts: SautChoisi[]): number {
  const valeurs = sauts.slice(0, 2).map((s) => {
    const saut = getSautFedA(s.idSaut);
    if (!saut) return 0;
    return s.appareil === "ANS79" ? (saut.valeur79 ?? 0) : s.appareil === "TRAMPO_TREMP" ? saut.valeurTrampoTremp : saut.valeurTremplin;
  });
  return valeurs.length ? Math.max(...valeurs) : 0;
}

// Les sauts choisis qui n'existent pas dans le niveau (autre table de sauts) ne comptent pas.
export function sautsValides(niveau: NiveauId, sauts: SautChoisi[]): SautChoisi[] {
  const ids = new Set(getSautsNiveau(niveau).map((x) => x.id));
  return sauts.filter((x) => ids.has(x.idSaut));
}

// Note D maximale possible : le plafond du niveau (éléments + bonifications) ou, au saut, la valeur du meilleur saut du niveau.
export function noteDMax(niveau: NiveauId, agres: Agres, categorieId?: string): number {
  if (estPerf79(niveau)) return noteDMaxPerf79(agres, niveau, categorieId);
  if (programmeDe(niveau) === "PF") {
    // Maximum théorique : les 8 plus fortes valeurs du tableau + les 4 exigences de composition ; au saut, la plus forte valeur.
    if (agres === "SAUT") return Math.max(0, ...getSautsNiveau(niveau).map((s) => s.valeurTremplin));
    const valeurs = getElementsNiveau(agres as AgresAvecGrille, niveau).map((e) => e.valeur).sort((a, b) => b - a).slice(0, reglesPF.noteD.nbElementsMax);
    return round2(valeurs.reduce((t, v) => t + v, 0) + reglesPF.noteD.maxExigences * reglesPF.noteD.pointsParExigence);
  }
  if (agres === "SAUT") return Math.max(0, ...getSautsNiveau(niveau).flatMap((s) => [s.valeurTrampoTremp, s.valeurTremplin, s.valeur79 ?? 0]));
  return getNiveau(niveau).plafondD;
}

export function noteDMouvement(m: {
  agres: Agres;
  niveau: NiveauId;
  elementIds: string[];
  bonifIds: string[];
  sauts: SautChoisi[];
}): number {
  // Performance 7-9 ans : mouvement imposé, les options validées sont enregistrées dans bonifIds.
  if (estPerf79(m.niveau)) return noteDPerf79(m.agres, m.niveau, m.bonifIds);
  if (m.agres === "SAUT") return calculerNoteDSaut(sautsValides(m.niveau, m.sauts));
  return calculerNoteD(m.agres, m.elementIds, m.bonifIds, m.niveau).total;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
