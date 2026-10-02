"use client";

import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";
import { getSautFedA } from "@/regulation/loader";
import { LIBELLE_FAMILLE, fmt, fmtValeur } from "@/regulation/libelles";
import { panneau, titrePanneau } from "@/lib/styles";
import type { SautChoisi } from "@/engine/federal-a";
import type { ElementFedA } from "@/regulation/types";

interface Props {
  elements: ElementFedA[];
  retenus: Set<string>;
  sauts: SautChoisi[];
  onRetirer?: (id: string) => void;
  onRetirerSaut?: (s: SautChoisi) => void;
  onReordonner?: (ids: string[]) => void;
  // Page de partage : même affichage, sans poignée ni boutons.
  lectureSeule?: boolean;
}

const boutonFleche =
  "rounded border border-border-strong px-1.5 text-xs text-foreground hover:border-accent-solid/60";

export default function PanneauMouvement({
  elements,
  retenus,
  sauts,
  onRetirer,
  onRetirerSaut,
  onReordonner = () => undefined,
  lectureSeule,
}: Props) {
  const ids = elements.map((e) => e.id);
  const dnd = useDragReorder(ids, onReordonner);
  const vide = elements.length === 0 && sauts.length === 0;

  function deplacer(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const suite = [...ids];
    [suite[i], suite[j]] = [suite[j], suite[i]];
    onReordonner(suite);
  }

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Mon mouvement</h2>

      {vide && !lectureSeule && (
        <p className="text-sm text-muted">
          Ajoutez des éléments depuis la Bibliothèque, à droite →
        </p>
      )}

      <ol className="space-y-2">
        {elements.map((e, i) => (
          <li
            key={e.id}
            ref={dnd.registre(e.id)}
            style={dnd.style(e.id)}
            className="rounded border border-border-subtle bg-surface-alt p-2 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {!lectureSeule && <DragHandle {...dnd.poignee(e.id)} />}
                <div>
                  <div className="text-xs text-muted">
                    {i + 1}. {LIBELLE_FAMILLE[e.famille] ?? e.famille} ·{" "}
                    {fmtValeur(e)}
                    {e.bonifFamille && (
                      <span className="ml-1 text-accent-solid">· bonif</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {e.nom}
                  </div>
                  {!retenus.has(e.id) && (
                    <div className="mt-0.5 text-xs text-danger">non compté</div>
                  )}
                </div>
              </div>
              {!lectureSeule && (
                <div className="flex gap-1">
                  <button
                    onClick={() => deplacer(i, -1)}
                    className={boutonFleche}
                    aria-label="Monter"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => deplacer(i, 1)}
                    className={boutonFleche}
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRetirer?.(e.id)}
                    className="rounded border border-danger/40 px-1.5 text-xs text-danger hover:bg-danger/10"
                    aria-label="Retirer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}

        {sauts.map((s) => {
          const saut = getSautFedA(s.idSaut);
          if (!saut) return null;
          const v =
            s.appareil === "ANS79"
              ? (saut.valeur79 ?? 0)
              : s.appareil === "TRAMPO_TREMP"
                ? saut.valeurTrampoTremp
                : saut.valeurTremplin;
          return (
            <li
              key={s.idSaut + s.appareil}
              className="rounded border border-border-subtle bg-surface-alt p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-muted">
                    {saut.unique
                      ? "Note D"
                      : s.appareil === "ANS79"
                        ? "A3 7/9 ans · saut 1,00 m"
                        : s.appareil === "TRAMPO_TREMP"
                          ? "Trampo-tremp"
                          : "1 tremplin"}{" "}
                    · {fmt(v)}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {saut.nom}
                  </div>
                </div>
                {!lectureSeule && (
                  <button
                    onClick={() => onRetirerSaut?.(s)}
                    className="rounded border border-danger/40 px-1.5 text-xs text-danger hover:bg-danger/10"
                    aria-label="Retirer le saut"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
