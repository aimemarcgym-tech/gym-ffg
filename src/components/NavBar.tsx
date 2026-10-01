"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { abonnerEtat, etatSync, type EtatSync } from "@/lib/sync";

const DEBUT = [
  { href: "/", label: "Accueil" },
  { href: "/generalites", label: "Généralités" },
];
const COMPETITION = [
  { href: "/competition/categories-age", label: "Catégories d’âges" },
  { href: "/competition/calendrier", label: "Calendrier" },
  { href: "/competition/musiques", label: "Musiques" },
  { href: "/competition/ordres-passage", label: "Ordres de passage" },
  { href: "/competition/resultats", label: "Résultats" },
];
const MEDIA = [
  { href: "/media/photos", label: "Photos" },
  { href: "/media/videos", label: "Vidéos" },
];
const FIN = [
  { href: "/sauvegarde", label: "Sauvegarde" },
];

const LIBELLE_SYNC: Record<EtatSync, string> = {
  inactif: "Local",
  connexion: "Connexion…",
  synchronise: "Synchronisé",
  "hors-ligne": "Hors ligne",
  erreur: "Erreur de synchro",
};

const onglet = (actif: boolean) =>
  `shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition-colors ${
    actif ? "border-border-strong bg-surface-alt font-semibold text-white" : "border-transparent font-medium text-muted hover:text-foreground"
  }`;

// Les pages de l'accueil (fiche gymnaste, constructeur de mouvement) gardent l'onglet Accueil actif.
const estAccueil = (p: string) => p === "/" || p.startsWith("/gymnaste") || p.startsWith("/mouvement");
const sansSlash = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

function Menu({ pathname, label, basePath, items }: { pathname: string; label: string; basePath: string; items: { href: string; label: string }[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const bouton = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const actif = pathname.startsWith(basePath);

  useEffect(() => {
    const fermer = (e: MouseEvent) => {
      const c = e.target as Node;
      if (bouton.current && !bouton.current.contains(c) && liste.current && !liste.current.contains(c)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOuvert(false);
  }, [pathname]);

  useEffect(() => {
    if (!ouvert || !bouton.current) return;
    const place = () => {
      const r = bouton.current!.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 8 });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [ouvert]);

  return (
    <div ref={bouton} className="relative">
      <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className={`${onglet(actif)} inline-flex items-center gap-1.5`}>
        {label}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${ouvert ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {ouvert && pos && (
        <div ref={liste} style={{ left: pos.left, top: pos.top }} className="fixed z-50 min-w-[12rem] rounded-lg border border-border-strong bg-surface-alt py-1 shadow-lg">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href + "/"}
              className={`block px-4 py-2 text-sm transition-colors ${
                pathname.startsWith(i.href) ? "font-semibold text-white" : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const pathname = sansSlash(usePathname());
  const { user, signOut } = useAuth();
  const synchro = useSyncExternalStore(abonnerEtat, etatSync, () => "inactif" as EtatSync);

  return (
    <nav className="relative flex flex-nowrap items-center justify-start gap-2 overflow-x-auto border-b border-border-subtle bg-surface px-4 py-3 md:justify-center">
      {DEBUT.map((o) => (
        <Link key={o.href} href={o.href === "/" ? "/" : o.href + "/"} className={onglet(o.href === "/" ? estAccueil(pathname) : pathname.startsWith(o.href))}>
          {o.label}
        </Link>
      ))}
      <Menu pathname={pathname} label="Compétition" basePath="/competition" items={COMPETITION} />
      <Link href="/table/" className={onglet(pathname.startsWith("/table"))}>
        Table
      </Link>
      <Link href="/entrainement/" className={onglet(pathname.startsWith("/entrainement"))}>
        Entraînement
      </Link>
      <Menu pathname={pathname} label="Média" basePath="/media" items={MEDIA} />
      <Link href="/faire-musiques/" className={onglet(pathname.startsWith("/faire-musiques"))}>
        Faire ces musiques
      </Link>
      {FIN.map((o) => (
        <Link key={o.href} href={o.href + "/"} className={onglet(pathname.startsWith(o.href))}>
          {o.label}
        </Link>
      ))}

      {user && (
        <div className="ml-2 flex shrink-0 items-center gap-2 text-xs text-muted 2xl:absolute 2xl:top-1/2 2xl:right-4 2xl:ml-0 2xl:-translate-y-1/2">
          <span
            title={LIBELLE_SYNC[synchro]}
            className={`flex shrink-0 items-center gap-1 ${synchro === "synchronise" ? "text-success" : synchro === "erreur" ? "text-danger" : "text-muted"}`}
          >
            ☁<span className="hidden sm:inline">{LIBELLE_SYNC[synchro]}</span>
          </span>
          <span className="hidden 2xl:inline">{user.email}</span>
          <span
            title={user.email ?? ""}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-xs font-semibold text-muted uppercase 2xl:hidden"
          >
            {user.email?.[0] ?? "?"}
          </span>
          <button onClick={() => signOut()} className="rounded border border-border-strong px-2 py-1 text-muted hover:border-accent-solid/60 hover:text-foreground">
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
