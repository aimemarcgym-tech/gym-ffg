"use client";

import { useState } from "react";
import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";
import { getSautFedA } from "@/regulation/loader";
import { LIBELLE_FAMILLE, fmt, fmtValeur } from "@/regulation/libelles";
import { panneau, titrePanneau } from "@/lib/styles";
import type { SautChoisi } from "@/engine/federal-a";
import type { SerieType } from "@/lib/data";
import type { ElementFedA } from "@/regulation/types";

interface Props {
  elements: (ElementFedA & { cle?: string })[];
  retenus: Set<string>;
  sauts: SautChoisi[];
  onRetirer?: (id: string) => void;
  onRetirerSaut?: (s: SautChoisi) => void;
  onReordonner?: (ids: string[]) => void;
  // Pastilles de série : mixte (bleue), gymnique (verte), acro (jaune).
  series?: Record<string, SerieType>;
  onSerie?: (cle: string, type: SerieType | null) => void;
  // Page de partage : même affichage, sans poignée ni boutons.
  lectureSeule?: boolean;
  // Pas de pastilles de série (barres).
  sansSeries?: boolean;
}

const SERIES: { id: SerieType; label: string; plein: string; lueur: string }[] =
  [
    {
      id: "MIXTE",
      label: "Série mixte",
      plein: "bg-[#00b7ff]",
      lueur: "#00b7ff",
    },
    {
      id: "GYMNIQUE",
      label: "Série gymnique",
      plein: "bg-[#2bff00]",
      lueur: "#2bff00",
    },
    {
      id: "ACRO",
      label: "Série acro",
      plein: "bg-[#fff200]",
      lueur: "#fff200",
    },
  ];

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
  series = {},
  sansSeries,
  onSerie,
}: Props) {
  const ids = elements.map((e) => e.cle ?? e.id);
  const dnd = useDragReorder(ids, onReordonner);
  // Case dont les pastilles de série sont affichées (un clic sur la case les montre ou les cache).
  const [ouvert, setOuvert] = useState<string | null>(null);
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
            key={e.cle ?? e.id}
            ref={dnd.registre(e.cle ?? e.id)}
            style={dnd.style(e.cle ?? e.id)}
            onClick={(ev) => {
              if (
                lectureSeule ||
                sansSeries ||
                (ev.target as HTMLElement).closest("button")
              )
                return;
              const cle = e.cle ?? e.id;
              setOuvert((o) => (o === cle ? null : cle));
            }}
            className={`rounded border border-border-subtle bg-surface-alt p-2 transition ${!lectureSeule && !sansSeries ? "cursor-pointer" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {!lectureSeule && (
                  <DragHandle {...dnd.poignee(e.cle ?? e.id)} />
                )}
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
              <div className="flex shrink-0 flex-col items-end justify-between gap-2.5 self-stretch">
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
                      onClick={() => onRetirer?.(e.cle ?? e.id)}
                      className="rounded border border-danger/40 px-1.5 text-xs text-danger hover:bg-danger/10"
                      aria-label="Retirer"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!sansSeries &&
                  (lectureSeule ||
                    ouvert === (e.cle ?? e.id) ||
                    !!series[e.cle ?? e.id]) && (
                    <div className="-mr-[18px] -mb-[18px] flex items-center">
                      {SERIES.filter((t) => {
                        const choisie = series[e.cle ?? e.id];
                        return lectureSeule
                          ? choisie === t.id
                          : !choisie || choisie === t.id;
                      }).map((t) => {
                        const actif = series[e.cle ?? e.id] === t.id;
                        return lectureSeule ? (
                          <span
                            key={t.id}
                            className="flex items-center gap-1 text-[11px] text-muted"
                          >
                            <span
                              style={{ boxShadow: `0 0 8px 2px ${t.lueur}` }}
                              className={`inline-block h-[7px] w-[7px] rounded-full ${t.plein}`}
                            />
                            {t.label}
                          </span>
                        ) : (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              onSerie?.(e.cle ?? e.id, actif ? null : t.id)
                            }
                            className="p-[18px]"
                            title={
                              actif
                                ? `Retirer de la ${t.label.toLowerCase()}`
                                : `Pointer : ${t.label.toLowerCase()}`
                            }
                            aria-pressed={actif}
                          >
                            <span
                              style={{
                                boxShadow: actif
                                  ? `0 0 12px 3px ${t.lueur}`
                                  : `0 0 5px 1px ${t.lueur}`,
                              }}
                              className={`block h-[7px] w-[7px] rounded-full transition ${t.plein} ${actif ? "scale-125 ring-1 ring-white" : "opacity-50"}`}
                            />
                          </button>
                        );
                      })}
                      {!lectureSeule && series[e.cle ?? e.id] && (
                        <span className="text-[11px] text-muted">
                          {
                            SERIES.find((t) => t.id === series[e.cle ?? e.id])
                              ?.label
                          }
                        </span>
                      )}
                    </div>
                  )}
              </div>
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
