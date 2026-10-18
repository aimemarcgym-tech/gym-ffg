"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EquipeEditeur, { type CibleEquipe } from "@/components/EquipeEditeur";
import ProfilEditeur, { type ProfilModifie } from "@/components/ProfilEditeur";
import ProfilTechnique from "@/components/ProfilTechnique";
import {
  createEquipe,
  createMouvement,
  deleteMouvement,
  findOrCreateClub,
  getClubs,
  getEquipes,
  getIndividuelles,
  getGymnaste,
  getMouvements,
  instantanesPourPartage,
  setCompetence,
  setEquipeMembres,
  updateGymnaste,
  type Club,
  type Equipe,
  type Individuelle,
  type Gymnaste,
  type Mouvement,
  type StatutCompetence,
} from "@/lib/data";
import { noteDMax, noteDMouvement } from "@/engine/federal-a";
import {
  ageEnSaison,
  getCategorie,
  getNiveau,
  niveauxMouvement,
  niveauxPerf79Autorises,
  estPerf79,
} from "@/regulation/loader";
import { AGRES, fmt } from "@/regulation/libelles";
import {
  btnDanger,
  btnDegrade,
  carteLigne,
  champLibre,
  etiquette,
  lienDegrade,
} from "@/lib/styles";
import type { Agres, NiveauId } from "@/regulation/types";
import { ConfirmerEnLigne } from "@/components/EnLigne";
import PartageBouton from "@/components/PartageBouton";
import { createShare } from "@/lib/shares";

