"use client";

import { useState } from "react";
import GymnasteRow from "@/components/GymnasteRow";
import { useDragReorder } from "@/hooks/useDragReorder";
import { ageDansCategorie, ageEnSaison, getCategorie, getNiveau, niveauxDuProgramme } from "@/regulation/loader";
import { champPetit, couleurEquipe } from "@/lib/styles";
import type { Equipe, Gymnaste } from "@/lib/data";
import type { NiveauId } from "@/regulation/types";
import { ConfirmerEnLigne, RenommerEnLigne } from "@/components/EnLigne";
import PartageBouton from "@/components/PartageBouton";

interface Props {
  // null = gymnastes du club qui ne sont dans aucune équipe.
  equipe: Equipe | null;
  // Rang de création de l'équipe dans le club, à partir de 1 (repli quand le nom n'a pas de numéro).
  rang?: number;
  membres: Gymnaste[];
  gymnastesClub: Gymnaste[];
  nbMouvements: (gymnasteId: string) => number;
  onAjouter?: (gymnasteId: string) => void;
  onRetirer?: (gymnasteId: string) => void;
  onReordonner?: (ids: string[]) => void;
  onSupprimerGymnaste: (g: Gymnaste) => void;
  onSupprimer?: () => void;
  // Crée le lien de partage de l'équipe (ordre de passage, catégorie d'âge, mouvements) et renvoie son chemin.
  onPartager?: () => Promise<string>;
  onModifier?: (patch: { nom?: string; niveau?: NiveauId; categorieId?: string }) => void;
}

export default function EquipeGroupe(p: Props) {
  const [renomme, setRenomme] = useState(false);
  const [confSuppr, setConfSuppr] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const { equipe, membres } = p;
  const sans = equipe === null;
  const couleur = couleurEquipe(equipe?.nom ?? "", p.rang ?? 1);
  const niveau = equipe ? getNiveau(equipe.niveau) : null;
  const categorie = equipe ? getCategorie(equipe.niveau, equipe.categorieId) : undefined;
  const dnd = useDragReorder(
    membres.map((g) => g.id),
    (ids) => p.onReordonner?.(ids),
  );
  const disponibles = equipe ? p.gymnastesClub.filter((g) => !equipe.gymnasteIds.includes(g.id)) : [];

  const alertes: string[] = [];
  if (niveau) {
    if (membres.length > niveau.format.max) alertes.push(`${niveau.format.max} gymnastes maximum`);
  }

  function changerNiveau(id: NiveauId) {
    const cats = getNiveau(id).categories;
    const garde = cats.some((c) => c.id === equipe!.categorieId);
    p.onModifier?.({ niveau: id, categorieId: garde ? equipe!.categorieId : cats[0].id });
  }

  return (
    <div className={`border-l pl-2 sm:ml-4 sm:pl-3 ${sans ? "border-border-subtle" : couleur.border}`}>
      <div className="mb-2 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {renomme && equipe ? (
          <>
            <span className="flex items-center gap-2.5 text-sm text-muted">
              <span className={ouvert ? "rotate-90" : ""}>▶</span>
              <span className={`h-2.5 w-2.5 rounded-full ${couleur.dot}`} />
            </span>
            <RenommerEnLigne
              valeur={equipe.nom}
              className="!py-1 !text-sm"
              onAnnuler={() => setRenomme(false)}
              onOk={(n) => {
                p.onModifier?.({ nom: n });
                setRenomme(false);
              }}
            />
          </>
        ) : (
        <button onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} className="flex items-center gap-2.5 text-left text-sm font-medium text-muted hover:text-foreground">
          <span className={`transition-transform ${ouvert ? "rotate-90" : ""}`}>▶</span>
          {!sans && <span className={`h-2.5 w-2.5 rounded-full ${couleur.dot}`} />}
          <span className={sans ? "" : couleur.text}>{equipe ? equipe.nom : "Sans équipe"}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${sans ? "border-border-strong text-muted" : `${couleur.border} ${couleur.bg} ${couleur.text}`}`}
          >
            {membres.length}
          </span>
        </button>
        )}
        {niveau && <span className="text-xs text-muted">{niveau.label}</span>}
        {equipe && !renomme && (confSuppr ? (
          <ConfirmerEnLigne
            question={`Supprimer ${equipe.nom} ?`}
            onAnnuler={() => setConfSuppr(false)}
            onConfirmer={() => {
              setConfSuppr(false);
              p.onSupprimer?.();
            }}
          />
        ) : (
          <>
            <button
              onClick={() => setRenomme(true)}
              className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-muted hover:border-accent-solid/60 hover:text-foreground"
            >
              Renommer
            </button>
            {p.onSupprimer && (
              <button
                onClick={() => setConfSuppr(true)}
                className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Supprimer
              </button>
            )}
            {p.onPartager && (
              <PartageBouton
                onCreate={p.onPartager}
                className="accent-gradient rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:opacity-90 disabled:opacity-50"
              />
            )}
          </>
        ))}
      </div>

      {ouvert && (
        <div className="mb-4 space-y-3">
          {equipe && niveau && (
            <div className="flex flex-wrap items-center gap-2">
              <select value={equipe.niveau} onChange={(e) => changerNiveau(e.target.value as NiveauId)} className={champPetit} aria-label="Niveau">
                {niveauxDuProgramme(niveau.programme).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
              <select value={equipe.categorieId} onChange={(e) => p.onModifier?.({ categorieId: e.target.value })} className={champPetit} aria-label="Catégorie">
                {niveau.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted">
                Format {niveau.format.max}/{niveau.format.parAgres}/{niveau.format.notesComptees} · note D plafonnée à {niveau.plafondD.toString().replace(".", ",")}
              </span>
            </div>
          )}

          {alertes.map((a) => (
            <div key={a} className="text-xs text-danger">
              {a}
            </div>
          ))}

          {membres.length === 0 && <p className="text-sm text-muted">Aucune gymnaste ici.</p>}

          <ul className="space-y-2">
            {membres.map((g) => (
              <GymnasteRow
                key={g.id}
                gymnaste={g}
                rowRef={dnd.registre(g.id)}
                style={dnd.style(g.id)}
                nbMouvements={p.nbMouvements(g.id)}
                horsCategorie={categorie ? !ageDansCategorie(ageEnSaison(g.anneeNaissance), categorie) : false}
                poignee={equipe ? dnd.poignee(g.id) : undefined}
                onRetirer={equipe ? () => p.onRetirer?.(g.id) : undefined}
                onSupprimer={() => p.onSupprimerGymnaste(g)}
              />
            ))}
          </ul>

          {equipe && disponibles.length > 0 && (
            <select value="" onChange={(e) => e.target.value && p.onAjouter?.(e.target.value)} className={`${champPetit} w-full sm:w-72`} aria-label="Ajouter une gymnaste">
              <option value="">Ajouter une gymnaste…</option>
              {disponibles.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.prenom} {g.nom} ({ageEnSaison(g.anneeNaissance)} ans)
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
