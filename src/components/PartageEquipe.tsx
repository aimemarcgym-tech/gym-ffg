"use client";

import { useEffect, useState } from "react";
import { MouvementsAgres, type MouvementPartage } from "@/components/PartageMouvements";
import { getShare } from "@/lib/shares";
import { onglets, ongletBouton } from "@/lib/styles";

export interface DonneesEquipe {
  club: string;
  equipe: string;
  niveau: string;
  categorie: { label: string; annees: string } | null;
  ordres: { agres: string; label: string; gymnastes: string[] }[];
  gymnastes: { prenom: string; nom: string; mouvements: MouvementPartage[] }[];
}

const titre = "mb-3 text-lg font-semibold text-foreground";

// Page publique d'une équipe : catégorie d'âge, ordre de passage des quatre agrès et mouvements de chaque gymnaste, sans compte.
export default function PartageEquipe() {
  const [d, setD] = useState<DonneesEquipe | "introuvable" | null>(null);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<DonneesEquipe>(id) : null;
      setD(p && p.type === "equipe" ? p.data : "introuvable");
    })();
  }, []);

  if (d === null) return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Chargement…</main>;
  if (d === "introuvable") return <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">Ce lien de partage n’existe pas ou plus.</main>;

  const g = d.gymnastes[Math.min(actif, d.gymnastes.length - 1)];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{d.equipe}</span>
          </h1>
          <p className="text-sm text-muted">
            {d.club} · {d.niveau}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-8">
        <section>
          <h2 className={titre}>Catégorie d’âge</h2>
          {d.categorie ? (
            <p className="text-sm text-foreground">
              {d.categorie.label} <span className="text-muted">({d.categorie.annees})</span>
            </p>
          ) : (
            <p className="text-sm text-muted">Non renseignée.</p>
          )}
        </section>

        <section>
          <h2 className={titre}>Ordre de passage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.ordres.map((o) => (
              <div key={o.agres} className="rounded-lg border border-border-subtle bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-foreground">{o.label}</h3>
                {o.gymnastes.length === 0 ? (
                  <p className="text-sm text-muted">Aucune gymnaste.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {o.gymnastes.map((nom, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">{i + 1}</span>
                        {nom}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={titre}>Mouvements des gymnastes</h2>
          {d.gymnastes.length === 0 ? (
            <p className="text-sm text-muted">Aucune gymnaste dans cette équipe.</p>
          ) : (
            <div className="space-y-4">
              <div className={`${onglets} flex-wrap`}>
                {d.gymnastes.map((x, i) => (
                  <button key={i} onClick={() => setActif(i)} className={ongletBouton(i === actif, "flex-1 px-3 py-2.5")}>
                    {x.prenom} {x.nom}
                  </button>
                ))}
              </div>
              <MouvementsAgres key={actif} mouvements={g.mouvements} />
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted">Lien de partage en lecture seule, généré depuis l’application Gestion Compétitions &amp; Entraînements.</p>
      </main>
    </div>
  );
}
