"use client";

import { useMemo, useState } from "react";
import contacts from "@/regulation/data/gaf/contacts-idf.json";
import { champ } from "@/lib/styles";

type Ligne = { role: string; noms: string[]; tels: string[]; emails: string[]; note?: string };

const sansAccents = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const telLien = (t: string) => `tel:${t.replace(/[^\d+]/g, "")}`;

function LigneContact({ l }: { l: Ligne }) {
  const vide = l.noms.length === 0 && l.tels.length === 0 && l.emails.length === 0;
  return (
    <tr className="border-t border-border-subtle align-top">
      <td className="w-56 px-4 py-2 text-xs font-semibold text-foreground">{l.role}</td>
      {vide ? (
        <td colSpan={3} className="px-4 py-2 text-xs text-muted">
          —
        </td>
      ) : (
        <>
          <td className="px-4 py-2 text-sm text-foreground">
            {l.noms.map((n) => (
              <div key={n}>{n}</div>
            ))}
            {l.note && <div className="text-xs text-muted">{l.note}</div>}
          </td>
          <td className="px-4 py-2 text-sm whitespace-nowrap">
            {l.tels.map((t) => (
              <div key={t}>
                <a href={telLien(t)} className="text-foreground hover:underline">
                  {t}
                </a>
              </div>
            ))}
          </td>
          <td className="px-4 py-2 text-sm break-all">
            {l.emails.map((e) => (
              <div key={e}>
                <a href={`mailto:${e}`} className="accent-gradient-text font-medium hover:underline">
                  {e}
                </a>
              </div>
            ))}
          </td>
        </>
      )}
    </tr>
  );
}

function Tableau({ titre, lignes }: { titre: string; lignes: Ligne[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle bg-surface-alt px-4 py-2 text-center text-xs font-bold tracking-wide text-foreground uppercase">{titre}</div>
      <table className="w-full min-w-[640px] text-left">
        <tbody>
          {lignes.map((l, i) => (
            <LigneContact key={`${l.role}-${i}`} l={l} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Annuaire du comité régional et des comités départementaux d'Île-de-France : numéros et adresses cliquables, avec recherche.
export default function ContactsRegionaux() {
  const [recherche, setRecherche] = useState("");
  const q = sansAccents(recherche.trim());

  const filtre = (l: Ligne) => !q || sansAccents([l.role, ...l.noms, ...l.tels, ...l.emails].join(" ")).includes(q);

  const regionaux = useMemo(() => contacts.regionaux.map((g) => ({ ...g, lignes: (g.lignes as Ligne[]).filter(filtre) })).filter((g) => g.lignes.length > 0), [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const departements = useMemo(
    () => contacts.departements.map((d) => ({ ...d, lignes: (d.lignes as Ligne[]).filter((l) => filtre(l) || sansAccents(d.nom).includes(q)) })).filter((d) => d.lignes.length > 0),
    [q], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6">
      <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un nom, un rôle, un département, un numéro…" className={`${champ} max-w-md`} />

      {regionaux.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Contacts régionaux</h3>
          {regionaux.map((g) => (
            <Tableau key={g.groupe} titre={g.groupe} lignes={g.lignes as Ligne[]} />
          ))}
          <p className="text-xs text-muted">{contacts.pas}</p>
        </section>
      )}

      {departements.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Contacts départementaux</h3>
          {departements.map((d) => (
            <Tableau key={d.nom} titre={d.nom} lignes={d.lignes as Ligne[]} />
          ))}
        </section>
      )}

      {regionaux.length === 0 && departements.length === 0 && <p className="text-sm text-muted">Aucun contact ne correspond à cette recherche.</p>}
    </div>
  );
}
