"use client";

import { useEffect, useMemo, useState } from "react";
import PanneauAnalyse from "@/components/PanneauAnalyse";
import PanneauMouvement from "@/components/PanneauMouvement";
import {
  calculerNoteD,
  calculerNoteDSaut,
  etatBonifications,
  noteDMax,
  sautsValides,
  type SautChoisi,
} from "@/engine/federal-a";
import { elementsChoisis, getNiveau } from "@/regulation/loader";
import { AGRES } from "@/regulation/libelles";
import { getShare } from "@/lib/shares";
import type { SerieType } from "@/lib/data";
import { onglets, ongletBouton } from "@/lib/styles";
import type { Agres, AgresAvecGrille, NiveauId } from "@/regulation/types";

export interface MouvementPartage {
  nom: string;
  agres: Agres;
  niveau: NiveauId;
  elementIds: string[];
  bonifIds: string[];
  sauts: SautChoisi[];
  series?: Record<string, SerieType>;
  // Versions enregistrées du mouvement, consultables en lecture seule.
  instantanes?: InstantanePartage[];
}

export interface InstantanePartage {
  nom?: string;
  date: string;
  noteD: number;
  elementIds: string[];
  bonifIds: string[];
  sauts: SautChoisi[];
  series?: Record<string, SerieType>;
}

export interface DonneesMouvements {
  gymnaste: string;
  mouvements: MouvementPartage[];
}

const LIBELLE_LONG: Record<Agres, string> = {
  SAUT: "Saut",
  BARRES: "Barres asymétriques",
  POUTRE: "Poutre",
  SOL: "Sol",
};

// Même présentation que dans le constructeur : « Mon mouvement » et « Analyse », en lecture seule.
function Panneaux({ m }: { m: MouvementPartage }) {
  const grille = m.agres !== "SAUT";
  const ag = m.agres as AgresAvecGrille;
  const niveau = getNiveau(m.niveau);
  const choisis = useMemo(
    () => elementsChoisis(m.elementIds, ag, m.niveau),
    [m, ag],
  );
  const sauts = useMemo(() => sautsValides(m.niveau, m.sauts), [m]);
  const noteD = grille
    ? calculerNoteD(ag, m.elementIds, m.bonifIds, m.niveau)
    : null;
  const d = grille ? noteD!.total : calculerNoteDSaut(sauts);
  const etats = grille ? etatBonifications(ag, choisis, m.niveau) : [];
  const retenus = new Set(noteD?.elementsRetenus.map((x) => x.id));

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {m.nom}{" "}
        <span className="text-sm font-normal text-muted">
          · {AGRES.find((a) => a.id === m.agres)?.label} · {niveau.label}
        </span>
      </h2>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <PanneauMouvement
          elements={choisis}
          retenus={retenus}
          sauts={sauts}
          series={m.series}
          sansSeries={m.agres === "BARRES"}
          lectureSeule
        />
        <PanneauAnalyse
          agres={m.agres}
          niveau={niveau}
          nbElements={choisis.length}
          noteD={noteD}
          etats={etats}
          bonifsRetenues={noteD?.bonifsRetenues ?? []}
          nbSauts={sauts.length}
          d={d}
          dMax={noteDMax(m.niveau, m.agres)}
        />
      </div>
    </section>
  );
}

// Un mouvement : sa version actuelle et, s'il en a, ses instantanés, à consulter sans pouvoir les modifier.
function Vue({ m }: { m: MouvementPartage }) {
  const [version, setVersion] = useState<number | null>(null);
  const instantanes = m.instantanes ?? [];
  const i = version === null ? null : instantanes[version];
  const libelle = (x: InstantanePartage) =>
    x.nom ||
    new Date(x.date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  const aff: MouvementPartage = i
    ? {
        ...m,
        nom: `${m.nom} — ${libelle(i)}`,
        elementIds: i.elementIds,
        bonifIds: i.bonifIds,
        sauts: i.sauts,
        series: i.series,
      }
    : m;
  return (
    <div className="space-y-4">
      {instantanes.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
            Mouvements créés
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVersion(null)}
              className={`rounded border px-3 py-1.5 text-xs font-medium ${version === null ? "border-accent-solid text-white" : "border-border-strong text-muted hover:text-foreground"}`}
            >
              Version actuelle
            </button>
            {instantanes.map((x, k) => (
              <button
                key={k}
                onClick={() => setVersion(k)}
                className={`rounded border px-3 py-1.5 text-xs font-medium ${version === k ? "border-accent-solid text-white" : "border-border-strong text-muted hover:text-foreground"}`}
              >
                {libelle(x)} · D {x.noteD.toFixed(2).replace(".", ",")}
              </button>
            ))}
          </div>
        </div>
      )}
      <Panneaux key={version ?? -1} m={aff} />
    </div>
  );
}

// Onglets par agrès puis panneaux « Mon mouvement » et « Analyse » du mouvement choisi.
export function MouvementsAgres({
  mouvements,
}: {
  mouvements: MouvementPartage[];
}) {
  const [actif, setActif] = useState(0);
  if (mouvements.length === 0)
    return <p className="text-sm text-muted">Aucun mouvement.</p>;
  return (
    <div className="space-y-10">
      <div className={onglets}>
        {mouvements.map((m, i) => (
          <button
            key={i}
            onClick={() => setActif(i)}
            className={ongletBouton(i === actif, "flex-1 px-2 py-2.5")}
          >
            {LIBELLE_LONG[m.agres]} — {m.niveau}
          </button>
        ))}
      </div>
      <Vue key={actif} m={mouvements[Math.min(actif, mouvements.length - 1)]} />
    </div>
  );
}

// Page publique des mouvements d'une gymnaste (les quatre agrès), en lecture seule et sans compte.
export default function PartageMouvements() {
  const [d, setD] = useState<DonneesMouvements | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<DonneesMouvements>(id) : null;
      setD(p && p.type === "mouvements" ? p.data : "introuvable");
    })();
  }, []);

  if (d === null)
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">
        Chargement…
      </main>
    );
  if (d === "introuvable")
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">
        Ce lien de partage n’existe pas ou plus.
      </main>
    );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Mouvements</span>
          </h1>
          <p className="text-sm text-muted">{d.gymnaste}</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-10 px-6 py-8">
        <MouvementsAgres mouvements={d.mouvements} />
        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
