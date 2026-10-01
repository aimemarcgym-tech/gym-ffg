"use client";

export type Filiere = "FEDERAL" | "FEDERAL_B" | "PERFORMANCE";

interface Props {
  actif: Filiere;
  onChoisir: (f: Filiere) => void;
  nbEquipes: number;
  nbGymnastes: number;
  nbEquipesB: number;
  nbGymnastesB: number;
}

// Même style que les cartes d'évolution de l'accueil UFOLEP.
const carte = (choisie: boolean) =>
  `flex flex-col justify-between rounded-lg border p-3.5 text-left transition ${
    choisie
      ? "border-accent-solid/50 bg-gradient-to-br from-blue-500/20 via-accent-from/10 to-accent-to/10"
      : "border-border-subtle bg-surface-alt hover:border-accent-solid/60"
  }`;

export default function FilieresPanneaux({ actif, onChoisir, nbEquipes, nbGymnastes, nbEquipesB, nbGymnastesB }: Props) {
  return (
    <section className="mb-10 grid gap-3 sm:grid-cols-3">
      <button onClick={() => onChoisir("FEDERAL")} aria-pressed={actif === "FEDERAL"} className={carte(actif === "FEDERAL")}>
        <div className="mb-1 flex items-center justify-between">
          <span className="accent-gradient-text text-xl font-bold">Fédéral A</span>
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-muted">GAF</span>
        </div>
        <div className="text-xs text-muted">Programme national · A, A2 et A3</div>
        <div className="mt-1 text-xs text-muted">
          {nbEquipes} équipe{nbEquipes > 1 ? "s" : ""} · {nbGymnastes} gymnaste{nbGymnastes > 1 ? "s" : ""}
        </div>
      </button>

      <button onClick={() => onChoisir("FEDERAL_B")} aria-pressed={actif === "FEDERAL_B"} className={carte(actif === "FEDERAL_B")}>
        <div className="mb-1 flex items-center justify-between">
          <span className="accent-gradient-text text-xl font-bold">Fédéral B</span>
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-muted">GAF</span>
        </div>
        <div className="text-xs text-muted">Programme régional IDF · B1, B2 et B3</div>
        <div className="mt-1 text-xs text-muted">
          {nbEquipesB} équipe{nbEquipesB > 1 ? "s" : ""} · {nbGymnastesB} gymnaste{nbGymnastesB > 1 ? "s" : ""}
        </div>
      </button>

      <button onClick={() => onChoisir("PERFORMANCE")} aria-pressed={actif === "PERFORMANCE"} className={carte(actif === "PERFORMANCE")}>
        <div className="mb-1 flex items-center justify-between">
          <span className="accent-gradient-text text-xl font-bold">Performance</span>
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-muted">à venir</span>
        </div>
        <div className="text-xs text-muted">Nationale A, B, C · Régionale 7-9 ans · Individuel</div>
        <div className="mt-1 text-xs text-muted">Programmes pas encore saisis</div>
      </button>
    </section>
  );
}
