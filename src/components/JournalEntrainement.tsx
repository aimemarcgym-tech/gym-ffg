"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import PartageBouton from "@/components/PartageBouton";
import { addSeance, deleteSeance, getClubs, getEquipes, getGymnastes, getSeances, updateSeance, type Club, type Equipe, type Gymnaste, type Seance, type TypeProgramme } from "@/lib/data";
import { formatTaille } from "@/lib/format";
import { createShare } from "@/lib/shares";

type Cible = Seance["cible"];

// Tant que les liens sont encodés dans l'adresse (pas de serveur), on borne leur taille ; avec Firestore ces limites sautent.
const LIMITE_LIEN = 150_000;
const LIMITE_PJ = 100_000;

function dateLisible(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
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
}: {
  date: string;
  contenu: string;
  onDate: (v: string) => void;
  onContenu: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  variante: "add" | "edit";
  occupe?: boolean;
  onCancel?: () => void;
}) {
  const champDate = (
    <input
      type="date"
      value={date}
      onChange={(e) => onDate(e.target.value)}
      className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none"
    />
  );
  const zone = (
    <textarea
      value={contenu}
      onChange={(e) => onContenu(e.target.value)}
      rows={3}
      placeholder={variante === "add" ? "Exercices, objectifs, remarques pour cette séance…" : undefined}
      className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
    />
  );
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
      </form>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {champDate}
      {zone}
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

function Journal({ cible, libelle, type }: { cible: Cible; libelle: string; type: TypeProgramme }) {
  const [seances, setSeances] = useState<Seance[] | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contenu, setContenu] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);
  const [dateEdition, setDateEdition] = useState("");
  const [contenuEdition, setContenuEdition] = useState("");
  const [piece, setPiece] = useState<File | null>(null);
  const [erreurPiece, setErreurPiece] = useState<string | null>(null);

  function charger() {
    getSeances(cible, type).then(setSeances);
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible.genre, cible.id, type]);

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setOccupe(true);
    try {
      await addSeance(cible, type, date, contenu.trim());
      setContenu("");
      charger();
    } finally {
      setOccupe(false);
    }
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (edition && contenuEdition.trim()) {
      await updateSeance(edition, dateEdition, contenuEdition.trim());
      setEdition(null);
      charger();
    }
  }

  async function supprimer(id: string) {
    await deleteSeance(id);
    charger();
  }

  function choisirPiece(fichier: File | null) {
    if (!fichier) return;
    if (fichier.size > LIMITE_PJ) {
      setErreurPiece(`« ${fichier.name} » fait ${formatTaille(fichier.size)}, c'est trop volumineux pour être joint au lien (max ${formatTaille(LIMITE_PJ)}).`);
      return;
    }
    setErreurPiece(null);
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
    const data = { targetLabel: libelle, programType: type, sessions: (seances ?? []).map((x) => ({ date: x.date, content: x.contenu })), ...(pieceJointe ? { attachment: pieceJointe } : {}) };
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
          <button type="button" onClick={() => setPiece(null)} className="text-xs text-muted hover:text-foreground">
            Retirer
          </button>
        )}
        <PartageBouton onCreate={creerLien} />
      </div>
      {erreurPiece && <p className="mb-3 text-right text-xs text-danger">{erreurPiece}</p>}
      <Formulaire variante="add" date={date} contenu={contenu} onDate={setDate} onContenu={setContenu} onSubmit={ajouter} occupe={occupe} />
      {seances === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : seances.length === 0 ? (
        <p className="text-sm text-muted">Aucune séance enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {seances.map((x) => (
            <li key={x.id} className="rounded-lg border border-border-subtle bg-surface p-3">
              {edition === x.id ? (
                <Formulaire variante="edit" date={dateEdition} contenu={contenuEdition} onDate={setDateEdition} onContenu={setContenuEdition} onSubmit={enregistrer} onCancel={() => setEdition(null)} />
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
                  <p className="text-sm whitespace-pre-wrap text-foreground">{x.contenu}</p>
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
export default function ProgrammeEntrainement({ titre, type }: { titre: string; type: TypeProgramme }) {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [equipeId, setEquipeId] = useState("");
  const [choix, setChoix] = useState<{ cible: Cible; libelle: string } | null>(null);

  useEffect(() => {
    (async () => {
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setClubs(await getClubs());
    })();
  }, []);

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
            onClick={() => setChoix((c) => (c?.cible.genre === "equipe" && c.cible.id === equipeId ? null : { cible: { genre: "equipe", id: equipeId }, libelle: libelleEquipe }))}
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
                onClick={() => setChoix((c) => (c?.cible.genre === "gymnaste" && c.cible.id === g.id ? null : { cible: { genre: "gymnaste", id: g.id }, libelle: `${g.prenom} ${g.nom}` }))}
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

      {choix && <Journal key={`${choix.cible.genre}:${choix.cible.id}:${type}`} cible={choix.cible} libelle={choix.libelle} type={type} />}
    </div>
  );
}
