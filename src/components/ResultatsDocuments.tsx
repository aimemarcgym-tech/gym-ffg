"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ConfirmerEnLigne } from "@/components/EnLigne";
import { useDialogues } from "@/components/Dialogues";
import { getClubs, getEquipes, getGymnastes, type Club, type Equipe, type Gymnaste } from "@/lib/data";
import { formatTaille } from "@/lib/format";
import { partagerFichiers } from "@/lib/share";
import { addResultat, deleteResultat, getResultats, setDateResultat, type CibleResultat } from "@/lib/resultats";
import type { ResultatStocke } from "@/lib/idb";

const dateInput = "rounded border border-border-strong bg-surface px-1.5 py-0.5 text-xs text-foreground focus:border-accent-solid focus:outline-none";

function DocumentCarte({ doc, onChange }: { doc: ResultatStocke; onChange: () => void }) {
  const { informer } = useDialogues();
  const [date, setDate] = useState(doc.date ?? "");
  const [confirme, setConfirme] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(doc.blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [doc]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(doc.date ?? "");
  }, [doc.date]);

  async function changerDate(v: string) {
    setDate(v);
    await setDateResultat(doc.id, v);
    onChange();
  }

  async function partager() {
    const f = new File([doc.blob], doc.fileName, { type: doc.mimeType });
    if ((await partagerFichiers([f], { title: doc.fileName })) === "unsupported") await informer("Le partage n’est pas disponible sur ce navigateur. Utilisez « Télécharger ».");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground" title={doc.fileName}>
          {doc.fileName}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <label className="text-xs text-muted">Date :</label>
          <input type="date" value={date} onChange={(e) => changerDate(e.target.value)} className={dateInput} />
        </div>
        <p className="mt-1 text-xs text-muted">{formatTaille(doc.size)}</p>
      </div>
      {confirme ? (
        <ConfirmerEnLigne
          question="Supprimer ce document ?"
          onAnnuler={() => setConfirme(false)}
          onConfirmer={async () => {
            await deleteResultat(doc.id);
            onChange();
          }}
        />
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          {url && (
            <a href={url} download={doc.fileName} className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid">
              Télécharger
            </a>
          )}
          <button type="button" onClick={partager} className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid">
            Partager
          </button>
          <button type="button" onClick={() => setConfirme(true)} className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400">
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function Documents({ cible, libelle }: { cible: CibleResultat; libelle: string }) {
  const [docs, setDocs] = useState<ResultatStocke[] | null>(null);
  const [date, setDate] = useState("");
  const [import_, setImport] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  function charger() {
    getResultats(cible).then(setDocs);
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible.genre, cible.id]);

  async function importer(fichiers: FileList) {
    setImport(true);
    try {
      for (const f of Array.from(fichiers)) await addResultat(cible, f, date || null);
      charger();
    } finally {
      setImport(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-border-subtle bg-surface-alt/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Documents — {libelle}</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted" htmlFor="resultat-date">
            Date (optionnel) :
          </label>
          <input id="resultat-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={dateInput.replace("px-1.5 py-0.5", "px-2 py-1")} />
          <input
            ref={champ}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.odt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) importer(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={import_}
            onClick={() => champ.current?.click()}
            className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {import_ ? "Import…" : "+ Ajouter des documents"}
          </button>
        </div>
      </div>
      {docs === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted">Aucun document pour l’instant (résultats, classements, feuilles de notes…).</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <DocumentCarte key={d.id} doc={d} onChange={charger} />
          ))}
        </div>
      )}
    </div>
  );
}

