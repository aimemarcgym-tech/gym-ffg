"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import DragHandle from "@/components/DragHandle";
import LecteurAudio from "@/components/LecteurAudio";
import { deleteMusique, saveMusique } from "@/lib/musique";
import { formatTaille } from "@/lib/format";
import { partagerFichiers } from "@/lib/share";
import type { MusiqueStockee } from "@/lib/idb";
import { updateGymnaste, type Gymnaste } from "@/lib/data";
import { RenommerEnLigne } from "@/components/EnLigne";
import { useDialogues } from "@/components/Dialogues";

interface Props {
  gymnaste: Gymnaste;
  musique: MusiqueStockee | undefined;
  onChange: () => void;
  // Après un renommage : recharge la liste des gymnastes.
  onRenomme: () => void;
  onExportOne: (g: Gymnaste, m: MusiqueStockee) => void;
  poignee: HTMLAttributes<HTMLSpanElement>;
}

const bouton =
  "rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid disabled:opacity-50";

// Une gymnaste, sa musique, son lecteur et ses actions : mêmes boutons que sur le site UFOLEP.
export default function MusiqueCarte({
  gymnaste,
  musique,
  onChange,
  onRenomme,
  onExportOne,
  poignee,
}: Props) {
  const { informer } = useDialogues();
  const [occupe, setOccupe] = useState(false);
  const [renomme, setRenomme] = useState(false);
  const [actions, setActions] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!musique) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(musique.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [musique]);

  async function importer(fichier: File) {
    setOccupe(true);
    try {
      await saveMusique(gymnaste.id, fichier);
      onChange();
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer() {
    setOccupe(true);
    try {
      await deleteMusique(gymnaste.id);
      onChange();
    } finally {
      setOccupe(false);
    }
  }

  async function partager() {
    if (!musique) return;
    const f = new File([musique.blob], musique.fileName, {
      type: musique.mimeType,
    });
    if (
      (await partagerFichiers([f], { title: musique.fileName })) ===
      "unsupported"
    ) {
      await informer(
        "Le partage n’est pas disponible sur ce navigateur. Utilisez « Envoyer sur clé USB » ou téléchargez le fichier.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <DragHandle {...poignee} />
        {renomme ? (
          <RenommerEnLigne
            valeur={`${gymnaste.prenom} ${gymnaste.nom}`}
            onAnnuler={() => setRenomme(false)}
            onOk={async (v) => {
              // Le premier mot est le prénom, le reste le nom (« Sarah Le Palud »).
              const [prenom, ...reste] = v.split(/\s+/);
              await updateGymnaste(gymnaste.id, {
                prenom,
                nom: reste.join(" "),
              });
              setRenomme(false);
              onRenomme();
            }}
          />
        ) : (
          // Un clic sur le nom affiche ou masque les actions.
          <button
            type="button"
            onClick={() => setActions((a) => !a)}
            aria-expanded={actions}
            className="flex items-center gap-1.5 text-left hover:text-white"
          >
            {gymnaste.prenom} {gymnaste.nom}
            <span className="text-xs text-muted">{actions ? "▴" : "▾"}</span>
          </button>
        )}
      </div>

      <input
        ref={champ}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importer(f);
          e.target.value = "";
        }}
      />
      {actions && !renomme && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRenomme(true)}
              className={bouton}
            >
              Renommer
            </button>
            <button
              type="button"
              disabled={occupe}
              onClick={() => champ.current?.click()}
              className={`${bouton} bg-surface`}
            >
              {musique ? "Remplacer" : "Importer"}
            </button>
            {musique && (
              <>
                <button
                  type="button"
                  disabled={occupe}
                  onClick={partager}
                  className={bouton}
                >
                  Partager
                </button>
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => onExportOne(gymnaste, musique)}
                  className={bouton}
                >
                  Envoyer sur clé USB
                </button>
              </>
            )}
          </div>
          {musique && (
            <div className="border-t border-border-subtle pt-2">
              <button
                type="button"
                disabled={occupe}
                onClick={supprimer}
                className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}

      {musique && url ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted">
            {musique.fileName} · {formatTaille(musique.size)}
          </p>
          <LecteurAudio src={url} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Aucune musique importée.</p>
      )}
    </div>
  );
}
