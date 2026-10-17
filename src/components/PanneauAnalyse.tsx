"use client";

import { useState, type ReactNode } from "react";
import { reglesNiveau, reglesPF } from "@/regulation/loader";
import { fmt } from "@/regulation/libelles";
import { panneau, titrePanneau } from "@/lib/styles";
import type { BonifEtat, NoteD } from "@/engine/federal-a";
import type { Agres, NiveauFed } from "@/regulation/types";

// Même ligne d'analyse que le site UFOLEP : ✓ vert, ⚠ ambre, ✕ rouge, sans encadré.
function Ligne({
  etat,
  children,
  droite,
  onConfirmer,
  confirme,
}: {
  etat: "ok" | "confirmer" | "ko";
  children: ReactNode;
  droite?: ReactNode;
  onConfirmer?: () => void;
  confirme?: boolean;
}) {
  const icone = etat === "ok" ? "✓" : etat === "confirmer" ? "⚠" : "✕";
  const couleur =
    etat === "ok"
      ? "text-success"
      : etat === "confirmer"
        ? "text-warning"
        : "text-danger";
  return (
    <li className={`flex items-center justify-between gap-2 ${couleur}`}>
      <span>
        {icone} {children}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {droite && <span className="text-xs opacity-80">{droite}</span>}
        {onConfirmer && (
          <button
            onClick={onConfirmer}
            className="accent-gradient-text shrink-0 text-xs underline"
          >
            {confirme ? "annuler" : "confirmer"}
          </button>
        )}
      </span>
    </li>
  );
}

function Bloc({
  titre,
  droite,
  children,
}: {
  titre: string;
  droite?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
        <span>{titre}</span>
        {droite}
      </div>
      {children}
    </div>
  );
}

interface Props {
  agres: Agres;
  niveau: NiveauFed;
  nbElements: number;
  noteD: NoteD | null;
  etats: BonifEtat[];
  bonifsRetenues: string[];
  onBonif?: (id: string) => void;
  nbSauts: number;
  d: number;
  dMax: number;
  // Avertissement de composition (par exemple : le sol doit finir par une acrobatie).
  avertissement?: string | null;
  // Identifiants validés à la main (Performance 1 : bonifications sur éléments et saut).
  bonifsChoisies?: string[];
}

