import Link from "next/link";
import PageProgrammeTechnique from "@/components/PageProgrammeTechnique";

export default function ProgrammeTechniquePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Programme technique</span>
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] space-y-8 px-6 py-10">
        <PageProgrammeTechnique />
      </main>
    </div>
  );
}
