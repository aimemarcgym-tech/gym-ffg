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
  const [menu, setMenu] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);

  // Dernière orientation utilisée : elle est marquée d'une coche dans le menu.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(CLE) === "paysage") setOrientation("paysage");
    } catch {
      // stockage indisponible : portrait
    }
  }, []);

  // Le menu se ferme au clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!menu) return;
    const dehors = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setMenu(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", touche);
    };
  }, [menu]);

  const lancer = useCallback(() => {
    window.addEventListener("afterprint", () => setMonte(false), { once: true });
    window.print();
  }, []);

  // Un clic sur « Portrait » ou « Paysage » lance l'impression dans cette orientation.
  function imprimerEn(o: Orientation) {
    setOrientation(o);
    try {
      localStorage.setItem(CLE, o);
    } catch {
      // stockage indisponible : sans conséquence
    }
    setMenu(false);
    setMonte(true);
    setDemande((n) => n + 1);
  }

  return (
    <>
      <span ref={zone} className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menu}
          className={className}
          title={titre}
        >
          {label} <span aria-hidden="true">▾</span>
        </button>
        {menu && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded border border-border-strong bg-surface-alt text-sm shadow-xl"
          >
            {(["portrait", "paysage"] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="menuitem"
                onClick={() => imprimerEn(o)}
                className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-left text-foreground hover:bg-accent-from/15"
              >
                <span aria-hidden="true" className="w-3 text-xs">
                  {orientation === o ? "✓" : ""}
                </span>
                {o === "portrait" ? "Portrait" : "Paysage"}
              </button>
            ))}
          </div>
        )}
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
