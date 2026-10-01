"use client";

import { useState } from "react";
import { getElementsFedA, getElementsFedB, sautsFedA, sautsFedB } from "@/regulation/loader";
import { AGRES, LIBELLE_APPEL, LIBELLE_FAMILLE, ORDRE_APPEL, fmt, fmtValeur } from "@/regulation/libelles";
import { champ, onglets, ongletBouton } from "@/lib/styles";
import type { Gymnaste, StatutCompetence } from "@/lib/data";
import type { Agres, ElementFedA, Programme } from "@/regulation/types";

interface Pastille {
  id: string;
  famille: string;
  libelle: string;
  nom: string;
  appel?: ElementFedA["appel"];
}

function pastilles(agres: Agres, programme: Programme): Pastille[] {
  if (agres === "SAUT") {
    if (programme === "B") return sautsFedB.map((s) => ({ id: s.id, famille: "SAUT", libelle: `${s.niveaux?.[0]} · ${fmt(s.valeurTremplin)}`, nom: s.nom }));
    return sautsFedA.map((s) => ({
      id: s.id,
      famille: "SAUT",
      libelle: `${s.niveaux?.length === 1 ? `${s.niveaux[0]} · ` : ""}${fmt(s.valeurTrampoTremp)} / ${fmt(s.valeurTremplin)}`,
      nom: s.nom,
    }));
  }
  return (programme === "B" ? getElementsFedB(agres) : getElementsFedA(agres))
    .sort((a, b) => a.valeur - b.valeur)
    .map((e) => ({ id: e.id, famille: e.famille, libelle: fmtValeur(e), nom: e.nom, appel: e.appel }));
}

// Mêmes couleurs de statut que le profil technique du site UFOLEP.
const STYLE: Record<StatutCompetence | "AUCUN", string> = {
  MAITRISE: "bg-success/10 text-success border-success/40",
  APPRENTISSAGE: "bg-warning/10 text-warning border-warning/40",
  AUCUN: "bg-surface-alt text-muted border-border-strong",
};

const SUIVANT: Record<StatutCompetence | "AUCUN", StatutCompetence | null> = {
  AUCUN: "APPRENTISSAGE",
  APPRENTISSAGE: "MAITRISE",
  MAITRISE: null,
};

interface Props {
  gymnaste: Gymnaste;
  onChanger: (elementId: string, statut: StatutCompetence | null) => void;
}

export default function ProfilTechnique({ gymnaste, onChanger }: Props) {
  const [agres, setAgres] = useState<Agres>("SOL");
  const [programme, setProgramme] = useState<Programme>("A");
  const [famille, setFamille] = useState("");
  const [recherche, setRecherche] = useState("");

  const toutes = pastilles(agres, programme);
  const familles = [...new Set(toutes.map((p) => p.famille))].filter((f) => f !== "SAUT");
  const q = recherche.trim().toLowerCase();
  const visibles = toutes.filter(
    (p) => (!famille || p.famille === famille) && (!q || p.nom.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
  );
  const groupes = [...new Set(visibles.map((p) => p.famille))];
  const comp = gymnaste.competences ?? {};
  const nbMaitrises = toutes.filter((p) => comp[p.id] === "MAITRISE").length;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-foreground">Profil technique</h2>
      <p className="mb-4 text-sm text-muted">
        Indiquez ce que {gymnaste.prenom} maîtrise déjà, par agrès. Ces statuts sont repris dans la Bibliothèque du constructeur de mouvement.
      </p>

      <div className={`${onglets} mb-3 inline-flex flex-wrap`}>
        {(["A", "B"] as Programme[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setProgramme(p);
              setFamille("");
            }}
            className={ongletBouton(programme === p, "px-5 py-2.5")}
          >
            Fédéral {p}
          </button>
        ))}
      </div>
      <br />
      <div className={`${onglets} mb-4 inline-flex flex-wrap`}>
        {AGRES.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAgres(a.id);
              setFamille("");
            }}
            className={ongletBouton(agres === a.id, "px-5 py-2.5")}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {familles.length > 0 && (
          <select value={famille} onChange={(e) => setFamille(e.target.value)} className={`${champ} sm:w-64`} aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            {familles.map((f) => (
              <option key={f} value={f}>
                {LIBELLE_FAMILLE[f] ?? f}
              </option>
            ))}
          </select>
        )}
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un élément (nom ou code)…" className={`${champ} max-w-md flex-1`} />
        <span className="text-xs text-muted">
          {nbMaitrises}/{toutes.length} maîtrisés
        </span>
      </div>

      <p className="mb-4 text-xs text-muted">
        Cliquez sur un élément pour faire tourner son statut : <span className="text-danger">✕</span> non disponible → <span className="text-warning">○</span> en apprentissage →{" "}
        <span className="text-success">✓</span> maîtrisé
      </p>

      {visibles.length === 0 && <p className="text-sm text-muted">Aucun élément ne correspond.</p>}

      <div className="space-y-4">
        {groupes.map((f) => (
          <div key={f}>
            {agres !== "SAUT" && <h3 className="mb-2 text-sm font-semibold text-foreground">{LIBELLE_FAMILLE[f] ?? f}</h3>}
            {(() => {
              const deLaFamille = visibles.filter((x) => x.famille === f);
              const pastille = (x: Pastille) => {
                const statut = comp[x.id] ?? "AUCUN";
                return (
                  <button
                    key={x.id}
                    title={`${x.nom} — ${x.id}`}
                    onClick={() => onChanger(x.id, SUIVANT[statut])}
                    className={`max-w-[26rem] truncate rounded-full border px-3 py-1.5 text-left text-xs hover:border-accent-solid/60 ${STYLE[statut]}`}
                  >
                    {statut === "MAITRISE" ? "✓ " : statut === "APPRENTISSAGE" ? "○ " : ""}
                    <span className="opacity-70">[{x.libelle}]</span> {x.nom}
                  </button>
                );
              };
              // Les sauts sont séparés par appel (1 pied, 2 pieds, 1 ou 2 pieds).
              if (deLaFamille.some((x) => x.appel)) {
                return (
                  <div className="space-y-3">
                    {ORDRE_APPEL.map((ap) => {
                      const groupe = deLaFamille.filter((x) => x.appel === ap);
                      if (!groupe.length) return null;
                      return (
                        <div key={ap}>
                          <div className="mb-1.5 text-xs font-medium text-muted">{LIBELLE_APPEL[ap]}</div>
                          <div className="flex flex-wrap gap-2">{groupe.map(pastille)}</div>
                        </div>
                      );
                    })}
                    {deLaFamille.some((x) => !x.appel) && <div className="flex flex-wrap gap-2">{deLaFamille.filter((x) => !x.appel).map(pastille)}</div>}
                  </div>
                );
              }
              return <div className="flex flex-wrap gap-2">{deLaFamille.map(pastille)}</div>;
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}
