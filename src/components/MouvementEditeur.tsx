"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PanneauAnalyse from "@/components/PanneauAnalyse";
import PanneauBibliotheque from "@/components/PanneauBibliotheque";
import PanneauMouvement from "@/components/PanneauMouvement";
import PanneauReference from "@/components/PanneauReference";
import {
  createInstantane,
  deleteInstantane,
  getGymnaste,
  getInstantanes,
  getMouvement,
  updateMouvement,
  type Gymnaste,
  type Instantane,
  type Mouvement,
  type SerieType,
} from "@/lib/data";
import PartageBouton from "@/components/PartageBouton";
import { createShare } from "@/lib/shares";
import {
  calculerNoteD,
  calculerNoteDSaut,
  etatBonifications,
  noteDMax,
  sautsValides,
  type SautChoisi,
} from "@/engine/federal-a";
import {
  elementsChoisis,
  getElementFedA,
  getElementsNiveau,
  getNiveau,
  niveauxFed,
} from "@/regulation/loader";
import { AGRES, fmt } from "@/regulation/libelles";
import { btnContour, lienDegrade, panneau, titrePanneau } from "@/lib/styles";
import type { Appareil, AgresAvecGrille, NiveauId } from "@/regulation/types";
import { RenommerEnLigne } from "@/components/EnLigne";

const bascule = <T,>(liste: T[], x: T) =>
  liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x];

