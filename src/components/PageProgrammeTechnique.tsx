"use client";

import { useState } from "react";
import ProgrammeEntrainement from "@/components/JournalEntrainement";
import SuiviElements, { type Ouverture } from "@/components/SuiviElements";
import {
  getEquipes,
  getGymnastes,
  getSuivis,
  supprimerSuivi,
  type Suivi,
} from "@/lib/data";
import { ConfirmerEnLigne } from "@/components/EnLigne";
import { btnDanger, btnDegrade } from "@/lib/styles";
import { AGRES } from "@/regulation/libelles";
import { getNiveau } from "@/regulation/loader";

interface Existant {
  suivi: Suivi;
  libelle: string;
}

// Page « Programme technique » : suivi des éléments, consignes (séances) et, en bas, les tableaux déjà créés.
// Ouvrir un tableau affiche aussi les consignes de la même équipe ou gymnaste.
export default function PageProgrammeTechnique() {
  const [ouverture, setOuverture] = useState<Ouverture | null>(null);
  const [liste, setListe] = useState<Existant[] | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  async function basculerListe() {
    if (liste) return setListe(null);
    const [suivis, equipes, gymnastes] = await Promise.all([
      getSuivis(),
      getEquipes(),
      getGymnastes(),
    ]);
    const existants: Existant[] = [];
    for (const s of suivis) {
      if (s.lignes.length === 0) continue;
      const libelle =
        s.cible.genre === "equipe"
          ? (() => {
              const e = equipes.find((x) => x.id === s.cible.id);
              return e
                ? `Équipe · ${e.nom} (${getNiveau(e.niveau).label})`
                : null;
            })()
          : (() => {
              const g = gymnastes.find((x) => x.id === s.cible.id);
              return g ? `Gymnaste · ${g.prenom} ${g.nom}` : null;
            })();
      if (libelle) existants.push({ suivi: s, libelle });
    }
    existants.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
    setListe(existants);
  }

  return (
    <>
      <SuiviElements ouverture={ouverture} />
      <ProgrammeEntrainement
        titre="Programme technique"
        type="TECHNIQUE"
        ouverture={ouverture}
      />

      <div className="print:hidden">
        <button
          onClick={basculerListe}
          aria-expanded={liste !== null}
          className={`${btnDegrade} px-6 py-3 text-base shadow`}
        >
          Tableaux déjà créés
        </button>
        {liste && (
          <ul className="mt-2 space-y-1">
            {liste.length === 0 && (
              <li className="text-xs text-muted">
                Aucun tableau rempli pour l’instant.
              </li>
            )}
            {liste.map((x) => (
              <li
                key={x.suivi.id}
                className="flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={() => {
                    setOuverture({
                      n: (ouverture?.n ?? 0) + 1,
                      cible: x.suivi.cible,
                      agres: x.suivi.agres,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left text-sm text-foreground hover:underline"
                >
                  {x.libelle} ·{" "}
                  {AGRES.find((a) => a.id === x.suivi.agres)?.label}{" "}
                  <span className="text-xs text-muted">
                    ({x.suivi.lignes.length} élément
                    {x.suivi.lignes.length > 1 ? "s" : ""})
                  </span>
                </button>
                {suppression === x.suivi.id ? (
                  <ConfirmerEnLigne
                    question="Supprimer ce tableau ?"
                    onAnnuler={() => setSuppression(null)}
                    onConfirmer={async () => {
                      await supprimerSuivi(x.suivi.id);
                      setSuppression(null);
                      setListe((l) =>
                        l ? l.filter((y) => y.suivi.id !== x.suivi.id) : l,
                      );
                      // Recharge le suivi affiché (le tableau supprimé, s'il l'était, apparaît vide).
                      setOuverture((o) => ({
                        n: (o?.n ?? 0) + 1,
                        cible: x.suivi.cible,
                        agres: x.suivi.agres,
                      }));
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setSuppression(x.suivi.id)}
                    className={btnDanger}
                  >
                    Supprimer
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
