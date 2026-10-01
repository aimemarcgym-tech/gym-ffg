"use client";

import { useState, type FormEvent } from "react";
import { getNiveau, niveauxFed } from "@/regulation/loader";
import { btnContour, btnDegrade, champ, etiquette } from "@/lib/styles";
import type { Equipe } from "@/lib/data";
import type { NiveauId } from "@/regulation/types";

export type CibleEquipe =
  | { type: "existante"; equipeId: string }
  | { type: "nouvelle"; nom: string; niveau: NiveauId; categorieId: string }
  | { type: "aucune" };

interface Props {
  // Équipe modifiée par ce tag, null si la gymnaste n'a encore aucune équipe.
  actuelle: Equipe | null;
  equipesClub: Equipe[];
  // Autres équipes de la gymnaste : elles ne sont pas proposées, elle y est déjà.
  autresEquipesIds: string[];
  onEnregistrer: (c: CibleEquipe) => void;
  onAnnuler: () => void;
}

const NOUVELLE = "__nouvelle__";
const AUCUNE = "__aucune__";

export default function EquipeEditeur({ actuelle, equipesClub, autresEquipesIds, onEnregistrer, onAnnuler }: Props) {
  const [niveau, setNiveau] = useState<NiveauId>(actuelle?.niveau ?? "A");
  const [choix, setChoix] = useState<string>(actuelle?.id ?? NOUVELLE);
  const [nomNouvelle, setNomNouvelle] = useState("");
  const [categorie, setCategorie] = useState("");

  const proposees = equipesClub.filter((e) => e.niveau === niveau && !autresEquipesIds.includes(e.id));
  const categories = getNiveau(niveau).categories;
  const categorieValide = categories.some((c) => c.id === categorie) ? categorie : categories[0].id;
  // Le choix reste valable seulement s'il correspond au niveau affiché.
  const choixValide = choix === NOUVELLE || choix === AUCUNE || proposees.some((e) => e.id === choix) ? choix : (proposees[0]?.id ?? NOUVELLE);

  function valider(e: FormEvent) {
    e.preventDefault();
    if (choixValide === AUCUNE) return onEnregistrer({ type: "aucune" });
    if (choixValide === NOUVELLE) {
      if (!nomNouvelle.trim()) return;
      return onEnregistrer({ type: "nouvelle", nom: nomNouvelle.trim(), niveau, categorieId: categorieValide });
    }
    onEnregistrer({ type: "existante", equipeId: choixValide });
  }

  return (
    <form onSubmit={valider} className="mt-4 space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Niveau et équipe</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={etiquette}>Niveau</label>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value as NiveauId)} className={champ}>
            {niveauxFed.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiquette}>Équipe</label>
          <select value={choixValide} onChange={(e) => setChoix(e.target.value)} className={champ}>
            {proposees.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nom}
              </option>
            ))}
            <option value={NOUVELLE}>Nouvelle équipe…</option>
            <option value={AUCUNE}>Sans équipe</option>
          </select>
        </div>
        {choixValide === NOUVELLE && (
          <>
            <div>
              <label className={etiquette}>Nom de la nouvelle équipe</label>
              <input value={nomNouvelle} onChange={(e) => setNomNouvelle(e.target.value)} required placeholder="Équipe 1" className={champ} />
            </div>
            <div>
              <label className={etiquette}>Catégorie</label>
              <select value={categorieValide} onChange={(e) => setCategorie(e.target.value)} className={champ}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
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
