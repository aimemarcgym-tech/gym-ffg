"use client";

import { useEffect, useState } from "react";
import { useDialogues } from "@/components/Dialogues";
import { RenommerEnLigne } from "@/components/EnLigne";
import LecteurAudio from "@/components/LecteurAudio";
import { getGymnastes, type Gymnaste } from "@/lib/data";
import { formatTaille } from "@/lib/format";
import { saveMusique } from "@/lib/musique";
import { partagerFichiers } from "@/lib/share";

const bouton = "rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid";

// Que faire d'un MP3 prêt : le télécharger, le renommer, le partager, l'envoyer au montage pour le couper, ou l'ajouter à la musique d'une gymnaste.
export default function SortieMp3({ blob, nom: nomInitial, onCouper }: { blob: Blob; nom: string; onCouper?: (fichier: File) => void }) {
  const { informer } = useDialogues();
  // Le nom peut être changé avant l'enregistrement : il sert au téléchargement, à « Enregistrer sous… », au partage et à l'ajout à une gymnaste.
  const [nom, setNom] = useState(nomInitial);
  const [renomme, setRenomme] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [gymnaste, setGymnaste] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  useEffect(() => {
    getGymnastes().then(setGymnastes);
  }, []);

  const fichier = () => new File([blob], nom, { type: "audio/mpeg" });

  // Chrome et Edge ouvrent la fenêtre « Enregistrer sous » pour choisir le dossier et le nom ; les autres navigateurs téléchargent directement.
  const w = typeof window === "undefined" ? undefined : (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<{ createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }> }> });
  function telechargerClassique() {
    if (!url) return;
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nom;
    lien.click();
  }
  async function telecharger() {
    if (!w?.showSaveFilePicker) return telechargerClassique();
    try {
      const f = await w.showSaveFilePicker({ suggestedName: nom, types: [{ description: "MP3", accept: { "audio/mpeg": [".mp3"] } }] });
      const flux = await f.createWritable();
      await flux.write(blob);
      await flux.close();
      setMessage("Fichier enregistré à l’emplacement choisi.");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      telechargerClassique();
    }
  }

  async function partager() {
    if ((await partagerFichiers([fichier()], { title: nom })) === "unsupported") await informer("Le partage n’est pas disponible sur ce navigateur. Utilisez « Télécharger ».");
  }

  async function ajouter() {
    const g = gymnastes.find((x) => x.id === gymnaste);
    if (!g) return;
    await saveMusique(g.id, fichier());
    setMessage(`Ajouté à la musique de ${g.prenom} ${g.nom} (l’ancienne musique est remplacée).`);
  }

  return (
    <div className="space-y-2">
      {renomme ? (
        <RenommerEnLigne
          valeur={nom.replace(/\.mp3$/i, "")}
          className="!py-1 !text-sm"
          onAnnuler={() => setRenomme(false)}
          onOk={(v) => {
            // Sans les caractères interdits dans un nom de fichier Windows ; l'extension .mp3 est toujours ajoutée.
            const propre = v.replace(/\.mp3$/i, "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
            if (propre) setNom(`${propre}.mp3`);
            setRenomme(false);
          }}
        />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-foreground" title={nom}>
            {nom}
          </span>
          <span className="shrink-0 text-xs text-muted">{formatTaille(blob.size)}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={telecharger} className={bouton}>
          Télécharger
        </button>
        <button type="button" onClick={() => setRenomme(true)} className={bouton}>
          Renommer
        </button>
        <button type="button" onClick={partager} className={bouton}>
          Partager
        </button>
        {onCouper && (
          <button type="button" onClick={() => onCouper(fichier())} className={bouton} title="Envoie cette musique dans le panneau « Couper une musique »">
            ✂ Couper
          </button>
        )}
      </div>
      {url && <LecteurAudio src={url} />}
      {gymnastes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={gymnaste} onChange={(e) => setGymnaste(e.target.value)} className="rounded border border-border-strong bg-surface px-2 py-1 text-xs text-foreground focus:border-accent-solid focus:outline-none" aria-label="Gymnaste">
            <option value="">Ajouter à la musique de…</option>
            {gymnastes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.prenom} {g.nom}
              </option>
            ))}
          </select>
          <button type="button" disabled={!gymnaste} onClick={ajouter} className={`${bouton} disabled:opacity-50`}>
            Ajouter
          </button>
        </div>
      )}
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
