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

      <p className="mt-6 text-center text-xs text-muted">
        Grille d’éléments FFGYM — voir la brochure des programmes nationaux.
      </p>
    </div>
  );
}
