"use client";

import { useState, type ReactNode } from "react";
import ContactsRegionaux from "@/components/ContactsRegionaux";
import GeneralitesNationales from "@/components/GeneralitesNationales";
import { onglets, ongletBouton } from "@/lib/styles";

// Documents du comité régional Île-de-France 2026/2027 : montées ou changements d'équipes, gestion des compétitions, procédures d'engagement.
type Page = "nationales" | "montees" | "gestion" | "engagements" | "contacts";

const PAGES: { id: Page; label: string }[] = [
  { id: "nationales", label: "Compétitions nationales" },
  { id: "montees", label: "Montées et changements d’équipes" },
  { id: "gestion", label: "Gestion des compétitions" },
  { id: "engagements", label: "Engagements et forfaits" },
  { id: "contacts", label: "Contacts régionaux et départementaux" },
];

const MONTEES = [
  {
    nom: "Fédéral B1, B2 et B3",
    note: "(1)",
    categories: ["9-11", "10-13", "10-15", "10 et +"],
    categoriesB3: ["7", "7-8", "7-9", "8-10"],
    parcours: ["Départ → Finale départementale", "Départ → Finale ID"],
    remarque: "Sur le schéma, le passage entre la finale ID et la finale départementale est marqué 0.",
    montee: "1 montée par équipe par compétition",
  },
  {
    nom: "Fédéral A3",
    note: "(2)",
    categories: ["9-11", "10-13", "10-15", "10 et +"],
    categoriesB3: ["7-9"],
    parcours: ["Dép 1 → Dép 2 → Inter-dép → Finale régionale"],
    montee: "1 montée par équipe par compétition",
  },
  {
    nom: "Fédéral A2",
    note: "(2)",
    categories: ["10-11", "10-13", "10-15", "10 et +", "14 et +"],
    parcours: ["Dép 2 → Inter-dép → Finale régionale", "Orientation Dép 1 (vers Dép 2 ou Inter-dép)"],
    montee: "1 montée par équipe par an",
  },
  {
    nom: "Trophée Fédéral A",
    note: "(2)",
    categories: ["10-11", "10-13", "10-15", "10 et +", "14 et +"],
    parcours: ["Inter-dép → (1) Région → (1) National"],
    montee: "1 montée par club par an",
  },
];

const FORFAITS = [
  { cas: "Déclaré au moins 10 jours avant la compétition", droits: "NON", amende: "NON", juge: "OUI*" },
  { cas: "Déclaré dans les 10 jours, justifié par un certificat médical", droits: "OUI", amende: "NON", juge: "OUI*" },
  { cas: "Non déclaré, ou déclaré dans les 10 jours mais non justifié", droits: "OUI", amende: "OUI", juge: "OUI*" },
];

const ENGAGEMENTS = [
  { categories: ["Individuelle Performance à finalité nationale (2*)", "Individuelle Performance finalité régionale"], aupres: "Sur événement départemental, ou sur événement régional", date: "Se référer à la brochure départementale" },
  { categories: ["Individuelle Fédéral A"], aupres: "Sur événement départemental", date: "Se référer à la brochure départementale" },
  { categories: ["Équipe Fédéral A, A2 et A3", "Équipe Performance FFG", "Équipe Performance 7 à 9 ans"], aupres: "Sur événement départemental", date: "Se référer à la brochure départementale" },
  { categories: ["Équipe Performance Nat 12 ans et + (1*)"], aupres: "Sur événement ID de secteur ou sur événement régional", date: "Se référer à la brochure départementale" },
  { categories: ["Équipe Fédéral B1, B2 et B3"], aupres: "Sur événement départemental", date: "Se référer à la brochure départementale" },
  { categories: ["Top 12 – Nat A1 et A2"], aupres: "FFG", date: "Voir brochure fédérale" },
];

const titre = "text-base font-semibold text-foreground";
const carte = "rounded-lg border border-border-subtle bg-surface p-4";
const puce = (t: ReactNode, k?: string) => (
  <li key={k} className="text-sm text-muted">
    · {t}
  </li>
);

