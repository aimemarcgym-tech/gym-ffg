import MediaAlbums from "@/components/MediaAlbums";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Vidéos</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Classez vos vidéos par compétition ou événement, taguez-les et retrouvez-les en un clic.</p>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <MediaAlbums type="video" />
      </main>
    </div>
  );
}
