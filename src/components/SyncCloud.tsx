"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { accesLocal } from "@/lib/data";
import { firebaseConfigure } from "@/lib/firebase";
import { arreterSync, demarrerSync } from "@/lib/sync";

// Branche la synchronisation dès qu'un utilisateur est connecté (et que le projet Firebase est renseigné).
export default function SyncCloud() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!firebaseConfigure || !uid) return;
    const arret = demarrerSync(uid, accesLocal);
    return () => {
      arret();
      arreterSync();
    };
  }, [uid]);

  return null;
}
