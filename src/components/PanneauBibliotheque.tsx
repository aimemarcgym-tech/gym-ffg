"use client";

import { useMemo, useState } from "react";
import { ageEnSaison, getSautsNiveau } from "@/regulation/loader";
import { LIBELLE_APPEL, LIBELLE_FAMILLE, ORDRE_APPEL, fmt, fmtValeur } from "@/regulation/libelles";
import { champ, panneau, titrePanneau } from "@/lib/styles";
import { bonifsElement, type SautChoisi } from "@/engine/federal-a";
import type { Gymnaste } from "@/lib/data";
import type { Agres, Appareil, ElementFedA, NiveauId } from "@/regulation/types";

interface Props {
  agres: Agres;
  elements: ElementFedA[];
  choisis: ElementFedA[];
  gymnaste: Gymnaste | null;
  niveauId: NiveauId;
  sauts: SautChoisi[];
  onBasculer: (id: string) => void;
  onBasculerSaut: (idSaut: string, appareil: Appareil) => void;
}

function Statut({ statut }: { statut?: "MAITRISE" | "APPRENTISSAGE" }) {
  if (statut === "MAITRISE") return <span className="text-xs text-success">✓</span>;
  if (statut === "APPRENTISSAGE") return <span className="text-xs text-warning">○</span>;
  return null;
}

export default function PanneauBibliotheque(p: Props) {
  const [famille, setFamille] = useState("");
  const [recherche, setRecherche] = useState("");
  const [maitrisesSeules, setMaitrisesSeules] = useState(false);
  const comp = p.gymnaste?.competences ?? {};
  // L'option « 7/9 ans » (saut à 1,00 m) n'est proposée qu'aux gymnastes de 7 à 9 ans.
  const age = p.gymnaste ? ageEnSaison(p.gymnaste.anneeNaissance) : null;
  const age7a9 = age !== null && age >= 7 && age <= 9;
  const idsChoisis = new Set(p.choisis.map((e) => e.id));

  const familles = useMemo(() => [...new Set(p.elements.map((e) => e.famille))], [p.elements]);
  const q = recherche.trim().toLowerCase();
  const visibles = p.elements
    .filter((e) => (!famille || e.famille === famille) && (!q || e.nom.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)))
    .filter((e) => !maitrisesSeules || comp[e.id] === "MAITRISE")
    .sort((a, b) => a.valeur - b.valeur);

  // Quand une catégorie de sauts est choisie, on sépare les sauts par appel.
  const parAppel = famille !== "" && visibles.some((e) => e.appel);

  const carte = (e: ElementFedA) => {
    const dedans = idsChoisis.has(e.id);
    const bonus = bonifsElement(e, p.niveauId);
    return (
      <button
        key={e.id}
        onClick={() => p.onBasculer(e.id)}
        title={e.nom}
        className="flex flex-col items-start gap-1 rounded border border-border-subtle bg-surface-alt p-2 text-left hover:border-accent-solid/60 hover:bg-accent-from/10"
      >
        <div className="flex w-full items-center justify-between">
          <span className="flex flex-wrap items-center gap-1">
            <span className={`rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] ${dedans ? "text-success" : "text-muted"}`}>
              {dedans ? "✓ " : ""}
              {fmtValeur(e)}
            </span>
            {e.sortie && (
              <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">Sortie</span>
            )}
            {bonus.length > 0 && (
              <span
                title={`Sert la bonification : ${bonus.map((b) => b.label).join(" ; ")}`}
                className="rounded-full border border-accent-solid/40 bg-accent-solid/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-solid"
              >
                Bonus · {[...new Set(bonus.map((b) => b.court))].join(" · ")}
              </span>
            )}
          </span>
          <Statut statut={comp[e.id]} />
        </div>
        <span className="text-xs leading-snug text-foreground">{e.nom}</span>
      </button>
    );
  };

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Bibliothèque</h2>

      {p.agres !== "SAUT" ? (
        <>
          <p className="mb-2 text-xs text-muted">Tout le référentiel — cherchez et ajoutez librement n’importe quel élément.</p>
          <select value={famille} onChange={(e) => setFamille(e.target.value)} aria-label="Catégorie" className={`${champ} mb-2`}>
            <option value="">Toutes les catégories</option>
            {familles.map((f) => (
              <option key={f} value={f}>
                {LIBELLE_FAMILLE[f] ?? f}
              </option>
            ))}
          </select>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher (nom, code)…" className={`${champ} mb-2`} />
          {p.gymnaste && (
            <label className="mb-2 flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={maitrisesSeules} onChange={(e) => setMaitrisesSeules(e.target.checked)} />
              N’afficher que les éléments maîtrisés par la gymnaste
            </label>
          )}
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
            {parAppel ? (
              ORDRE_APPEL.map((ap) => {
                const groupe = visibles.filter((e) => e.appel === ap);
                if (!groupe.length) return null;
                return (
                  <div key={ap}>
                    <h3 className="mb-1.5 text-xs font-semibold text-foreground">{LIBELLE_APPEL[ap]}</h3>
                    <div className="grid grid-cols-2 gap-2">{groupe.map(carte)}</div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-2 gap-2">{visibles.map(carte)}</div>
            )}
            {parAppel && visibles.some((e) => !e.appel) && (
              <div className="grid grid-cols-2 gap-2">{visibles.filter((e) => !e.appel).map(carte)}</div>
            )}
            {visibles.length === 0 && <p className="text-xs text-muted">Aucun élément ne correspond à ce filtre.</p>}
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">
            {getSautsNiveau(p.niveauId)[0]?.unique ? "Deux sauts au maximum : le meilleur est retenu (même note D avec tremplin ou trampo-tremp)." : "Deux sauts au maximum : choisissez aussi le tremplin utilisé."}
          </p>
          <div className="grid max-h-[32rem] gap-2 overflow-y-auto pr-2">
            {getSautsNiveau(p.niveauId).map((s) => (
              <div key={s.id} className="rounded border border-border-subtle bg-surface-alt p-2">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-xs leading-snug text-foreground">{s.nom}</span>
                  <Statut statut={comp[s.id]} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {((s.unique ? ["TRAMPO_TREMP"] : s.valeur79 !== undefined && age7a9 ? ["TRAMPO_TREMP", "TREMPLIN", "ANS79"] : ["TRAMPO_TREMP", "TREMPLIN"]) as Appareil[]).map((app) => {
                    const actif = p.sauts.some((x) => x.idSaut === s.id && x.appareil === app);
                    const v = app === "ANS79" ? (s.valeur79 ?? 0) : app === "TRAMPO_TREMP" ? s.valeurTrampoTremp : s.valeurTremplin;
                    return (
                      <button
                        key={app}
                        onClick={() => p.onBasculerSaut(s.id, app)}
                        className="flex-1 rounded border border-border-strong px-2 py-1.5 text-xs text-foreground hover:border-accent-solid/60"
                      >
                        {actif && <span className="text-success">✓ </span>}
                        {s.unique ? "Note D" : app === "ANS79" ? "7/9 ans (saut 1,00 m)" : app === "TRAMPO_TREMP" ? "Trampo-tremp" : "1 tremplin"} · {fmt(v)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
