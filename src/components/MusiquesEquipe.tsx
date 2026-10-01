"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MusiqueCarte from "@/components/MusiqueCarte";
import { useDragReorder } from "@/hooks/useDragReorder";
import { getClubs, getEquipes, getGymnastes, setOrdreMusique, type Club, type Equipe, type Gymnaste } from "@/lib/data";
import { getMusique } from "@/lib/musique";
import { nomFichierSur } from "@/lib/format";
import { getNiveau } from "@/regulation/loader";
import { champ } from "@/lib/styles";
import type { MusiqueStockee } from "@/lib/idb";

interface FichierUSB {
  createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }>;
}
interface DossierUSB {
  getFileHandle(nom: string, options: { create: boolean }): Promise<FichierUSB>;
}
// Ouvre le sélecteur de dossier (Chrome, Edge), ou renvoie null quand le navigateur ne sait pas écrire sur une clé.
function ouvrirDossier(): Promise<DossierUSB> | null {
  const w = window as unknown as { showDirectoryPicker?: () => Promise<DossierUSB> };
  return w.showDirectoryPicker ? w.showDirectoryPicker() : null;
}

const extension = (nom: string) => (nom.includes(".") ? nom.split(".").pop() : "mp3");

export default function MusiquesEquipe() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [choix, setChoix] = useState("");
  const [musiques, setMusiques] = useState<Record<string, MusiqueStockee | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  const charger = useCallback(async () => {
    setClubs(await getClubs());
    setEquipes(await getEquipes());
    setGymnastes(await getGymnastes());
    setPret(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, [charger]);

  const liste = useMemo(
    () =>
      equipes
        .map((e) => ({ equipe: e, club: clubs.find((c) => c.id === e.clubId)?.nom ?? "Sans club" }))
        .sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr")),
    [equipes, clubs],
  );
  const selection = liste.find((x) => x.equipe.id === choix);

  // Les gymnastes sans ordre enregistré passent à la suite, dans l'ordre de l'équipe.
  const membres = useMemo(() => {
    if (!selection) return [];
    const ordre = selection.equipe.ordreMusique ?? [];
    const rang = (id: string) => {
      const i = ordre.indexOf(id);
      return i < 0 ? Infinity : i;
    };
    return selection.equipe.gymnasteIds
      .map((id) => gymnastes.find((g) => g.id === id))
      .filter((g): g is Gymnaste => !!g)
      .sort((a, b) => (rang(a.id) === rang(b.id) ? 0 : rang(a.id) < rang(b.id) ? -1 : 1));
  }, [selection, gymnastes]);

  const chargerMusiques = useCallback(async () => {
    setMusiques(Object.fromEntries(await Promise.all(membres.map(async (g) => [g.id, await getMusique(g.id)] as const))));
  }, [membres]);

  useEffect(() => {
    if (membres.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      chargerMusiques();
    } else setMusiques({});
  }, [membres, chargerMusiques]);

  const importees = membres.filter((g) => musiques[g.id]).length;

  const dnd = useDragReorder(
    membres.map((g) => g.id),
    async (ids) => {
      if (!selection) return;
      await setOrdreMusique(selection.equipe.id, ids);
      await charger();
    },
  );

  async function exporterEquipe() {
    setMessage(null);
    const demande = ouvrirDossier();
    if (!demande) {
      setMessage("Votre navigateur ne permet pas d’écrire directement sur une clé USB — téléchargez chaque musique avec le bouton ▶, puis copiez les fichiers téléchargés sur la clé.");
      return;
    }
    try {
      const dossier = await demande;
      let copiees = 0;
      const largeur = String(membres.length).length;
      for (let i = 0; i < membres.length; i++) {
        const g = membres[i];
        const m = musiques[g.id];
        if (!m) continue;
        const nom = `${String(i + 1).padStart(largeur, "0")}_${nomFichierSur(g.prenom)}_${nomFichierSur(g.nom)}.${extension(m.fileName)}`;
        const f = await (await dossier.getFileHandle(nom, { create: true })).createWritable();
        await f.write(m.blob);
        await f.close();
        copiees += 1;
      }
      setMessage(copiees > 0 ? `${copiees} musique(s) copiée(s) sur la clé, dans l’ordre défini.` : "Aucune musique à exporter pour cette équipe.");
    } catch {
      setMessage(null);
    }
  }

  async function exporterUne(g: Gymnaste, m: MusiqueStockee) {
    const demande = ouvrirDossier();
    if (!demande) {
      setMessage("Votre navigateur ne permet pas d’écrire directement sur une clé USB — utilisez le bouton ▶ pour écouter puis téléchargez le fichier autrement.");
      return;
    }
    try {
      const dossier = await demande;
      const nom = `${nomFichierSur(g.prenom)}_${nomFichierSur(g.nom)}.${extension(m.fileName)}`;
      const f = await (await dossier.getFileHandle(nom, { create: true })).createWritable();
      await f.write(m.blob);
      await f.close();
      setMessage(`Musique de ${g.prenom} ${g.nom} copiée sur la clé.`);
    } catch {
      setMessage(null);
    }
  }

  return (
    <div className="w-full max-w-2xl min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Musiques d’équipe</h2>

      {!pret ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted">Aucune équipe trouvée. Crée une équipe depuis l’accueil, en ajoutant une gymnaste avec le champ « Équipe ».</p>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {importees}/{membres.length} musique(s) importée(s)
            </p>
            <button type="button" onClick={exporterEquipe} className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
              Envoyer toute l’équipe sur une clé USB
            </button>
          </div>
          {message && <p className="text-xs text-muted">{message}</p>}

          <div className="space-y-2">
            {membres.map((g) => (
              <div key={g.id} ref={dnd.registre(g.id)} style={dnd.style(g.id)} className="rounded-lg transition">
                <MusiqueCarte gymnaste={g} musique={musiques[g.id]} onChange={chargerMusiques} onExportOne={exporterUne} poignee={dnd.poignee(g.id)} />
              </div>
            ))}
            {membres.length === 0 && <p className="text-sm text-muted">Cette équipe n’a pas encore de gymnaste.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
