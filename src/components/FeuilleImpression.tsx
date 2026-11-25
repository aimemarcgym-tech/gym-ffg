"use client";

import { useEffect, useState } from "react";
import { Panneaux, type MouvementPartage } from "@/components/PartageMouvements";

// Impression de mouvements : la feuille n'existe à l'écran que le temps de l'impression (elle est montée au clic, puis retirée
// quand la fenêtre d'impression se ferme). Le reste de la page est masqué à l'impression (classe print:hidden).
// Retourne [feuilleMontee, imprimer].
export function useImpression(): [boolean, () => void] {
  const [monte, setMonte] = useState(false);
  const [demande, setDemande] = useState(0);

  useEffect(() => {
    if (demande === 0) return;
    const fin = () => setMonte(false);
    window.addEventListener("afterprint", fin);
    // Laisse le temps d'afficher la feuille avant d'ouvrir la fenêtre d'impression.
    const minuteur = window.setTimeout(() => window.print(), 150);
    return () => {
      window.clearTimeout(minuteur);
      window.removeEventListener("afterprint", fin);
    };
  }, [demande]);

  return [
    monte,
    () => {
      setMonte(true);
      setDemande((n) => n + 1);
    },
  ];
}

// Une page par mouvement : nom, agrès et niveau, puis « Mon mouvement » et « Analyse » comme à l'écran, sur fond blanc.
export default function FeuilleImpression({
  gymnaste,
  mouvements,
}: {
  gymnaste: string;
  mouvements: MouvementPartage[];
}) {
  const date = new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });
  return (
    <div className="feuille-impression hidden print:block">
      {mouvements.map((m, i) => (
        <section key={i} className="page-impression">
          <div className="mb-4 flex items-baseline justify-between border-b border-border-strong pb-2">
            <span className="text-base font-bold text-foreground">
              {gymnaste}
            </span>
            <span className="text-xs text-muted">Imprimé le {date}</span>
          </div>
          <Panneaux m={m} />
        </section>
      ))}
    </div>
  );
}
