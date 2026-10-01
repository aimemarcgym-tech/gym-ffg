"use client";

import { useState } from "react";
import { getReference } from "@/regulation/loader";
import { onglets, ongletBouton, panneau, titrePanneau } from "@/lib/styles";
import type { Agres, NiveauId } from "@/regulation/types";

type Onglet = "temps" | "lexique" | "infos";

export default function PanneauReference({ agres, niveau, niveauId }: { agres: Agres; niveau: string; niveauId: NiveauId }) {
  const [onglet, setOnglet] = useState<Onglet>("temps");
  const referenceFedA = getReference(niveauId);
  const tempsAgres = referenceFedA.temps.find((t) => t.agres === agres && t.label.includes("durée"));
  const infos = [...referenceFedA.infos.COMMUN, ...(referenceFedA.infos[niveauId] ?? []), ...(referenceFedA.infos[agres] ?? [])];

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Référence</h2>
      <div className={`${onglets} mb-3`}>
        <button onClick={() => setOnglet("temps")} className={ongletBouton(onglet === "temps")}>
          Temps
        </button>
        <button onClick={() => setOnglet("lexique")} className={ongletBouton(onglet === "lexique")}>
          Lexique
        </button>
        <button onClick={() => setOnglet("infos")} className={ongletBouton(onglet === "infos")}>
          Infos
        </button>
      </div>

      {onglet === "temps" && (
        <div>
          <div className="mb-3 rounded-lg bg-gradient-to-br from-accent-from/15 to-accent-to/15 p-4 text-center">
            <div className="text-xs text-muted uppercase">Temps max — {niveau}</div>
            <div className="accent-gradient-text text-3xl font-bold">{tempsAgres ? tempsAgres.valeur : "—"}</div>
            {tempsAgres ? (
              <div className="mt-1 text-xs text-muted">{tempsAgres.label}</div>
            ) : (
              <div className="mt-1 text-xs text-muted">Aucun temps limite réglementaire pour cet agrès.</div>
            )}
          </div>
          <ul className="space-y-1 text-xs text-muted">
            {referenceFedA.temps.map((t) => (
              <li key={t.label} className={`flex justify-between rounded px-2 py-1 ${t.agres === agres ? "bg-accent-from/10 text-foreground" : ""}`}>
                <span>{t.label}</span>
                <span className="font-medium">{t.valeur}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onglet === "lexique" && (
        <ul className="space-y-3">
          {referenceFedA.lexique.map((l) => (
            <li key={l.terme} className="border-b border-border-subtle pb-2 last:border-0">
              <div className="text-sm font-semibold text-foreground">{l.terme}</div>
              <div className="text-xs text-muted">{l.definition}</div>
            </li>
          ))}
        </ul>
      )}

      {onglet === "infos" && (
        <ul className="space-y-2">
          {infos.map((t) => (
            <li key={t} className="text-xs leading-snug text-muted">
              → {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
