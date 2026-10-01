import { elementAutorise, getBonifications, getElementFedA, getNiveau, getSautFedA, getSautsNiveau, reglesNiveau } from "@/regulation/loader";
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
  const distincts = [...new Set(idsElements)]
    .map(getElementFedA)
    .filter((e): e is ElementFedA => !!e && e.agres === agres && elementAutorise(e, niveau))
    .filter((e) => {
      const cle = e.identiqueA ?? e.id;
      const doublon = vus.has(cle) || vus.has(e.id);
      vus.add(cle);
      vus.add(e.id);
      return !doublon;
    });

  const elementsRetenus = [...distincts].sort((a, b) => b.valeur - a.valeur).slice(0, nbElementsMax);
  const totalElements = round2(elementsRetenus.reduce((s, e) => s + e.valeur, 0));

  const possibles = new Set(
    etatBonifications(agres, distincts, niveau)
      .filter((b) => b.eligible || b.manuelle)
      .map((b) => b.def.id),
  );
  const bonifsRetenues = [...new Set(idsBonifsValidees)].filter((id) => possibles.has(id)).slice(0, maxBonifications);
  const nbBonifications = bonifsRetenues.length;
  const totalBonifications = round2(nbBonifications * pointsParBonification);

  // Le plafond du niveau s'applique bonifications comprises.
  const plafond = getNiveau(niveau).plafondD;
  const brut = round2(totalElements + totalBonifications);
  const total = Math.min(brut, plafond);
  const penalite = nbElementsMin > 0 && distincts.length < nbElementsMin ? penaliteMin : 0;
  return { elementsRetenus, totalElements, bonifsRetenues, nbBonifications, totalBonifications, total, plafonne: total < brut, penalite, nbDistincts: distincts.length };
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

export function noteDMouvement(m: {
  agres: Agres;
  niveau: NiveauId;
  elementIds: string[];
  bonifIds: string[];
  sauts: SautChoisi[];
}): number {
  if (m.agres === "SAUT") return calculerNoteDSaut(sautsValides(m.niveau, m.sauts));
  return calculerNoteD(m.agres, m.elementIds, m.bonifIds, m.niveau).total;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
