"use client";

import { useState } from "react";
import { STYLE_NIVEAU } from "@/lib/styles";

// Fond des panneaux transparent : on garde seulement la couleur du texte et du contour.
const sansFond = (c: string) => c.replace(/bg-\S+/g, "").trim();

const NIVEAUX = [
  {
    id: "A" as const,
    nom: "Fédéral A",
    format: "5/4/3",
    categories: [
      "10-11 ans",
      "10-13 ans",
      "10-15 ans",
      "14 ans et plus",
      "10 ans et plus",
    ],
    plafond: "8,5",
  },
  {
    id: "A2" as const,
    nom: "Fédéral A2",
    format: "5/4/3",
    categories: [
      "10-11 ans",
      "10-13 ans",
      "10-15 ans",
      "14 ans et plus",
      "10 ans et plus",
    ],
    plafond: "7",
  },
  {
    id: "A3" as const,
    nom: "Fédéral A3",
    format: "5/5/3",
    categories: ["7-9 ans", "9-11 ans", "10-13 ans", "10-15 ans", "10 ans et plus"],
    plafond: "5,5",
  },
];

// Grille des éléments exigés, par agrès et par niveau (déclinaison régionale Île-de-France).
const GRILLE: { agres: string; colonnes: string[][]; note?: string }[] = [
  {
    agres: "Barres",
    colonnes: [
      ["1 bascule", "1 tour proche", "1 élan"],
      [
        "1 élément dans le groupe des bascules de min 0,80",
        "1 élément dans le groupe des tours proches de min 0,80, sauf sortie. (Filé avant, tour d’appui arrière libre et tour d’appui avant)",
        "1 élément dans le groupe des élans de min 0,80",
      ],
      [
        "1 élément dans le groupe des bascules ou des élans",
        "1 élément du groupe proche de la barre",
        "7 éléments",
      ],
    ],
    note: "Fédéral A : seuls les éléments en bleu permettent une bonification.",
  },
  {
    agres: "Poutre",
    colonnes: [
      [
        "1 série de deux éléments gymniques dont au moins un saut",
        "1 série acrobatique OU 1 série mixte",
        "1 élément acrobatique Avant/Latéral et 1 élément acrobatique en Arrière",
      ],
      [
        "1 série de deux éléments gymniques dont au moins un saut",
        "1 série acrobatique OU 1 série mixte",
        "1 élément acrobatique Avant/Latéral ET 1 élément acrobatique en Arrière",
      ],
      [
        "1 série de 2 éléments gymniques OU série mixte (A/G ou G/A) OU une série acrobatique de 2 éléments (possible avec l’entrée)",
        "1 élément acrobatique Avant/Latéral et 1 élément acrobatique en Arrière",
        "7 éléments",
      ],
    ],
  },
  {
    agres: "Sol",
    colonnes: [
      [
        "2 lignes acrobatiques",
        "1 ligne acrobatique de 3 éléments dont 1 salto",
        "1 série ou passage gymnique de 2 sauts différents",
      ],
      [
        "1 ligne acrobatique de 2 éléments différents avec envol",
        "Un salto",
        "1 série ou passage gymnique de 2 sauts différents",
      ],
      [
        "1 élément acrobatique avant/latéral et 1 élément acrobatique en arrière dont 1 avec envol",
        "1 série ou passage gymnique de 2 sauts différents",
        "7 éléments",
      ],
    ],
  },
];

