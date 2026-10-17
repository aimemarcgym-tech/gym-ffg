import { getNiveau } from "@/regulation/loader";
import type { Equipe } from "@/lib/data";

// Restrictions de participation d'une gymnaste dans plusieurs équipes de programmes différents
// (règlement technique GAM-GAF 2026-2027 et brochure technique régionale CRIFGYM). Ce sont des avertissements : rien n'est bloqué.
// `equipe` : l'équipe examinée ; `autres` : les autres équipes où la même gymnaste est engagée.
export function conflitsParticipation(
  equipe: Equipe,
  autres: Equipe[],
): string[] {
  const messages: string[] = [];
  const n1 = getNiveau(equipe.niveau);
  for (const o of autres) {
    const n2 = getNiveau(o.niveau);
    const pair = [n1.programme, n2.programme].sort().join("+");
    const lib = `${n2.label} (${o.nom})`;
    if (pair === "A+P" || pair === "B+P") {
      messages.push(
        `Engagée aussi en ${lib} : une gymnaste engagée en Fédéral ne peut pas concourir en Performance régionale 7-9 ans.`,
      );
    } else if (pair === "B+PF") {
      messages.push(
        `Engagée aussi en ${lib} : le Fédéral B est interdit aux gymnastes ayant concouru sur un autre programme.`,
      );
    } else if (pair === "A+PF") {
      messages.push(
        `Engagée aussi en ${lib} : une seule gymnaste par club et par saison peut monter d’une équipe Fédéral A vers une équipe Performance (quota à vérifier).`,
      );
    } else if (pair === "A+B") {
      messages.push(
        `Engagée aussi en ${lib} : le Fédéral B est interdit aux gymnastes ayant concouru sur un autre programme.`,
      );
    } else if (
      n1.programme === "B" &&
      n2.programme === "B" &&
      n1.id !== n2.id
    ) {
      messages.push(
        `Engagée aussi en ${lib} : les programmes Fédéral B1, B2 et B3 sont distincts, et le Fédéral B est interdit aux gymnastes ayant concouru sur un autre programme.`,
      );
    } else if (
      n1.programme === "A" &&
      n2.programme === "A" &&
      (n1.id === "A3") !== (n2.id === "A3")
    ) {
      messages.push(
        `Engagée aussi en ${lib} : le Fédéral A3 est interdit aux gymnastes ayant concouru en Fédéral A ou A2 en équipe.`,
      );
    }
  }
  return [...new Set(messages)];
}
