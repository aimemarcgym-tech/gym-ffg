"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getClubs, getEquipes, type Club, type Equipe } from "@/lib/data";
import { getNiveau, programmeDe } from "@/regulation/loader";
import { STYLE_NIVEAU, couleurEquipe } from "@/lib/styles";
import calendrier from "@/regulation/data/gaf/calendrier-regional.json";
import lieux from "@/regulation/data/gaf/lieux-competitions.json";

type Colonne = (typeof calendrier.colonnes)[number];
type Evenement = (typeof calendrier.evenements)[number] & { texte?: string; dateTexte?: string; nbSemaines?: number };

const evenements = calendrier.evenements as Evenement[];
const { colonnes, semaines } = calendrier;

// Teintes du tableau officiel, assombries pour le thème : carmin = Performance, bleu marine = Fédéral A, bleu = A2/A3, bleu acier = B, vert = date limite d'engagement.
const COULEUR: Record<string, string> = {
  jaune: "bg-[#1d5a47] text-emerald-100 font-semibold",
  rose: "bg-[#7a2c40] text-rose-100",
  "rose-fonce": "bg-[#94364d] text-rose-50",
  marine: "bg-[#0d3250] text-sky-100",
  bleu: "bg-[#0b5470] text-sky-50",
  "bleu-clair": "bg-[#2b4662] text-sky-100",
  neutre: "text-muted",
};
const ENTETE: Record<string, string> = {
  perf: "bg-[#7a2c40] text-rose-100",
  fa: "bg-[#0d2a55] text-sky-100",
  a2a3: "bg-[#0b5470] text-sky-50",
  b: "bg-[#2b4662] text-sky-100",
  neutre: "bg-surface-alt text-foreground",
};

type Competition = (typeof lieux.competitions)[number];

// Lieu d'une compétition du calendrier : même week-end et au moins une colonne en commun.
const lieuxDe = (e: Evenement): Competition | undefined => lieux.competitions.find((c) => c.debut === e.debut && c.colonnes.some((col) => e.colonnes.includes(col)));

const nomColonne = (id: string) => colonnes.find((c) => c.id === id)!;

function dateLisible(debut: string, e: Evenement): string {
  if (e.dateTexte) return e.dateTexte;
  const s = new Date(debut + "T00:00:00");
  const d = new Date(s);
  d.setDate(d.getDate() + 1);
  const jour = (x: Date) => x.toLocaleDateString("fr-FR", { day: "numeric" }).replace(/^1$/, "1er");
  const mois = (x: Date) => x.toLocaleDateString("fr-FR", { month: "long" });
  const annee = d.getFullYear();
  return s.getMonth() === d.getMonth()
    ? `samedi ${jour(s)} et dimanche ${jour(d)} ${mois(d)} ${annee}`
    : `samedi ${jour(s)} ${mois(s)} et dimanche ${jour(d)} ${mois(d)} ${annee}`;
}

// Regroupe les colonnes consécutives qui partagent un même en-tête.
function groupes(section: string) {
  const liste: { groupe: string; style: string; nb: number }[] = [];
  for (const c of colonnes.filter((x) => x.section === section)) {
    const dernier = liste[liste.length - 1];
    if (dernier && dernier.groupe === c.groupe) dernier.nb++;
    else liste.push({ groupe: c.groupe, style: c.style, nb: 1 });
  }
  return liste;
}

const COL_TABLEAU = colonnes.filter((c) => c.section === "EQUIPES" || c.section === "INDIVIDUELLES");
const cellule = "border border-border-subtle px-1 py-1 text-center text-[11px]";