// Résultats par équipe ou par individuelle : on choisit, puis on dépose des documents datés (Word, PDF, tableurs, images…).
function SelectionResultats() {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [choix, setChoix] = useState("");
  const [cible, setCible] = useState<{ cible: CibleResultat; libelle: string } | null>(null);

  useEffect(() => {
    (async () => {
      setEquipes(await getEquipes());
      setGymnastes(await getGymnastes());
      setClubs(await getClubs());
    })();
  }, []);

  const nomClub = (id: string) => clubs?.find((c) => c.id === id)?.nom ?? "Sans club";
  const options = useMemo(() => [...equipes].sort((a, b) => a.nom.localeCompare(b.nom, "fr")), [equipes]);
  // Gymnastes qui ne sont dans aucune équipe : elles concourent en individuelle.
  const individuelles = useMemo(() => gymnastes.filter((g) => !equipes.some((e) => e.gymnasteIds.includes(g.id))), [gymnastes, equipes]);

  const equipe = choix.startsWith("equipe:") ? equipes.find((e) => e.id === choix.slice(7)) : undefined;
  const membres = equipe ? equipe.gymnasteIds.map((id) => gymnastes.find((g) => g.id === id)).filter((g): g is Gymnaste => !!g) : [];
  const libelleEquipe = equipe ? `Toute l’équipe ${equipe.nom} (${nomClub(equipe.clubId)})` : "";
  const nomGymnaste = (g: Gymnaste) => `${g.prenom} ${g.nom} (individuelle)`;

  function choisir(v: string) {
    setChoix(v);
    if (v.startsWith("gymnaste:")) {
      const g = gymnastes.find((x) => x.id === v.slice(9));
      setCible(g ? { cible: { genre: "gymnaste", id: g.id }, libelle: nomGymnaste(g) } : null);
    } else setCible(null);
  }

  const bouton = (actif: boolean, gras: boolean) =>
    `rounded-lg border px-3 py-2 text-sm transition-colors ${gras ? "font-semibold" : "font-medium"} ${
      actif ? "border-accent-solid bg-accent-from/10 text-white" : gras ? "border-accent-solid/60 bg-surface-alt text-foreground hover:bg-accent-from/10" : "border-border-strong bg-surface-alt text-foreground hover:border-accent-solid hover:text-white"
    }`;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">Résultats par équipe ou individuelle</h2>
      {clubs === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : options.length === 0 && individuelles.length === 0 ? (
        <p className="text-sm text-muted">Aucune équipe ni gymnaste trouvée. Créez-en depuis l’accueil.</p>
      ) : (
        <select
          value={choix}
          onChange={(e) => choisir(e.target.value)}
          className="w-full max-w-xs rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe ou une individuelle…</option>
          {options.length > 0 && (
            <optgroup label="Équipes">
              {options.map((e) => (
                <option key={e.id} value={`equipe:${e.id}`}>
                  {e.nom} ({nomClub(e.clubId)})
                </option>
              ))}
            </optgroup>
          )}
          {individuelles.length > 0 && (
            <optgroup label="Individuelles (sans équipe)">
              {individuelles.map((g) => (
                <option key={g.id} value={`gymnaste:${g.id}`}>
                  {g.prenom} {g.nom} ({nomClub(g.clubId)})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      )}

      {equipe && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCible((c) => (c?.cible.genre === "equipe" && c.cible.id === equipe.id ? null : { cible: { genre: "equipe", id: equipe.id }, libelle: libelleEquipe }))}
            className={bouton(cible?.cible.genre === "equipe" && cible.cible.id === equipe.id, true)}
          >
            ★ Toute l’équipe
          </button>
          {membres.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setCible((c) => (c?.cible.genre === "gymnaste" && c.cible.id === g.id ? null : { cible: { genre: "gymnaste", id: g.id }, libelle: nomGymnaste(g) }))}
              className={bouton(cible?.cible.genre === "gymnaste" && cible.cible.id === g.id, false)}
            >
              {g.prenom} {g.nom}
            </button>
          ))}
        </div>
      )}

      {cible && <Documents key={`${cible.cible.genre}:${cible.cible.id}`} cible={cible.cible} libelle={cible.libelle} />}
    </div>
  );
}

export default function ResultatsDocuments() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Résultats</span>
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <SelectionResultats />
      </main>
    </div>
  );
}
