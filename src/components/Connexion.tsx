"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseConfigure } from "@/lib/firebase";
import { onglets, ongletBouton } from "@/lib/styles";

const champ = "w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none";

function messageErreur(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email ou mot de passe incorrect.";
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cet email.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/missing-email":
      return "Saisissez d’abord votre adresse e-mail.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "auth/network-request-failed":
      return "Pas de connexion internet.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}

// Même page de connexion que sur le site UFOLEP : e-mail + mot de passe, création de compte pour synchroniser les appareils.
export default function Connexion() {
  const { signIn, signUp, reinitialiserMotDePasse } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficher, setAfficher] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Envoie un e-mail de réinitialisation à l'adresse saisie ; le message est le même que le compte existe ou non.
  async function motDePasseOublie() {
    setErreur(null);
    setInfo(null);
    if (!email.trim()) return setErreur(messageErreur("auth/missing-email"));
    setOccupe(true);
    try {
      await reinitialiserMotDePasse(email.trim());
      setInfo("Si un compte existe pour cette adresse, un e-mail pour choisir un nouveau mot de passe vient d’être envoyé. Pensez à regarder les courriers indésirables.");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: unknown }).code) : "";
      // « Utilisateur introuvable » n'est pas révélé : même message de confirmation.
      if (code === "auth/user-not-found") setInfo("Si un compte existe pour cette adresse, un e-mail pour choisir un nouveau mot de passe vient d’être envoyé. Pensez à regarder les courriers indésirables.");
      else setErreur(messageErreur(code));
    } finally {
      setOccupe(false);
    }
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setOccupe(true);
    try {
      if (mode === "connexion") await signIn(email, motDePasse);
      else await signUp(email, motDePasse);
      router.push("/");
    } catch (err) {
      setErreur(messageErreur(err instanceof Error && "code" in err ? String((err as { code: unknown }).code) : ""));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex w-full shrink-0 items-center justify-center gap-1.5 border-b border-border-subtle bg-surface-alt/60 px-6 py-3">
        <div className="accent-gradient flex h-10 w-10 shrink-0 -translate-x-3 items-center sm:-translate-x-7 justify-center rounded-lg text-sm font-extrabold tracking-tight text-white shadow-lg shadow-accent-from/20">GAF</div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-wide text-foreground uppercase">FFGym</div>
          <div className="text-sm font-medium text-muted">Gymnastique Artistique Féminine</div>
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-16 pb-10">
        <h1 className="mb-1 text-xl font-bold text-foreground">
          <span className="accent-gradient-text">Gestion Compétitions &amp; Entraînements</span>
        </h1>
        <p className="mb-6 text-sm text-muted">{mode === "connexion" ? "Connectez-vous pour accéder à vos données." : "Créez un compte pour synchroniser vos données entre vos appareils."}</p>

        {!firebaseConfigure && (
          <p className="mb-4 rounded border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            La synchronisation n’est pas encore configurée : renseignez le projet Firebase dans le fichier .env.local (voir les explications de mise en route).
          </p>
        )}

        <div className={`${onglets} mb-4`} role="tablist">
          {(["connexion", "inscription"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setErreur(null);
                setInfo(null);
                setMode(m);
              }}
              className={ongletBouton(mode === m, "flex-1 px-3 py-2.5")}
            >
              {m === "connexion" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        <form onSubmit={envoyer} className={`space-y-3 rounded-lg border bg-surface p-4 shadow-sm ${mode === "connexion" ? "border-border-subtle" : "border-accent-solid/60"}`}>
          <h2 className="text-base font-semibold text-foreground">{mode === "connexion" ? "Connexion" : "Création de compte"}</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={champ} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Mot de passe</label>
            <div className="relative">
              <input
                type={afficher ? "text" : "password"}
                required
                minLength={6}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                className={`${champ} pr-24`}
              />
              <button
                type="button"
                onClick={() => setAfficher((v) => !v)}
                aria-pressed={afficher}
                className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium text-muted hover:text-foreground"
              >
                {afficher ? "🙈 Masquer" : "👁 Afficher"}
              </button>
            </div>
          </div>
          {mode === "connexion" && (
            <button type="button" onClick={motDePasseOublie} disabled={occupe || !firebaseConfigure} className="accent-gradient-text text-xs font-medium underline disabled:opacity-50">
              Mot de passe oublié ?
            </button>
          )}
          {erreur && <p className="text-sm text-danger">{erreur}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          <button type="submit" disabled={occupe || !firebaseConfigure} className="accent-gradient w-full rounded px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50">
            {occupe ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

      </main>
    </div>
  );
}
