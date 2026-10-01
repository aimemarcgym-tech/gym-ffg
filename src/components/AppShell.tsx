"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGate from "@/components/AuthGate";
import NavBar from "@/components/NavBar";
import { DialoguesProvider } from "@/components/Dialogues";
import SyncCloud from "@/components/SyncCloud";
import BandeauVerification from "@/components/BandeauVerification";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Quand un autre appareil modifie les données, les pages se rechargent pour afficher la nouvelle version.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const f = () => setVersion((v) => v + 1);
    window.addEventListener("ffg:distant", f);
    return () => window.removeEventListener("ffg:distant", f);
  }, []);
  const sansNav = pathname.startsWith("/partage/") || pathname.startsWith("/connexion/");
  // La fiche gymnaste, le constructeur de mouvement et les pages de partage et de sauvegarde gèrent eux-mêmes leur bandeau et leur largeur.
  const libre = pathname.startsWith("/gymnaste") || pathname.startsWith("/mouvement") || pathname.startsWith("/partage/") || pathname.startsWith("/sauvegarde") || pathname.startsWith("/media") || pathname.startsWith("/entrainement") || pathname.startsWith("/table") || pathname.startsWith("/competition/calendrier") || pathname.startsWith("/competition/resultats") || pathname.startsWith("/faire-musiques") || pathname.startsWith("/connexion");
  return (
    <AuthProvider>
      <DialoguesProvider>
        <SyncCloud />
      {!sansNav && <NavBar />}
      {!sansNav && <BandeauVerification />}
      {pathname === "/" && (
        <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <h1 className="text-xl font-bold text-foreground">
              Gestion <span className="accent-gradient-text">Compétitions &amp; Entraînements</span>
            </h1>
          </div>
        </header>
      )}
      <AuthGate>
          <div key={version}>{libre ? children : <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>}</div>
        </AuthGate>
      </DialoguesProvider>
    </AuthProvider>
  );
}
