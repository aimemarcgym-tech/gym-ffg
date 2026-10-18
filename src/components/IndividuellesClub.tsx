"use client";

import { useState } from "react";
import GymnasteRow from "@/components/GymnasteRow";
import {
  ageDansCategorie,
  ageEnSaison,
  categoriesIndividuelles,
  categorieIndividuelle,
} from "@/regulation/loader";
import { champPetit } from "@/lib/styles";
import type { Gymnaste, Individuelle } from "@/lib/data";
import type { NiveauFed, NiveauId } from "@/regulation/types";

interface Props {
  individuelles: Individuelle[];
  // Gymnastes du club ; celles qui n'ont pas encore d'individuelle dans ce panneau peuvent y être ajoutées.
  gymnastesClub: Gymnaste[];
  // Niveaux proposés dans le panneau en cours (Fédéral A, Fédéral B ou Performance).
  niveaux: NiveauFed[];
  nbMouvements: (gymnasteId: string) => number;
  onAjouter: (gymnasteId: string) => void;
  onModifier: (
    id: string,
    patch: { niveau?: NiveauId; categorieId?: string },
  ) => void;
  onRetirer: (id: string) => void;
  onSupprimerGymnaste: (g: Gymnaste) => void;
}

// Individuelles d'un club : chaque gymnaste y a son propre niveau et sa propre catégorie, indépendants de ses équipes.
export default function IndividuellesClub(p: Props) {
  const [ouvert, setOuvert] = useState(false);
  const deja = new Set(p.individuelles.map((i) => i.gymnasteId));
  const disponibles = p.gymnastesClub.filter((g) => !deja.has(g.id));

  return (
    <div className="border-l border-border-strong pl-2 sm:ml-4 sm:pl-3">
      <div className="mb-2 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <button
          onClick={() => setOuvert(!ouvert)}
          aria-expanded={ouvert}
          className="flex items-center gap-2.5 text-left text-base font-medium text-muted hover:text-foreground"
        >
          <span className={`transition-transform ${ouvert ? "rotate-90" : ""}`}>
            ▶
          </span>
          Individuelles
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-sm text-muted">
            {p.individuelles.length}
          </span>
        </button>
      </div>

      {ouvert && (
        <div className="mb-4 space-y-3">
          {p.individuelles.length === 0 && (
            <p className="text-sm text-muted">Aucune individuelle ici.</p>
          )}
          <ul className="space-y-3">
            {p.individuelles.map((i) => {
              const g = p.gymnastesClub.find((x) => x.id === i.gymnasteId);
              if (!g) return null;
              const categorie = categorieIndividuelle(
                i.niveau,
                i.categorieId,
                g.anneeNaissance,
              );
              return (
                <li key={i.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 pl-12">
                    <select
                      value={i.niveau}
                      onChange={(e) => {
                        const id = e.target.value as NiveauId;
                        p.onModifier(i.id, {
                          niveau: id,
                          categorieId: categorieIndividuelle(
                            id,
                            i.categorieId,
                            g.anneeNaissance,
                          ).id,
                        });
                      }}
                      className={champPetit}
                      aria-label="Niveau"
                    >
                      {p.niveaux.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={categorie.id}
                      onChange={(e) =>
                        p.onModifier(i.id, { categorieId: e.target.value })
                      }
                      className={champPetit}
                      aria-label="Catégorie"
                    >
                      {categoriesIndividuelles(i.niveau).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ul>
                    <GymnasteRow
                      gymnaste={g}
                      nbMouvements={p.nbMouvements(g.id)}
                      horsCategorie={
                        categorie
                          ? !ageDansCategorie(
                              ageEnSaison(g.anneeNaissance),
                              categorie,
                            )
                          : false
                      }
                      question={`Retirer l’individuelle de ${g.prenom} ${g.nom} ? Son profil et son équipe sont conservés.`}
                      onSupprimer={() => p.onRetirer(i.id)}
                    />
                  </ul>
                </li>
              );
            })}
          </ul>

          {disponibles.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && p.onAjouter(e.target.value)}
              className={`${champPetit} w-full sm:w-72`}
              aria-label="Ajouter une individuelle"
            >
              <option value="">Ajouter une individuelle…</option>
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
