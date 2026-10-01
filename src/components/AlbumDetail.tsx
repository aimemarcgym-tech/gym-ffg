"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import MediaCarte from "@/components/MediaCarte";
import { addMedia, deleteAlbum, getMedias, updateAlbum, type TypeMedia } from "@/lib/medias";
import type { AlbumMedia, MediaStocke } from "@/lib/idb";
import { ConfirmerEnLigne } from "@/components/EnLigne";

const champ = "rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs text-foreground focus:border-accent-solid focus:outline-none";

interface Props {
  type: TypeMedia;
  album: AlbumMedia;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

const TEXTES = {
  photo: { mot: "photos", bouton: "+ Ajouter des photos", vide: "Aucune photo dans cet album pour l’instant.", accept: "image/*", prefixe: "image/", grille: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" },
  video: { mot: "vidéos", bouton: "+ Ajouter des vidéos", vide: "Aucune vidéo dans cet album pour l’instant.", accept: "video/*", prefixe: "video/", grille: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" },
} as const;

export default function AlbumDetail({ type, album, onBack, onDeleted, onUpdated }: Props) {
  const [confSuppr, setConfSuppr] = useState(false);
  const t = TEXTES[type];
  const [medias, setMedias] = useState<MediaStocke[] | null>(null);
  const [import_, setImport] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(album.name);
  const [date, setDate] = useState(album.date ?? "");
  const [equipe, setEquipe] = useState(album.team ?? "");
  const [club, setClub] = useState(album.club ?? "");
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(() => {
    getMedias(type, album.id).then(setMedias);
  }, [type, album.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNom(album.name);
    setDate(album.date ?? "");
    setEquipe(album.team ?? "");
    setClub(album.club ?? "");
  }, [album]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function importer(fichiers: FileList) {
    setImport(true);
    try {
      for (const f of Array.from(fichiers)) if (f.type.startsWith(t.prefixe)) await addMedia(type, album.id, f);
      charger();
    } finally {
      setImport(false);
    }
  }

  async function supprimer() {
    await deleteAlbum(type, album.id);
    onDeleted();
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setOccupe(true);
    try {
      await updateAlbum(type, album.id, nom, date, equipe, club);
      onUpdated();
      setEdition(false);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <button type="button" onClick={onBack} className="accent-gradient-text text-sm font-medium">
            ← Tous les albums
          </button>
          {edition ? (
            <form onSubmit={enregistrer} className="mt-1 space-y-2">
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                placeholder="Nom de l’album"
                className="w-full min-w-[280px] rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm font-semibold text-foreground focus:border-accent-solid focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date (optionnel)" className={champ} />
                <input value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder="Équipe (optionnel)" className={champ} />
                <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Club (optionnel)" className={champ} />
                <button type="submit" disabled={occupe} className="rounded bg-accent-solid px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEdition(false)} className="rounded border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-2">
              <div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{album.name}</h3>
                <p className="text-xs text-muted">{[album.date, album.team, album.club].filter(Boolean).join(" · ") || "Aucune date/équipe/club précisée"}</p>
              </div>
              <button type="button" onClick={() => setEdition(true)} className="mt-1 text-xs text-muted underline hover:text-foreground">
                Modifier
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={champFichier}
            type="file"
            accept={t.accept}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) importer(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={import_}
            onClick={() => champFichier.current?.click()}
            className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {import_ ? "Import…" : t.bouton}
          </button>
          {confSuppr ? (
            <ConfirmerEnLigne question={`Supprimer l’album et toutes ses ${t.mot} ?`} onConfirmer={supprimer} onAnnuler={() => setConfSuppr(false)} />
          ) : (
            <button type="button" onClick={() => setConfSuppr(true)} className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400">
              Supprimer l’album
            </button>
          )}
        </div>
      </div>

      {medias === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : medias.length === 0 ? (
        <p className="text-sm text-muted">{t.vide}</p>
      ) : (
        <div className={t.grille}>
          {medias.map((m) => (
            <MediaCarte key={m.id} type={type} media={m} onChange={charger} />
          ))}
        </div>
      )}
    </div>
  );
}
