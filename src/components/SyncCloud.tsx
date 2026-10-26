"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { accesLocal } from "@/lib/data";
import { firebaseConfigure } from "@/lib/firebase";
import { arreterSync, demarrerSync } from "@/lib/sync";
import { nettoyerPartagesExpires } from "@/lib/shares";

// Branche la synchronisation dès qu'un utilisateur est connecté (et que le projet Firebase est renseigné).
export default function SyncCloud() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!firebaseConfigure || !uid) return;
    const arret = demarrerSync(uid, accesLocal);
    // Supprime les liens avec fichier arrivés à expiration (7 jours).
    void nettoyerPartagesExpires();
    return () => {
      arret();
      arreterSync();
    };
  }, [uid]);

  return null;
}
