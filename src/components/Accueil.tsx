"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import EquipeGroupe from "@/components/EquipeGroupe";
import FilieresPanneaux, { type Filiere } from "@/components/FilieresPanneaux";
import {
  createEquipe,
  createGymnaste,
  deleteClub,
  deleteEquipe,
  deleteGymnaste,
  findOrCreateClub,
  getClubs,
  getEquipes,
  getGymnastes,
  getMouvements,
  renameClub,
  setEquipeMembres,
  updateEquipe,
  type Club,
  type Equipe,
  type Gymnaste,
  type Mouvement,
} from "@/lib/data";
import { anneeSaison, anneesCategorie, getCategorie, getNiveau, niveauxDuProgramme, niveauxFed, programmeDe } from "@/regulation/loader";
import { btnDegrade, btnRenommer, champ, etiquette, titreSection, vide } from "@/lib/styles";
import type { Agres, NiveauId } from "@/regulation/types";
import { ConfirmerEnLigne, RenommerEnLigne } from "@/components/EnLigne";
import { createShare } from "@/lib/shares";
import { AGRES } from "@/regulation/libelles";

export default function Accueil() {
  const [renommage, setRenommage] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [gymnastes, setGymnastes] = useState<Gymnaste[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [ouverts, setOuverts] = useState<string[]>([]);
  const [pret, setPret] = useState(false);
  const [filiere, setFiliere] = useState<Filiere>("FEDERAL");

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [club, setClub] = useState("");
  const [equipe, setEquipe] = useState("");
  const [annee, setAnnee] = useState("");
  const [niveau, setNiveau] = useState<NiveauId | null>(null);
  const [categorie, setCategorie] = useState("");

  const charger = useCallback(async () => {
    setClubs(await getClubs());
    setGymnastes(await getGymnastes());
    setEquipes(await getEquipes());
    setMouvements(await getMouvements());
    setPret(true);
  }, []);

  // Lien public d'une équipe : ordre de passage des 4 agrès, catégorie d'âge et mouvements de chaque gymnaste.
  async function partagerEquipe(eq: Equipe, clubNom: string): Promise<string> {
    const membres = eq.gymnasteIds.map((id) => gymnastes.find((g) => g.id === id)).filter((g): g is Gymnaste => !!g);
    const niveau = getNiveau(eq.niveau);
    const cat = getCategorie(eq.niveau, eq.categorieId);
    const ordre = (agres: Agres) => {
      const liste = eq.ordrePassage?.[agres] ?? [];
      const rang = (g: Gymnaste) => (liste.indexOf(g.id) < 0 ? Infinity : liste.indexOf(g.id));
      return [...membres].sort((a, b) => (rang(a) === rang(b) ? 0 : rang(a) < rang(b) ? -1 : 1)).map((g) => `${g.prenom} ${g.nom}`);
    };
    const id = await createShare("equipe", {
      club: clubNom,
      equipe: eq.nom,
      niveau: niveau.label,
      categorie: cat ? { label: cat.label, annees: anneesCategorie(cat) } : null,
      ordres: AGRES.map((a) => ({ agres: a.id, label: a.label, gymnastes: ordre(a.id) })),
      gymnastes: membres.map((g) => ({
        prenom: g.prenom,
        nom: g.nom,
        mouvements: mouvements
          .filter((m) => m.gymnasteId === g.id)
          .sort((a, b) => AGRES.findIndex((x) => x.id === a.agres) - AGRES.findIndex((x) => x.id === b.agres))
          .map((m) => ({ nom: m.nom, agres: m.agres, niveau: m.niveau, elementIds: m.elementIds, bonifIds: m.bonifIds, sauts: m.sauts, series: m.series })),
      })),
    });
    return `/partage/equipe/?id=${id}`;
  }

  useEffect(() => {
    // Lecture du stockage local : impossible côté serveur avec l'export statique.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    try {
      const f = localStorage.getItem("ffg:filiere");
      if (f === "PERFORMANCE" || f === "FEDERAL_B") setFiliere(f);
    } catch {}
  }, [charger]);

  // Le fond de l'accueil change de teinte en Fédéral B (voir globals.css).
  useEffect(() => {
    document.body.dataset.filiere = filiere;
    return () => {
      delete document.body.dataset.filiere;
    };
  }, [filiere]);

  function choisirFiliere(f: Filiere) {
    setFiliere(f);
    try {
      localStorage.setItem("ffg:filiere", f);
    } catch {}
  }

  // Chaque équipe appartient à un programme selon son niveau : A, A2, A3 pour le Fédéral A ; B1, B2, B3 pour le Fédéral B.
  const programme = filiere === "FEDERAL_B" ? "B" : "A";
  const niveauxFiliere = niveauxDuProgramme(programme);
  // Le panneau choisi décide des équipes affichées : Fédéral A = équipes A, A2, A3 ; Fédéral B = B1, B2, B3 ; Performance = aucune pour l'instant.
  const programmeAffiche = filiere === "FEDERAL" ? "A" : filiere === "FEDERAL_B" ? "B" : null;
  const equipesFiliere = programmeAffiche ? equipes.filter((e) => programmeDe(e.niveau) === programmeAffiche) : [];
  const equipesDuProgramme = (p: "A" | "B") => equipes.filter((e) => programmeDe(e.niveau) === p);
  const nbGymnastesProgramme = (p: "A" | "B") => new Set(equipesDuProgramme(p).flatMap((e) => e.gymnasteIds)).size;

  const clubExistant = clubs.find((c) => c.nom.toLowerCase() === club.trim().toLowerCase());
  const equipeExistante = clubExistant
    ? equipesFiliere.find((e) => e.clubId === clubExistant.id && e.nom.toLowerCase() === equipe.trim().toLowerCase())
    : undefined;
  const nouvelleEquipe = equipe.trim() !== "" && !equipeExistante;
  // Niveau et catégorie sont toujours modifiables ; pour une équipe existante ils partent de ses valeurs actuelles.
  const niveauCourant: NiveauId = niveau && niveauxFiliere.some((n) => n.id === niveau) ? niveau : (equipeExistante?.niveau ?? niveauxFiliere[0].id);
  const categories = getNiveau(niveauCourant).categories;
  const categorieBase = equipeExistante && niveauCourant === equipeExistante.niveau ? equipeExistante.categorieId : categories[0].id;
  const categorieValide = categorie && categories.some((c) => c.id === categorie) ? categorie : categorieBase;

  async function creer(e: FormEvent) {
    e.preventDefault();
    const a = parseInt(annee, 10);
    if (!prenom.trim() || !nom.trim() || !club.trim() || !Number.isFinite(a)) return;
    const c = await findOrCreateClub(club.trim());
    const g = await createGymnaste({ clubId: c.id, prenom: prenom.trim(), nom: nom.trim(), anneeNaissance: a });
    if (equipe.trim()) {
      const existante = (await getEquipes(c.id)).find((x) => programmeDe(x.niveau) === programmeAffiche && x.nom.toLowerCase() === equipe.trim().toLowerCase());
      const cible = existante ?? (await createEquipe({ clubId: c.id, nom: equipe.trim(), niveau: niveauCourant, categorieId: categorieValide }));
      if (existante && (existante.niveau !== niveauCourant || existante.categorieId !== categorieValide)) {
        await updateEquipe(existante.id, { niveau: niveauCourant, categorieId: categorieValide });
      }
      await setEquipeMembres(cible.id, [...cible.gymnasteIds, g.id]);
    }
    setPrenom("");
    setNom("");
    setEquipe("");
    setNiveau(null);
    setCategorie("");
    setAnnee("");
    setOuverts((o) => (o.includes(c.id) ? o : [...o, c.id]));
    await charger();
  }

  async function supprimerGymnaste(g: Gymnaste) {
    await deleteGymnaste(g.id);
    await charger();
  }

  const nbMouvements = (gid: string) => mouvements.filter((m) => m.gymnasteId === gid).length;

  function basculer(id: string) {
    setOuverts((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  if (!pret) return <p className="text-sm text-muted">Chargement…</p>;

  const trie = [...clubs].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <div>
      <FilieresPanneaux
        actif={filiere}
        onChoisir={choisirFiliere}
        nbEquipes={equipesDuProgramme("A").length}
        nbGymnastes={nbGymnastesProgramme("A")}
        nbEquipesB={equipesDuProgramme("B").length}
        nbGymnastesB={nbGymnastesProgramme("B")}
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <section className="md:col-span-2">
          <h2 className={titreSection}>Mes gymnastes — classement par club</h2>

          {filiere === "PERFORMANCE" && (
            <div className={vide}>
              <p className="font-semibold text-foreground">Performance : bientôt disponible</p>
              <p className="mt-1">
                Les programmes Performance (Nationale A, B et C, Régionale 7-9 ans) ne sont pas encore saisis. En attendant, tes gymnastes restent enregistrées
                à droite et tu peux les répartir en équipes Fédéral A ou Fédéral B.
              </p>
              <button onClick={() => choisirFiliere("FEDERAL")} className="mt-3 rounded border border-border-strong px-3 py-1.5 text-sm text-foreground hover:border-accent-solid/60">
                Revenir au Fédéral A
              </button>
            </div>
          )}

          {trie.length === 0 && (
            <p className={vide}>Aucune gymnaste enregistrée pour le moment. Ajoutez-en une pour commencer à construire un mouvement.</p>
          )}
          {trie.length > 0 && filiere !== "PERFORMANCE" && equipesFiliere.length === 0 && gymnastes.every((g) => equipes.some((e) => e.gymnasteIds.includes(g.id))) && (
            <p className={vide}>Aucune équipe {filiere === "FEDERAL_B" ? "Fédéral B" : "Fédéral A"} pour le moment. Créez-en une en ajoutant une gymnaste avec un nom d’équipe.</p>
          )}

          <div className="space-y-6">
            {trie.map((c) => {
                const deClub = gymnastes.filter((g) => g.clubId === c.id);
                const equipesClub = equipesFiliere.filter((e) => e.clubId === c.id);
                const ouvert = ouverts.includes(c.id);
                // « Sans équipe » : seulement les gymnastes qui ne sont dans aucune équipe (celles d'une équipe d'un autre programme n'apparaissent pas ici).
                const sansEquipe = deClub.filter((g) => !equipes.some((e) => e.gymnasteIds.includes(g.id)));
                const visibles = deClub.filter((g) => sansEquipe.includes(g) || equipesClub.some((e) => e.gymnasteIds.includes(g.id)));
                // Un club sans rien à montrer dans ce panneau n'est pas affiché.
                if (visibles.length === 0 && equipesClub.length === 0) return null;
                return (
                  <div key={c.id}>
                    <div className="mb-2 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      {renommage === c.id ? (
                        <>
                          <span className="flex items-center gap-2.5 text-base font-semibold text-muted">
                            <span className={ouvert ? "rotate-90" : ""}>▶</span>
                            <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-muted">
                              {visibles.length} gymnaste{visibles.length > 1 ? "s" : ""}
                            </span>
                          </span>
                          <RenommerEnLigne
                            valeur={c.nom}
                            onAnnuler={() => setRenommage(null)}
                            onOk={async (n) => {
                              await renameClub(c.id, n);
                              setRenommage(null);
                              await charger();
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <button onClick={() => basculer(c.id)} aria-expanded={ouvert} className="flex items-center gap-2.5 text-left text-base font-semibold text-muted hover:text-foreground">
                            <span className={`transition-transform ${ouvert ? "rotate-90" : ""}`}>▶</span>
                            {c.nom}
                            <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-muted">
                              {visibles.length} gymnaste{visibles.length > 1 ? "s" : ""}
                            </span>
                          </button>
                          {suppression === c.id ? (
                            <ConfirmerEnLigne
                              question={`Supprimer ${c.nom}${deClub.length ? ` et ses ${deClub.length} gymnaste${deClub.length > 1 ? "s" : ""}` : ""} ?`}
                              onAnnuler={() => setSuppression(null)}
                              onConfirmer={async () => {
                                await deleteClub(c.id);
                                setSuppression(null);
                                await charger();
                              }}
                            />
                          ) : (
                            <>
                              <button onClick={() => setRenommage(c.id)} className={btnRenommer}>
                                Renommer
                              </button>
                              <button onClick={() => setSuppression(c.id)} className={btnRenommer}>
                                Supprimer
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {ouvert && (
                      <div className="space-y-4">
                        {[...equipesClub]
                          .sort((x, y) => niveauxFed.findIndex((n) => n.id === x.niveau) - niveauxFed.findIndex((n) => n.id === y.niveau))
                          .map((eq) => (
                            <EquipeGroupe
                              key={eq.id}
                              equipe={eq}
                              rang={equipesClub.indexOf(eq) + 1}
                              membres={eq.gymnasteIds.map((id) => deClub.find((g) => g.id === id)).filter((g): g is Gymnaste => !!g)}
                              gymnastesClub={deClub}
                              nbMouvements={nbMouvements}
                              onAjouter={async (gid) => {
                                await setEquipeMembres(eq.id, [...eq.gymnasteIds, gid]);
                                await charger();
                              }}
                              onRetirer={async (gid) => {
                                await setEquipeMembres(eq.id, eq.gymnasteIds.filter((x) => x !== gid));
                                await charger();
                              }}
                              onReordonner={async (ids) => {
                                await setEquipeMembres(eq.id, ids);
                                await charger();
                              }}
                              onModifier={async (patch) => {
                                await updateEquipe(eq.id, patch);
                                await charger();
                              }}
                              onSupprimerGymnaste={supprimerGymnaste}
                              onPartager={() => partagerEquipe(eq, c.nom)}
                              onSupprimer={async () => {
                                await deleteEquipe(eq.id);
                                await charger();
                              }}
                            />
                          ))}

                        {sansEquipe.length > 0 && (
                          <EquipeGroupe equipe={null} membres={sansEquipe} gymnastesClub={deClub} nbMouvements={nbMouvements} onSupprimerGymnaste={supprimerGymnaste} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        <section>
          <h2 className={titreSection}>Ajouter une gymnaste</h2>
          <form onSubmit={creer} className="space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
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
              <input value={club} onChange={(e) => setClub(e.target.value)} required list="liste-clubs" className={champ} />
              <datalist id="liste-clubs">
                {clubs.map((c) => (
                  <option key={c.id} value={c.nom} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={etiquette}>Équipe (optionnel)</label>
              <input
                value={equipe}
                onChange={(e) => {
                  setEquipe(e.target.value);
                  setNiveau(null);
                  setCategorie("");
                }}
                list="liste-equipes" placeholder="Ex: Poussines, Équipe A…" className={champ} />
              <datalist id="liste-equipes">
                {equipesFiliere
                  .filter((e) => e.clubId === clubExistant?.id)
                  .map((e) => (
                    <option key={e.id} value={e.nom} />
                  ))}
              </datalist>
            </div>

            {equipe.trim() !== "" && (
              <div className="grid grid-cols-2 gap-3 rounded border border-border-subtle bg-surface-alt/40 p-2">
                <p className="col-span-2 text-xs text-muted">
                  {nouvelleEquipe
                    ? "Nouvelle équipe : choisis son niveau et sa catégorie."
                    : `Équipe existante (${getNiveau(equipeExistante!.niveau).label}) : la gymnaste y sera ajoutée. Tu peux changer son niveau ou sa catégorie ici, la modification s’applique à toute l’équipe.`}
                </p>
                <div>
                  <label className={etiquette}>Niveau</label>
                  <select value={niveauCourant} onChange={(e) => setNiveau(e.target.value as NiveauId)} className={champ}>
                    {niveauxFiliere.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
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
              </div>
            )}

            <div>
              <label className={etiquette}>Année de naissance</label>
              <input value={annee} onChange={(e) => setAnnee(e.target.value)} required type="number" placeholder={String(anneeSaison - 12)} className={champ} />
            </div>
            <button type="submit" className={`${btnDegrade} w-full shadow`}>
              Créer
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
