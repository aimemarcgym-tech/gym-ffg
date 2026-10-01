"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Rappel discret tant que l'adresse e-mail n'est pas confirmée ; l'appli reste entièrement utilisable.
export default function BandeauVerification() {
  const { user, renvoyerVerification, actualiserVerification } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  if (!user || user.emailVerified) return null;

  async function renvoyer() {
    setOccupe(true);
    try {
      await renvoyerVerification();
      setMessage("E-mail renvoyé. Pensez à regarder les courriers indésirables.");
    } catch {
      setMessage("Envoi impossible pour le moment (trop de demandes). Réessayez dans quelques minutes.");
    } finally {
      setOccupe(false);
    }
  }

  async function verifier() {
    setOccupe(true);
    try {
      setMessage((await actualiserVerification()) ? null : "L’adresse n’est pas encore confirmée : cliquez d’abord sur le lien reçu par e-mail.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning">
      Adresse e-mail non confirmée : consultez votre boîte mail (et les courriers indésirables) pour cliquer sur le lien de confirmation.{" "}
      <button type="button" disabled={occupe} onClick={renvoyer} className="font-semibold underline disabled:opacity-50">
        Renvoyer l’e-mail
      </button>{" "}
      ·{" "}
      <button type="button" disabled={occupe} onClick={verifier} className="font-semibold underline disabled:opacity-50">
        J’ai confirmé
      </button>
      {message && <span className="ml-2 text-foreground">{message}</span>}
    </div>
  );
}
