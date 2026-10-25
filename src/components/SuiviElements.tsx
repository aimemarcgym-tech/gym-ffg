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
import { AGRES, LIBELLE_FAMILLE, fmt, fmtValeur } from "@/regulation/libelles";
import {
  getElementsNiveau,
  getNiveau,
  getSautsNiveau,
  groupesSautsPF,
  niveauxFed,
} from "@/regulation/loader";
import type { Agres, NiveauId } from "@/regulation/types";
import { champ, champPetit, titreSection } from "@/lib/styles";
import PartageBouton from "@/components/PartageBouton";
import { createShare } from "@/lib/shares";

type Cible = Suivi["cible"];

export interface Ouverture {
  n: number;
  cible: Cible;
  // Absent quand on ouvre une séance : le tableau affiché garde son agrès.
  agres?: Agres;
  // Séance à afficher seule dans le programme technique.
  seanceId?: string;
}

const nomCourt = (g: Gymnaste) => `${g.prenom} ${g.nom.charAt(0)}.`;

const NIVEAUX_BIBLIOTHEQUE: { id: NiveauId; label: string }[] = [
  { id: "A", label: "Fédéral A · A, A2, A3" },
  { id: "B1", label: getNiveau("B1").label },
  { id: "B2", label: getNiveau("B2").label },
  { id: "B3", label: getNiveau("B3").label },
  { id: "PF1", label: getNiveau("PF1").label },
  { id: "PF2", label: getNiveau("PF2").label },
];

// Bibliothèque des éléments, comme dans le constructeur : une catégorie au choix, une recherche, et un clic ajoute ou retire la ligne.
function BibliothequeSuivi({
  agres,
  niveau: niveauDepart,
  pris,
  onBasculer,
}: {
  agres: Agres;
  niveau: NiveauId;
  pris: Set<string>;
  onBasculer: (libelle: string) => void;
}) {
  const [famille, setFamille] = useState("");
  const [recherche, setRecherche] = useState("");
  // Niveau de la bibliothèque : celui de l'équipe au départ ; Fédéral A regroupe A, A2 et A3 (mêmes éléments).
  const [niv, setNiv] = useState<NiveauId>(
    getNiveau(niveauDepart).programme === "A" ||
      getNiveau(niveauDepart).programme === "P"
      ? "A"
      : niveauDepart,
  );
  const niveau = niv;
  const q = recherche.trim().toLowerCase();
  const estSaut = agres === "SAUT";
  const elements = useMemo(
    () =>
      estSaut ? [] : getElementsNiveau(agres as Exclude<Agres, "SAUT">, niveau),
    [estSaut, agres, niveau],
  );
  const sauts = useMemo(
    () => (estSaut ? getSautsNiveau(niveau) : []),
    [estSaut, niveau],
  );
  const familles = useMemo(
    () => [
      ...new Set([
        ...elements.map((e) => e.famille),
        ...elements.flatMap((e) => e.extraFamilles ?? []),
      ]),
    ],
    [elements],
  );
  const parFamilleSaut = estSaut && getNiveau(niveau).programme === "PF";

  const cartes = estSaut
    ? sauts
        .filter((s) => !famille || s.id.replace("PF-SA-", "")[0] === famille)
        .filter((s) => !q || s.nom.toLowerCase().includes(q))
        .map((s) => ({
          cle: s.id,
          nom: s.nom,
          valeur: s.unique
            ? fmt(s.valeurTremplin)
            : `${fmt(s.valeurTrampoTremp)} / ${fmt(s.valeurTremplin)}`,
        }))
    : elements
        .filter(
          (e) =>
            !famille ||
            e.famille === famille ||
            !!e.extraFamilles?.includes(famille),
        )
        .filter(
          (e) =>
            !q ||
            e.nom.toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q),
        )
        .sort((a, b) => a.valeur - b.valeur)
        .map((e) => ({ cle: e.id, nom: e.nom, valeur: fmtValeur(e) }));

  return (
    <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={niv}
          onChange={(e) => {
            setNiv(e.target.value as NiveauId);
            setFamille("");
          }}
          aria-label="Niveau"
          className={`${champ} sm:w-60`}
        >
          {NIVEAUX_BIBLIOTHEQUE.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        {(!estSaut || parFamilleSaut) && (
          <select
            value={famille}
            onChange={(e) => setFamille(e.target.value)}
            aria-label="Catégorie"
            className={`${champ} sm:w-72`}
          >
            <option value="">
              {estSaut ? "Tous les sauts" : "Toutes les catégories"}
            </option>
            {estSaut
              ? Object.entries(groupesSautsPF).map(([g, titre]) => (
                  <option key={g} value={g}>
                    Famille {g} · {titre}
                  </option>
                ))
              : familles.map((f) => (
                  <option key={f} value={f}>
                    {LIBELLE_FAMILLE[f] ?? f}
                  </option>
                ))}
          </select>
        )}
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (nom, code)…"
          className={`${champ} sm:w-72`}
        />
      </div>
      <div className="max-h-[26rem] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {cartes.map((e) => {
            const dedans = pris.has(e.nom);
            return (
              <button
                key={e.cle}
                type="button"
                onClick={() => onBasculer(e.nom)}
                title={e.nom}
                className="flex flex-col items-start gap-1 rounded border border-border-subtle bg-surface-alt p-2 text-left hover:border-accent-solid/60 hover:bg-accent-from/10"
              >
                <span
                  className={`rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] ${dedans ? "text-success" : "text-muted"}`}
                >
                  {dedans ? "✓ " : ""}
                  {e.valeur}
                </span>
                <span className="text-xs leading-snug text-foreground">
                  {e.nom}
                </span>
              </button>
            );
          })}
        </div>
        {cartes.length === 0 && (
          <p className="text-xs text-muted">
            Aucun élément ne correspond à ce filtre.
          </p>
        )}
      </div>
    </div>
  );
}

