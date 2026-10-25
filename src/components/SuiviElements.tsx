"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  enregistrerSuivi,
  getEquipes,
  getGymnastes,
  getSuivis,
  type EtatSuivi,
  type Equipe,
  type Gymnaste,
  type Suivi,
} from "@/lib/data";
import { AGRES } from "@/regulation/libelles";
import {
  getElementsNiveau,
  getNiveau,
  getSautsNiveau,
  niveauxFed,
} from "@/regulation/loader";
import type { Agres, NiveauId } from "@/regulation/types";
import { champPetit, titreSection } from "@/lib/styles";

type Cible = Suivi["cible"];

export interface Ouverture {
  n: number;
  cible: Cible;
  agres: Agres;
}

const nomCourt = (g: Gymnaste) => `${g.prenom} ${g.nom.charAt(0)}.`;

// Liste des éléments proposés (par leur nom) pour un agrès et un niveau.
export function propositions(agres: Agres, niveau: NiveauId): string[] {
  const n = getNiveau(niveau);
  if (n.programme === "P") return [];
  const noms =
    agres === "SAUT"
      ? getSautsNiveau(niveau).map((s) => s.nom)
      : getElementsNiveau(agres, niveau).map((e) => e.nom);
  return [...new Set(noms)];
}

export function Tableau({
  suivi,
  membres,
  propositionsNoms,
  modifiable,
  onChange,
}: {
  suivi: Suivi;
  membres: Gymnaste[];
  propositionsNoms: string[];
  modifiable: boolean;
  onChange: (s: Suivi) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const libelleAgres = AGRES.find((a) => a.id === suivi.agres)!.label;
  const listeId = `suivi-${suivi.id}`;

  function ajouter() {
    const texte = saisie.trim();
    if (!texte) return;
    onChange({
      ...suivi,
      lignes: [...suivi.lignes, { id: crypto.randomUUID(), libelle: texte }],
    });
    setSaisie("");
  }

  function cycle(ligneId: string, gid: string) {
    const cle = `${ligneId}|${gid}`;
    const actuel = suivi.cases[cle];
    const cases = { ...suivi.cases };
    if (!actuel) cases[cle] = "x";
    else if (actuel === "x") cases[cle] = "or";
    else if (actuel === "or") cases[cle] = "ok";
    else delete cases[cle];
    onChange({ ...suivi, cases });
  }

  function retirer(ligneId: string) {
    const cases = Object.fromEntries(
      Object.entries(suivi.cases).filter(
        ([cle]) => !cle.startsWith(`${ligneId}|`),
      ),
    ) as Record<string, EtatSuivi>;
    onChange({
      ...suivi,
      lignes: suivi.lignes.filter((l) => l.id !== ligneId),
      cases,
    });
  }

  return (
    <div className="break-inside-avoid space-y-2">
      <h3 className="text-sm font-semibold text-foreground print:text-black">
        {libelleAgres}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border-subtle print:border-black">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-alt text-left text-xs text-muted print:bg-white print:text-black">
              <th className="px-3 py-2 font-medium">Élément</th>
              {membres.map((g) => (
                <th
                  key={g.id}
                  title={`${g.prenom} ${g.nom}`}
                  className="px-3 py-2 text-center font-medium whitespace-nowrap"
                >
                  {nomCourt(g)}
                </th>
              ))}
              {modifiable && <th className="w-8 print:hidden" />}
            </tr>
          </thead>
          <tbody>
            {suivi.lignes.length === 0 && (
              <tr>
                <td
                  colSpan={membres.length + 2}
                  className="px-3 py-3 text-xs text-muted"
                >
                  Aucun élément pour l’instant.
                </td>
              </tr>
            )}
            {suivi.lignes.map((l) => (
              <tr
                key={l.id}
                className="border-t border-border-subtle print:border-black"
              >
                <td className="px-3 py-1.5 text-foreground print:text-black">
                  {l.libelle}
                </td>
                {membres.map((g) => {
                  const etat = suivi.cases[`${l.id}|${g.id}`];
                  return (
                    <td key={g.id} className="px-1 py-1 text-center">
                      <button
                        onClick={() => cycle(l.id, g.id)}
                        aria-label={`${l.libelle} — ${g.prenom} : ${etat === "ok" ? "validé" : etat === "or" ? "réalisé, pas maîtrisé" : etat === "x" ? "à travailler" : "vide"}`}
                        className="h-8 w-10 rounded border border-border-strong text-base leading-none hover:border-accent-solid hover:bg-surface-alt print:border-black print:hover:bg-transparent"
                      >
                        {etat === "x" && (
                          <span className="font-bold text-danger print:text-black">
                            ✕
                          </span>
                        )}
                        {etat === "or" && (
                          <span className="inline-block h-4 w-4 rounded-full bg-orange-500 print:bg-orange-500" />
                        )}
                        {etat === "ok" && (
                          <span className="inline-block h-4 w-4 rounded-full bg-emerald-500 print:bg-emerald-600" />
                        )}
                      </button>
                    </td>
                  );
                })}
                {modifiable && (
                  <td className="px-1 text-center print:hidden">
                    <button
                      onClick={() => retirer(l.id)}
                      title="Retirer cette ligne"
                      className="text-xs text-muted hover:text-danger"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modifiable && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ajouter();
              }
            }}
            list={listeId}
            placeholder="Choisir un élément ou écrire une ligne libre…"
            className={`${champPetit} w-full sm:w-96`}
          />
          <datalist id={listeId}>
            {propositionsNoms.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <button
            onClick={ajouter}
            className="rounded border border-border-strong px-2.5 py-1 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
          >
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
}

// Suivi des éléments à travailler : une croix quand une gymnaste doit les travailler, un rond vert quand c'est validé.
export default function SuiviElements({
  ouverture,
}: {
  // Demande d'ouverture d'un tableau (équipe ou gymnaste et agrès) venue de la liste « Tableaux déjà créés ».
  ouverture?: Ouverture | null;
}) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [cle, setCle] = useState("");
  const [agres, setAgres] = useState<Agres | "TOUS">("POUTRE");

  const charger = useCallback(async () => {
    setEquipes(await getEquipes());
    setGymnastes(await getGymnastes());
    setSuivis(await getSuivis());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, [charger]);

  useEffect(() => {
    if (!ouverture) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCle(`${ouverture.cible.genre}:${ouverture.cible.id}`);
    setAgres(ouverture.agres);
    charger();
  }, [ouverture, charger]);

  const cibles = useMemo(
    () => [
      ...equipes.map((e) => ({
        cle: `equipe:${e.id}`,
        cible: { genre: "equipe", id: e.id } as Cible,
        libelle: `Équipe · ${e.nom} (${getNiveau(e.niveau).label})`,
        niveau: e.niveau,
        membres: e.gymnasteIds
          .map((id) => gymnastes.find((g) => g.id === id))
          .filter((g): g is Gymnaste => !!g),
      })),
      ...gymnastes.map((g) => ({
        cle: `gymnaste:${g.id}`,
        cible: { genre: "gymnaste", id: g.id } as Cible,
        libelle: `Gymnaste · ${g.prenom} ${g.nom}`,
        niveau:
          equipes.find((e) => e.gymnasteIds.includes(g.id))?.niveau ??
          (niveauxFed[0].id as NiveauId),
        membres: [g],
      })),
    ],
    [equipes, gymnastes],
  );
  const choix = cibles.find((c) => c.cle === cle) ?? cibles[0];

  async function modifier(s: Suivi) {
    setSuivis((l) => [...l.filter((x) => x.id !== s.id), s]);
    await enregistrerSuivi(s);
  }

  if (!choix) {
    return (
      <section>
        <h2 className={titreSection}>Suivi des éléments</h2>
        <p className="text-sm text-muted">
          Ajoutez d’abord une gymnaste ou une équipe depuis l’accueil.
        </p>
      </section>
    );
  }

  const agresAffiches: Agres[] =
    agres === "TOUS" ? AGRES.map((a) => a.id) : [agres];
  const suiviPour = (a: Agres): Suivi =>
    suivis.find(
      (s) =>
        s.agres === a &&
        s.cible.genre === choix.cible.genre &&
        s.cible.id === choix.cible.id,
    ) ?? {
      id: `${choix.cible.genre}-${choix.cible.id}-${a}`,
      cible: choix.cible,
      agres: a,
      lignes: [],
      cases: {},
    };

  return (
    <section className="suivi-impression">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className={titreSection}>Suivi des éléments</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={choix.cle}
            onChange={(e) => setCle(e.target.value)}
            className={champPetit}
            aria-label="Équipe ou gymnaste"
          >
            {cibles.map((c) => (
              <option key={c.cle} value={c.cle}>
                {c.libelle}
              </option>
            ))}
          </select>
          <select
            value={agres}
            onChange={(e) => setAgres(e.target.value as Agres | "TOUS")}
            className={champPetit}
            aria-label="Agrès"
          >
            {AGRES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
            <option value="TOUS">Les 4 agrès</option>
          </select>
          <button
            onClick={() => window.print()}
            className="accent-gradient rounded px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Imprimer
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted print:hidden">
        Cliquez sur une case, plusieurs fois de suite :{" "}
        <span className="text-danger">✕</span> à travailler,{" "}
        <span className="text-orange-400">●</span> sait le réaliser mais ne le
        maîtrise pas, <span className="text-emerald-400">●</span> validé, puis
        la case se vide.
      </p>

      <h2 className="hidden text-lg font-bold text-black print:block">
        Suivi des éléments — {choix.libelle}
      </h2>

      <div className="space-y-6">
        {agresAffiches.map((a) => (
          <Tableau
            key={`${choix.cle}-${a}`}
            suivi={suiviPour(a)}
            membres={choix.membres}
            propositionsNoms={propositions(a, choix.niveau)}
            modifiable
            onChange={modifier}
          />
        ))}
      </div>
    </section>
  );
}
