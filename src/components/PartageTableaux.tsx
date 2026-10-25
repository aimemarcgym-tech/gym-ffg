"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";

type Etat = "x" | "or" | "ok" | null;

interface Donnees {
  titre: string;
  agres: string;
  colonnes: string[];
  lignes: { libelle: string; etats: Etat[] }[];
}

// Page publique d'un tableau de suivi des éléments, en lecture seule et sans compte.
export default function PartageTableaux() {
  const [d, setD] = useState<Donnees | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<Donnees>(id) : null;
      setD(p && p.type === "tableaux" ? p.data : "introuvable");
    })();
  }, []);

  if (d === null)
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted">
        Chargement…
      </main>
    );
  if (d === "introuvable")
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted">
        Ce lien de partage n’existe pas ou plus.
      </main>
    );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Suivi des éléments</span>
          </h1>
          <p className="text-sm text-muted">
            {d.titre} · {d.agres}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-3 px-6 py-8">
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Élément</th>
                {d.colonnes.map((n, j) => (
                  <th
                    key={j}
                    className="px-3 py-2 text-center font-medium whitespace-nowrap"
                  >
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.lignes.map((l, j) => (
                <tr key={j} className="border-t border-border-subtle">
                  <td className="px-3 py-1.5 text-foreground">{l.libelle}</td>
                  {l.etats.map((e, m) => (
                    <td key={m} className="px-1 py-1 text-center">
                      {e === "x" && (
                        <span className="font-bold text-danger">✕</span>
                      )}
                      {e === "or" && (
                        <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                      )}
                      {e === "ok" && (
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          <span className="font-bold text-danger">✕</span> à travailler ·{" "}
          <span className="text-orange-400">●</span> sait le réaliser, ne le
          maîtrise pas · <span className="text-emerald-400">●</span> validé
        </p>
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
