"use client";

import { useState, type FormEvent } from "react";
import { anneeSaison } from "@/regulation/loader";
import { btnContour, btnDegrade, champ, etiquette } from "@/lib/styles";
import type { Club, Gymnaste } from "@/lib/data";

export interface ProfilModifie {
  prenom: string;
  nom: string;
  anneeNaissance: number;
  clubNom: string;
}

interface Props {
  gymnaste: Gymnaste;
  club: Club | null;
  clubs: Club[];
  onEnregistrer: (v: ProfilModifie) => void;
  onAnnuler: () => void;
}

export default function ProfilEditeur({ gymnaste, club, clubs, onEnregistrer, onAnnuler }: Props) {
  const [prenom, setPrenom] = useState(gymnaste.prenom);
  const [nom, setNom] = useState(gymnaste.nom);
  const [annee, setAnnee] = useState(String(gymnaste.anneeNaissance));
  const [clubNom, setClubNom] = useState(club?.nom ?? "");

  const change = clubNom.trim().toLowerCase() !== (club?.nom ?? "").toLowerCase();

  function valider(e: FormEvent) {
    e.preventDefault();
    const a = parseInt(annee, 10);
    if (!prenom.trim() || !nom.trim() || !clubNom.trim() || !Number.isFinite(a)) return;
    onEnregistrer({ prenom: prenom.trim(), nom: nom.trim(), anneeNaissance: a, clubNom: clubNom.trim() });
  }

  return (
    <form onSubmit={valider} className="mt-4 space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Modifier le profil</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={etiquette}>Prénom</label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required className={champ} />
        </div>
        <div>
          <label className={etiquette}>Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required className={champ} />
        </div>
        <div>
          <label className={etiquette}>Club</label>
          <input value={clubNom} onChange={(e) => setClubNom(e.target.value)} required list="clubs-profil" className={champ} />
          <datalist id="clubs-profil">
            {clubs.map((c) => (
              <option key={c.id} value={c.nom} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={etiquette}>Année de naissance</label>
          <input value={annee} onChange={(e) => setAnnee(e.target.value)} required type="number" placeholder={String(anneeSaison - 12)} className={champ} />
        </div>
      </div>
      {change && <p className="text-xs text-warning">⚠ Changer de club retire la gymnaste de ses équipes actuelles.</p>}
      <div className="flex gap-2">
        <button type="submit" className={btnDegrade}>
          Enregistrer
        </button>
        <button type="button" onClick={onAnnuler} className={btnContour}>
          Annuler
        </button>
      </div>
    </form>
  );
}
