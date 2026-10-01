"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { exporterSauvegarde, importerSauvegarde, telechargerSauvegarde, type Sauvegarde as Donnees } from "@/lib/backup";

// Lecture du fichier avec repli sur FileReader, comme sur le site UFOLEP (certains stockages cloud échouent avec Blob.text).
async function lireTexte(fichier: File): Promise<string> {
  try {
    return await fichier.text();
  } catch (erreur) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(String(lecteur.result));
        lecteur.onerror = () => reject(lecteur.error ?? erreur);
        lecteur.readAsText(fichier);
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : erreur instanceof Error ? erreur.message : String(e));
    }
  }
}

export default function Sauvegarde() {
  const [message, setMessage] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState<Donnees | null>(null);
  const [occupe, setOccupe] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  async function exporter() {
    setOccupe(true);
    setMessage(null);
    try {
      const s = await exporterSauvegarde();
      const resultat = await telechargerSauvegarde(s);
      if (resultat === "cancelled") return setMessage(null);
      const detail = `${s.gymnastes?.length ?? 0} gymnaste(s), ${s.mouvements?.length ?? 0} mouvement(s), ${s.equipes?.length ?? 0} équipe(s), ${s.musiques?.length ?? 0} musique(s), ${s.photos?.length ?? 0} photo(s), ${s.videos?.length ?? 0} vidéo(s), ${s.resultats?.length ?? 0} document(s) de résultats`;
      setMessage(
        resultat === "picked"
          ? `Sauvegarde enregistrée à l’emplacement choisi (${detail}).`
          : `Sauvegarde téléchargée dans le dossier de téléchargements (${detail}). Votre navigateur ne permet pas de choisir l’emplacement — déplacez le fichier ensuite si besoin.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de l’export.");
    } finally {
      setOccupe(false);
    }
  }

  async function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    setMessage(`Lecture du fichier (${(fichier.size / 1024).toFixed(0)} Ko)…`);
    try {
      const s = JSON.parse(await lireTexte(fichier)) as Donnees;
      setMessage(null);
      setEnAttente(s);
    } catch (erreur) {
      if (erreur instanceof SyntaxError) return setMessage("Fichier illisible : ce n’est pas un JSON de sauvegarde valide.");
      const detail = erreur instanceof Error ? erreur.message : String(erreur);
      setMessage(
        `Impossible de lire ce fichier (${detail || "erreur inconnue"}) — si le problème persiste depuis un stockage cloud, essayez de copier le fichier dans le stockage interne de l’appareil (pas juste « hors ligne » dans l’appli cloud) avant de réimporter.`,
      );
    }
  }

  async function confirmer() {
    if (!enAttente) return;
    setOccupe(true);
    try {
      const c = await importerSauvegarde(enAttente);
      setMessage(
        `Sauvegarde importée : ${c.gymnastes} gymnaste(s), ${c.mouvements} mouvement(s), ${c.clubs} club(s), ${c.equipes} équipe(s), ${c.musiques} musique(s), ${c.photos} photo(s), ${c.videos} vidéo(s), ${c.resultats} document(s) de résultats. Les données précédentes de cet appareil ont été remplacées.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de l’import.");
    } finally {
      setOccupe(false);
      setEnAttente(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Exporter</h3>
        <p className="mb-3 text-xs text-muted">
          Télécharge un fichier JSON contenant toutes vos données (clubs, équipes, gymnastes, compétences, mouvements, historique, ordres de passage) ainsi que les musiques, photos, vidéos et documents de résultats{" "}
          <strong className="text-foreground">de cet appareil</strong> (ces fichiers ne sont pas synchronisés automatiquement entre appareils — ce fichier est le moyen de les transférer vers un autre appareil ou de les
          sauvegarder sur votre propre stockage : Drive, Dropbox, clé USB…). À faire régulièrement, en particulier avant/après une compétition.
        </p>
        <button onClick={exporter} disabled={occupe} className="accent-gradient rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          Télécharger une sauvegarde
        </button>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Importer</h3>
        <p className="mb-3 text-xs text-muted">
          Charge un fichier de sauvegarde exporté depuis cet appareil ou un autre. <strong className="text-danger">Remplace entièrement</strong> vos clubs, équipes, gymnastes et mouvements actuels ainsi que les
          musiques, photos, vidéos et documents de résultats de cet appareil.
        </p>
        <input
          ref={champ}
          type="file"
          accept="application/json"
          onChange={choisirFichier}
          className="block w-full text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-xs file:text-foreground hover:file:bg-border-strong"
        />
      </div>

      {enAttente && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4">
          <p className="mb-3 text-sm text-danger">
            Remplacer toutes vos données par cette sauvegarde ({enAttente.gymnastes?.length ?? 0} gymnaste(s), {enAttente.mouvements?.length ?? 0} mouvement(s), {enAttente.photos?.length ?? 0} photo(s), {enAttente.videos?.length ?? 0} vidéo(s)) ? Cette action est irréversible pour les données
            actuelles de cet appareil (équipes, gymnastes, mouvements, musiques, photos, vidéos et documents de résultats).
          </p>
          <div className="flex gap-2">
            <button onClick={confirmer} disabled={occupe} className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50">
              {occupe ? "…" : "Confirmer le remplacement"}
            </button>
            <button onClick={() => setEnAttente(null)} className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:text-foreground">
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
