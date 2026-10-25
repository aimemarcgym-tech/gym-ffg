// Texte d'une séance : les lignes ajoutées depuis la bibliothèque (« • nom (valeur) ») s'affichent en petites cartes,
// comme dans la bibliothèque ; le reste du texte reste du texte libre.
const LIGNE_ELEMENT = /^\s*•\s*(.+?)\s*\(([^()]+)\)\s*$/;

export default function ContenuSeance({ texte }: { texte: string }) {
  const lignes = texte.split("\n");
  const blocs: (
    | { type: "texte"; texte: string }
    | { type: "element"; nom: string; valeur: string }
  )[] = [];
  for (const l of lignes) {
    const m = LIGNE_ELEMENT.exec(l);
    if (m) blocs.push({ type: "element", nom: m[1], valeur: m[2] });
    else {
      const dernier = blocs[blocs.length - 1];
      if (dernier?.type === "texte") dernier.texte += `\n${l}`;
      else blocs.push({ type: "texte", texte: l });
    }
  }
  return (
    <div className="space-y-1.5">
      {blocs.map((b, i) =>
        b.type === "element" ? (
          <div
            key={i}
            className="flex flex-col items-start gap-1 rounded border border-border-subtle bg-surface-alt p-2"
          >
            <span className="rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] text-muted">
              {b.valeur}
            </span>
            <span className="text-xs leading-snug text-foreground">
              {b.nom}
            </span>
          </div>
        ) : b.texte.trim() === "" ? null : (
          <p key={i} className="text-sm whitespace-pre-wrap text-foreground">
            {b.texte}
          </p>
        ),
      )}
    </div>
  );
}

type Bloc =
  | { type: "texte"; texte: string }
  | { type: "element"; nom: string; valeur: string };

function decouper(valeur: string): Bloc[] {
  const blocs: Bloc[] = [];
  if (valeur === "") return blocs;
  for (const l of valeur.split("\n")) {
    const m = LIGNE_ELEMENT.exec(l);
    if (m) blocs.push({ type: "element", nom: m[1], valeur: m[2] });
    else {
      const dernier = blocs[blocs.length - 1];
      if (dernier?.type === "texte") dernier.texte += `\n${l}`;
      else blocs.push({ type: "texte", texte: l });
    }
  }
  return blocs;
}

function assembler(blocs: Bloc[]): string {
  return blocs
    .filter((b) => b.type === "element" || b.texte !== "")
    .map((b) => (b.type === "element" ? `• ${b.nom} (${b.valeur})` : b.texte))
    .join("\n");
}

// Saisie d'une séance : le texte libre reste modifiable et chaque élément ajouté depuis la bibliothèque apparaît dans sa propre case
// (valeur au-dessus du nom), qu'on peut retirer. Le contenu reste une simple chaîne de texte.
export function EditeurSeance({
  valeur,
  onChange,
  placeholder,
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const blocs = decouper(valeur);
  // Une zone de texte vide reste toujours disponible à la fin pour continuer à écrire.
  const rendus: Bloc[] =
    blocs.length === 0 || blocs[blocs.length - 1].type === "element"
      ? [...blocs, { type: "texte", texte: "" }]
      : blocs;

  function remplacer(i: number, b: Bloc | null) {
    const suite = rendus.slice();
    if (b) suite[i] = b;
    else suite.splice(i, 1);
    onChange(assembler(suite));
  }

  return (
    <div className="space-y-1.5 rounded border border-border-strong bg-surface-alt p-2 focus-within:border-accent-solid">
      {rendus.map((b, i) =>
        b.type === "element" ? (
          <div
            key={i}
            className="relative flex flex-col items-start gap-1 rounded border border-border-subtle bg-surface p-2 pr-7"
          >
            <span className="rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] text-muted">
              {b.valeur}
            </span>
            <span className="text-xs leading-snug text-foreground">
              {b.nom}
            </span>
            <button
              type="button"
              onClick={() => remplacer(i, null)}
              title="Retirer cet élément"
              className="absolute top-1 right-2 text-xs text-muted hover:text-danger"
            >
              ✕
            </button>
          </div>
        ) : (
          <textarea
            key={i}
            value={b.texte}
            onChange={(e) =>
              remplacer(i, { type: "texte", texte: e.target.value })
            }
            rows={Math.max(
              i === 0 && rendus.length === 1 ? 3 : 1,
              b.texte.split("\n").length,
            )}
            placeholder={
              i === 0 && rendus.length === 1 ? placeholder : undefined
            }
            className="w-full resize-none bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        ),
      )}
    </div>
  );
}
