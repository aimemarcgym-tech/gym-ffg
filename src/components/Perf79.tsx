"use client";

import { fmt } from "@/regulation/libelles";
import {
  noteDMaxPerf79,
  noteDPerf79,
  optionsPerf79,
  perf79,
  sequencesPerf79,
} from "@/regulation/loader";
import { panneau, titrePanneau } from "@/lib/styles";
import type { Agres, NiveauId } from "@/regulation/types";

interface Props {
  agres: Agres;
  niveau: NiveauId;
  // Identifiants des options validées.
  choisies: string[];
  // Absent : lecture seule (page de partage).
  onBasculer?: (id: string) => void;
}

// « Mon mouvement » d'un programme Performance 7-9 ans : suite d'éléments imposés ; chaque option cochée rapporte 0,50 point.
// « OU » remplace l'élément de base placé juste au-dessus ; « ET » est un élément supplémentaire.
export function PanneauMouvementPerf79({
  agres,
  niveau,
  choisies,
  onBasculer,
}: Props) {
  if (agres === "SAUT") {
    const saut = perf79.saut.find((s) => s.niveau === niveau);
    return (
      <section className={panneau}>
        <h2 className={titrePanneau}>Mon mouvement</h2>
        {saut ? (
          <div className="rounded border border-border-subtle bg-surface-alt p-3">
            <div className="text-xs text-muted">
              Saut imposé · note D {fmt(saut.valeur)}
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {saut.texte}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Pas de saut à ce niveau.</p>
        )}
      </section>
    );
  }

  const sequences = sequencesPerf79(agres, niveau);
  if (sequences.length === 0) {
    return (
      <section className={panneau}>
        <h2 className={titrePanneau}>Mon mouvement</h2>
        <p className="text-sm text-muted">
          Ce niveau n’existe pas à cet agrès.
        </p>
      </section>
    );
  }
  const actives = new Set(choisies);

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Mon mouvement</h2>
      <div className="space-y-4">
        {sequences.map((seq) => {
          let n = 0;
          return (
            <div key={seq.nom}>
              {sequences.length > 1 && (
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  {seq.nom}
                </h3>
              )}
              <ol className="space-y-2">
                {seq.items.map((it, i) => {
                  if (it.option) {
                    const active = actives.has(it.id);
                    const remplace = it.type === "OU";
                    return (
                      <li key={it.id}>
                        <label
                          className={`flex items-start gap-3 rounded border p-2 ${onBasculer ? "cursor-pointer" : ""} ${active ? "border-accent-solid bg-accent-from/15" : "border-border-subtle bg-surface-alt"}`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            disabled={!onBasculer}
                            onChange={() => onBasculer?.(it.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-[#a855f7]"
                          />
                          <span>
                            <span className="block text-xs font-semibold text-accent-solid">
                              Option {it.option} ·{" "}
                              {remplace
                                ? "remplace l’élément ci-dessus"
                                : "élément supplémentaire"}{" "}
                              · +{fmt(perf79.pointsParOption)}
                            </span>
                            <span className="block text-sm text-foreground">
                              {it.texte}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  }
                  // Élément de base : barré quand une option « OU » placée juste après le remplace.
                  const suivante = seq.items[i + 1];
                  const remplace =
                    !!suivante?.option &&
                    suivante.type === "OU" &&
                    actives.has(suivante.id);
                  n += 1;
                  return (
                    <li
                      key={it.id}
                      className={`rounded border border-border-subtle bg-surface-alt p-2 ${remplace ? "opacity-50" : ""}`}
                    >
                      <div className="text-xs text-muted">
                        {n}.{remplace ? " remplacé par l’option" : ""}
                      </div>
                      <div
                        className={`text-sm font-medium text-foreground ${remplace ? "line-through" : ""}`}
                      >
                        {it.texte}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const DEDUCTIONS = [
  "Élément non tenté : −2 points",
  "Élément non reconnu : −1 point",
  "Option « OU » non reconnue : −1 point",
  "Élément supplémentaire ou répété : −0,50 point",
  "Ordre non respecté : −0,10 point à la poutre et au sol, −0,50 aux barres (à chaque fois)",
];

// « Analyse » : note de départ du mouvement (valeur de base + options validées) et rappel des déductions du jury D.
export function PanneauAnalysePerf79({
  agres,
  niveau,
  choisies,
}: Omit<Props, "onBasculer">) {
  const d = noteDPerf79(agres, niveau, choisies);
  const dMax = noteDMaxPerf79(agres, niveau);
  const nbOptions = optionsPerf79(agres, niveau).length;
  const nbValidees = new Set(
    choisies.filter((id) => optionsPerf79(agres, niveau).includes(id)),
  ).size;
  const base = agres === "SAUT" ? d : (perf79.niveaux[niveau]?.base ?? 0);

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Analyse</h2>

      {agres !== "SAUT" && (
        <div className="mb-4 text-sm">
          <div className="mb-1 font-semibold text-foreground">Options</div>
          <p className="text-foreground">
            <span
              className={
                nbValidees === nbOptions ? "text-success" : "text-muted"
              }
            >
              {nbValidees === nbOptions ? "✓ " : ""}
              {nbValidees}/{nbOptions} option(s) validée(s)
            </span>{" "}
            <span className="text-xs text-muted">
              (+{fmt(perf79.pointsParOption)} chacune)
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Une option est validée si elle est réalisée sans chute (ou sans
            s’accrocher à la poutre).
          </p>
        </div>
      )}

      <div className="accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
        <div className="flex items-center justify-between text-xs text-white/70 uppercase">
          <span>Note de départ</span>
          <span className="text-white/60 normal-case">
            {agres === "SAUT" ? "Valeur du saut" : "Base + options"}
          </span>
        </div>
        <div className="text-4xl font-bold">{fmt(d)}</div>
        {agres !== "SAUT" && (
          <div className="text-xs text-white/70">
            {fmt(base)} de base + {fmt(nbValidees * perf79.pointsParOption)}{" "}
            d’options
          </div>
        )}
        <div className="mt-0.5 text-sm font-semibold text-white">
          {fmt(d)} / {fmt(dMax)} maximum
        </div>
        <div className="text-xs text-white/70">
          Note finale maximale possible : {fmt(dMax + 10)} (D {fmt(dMax)} +
          exécution 10,00)
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Déductions du jury D (note finale)
        </h3>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted">
          {DEDUCTIONS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
