"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGymnastes, getMouvements, type Gymnaste, type Mouvement } from "@/lib/data";
import { noteDMax, noteDMouvement } from "@/engine/federal-a";
import { getNiveau } from "@/regulation/loader";
import { AGRES, fmt } from "@/regulation/libelles";
import { carteLigne, lienDegrade, titreSection, vide } from "@/lib/styles";

export default function MouvementsListe() {
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      setGymnastes(await getGymnastes());
      setMouvements(await getMouvements());
      setPret(true);
    })();
  }, []);

  if (!pret) return <main className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">Chargement…</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className={titreSection}>Mouvements</h1>

      {mouvements.length === 0 ? (
        <p className={vide}>
          Aucun mouvement pour l’instant.{" "}
          <Link href="/" className="accent-gradient-text font-medium">
            Ouvrez une gymnaste
          </Link>{" "}
          pour en créer un.
        </p>
      ) : (
        <ul className="space-y-2">
          {mouvements.map((m) => {
            const g = gymnastes.find((x) => x.id === m.gymnasteId);
            return (
              <li key={m.id} className={carteLigne}>
                <Link href={`/mouvement/?m=${m.id}`} className="flex-1">
                  <div className="font-medium text-foreground">{m.nom}</div>
                  <div className="text-xs text-muted">
                    {g ? `${g.prenom} ${g.nom} · ` : ""}
                    {AGRES.find((a) => a.id === m.agres)?.label} · {getNiveau(m.niveau).label} · note D {fmt(noteDMouvement(m))} / {fmt(noteDMax(m.niveau, m.agres))}
                  </div>
                </Link>
                <Link href={`/mouvement/?m=${m.id}`} className={lienDegrade}>
                  Ouvrir →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
