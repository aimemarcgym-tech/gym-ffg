export default function PageVide({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-foreground">{titre}</h1>
      <p className="mt-1 text-sm text-muted">{texte}</p>
    </div>
  );
}
