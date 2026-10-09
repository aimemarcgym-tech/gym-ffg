"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";
import type { ReglagesCompetition } from "@/lib/data";

interface Donnees {
  club: string;
  equipe: string;
  // Liens récents : un jeu de réglages par gymnaste. Anciens liens : un seul jeu pour l'équipe.
  equipeEntiere?: ReglagesCompetition;
  gymnastes?: { nom: string; reglages: ReglagesCompetition }[];
  reglages?: ReglagesCompetition;
}

function Carte({ titre, r }: { titre?: string; r: ReglagesCompetition }) {
  const lignes: { label: string; valeur?: string; unite: string }[] = [
    {
      label: "Écart des barres asymétriques",
      valeur: r.ecartBarres,
      unite: "cm",
    },
    {
      label: "Tremplin : distance à la table de saut",
      valeur: r.tremplinCm,
      unite: "cm",
    },
    {
      label: "Tremplin : distance à la table de saut",
      valeur: r.tremplinPas,
      unite: "pas",
    },
  ];
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3">
      {titre && (
        <h2 className="mb-2 text-base font-semibold text-foreground">
          {titre}
        </h2>
      )}
      <div className="space-y-2">
        {lignes.map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{l.label}</span>
            <span className="text-lg font-semibold text-foreground">
              {l.valeur ? (
                `${l.valeur} ${l.unite}`
              ) : (
                <span className="text-sm font-normal text-muted">
                  non renseigné
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page publique des réglages du matériel d'une équipe (par gymnaste), en lecture seule et sans compte.
export default function PartageReglages() {
  const [d, setD] = useState<Donnees | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<Donnees>(id) : null;
      setD(p && p.type === "reglages" ? p.data : "introuvable");
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
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Réglages du matériel</span>
          </h1>
          <p className="text-sm text-muted">
            {d.equipe} ({d.club})
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {d.equipeEntiere && (
          <Carte titre="Toute l’équipe" r={d.equipeEntiere} />
        )}
        {d.gymnastes?.map((g, i) => (
          <Carte key={i} titre={g.nom} r={g.reglages} />
        ))}
        {!d.equipeEntiere && !d.gymnastes && <Carte r={d.reglages ?? {}} />}
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
