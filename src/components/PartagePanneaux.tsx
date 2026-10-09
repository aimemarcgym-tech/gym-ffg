"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";
import type { ReglagesCompetition } from "@/lib/data";

interface Donnees {
  club: string;
  equipe: string;
  niveau: string;
  ordres: {
    agres: string;
    label: string;
    gymnastes: { prenom: string; nom: string }[];
  }[];
  notes: {
    nbCompte: number;
    agres: string[];
    gymnastes: {
      nom: string;
      notes: (number | null)[];
      compte: boolean[];
      total: number;
    }[];
    totauxAgres: number[];
    maxAgres: number[];
    totalEquipe: number;
    maxEquipe: number;
  };
  reglagesEquipe?: ReglagesCompetition;
  reglages: { nom: string; reglages: ReglagesCompetition }[];
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const titre = "mb-3 text-lg font-semibold text-foreground";
const cellule = "px-2 py-1.5 text-right tabular-nums";

// Page publique des trois panneaux de l'onglet Ordres de passage d'une équipe, en lecture seule et sans compte.
export default function PartagePanneaux() {
  const [d, setD] = useState<Donnees | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<Donnees>(id) : null;
      setD(p && p.type === "panneaux" ? p.data : "introuvable");
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

  const n = d.notes;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{d.equipe}</span>
          </h1>
          <p className="text-sm text-muted">
            {d.club} · {d.niveau}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">
        <section>
          <h2 className={titre}>Ordres de passage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.ordres.map((o) => (
              <div
                key={o.agres}
                className="rounded-lg border border-border-subtle bg-surface p-3"
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {o.label}
                </h3>
                {o.gymnastes.length === 0 ? (
                  <p className="text-sm text-muted">Aucune gymnaste.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {o.gymnastes.map((g, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
                          {i + 1}
                        </span>
                        {g.prenom} {g.nom}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={titre}>Notes de départ</h2>
          <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface p-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="px-2 py-1.5 text-left font-semibold">
                    Gymnaste
                  </th>
                  {n.agres.map((a) => (
                    <th
                      key={a}
                      className="px-2 py-1.5 text-right font-semibold"
                    >
                      {a === "Barres asymétriques" ? "Barres" : a}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {n.gymnastes.map((g, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="px-2 py-1.5 text-foreground">{g.nom}</td>
                    {g.notes.map((v, k) => (
                      <td
                        key={k}
                        className={`${cellule} ${g.compte[k] ? "font-semibold text-foreground" : "text-muted"}`}
                      >
                        {v === null ? "—" : fmt(v)}
                      </td>
                    ))}
                    <td className={`${cellule} font-semibold text-foreground`}>
                      {fmt(g.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-strong font-semibold text-foreground">
                  <td className="px-2 py-1.5">Total équipe</td>
                  {n.totauxAgres.map((v, k) => (
                    <td key={k} className={cellule}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td className={`${cellule} accent-gradient-text`}>
                    {fmt(n.totalEquipe)}
                  </td>
                </tr>
                <tr className="text-muted">
                  <td className="px-2 py-1.5">Total max</td>
                  {n.maxAgres.map((v, k) => (
                    <td key={k} className={cellule}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td className={cellule}>{fmt(n.maxEquipe)}</td>
                </tr>
                <tr className="text-foreground">
                  <td className="px-2 py-1.5" colSpan={n.agres.length + 1}>
                    Total / total max
                  </td>
                  <td className={`${cellule} font-semibold`}>
                    {fmt(n.totalEquipe)} / {fmt(n.maxEquipe)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-2 text-xs text-muted">
              Note D du meilleur mouvement de chaque gymnaste à chaque agrès.
              Total équipe : les {n.nbCompte} meilleures notes de chaque agrès
              (en gras). Le Total max ne prend pas en compte le bonus
              artistique.
            </p>
          </div>
        </section>

        <section>
          <h2 className={titre}>Réglages du matériel</h2>
          {!d.reglagesEquipe && d.reglages.length === 0 && (
            <p className="text-sm text-muted">Aucun réglage renseigné.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ...(d.reglagesEquipe
                ? [{ nom: "Toute l’équipe", reglages: d.reglagesEquipe }]
                : []),
              ...d.reglages,
            ].map((g, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-surface p-3"
              >
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {g.nom}
                </h3>
                <dl className="space-y-1.5 text-sm">
                  {[
                    {
                      label: "Écart des barres",
                      valeur: g.reglages.ecartBarres,
                      unite: "cm",
                    },
                    {
                      label: "Tremplin à la table de saut",
                      valeur: g.reglages.tremplinCm,
                      unite: "cm",
                    },
                    {
                      label: "Tremplin à la table de saut",
                      valeur: g.reglages.tremplinPas,
                      unite: "pas",
                    },
                  ].map((l, k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-2"
                    >
                      <dt className="text-muted">{l.label}</dt>
                      <dd className="font-semibold text-foreground">
                        {l.valeur ? (
                          `${l.valeur} ${l.unite}`
                        ) : (
                          <span className="font-normal text-muted">
                            non renseigné
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
