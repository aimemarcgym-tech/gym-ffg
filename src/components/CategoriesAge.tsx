"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getClubs,
  getEquipes,
  getGymnastes,
  type Club,
  type Equipe,
  type Gymnaste,
} from "@/lib/data";
import {
  anneeSaison,
  anneesCategorie,
  anneesParAge,
  ageEnSaison,
  categoriesIndividuel,
  categoriesPossibles,
  getNiveau,
  niveauxFed,
  sourceIndividuel,
} from "@/regulation/loader";
import PartageBouton from "@/components/PartageBouton";
import { createShare } from "@/lib/shares";
import { STYLE_NIVEAU, btnDegrade, champ, titreSection } from "@/lib/styles";

const tag = "rounded-lg border px-2.5 py-1.5 text-xs font-medium";

export default function CategoriesAge() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [choix, setChoix] = useState("");
  const [pret, setPret] = useState(false);
  // Catégorie cliquée : les autres propositions disparaissent jusqu'à ce qu'on revienne à la liste.
  const [categorie, setCategorie] = useState<string | null>(null);

  useEffect(() => {
    // Le paramètre d'URL (?e=) n'est lisible que côté client avec l'export statique.
    const preselection =
      new URLSearchParams(window.location.search).get("e") ?? "";
    (async () => {
      setClubs(await getClubs());
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setChoix(preselection);
      setPret(true);
    })();
  }, []);

  const liste = useMemo(
    () =>
      equipes
        .map((e) => ({
          equipe: e,
          club: clubs.find((c) => c.id === e.clubId)?.nom ?? "Sans club",
        }))
        .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr")),
    [equipes, clubs],
  );
  const selection = liste.find((x) => x.equipe.id === choix);
  const membres = selection
    ? selection.equipe.gymnasteIds
        .map((id) => gymnastes.find((g) => g.id === id))
        .filter((g): g is Gymnaste => !!g)
    : [];
  const annees = membres.map((g) => g.anneeNaissance);
  const niveau = selection ? getNiveau(selection.equipe.niveau) : null;
  const possibles = selection
    ? categoriesPossibles(selection.equipe.niveau, annees)
    : [];

  async function partager() {
    if (!selection || !niveau) throw new Error("Équipe introuvable");
    const id = await createShare("categories", {
      club: selection.club,
      equipe: selection.equipe.nom,
      niveauId: niveau.id,
      niveau: niveau.label,
      membres: membres.map((g) => ({
        prenom: g.prenom,
        nom: g.nom,
        annee: g.anneeNaissance,
        age: ageEnSaison(g.anneeNaissance),
      })),
      categories: possibles.map((c) => ({
        label: c.label,
        annees: anneesCategorie(c),
      })),
      choisie: possibles.find((c) => c.id === categorie)?.label ?? null,
    });
    return `/partage/categories/?id=${id}`;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className={titreSection}>Catégories d’âges</h1>
        <p className="text-sm text-muted">
          Saison 2026-2027 · l’âge se calcule sur l’année de naissance :{" "}
          {anneesParAge.find((a) => a.age === 10)?.annee} pour 10 ans.
        </p>
      </div>

      <section className="max-w-xl rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Vérifier une équipe
        </h2>
        {!pret ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune équipe trouvée. Crée une équipe depuis l’accueil, en ajoutant
            une gymnaste avec le champ « Équipe ».
          </p>
        ) : (
          <>
            <select
              value={choix}
              onChange={(e) => {
                setChoix(e.target.value);
                setCategorie(null);
              }}
              className={champ}
              aria-label="Équipe"
            >
              <option value="">Sélectionner une équipe…</option>
              {liste.map(({ equipe, club }) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nom} ({club}) · {getNiveau(equipe.niveau).label}
                </option>
              ))}
            </select>

            {selection && niveau && (
              <div className="mt-4 space-y-4">
                {membres.length === 0 ? (
                  <p className="text-sm text-muted">
                    Cette équipe n’a pas encore de gymnaste : impossible de
                    déterminer une catégorie.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm text-muted">
                    {membres.map((g) => (
                      <li key={g.id} className="flex justify-between gap-2">
                        <span className="text-foreground">
                          {g.prenom} {g.nom}
                        </span>
                        <span>
                          {g.anneeNaissance} · {ageEnSaison(g.anneeNaissance)}{" "}
                          ans
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {membres.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                      {niveau.label}
                    </p>
                    {possibles.length === 0 ? (
                      <p className="text-sm text-warning">
                        ⚠ Aucune catégorie ne correspond à l’écart d’âge de
                        cette équipe en {niveau.label}.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {possibles
                            .filter(
                              (c) => categorie === null || c.id === categorie,
                            )
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() =>
                                  setCategorie(categorie === c.id ? null : c.id)
                                }
                                title={
                                  categorie === c.id
                                    ? "Revenir à toutes les catégories"
                                    : "Choisir cette catégorie"
                                }
                                className={`${tag} ${STYLE_NIVEAU[niveau.id]}`}
                              >
                                {c.label}
                                <span className="ml-1 opacity-70">
                                  ({anneesCategorie(c)})
                                </span>
                              </button>
                            ))}
                          {categorie !== null && (
                            <button
                              type="button"
                              onClick={() => setCategorie(null)}
                              className="accent-gradient-text px-1 text-xs underline"
                            >
                              Voir toutes les catégories
                            </button>
                          )}
                        </div>
                        <div className="mt-3">
                          <PartageBouton onCreate={partager} className={btnDegrade} />
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          Une catégorie est proposée quand toutes les gymnastes
                          de l’équipe entrent dans sa tranche d’âge.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className={titreSection}>Catégories par niveau (équipes)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {niveauxFed.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-border-subtle bg-surface-alt p-3.5"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="accent-gradient-text text-xl font-bold">
                  {n.id}
                </span>
                <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-muted">
                  {n.format.max}/{n.format.parAgres}/{n.format.notesComptees}
                </span>
              </div>
              <div className="mb-3 text-xs text-muted">{n.detail}</div>
              <div className="flex flex-wrap gap-2">
                {n.categories.map((c) => (
                  <span key={c.id} className={`${tag} ${STYLE_NIVEAU[n.id]}`}>
                    {c.label}
                    <span className="ml-1 opacity-70">
                      ({anneesCategorie(c)})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={titreSection}>Individuel</h2>
        <div className="flex flex-wrap gap-2">
          {categoriesIndividuel.map((c) => (
            <span key={c.id} className={`${tag} ${STYLE_NIVEAU.A}`}>
              {c.label}
              <span className="ml-1 opacity-70">({anneesCategorie(c)})</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Source : {sourceIndividuel}.</p>
      </section>

      <section>
        <h2 className={titreSection}>Âge et année de naissance</h2>
        <div className="max-w-md overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Âge en {anneeSaison}</th>
                <th className="px-4 py-2 font-normal">Année de naissance</th>
              </tr>
            </thead>
            <tbody>
              {anneesParAge.map((a) => (
                <tr key={a.age} className="border-t border-border-subtle">
                  <td className="px-4 py-1.5 text-foreground">
                    {a.age === 18 ? "18 ans et plus" : `${a.age} ans`}
                  </td>
                  <td className="px-4 py-1.5 text-muted">
                    {a.age === 18 ? `${a.annee} et avant` : a.annee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Source : règlement technique GAM GAF 2026-2027, tableaux synoptiques
          (pages 31 et 32).
        </p>
      </section>
    </div>
  );
}
