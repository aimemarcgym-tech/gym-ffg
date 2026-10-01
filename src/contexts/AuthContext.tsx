"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { viderCopieLocale } from "@/lib/data";
import { arreterSync } from "@/lib/sync";

interface AuthValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Adresse e-mail : renvoi du message de confirmation, et relecture de l'état après avoir cliqué sur le lien.
  renvoyerVerification: () => Promise<void>;
  actualiserVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthValue = {
    user,
    loading,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signUp: async (email, password) => {
      const { user: nouveau } = await createUserWithEmailAndPassword(auth, email, password);
      // Le compte est créé même si l'envoi échoue : l'appli reste utilisable, la confirmation peut être renvoyée plus tard.
      await sendEmailVerification(nouveau).catch(() => undefined);
    },
    renvoyerVerification: async () => {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    },
    actualiserVerification: async () => {
      if (!auth.currentUser) return false;
      await auth.currentUser.reload();
      setVersion((v) => v + 1);
      return auth.currentUser.emailVerified;
    },
    signOut: async () => {
      arreterSync();
      viderCopieLocale();
      await fbSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
