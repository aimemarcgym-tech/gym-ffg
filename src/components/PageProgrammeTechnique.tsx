"use client";

import { useState } from "react";
import ProgrammeEntrainement from "@/components/JournalEntrainement";
import SuiviElements, { type Ouverture } from "@/components/SuiviElements";
import {
  getEquipes,
  getGymnastes,
  getSuivis,
  getToutesSeances,
  type Seance,
  supprimerSuivi,
  type Gymnaste,
  type Suivi,
} from "@/lib/data";
import { ConfirmerEnLigne } from "@/components/EnLigne";
import { btnDanger, btnDegrade } from "@/lib/styles";
import ListeDeroulanteHaut from "@/components/ListeDeroulanteHaut";
import { AGRES } from "@/regulation/libelles";
import { getNiveau } from "@/regulation/loader";
import type { NiveauId } from "@/regulation/types";

interface SeanceListee {
  seance: Seance;
  libelle: string;
}

interface Existant {
  suivi: Suivi;
  libelle: string;
  membres: Gymnaste[];
  niveau: NiveauId;
}

// Page « Programme technique » : suivi des éléments, consignes (séances) et, en bas, les tableaux déjà créés.
// Ouvrir un tableau affiche aussi les consignes de la même équipe ou gymnaste.
export default function PageProgrammeTechnique() {
  const [ouverture, setOuverture] = useState<Ouverture | null>(null);
  const [liste, setListe] = useState<Existant[] | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);
  const [choixTableau, setChoixTableau] = useState("");
  // Équipe sélectionnée, partagée entre le suivi et le programme technique.
  const [equipeCommune, setEquipeCommune] = useState<string | undefined>();
  const [seances, setSeances] = useState<SeanceListee[] | null>(null);

  // Séances déjà créées (programme technique), de toutes les équipes et gymnastes, les plus récentes d'abord.
  async function basculerSeances() {
    if (seances) return setSeances(null);
    const [toutes, equipes, gymnastes] = await Promise.all([
      getToutesSeances("TECHNIQUE"),
      getEquipes(),
      getGymnastes(),
    ]);
    const liste: SeanceListee[] = [];
    for (const x of toutes) {
      const libelle =
        x.cible.genre === "equipe"
          ? (() => {
              const e = equipes.find((y) => y.id === x.cible.id);
              return e ? `${e.nom}` : null;
            })()
          : (() => {
              const g = gymnastes.find((y) => y.id === x.cible.id);
              return g ? `${g.prenom} ${g.nom}` : null;
            })();
      if (libelle) liste.push({ seance: x, libelle });
    }
    setSeances(liste);
  }

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
      if (s.cible.genre === "equipe") {
        const e = equipes.find((x) => x.id === s.cible.id);
        if (!e) continue;
        existants.push({
          suivi: s,
          libelle: `${e.nom} (${getNiveau(e.niveau).label})`,
          niveau: e.niveau,
          membres: e.gymnasteIds
            .map((id) => gymnastes.find((g) => g.id === id))
            .filter((g): g is Gymnaste => !!g),
        });
      } else {
        const g = gymnastes.find((x) => x.id === s.cible.id);
        if (!g) continue;
        existants.push({
          suivi: s,
          libelle: `${g.prenom} ${g.nom}`,
          niveau:
            equipes.find((e) => e.gymnasteIds.includes(g.id))?.niveau ?? "A",
          membres: [g],
        });
      }
    }
    existants.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
    setListe(existants);
  }

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[40rem_minmax(0,1fr)]">
        <div className="order-2 print:hidden lg:order-1">
          <ProgrammeEntrainement
            titre="Programme technique"
            type="TECHNIQUE"
            listeMasquee
            ouverture={ouverture}
            equipeCommune={equipeCommune}
            onEquipe={setEquipeCommune}
          />
        </div>
        <div className="order-1 min-w-0 max-w-[60rem] lg:order-2">
          <SuiviElements
            ouverture={ouverture}
            equipeCommune={equipeCommune}
            onEquipe={setEquipeCommune}
          />
        </div>
      </div>

      <div className="print:hidden">
        {seances && (
          <div className="mb-3">
            {seances.length === 0 ? (
              <p className="text-xs text-muted">
                Aucune séance enregistrée pour l’instant.
              </p>
            ) : (
              <ListeDeroulanteHaut
                value=""
                placeholder="Choisir une séance…"
                ariaLabel="Mes séances"
                className="max-w-full sm:w-[36rem]"
                options={seances.map((x) => ({
                  value: x.seance.id,
                  label: `${new Date(x.seance.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} · ${x.libelle} · ${x.seance.contenu.length > 40 ? x.seance.contenu.slice(0, 40) + "…" : x.seance.contenu}${x.seance.tableaux?.length ? ` (${x.seance.tableaux.length} tableau${x.seance.tableaux.length > 1 ? "x" : ""})` : ""}`,
                }))}
                onChange={(id) => {
                  const x = seances.find((y) => y.seance.id === id);
                  if (!x) return;
                  setOuverture((o) => ({
                    n: (o?.n ?? 0) + 1,
                    cible: x.seance.cible,
                    seanceId: x.seance.id,
                  }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        )}
        {liste && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {liste.length === 0 ? (
              <p className="text-xs text-muted">
                Aucun tableau rempli pour l’instant.
              </p>
            ) : (
              <>
                <ListeDeroulanteHaut
                  value={choixTableau}
                  placeholder="Choisir un tableau…"
                  ariaLabel="Mes tableaux"
                  className="max-w-full sm:w-[28rem]"
                  options={liste.map((x) => ({
                    value: x.suivi.id,
                    label: `${x.libelle} · ${AGRES.find((a) => a.id === x.suivi.agres)?.label} (${x.suivi.lignes.length} élément${x.suivi.lignes.length > 1 ? "s" : ""})`,
                  }))}
                  onChange={(id) => {
                    setChoixTableau(id);
                    setSuppression(null);
                    const x = liste.find((y) => y.suivi.id === id);
                    if (!x) return;
                    setOuverture({
                      n: (ouverture?.n ?? 0) + 1,
                      cible: x.suivi.cible,
                      agres: x.suivi.agres,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                {(() => {
                  const x = liste.find((y) => y.suivi.id === choixTableau);
                  if (!x) return null;
                  return suppression === x.suivi.id ? (
                    <ConfirmerEnLigne
                      question="Supprimer ce tableau ?"
                      onAnnuler={() => setSuppression(null)}
                      onConfirmer={async () => {
                        await supprimerSuivi(x.suivi.id);
                        setSuppression(null);
                        setChoixTableau("");
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
                  );
                })()}
              </>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={basculerListe}
            aria-expanded={liste !== null}
            className={`${btnDegrade} px-5 py-2.5 text-sm shadow`}
          >
            Mes tableaux
          </button>
          <button
            onClick={basculerSeances}
            aria-expanded={seances !== null}
            className={`${btnDegrade} px-5 py-2.5 text-sm shadow`}
          >
            Mes séances
          </button>
        </div>
      </div>
    </>
  );
}
