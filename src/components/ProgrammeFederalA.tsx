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
export default function ProgrammeFederalA() {
  const bloc =
    "rounded-lg border border-border-subtle px-3 py-3 text-center text-sm text-foreground";
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
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
    </div>
  );
}
