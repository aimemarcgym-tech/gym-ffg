"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";
import { STYLE_NIVEAU } from "@/lib/styles";
import type { NiveauId } from "@/regulation/types";

export interface DonneesCategories {
  club: string;
  equipe: string;
  niveauId: NiveauId;
  niveau: string;
  membres: { prenom: string; nom: string; annee: number; age: number }[];
  categories: { label: string; annees: string }[];
  choisie: string | null;
}

// Page publique du panneau « Vérifier une équipe » des catégories d'âges, en lecture seule et sans compte.
export default function PartageCategories() {
  const [d, setD] = useState<DonneesCategories | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<DonneesCategories>(id) : null;
      setD(p && p.type === "categories" ? p.data : "introuvable");
    })();
  }, []);

  if (d === null) return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Chargement…</main>;
  if (d === "introuvable") return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Ce lien de partage n’existe pas ou plus.</main>;

  const visibles = d.choisie ? d.categories.filter((c) => c.label === d.choisie) : d.categories;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Catégorie d’âge</span>
          </h1>
          <p className="text-sm text-muted">
            {d.equipe} ({d.club}) · {d.niveau}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <ul className="space-y-1 text-sm text-muted">
          {d.membres.map((g, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-foreground">
                {g.prenom} {g.nom}
              </span>
              <span>
                {g.annee} · {g.age} ans
              </span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{d.niveau}</p>
          {visibles.length === 0 ? (
            <p className="text-sm text-warning">⚠ Aucune catégorie ne correspond à l’écart d’âge de cette équipe en {d.niveau}.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibles.map((c) => (
                <span key={c.label} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${STYLE_NIVEAU[d.niveauId as keyof typeof STYLE_NIVEAU]}`}>
                  {c.label}
                  <span className="ml-1 opacity-70">({c.annees})</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted">Lien de partage en lecture seule, généré depuis l’application Gestion Compétitions &amp; Entraînements.</p>
      </main>
    </div>
  );
}