// Programme Fédéral A du comité régional Île-de-France : trois niveaux de pratique (source : présentation du comité).
function FederalA() {
  const bloc =
    "rounded-lg border border-border-subtle px-3 py-3 text-center text-sm text-foreground";
  return (
    <>
      <div className="mb-6 rounded-xl border border-border-strong px-6 py-5 text-center">
        <h1 className="text-xl font-bold text-foreground">
          <span className="accent-gradient-text">
            Fédéral A - IDF - 3 niveaux de pratique
          </span>
        </h1>
      </div>

      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
        Anciennement Trophée régional 1 et 2 (A2 et A3)
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {NIVEAUX.map((n) => (
          <div key={n.id} className="space-y-3">
            <div className={`rounded-xl border p-4 text-center ${sansFond(STYLE_NIVEAU[n.id])}`}>
              <div className="text-lg font-bold">{n.nom}</div>
              <div className="text-xs opacity-80">({n.format})</div>
              <div className="mt-2 text-sm font-semibold">Catégories :</div>
              <div className="mt-1 text-sm text-foreground">
                {n.categories.join(", ")}
              </div>
            </div>
            <div className={bloc}>
              <span className="font-semibold">7 éléments maximum autorisés :</span>
              <br />
              0,40 – 0,60 – 0,80 et 1,00 point
            </div>
            <div className={bloc}>
              <span className="font-semibold">3 bonifications à 0,50</span>
            </div>
            <div
              className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold text-foreground ${sansFond(STYLE_NIVEAU[n.id])}`}
            >
              Note de départ plafonnée à {n.plafond} points
              <div className="text-[11px] font-normal text-muted">
                (bonifications comprises)
              </div>
            </div>
            <div className={bloc}>
              <span className="underline">Bonus artistique sur note finale</span> :
              <br />
              en poutre et sol : + 0,30 maximum
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 rounded-xl border border-border-strong px-6 py-4 text-center">
          <h2 className="text-lg font-bold text-foreground">
            <span className="accent-gradient-text">
              Déclinaison Programme Fédéral A – Région Île-de-France
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Grille des éléments du programme Fédéral A
          </p>
        </div>
        <p className="mb-3 text-sm font-semibold text-foreground">
          Attention : le double engagement Fed A et Fed A2 est maintenu la
          saison prochaine.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-20 border-b border-border-subtle" />
                {NIVEAUX.map((n) => (
                  <th
                    key={n.id}
                    className={`border-b border-l px-3 py-3 text-center align-top ${sansFond(STYLE_NIVEAU[n.id])}`}
                  >
                    <div className="text-base font-bold">
                      {n.nom}
                      {n.id !== "A" && (
                        <span className="ml-1 text-[10px] font-normal opacity-80">
                          (anciennement {n.id === "A2" ? "TR1" : "TR2"})
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-80">({n.format})</div>
                    <div className="mt-1 text-xs font-semibold">Catégories :</div>
                    <div className="text-xs font-normal text-foreground">
                      {n.categories.join(", ")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle">
                <td />
                {NIVEAUX.map((n) => (
                  <td
                    key={n.id}
                    className="border-l border-border-subtle px-3 py-3 text-center text-foreground"
                  >
                    <div className="font-semibold">7 éléments maximum</div>
                    <div className="text-[11px] text-muted">
                      dont la valeur la plus élevée sont pris en compte
                    </div>
                    <div className="mt-1 font-semibold">
                      Valeur : 0,40 / 0,60 / 0,80 / 1,00
                    </div>
                    <div className="font-semibold">ND max : {n.plafond}</div>
                    <div className="text-xs">
                      (+ 0,30 de valeur artistique
                      {n.id === "A3" ? "" : " poutre et sol"})
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border-subtle">
                <td
                  colSpan={4}
                  className="px-3 py-2 font-semibold text-foreground"
                >
                  3 bonifications à 0,50 chacune
                </td>
              </tr>
              {GRILLE.map((l) => (
                <tr key={l.agres} className="border-b border-border-subtle last:border-b-0">
                  <th className="px-3 py-3 text-center font-semibold text-foreground">
                    {l.agres}
                  </th>
                  {l.colonnes.map((items, i) => (
                    <td
                      key={i}
                      className="border-l border-border-subtle px-3 py-3 align-middle text-foreground"
                    >
                      <ul className="space-y-1">
                        {items.map((t) => (
                          <li key={t} className="flex gap-1.5">
                            <span className="text-muted">–</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                      {i === 0 && l.note && (
                        <p className="mt-2 text-xs italic text-muted">
                          {l.note}
                        </p>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        Grille d’éléments FFGYM — voir la brochure des programmes nationaux.
      </p>
    </>
  );
}

const NIVEAUX_B = [
  {
    id: "B1" as const,
    nom: "Fédéral B1",
    categories: "9-11 ans, 10-13 ans, 10-15 ans et 10 ans et plus",
    ancien: "TID",
  },
  {
    id: "B2" as const,
    nom: "Fédéral B2",
    categories: "9-11 ans, 10-13 ans, 10-15 ans et 10 ans et plus",
  },
  {
    id: "B3" as const,
    nom: "Fédéral B3",
    categories: "7 ans, 7-8 ans, 7-9 ans et 8-10 ans",
  },
];

// Programme Fédéral B du comité régional Île-de-France : trois niveaux de pratique.
const MATERIEL_AGRES =
  "border-r border-border-subtle px-3 py-4 text-base font-semibold text-orange-400";
const MATERIEL_CASE = "border-l border-border-subtle px-3 py-4 italic";

function FederalBGeneral() {
  const bloc =
    "rounded-lg border border-border-subtle px-3 py-3 text-center text-sm text-foreground";
  const [b1, b2, b3] = NIVEAUX_B;
  const carte = (n: (typeof NIVEAUX_B)[number]) => (
    <div className={`rounded-xl border p-4 text-center ${sansFond(STYLE_NIVEAU[n.id])}`}>
      <div className="text-lg font-bold">{n.nom}</div>
      <div className="text-xs opacity-80">(5/5/3)</div>
      <div className="mt-2 text-sm font-semibold">Catégories :</div>
      <div className="mt-1 text-sm text-foreground">{n.categories}</div>
    </div>
  );
  return (
    <>
      <div className="mb-6 rounded-xl border border-border-strong px-6 py-5 text-center">
        <h1 className="text-xl font-bold text-foreground">
          <span className="accent-gradient-text">
            Fédéral B - IDF - 3 niveaux de pratique
          </span>
        </h1>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
          Anciennement TID
        </p>
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted md:col-span-2">
          Anciennement Fed B - FFGym
        </p>

        {carte(b1)}
        {carte(b2)}
        {carte(b3)}

        <div className={`${bloc} md:col-span-3`}>
          1 grille d’éléments (grille IDF) commune pour tous ces programmes.
          Éléments sans valeur (sauf aux barres), A, B ou C.
        </div>

        <div className={bloc}>
          <div className="font-semibold underline">6 éléments maximum</div>
          <div className="text-[11px] text-muted">
            dont la valeur la plus élevée est prise en compte
          </div>
          <ul className="mt-2 space-y-0.5">
            <li>Sans valeur</li>
            <li>A : 0,40</li>
            <li>B : 0,60</li>
            <li>C : 0,80</li>
          </ul>
        </div>
        <div className={`${bloc} md:col-span-2`}>
          <div className="font-semibold underline">5 éléments maximum</div>
          <div className="text-[11px] text-muted">
            dont la valeur la plus élevée est prise en compte
          </div>
          <ul className="mt-2 space-y-0.5">
            <li>Sans valeur</li>
            <li>A : 0,40</li>
            <li>B : 0,60</li>
            <li>Les éléments C ne sont pas autorisés en Fed B2 et B3</li>
          </ul>
        </div>

        <div className={bloc}>
          <div className="font-semibold">2 bonifications à 0,50 chacune</div>
          <div className="mt-1 text-xs text-muted">
            Dans le programme Fed B1, les éléments sans valeur ne peuvent pas
            valider les bonifications.
          </div>
        </div>
        <div className={`${bloc} md:col-span-2`}>
          <div className="font-semibold">2 bonifications à 0,50 chacune</div>
          <div className="mt-1 text-xs text-muted">
            Dans le programme Fed B2 et B3, les éléments sans valeur peuvent
            valider les bonifications.
          </div>
        </div>

        <div
          className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold text-foreground ${sansFond(STYLE_NIVEAU.B1)}`}
        >
          Note de départ plafonnée à 5,80 points
          <div className="text-[11px] font-normal text-muted">
            (bonifications comprises)
          </div>
        </div>
        <div
          className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold text-foreground md:col-span-2 ${sansFond(STYLE_NIVEAU.B2)}`}
        >
          Note de départ plafonnée à 4,00 points
          <div className="text-[11px] font-normal text-muted">
            (bonifications comprises)
          </div>
        </div>
      </div>
      <section className="mt-10 space-y-6">
        <div className="rounded-xl border border-border-strong px-6 py-4 text-center">
          <h2 className="text-lg font-bold text-foreground">
            <span className="accent-gradient-text">
              Réglementation – Contenu – Fédéral B
            </span>
          </h2>
          <p className="text-sm text-muted">Programme Île-de-France</p>
        </div>

        <RegleBloc titre="Comment noter le Fédéral B ?">
          <p className="font-medium text-foreground">Calcul de la note finale</p>
          <Liste
            items={[
              "La note finale à chaque agrès est établie à partir de 2 notes séparées : note D et note E.",
              "Le jury D calcule la note D : contenu de l’exercice (valeurs de difficultés).",
            ]}
          />
          <p>et</p>
          <Liste
            items={[
              "Le jury E calcule la note E : exécution (tableau des fautes générales et/ou des fautes spécifiques à chaque agrès).",
              "La note finale d’un exercice est établie par l’addition de la note D et la note E. Si nécessaire, soustraction des déductions neutres.",
            ]}
          />
        </RegleBloc>

        <RegleBloc titre="Note D">
          <p>
            Au saut, la note D correspond à la valeur de difficulté fixée dans
            le tableau des sauts.
          </p>
          <Liste
            items={[
              "Aux barres asymétriques, poutre et sol, la note D correspond à la valeur du mouvement, et éventuellement aux bonifications.",
            ]}
          />
        </RegleBloc>

        <RegleBloc titre="Choix des éléments">
          <Liste
            items={[
              "Seuls les éléments des grilles Fed B – IDF sont autorisés.",
              <>
                <strong>Fed B1</strong> : 6 éléments différents choisis dans la
                grille des éléments Fed B – IDF.
              </>,
              <>
                <strong>Fed B2 et B3</strong> : 5 éléments différents choisis
                dans la grille des éléments Fed B – IDF.
              </>,
              <>
                La description officielle des éléments est donnée dans le texte (
                <em>seul le texte fait foi</em>) : un élément est reconnu
                uniquement si sa réalisation technique est conforme au texte.
              </>,
              <>
                <em>Répétition</em> : si un élément est réalisé 2 fois au cours
                de l’enchaînement, il n’est comptabilisé qu’une seule fois,{" "}
                <em>mais les pénalités pour fautes d’exécution sont appliquées.</em>
              </>,
              "Un élément ne peut pas être répété.",
              <>
                <em>Éléments identiques</em> : les éléments sont considérés
                comme identiques s’ils sont dans la même case. L’élément n’est
                donc pris en compte qu’une seule fois.
              </>,
              "Élément hors grille IDF : non comptabilisé.",
              "Élément non reconnu ou réalisé avec aide : non comptabilisé.",
              "Les éléments avec rotation incomplète ne sont pas comptabilisés.",
            ]}
          />
        </RegleBloc>

        <RegleBloc titre="Bonifications">
          <Liste
            items={[
              <>
                Les bonifications sont accordées si la réalisation se fait sans
                chute ou sans s’accrocher à l’agrès <em>(poutre)</em>.
              </>,
            ]}
          />
        </RegleBloc>

        <RegleBloc titre="Exécution">
          <Liste
            items={[
              "Se reporter aux tableaux des fautes générales et spécifiques de ce programme.",
            ]}
          />
        </RegleBloc>
      </section>
      <section className="mt-10">
        <div className="mb-4 rounded-xl border border-border-strong px-6 py-4 text-center">
          <h2 className="text-lg font-bold text-foreground">
            <span className="accent-gradient-text">
              Programme Fédéral B – IDF, saison 2026/2027
            </span>
          </h2>
          <p className="text-sm font-semibold text-muted">
            Réglementation du matériel
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[640px] border-collapse text-center text-sm text-foreground">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="w-24" />
                {NIVEAUX_B.map((n) => (
                  <th
                    key={n.id}
                    className={`border-l px-3 py-3 font-bold ${sansFond(STYLE_NIVEAU[n.id])}`}
                  >
                    {n.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle">
                <th className={MATERIEL_AGRES}>Saut</th>
                <td colSpan={2} className={MATERIEL_CASE}>
                  <ul className="mx-auto w-fit space-y-1 text-left">
                    <li>– Hauteur table de saut 1,15 m</li>
                    <li>– Tremplin ou TrampoTremp, au choix</li>
                    <li>– Course 25 mètres</li>
                  </ul>
                </td>
                <td className={MATERIEL_CASE}>
                  <div className="mb-2 font-semibold">Pas de table de saut</div>
                  <ul className="mx-auto w-fit space-y-1 text-left">
                    <li>– 1 TrampoTremp en position basse</li>
                    <li>– 2 tapis de réception superposés de 6 m x 2 m x 20 cm</li>
                    <li>– 1 sur tapis de 10 cm de hauteur</li>
                    <li>– Course 10 mètres</li>
                  </ul>
                </td>
              </tr>
              <tr className="border-b border-border-subtle">
                <th className={MATERIEL_AGRES}>Barres</th>
                <td colSpan={3} className={MATERIEL_CASE}>
                  Hauteur BI et BS – normes FIG
                </td>
              </tr>
              <tr className="border-b border-border-subtle">
                <th className={MATERIEL_AGRES}>Poutre</th>
                <td colSpan={2} className={MATERIEL_CASE}>
                  Hauteur 1,25 m
                </td>
                <td className={MATERIEL_CASE}>Hauteur 1,00 m</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <th rowSpan={2} className={MATERIEL_AGRES}>
                  Sol
                </th>
                <td className={MATERIEL_CASE}>Avec musique</td>
                <td className={MATERIEL_CASE}>
                  Musique au choix
                  <br />
                  non obligatoire
                </td>
                <td className={MATERIEL_CASE}>Sans musique</td>
              </tr>
              <tr>
                <td colSpan={3} className={MATERIEL_CASE}>
                  Mouvement sur bande de praticable 12 x 2 (non dynamique)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function RegleBloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent-from">
        {titre}
      </h3>
      <div className="space-y-2 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Liste({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="text-muted">–</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

type LigneNiveauB = {
  agres: string;
  specificites: React.ReactNode;
  bonifs: string[];
};

interface ConfigNiveauB {
  id: "B1" | "B2" | "B3";
  nom: string;
  ancien: string;
  couleur: string;
  maxElements: number;
  minElements?: number;
  seuilPenalite: number;
  valeurs: string[];
  sansC?: boolean;
  motBonif: string;
  // Ce que la gymnaste ne doit pas avoir touché pour avoir droit à une 3e course d'élan.
  courseTouche?: string;
  lignes: LigneNiveauB[];
}

const BARRES_SPEC = (
  <>
    Possibilité de mouvement en 2 parties : une partie BI et une partie BS.
    Pour la partie BS, l’entraîneur peut placer la gymnaste en suspension ou en
    appuis BS.
    <div className="my-1 font-semibold not-italic">OU</div>
    Possibilité de mouvement en 1 partie.
  </>
);

const CONFIG_B1: ConfigNiveauB = {
  id: "B1",
  nom: "Fédéral B1",
  ancien: "anciennement TID",
  couleur: "text-blue-300",
  maxElements: 6,
  minElements: 5,
  seuilPenalite: 4,
  valeurs: ["Élément sans valeur", "A : 0,40", "B : 0,60", "C : 0,80"],
  motBonif: "Dans le programme FED-B1, les éléments sans valeur ne peuvent pas valider les bonifications.",
  lignes: [
    {
      agres: "Barres",
      specificites: BARRES_SPEC,
      bonifs: [
        "2 éléments de valeur C",
        "2 appuis OU 2 suspensions OU 1 appui et 1 suspension",
      ],
    },
    {
      agres: "Poutre",
      specificites: "Temps : 50 sec max",
      bonifs: [
        "1 élément acrobatique sur la poutre de valeur C",
        "1 élément gymnique de valeur C",
      ],
    },
    {
      agres: "Sol",
      specificites: (
        <>
          Temps : 50 sec max
          <div className="mt-2">Musique obligatoire en FED-B1</div>
        </>
      ),
      bonifs: [
        "1 élément acrobatique de valeur C",
        "1 série OU un passage gymnique dont un élément de valeur C",
      ],
    },
  ],
};

const CONFIG_B2: ConfigNiveauB = {
  id: "B2",
  nom: "Fédéral B2",
  ancien: "anciennement Fédéral B à partir de 9 ans",
  couleur: "text-violet-300",
  maxElements: 5,
  seuilPenalite: 3,
  valeurs: ["Élément sans valeur", "A : 0,40", "B : 0,60"],
  sansC: true,
  motBonif: "",
  lignes: [
    {
      agres: "Barres",
      specificites: BARRES_SPEC,
      bonifs: [
        "1 élément de valeur B",
        "1 élément de valeur B différent de la 1re bonification",
      ],
    },
    {
      agres: "Poutre",
      specificites: "Temps : 50 sec max",
      bonifs: [
        "1 élément acrobatique sur la poutre de valeur B",
        "1 élément gymnique de valeur B",
      ],
    },
    {
      agres: "Sol",
      specificites: (
        <>
          Temps : 50 sec max
          <div className="mt-2">Au choix avec ou sans musique pour FED-B2</div>
        </>
      ),
      bonifs: [
        "1 élément acrobatique de valeur B",
        "1 élément gymnique de valeur B",
      ],
    },
  ],
};

const CONFIG_B3: ConfigNiveauB = {
  id: "B3",
  nom: "Fédéral B3",
  ancien: "anciennement Fédéral B à partir de 7 ans",
  couleur: "text-teal-300",
  maxElements: 5,
  seuilPenalite: 3,
  valeurs: ["Élément sans valeur", "A : 0,40", "B : 0,60"],
  sansC: true,
  motBonif: "",
  courseTouche: "ni le TrampoTremp, ni le tapis",
  lignes: [
    {
      agres: "Barres",
      specificites: (
        <div className="space-y-2 not-italic">
          <p>
            <span className="font-semibold underline">Interdiction</span> de
            passer de BI à BS.
          </p>
          <p>
            <span className="font-semibold underline">Possibilité</span> de
            mouvement en 2 parties : une partie BI <strong>et</strong> une
            partie BS.
          </p>
          <p>Possibilité de mouvement sur une seule barre (BI ou BS).</p>
          <p>
            Pour la BS, l’entraîneur peut placer la gymnaste en suspension ou
            en appui.
          </p>
        </div>
      ),
      bonifs: [
        "1 élément de valeur B",
        "1 élément de valeur B différent de la 1re bonification",
      ],
    },
    {
      agres: "Poutre",
      specificites: "Temps : 50 sec max",
      bonifs: [
        "1 élément acrobatique sur la poutre de valeur B",
        "1 élément gymnique de valeur B",
      ],
    },
    {
      agres: "Sol",
      specificites: (
        <>
          Temps : 50 sec max
          <div className="mt-2">Mouvement sans musique</div>
        </>
      ),
      bonifs: [
        "1 élément acrobatique de valeur B",
        "1 élément gymnique de valeur B",
      ],
    },
  ],
};

function FederalBNiveau({ c }: { c: ConfigNiveauB }) {
  const entete = `border-l border-border-subtle px-3 py-3 text-center font-bold ${c.couleur}`;
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border-strong px-6 py-4 text-center">
        <h2 className="text-lg font-bold text-foreground">
          <span className="accent-gradient-text">
            Programme {c.nom} – IDF, saison 2026/2027
          </span>
        </h2>
        <p className={`text-sm font-semibold ${c.couleur}`}>
          {c.nom} ({c.ancien})
        </p>
      </div>

      <div className="rounded-xl border border-border-subtle text-center text-sm text-foreground">
        <div className="border-b border-border-subtle px-3 py-2 text-base font-semibold text-orange-400">
          Saut
        </div>
        <ul className="space-y-1 px-3 py-3">
          <li>2 sauts identiques ou différents. Le meilleur est pris en compte.</li>
          <li>
            Une 3<sup>e</sup> course d’élan est autorisée si la gymnaste n’a
            touché {c.courseTouche ?? "ni le tremplin, ni le TrampoTremp, ni la table de saut"}.
          </li>
          <li className="border-t border-border-subtle pt-2">
            Se référer au tableau des sauts autorisés et aux notes D associées.
          </li>
        </ul>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[820px] border-collapse text-sm text-foreground">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="w-24" />
              <th className={`${entete} w-[24%]`}>Spécificités</th>
              <th className={`${entete} w-[31%]`}>
                Valeurs de difficulté
                <div className="text-xs font-normal opacity-80">
                  (éléments de la grille FED B – IDF)
                </div>
              </th>
              <th className={`${entete} w-[45%]`}>
                Bonifications
                <div className="text-xs font-normal opacity-80">
                  Accordées sans chute
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {c.lignes.map((l) => (
              <tr key={l.agres} className="border-b border-border-subtle last:border-b-0">
                <th className={MATERIEL_AGRES}>{l.agres}</th>
                <td className="border-l border-border-subtle px-3 py-4 text-center italic">
                  {l.specificites}
                </td>
                <td className="border-l border-border-subtle px-3 py-4 text-center">
                  <div className="font-semibold">
                    FED-{c.id} : {c.maxElements} éléments maximum
                  </div>
                  <div className="text-[11px] text-muted">
                    dont la valeur la plus élevée est prise en compte
                  </div>
                  {c.minElements && <div>({c.minElements} éléments minimum)</div>}
                  <div className="mt-1 text-yellow-300">
                    Pénalité de -2,00 points si {c.seuilPenalite} éléments ou moins
                  </div>
                  <ul className="mx-auto mt-2 w-fit space-y-0.5 text-left">
                    {c.valeurs.map((v) => (
                      <li key={v}>– {v}</li>
                    ))}
                  </ul>
                  {c.sansC && (
                    <p className="mt-2 font-semibold">
                      Les éléments C ne sont pas autorisés dans le programme
                      FED-{c.id}.
                    </p>
                  )}
                  {l.agres === "Barres" && (
                    <p className="mt-2 text-[11px] font-semibold">
                      Présence obligatoire de l’entraîneur sous les barres. Si
                      non-présence de l’entraîneur, la gymnaste n’est pas
                      autorisée à passer. Si l’entraîneur part en cours de
                      mouvement : mouvement noté à zéro.
                    </p>
                  )}
                </td>
                <td className="border-l border-border-subtle px-3 py-4 text-center">
                  <div className="font-semibold italic">FED-{c.id} : 2 bonifications</div>
                  <ul className="mx-auto my-2 w-fit space-y-1 text-left">
                    {l.bonifs.map((x) => (
                      <li key={x}>– {x}</li>
                    ))}
                  </ul>
                  <div className="font-semibold italic">
                    Valeur 0,50 chacune sur ND
                  </div>
                  {c.motBonif && (
                    <div className="mt-2 text-xs font-semibold">{c.motBonif}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FederalB() {
  const [sous, setSous] = useState<"G" | "B1" | "B2" | "B3">("G");
  const btn = (actif: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm transition-colors ${
      actif
        ? "border-border-strong bg-surface-alt text-white"
        : "border-transparent text-muted hover:text-foreground"
    }`;
  const liste: { id: "G" | "B1" | "B2" | "B3"; label: string }[] = [
    { id: "G", label: "Général" },
    { id: "B1", label: "Fédéral B1" },
    { id: "B2", label: "Fédéral B2" },
    { id: "B3", label: "Fédéral B3" },
  ];
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border-subtle pb-3">
        {liste.map((o) => (
          <button key={o.id} type="button" onClick={() => setSous(o.id)} className={btn(sous === o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      {sous === "G" && <FederalBGeneral />}
      {sous === "B1" && <FederalBNiveau c={CONFIG_B1} />}
      {sous === "B2" && <FederalBNiveau c={CONFIG_B2} />}
      {sous === "B3" && <FederalBNiveau c={CONFIG_B3} />}
    </>
  );
}

export default function ProgrammeFederalA() {
  const [onglet, setOnglet] = useState<"A" | "B">("A");
  const btn = (actif: boolean) =>
    `rounded-lg border px-4 py-2 text-sm transition-colors ${
      actif
        ? "border-border-strong bg-surface-alt text-white"
        : "border-transparent text-muted hover:text-foreground"
    }`;
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex gap-2">
        <button type="button" onClick={() => setOnglet("A")} className={btn(onglet === "A")}>
          Fédéral A
        </button>
        <button type="button" onClick={() => setOnglet("B")} className={btn(onglet === "B")}>
          Fédéral B
        </button>
      </div>
      {onglet === "A" ? <FederalA /> : <FederalB />}
    </div>
  );
}
