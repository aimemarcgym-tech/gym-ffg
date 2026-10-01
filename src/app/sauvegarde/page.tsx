import Sauvegarde from "@/components/Sauvegarde";

export default function SauvegardePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Sauvegarde</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Les données sont stockées uniquement sur cet appareil, sans synchronisation automatique. Exportez / importez un fichier JSON pour les transférer vers un autre appareil ou les mettre à l’abri.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Sauvegarde />
      </main>
    </div>
  );
}
