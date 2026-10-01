"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AlbumDetail from "@/components/AlbumDetail";
import { createAlbum, getAlbums, type TypeMedia } from "@/lib/medias";
import type { AlbumMedia } from "@/lib/idb";

const champ = "w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none";
const etiquette = "mb-1 block text-xs font-medium text-muted";

// Albums de photos ou de vidéos classés par compétition ou événement, comme sur le site UFOLEP.
export default function MediaAlbums({ type }: { type: TypeMedia }) {
  const mot = type === "photo" ? "photos" : "vidéos";
  const [albums, setAlbums] = useState<AlbumMedia[] | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState(false);
  const [nom, setNom] = useState("");
  const [date, setDate] = useState("");
  const [equipe, setEquipe] = useState("");
  const [club, setClub] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [filtre, setFiltre] = useState("all");

  const charger = useCallback(() => {
    getAlbums(type).then(setAlbums);
  }, [type]);

  useEffect(() => {
    charger();
  }, [charger]);

  const album = albums?.find((a) => a.id === ouvert) ?? null;
  const clubs = useMemo(() => (albums ? Array.from(new Set(albums.map((a) => a.club).filter((c): c is string => !!c))).sort() : []), [albums]);
  const visibles = useMemo(() => (albums ? (filtre === "all" ? albums : albums.filter((a) => a.club === filtre)) : []), [albums, filtre]);

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setOccupe(true);
    try {
      const a = await createAlbum(type, nom, date, equipe, club);
      setNom("");
      setDate("");
      setEquipe("");
      setClub("");
      setFormulaire(false);
      charger();
      setOuvert(a.id);
    } finally {
      setOccupe(false);
    }
  }

  if (album) {
    return (
      <AlbumDetail
        type={type}
        album={album}
        onBack={() => setOuvert(null)}
        onDeleted={() => {
          setOuvert(null);
          charger();
        }}
        onUpdated={charger}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Albums (compétitions / événements)</h2>
        <button type="button" onClick={() => setFormulaire((f) => !f)} className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
          {formulaire ? "Annuler" : "+ Nouvel album"}
        </button>
      </div>

      {clubs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {["all", ...clubs].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFiltre(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                filtre === c ? "border-border-strong bg-surface-alt text-white" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {c === "all" ? "Tous les clubs" : c}
            </button>
          ))}
        </div>
      )}

      {formulaire && (
        <form onSubmit={creer} className="mb-4 space-y-2 rounded-xl border border-border-subtle bg-surface p-4">
          <div>
            <label className={etiquette}>Nom de l’album (ex : Compétition 31 janvier à Rungis, Équipe B3)</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Compétition 31 janvier à Rungis, Équipe B3" className={champ} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex-1">
              <label className={etiquette}>Date (optionnel)</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="31 janvier 2027" className={champ} />
            </div>
            <div className="flex-1">
              <label className={etiquette}>Équipe (optionnel)</label>
              <input value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder="Équipe B3" className={champ} />
            </div>
            <div className="flex-1">
              <label className={etiquette}>Club (optionnel)</label>
              <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Rungis" className={champ} />
            </div>
          </div>
          <button type="submit" disabled={occupe} className="rounded-md bg-accent-solid px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            Créer l’album
          </button>
        </form>
      )}

      {albums === null ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : albums.length === 0 ? (
        <p className="text-sm text-muted">Aucun album pour l’instant. Créez-en un pour commencer à classer vos {mot} par compétition/événement.</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-muted">Aucun album pour ce club.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setOuvert(a.id)}
              className="rounded-xl border border-border-subtle bg-surface-alt/40 p-3 text-left transition-colors hover:border-accent-solid"
            >
              <div className="font-medium text-foreground">{a.name}</div>
              <div className="mt-0.5 text-xs text-muted">{[a.date, a.team, a.club].filter(Boolean).join(" · ") || "Aucune date/équipe/club précisée"}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
