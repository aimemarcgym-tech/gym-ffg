"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Panneaux, type MouvementPartage } from "@/components/PartageMouvements";

type Orientation = "portrait" | "paysage";
const CLE = "ffg:orientation-impression";

// Zone utile d'une page A4 (marges de 10 mm), à 96 dpi : 190 × 277 mm en portrait, 277 × 190 mm en paysage.
const PAGE: Record<Orientation, { largeur: number; hauteur: number }> = {
  portrait: { largeur: 718, hauteur: 1047 },
  paysage: { largeur: 1047, hauteur: 718 },
};

// Feuille à imprimer : une page par mouvement (nom de la gymnaste, date, puis « Mon mouvement » et « Analyse » avec le détail du
// calcul déroulé). Elle est montée hors écran à la largeur de la page choisie : on mesure la hauteur de chaque mouvement et on
// le réduit, si besoin, pour qu'il tienne sur une seule page ; puis on lance l'impression.
function Feuille({
  gymnaste,
  mouvements,
  orientation,
  onPret,
}: {
  gymnaste: string;
  mouvements: MouvementPartage[];
  orientation: Orientation;
  onPret: () => void;
}) {
  const pages = useRef<(HTMLElement | null)[]>([]);
  const date = new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });

  useLayoutEffect(() => {
    for (const page of pages.current) {
      if (!page) continue;
      page.style.zoom = "1";
      const h = page.offsetHeight;
      // 3 % de marge de sécurité ; jamais en dessous de 55 % pour rester lisible.
      const z = Math.min(1, Math.max(0.55, (PAGE[orientation].hauteur * 0.97) / h));
      page.style.zoom = String(z);
    }
    const minuteur = window.setTimeout(onPret, 0);
    return () => window.clearTimeout(minuteur);
  }, [orientation, mouvements, onPret]);

  return (
    <div
      className="feuille-impression"
      data-orientation={orientation}
      aria-hidden="true"
      inert
    >
      {/* Format de la page imprimée : une seule règle @page (celle du reste de l'application, en paysage, est remplacée). */}
      <style>{`@page { size: A4 ${orientation === "portrait" ? "portrait" : "landscape"}; margin: 10mm; }`}</style>
      {mouvements.map((m, i) => (
        <section
          key={i}
          className="page-impression"
          ref={(el) => {
            pages.current[i] = el;
          }}
        >
          <div className="mb-4 flex items-baseline justify-between border-b border-border-strong pb-2">
            <span className="text-base font-bold text-foreground">
              {gymnaste}
            </span>
            <span className="text-xs text-muted">Imprimé le {date}</span>
          </div>
          <Panneaux m={m} detailOuvert />
        </section>
      ))}
    </div>
  );
}

// Choix de l'orientation (mémorisé sur l'appareil) et bouton d'impression des mouvements donnés.
export default function BoutonImprimer({
  gymnaste,
  mouvements,
  label = "Imprimer",
  titre,
  className,
}: {
  gymnaste: string;
  mouvements: MouvementPartage[];
  label?: string;
  titre?: string;
  className?: string;
}) {
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [monte, setMonte] = useState(false);
  const [demande, setDemande] = useState(0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(CLE) === "paysage") setOrientation("paysage");
    } catch {
      // stockage indisponible : portrait
    }
  }, []);

  const lancer = useCallback(() => {
    window.addEventListener("afterprint", () => setMonte(false), { once: true });
    window.print();
  }, []);

  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <select
          value={orientation}
          onChange={(e) => {
            const o = e.target.value as Orientation;
            setOrientation(o);
            try {
              localStorage.setItem(CLE, o);
            } catch {
              // stockage indisponible : sans conséquence
            }
          }}
          aria-label="Orientation de l’impression"
          className="rounded border border-border-strong bg-surface-alt px-2 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="portrait">Portrait</option>
          <option value="paysage">Paysage</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setMonte(true);
            setDemande((n) => n + 1);
          }}
          className={className}
          title={titre}
        >
          {label}
        </button>
      </span>
      {monte &&
        createPortal(
          <Feuille
            key={demande}
            gymnaste={gymnaste}
            mouvements={mouvements}
            orientation={orientation}
            onPret={lancer}
          />,
          document.body,
        )}
    </>
  );
}
