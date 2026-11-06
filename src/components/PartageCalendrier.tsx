"use client";

import { useEffect, useState } from "react";
import { getShare } from "@/lib/shares";

interface Lieu {
  nom: string;
  note?: string;
  clubs?: string[];
  recherche?: boolean;
}

export interface DonneesCalendrier {
  titre: string;
  niveau: string;
  saison: string;
  dates: {
    libelle: string;
    date: string;
    cibles: string;
    engagement: boolean;
    lieu?: {
      intitule: string;
      secteurs: { secteur: string; lieux: Lieu[] }[];
      avertissement: string;
    };
  }[];
}

// Page publique des dates et lieux de compétition d'une équipe ou d'une individuelle, en lecture seule et sans compte.
export default function PartageCalendrier() {
  const [d, setD] = useState<DonneesCalendrier | "introuvable" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      const p = id ? await getShare<DonneesCalendrier>(id) : null;
      setD(p && p.type === "calendrier" ? p.data : "introuvable");
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
              Calendrier des compétitions
            </span>
          </h1>
          <p className="text-sm text-muted">
            {d.titre} · {d.niveau} · saison {d.saison}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {d.dates.length === 0 && (
          <p className="text-sm text-muted">
            Aucune date au calendrier régional pour ce niveau.
          </p>
        )}
        <ul className="space-y-2">
          {d.dates.map((e, i) => (
            <li
              key={i}
              className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm"
            >
              <div className="font-medium text-foreground">{e.libelle}</div>
              <div className="text-foreground">{e.date}</div>
              <div className="mt-0.5 text-xs text-muted">{e.cibles}</div>
              {e.lieu && (
                <div className="mt-2 space-y-1 border-t border-border-subtle pt-2 text-xs">
                  <div className="font-semibold text-foreground">
                    📍 Lieu · {e.lieu.intitule}
                  </div>
                  {e.lieu.secteurs.map((sec) => (
                    <div key={sec.secteur} className="text-foreground">
                      {sec.secteur !== "Région" && (
                        <span className="text-muted">
                          Secteur {sec.secteur} :{" "}
                        </span>
                      )}
                      {sec.lieux.map((l, k) => (
                        <span key={l.nom}>
                          {k > 0 && " · "}
                          <span className={l.recherche ? "text-danger" : ""}>
                            {l.nom}
                          </span>
                          {l.note ? (
                            <span className="text-muted"> ({l.note})</span>
                          ) : null}
                          {l.clubs?.length ? (
                            <span className="text-muted">
                              {" "}
                              — clubs réservistes : {l.clubs.join(", ")}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ))}
                  <div className="text-muted">{e.lieu.avertissement}</div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l’application Gestion
          Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}
