"use client";

import calendrier from "@/regulation/data/gaf/calendrier.json";
import generalites from "@/regulation/data/gaf/generalites.json";

const jour = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
const plage = (d: string, f: string) => (d === f ? jour(d) : `${jour(d)} au ${jour(f)} ${f.slice(0, 4)}`);

// Compétitions nationales : calendrier, droits d'engagement, ordres de passage, échauffements, documents de référence.
export default function GeneralitesNationales() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Calendrier des compétitions nationales</h2>
        <ul className="space-y-2">
          {calendrier.competitionsNationales.map((c) => (
            <li key={c.nom} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm">
              <div>
                <span className="text-sm font-medium text-foreground">{c.nom}</span>
                {"note" in c && c.note && <span className="ml-2 text-xs text-muted">{c.note}</span>}
              </div>
              <span className="text-sm accent-gradient-text font-medium">{plage(c.debut, c.fin)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">
          Date limite d’engagement nominatif pour les catégories à finalité nationale : {jour(calendrier.dateLimiteEngagementNominatif)} 2026.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Droits d’engagement</h2>
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Compétition</th>
                <th className="px-4 py-2 font-normal">Individuel</th>
                <th className="px-4 py-2 font-normal">Équipe</th>
              </tr>
            </thead>
            <tbody>
              {generalites.droitsEngagement.map((d) => (
                <tr key={d.competition} className="border-t border-border-subtle">
                  <td className="px-4 py-2 text-foreground">{d.competition}</td>
                  <td className="px-4 py-2 text-muted">{d.individuel || "—"}</td>
                  <td className="px-4 py-2 text-muted">{d.equipe || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-1">
          {generalites.notesEngagement.map((n) => (
            <li key={n} className="text-xs text-muted">
              · {n}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Ordres de passage</h2>
          <ul className="space-y-2">
            {generalites.ordresPassage.map((t) => (
              <li key={t} className="text-sm text-muted">
                · {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Échauffements et montée d’agrès (Fédéral A)</h2>
          <ul className="space-y-2">
            {[...generalites.echauffements.FEDERAL_A, generalites.monteeAgres].map((t) => (
              <li key={t} className="text-sm text-muted">
                · {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Documents de référence</h2>
        <ul className="space-y-1">
          {generalites.documents.map((d) => (
            <li key={d} className="text-sm text-muted">
              · {d}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{generalites.regleContradiction}</p>
      </section>
    </div>
  );
}
