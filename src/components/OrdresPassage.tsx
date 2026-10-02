"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DragHandle from "@/components/DragHandle";
import PartageBouton from "@/components/PartageBouton";
import { useDragReorder } from "@/hooks/useDragReorder";
import {
  getClubs,
  getEquipes,
  getGymnastes,
  getMouvements,
  setOrdrePassage,
  type Club,
  type Equipe,
  type Gymnaste,
  type Mouvement,
} from "@/lib/data";
import { createShare } from "@/lib/shares";
import { noteDMouvement } from "@/engine/federal-a";
import { fmt } from "@/regulation/libelles";
import { getNiveau } from "@/regulation/loader";
import { champ } from "@/lib/styles";
import type { Agres } from "@/regulation/types";

// Dans l'ordre de rotation d'une compétition.
const AGRES: { id: Agres; label: string }[] = [
  { id: "SAUT", label: "Saut" },
  { id: "BARRES", label: "Barres asymétriques" },
  { id: "POUTRE", label: "Poutre" },
  { id: "SOL", label: "Sol" },
];

// Les gymnastes sans ordre enregistré passent à la suite, dans l'ordre de l'équipe.
function ordonner(
  equipe: Equipe,
  membres: Gymnaste[],
  agres: Agres,
): Gymnaste[] {
  const ordre = equipe.ordrePassage?.[agres] ?? [];
  const rang = (g: Gymnaste) => {
    const i = ordre.indexOf(g.id);
    return i < 0 ? Infinity : i;
  };
  return [...membres].sort((a, b) =>
    rang(a) === rang(b) ? 0 : rang(a) < rang(b) ? -1 : 1,
  );
}

function Liste({
  agres,
  membres,
  onReorder,
}: {
  agres: Agres;
  membres: Gymnaste[];
  onReorder: (agres: Agres, ids: string[]) => void;
}) {
  const dnd = useDragReorder(
    membres.map((g) => g.id),
    (ids) => onReorder(agres, ids),
  );
  return (
    <ol className="space-y-1.5">
      {membres.map((g, i) => (
        <li
          key={g.id}
          ref={dnd.registre(g.id)}
          style={dnd.style(g.id)}
          className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm transition"
        >
          <DragHandle {...dnd.poignee(g.id)} />
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <span className="text-foreground">
            {g.prenom} {g.nom}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function OrdresPassage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [choix, setChoix] = useState("");
  const [agres, setAgres] = useState<Agres>(AGRES[0].id);
  const [pret, setPret] = useState(false);

  const charger = useCallback(async () => {
    setClubs(await getClubs());
    setEquipes(await getEquipes());
    setGymnastes(await getGymnastes());
    setMouvements(await getMouvements());
    setPret(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, [charger]);

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
  const ordonnes = selection ? ordonner(selection.equipe, membres, agres) : [];
  const libelle = (a: Agres) => AGRES.find((x) => x.id === a)?.label ?? a;

  async function reordonner(a: Agres, ids: string[]) {
    if (!selection) return;
    await setOrdrePassage(selection.equipe.id, a, ids);
    await charger();
  }

  const pour = (a: Agres) =>
    ordonner(selection!.equipe, membres, a).map((g) => ({
      prenom: g.prenom,
      nom: g.nom,
    }));

  async function partagerAgres() {
    if (!selection) throw new Error("Équipe introuvable");
    const id = await createShare("ordrePassage", {
      club: selection.club,
      equipe: selection.equipe.nom,
      agres,
      agresLabel: libelle(agres),
      gymnastes: pour(agres),
    });
    return `/partage/ordre-passage/?id=${id}`;
  }

  async function partagerTout() {
    if (!selection) throw new Error("Équipe introuvable");
    const id = await createShare("ordresPassage", {
      club: selection.club,
      equipe: selection.equipe.nom,
      agres: AGRES.map((a) => ({
        agres: a.id,
        agresLabel: a.label,
        gymnastes: pour(a.id),
      })),
    });
    return `/partage/ordres-passage/?id=${id}`;
  }

  // Note de départ d'une gymnaste à un agrès : celle de son meilleur mouvement (null si elle n'en a pas).
  const noteDe = (g: Gymnaste, a: Agres): number | null => {
    const notes = mouvements
      .filter((m) => m.gymnasteId === g.id && m.agres === a)
      .map((m) => noteDMouvement(m));
    return notes.length ? Math.max(...notes) : null;
  };
  const totalAgres = (a: Agres) =>
    membres.reduce((t, g) => t + (noteDe(g, a) ?? 0), 0);
  const totalGym = (g: Gymnaste) =>
    AGRES.reduce((t, a) => t + (noteDe(g, a.id) ?? 0), 0);
  const totalEquipe = AGRES.reduce((t, a) => t + totalAgres(a.id), 0);
  const cellule = "px-2 py-1.5 text-right tabular-nums";

  return (
    <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Ordres de passage par équipe
        </h2>

        {!pret ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune équipe trouvée. Crée une équipe depuis l’accueil, en ajoutant
            une gymnaste avec le champ « Équipe ».
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

        {selection && membres.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {AGRES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgres(a.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      agres === a.id
                        ? "border-border-strong bg-surface-alt text-white"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PartageBouton
                  onCreate={partagerAgres}
                  label={`Partager ${libelle(agres)}`}
                />
                <PartageBouton
                  onCreate={partagerTout}
                  label="Partager tous les agrès"
                  className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                />
              </div>
            </div>

            <Liste
              key={`${selection.equipe.id}-${agres}`}
              agres={agres}
              membres={ordonnes}
              onReorder={reordonner}
            />
          </div>
        )}

        {selection && membres.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            Cette équipe n’a pas encore de gymnaste.
          </p>
        )}
      </div>

      <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Notes de départ{selection ? ` · ${selection.equipe.nom}` : ""}
        </h2>
        {!selection ? (
          <p className="text-sm text-muted">
            Sélectionnez une équipe pour voir la note de départ de chaque
            gymnaste à chaque agrès, avec les totaux.
          </p>
        ) : membres.length === 0 ? (
          <p className="text-sm text-muted">
            Cette équipe n’a pas encore de gymnaste.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="px-2 py-1.5 text-left font-semibold">
                    Gymnaste
                  </th>
                  {AGRES.map((a) => (
                    <th
                      key={a.id}
                      className="px-2 py-1.5 text-right font-semibold"
                    >
                      {a.id === "BARRES" ? "Barres" : a.label}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {membres.map((g) => (
                  <tr key={g.id} className="border-t border-border-subtle">
                    <td className="px-2 py-1.5 text-foreground">
                      {g.prenom} {g.nom}
                    </td>
                    {AGRES.map((a) => {
                      const n = noteDe(g, a.id);
                      return (
                        <td
                          key={a.id}
                          className={`${cellule} ${n === null ? "text-muted" : "text-foreground"}`}
                        >
                          {n === null ? "—" : fmt(n)}
                        </td>
                      );
                    })}
                    <td className={`${cellule} font-semibold text-foreground`}>
                      {fmt(totalGym(g))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-strong font-semibold text-foreground">
                  <td className="px-2 py-1.5">Total équipe</td>
                  {AGRES.map((a) => (
                    <td key={a.id} className={cellule}>
                      {fmt(totalAgres(a.id))}
                    </td>
                  ))}
                  <td className={`${cellule} accent-gradient-text`}>
                    {fmt(totalEquipe)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-2 text-[11px] text-muted">
              Note D du meilleur mouvement de chaque gymnaste à chaque agrès ; «
              — » : aucun mouvement créé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
