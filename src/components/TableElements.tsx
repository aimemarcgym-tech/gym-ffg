"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bonifsElement } from "@/engine/federal-a";
import { AGRES, LIBELLE_APPEL, LIBELLE_FAMILLE, ORDRE_APPEL, fmt, fmtValeur } from "@/regulation/libelles";
import { getElementsFedA, getElementsFedB, sautsFedA, sautsFedB } from "@/regulation/loader";
import type { Agres, ElementFedA, Programme } from "@/regulation/types";

const th = "px-4 py-2 font-semibold";

function Ligne({ e }: { e: ElementFedA }) {
  // Fédéral B : les bonifications se valident avec un élément C en B1, un élément B en B2 et B3.
  const bonus = bonifsElement(e, e.grille === "B" ? (e.valeur >= 0.8 ? "B1" : "B2") : "A");
  return (
    <tr className="border-t border-border-subtle">
      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap text-foreground">{e.id}</td>
      <td className="px-4 py-2 text-foreground">
        {e.nom}
        {!e.verified && <span className="ml-1.5 text-xs text-warning">⚠ à confirmer</span>}
        {e.sortie && <span className="ml-1.5 rounded-full border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">Sortie</span>}
        {e.interditB3 && <span className="ml-1.5 rounded-full border border-red-400/40 bg-red-400/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300">Interdit en B3</span>}
        {bonus.length > 0 && (
          <span
            title={`Sert la bonification : ${bonus.map((b) => b.label).join(" ; ")}`}
            className="ml-1.5 rounded-full border border-accent-solid/40 bg-accent-from/10 px-1.5 py-0.5 text-[10px] font-medium text-white"
          >
            Bonus · {[...new Set(bonus.map((b) => b.court))].join(" · ")}
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold text-foreground">{fmtValeur(e)}</span>
      </td>
    </tr>
  );
}

function Entete({ colonnes }: { colonnes: string[] }) {
  return (
    <thead>
      <tr className="bg-surface-alt text-left text-xs tracking-wide text-muted uppercase">
        {colonnes.map((c, i) => (
          <th key={c} className={`${th} ${i === 0 ? "w-28" : i === 1 ? "min-w-[420px]" : "w-28"}`}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Section({ titre, souligne, children }: { titre: string; souligne: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-border-subtle">
      <div className="border-b border-border-subtle bg-surface-alt/50 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{titre}</h2>
        <p className="text-xs text-muted">{souligne}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

// Tous les éléments du référentiel par agrès puis par catégorie, avec leur valeur et leurs tags : même page que la table UFOLEP.
export default function TableElements() {
  const [agres, setAgres] = useState<Agres>("SOL");
  const [programme, setProgramme] = useState<Programme>("A");

  const sautsB = useMemo(() => {
    const lignes = new Map<string, { nom: string; valeurs: Record<string, number> }>();
    for (const s of sautsFedB) {
      const cle = s.nom;
      const l = lignes.get(cle) ?? { nom: s.nom, valeurs: {} };
      l.valeurs[s.niveaux![0]] = s.valeurTremplin;
      lignes.set(cle, l);
    }
    return [...lignes.values()];
  }, []);

  const familles = useMemo(() => {
    if (agres === "SAUT") return [];
    const elements = programme === "B" ? getElementsFedB(agres) : getElementsFedA(agres);
    return [...new Set(elements.map((e) => e.famille))].map((f) => ({
      id: f,
      elements: elements.filter((e) => e.famille === f).sort((a, b) => a.valeur - b.valeur || a.id.localeCompare(b.id)),
    }));
  }, [agres, programme]);

  return (
    <>
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="accent-gradient-text text-sm font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Table des éléments</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Tous les éléments du Fédéral {programme}, par agrès et par catégorie, avec leur valeur et leurs tags.</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">Sortie</span>
              Élément de sortie
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-full border border-accent-solid/40 bg-accent-from/10 px-1.5 py-0.5 text-[10px] font-medium text-white">Bonus</span>
              Sert une bonification
            </span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {(["A", "B"] as Programme[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProgramme(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                programme === p ? "border-accent-solid bg-accent-from/10 text-white" : "border-border-strong bg-surface-alt text-muted hover:text-foreground"
              }`}
            >
              Fédéral {p}
            </button>
          ))}
        </div>
        {programme === "B" && (
          <p className="text-xs text-muted">Grille commune à B1, B2 et B3 (Île-de-France). Les éléments C (0,80) sont réservés au B1 ; certains éléments aux barres sont interdits en B3.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {AGRES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAgres(a.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                agres === a.id ? "border-border-strong bg-surface-alt text-white" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {agres === "SAUT" && programme === "B" ? (
            <Section titre="Sauts" souligne="Une seule note D par niveau, avec tremplin ou trampo-tremp · le meilleur des deux sauts est pris en compte">
              <table className="min-w-[600px] border-collapse text-sm">
                <Entete colonnes={["Nom", "Fédéral B1", "Fédéral B2", "Fédéral B3"]} />
                <tbody>
                  {sautsB.map((s) => (
                    <tr key={s.nom} className="border-t border-border-subtle">
                      <td className="min-w-[420px] px-4 py-2 text-foreground">{s.nom}</td>
                      {["B1", "B2", "B3"].map((n) => (
                        <td key={n} className="px-4 py-2">
                          {s.valeurs[n] !== undefined ? (
                            <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold text-foreground">{fmt(s.valeurs[n])}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : agres === "SAUT" ? (
            <Section titre="Sauts" souligne={`${sautsFedA.length} sauts · le meilleur des deux sauts est pris en compte`}>
              <table className="min-w-[600px] border-collapse text-sm">
                <Entete colonnes={["Niveaux", "Nom", "Trampo-tremp", "1 tremplin"]} />
                <tbody>
                  {sautsFedA.map((s) => (
                    <tr key={s.id} className="border-t border-border-subtle">
                      <td className="px-4 py-2 text-xs whitespace-nowrap text-foreground">{s.niveaux?.map((n) => (n === "A" ? "Fédéral A" : n)).join(" · ")}</td>
                      <td className="px-4 py-2 text-foreground">{s.nom}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold text-foreground">{fmt(s.valeurTrampoTremp)}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold text-foreground">{fmt(s.valeurTremplin)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : (
            familles.map((f) => {
              const parAppel = f.elements.some((e) => e.appel);
              return (
                <Section key={f.id} titre={LIBELLE_FAMILLE[f.id] ?? f.id} souligne={`${f.elements.length} élément${f.elements.length > 1 ? "s" : ""}`}>
                  <table className="min-w-[600px] border-collapse text-sm">
                    <Entete colonnes={["Code", "Nom", "Valeur"]} />
                    <tbody>
                      {parAppel
                        ? [...ORDRE_APPEL, undefined].map((ap) => {
                            const groupe = f.elements.filter((e) => e.appel === ap);
                            if (!groupe.length) return null;
                            return [
                              ap && (
                                <tr key={`t-${ap}`} className="border-t border-border-subtle bg-surface-alt/30">
                                  <td colSpan={3} className="px-4 py-1.5 text-xs font-semibold text-foreground">
                                    {LIBELLE_APPEL[ap]}
                                  </td>
                                </tr>
                              ),
                              ...groupe.map((e) => <Ligne key={e.id} e={e} />),
                            ];
                          })
                        : f.elements.map((e) => <Ligne key={e.id} e={e} />)}
                    </tbody>
                  </table>
                </Section>
              );
            })
          )}
        </div>
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed right-6 bottom-6 rounded-full border border-border-strong bg-surface-alt px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:border-accent-solid/60 hover:bg-accent-from/10"
      >
        ↑ Retour en haut
      </button>
    </>
  );
}
