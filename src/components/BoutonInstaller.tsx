"use client";

import { useEffect, useState } from "react";

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CLE_MASQUE = "ffg:installer-masque";

// Propose d'installer l'application sur l'écran d'accueil : bouton direct sur Android / Chrome / Edge, explications sur iPhone et iPad
// (Safari n'a pas de bouton d'installation programmable : il faut passer par « Partager » puis « Sur l'écran d'accueil »).
export default function BoutonInstaller() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);
  const [ios, setIos] = useState<"safari" | "autre" | null>(null);
  const [masque, setMasque] = useState(true);
  const [aide, setAide] = useState(false);

  useEffect(() => {
    const dejaInstallee = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let cache = false;
    try {
      cache = localStorage.getItem(CLE_MASQUE) === "1";
    } catch {
      // stockage indisponible : le bouton reste affiché
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMasque(dejaInstallee || cache);

    const ua = navigator.userAgent;
    const appleMobile = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (appleMobile) setIos(/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "autre" : "safari");

    const avant = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
    };
    const installee = () => setMasque(true);
    window.addEventListener("beforeinstallprompt", avant);
    window.addEventListener("appinstalled", installee);
    return () => {
      window.removeEventListener("beforeinstallprompt", avant);
      window.removeEventListener("appinstalled", installee);
    };
  }, []);

  if (masque || (!evenement && !ios)) return null;

  function cacher() {
    setMasque(true);
    try {
      localStorage.setItem(CLE_MASQUE, "1");
    } catch {
      // sans conséquence
    }
  }

  async function installer() {
    if (evenement) {
      await evenement.prompt();
      const { outcome } = await evenement.userChoice;
      setEvenement(null);
      if (outcome === "accepted") setMasque(true);
    } else {
      setAide(true);
    }
  }

  return (
    <>
      <div className="fixed right-3 bottom-3 z-40 flex items-center gap-1 rounded-full border border-border-strong bg-surface-alt py-1 pr-1 pl-3 text-xs shadow-lg">
        <button type="button" onClick={installer} className="accent-gradient-text font-semibold">
          📲 Installer l’application
        </button>
        <button type="button" onClick={cacher} aria-label="Ne plus proposer" className="rounded-full px-2 py-1 text-muted hover:text-foreground">
          ✕
        </button>
      </div>

      {aide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setAide(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-5 text-sm text-foreground" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-semibold">Installer l’application</h2>
            {ios === "autre" ? (
              <p className="text-muted">
                Sur iPhone et iPad, l’installation se fait depuis <strong className="text-foreground">Safari</strong>. Ouvrez cette page dans Safari, puis suivez les étapes.
              </p>
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-muted">
                <li>
                  Touchez le bouton <strong className="text-foreground">Partager</strong> de Safari (le carré avec une flèche vers le haut).
                </li>
                <li>
                  Faites défiler et touchez <strong className="text-foreground">« Sur l’écran d’accueil »</strong>.
                </li>
                <li>
                  Touchez <strong className="text-foreground">« Ajouter »</strong> : l’icône apparaît sur votre écran d’accueil.
                </li>
              </ol>
            )}
            <button type="button" onClick={() => setAide(false)} className="accent-gradient mt-4 w-full rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
