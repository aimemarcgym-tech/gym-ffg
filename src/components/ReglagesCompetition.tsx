"use client";

import { useEffect, useMemo, useState } from "react";
import PartageBouton from "@/components/PartageBouton";
import { getClubs, getEquipes, setReglagesEquipe, type Club, type Equipe, type ReglagesCompetition } from "@/lib/data";
import { createShare } from "@/lib/shares";
import { getNiveau } from "@/regulation/loader";
import { btnDegrade, champ } from "@/lib/styles";

const CHAMPS: { cle: keyof ReglagesCompetition; label: string; unite: string; indice: string }[] = [
  { cle: "ecartBarres", label: "Écart des barres asymétriques", unite: "cm", indice: "ex. 150" },
  { cle: "tremplinCm", label: "Tremplin : distance à la table de saut", unite: "cm", indice: "ex. 120" },
  { cle: "tremplinPas", label: "Tremplin : distance à la table de saut", unite: "pas", indice: "ex. 6" },
];

// Réglages du matériel à transmettre à un entraîneur remplaçant : écart des barres, position du tremplin par rapport à la table de saut.
export default function ReglagesCompetition() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [choix, setChoix] = useState("");
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      setClubs(await getClubs());
      setEquipes(await getEquipes());
      setPret(true);
    })();
  }, []);

  const liste = useMemo(
    () =>
      equipes
        .map((e) => ({ equipe: e, club: clubs.find((c) => c.id === e.clubId)?.nom ?? "Sans club" }))
        .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr")),
    [equipes, clubs],
  );
  const selection = liste.find((x) => x.equipe.id === choix);
  const valeurs = selection?.equipe.reglages ?? {};

  async function modifier(cle: keyof ReglagesCompetition, valeur: string) {
    if (!selection) return;
    const id = selection.equipe.id;
    setEquipes((l) => l.map((e) => (e.id === id ? { ...e, reglages: { ...e.reglages, [cle]: valeur } } : e)));
    await setReglagesEquipe(id, { [cle]: valeur });
  }

  async function partager() {
    if (!selection) throw new Error("Équipe introuvable");
    const id = await createShare("reglages", { club: selection.club, equipe: selection.equipe.nom, reglages: valeurs });
    return `/partage/reglages/?id=${id}`;
  }

  return (
    <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Réglages du matériel</h2>

      {!pret ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted">Aucune équipe trouvée. Crée une équipe depuis l’accueil.</p>
      ) : (
        <select value={choix} onChange={(e) => setChoix(e.target.value)} className={champ} aria-label="Équipe">
          <option value="">Sélectionner une équipe…</option>
          {liste.map(({ equipe, club }) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.nom} ({club}) · {getNiveau(equipe.niveau).label}
            </option>
          ))}
        </select>
      )}

      {selection && (
        <div className="mt-4 space-y-3">
          {CHAMPS.map((c) => (
            <label key={c.cle} className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{c.label}</span>
              <span className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valeurs[c.cle] ?? ""}
                  onChange={(e) => modifier(c.cle, e.target.value)}
                  placeholder={c.indice}
                  className={`${champ} max-w-[10rem]`}
                />
                <span className="text-sm text-muted">{c.unite}</span>
              </span>
            </label>
          ))}
          <p className="text-xs text-muted">Enregistré automatiquement pour cette équipe. Le tremplin est mesuré à partir de la table de saut ; il est noté en centimètres et en pas.</p>
          <PartageBouton onCreate={partager} label="Partager à un autre entraîneur" className={btnDegrade} />
        </div>
      )}
    </div>
  );
}