function Montees() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">Réglementation régionale IdF :</span> tous les changements sont autorisés en filière régionale, sauf les descentes.{" "}
        <span className="font-semibold text-foreground">Règlements techniques FFGym GAM & GAF :</span> 1 changement autorisé par équipe par compétition.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {MONTEES.map((m) => (
          <div key={m.nom} className={carte}>
            <h3 className="accent-gradient-text text-lg font-bold">
              {m.nom} <span className="text-xs font-normal text-muted">{m.note}</span>
            </h3>
            <p className="mt-2 text-xs font-semibold tracking-wide text-muted uppercase">Catégories · changement autorisé</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {m.categories.map((c) => (
                <span key={c} className="rounded-full border border-border-strong px-2 py-0.5 text-xs text-foreground">
                  {c}
                </span>
              ))}
            </div>
            {m.categoriesB3 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">{m.nom.includes("B1") ? "B3 :" : "Catégorie réduite :"}</span>
                {m.categoriesB3.map((c) => (
                  <span key={c} className="rounded-full border border-border-strong px-2 py-0.5 text-xs text-foreground">
                    {c}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Parcours</p>
            <ul className="mt-1 space-y-1">{m.parcours.map((p) => puce(p, p))}</ul>
            {m.remarque && <p className="mt-1 text-xs text-muted">{m.remarque}</p>}
            <p className="mt-3 text-sm font-medium text-foreground">{m.montee}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-1">
        {puce("Montée de catégorie + descente géographique : autorisé.")}
        {puce("Changement de finale A à finale B = descente : descentes interdites (voir les règlements techniques GAM-GAF).")}
        {puce("(1) Fédéral B : interdit aux gymnastes ayant concouru en individuelle sur un autre programme (pas d’exceptions).")}
        {puce("(2) Fédéral A : interdit aux gymnastes ayant concouru en individuelle sur un programme Performance (sauf exception du règlement technique, étendue aux poussines).")}
      </ul>
    </div>
  );
}

function Gestion() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className={titre}>Forfaits</h3>
        <p className="mt-1 text-sm text-muted">
          Les gymnastes et/ou équipes qualifiées pour une compétition interdépartementale et/ou régionale sont considérées comme engagées. Il appartient à chaque club de déclarer forfait au CRIFGYM en cas de non-participation, en
          passant par le logiciel ENGAGYM.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Forfait</th>
                <th className="px-4 py-2 font-normal">Droits d’engagement</th>
                <th className="px-4 py-2 font-normal">Amende</th>
                <th className="px-4 py-2 font-normal">Présence du juge</th>
              </tr>
            </thead>
            <tbody>
              {FORFAITS.map((f) => (
                <tr key={f.cas} className="border-t border-border-subtle">
                  <td className="px-4 py-2 text-foreground">{f.cas}</td>
                  <td className="px-4 py-2 text-muted">{f.droits}</td>
                  <td className="px-4 py-2 text-muted">{f.amende}</td>
                  <td className="px-4 py-2 text-muted">{f.juge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-1">
          {puce("Certificat remis dans les 5 jours après la compétition : l’amende n’est pas encaissée.")}
          {puce("Tarif de l’amende : équipe 80,00 € · individuelle 20,00 €.")}
          {puce("* Sauf accord préalable avec le responsable des juges de la compétition.")}
        </ul>
      </section>
      <section>
        <h3 className={titre}>Absence de juges</h3>
        <p className="mt-1 text-sm text-muted">
          Un retard à la réunion de juges est considéré comme une absence. En cas de forfait de gymnaste ou d’équipe, le club doit fournir le juge demandé, sauf accord préalable avec le responsable des juges. Dans le cas contraire, une
          amende de <span className="font-semibold text-foreground">250 €</span> est demandée.
        </p>
      </section>
      <section>
        <h3 className={titre}>Licence</h3>
        <p className="mt-1 text-sm text-muted">
          Suite à la réglementation fédérale, les contrôles des licences sont obligatoires avant le début des compétitions. Si la gymnaste n’apparaît pas dans la base informatique, elle n’est pas autorisée à concourir.
        </p>
      </section>
      <section>
        <h3 className={titre}>Autres cas</h3>
        <p className="mt-1 text-sm text-muted">Se reporter à la brochure générale des règlements techniques FFG en cours.</p>
      </section>
    </div>
  );
}

function Engagements() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className={titre}>Engagements aux compétitions</h3>
        <ul className="mt-1 space-y-1">
          {puce("Il est indispensable de respecter les dates limites d’engagement.")}
          {puce("Les engagements se font par Internet, via ENGAGYM. Les engagements prévisionnels ne sont pas pris en compte.")}
          {puce("Les dates limites d’engagement sont fixées par la région ; les départements peuvent les avancer. Au-delà de cette date, il n’est plus possible de s’engager.")}
          {puce("À l’engagement, les gymnastes doivent être licenciées : impossible de s’engager sans licence.")}
        </ul>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Catégories</th>
                <th className="px-4 py-2 font-normal">Date limite d’engagement</th>
                <th className="px-4 py-2 font-normal">Auprès de qui ?</th>
              </tr>
            </thead>
            <tbody>
              {ENGAGEMENTS.map((e) => (
                <tr key={e.categories[0]} className="border-t border-border-subtle align-top">
                  <td className="px-4 py-2 text-foreground">
                    {e.categories.map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </td>
                  <td className="px-4 py-2 text-muted">{e.date}</td>
                  <td className="px-4 py-2 text-muted">{e.aupres}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-1.5">
          {puce(
            <>
              <span className="font-semibold text-foreground">(1*) Performance équipes, 12 ans et + (Code FIG aménagé) :</span> les équipes nouvellement engagées et les équipes NatA4 à NatA6 de la saison 2026 débutent en
              interdépartemental (compétition de secteur). Les équipes classées en 2026 du 4e au 12e rang en Nat A2 (12 ans et +), ainsi que toutes les équipes ayant concouru en finale Nat A3 (12 ans et +) : Herblay, Meaux, Clamart,
              Franconville, débutent sur l’événement régional.
            </>,
          )}
          {puce(
            <>
              <span className="font-semibold text-foreground">(2*) Individuelle :</span> sélectionnées aux championnats de France de la saison précédente ; possibilité de débuter la saison en région.
            </>,
          )}
        </ul>
      </section>
      <section>
        <h3 className={titre}>Forfaits</h3>
        <p className="mt-1 text-sm text-muted">Tous les forfaits doivent être déclarés via l’interface ENGAGYM, y compris le jour même de l’événement.</p>
        <ul className="mt-1 space-y-1">
          {puce("Jusqu’à 30 jours avant la compétition : le droit d’engagement n’est pas à régler et il n’est pas nécessaire de présenter un certificat médical.")}
          {puce(
            <>
              À partir de la parution de l’organigramme provisoire (J-30 avant la compétition), <span className="font-semibold text-danger">les engagements sont dus.</span>
            </>,
          )}
          {puce("À moins de 10 jours avant la compétition : le droit d’engagement est dû et un certificat médical doit être présenté.")}
        </ul>
        <p className="mt-2 text-sm text-muted">Une amende est imputée au club si le certificat médical n’est pas présenté : 20 € pour les individuelles et 80 € pour les équipes.</p>
      </section>
    </div>
  );
}

export default function ReglementationRegionale() {
  const [page, setPage] = useState<Page>("nationales");
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-foreground">Documents</h2>
      <p className="mb-3 text-xs text-muted">Compétitions nationales, puis règlementation régionale Île-de-France 2026/2027 : montées, gestion des compétitions, engagements et forfaits, contacts.</p>
      <div className={`${onglets} mb-4 flex-wrap`}>
        {PAGES.map((p) => (
          <button key={p.id} onClick={() => setPage(p.id)} className={ongletBouton(page === p.id, "px-4 py-2.5")}>
            {p.label}
          </button>
        ))}
      </div>
      {page === "nationales" && <GeneralitesNationales />}
      {page === "montees" && <Montees />}
      {page === "gestion" && <Gestion />}
      {page === "engagements" && <Engagements />}
      {page === "contacts" && <ContactsRegionaux />}
    </section>
  );
}