export default function MouvementEditeur() {
  const [renomme, setRenomme] = useState(false);
  const [etat, setEtat] = useState<"chargement" | "ok" | "introuvable">(
    "chargement",
  );
  const [mouvement, setMouvement] = useState<Mouvement | null>(null);
  const [gymnaste, setGymnaste] = useState<Gymnaste | null>(null);
  const [instantanes, setInstantanes] = useState<Instantane[]>([]);
  const [message, setMessage] = useState("");

  const [nom, setNom] = useState("");
  const [niveauId, setNiveauId] = useState<NiveauId>("A");
  const [ids, setIds] = useState<string[]>([]);
  const [bonifs, setBonifs] = useState<string[]>([]);
  const [sauts, setSauts] = useState<SautChoisi[]>([]);
  const [series, setSeries] = useState<Record<string, SerieType>>({});

  useEffect(() => {
    // Le paramètre d'URL n'est lisible que côté client avec l'export statique.
    const idM = new URLSearchParams(window.location.search).get("m");
    (async () => {
      const m = idM ? await getMouvement(idM) : undefined;
      if (!m) {
        setEtat("introuvable");
        return;
      }
      setMouvement(m);
      setNom(m.nom);
      setNiveauId(m.niveau);
      setIds(m.elementIds);
      setBonifs(m.bonifIds);
      setSauts(m.sauts);
      setSeries(m.series ?? {});
      setGymnaste((await getGymnaste(m.gymnasteId)) ?? null);
      setInstantanes(await getInstantanes(m.id));
      setEtat("ok");
    })();
  }, []);

  useEffect(() => {
    if (etat !== "ok" || !mouvement) return;
    updateMouvement(mouvement.id, {
      nom,
      niveau: niveauId,
      elementIds: ids,
      bonifIds: bonifs,
      sauts,
      series,
    });
  }, [etat, mouvement, nom, niveauId, ids, bonifs, sauts, series]);

  const agres = mouvement?.agres ?? "SOL";
  const grille = agres !== "SAUT";
  const ag = agres as AgresAvecGrille;
  const niveau = getNiveau(niveauId);

  const tous = useMemo(
    () => (grille ? getElementsNiveau(ag, niveauId) : []),
    [grille, ag, niveauId],
  );
  const choisis = useMemo(
    () => elementsChoisis(ids, ag, niveauId),
    [ids, ag, niveauId],
  );
  const sautsNiveau = useMemo(
    () => sautsValides(niveauId, sauts),
    [niveauId, sauts],
  );
  const noteD = grille ? calculerNoteD(ag, ids, bonifs, niveauId) : null;
  const d = grille ? noteD!.total : calculerNoteDSaut(sautsNiveau);
  const etats = grille ? etatBonifications(ag, choisis, niveauId) : [];

  if (etat === "chargement")
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">
        Chargement…
      </main>
    );
  if (etat === "introuvable" || !mouvement) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Mouvement introuvable.</p>
        <Link href="/mouvement/" className={lienDegrade}>
          ← Tous les mouvements
        </Link>
      </main>
    );
  }

  function basculerSaut(idSaut: string, appareil: Appareil) {
    // Deux sauts identiques ou différents sont autorisés : un clic ajoute le saut (même s'il est déjà choisi), la croix du saut le retire.
    setSauts((s) =>
      s.length >= 2
        ? [s[1], { idSaut, appareil }]
        : [...s, { idSaut, appareil }],
    );
  }

  function flash(t: string) {
    setMessage(t);
    setTimeout(() => setMessage(""), 2500);
  }

  async function instantane() {
    const i = await createInstantane({
      mouvementId: mouvement!.id,
      noteD: d,
      elementIds: ids,
      bonifIds: bonifs,
      sauts,
    });
    setInstantanes((l) => [...l, i]);
    flash("Instantané enregistré");
  }

  // Lien public en lecture seule, présenté comme pour les 4 agrès (panneaux Mon mouvement et Analyse).
  async function creerLien() {
    const id = await createShare("mouvements", {
      gymnaste: gymnaste ? `${gymnaste.prenom} ${gymnaste.nom}` : "",
      mouvements: [
        {
          nom,
          agres,
          niveau: niveauId,
          elementIds: ids,
          bonifIds: bonifs,
          sauts,
          series,
        },
      ],
    });
    return `/partage/mouvements/?id=${id}`;
  }

  const retenus = new Set(noteD?.elementsRetenus.map((x) => x.id));
  const libelleAgres = AGRES.find((a) => a.id === agres)!.label;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          {gymnaste && (
            <Link href={`/gymnaste/?g=${gymnaste.id}`} className={lienDegrade}>
              ← {gymnaste.prenom} {gymnaste.nom}
            </Link>
          )}
          <div className="mt-1 flex items-center gap-2">
            {renomme ? (
              <RenommerEnLigne
                valeur={nom}
                onAnnuler={() => setRenomme(false)}
                onOk={(n) => {
                  setNom(n);
                  setRenomme(false);
                }}
              />
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground">{nom}</h1>
                <button
                  onClick={() => setRenomme(true)}
                  className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
                >
                  Renommer
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            {libelleAgres} ·
            <select
              value={niveauId}
              onChange={(ev) => setNiveauId(ev.target.value as NiveauId)}
              aria-label="Niveau"
              className="rounded border border-border-strong bg-surface-alt px-2 py-0.5 text-xs text-foreground focus:border-accent-solid focus:outline-none"
            >
              {niveauxFed.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted">
            {grille
              ? `${choisis.length} élément(s)`
              : `${sautsNiveau.length} saut(s)`}
            <span className="ml-3 text-xs">· ✓ Enregistré automatiquement</span>
            {message && (
              <span className="ml-3 text-xs text-accent-solid">{message}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PartageBouton onCreate={creerLien} className={btnContour} />
            <button
              onClick={instantane}
              className={btnContour}
              title="Enregistre une version datée dans l’historique de progression (la séquence, elle, est déjà sauvegardée automatiquement)"
            >
              Enregistrer un instantané (historique)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_1fr_1fr_0.9fr]">
          <div className="space-y-6">
            <PanneauMouvement
              elements={choisis}
              retenus={retenus}
              sauts={sautsNiveau}
              onRetirer={(cle) => setIds((l) => l.filter((x) => x !== cle))}
              series={series}
              sansSeries={agres === "BARRES"}
              onSerie={(cle, type) =>
                setSeries((s) => {
                  const suite = { ...s };
                  if (type) suite[cle] = type;
                  else delete suite[cle];
                  return suite;
                })
              }
              onRetirerSaut={(s) => setSauts((l) => l.filter((x) => x !== s))}
              onReordonner={setIds}
            />
            {instantanes.length > 0 && (
              <section className={panneau}>
                <h2 className={titrePanneau}>Historique</h2>
                <ul className="space-y-1.5">
                  {[...instantanes].reverse().map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-2 rounded border border-border-subtle bg-surface-alt px-3 py-2 text-xs"
                    >
                      <span className="flex-1 text-muted">
                        {new Date(i.date).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · D {fmt(i.noteD)}
                      </span>
                      <button
                        onClick={() => {
                          setIds(i.elementIds);
                          setBonifs(i.bonifIds);
                          setSauts(i.sauts);
                          flash("Instantané restauré");
                        }}
                        className="accent-gradient-text underline"
                      >
                        Restaurer
                      </button>
                      <button
                        onClick={async () => {
                          await deleteInstantane(i.id);
                          setInstantanes((l) => l.filter((x) => x.id !== i.id));
                        }}
                        aria-label="Supprimer l’instantané"
                        className="text-muted hover:text-danger"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <PanneauAnalyse
            agres={agres}
            niveau={niveau}
            nbElements={choisis.length}
            noteD={noteD}
            etats={etats}
            bonifsRetenues={noteD?.bonifsRetenues ?? []}
            onBonif={(id) => setBonifs((l) => bascule(l, id))}
            nbSauts={sautsNiveau.length}
            d={d}
            dMax={noteDMax(niveauId, agres)}
          />

          <PanneauBibliotheque
            agres={agres}
            elements={tous}
            choisis={choisis}
            gymnaste={gymnaste}
            niveauId={niveauId}
            sauts={sautsNiveau}
            onBasculer={(id) =>
              setIds((l) => {
                // Un élément doublable se choisit une fois, puis une seconde ; un troisième clic le retire.
                if (!getElementFedA(id)?.doublable) return bascule(l, id);
                const n = l.filter((x) => x.split("#")[0] === id).length;
                // Éléments en série : un clic ajoute deux cases séparées d'un coup ; un nouveau clic retire les deux.
                if (
                  getElementFedA(id)?.extraFamilles?.includes("ELEMENTS_SERIE")
                )
                  return n === 0
                    ? [...l, id, `${id}#2`]
                    : l.filter((x) => x.split("#")[0] !== id);
                if (n === 0) return [...l, id];
                if (n === 1) return [...l, `${id}#2`];
                return l.filter((x) => x.split("#")[0] !== id);
              })
            }
            onBasculerSaut={basculerSaut}
          />

          <PanneauReference
            agres={agres}
            niveau={niveau.label}
            niveauId={niveauId}
          />
        </div>
      </main>
    </div>
  );
}
