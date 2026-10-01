"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

interface Message {
  titre: string;
  texte: string;
  resoudre: () => void;
}

interface Api {
  // Remplace alert() : boîte déplaçable avec un bouton OK.
  informer: (texte: string, titre?: string) => Promise<void>;
}

const Contexte = createContext<Api | null>(null);

export function useDialogues(): Api {
  const api = useContext(Contexte);
  if (!api) throw new Error("useDialogues doit être utilisé dans DialoguesProvider");
  return api;
}

function Boite({ m, fermer }: { m: Message; fermer: () => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ok = useRef<HTMLButtonElement>(null);
  const glisse = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    ok.current?.focus();
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fermer]);

  // Déplacement de la boîte en attrapant la barre de titre.
  function debut(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  }
  function bouge(e: PointerEvent<HTMLDivElement>) {
    const g = glisse.current;
    if (g) setPos({ x: g.x + e.clientX - g.px, y: g.y + e.clientY - g.py });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-label={m.titre} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} className="w-full max-w-md overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl shadow-black/60">
        <div
          onPointerDown={debut}
          onPointerMove={bouge}
          onPointerUp={() => (glisse.current = null)}
          onPointerCancel={() => (glisse.current = null)}
          className="accent-gradient flex cursor-grab touch-none items-center justify-between px-4 py-2.5 text-white active:cursor-grabbing"
        >
          <span className="text-sm font-semibold">{m.titre}</span>
          <span className="text-xs text-white/70 select-none" aria-hidden>
            ⠿ déplaçable
          </span>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-foreground">{m.texte}</p>
          <div className="flex justify-end">
            <button ref={ok} type="button" onClick={fermer} className="accent-gradient rounded px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DialoguesProvider({ children }: { children: ReactNode }) {
  const [m, setM] = useState<Message | null>(null);

  const informer = useCallback(
    (texte: string, titre = "Information") =>
      new Promise<void>((resolve) => {
        setM({ titre, texte, resoudre: resolve });
      }),
    [],
  );

  const fermer = useCallback(() => {
    setM((courant) => {
      courant?.resoudre();
      return null;
    });
  }, []);

  return (
    <Contexte.Provider value={{ informer }}>
      {children}
      {m && <Boite m={m} fermer={fermer} />}
    </Contexte.Provider>
  );
}
