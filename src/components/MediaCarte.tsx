"use client";

import { useEffect, useState } from "react";
import { deleteMedia, setTags, type TypeMedia } from "@/lib/medias";
import { formatTaille } from "@/lib/format";
import { partagerFichiers } from "@/lib/share";
import type { MediaStocke } from "@/lib/idb";
import { useDialogues } from "@/components/Dialogues";

function TagsEditeur({ type, media, onChange }: { type: TypeMedia; media: MediaStocke; onChange: () => void }) {
  const [texte, setTexte] = useState(media.tags.join(", "));
  const [enregistre, setEnregistre] = useState(true);

  async function enregistrer() {
    await setTags(
      type,
      media.id,
      texte
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
    setEnregistre(true);
    onChange();
  }

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <input
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setEnregistre(false);
        }}
        onBlur={enregistre ? undefined : enregistrer}
        placeholder="Tags (séparés par des virgules)…"
        className="w-full rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
      />
      {!enregistre && (
        <button type="button" onClick={enregistrer} className="shrink-0 rounded border border-border-strong px-1.5 py-1 text-[10px] font-medium text-foreground hover:border-accent-solid">
          ✓
        </button>
      )}
    </div>
  );
}

// Une photo ou une vidéo, ses tags et ses actions : mêmes cartes que sur le site UFOLEP.
export default function MediaCarte({ type, media, onChange }: { type: TypeMedia; media: MediaStocke; onChange: () => void }) {
  const { informer } = useDialogues();
  const [occupe, setOccupe] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(media.blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [media]);

  async function supprimer() {
    setOccupe(true);
    try {
      await deleteMedia(type, media.id);
      onChange();
    } finally {
      setOccupe(false);
    }
  }

  async function partager() {
    const f = new File([media.blob], media.fileName, { type: media.mimeType });
    if ((await partagerFichiers([f], { title: media.fileName })) === "unsupported") {
      await informer(type === "photo" ? "Le partage n’est pas disponible sur ce navigateur. Téléchargez la photo puis partagez-la manuellement." : "Le partage n’est pas disponible sur ce navigateur. Téléchargez la vidéo puis partagez-la manuellement.");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-alt/40">
      {url &&
        (type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={media.fileName} className="aspect-square w-full object-cover" />
        ) : (
          <video controls src={url} className="aspect-video w-full bg-black" />
        ))}
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted" title={media.fileName}>
            {media.fileName} · {formatTaille(media.size)}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={partager} className="text-xs text-muted hover:underline">
              Partager
            </button>
            <button type="button" disabled={occupe} onClick={supprimer} className="text-xs text-danger hover:underline disabled:opacity-50">
              Supprimer
            </button>
          </div>
        </div>
        <TagsEditeur type={type} media={media} onChange={onChange} />
        {media.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {media.tags.map((t) => (
              <span key={t} className="rounded-full border border-accent-solid/40 bg-accent-from/10 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
