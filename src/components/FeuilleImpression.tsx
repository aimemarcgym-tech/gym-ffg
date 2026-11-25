"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogues } from "@/components/Dialogues";
import { Panneaux, type MouvementPartage } from "@/components/PartageMouvements";
import {
  capturerPages,
  nomFichierPdf,
  pdfDepuisImages,
  telecharger,
  type Orientation,
} from "@/lib/pdf-mouvements";

const CLE = "ffg:orientation-impression";

// Zone utile d'une page A4 (marges de 10 mm), à 96 dpi : 190 × 277 mm en portrait, 277 × 190 mm en paysage.
const PAGE: Record<Orientation, { largeur: number; hauteur: number }> = {
  portrait: { largeur: 718, hauteur: 1047 },
  paysage: { largeur: 1047, hauteur: 718 },
};

// Feuille des mouvements : une page par mouvement (nom de la gymnaste, date, puis « Mon mouvement » et « Analyse » avec le détail du
// calcul déroulé). Elle est montée hors écran à la largeur de la page choisie. Pour l'impression (ajuster), on mesure la hauteur de
// chaque mouvement et on le réduit, si besoin, pour qu'il tienne sur une seule page. Pour le PDF, chaque page est capturée telle
// quelle. Dans les deux cas, onPret est appelé une fois la feuille prête.
function Feuille({
  gymnaste,
  mouvements,
  orientation,
  ajuster,
  onPret,
}: {
  gymnaste: string;
  mouvements: MouvementPartage[];
  orientation: Orientation;
  ajuster: boolean;
  onPret: (racine: HTMLElement) => void;
}) {
  const racine = useRef<HTMLDivElement>(null);
  const pages = useRef<(HTMLElement | null)[]>([]);
  const date = new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });

  // Une seule fois par feuille (elle est remontée à chaque demande) : les valeurs du premier rendu suffisent.
  useLayoutEffect(() => {
    if (ajuster) {
      for (const page of pages.current) {
        if (!page) continue;
        page.style.zoom = "1";
        const h = page.offsetHeight;
        // 3 % de marge de sécurité ; jamais en dessous de 55 % pour rester lisible.
        const z = Math.min(1, Math.max(0.55, (PAGE[orientation].hauteur * 0.97) / h));
        page.style.zoom = String(z);
      }
    }
    const minuteur = window.setTimeout(() => {
      if (racine.current) onPret(racine.current);
    }, 0);
    return () => window.clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={racine}
      className="feuille-impression"
      data-orientation={orientation}
      aria-hidden="true"
      inert
    >
      {/* Format de la page imprimée : une seule règle @page (celle du reste de l'application, en paysage, est remplacée). */}
      {ajuster && (
        <style>{`@page { size: A4 ${orientation === "portrait" ? "portrait" : "landscape"}; margin: 10mm; }`}</style>
      )}
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

type Mode = "impression" | "pdf";

// Bouton « Imprimer ▾ » : un menu propose d'imprimer ou de télécharger en PDF, en portrait ou en paysage. La dernière orientation
// utilisée est cochée (mémorisée sur l'appareil).
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
  const { informer } = useDialogues();
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [action, setAction] = useState<{ mode: Mode; n: number } | null>(null);
  const [menu, setMenu] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);
  const occupe = action?.mode === "pdf";

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

  const lancerImpression = useCallback(() => {
    window.addEventListener("afterprint", () => setAction(null), { once: true });
    window.print();
  }, []);

  const creerPdf = useCallback(
    async (racine: HTMLElement) => {
      try {
        const images = await capturerPages(racine);
        const nom =
          mouvements.length === 1
            ? `${gymnaste} - ${mouvements[0].nom}`
            : `${gymnaste} - Mouvements`;
        telecharger(pdfDepuisImages(images, orientation), nomFichierPdf(nom));
      } catch (e) {
        await informer(
          `Le PDF n’a pas pu être créé (${e instanceof Error ? e.message : "erreur inconnue"}). Vous pouvez choisir « Imprimer », puis « Enregistrer au format PDF » comme imprimante.`,
          "PDF",
        );
      } finally {
        setAction(null);
      }
    },
    [gymnaste, mouvements, orientation, informer],
  );

  function lancer(mode: Mode, o: Orientation) {
    setOrientation(o);
    try {
      localStorage.setItem(CLE, o);
    } catch {
      // stockage indisponible : sans conséquence
    }
    setMenu(false);
    setAction((a) => ({ mode, n: (a?.n ?? 0) + 1 }));
  }

  const choix = (mode: Mode) =>
    (["portrait", "paysage"] as const).map((o) => (
      <button
        key={`${mode}-${o}`}
        type="button"
        role="menuitem"
        onClick={() => lancer(mode, o)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left whitespace-nowrap text-foreground hover:bg-accent-from/15"
      >
        <span aria-hidden="true" className="w-3 text-xs">
          {orientation === o ? "✓" : ""}
        </span>
        {o === "portrait" ? "Portrait" : "Paysage"}
      </button>
    ));

  return (
    <>
      <span ref={zone} className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          disabled={occupe}
          aria-haspopup="menu"
          aria-expanded={menu}
          className={className}
          title={titre}
        >
          {occupe ? (
            "Création du PDF…"
          ) : (
            <>
              {label} <span aria-hidden="true">▾</span>
            </>
          )}
        </button>
        {menu && (
          <div
            role="menu"
            className="absolute top-full right-0 z-50 mt-1 min-w-full overflow-hidden rounded border border-border-strong bg-surface-alt text-sm shadow-xl"
          >
            <p className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Imprimer
            </p>
            {choix("impression")}
            <div className="my-1 border-t border-border-subtle" />
            <p className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Télécharger en PDF
            </p>
            {choix("pdf")}
          </div>
        )}
      </span>
      {action &&
        createPortal(
          <Feuille
            key={action.n}
            gymnaste={gymnaste}
            mouvements={mouvements}
            orientation={orientation}
            ajuster={action.mode === "impression"}
            onPret={action.mode === "pdf" ? creerPdf : lancerImpression}
          />,
          document.body,
        )}
    </>
  );
}
