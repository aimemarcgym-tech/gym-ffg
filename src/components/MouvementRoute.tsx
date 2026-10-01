"use client";

import { useEffect, useState } from "react";
import MouvementEditeur from "@/components/MouvementEditeur";
import MouvementsListe from "@/components/MouvementsListe";

// Avec l'export statique, le paramètre ?m= n'existe que côté client : on choisit l'écran après le premier rendu.
export default function MouvementRoute() {
  const [mode, setMode] = useState<"attente" | "editeur" | "liste">("attente");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(new URLSearchParams(window.location.search).get("m") ? "editeur" : "liste");
  }, []);

  if (mode === "attente") return null;
  return mode === "editeur" ? <MouvementEditeur /> : <MouvementsListe />;
}