function Tableau() {
  // Pour chaque case : l'évènement qui démarre ici (avec ses fusions) ou « couverte » par un évènement fusionné.
  const plan = useMemo(() => {
    const debut = new Map<string, Evenement>();
    const couvert = new Set<string>();
    const indexCol = (id: string) => colonnes.findIndex((c) => c.id === id);
    for (const e of evenements) {
      const r0 = semaines.findIndex((s) => s.debut === e.debut);
      const c0 = Math.min(...e.colonnes.map(indexCol));
      debut.set(`${r0}:${c0}`, e);
      for (let r = r0; r < r0 + (e.nbSemaines ?? 1); r++)
        for (const id of e.colonnes) if (!(r === r0 && indexCol(id) === c0)) couvert.add(`${r}:${indexCol(id)}`);
    }
    return { debut, couvert };
  }, []);

  const mois = useMemo(() => {
    const l: { nom: string; nb: number }[] = [];
    for (const s of semaines) {
      const d = l[l.length - 1];
      if (d && d.nom === s.mois) d.nb++;
      else l.push({ nom: s.mois, nb: 1 });
    }
    return l;
  }, []);

  const nbEquipes = colonnes.filter((c) => c.section === "EQUIPES").length;
  const nbInd = colonnes.filter((c) => c.section === "INDIVIDUELLES").length;

  return (
    <section className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full min-w-[1100px] border-collapse">
        <thead>
          <tr className="text-xs font-bold tracking-wide uppercase">
            <th colSpan={2} rowSpan={3} className={`${cellule} bg-surface-alt text-foreground`}>
              Version
              <br />
              {calendrier.version}
            </th>
            <th colSpan={nbEquipes} className={`${cellule} bg-surface-alt py-2 text-sm text-foreground`}>
              Équipes
            </th>
            <th colSpan={nbInd} className={`${cellule} bg-surface-alt py-2 text-sm text-foreground`}>
              Individuelles
            </th>
            <th className={`${cellule} bg-surface-alt text-foreground`}>Anim</th>
            <th rowSpan={3} className={`${cellule} bg-surface-alt text-foreground`}>
              HN
            </th>
          </tr>
          <tr className="text-[10px] font-semibold uppercase">
            {["EQUIPES", "INDIVIDUELLES"].flatMap((s) =>
              groupes(s).map((g, i) => (
                <th key={`${s}${i}`} colSpan={g.nb} className={`${cellule} ${ENTETE[g.style]}`}>
                  {g.groupe}
                </th>
              )),
            )}
            <th rowSpan={2} className={`${cellule} bg-surface-alt text-foreground`}>
              Access
            </th>
          </tr>
          <tr className="text-[10px] font-semibold uppercase">
            {COL_TABLEAU.map((c) => (
              <th key={c.id} className={`${cellule} bg-surface text-foreground`}>
                {c.libelle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semaines.map((s, r) => (
            <tr key={s.debut}>
              {(mois.find((m) => m.nom === s.mois) && semaines.findIndex((x) => x.mois === s.mois) === r) && (
                <th rowSpan={mois.find((m) => m.nom === s.mois)!.nb} className={`${cellule} bg-surface text-xs font-bold text-foreground uppercase`}>
                  {s.mois}
                </th>
              )}
              <th className={`${cellule} bg-surface-alt/60 font-bold whitespace-nowrap text-foreground`}>{s.label}</th>
              {colonnes.map((c, ci) => {
                if (plan.couvert.has(`${r}:${ci}`)) return null;
                const e = plan.debut.get(`${r}:${ci}`);
                if (e) {
                  return (
                    <td
                      key={c.id}
                      colSpan={e.colonnes.length}
                      rowSpan={e.nbSemaines}
                      className={`${cellule} ${COULEUR[e.couleur]} ${e.texte === "jaune" ? "!text-yellow-200" : ""} font-semibold whitespace-nowrap`}
                      title={`${e.libelle} — ${dateLisible(e.debut, e)}`}
                    >
                      {e.libelle}
                    </td>
                  );
                }
                return <td key={c.id} className={`${cellule} ${s.grise ? "bg-border-subtle/70" : ""}`} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TableauLieux() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-foreground">{lieux.titre}</h2>
      <p className="mb-3 text-xs font-semibold text-danger">{lieux.avertissement}</p>
      <div className="overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-alt text-left text-xs tracking-wide text-muted uppercase">
              {["Dates", "Intitulé", "Secteur", "Lieux", "Clubs réservistes"].map((t) => (
                <th key={t} className="px-3 py-2 font-semibold">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lieux.competitions.flatMap((c) => {
              const total = c.secteurs.reduce((n, sec) => n + sec.lieux.length, 0);
              let premier = true;
              return c.secteurs.flatMap((sec) =>
                sec.lieux.map((l, k) => {
                  const debutCompetition = premier;
                  premier = false;
                  return (
                    <tr key={`${c.debut}-${sec.secteur}-${l.nom}`} className="border-t border-border-subtle align-top">
                      {debutCompetition && (
                        <>
                          <td rowSpan={total} className="border-r border-border-subtle px-3 py-2 font-semibold text-foreground">
                            {c.dateTexte}
                          </td>
                          <td rowSpan={total} className="border-r border-border-subtle px-3 py-2 text-foreground">
                            {c.intitule}
                            {"remarque" in c && c.remarque ? <div className="text-xs text-muted">({c.remarque})</div> : null}
                          </td>
                        </>
                      )}
                      {k === 0 && (
                        <td rowSpan={sec.lieux.length} className="border-r border-border-subtle px-3 py-2 text-xs text-muted">
                          {sec.secteur}
                        </td>
                      )}
                      <td className={`border-r border-border-subtle px-3 py-2 font-medium ${"recherche" in l && l.recherche ? "bg-danger/20 text-danger" : "text-foreground"}`}>
                        {l.nom}
                        {"note" in l && l.note ? <div className="text-xs font-normal text-muted">({l.note})</div> : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground">
                        {"clubs" in l && l.clubs ? (l.clubs as string[]).join(" · ") : ""}
                        {"noteClubs" in l && l.noteClubs ? <div className="text-muted">({l.noteClubs})</div> : null}
                      </td>
                    </tr>
                  );
                }),
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VerifierEquipe() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [choix, setChoix] = useState("");
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      setClubs(await getClubs());
      setEquipes(await getEquipes());
      const e = new URLSearchParams(window.location.search).get("e");
      if (e) setChoix(e);
      setPret(true);
    })();
  }, []);

  const liste = useMemo(
    () => equipes.map((e) => ({ equipe: e, club: clubs.find((c) => c.id === e.clubId)?.nom ?? "Sans club" })).sort((a, b) => a.equipe.nom.localeCompare(b.equipe.nom, "fr")),
    [equipes, clubs],
  );
  const selection = liste.find((x) => x.equipe.id === choix);
  const niveau = selection ? getNiveau(selection.equipe.niveau) : null;
  // Même couleur que le tag de l'équipe sur l'accueil : son numéro, sinon son rang parmi les équipes du club dans le même programme.
  const couleur = selection
    ? couleurEquipe(
        selection.equipe.nom,
        equipes.filter((x) => x.clubId === selection.equipe.clubId && programmeDe(x.niveau) === programmeDe(selection.equipe.niveau)).indexOf(selection.equipe) + 1,
      )
    : null;
  const parcours = selection ? calendrier.equipes[selection.equipe.niveau as keyof typeof calendrier.equipes] : null;

  const dates = useMemo(() => {
    if (!parcours) return [];
    return evenements
      .filter((e) => e.colonnes.some((c) => parcours.colonnes.includes(c)))
      .sort((a, b) => a.debut.localeCompare(b.debut) || a.libelle.localeCompare(b.libelle));
  }, [parcours]);

  return (
    <div className="max-w-2xl rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Vérifier une équipe</h2>
      {!pret ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted">Aucune équipe trouvée. Créez une équipe depuis l’accueil.</p>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Équipe</label>
          <select
            value={choix}
            onChange={(e) => setChoix(e.target.value)}
            className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
          >
            <option value="">Sélectionner une équipe…</option>
            {liste.map(({ equipe, club }) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nom} ({club}) · {getNiveau(equipe.niveau).label}
              </option>
            ))}
          </select>
        </div>
      )}

      {selection && niveau && parcours && couleur && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">
            Niveau de l’équipe :{" "}
            <span className={`rounded-lg border px-2 py-0.5 font-semibold ${STYLE_NIVEAU[niveau.id]}`}>{niveau.label}</span>
          </p>
          <ul className="space-y-2">
            {dates.map((e, i) => {
              const cibles = e.colonnes.filter((c) => parcours.colonnes.includes(c)).map((c) => nomColonne(c));
              return (
                <li
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${e.genre === "engagement" ? "border-border-subtle bg-background text-white" : `${couleur.border} ${couleur.bg} ${couleur.text}`}`}
                >
                  <div className={`font-medium ${e.genre === "engagement" ? "text-white" : "text-foreground"}`}>{e.libelle}</div>
                  <div className={e.genre === "engagement" ? "text-white" : "text-foreground"}>{dateLisible(e.debut, e)}</div>
                  <div className={`mt-0.5 text-xs ${e.genre === "engagement" ? "text-white/80" : "text-muted"}`}>{cibles.map((c: Colonne) => c.groupe + " · " + c.libelle).join(" — ")}</div>
                  {(() => {
                    const c = lieuxDe(e);
                    if (!c) return null;
                    return (
                      <div className="mt-2 space-y-1 border-t border-border-subtle pt-2 text-xs">
                        <div className="font-semibold text-foreground">📍 Lieu{c.secteurs.reduce((n, x) => n + x.lieux.length, 0) > 1 ? "x" : ""} · {c.intitule}</div>
                        {c.secteurs.map((sec) => (
                          <div key={sec.secteur} className="text-foreground">
                            {sec.secteur !== "Région" && <span className="text-muted">Secteur {sec.secteur} : </span>}
                            {sec.lieux.map((l, k) => (
                              <span key={l.nom}>
                                {k > 0 && " · "}
                                <span className={"recherche" in l && l.recherche ? "text-danger" : ""}>{l.nom}</span>
                                {"note" in l && l.note ? <span className="text-muted"> ({l.note})</span> : null}
                                {"clubs" in l && l.clubs ? <span className="text-muted"> — clubs réservistes : {(l.clubs as string[]).join(", ")}</span> : null}
                              </span>
                            ))}
                          </div>
                        ))}
                        <div className="text-muted">{lieux.avertissement}</div>
                      </div>
                    );
                  })()}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CalendrierRegional() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Calendrier des compétitions</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            GAF — Saison {calendrier.saison} — {calendrier.source}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] space-y-8 px-6 py-10">
        <div className="rounded-xl border border-border-strong bg-surface-alt/50 p-4 text-sm text-muted">
          Calendrier régional Île-de-France, reproduit à l’identique. DL : date limite · Dép : départemental · ID : interdépartemental · Rég : régional. Les semaines grisées n’ont pas de compétition.
          Choisissez une équipe pour connaître les dates et les lieux de ses compétitions.
        </div>
        <VerifierEquipe />
        <Tableau />
        <TableauLieux />
      </main>
    </div>
  );
}
