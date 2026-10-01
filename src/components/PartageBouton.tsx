"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  // Renvoie le chemin de la page publique, par exemple /partage/ordre-passage/?id=…
  onCreate: () => Promise<string>;
  label?: string;
  className?: string;
}

// Même bouton de partage que sur le site UFOLEP : crée le lien, l'affiche et le copie.
export default function PartageBouton({ onCreate, label = "Partager", className }: Props) {
  const [lien, setLien] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function creer() {
    if (minuteur.current) clearTimeout(minuteur.current);
    setEnCours(true);
    setCopie(false);
    setErreur(null);
    try {
      const chemin = await onCreate();
      setLien(`${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${chemin}`);
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "Échec de la création du lien.");
    } finally {
      setEnCours(false);
    }
  }

  async function copier() {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      minuteur.current = setTimeout(() => {
        setLien(null);
        setCopie(false);
      }, 1500);
    } catch {
      setErreur("Impossible de copier automatiquement — sélectionnez le lien manuellement.");
    }
  }

  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={enCours}
        onClick={creer}
        className={className ?? "rounded border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-solid/60 disabled:opacity-50"}
      >
        {enCours ? "…" : label}
      </button>
      {lien && (
        <div className="flex items-center gap-2 rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs">
          <span className="max-w-[220px] truncate text-muted" title={lien}>
            {lien}
          </span>
          <button type="button" onClick={copier} className="accent-gradient-text shrink-0 font-medium underline">
            {copie ? "Copié !" : "Copier"}
          </button>
        </div>
      )}
      {erreur && <span className="text-xs text-danger">{erreur}</span>}
    </div>
  );
}
