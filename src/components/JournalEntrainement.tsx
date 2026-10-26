"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import PartageBouton from "@/components/PartageBouton";
import { addSeance, deleteSeance, getClubs, getEquipes, getGymnastes, getSeances, getSuivis, updateSeance, type Club, type Equipe, type Gymnaste, type Seance, type Suivi, type TypeProgramme } from "@/lib/data";
import { Tableau } from "@/components/SuiviElements";
import ContenuSeance, { EditeurSeance } from "@/components/ContenuSeance";
import { AGRES } from "@/regulation/libelles";
import { formatTaille } from "@/lib/format";
import { compresserPdf } from "@/lib/compresserPdf";
import { createShare } from "@/lib/shares";

type Cible = Seance["cible"];

// Tant que les liens sont encodés dans l'adresse (pas de serveur), on borne leur taille ; avec Firestore ces limites sautent.
const LIMITE_LIEN = 880_000;
const LIMITE_PJ = 600_000;
// Au-dessus de ce poids, un PDF est recompressé automatiquement avant d'être joint.
const SEUIL_COMPRESSION = 250_000;

function dateLisible(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Copie d'un tableau limitée aux lignes (éléments) choisies, avec leurs cases.
function garder(t: Suivi, ids: string[]): Suivi {
  const lignes = t.lignes.filter((l) => ids.includes(l.id));
  const cases = Object.fromEntries(Object.entries(t.cases).filter(([cle]) => lignes.some((l) => cle.startsWith(`${l.id}|`)))) as Suivi["cases"];
  return { ...t, lignes, cases };
}

function Formulaire({
  date,
  contenu,
  onDate,
  onContenu,
  onSubmit,
  variante,
  occupe,
  onCancel,
  disponibles,
  selection,
  onSelection,
  marquerEquipe,
}: {
  date: string;
  contenu: string;
  onDate: (v: string) => void;
  onContenu: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  variante: "add" | "edit";
  occupe?: boolean;
  onCancel?: () => void;
  // Tableaux de suivi qu'on peut joindre à la séance, et ceux qui le sont (par identifiant).
  disponibles: Suivi[];
  // Tableaux joints : identifiant du tableau → identifiants des lignes (éléments) choisies. Absent = tableau non joint.
  selection: Record<string, string[]>;
  onSelection: (s: Record<string, string[]>) => void;
  // Séance d'une gymnaste : on distingue les tableaux d'équipe de ses propres tableaux.
  marquerEquipe?: boolean;
}) {
  const champDate = (
    <input
      type="date"
      value={date}
      onChange={(e) => onDate(e.target.value)}
      className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none"
    />
  );
  const zone = <EditeurSeance valeur={contenu} onChange={onContenu} placeholder={variante === "add" ? "Exercices, objectifs, remarques pour cette séance…" : undefined} />;
  const tableauxChamp =
    disponibles.length > 0 ? (
      <fieldset className="rounded border border-border-subtle p-2">
        <legend className="px-1 text-xs text-muted">Joindre des tableaux de suivi (facultatif)</legend>
        <div className="space-y-2">
          {disponibles.map((t) => {
            const choisies = selection[t.id];
            const joint = choisies !== undefined;
            return (
              <div key={t.id}>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={joint}
                    onChange={(e) => {
                      const reste = { ...selection };
                      if (e.target.checked) reste[t.id] = t.lignes.map((l) => l.id);
                      else delete reste[t.id];
                      onSelection(reste);
                    }}
                  />
                  {marquerEquipe && t.cible.genre === "equipe" ? "Équipe · " : ""}
                  {AGRES.find((a) => a.id === t.agres)?.label} ({t.lignes.length} élément{t.lignes.length > 1 ? "s" : ""})
                </label>
                {joint && t.lignes.length > 1 && (
                  <div className="mt-1 ml-5 flex flex-wrap gap-x-4 gap-y-1">
                    {t.lignes.map((l) => (
                      <label key={l.id} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={choisies.includes(l.id)}
                          onChange={(e) => {
                            const ids = e.target.checked ? [...choisies, l.id] : choisies.filter((x) => x !== l.id);
                            const reste = { ...selection };
                            if (ids.length === 0) delete reste[t.id];
                            else reste[t.id] = ids;
                            onSelection(reste);
                          }}
                        />
                        {l.libelle}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
    ) : null;
  if (variante === "add") {
    return (
      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {champDate}
          <button type="submit" disabled={occupe || !contenu.trim()} className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {occupe ? "…" : "Ajouter la séance"}
          </button>
        </div>
        {zone}
        {tableauxChamp}
      </form>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {champDate}
      {zone}
      {tableauxChamp}
      <div className="flex gap-2">
        <button type="submit" className="accent-gradient-text text-xs font-medium underline">
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-foreground">
          Annuler
        </button>
      </div>
    </form>
  );
}

function Journal({ cible, libelle, type, seanceUnique, onSortir, listeMasquee }: { cible: Cible; libelle: string; type: TypeProgramme; seanceUnique?: string | null; onSortir?: () => void; listeMasquee?: boolean }) {
  const [seances, setSeances] = useState<Seance[] | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contenu, setContenu] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [ajoutee, setAjoutee] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);
  const [dateEdition, setDateEdition] = useState("");
  const [contenuEdition, setContenuEdition] = useState("");
  const [piece, setPiece] = useState<File | null>(null);
  const [erreurPiece, setErreurPiece] = useState<string | null>(null);
  // Compression d'un PDF : message en cours, et fichier d'origine si on veut le garder tel quel.
  const [infoPiece, setInfoPiece] = useState<string | null>(null);
  const [pieceOriginale, setPieceOriginale] = useState<File | null>(null);
  // Tableaux de suivi de cette équipe ou gymnaste (au moins une ligne) et colonnes à afficher.
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [membres, setMembres] = useState<Gymnaste[]>([]);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [selectionEdition, setSelectionEdition] = useState<Record<string, string[]>>({});

  function charger() {
    getSeances(cible, type).then(setSeances);
    (async () => {
      const tous = await getSuivis();
      const gs = await getGymnastes();
      const equipesDeLaGym = cible.genre === "gymnaste" ? (await getEquipes()).filter((e) => e.gymnasteIds.includes(cible.id)).map((e) => e.id) : [];
      // Pour une gymnaste : ses propres tableaux et ceux de ses équipes (seule sa colonne est alors affichée).
      setSuivis(
        tous.filter(
          (t) =>
            t.lignes.length > 0 &&
            ((t.cible.genre === cible.genre && t.cible.id === cible.id) || (t.cible.genre === "equipe" && equipesDeLaGym.includes(t.cible.id))),
        ),
      );
      if (cible.genre === "equipe") {
        const e = (await getEquipes()).find((x) => x.id === cible.id);
        setMembres((e?.gymnasteIds ?? []).map((id) => gs.find((g) => g.id === id)).filter((g): g is Gymnaste => !!g));
      } else {
        setMembres(gs.filter((g) => g.id === cible.id));
      }
    })();
  }

  // Élément envoyé depuis la bibliothèque du suivi : il s'ajoute au texte de la séance en construction, avec sa valeur.
  useEffect(() => {
    if (seanceUnique) return;
    const ajouterTexte = (e: Event) => {
      const detail = (e as CustomEvent<{ texte: string; pris: boolean }>).detail;
      setContenu((t) => (t.trim() ? `${t.replace(/\s+$/, "")}
${detail.texte}` : detail.texte));
      detail.pris = true;
    };
    window.addEventListener("ffg:ajout-seance", ajouterTexte);
    return () => window.removeEventListener("ffg:ajout-seance", ajouterTexte);
  }, [seanceUnique]);

  useEffect(() => {
    charger();
    // Un tableau créé ou modifié ailleurs sur la page (ou depuis un autre appareil) apparaît ici sans recharger.
    window.addEventListener("ffg:suivi", charger);
    window.addEventListener("ffg:distant", charger);
    return () => {
      window.removeEventListener("ffg:suivi", charger);
      window.removeEventListener("ffg:distant", charger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible.genre, cible.id, type]);

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setOccupe(true);
    try {
      await addSeance(cible, type, date, contenu.trim(), suivis.filter((t) => t.id in selection).map((t) => garder(t, selection[t.id])));
      setContenu("");
      setSelection({});
      setAjoutee(true);
      setTimeout(() => setAjoutee(false), 3000);
      charger();
    } finally {
      setOccupe(false);
    }
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (edition && contenuEdition.trim()) {
      // Un tableau déjà joint garde l'état où il a été joint ; un nouveau est copié tel qu'il est maintenant.
      const dejaJoints = seances?.find((x) => x.id === edition)?.tableaux ?? [];
      const tableaux = Object.keys(selectionEdition).flatMap((id) => {
        const source = dejaJoints.find((d) => d.id === id) ?? suivis.find((t) => t.id === id);
        return source ? [garder(source, selectionEdition[id])] : [];
      });
      await updateSeance(edition, dateEdition, contenuEdition.trim(), tableaux);
      setEdition(null);
      charger();
    }
  }

  async function supprimer(id: string) {
    await deleteSeance(id);
    charger();
  }

  async function choisirPiece(fichier: File | null) {
    if (!fichier) return;
    setErreurPiece(null);
    setInfoPiece(null);
    setPieceOriginale(null);
    const estPdf = fichier.type === "application/pdf" || /\.pdf$/i.test(fichier.name);
    if (estPdf && fichier.size > SEUIL_COMPRESSION) {
      setInfoPiece(`Compression de « ${fichier.name} » (${formatTaille(fichier.size)})…`);
      try {
        const r = await compresserPdf(fichier, SEUIL_COMPRESSION);
        if (r.apres < r.avant) {
          if (r.apres > LIMITE_PJ) {
            setInfoPiece(null);
            setErreurPiece(`« ${fichier.name} » fait encore ${formatTaille(r.apres)} après compression, c'est trop volumineux pour être joint au lien (max ${formatTaille(LIMITE_PJ)}).`);
            return;
          }
          setPiece(r.fichier);
          if (fichier.size <= LIMITE_PJ) setPieceOriginale(fichier);
          setInfoPiece(`PDF compressé : ${formatTaille(r.avant)} → ${formatTaille(r.apres)} (le texte n'est plus sélectionnable).`);
          return;
        }
      } catch {
        // Compression impossible : on continue avec le fichier d'origine si sa taille le permet.
      }
      setInfoPiece(null);
    }
    if (fichier.size > LIMITE_PJ) {
      setErreurPiece(`« ${fichier.name} » fait ${formatTaille(fichier.size)}, c'est trop volumineux pour être joint au lien (max ${formatTaille(LIMITE_PJ)}).`);
      return;
    }
    setPiece(fichier);
  }

  async function creerLien(): Promise<string> {
    const pieceJointe = piece
      ? {
          fileName: piece.name,
          mimeType: piece.type || "application/octet-stream",
          dataBase64: await new Promise<string>((resolve, reject) => {
            const l = new FileReader();
            l.onload = () => {
              const t = String(l.result);
              resolve(t.slice(t.indexOf(",") + 1));
            };
            l.onerror = () => reject(l.error);
            l.readAsDataURL(piece);
          }),
        }
      : undefined;
    const data = { targetLabel: libelle, programType: type, sessions: (seances ?? []).filter((x) => !seanceUnique || x.id === seanceUnique).map((x) => ({
        date: x.date,
        content: x.contenu,
        // Tableaux joints, avec les noms des gymnastes en colonnes : le lien se suffit à lui-même.
        ...(x.tableaux?.length
          ? {
              tables: x.tableaux.map((t) => ({
                agres: AGRES.find((a) => a.id === t.agres)?.label ?? t.agres,
                colonnes: membres.map((g) => `${g.prenom} ${g.nom.charAt(0)}.`),
                lignes: t.lignes.map((l) => ({ libelle: l.libelle, etats: membres.map((g) => t.cases[`${l.id}|${g.id}`] ?? null) })),
              })),
            }
          : {}),
      })), ...(pieceJointe ? { attachment: pieceJointe } : {}) };
    const taille = new Blob([JSON.stringify(data)]).size;
    if (taille > LIMITE_LIEN) {
      throw new Error(`Le lien serait trop volumineux (${formatTaille(taille)}, max ~${formatTaille(LIMITE_LIEN)}) — retirez la pièce jointe ou raccourcissez l'historique des séances.`);
    }
    const id = await createShare("programme", data);
    return `/partage/programme/?id=${id}`;
  }

  return (
    <div className="mt-4 rounded-lg border border-border-subtle bg-surface-alt/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-solid/60">
          📎 {piece ? piece.name : "Joindre un document (PDF…)"}
          <input
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              choisirPiece(f);
            }}
            className="hidden"
          />
        </label>
        {piece && (
          <button type="button" onClick={() => { setPiece(null); setInfoPiece(null); setPieceOriginale(null); }} className="text-xs text-muted hover:text-foreground">
            Retirer
          </button>
        )}
        <PartageBouton onCreate={creerLien} />
      </div>
      {erreurPiece && <p className="mb-3 text-right text-xs text-danger">{erreurPiece}</p>}
      {infoPiece && (
        <p className="mb-3 text-right text-xs text-muted">
          {infoPiece}
          {pieceOriginale && (
            <button
              type="button"
              onClick={() => {
                setPiece(pieceOriginale);
                setPieceOriginale(null);
                setInfoPiece(`Fichier d'origine conservé (${formatTaille(pieceOriginale.size)}).`);
              }}
              className="ml-2 underline hover:text-foreground"
            >
              Garder l’original
            </button>
          )}
        </p>
      )}
      {seanceUnique ? (
        <button type="button" onClick={onSortir} className="mb-3 rounded border border-border-strong px-3 py-1.5 text-xs text-foreground hover:border-accent-solid/60">
          ← Nouvelle séance et toutes les séances
        </button>
      ) : (
        <Formulaire variante="add" date={date} contenu={contenu} onDate={setDate} onContenu={setContenu} onSubmit={ajouter} occupe={occupe} disponibles={suivis} selection={selection} onSelection={setSelection} marquerEquipe={cible.genre === "gymnaste"} />
      )}
      {ajoutee && <p className="mb-2 text-sm text-success">Séance ajoutée ✓ — retrouvez-la dans « Mes séances ».</p>}
      {listeMasquee && !seanceUnique ? null : seances === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : seances.length === 0 ? (
        <p className="text-sm text-muted">Aucune séance enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {seances.filter((x) => !seanceUnique || x.id === seanceUnique).map((x) => (
            <li key={x.id} className="rounded-lg border border-border-subtle bg-surface p-3">
              {edition === x.id ? (
                <Formulaire variante="edit" date={dateEdition} contenu={contenuEdition} onDate={setDateEdition} onContenu={setContenuEdition} onSubmit={enregistrer} onCancel={() => setEdition(null)} disponibles={[...(x.tableaux ?? []), ...suivis.filter((t) => !(x.tableaux ?? []).some((y) => y.id === t.id))]} selection={selectionEdition} onSelection={setSelectionEdition} marquerEquipe={cible.genre === "gymnaste"} />
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-wide text-muted uppercase">{dateLisible(x.date)}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEdition(x.id);
                          setDateEdition(x.date);
                          setContenuEdition(x.contenu);
                          setSelectionEdition(Object.fromEntries((x.tableaux ?? []).map((t) => [t.id, t.lignes.map((l) => l.id)])));
                        }}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        Modifier
                      </button>
                      <button type="button" onClick={() => supprimer(x.id)} className="text-xs text-danger hover:underline">
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <ContenuSeance texte={x.contenu} />
                  {x.tableaux && x.tableaux.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {x.tableaux.map((t) => (
                        <Tableau key={t.id} suivi={t} membres={membres} modifiable={false} onChange={() => undefined} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Programme technique ou physique : on choisit une équipe puis « Toute l'équipe » ou une gymnaste, comme sur le site UFOLEP.
export default function ProgrammeEntrainement({ titre, type, ouverture, equipeCommune, onEquipe, listeMasquee }: { titre: string; type: TypeProgramme; ouverture?: { n: number; cible: Cible; seanceId?: string; agres?: string } | null; equipeCommune?: string; onEquipe?: (id: string) => void; listeMasquee?: boolean }) {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [equipeId, setEquipeId] = useState("");
  const [choix, setChoix] = useState<{ cible: Cible; libelle: string } | null>(null);
  // Séance ouverte depuis « Mes séances » : seule elle est affichée, à la place du formulaire de création.
  const [seanceUnique, setSeanceUnique] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setClubs(await getClubs());
    })();
  }, []);

  // Équipe choisie ailleurs sur la page (suivi des éléments) : même sélection ici.
  useEffect(() => {
    if (equipeCommune === undefined || equipeCommune === equipeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEquipeId(equipeCommune);
    setChoix(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipeCommune]);

  // Ouverture demandée depuis « Tableaux déjà créés » : sélectionne l'équipe et affiche ses consignes (ou celles de la gymnaste).
  useEffect(() => {
    // Un tableau ouvert depuis « Mes tableaux » (il a un agrès) n'ouvre que le suivi, pas le programme technique.
    if (!ouverture || ouverture.agres) return;
    const { cible } = ouverture;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeanceUnique(ouverture.seanceId ?? null);
    if (cible.genre === "equipe") {
      const e = equipes.find((x) => x.id === cible.id);
      if (!e) return;
      setEquipeId(e.id);
      setChoix({ cible, libelle: `Toute l'équipe ${e.nom}` });
    } else {
      const g = gymnastes.find((x) => x.id === cible.id);
      const e = equipes.find((x) => x.gymnasteIds.includes(cible.id));
      if (!g || !e) return;
      setEquipeId(e.id);
      setChoix({ cible, libelle: `${g.prenom} ${g.nom}` });
    }
  }, [ouverture, equipes, gymnastes]);

  const options = useMemo(() => {
    const nomClub = (id: string) => clubs?.find((c) => c.id === id)?.nom ?? "Sans club";
    return equipes.map((e) => ({ ...e, club: nomClub(e.clubId) })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [equipes, clubs]);
  const equipe = options.find((e) => e.id === equipeId);
  const membres = useMemo(() => (equipe ? gymnastes.filter((g) => equipe.gymnasteIds.includes(g.id)) : []), [equipe, gymnastes]);
  const libelleEquipe = equipe ? `Toute l'équipe ${equipe.nom} (${equipe.club})` : "Toute l'équipe";
  const equipeActive = choix?.cible.genre === "equipe" && choix.cible.id === equipeId;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">{titre}</h2>
      {clubs === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted">Aucune équipe trouvée. Créez une équipe depuis l&apos;accueil.</p>
      ) : (
        <select
          value={equipeId}
          onChange={(e) => {
            setEquipeId(e.target.value);
            setChoix(null);
            setSeanceUnique(null);
            onEquipe?.(e.target.value);
          }}
          className="w-full max-w-xs rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe…</option>
          {options.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom} ({e.club})
            </option>
          ))}
        </select>
      )}

      {equipe && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (setSeanceUnique(null), setChoix((c) => (c?.cible.genre === "equipe" && c.cible.id === equipeId ? null : { cible: { genre: "equipe", id: equipeId }, libelle: libelleEquipe })))}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              equipeActive ? "border-accent-solid bg-accent-from/10 text-white" : "border-accent-solid/60 bg-surface-alt text-foreground hover:bg-accent-from/10"
            }`}
          >
            ★ Toute l&apos;équipe
          </button>
          {membres.map((g) => {
            const actif = choix?.cible.genre === "gymnaste" && choix.cible.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => (setSeanceUnique(null), setChoix((c) => (c?.cible.genre === "gymnaste" && c.cible.id === g.id ? null : { cible: { genre: "gymnaste", id: g.id }, libelle: `${g.prenom} ${g.nom}` })))}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  actif ? "border-accent-solid bg-accent-from/10 text-white" : "border-border-strong bg-surface-alt text-foreground hover:border-accent-solid hover:text-white"
                }`}
              >
                {g.prenom} {g.nom}
              </button>
            );
          })}
        </div>
      )}

      {choix && <Journal key={`${choix.cible.genre}:${choix.cible.id}:${type}`} cible={choix.cible} libelle={choix.libelle} type={type} seanceUnique={seanceUnique} onSortir={() => setSeanceUnique(null)} listeMasquee={listeMasquee} />}
    </div>
  );
}
