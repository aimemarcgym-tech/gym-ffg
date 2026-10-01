"use client";

import { useState } from "react";
import Link from "next/link";
import PanneauConversion from "@/components/PanneauConversion";
import PanneauMontage from "@/components/PanneauMontage";

// Préparer les musiques des gymnastes : tout convertir en MP3, puis couper ce qui dépasse. Tout reste sur l'appareil.
export default function FaireMusiques() {
  // Musique envoyée du panneau de conversion vers le montage (la clé change à chaque envoi, même pour le même fichier).
  const [aCouper, setACouper] = useState<{ cle: number; fichier: File } | null>(null);
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Faire ces musiques</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Convertissez vos fichiers en MP3 puis coupez-les à la bonne durée. Les fichiers restent sur votre appareil et peuvent être ajoutés directement à la musique d’une gymnaste.</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1600px] items-start gap-6 px-6 py-10 lg:grid-cols-2">
        <PanneauConversion onCouper={(fichier) => setACouper({ cle: Date.now(), fichier })} />
        <PanneauMontage aCouper={aCouper} />
      </main>
    </div>
  );
}
