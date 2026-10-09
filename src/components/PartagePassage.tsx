"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getShare } from "@/lib/shares";
import { onglets, ongletBouton } from "@/lib/styles";

interface Nom {
  prenom: string;
  nom: string;
}
interface UnAgres {
  club: string;
  equipe: string;
  agres: string;
  agresLabel: string;
  gymnastes: Nom[];
}
interface TousAgres {
  club: string;
  equipe: string;
  agres: { agres: string; agresLabel: string; gymnastes: Nom[] }[];
}

function Liste({ gymnastes }: { gymnastes: Nom[] }) {
  return gymnastes.length === 0 ? (
    <p className="text-sm text-muted">Aucune gymnaste dans cette équipe.</p>
  ) : (
    <ol className="space-y-1.5">
      {gymnastes.map((g, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <span className="text-foreground">
            {g.prenom} {g.nom}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Page({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{titre}</span>
          </h1>
          <p className="text-sm text-muted">{sousTitre}</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {children}
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

// Page publique d'un ordre de passage (un agrès) ou de tous les agrès, sans compte.
export default function PartagePassage({ tous }: { tous: boolean }) {
  const [partage, setPartage] = useState<
    UnAgres | TousAgres | "introuvable" | null
  >(null);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    // Le paramètre d'URL n'est lisible que côté client avec l'export statique.
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<UnAgres | TousAgres>(id) : null;
      setPartage(
        p && p.type === (tous ? "ordresPassage" : "ordrePassage")
          ? p.data
          : "introuvable",
      );
    })();
  }, [tous]);

  if (partage === null)
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">
        Chargement…
      </main>
    );
  if (partage === "introuvable")
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">
        Ce lien de partage n’existe pas ou plus.
      </main>
    );

  if (tous) {
    const d = partage as TousAgres;
    return (
      <Page titre="Ordres de passage" sousTitre={`${d.equipe} (${d.club})`}>
        <div className={onglets}>
          {d.agres.map((a, i) => (
            <button
              key={a.agres}
              type="button"
              onClick={() => setActif(i)}
              className={ongletBouton(i === actif, "flex-1 px-2 py-2.5")}
            >
              {a.agresLabel}
            </button>
          ))}
        </div>
        {d.agres[Math.min(actif, d.agres.length - 1)] && (
          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
              {d.agres[Math.min(actif, d.agres.length - 1)].agresLabel}
            </h2>
            <Liste
              gymnastes={d.agres[Math.min(actif, d.agres.length - 1)].gymnastes}
            />
          </section>
        )}
      </Page>
    );
  }

  const d = partage as UnAgres;
  return (
    <Page
      titre={`Ordre de passage — ${d.agresLabel}`}
      sousTitre={`${d.equipe} (${d.club})`}
    >
      <Liste gymnastes={d.gymnastes} />
    </Page>
  );
}