export default function FicheGymnaste() {
  const [supprId, setSupprId] = useState<string | null>(null);
  const router = useRouter();
  const [gymnaste, setGymnaste] = useState<Gymnaste | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipesClub, setEquipesClub] = useState<Equipe[]>([]);
  // Éditeur ouvert sous l'en-tête : le profil, ou l'équipe d'un tag (null = pas d'équipe pour l'instant).
  const [edition, setEdition] = useState<
    { type: "profil" } | { type: "equipe"; equipeId: string | null } | null
  >(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [individuelles, setIndividuelles] = useState<Individuelle[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [etat, setEtat] = useState<"chargement" | "ok" | "introuvable">(
    "chargement",
  );

  const [nom, setNom] = useState("");
  const [agres, setAgres] = useState<Agres>("SOL");
  const [niveau, setNiveau] = useState<NiveauId>("A");
  // Pour qui est le nouveau mouvement : l'équipe ("equipe") ou l'une des individuelles (son id).
  const [pour, setPour] = useState("equipe");

  const charger = useCallback(async () => {
    // Le paramètre d'URL n'est lisible que côté client avec l'export statique.
    const id = new URLSearchParams(window.location.search).get("g");
    const g = id ? await getGymnaste(id) : undefined;
    if (!g) {
      setEtat("introuvable");
      return;
    }
    setGymnaste(g);
    const tousLesClubs = await getClubs();
    setClubs(tousLesClubs);
    setClub(tousLesClubs.find((c) => c.id === g.clubId) ?? null);
    const duClub = await getEquipes(g.clubId);
    setEquipesClub(duClub);
    const siennes = duClub.filter((e) => e.gymnasteIds.includes(g.id));
    setEquipes(siennes);
    const sesIndividuelles = (await getIndividuelles(g.clubId)).filter(
      (i) => i.gymnasteId === g.id,
    );
    setIndividuelles(sesIndividuelles);
    // Équipes et individuelles : même logique pour les niveaux de mouvement. Performance 7-9 ans : P1 à P4 (P79 est le niveau de l'équipe).
    const contextes = [...siennes, ...sesIndividuelles];
    setNiveau((n) =>
      contextes.length && !contextes.some((e) => e.niveau === n)
        ? estPerf79(contextes[0].niveau)
          ? "P1"
          : contextes[0].niveau
        : n,
    );
    setMouvements(await getMouvements(g.id, true));
    setEtat("ok");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, [charger]);

  if (etat === "chargement") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">
        Chargement…
      </main>
    );
  }
  if (etat === "introuvable" || !gymnaste) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Gymnaste introuvable.</p>
        <Link href="/" className={lienDegrade}>
          ← Toutes les gymnastes
        </Link>
      </main>
    );
  }

  // Niveaux proposés : ceux de Performance 7-9 ans si la gymnaste est dans une équipe de ce programme, sinon les niveaux Fédéral.
  // Les équipes et les individuelles de la gymnaste comptent de la même façon : on propose les niveaux de chacun de ces programmes.
  const pourIndiv =
    individuelles.find((i) => i.id === pour) ??
    (equipes.length === 0 ? individuelles[0] : undefined);
  const contextes = pourIndiv
    ? [pourIndiv]
    : [...equipes, ...(equipes.length === 0 ? individuelles : [])];
  const perf79 = contextes.find((e) => estPerf79(e.niveau));
  const enPF = contextes.some((e) => getNiveau(e.niveau).programme === "PF");
  const enFederal = contextes.some(
    (e) => !estPerf79(e.niveau) && getNiveau(e.niveau).programme !== "PF",
  );
  const niveauxChoix = [
    ...(contextes.length === 0 || enFederal
      ? niveauxMouvement.filter((n) => !estPerf79(n.id) && n.programme !== "PF")
      : []),
    ...(perf79
      ? niveauxPerf79Autorises(
          agres,
          ageEnSaison(gymnaste.anneeNaissance),
          perf79.categorieId,
        ).map((id) => getNiveau(id))
      : []),
    ...(enPF ? niveauxMouvement.filter((n) => n.programme === "PF") : []),
  ];
  const niveauEffectif = niveauxChoix.some((n) => n.id === niveau)
    ? niveau
    : niveauxChoix[0].id;
  const libelleAgres = AGRES.find((a) => a.id === agres)!.label;
  const nomParDefaut = `${libelleAgres} — compétition ${mouvements.filter((m) => m.agres === agres).length + 1}`;

  async function creer(e: FormEvent) {
    e.preventDefault();
    const m = await createMouvement({
      gymnasteId: gymnaste!.id,
      nom: nom.trim() || nomParDefaut,
      agres,
      niveau: niveauEffectif,
      individuelleId: pourIndiv?.id,
    });
    router.push(`/mouvement/?m=${m.id}`);
  }

  // Lien public en lecture seule : les mouvements de la gymnaste, dans l'ordre Saut, Barres, Poutre, Sol.
  async function partagerMouvements() {
    const g = gymnaste!;
    const ordre = AGRES.map((a) => a.id);
    const liste = mouvements
      .filter((m) => !m.individuelleId)
      .sort((a, b) => ordre.indexOf(a.agres) - ordre.indexOf(b.agres));
    const id = await createShare("mouvements", {
      gymnaste: `${g.prenom} ${g.nom}`,
      mouvements: await Promise.all(
        liste.map(async (m) => ({
          nom: m.nom,
          agres: m.agres,
          niveau: m.niveau,
          elementIds: m.elementIds,
          bonifIds: m.bonifIds,
          sauts: m.sauts,
          series: m.series,
          instantanes: await instantanesPourPartage(m.id),
        })),
      ),
    });
    return `/partage/mouvements/?id=${id}`;
  }

  async function enregistrerProfil(v: ProfilModifie) {
    const g = gymnaste!;
    let clubId = g.clubId;
    if (v.clubNom.toLowerCase() !== (club?.nom ?? "").toLowerCase()) {
      clubId = (await findOrCreateClub(v.clubNom)).id;
      // Les équipes appartiennent à un club : changer de club détache la gymnaste de ses équipes.
      for (const e of equipes)
        await setEquipeMembres(
          e.id,
          e.gymnasteIds.filter((x) => x !== g.id),
        );
    }
    await updateGymnaste(g.id, {
      prenom: v.prenom,
      nom: v.nom,
      anneeNaissance: v.anneeNaissance,
      clubId,
    });
    setEdition(null);
    await charger();
  }

  async function enregistrerEquipe(
    actuelle: Equipe | null,
    cible: CibleEquipe,
  ) {
    const g = gymnaste!;
    if (cible.type === "existante" && cible.equipeId === actuelle?.id) {
      setEdition(null);
      return;
    }
    if (actuelle)
      await setEquipeMembres(
        actuelle.id,
        actuelle.gymnasteIds.filter((x) => x !== g.id),
      );
    if (cible.type === "existante") {
      const t = equipesClub.find((e) => e.id === cible.equipeId);
      if (t)
        await setEquipeMembres(t.id, [
          ...t.gymnasteIds.filter((x) => x !== g.id),
          g.id,
        ]);
    } else if (cible.type === "nouvelle") {
      const t = await createEquipe({
        clubId: g.clubId,
        nom: cible.nom,
        niveau: cible.niveau,
        categorieId: cible.categorieId,
      });
      await setEquipeMembres(t.id, [g.id]);
    }
    setEdition(null);
    await charger();
  }

  async function changerStatut(
    elementId: string,
    statut: StatutCompetence | null,
  ) {
    await setCompetence(gymnaste!.id, elementId, statut);
    setGymnaste(await getGymnaste(gymnaste!.id).then((g) => g ?? gymnaste));
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <Link href="/" className={lienDegrade}>
            ← Toutes les gymnastes
          </Link>
          <button
            onClick={() =>
              setEdition(edition?.type === "profil" ? null : { type: "profil" })
            }
            title="Modifier le profil"
            className="group mt-1 block text-left"
          >
            <h1 className="text-xl font-bold text-foreground group-hover:underline">
              {gymnaste.prenom} {gymnaste.nom}
            </h1>
            <p className="text-sm text-muted">
              {club?.nom ?? "Aucun club"} ·{" "}
              {ageEnSaison(gymnaste.anneeNaissance)} ans · née en{" "}
              {gymnaste.anneeNaissance}
            </p>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {(equipes.length
              ? equipes.map((e) => ({
                  e,
                  cle: e.id,
                  texte: `${getNiveau(e.niveau).label} · ${e.nom}`,
                }))
              : [
                  {
                    e: null as Equipe | null,
                    cle: "aucune",
                    texte: "Sans équipe",
                  },
                ]
            ).map((t) => (
              <button
                key={t.cle}
                onClick={() =>
                  setEdition(
                    edition?.type === "equipe" &&
                      edition.equipeId === (t.e?.id ?? null)
                      ? null
                      : { type: "equipe", equipeId: t.e?.id ?? null },
                  )
                }
                title="Changer le niveau ou l’équipe"
                className="rounded-full border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                {t.texte}
              </button>
            ))}
            {individuelles.map((i) => (
              <span
                key={i.id}
                title="Modifiable depuis l’accueil, dans Individuelles"
                className="rounded-full border border-accent-solid/40 bg-accent-from/10 px-2 py-0.5 text-xs text-foreground"
              >
                Individuelle · {getNiveau(i.niveau).label} ·{" "}
                {getCategorie(i.niveau, i.categorieId)?.label ?? ""}
              </span>
            ))}
          </div>

          {edition?.type === "profil" && (
            <ProfilEditeur
              key="profil"
              gymnaste={gymnaste}
              club={club}
              clubs={clubs}
              onEnregistrer={enregistrerProfil}
              onAnnuler={() => setEdition(null)}
            />
          )}
          {edition?.type === "equipe" &&
            (() => {
              const actuelle =
                equipes.find((e) => e.id === edition.equipeId) ?? null;
              return (
                <EquipeEditeur
                  key={edition.equipeId ?? "aucune"}
                  actuelle={actuelle}
                  equipesClub={equipesClub}
                  autresEquipesIds={equipes
                    .filter((e) => e.id !== actuelle?.id)
                    .map((e) => e.id)}
                  onEnregistrer={(c) => enregistrerEquipe(actuelle, c)}
                  onAnnuler={() => setEdition(null)}
                />
              );
            })()}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              Mouvements
            </h2>
            {mouvements.length > 0 && (
              <PartageBouton
                label="Partager les 4 agrès"
                onCreate={partagerMouvements}
                className={btnDegrade}
              />
            )}
          </div>

          {mouvements.length > 0 && (
            <ul className="mb-4 space-y-2">
              {mouvements.map((m) => (
                <li key={m.id} className={carteLigne}>
                  <Link href={`/mouvement/?m=${m.id}`} className="flex-1">
                    <div className="font-medium text-foreground">{m.nom}</div>
                    <div className="text-xs text-muted">
                      {AGRES.find((a) => a.id === m.agres)?.label} ·{" "}
                      {getNiveau(m.niveau).label} · note D{" "}
                      {fmt(noteDMouvement(m))} /{" "}
                      {fmt(noteDMax(m.niveau, m.agres))}
                      {m.individuelleId && " · individuelle"}
                    </div>
                  </Link>
                  {supprId === m.id ? (
                    <ConfirmerEnLigne
                      question={`Supprimer « ${m.nom} » ?`}
                      onAnnuler={() => setSupprId(null)}
                      onConfirmer={async () => {
                        await deleteMouvement(m.id);
                        setMouvements((l) => l.filter((x) => x.id !== m.id));
                        setSupprId(null);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/mouvement/?m=${m.id}`}
                        className={lienDegrade}
                      >
                        Ouvrir →
                      </Link>
                      <button
                        onClick={() => setSupprId(m.id)}
                        className={btnDanger}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={creer}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-4"
          >
            <div>
              <label className={etiquette}>Nom du mouvement</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={nomParDefaut}
                className={champLibre}
              />
            </div>
            {individuelles.length > 0 && (
              <div>
                <label className={etiquette}>Pour</label>
                <select
                  value={pourIndiv?.id ?? "equipe"}
                  onChange={(e) => setPour(e.target.value)}
                  className={champLibre}
                >
                  {equipes.length > 0 && <option value="equipe">Équipe</option>}
                  {individuelles.map((i) => (
                    <option key={i.id} value={i.id}>
                      Individuelle · {getNiveau(i.niveau).label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={etiquette}>Agrès</label>
              <select
                value={agres}
                onChange={(e) => setAgres(e.target.value as Agres)}
                className={champLibre}
              >
                {AGRES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={etiquette}>Niveau</label>
              <select
                value={niveauEffectif}
                onChange={(e) => setNiveau(e.target.value as NiveauId)}
                className={champLibre}
              >
                {niveauxChoix.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={btnDegrade}>
              Nouveau mouvement
            </button>
          </form>
        </section>

        <ProfilTechnique gymnaste={gymnaste} onChanger={changerStatut} />
      </main>
    </div>
  );
}
