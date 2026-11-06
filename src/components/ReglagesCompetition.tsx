"use client";

import { useEffect, useMemo, useState } from "react";
import PartageBouton from "@/components/PartageBouton";
import {
  getClubs,
  getEquipes,
  getGymnastes,
  getIndividuelles,
  setReglagesEquipe,
  setReglagesGymnaste,
  type Club,
  type Equipe,
  type Gymnaste,
  type Individuelle,
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
  const [individuelles, setIndividuelles] = useState<Individuelle[]>([]);
  const [choix, setChoix] = useState("");
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      setClubs(await getClubs());
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setIndividuelles(await getIndividuelles());
      setPret(true);
    })();
  }, []);

  // Équipes, puis individuelles (valeur « i:<id> ») : une individuelle ne montre que la carte de la gymnaste.
  const liste = useMemo(() => {
    const nomClub = (id: string) =>
      clubs.find((c) => c.id === id)?.nom ?? "Sans club";
    const eq = equipes
      .map((e) => ({ equipe: e, club: nomClub(e.clubId), indiv: false }))
      .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr"));
    const ind = individuelles
      .map((i) => {
        const g = gymnastes.find((x) => x.id === i.gymnasteId);
        if (!g) return null;
        const equipe: Equipe = {
          id: `i:${i.id}`,
          clubId: i.clubId,
          nom: `Individuelle · ${g.prenom} ${g.nom}`,
          niveau: i.niveau,
          categorieId: i.categorieId,
          gymnasteIds: [g.id],
        };
        return { equipe, club: nomClub(i.clubId), indiv: true };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr"));
    return [...eq, ...ind];
  }, [equipes, individuelles, gymnastes, clubs]);
  const selection = liste.find((x) => x.equipe.id === choix);
  const estIndiv = !!selection?.indiv;
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

  // Réglages de la carte « Toute l'équipe » : propres à l'équipe, sans toucher à ceux des gymnastes.
  const reglagesEquipe = selection?.equipe.reglages ?? {};
  const rempli = (r?: ReglagesCompetition) =>
    !!r && Object.values(r).some((v) => v);

  async function modifierEquipe(
    cle: keyof ReglagesCompetition,
    valeur: string,
  ) {
    if (!selection) return;
    const id = selection.equipe.id;
    setEquipes((l) =>
      l.map((e) =>
        e.id === id ? { ...e, reglages: { ...e.reglages, [cle]: valeur } } : e,
      ),
    );
    await setReglagesEquipe(id, { [cle]: valeur });
  }

  async function partager() {
    if (!selection) throw new Error("Équipe introuvable");
    // Le lien contient la carte « Toute l'équipe » si elle est remplie, puis seulement les gymnastes dont au moins une case est remplie.
    const remplies = membres.filter((g) => rempli(g.reglages));
    const id = await createShare("reglages", {
      club: selection.club,
      equipe: selection.equipe.nom,
      equipeEntiere:
        !estIndiv && (rempli(reglagesEquipe) || remplies.length === 0)
          ? reglagesEquipe
          : undefined,
      gymnastes: remplies.map((g) => ({
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
          <option value="">Sélectionner une équipe ou une individuelle…</option>
          <optgroup label="Équipes">
            {liste
              .filter((x) => !x.indiv)
              .map(({ equipe, club }) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nom} ({club}) · {getNiveau(equipe.niveau).label}
                </option>
              ))}
          </optgroup>
          {liste.some((x) => x.indiv) && (
            <optgroup label="Individuelles">
              {liste
                .filter((x) => x.indiv)
                .map(({ equipe, club }) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nom.replace("Individuelle · ", "")} ({club}) ·{" "}
                    {getNiveau(equipe.niveau).label}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      )}

      {selection && membres.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Cette équipe n’a pas encore de gymnaste.
        </p>
      )}

      {selection && membres.length > 0 && (
        <div className="mt-4 space-y-3">
          {!estIndiv && (
            <div className="rounded-lg border border-accent-from/60 bg-accent-from/15 p-4">
              <div className="mb-3 text-base font-medium text-foreground">
                Toute l’équipe
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CHAMPS.map((c) => (
                  <label key={c.cle} className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      {c.label} ({c.unite})
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={reglagesEquipe[c.cle] ?? ""}
                      onChange={(e) => modifierEquipe(c.cle, e.target.value)}
                      placeholder={c.indice}
                      aria-label={`${c.label} en ${c.unite} — toute l’équipe`}
                      className={`${champ} !py-2.5`}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Une valeur saisie ici est appliquée à toutes les gymnastes ; tu
                peux ensuite l’ajuster pour l’une d’elles.
              </p>
            </div>
          )}
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
