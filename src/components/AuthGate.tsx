"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseConfigure } from "@/lib/firebase";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Aperçu local sans compte : seulement tant qu'aucun projet Firebase n'est renseigné (sinon la connexion est toujours exigée).
  const publique = pathname.startsWith("/partage/") || (process.env.NEXT_PUBLIC_SKIP_AUTH === "1" && !firebaseConfigure);
  const surConnexion = pathname.startsWith("/connexion/");

  useEffect(() => {
    if (!loading && !user && !publique && !surConnexion) router.replace("/connexion/");
  }, [loading, user, publique, surConnexion, router]);

  if (publique || surConnexion) return <>{children}</>;
  if (loading || !user) return null;
  return <>{children}</>;
}