export function Tableau({
  suivi,
  membres,
  niveau,
  titre,
  agresChoix,
  modifiable,
  onChange,
}: {
  suivi: Suivi;
  membres: Gymnaste[];
  // Niveau de l'équipe ou de la gymnaste : détermine les éléments de la bibliothèque.
  niveau?: NiveauId;
  // Nom de l'équipe ou de la gymnaste, affiché sur la page partagée ; sans lui, pas de bouton Partager.
  titre?: string;
  // Choix de l'agrès affiché, placé à droite du bouton de la bibliothèque.
  agresChoix?: {
    valeur: Agres | "TOUS";
    onChange: (v: Agres | "TOUS") => void;
  };
  modifiable: boolean;
  onChange: (s: Suivi) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const libelleAgres = AGRES.find((a) => a.id === suivi.agres)!.label;
  const [biblio, setBiblio] = useState(false);
  const prisParNom = new Set(suivi.lignes.map((l) => l.libelle));

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

  // Clic dans la bibliothèque : ajoute la ligne, ou la retire si l'élément y est déjà.
  function basculer(libelle: string) {
    const existante = suivi.lignes.find((l) => l.libelle === libelle);
    if (existante) return retirer(existante.id);
    onChange({
      ...suivi,
      lignes: [...suivi.lignes, { id: crypto.randomUUID(), libelle }],
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
              <th className="min-w-[13rem] px-3 py-2 font-medium">Élément</th>
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
                        className="h-6 w-8 rounded border border-border-strong text-sm leading-none hover:border-accent-solid hover:bg-surface-alt print:border-black print:hover:bg-transparent"
                      >
                        {etat === "x" && (
                          <span className="font-bold text-danger print:text-black">
                            ✕
                          </span>
                        )}
                        {etat === "or" && (
                          <span className="inline-block h-3 w-3 rounded-full bg-orange-500 print:bg-orange-500" />
                        )}
                        {etat === "ok" && (
                          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 print:bg-emerald-600" />
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
        <div className="space-y-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {titre && (
              <PartageBouton
                label="Partager ce tableau"
                onCreate={async () => {
                  const id = await createShare("tableaux", {
                    titre,
                    agres: libelleAgres,
                    colonnes: membres.map(nomCourt),
                    lignes: suivi.lignes.map((l) => ({
                      libelle: l.libelle,
                      etats: membres.map(
                        (g) => suivi.cases[`${l.id}|${g.id}`] ?? null,
                      ),
                    })),
                  });
                  return `/partage/tableaux/?id=${id}`;
                }}
                className="accent-gradient rounded px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              />
            )}
            {niveau && (
              <button
                onClick={() => setBiblio((o) => !o)}
                aria-expanded={biblio}
                className="rounded border border-accent-solid/60 bg-accent-from/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent-from/20"
              >
                {biblio
                  ? "Fermer la bibliothèque"
                  : "Bibliothèque des éléments"}
              </button>
            )}
            {agresChoix && (
              <select
                value={agresChoix.valeur}
                onChange={(e) =>
                  agresChoix.onChange(e.target.value as Agres | "TOUS")
                }
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
            )}
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ajouter();
                }
              }}
              placeholder="Ou écrire une ligne libre…"
              className={`${champPetit} w-full sm:w-72`}
            />
            <button
              onClick={ajouter}
              className="rounded border border-border-strong px-2.5 py-1 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
            >
              Ajouter
            </button>
          </div>
          {biblio && niveau && (
            <BibliothequeSuivi
              agres={suivi.agres}
              niveau={niveau}
              pris={prisParNom}
              onBasculer={basculer}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Suivi des éléments à travailler : une croix quand une gymnaste doit les travailler, un rond vert quand c'est validé.
export default function SuiviElements({
  ouverture,
  equipeCommune,
  onEquipe,
}: {
  // Équipe partagée avec le bloc « Programme technique » : choisir l'une choisit l'autre.
  equipeCommune?: string;
  onEquipe?: (id: string) => void;
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
    if (!equipeCommune) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCle(`equipe:${equipeCommune}`);
  }, [equipeCommune]);

  useEffect(() => {
    if (!ouverture) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCle(`${ouverture.cible.genre}:${ouverture.cible.id}`);
    if (ouverture.agres) setAgres(ouverture.agres);
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
            onChange={(e) => {
              setCle(e.target.value);
              if (e.target.value.startsWith("equipe:"))
                onEquipe?.(e.target.value.slice(7));
            }}
            className={champPetit}
            aria-label="Équipe ou gymnaste"
          >
            {cibles.map((c) => (
              <option key={c.cle} value={c.cle}>
                {c.libelle}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
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
            niveau={choix.niveau}
            titre={choix.libelle}
            agresChoix={{ valeur: agres, onChange: setAgres }}
            modifiable
            onChange={modifier}
          />
        ))}
      </div>
    </section>
  );
}