export default function PanneauAnalyse(p: Props) {
  const [detail, setDetail] = useState(false);
  const regles = reglesNiveau(p.niveau.id);
  const max = regles.nbElementsMax;
  const nbPoints = regles.pointsParBonification;
  const grille = p.agres !== "SAUT";
  // Performance (1 et 2) : seuls les éléments de valeur 0,10 minimum comptent dans les 8 meilleures valeurs ; les exigences de composition
  // remplacent les bonifications dans la note D ; Performance 1 ajoute des bonifications à la note finale.
  const pf = p.niveau.programme === "PF";
  const pf1 = p.niveau.id === "PF1";
  const nbComptes = pf ? (p.noteD?.elementsRetenus.length ?? 0) : p.nbElements;
  const complet = nbComptes >= max;
  const bonifsFinale = pf1 ? (reglesPF.bonifsElements[p.agres] ?? []) : [];

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Analyse</h2>

      {grille ? (
        <>
          <Bloc
            titre="Composition"
            droite={
              <span className={complet ? "text-success" : "text-muted"}>
                {complet ? "✓ complète" : "incomplète"}
              </span>
            }
          >
            <ul className="space-y-1 text-sm">
              {p.avertissement && <Ligne etat="ko">{p.avertissement}</Ligne>}
              <Ligne etat={complet ? "ok" : "ko"}>
                {Math.min(nbComptes, max)}/{max} élément(s) comptés
                {complet ? "" : ` (encore ${max - nbComptes})`}
              </Ligne>
              {regles.nbElementsMin > 0 && (
                <Ligne
                  etat={p.nbElements >= regles.nbElementsMin ? "ok" : "ko"}
                >
                  {regles.nbElementsMin} éléments minimum
                  {p.nbElements >= regles.nbElementsMin
                    ? ""
                    : ` (${fmt(regles.penaliteMin)} pt si ${regles.nbElementsMin - 1} ou moins)`}
                </Ligne>
              )}
              {pf && p.noteD && (p.agres === "POUTRE" || p.agres === "SOL") && (
                <>
                  <Ligne etat={p.noteD.nbGymRetenus >= 3 ? "ok" : "ko"}>
                    {Math.min(p.noteD.nbGymRetenus, 3)}/3 élément(s) gymnique(s)
                    (valeur 0,10 minimum)
                  </Ligne>
                  <Ligne etat={p.noteD.nbAcroRetenus >= 3 ? "ok" : "ko"}>
                    {Math.min(p.noteD.nbAcroRetenus, 3)}/3 élément(s)
                    acrobatique(s) (valeur 0,10 minimum)
                  </Ligne>
                  <Ligne
                    etat={p.noteD.elementsRetenus.length >= 8 ? "ok" : "ko"}
                  >
                    {Math.max(
                      0,
                      p.noteD.elementsRetenus.length -
                        Math.min(p.noteD.nbGymRetenus, 3) -
                        Math.min(p.noteD.nbAcroRetenus, 3),
                    )}
                    /2 élément(s) au choix
                  </Ligne>
                </>
              )}
              {pf && p.noteD && p.noteD.penalite < 0 && (
                <Ligne etat="ko">
                  Exercice trop court ({p.noteD.nbDistincts} élément(s)) :{" "}
                  {fmt(p.noteD.penalite)} pt sur la note finale
                </Ligne>
              )}
              {!pf && p.nbElements > max && (
                <Ligne etat="confirmer">
                  {p.nbElements - max} élément(s) au-delà de {max} : seuls les
                  plus forts comptent
                </Ligne>
              )}
            </ul>
          </Bloc>

          <Bloc
            titre={pf ? "Exigences de composition" : "Bonifications"}
            droite={
              <span className="text-xs text-muted">
                retenues : {p.noteD?.bonifsRetenues.length ?? 0}/
                {regles.maxBonifications} (+{fmt(nbPoints)} chacune, sans chute)
              </span>
            }
          >
            <ul className="space-y-1 text-sm">
              {p.etats.map(({ def, eligible, manuelle }) => {
                const validee = p.bonifsRetenues.includes(def.id);
                if (validee) {
                  return (
                    <Ligne
                      key={def.id}
                      etat="ok"
                      droite={`+${fmt(nbPoints)}`}
                      onConfirmer={
                        eligible || !p.onBonif
                          ? undefined
                          : () => p.onBonif!(def.id)
                      }
                      confirme
                    >
                      {def.label}
                    </Ligne>
                  );
                }
                if (eligible) {
                  return (
                    <Ligne key={def.id} etat="ok" droite="maximum atteint">
                      {def.label}
                    </Ligne>
                  );
                }
                if (manuelle) {
                  return (
                    <Ligne
                      key={def.id}
                      etat="confirmer"
                      onConfirmer={
                        p.onBonif ? () => p.onBonif!(def.id) : undefined
                      }
                    >
                      {def.label}
                    </Ligne>
                  );
                }
                return (
                  <Ligne key={def.id} etat="ko">
                    {def.label}
                  </Ligne>
                );
              })}
            </ul>
          </Bloc>
        </>
      ) : (
        <Bloc titre="Sauts">
          <ul className="space-y-1 text-sm">
            <Ligne etat={p.nbSauts >= 1 ? "ok" : "ko"}>Un saut choisi</Ligne>
            <Ligne
              etat={p.nbSauts >= 2 ? "ok" : "confirmer"}
              droite="facultatif"
            >
              Un deuxième saut
            </Ligne>
          </ul>
          <p className="mt-1 text-xs text-muted">
            Le meilleur des deux sauts est retenu.
          </p>
        </Bloc>
      )}

      {pf1 && (
        <Bloc
          titre="Bonifications (note finale)"
          droite={
            <span className="text-xs text-muted">
              +{fmt(reglesPF.noteD.pointsParBonif)} chacune ·{" "}
              {p.agres === "SAUT" ? "0,50" : "2,00"} max
            </span>
          }
        >
          <ul className="space-y-1 text-sm">
            {p.noteD && (reglesPF.bonifNoteD[p.agres] ?? []).length > 0 && (
              <Ligne
                etat={p.noteD.bonifsFinale > 0 ? "ok" : "ko"}
                droite={`+${fmt(Math.max(0, p.noteD.bonifsFinale - bonifsFinale.filter((b) => p.bonifsChoisies?.includes(b.id)).length * reglesPF.noteD.pointsParBonif))}`}
              >
                Bonification sur la note D ({fmt(p.d)})
              </Ligne>
            )}
            {bonifsFinale.map((b) => {
              const validee = !!p.bonifsChoisies?.includes(b.id);
              return (
                <Ligne
                  key={b.id}
                  etat={validee ? "ok" : "confirmer"}
                  droite={
                    validee
                      ? `+${fmt(reglesPF.noteD.pointsParBonif)}`
                      : undefined
                  }
                  onConfirmer={p.onBonif ? () => p.onBonif!(b.id) : undefined}
                  confirme={validee}
                >
                  {b.label}
                </Ligne>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-muted">
            Ces bonifications s’ajoutent à la note finale ; elles ne font pas
            partie de la note D.
          </p>
        </Bloc>
      )}

      <div className="accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
        <div className="flex items-center justify-between text-xs text-white/70 uppercase">
          <span>Note de départ</span>
          <span className="text-white/60 normal-case">
            {grille
              ? pf
                ? "Éléments + exigences"
                : "Éléments + bonifications"
              : "Meilleur saut"}
          </span>
        </div>
        <div className="text-3xl font-bold">{fmt(p.d)}</div>
        {p.noteD && (
          <div className="text-xs text-white/85">
            {fmt(p.noteD.totalElements)} éléments +{" "}
            {fmt(p.noteD.totalBonifications)}{" "}
            {pf ? "d’exigences" : "bonifications"}
          </div>
        )}
        <div className="mt-0.5 text-sm font-semibold text-white">
          {fmt(p.d)} / {fmt(p.dMax)} maximum
        </div>
        <div className="text-xs text-white/70">
          {pf
            ? pf1 && p.noteD
              ? `Avec les bonifications de la note finale : +${fmt(p.noteD.bonifsFinale)} (note de départ finale ${fmt(p.d + p.noteD.bonifsFinale)})`
              : "Pas de plafond de la note D"
            : p.noteD?.plafonne
              ? `${fmt(p.noteD.totalElements + p.noteD.totalBonifications)} plafonné à ${fmt(p.niveau.plafondD)} en ${p.niveau.label}`
              : `Plafond ${p.niveau.label} : ${fmt(p.niveau.plafondD)}`}
        </div>
        <div className="text-xs text-white/70">
          Note finale maximale possible : {fmt(p.dMax + 10)} (D {fmt(p.dMax)} +
          exécution 10,00)
        </div>
        {grille && (
          <>
            <button
              onClick={() => setDetail(!detail)}
              className="mt-1 text-xs text-white/90 underline"
            >
              {detail ? "Masquer" : "Détail"} du calcul
            </button>
            {detail && p.noteD && (
              <div className="mt-2 space-y-1 text-xs text-white/85">
                <div>
                  Éléments : {fmt(p.noteD.totalElements)} pt (
                  {p.noteD.elementsRetenus.length} retenus)
                </div>
                <div>
                  Bonifications : {fmt(p.noteD.totalBonifications)} pt (
                  {p.noteD.nbBonifications})
                </div>
                {p.noteD.plafonne && (
                  <div>
                    Plafond {p.niveau.label} : {fmt(p.niveau.plafondD)}, le
                    reste n’est pas compté
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {(p.agres === "POUTRE" || p.agres === "SOL") && !pf && (
        <div className="mt-4 rounded border border-border-subtle bg-surface-alt p-3">
          <h3 className="mb-1.5 text-sm font-semibold text-foreground">
            Partie artistique
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {(p.agres === "POUTRE"
              ? [
                  "Une chorégraphie sur pointes",
                  "Une chorégraphie avec les jambes",
                  "Placement des bras dans les séries gymniques",
                ]
              : [
                  "Port de tête et des bras",
                  "Placement des bras dans les séries gymniques",
                  "Mouvement en relation avec la musique",
                ]
            ).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
