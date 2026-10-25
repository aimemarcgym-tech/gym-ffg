"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";
import ContenuSeance from "@/components/ContenuSeance";

interface TableJointe {
  agres: string;
  colonnes: string[];
  lignes: { libelle: string; etats: ("x" | "or" | "ok" | null)[] }[];
}

interface Donnees {
  targetLabel: string;
  programType: string;
  sessions: { date: string; content: string; tables?: TableJointe[] }[];
  attachment?: { fileName: string; mimeType: string; dataBase64: string };
}

const TITRES: Record<string, string> = {
  TECHNIQUE: "Programme technique",
  PHYSIQUE: "Programme physique",
};

function dateLisible(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

// Page publique d'un journal d'entraînement, en lecture seule et sans compte.
export default function PartageProgramme() {
  const [d, setD] = useState<Donnees | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<Donnees>(id) : null;
      setD(p && p.type === "programme" ? p.data : "introuvable");
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
            <span className="accent-gradient-text">
              {TITRES[d.programType] ?? d.programType}
            </span>
          </h1>
          <p className="text-sm text-muted">{d.targetLabel}</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {d.attachment && (
          <a
            href={`data:${d.attachment.mimeType};base64,${d.attachment.dataBase64}`}
            download={d.attachment.fileName}
            className="accent-gradient-text flex items-center gap-2 rounded-lg border border-accent-solid/40 bg-accent-from/10 p-3 text-sm font-medium"
          >
            📎 Télécharger « {d.attachment.fileName} »
          </a>
        )}
        {d.sessions.length === 0 ? (
          <p className="text-sm text-muted">Aucune séance enregistrée.</p>
        ) : (
          d.sessions.map((x, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-surface p-3"
            >
              <div className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                {dateLisible(x.date)}
              </div>
              <ContenuSeance texte={x.content} />
              {x.tables?.map((t, k) => (
                <div key={k} className="mt-3">
                  <div className="mb-1 text-sm font-semibold text-foreground">
                    {t.agres}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border-subtle">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-surface-alt text-left text-xs text-muted">
                          <th className="min-w-[16rem] px-3 py-2 font-medium">
                            Élément
                          </th>
                          {t.colonnes.map((n, j) => (
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
                        {t.lignes.map((l, j) => (
                          <tr key={j} className="border-t border-border-subtle">
                            <td className="px-3 py-1.5 text-foreground">
                              {l.libelle}
                            </td>
                            {l.etats.map((e, m) => (
                              <td key={m} className="px-1 py-1 text-center">
                                {e === "x" && (
                                  <span className="font-bold text-danger">
                                    ✕
                                  </span>
                                )}
                                {e === "or" && (
                                  <span className="inline-block h-4 w-4 rounded-full bg-orange-500" />
                                )}
                                {e === "ok" && (
                                  <span className="inline-block h-4 w-4 rounded-full bg-emerald-500" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
