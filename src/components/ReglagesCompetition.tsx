"use client";

import { useEffect, useMemo, useState } from "react";
import PartageBouton from "@/components/PartageBouton";
import {
  getClubs,
  getEquipes,
  getGymnastes,
  setReglagesGymnaste,
  type Club,
  type Equipe,
  type Gymnaste,
  type ReglagesCompetition,
} from "@/lib/data";
import { createShare } from "@/lib/shares";
import { getNiveau } from "@/regulation/loader";
import { btnDegrade, champ } from "@/lib/styles";

const CHAMPS: {
  cle: keyof ReglagesCompetition;
  label: string;
  unite: string;
  indice: string;
}[] = [
  { cle: "ecartBarres", label: "Écart des barres", unite: "cm", indice: "150" },
  { cle: "tremplinCm", label: "Tremplin", unite: "cm", indice: "120" },
  { cle: "tremplinPas", label: "Tremplin", unite: "pas", indice: "6" },
];

// Réglages du matériel de chaque gymnaste, à transmettre à un entraîneur remplaçant : écart des barres, position du tremplin
// par rapport à la table de saut (en cm et en pas).
export default function ReglagesCompetition() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [choix, setChoix] = useState("");
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      setClubs(await getClubs());
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setPret(true);
    })();
  }, []);

  const liste = useMemo(
    () =>
      equipes
        .map((e) => ({
          equipe: e,
          club: clubs.find((c) => c.id === e.clubId)?.nom ?? "Sans club",
        }))
        .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr")),
    [equipes, clubs],
  );
  const selection = liste.find((x) => x.equipe.id === choix);
  const membres = selection
    ? selection.equipe.gymnasteIds
        .map((id) => gymnastes.find((g) => g.id === id))
        .filter((g): g is Gymnaste => !!g)
    : [];

  async function modifier(
    g: Gymnaste,
    cle: keyof ReglagesCompetition,
    valeur: string,
  ) {
    setGymnastes((l) =>
      l.map((x) =>
        x.id === g.id
          ? { ...x, reglages: { ...x.reglages, [cle]: valeur } }
          : x,
      ),
    );
    await setReglagesGymnaste(g.id, { [cle]: valeur });
  }

  async function partager() {
    if (!selection) throw new Error("Équipe introuvable");
    const id = await createShare("reglages", {
      club: selection.club,
      equipe: selection.equipe.nom,
      gymnastes: membres.map((g) => ({
        nom: `${g.prenom} ${g.nom}`,
        reglages: g.reglages ?? {},
      })),
    });
    return `/partage/reglages/?id=${id}`;
  }

  return (
    <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Réglages du matériel
      </h2>

      {!pret ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Crée une équipe depuis l’accueil.
        </p>
      ) : (
        <select
          value={choix}
          onChange={(e) => setChoix(e.target.value)}
          className={champ}
          aria-label="Équipe"
        >
          <option value="">Sélectionner une équipe…</option>
          {liste.map(({ equipe, club }) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.nom} ({club}) · {getNiveau(equipe.niveau).label}
            </option>
          ))}
        </select>
      )}

      {selection && membres.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Cette équipe n’a pas encore de gymnaste.
        </p>
      )}

      {selection && membres.length > 0 && (
        <div className="mt-4 space-y-3">
          {membres.map((g) => (
            <div
              key={g.id}
              className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3"
            >
              <div className="mb-2 text-sm font-medium text-foreground">
                {g.prenom} {g.nom}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CHAMPS.map((c) => (
                  <label key={c.cle} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-muted">
                      {c.label} ({c.unite})
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={g.reglages?.[c.cle] ?? ""}
                      onChange={(e) => modifier(g, c.cle, e.target.value)}
                      placeholder={c.indice}
                      aria-label={`${c.label} en ${c.unite} — ${g.prenom} ${g.nom}`}
                      className={`${champ} !px-2 !py-1.5`}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted">
            Enregistré automatiquement pour chaque gymnaste. Le tremplin est
            mesuré à partir de la table de saut ; il est noté en centimètres et
            en pas.
          </p>
          <PartageBouton
            onCreate={partager}
            label="Partager à un autre entraîneur"
            className={btnDegrade}
          />
        </div>
      )}
    </div>
  );
}
