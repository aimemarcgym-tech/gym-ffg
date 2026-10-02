"use client";

import { useEffect, useMemo, useState } from "react";
import PanneauAnalyse from "@/components/PanneauAnalyse";
import PanneauMouvement from "@/components/PanneauMouvement";
import { calculerNoteD, calculerNoteDSaut, etatBonifications, noteDMax, sautsValides, type SautChoisi } from "@/engine/federal-a";
import { elementAutorise, getElementFedA, getNiveau } from "@/regulation/loader";
import { AGRES } from "@/regulation/libelles";
import { getShare } from "@/lib/shares";
import type { Agres, AgresAvecGrille, ElementFedA, NiveauId } from "@/regulation/types";

export interface MouvementPartage {
  nom: string;
  agres: Agres;
  niveau: NiveauId;
  elementIds: string[];
  bonifIds: string[];
  sauts: SautChoisi[];
}

export interface DonneesMouvements {
  gymnaste: string;
  mouvements: MouvementPartage[];
}

// Même présentation que dans le constructeur : « Mon mouvement » et « Analyse », en lecture seule.
function Vue({ m }: { m: MouvementPartage }) {
  const grille = m.agres !== "SAUT";
  const ag = m.agres as AgresAvecGrille;
  const niveau = getNiveau(m.niveau);
  const choisis = useMemo(
    () => m.elementIds.map(getElementFedA).filter((e): e is ElementFedA => !!e && e.agres === ag && elementAutorise(e, m.niveau)),
    [m, ag],
  );
  const sauts = useMemo(() => sautsValides(m.niveau, m.sauts), [m]);
  const noteD = grille ? calculerNoteD(ag, m.elementIds, m.bonifIds, m.niveau) : null;
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
        <PanneauMouvement elements={choisis} retenus={retenus} sauts={sauts} lectureSeule />
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

  if (d === null) return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Chargement…</main>;
  if (d === "introuvable") return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Ce lien de partage n’existe pas ou plus.</main>;

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
        {d.mouvements.length === 0 ? <p className="text-sm text-muted">Aucun mouvement.</p> : d.mouvements.map((m, i) => <Vue key={i} m={m} />)}
        <p className="text-center text-xs text-muted">Lien de partage en lecture seule, généré depuis l’application Gestion Compétitions &amp; Entraînements.</p>
      </main>
    </div>
  );
}
