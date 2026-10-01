"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

// Renommer sur place, comme sur le site UFOLEP : le champ remplace le nom, avec « OK » et « Annuler ».
export function RenommerEnLigne({ valeur, onOk, onAnnuler, className = "" }: { valeur: string; onOk: (v: string) => void; onAnnuler: () => void; className?: string }) {
  const [texte, setTexte] = useState(valeur);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    champ.current?.focus();
    champ.current?.select();
  }, []);

  function valider(e: FormEvent) {
    e.preventDefault();
    const v = texte.trim();
    if (v) onOk(v);
    else onAnnuler();
  }

  return (
    <form onSubmit={valider} className="flex items-center gap-2">
      <input
        ref={champ}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onAnnuler()}
        className={`rounded border border-accent-solid bg-surface-alt px-3 py-1.5 text-sm text-foreground focus:outline-none ${className}`}
      />
      <button type="submit" className="accent-gradient-text text-xs font-semibold underline">
        OK
      </button>
      <button type="button" onClick={onAnnuler} className="text-xs text-muted hover:text-foreground">
        Annuler
      </button>
    </form>
  );
}

// Confirmation de suppression sur place : « Supprimer … ? » puis « Confirmer » et « Annuler ».
export function ConfirmerEnLigne({ question, onConfirmer, onAnnuler }: { question: string; onConfirmer: () => void; onAnnuler: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted">{question}</span>
      <button type="button" onClick={onConfirmer} className="rounded border border-danger/40 px-2 py-1 text-danger hover:bg-danger/10">
        Confirmer
      </button>
      <button type="button" onClick={onAnnuler} className="rounded border border-border-strong px-2 py-1 text-muted hover:text-foreground">
        Annuler
      </button>
    </div>
  );
}
