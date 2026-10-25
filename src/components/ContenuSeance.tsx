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
