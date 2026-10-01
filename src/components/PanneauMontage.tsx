"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SortieMp3 from "@/components/SortieMp3";
import { QUALITES, chargerBip, decoderFichier, encoderMp3, formaterTemps, fusionner, lireTemps, nomMp3, passagesConserves, pics, type Segment } from "@/lib/audio";
import { champ, panneau, titrePanneau } from "@/lib/styles";

const HAUTEUR = 96;
const bouton = "rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-solid disabled:opacity-50";

export default function PanneauMontage({ aCouper }: { aCouper?: { cle: number; fichier: File } | null }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [forme, setForme] = useState<number[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [retraits, setRetraits] = useState<Segment[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [position, setPosition] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [qualite, setQualite] = useState<string>("haute");
  const [avecBip, setAvecBip] = useState(false);
  const [encours, setEncours] = useState(false);
  const [progression, setProgression] = useState(0);
  const [resultat, setResultat] = useState<Blob | null>(null);
  const [largeur, setLargeur] = useState(600);

  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const conteneur = useRef<HTMLDivElement>(null);
  const champFichier = useRef<HTMLInputElement>(null);
  const conteneurPanneau = useRef<HTMLElement>(null);
  const glissant = useRef<"A" | "B" | "L" | null>(null);
  const duree = buffer?.duration ?? 0;
  const fusion = useMemo(() => fusionner(retraits), [retraits]);
  const conserves = useMemo(() => passagesConserves(duree, retraits), [duree, retraits]);
  const dureeConservee = conserves.reduce((t, s) => t + (s.fin - s.debut), 0);
  // Curseur de lecture : utile pour poser A ou B ; masqué quand les deux sont posés, sauf pendant l'écoute.
  const curseurVisible = !(lireTemps(a) !== null && lireTemps(b) !== null) || lecture;

  const choisir = useCallback(async (f: File) => {
    setFichier(f);
    setBuffer(null);
    setForme([]);
    setRetraits([]);
    setA("");
    setB("");
    setResultat(null);
    setMessage(null);
    setErreur(null);
    setPosition(0);
    setLecture(false);
    setChargement(true);
    try {
      const decode = await decoderFichier(f);
      setBuffer(decode);
      setForme(pics(decode, 1200));
    } catch {
      setErreur("Ce fichier n’a pas pu être lu par le navigateur (format non pris en charge ou fichier abîmé). Essayez d’abord la conversion en MP3.");
    } finally {
      setChargement(false);
    }
  }, []);

  // Musique envoyée depuis le panneau de conversion : elle est chargée ici, prête à être coupée.
  useEffect(() => {
    if (!aCouper) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void choisir(aCouper.fichier);
    conteneurPanneau.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aCouper, choisir]);

  // Remet le panneau à zéro : morceau, repères A et B, retraits et résultat sont effacés.
  function reinitialiser() {
    audio.current?.pause();
    setFichier(null);
    setBuffer(null);
    setForme([]);
    setUrl(null);
    setRetraits([]);
    setA("");
    setB("");
    setMessage(null);
    setErreur(null);
    setResultat(null);
    setPosition(0);
    setLecture(false);
    setChargement(false);
  }

  useEffect(() => {
    if (!fichier) return;
    const u = URL.createObjectURL(fichier);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [fichier]);

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setLargeur(Math.max(200, Math.floor(el.clientWidth))));
    observer.observe(el);
    setLargeur(Math.max(200, Math.floor(el.clientWidth)));
    return () => observer.disconnect();
  }, [buffer]);

  // Lecture de l'aperçu : les passages retirés sont sautés, comme dans le montage final.
  useEffect(() => {
    if (!lecture) return;
    let id = 0;
    const boucle = () => {
      const el = audio.current;
      if (el) {
        const saut = fusion.find((r) => el.currentTime >= r.debut && el.currentTime < r.fin);
        if (saut) el.currentTime = saut.fin;
        setPosition(el.currentTime);
      }
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [lecture, fusion]);

  // Forme d'onde : passages retirés en rouge, repères A et B, curseur de lecture.
  useEffect(() => {
    const c = canvas.current;
    if (!c || forme.length === 0 || duree === 0) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = largeur * dpr;
    c.height = HAUTEUR * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, largeur, HAUTEUR);
    const x = (t: number) => (t / duree) * largeur;
    const gradient = g.createLinearGradient(0, 0, largeur, 0);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#ec4899");
    g.fillStyle = gradient;
    const barre = largeur / forme.length;
    forme.forEach((p, i) => {
      const h = Math.max(1, p * (HAUTEUR - 6));
      g.fillRect(i * barre, (HAUTEUR - h) / 2, Math.max(1, barre - 0.5), h);
    });
    g.fillStyle = "rgba(239,68,68,0.45)";
    for (const r of fusion) g.fillRect(x(r.debut), 0, x(r.fin) - x(r.debut), HAUTEUR);
    const repere = (t: number | null, couleur: string, lettre: string) => {
      if (t === null || t < 0 || t > duree) return;
      g.fillStyle = couleur;
      g.fillRect(x(t) - 1, 0, 2, HAUTEUR);
      // Poignée : petit carré avec la lettre, en haut du trait ; on l'attrape (ou le trait lui-même) pour déplacer le repère.
      g.fillRect(x(t) - 8, 0, 16, 16);
      g.fillStyle = "#0a0a10";
      g.font = "bold 11px sans-serif";
      g.textAlign = "center";
      g.fillText(lettre, x(t), 12);
      g.textAlign = "start";
    };
    repere(lireTemps(a), "#facc15", "A");
    repere(lireTemps(b), "#22d3ee", "B");
    if (curseurVisible) {
      g.fillStyle = "#ffffff";
      g.fillRect(x(position) - 1, 0, 2, HAUTEUR);
      // Poignée du curseur : carré blanc avec un triangle de lecture, à attraper pour se déplacer dans le morceau.
      g.fillRect(x(position) - 8, 0, 16, 16);
      g.fillStyle = "#0a0a10";
      g.beginPath();
      g.moveTo(x(position) - 2.5, 3.5);
      g.lineTo(x(position) + 3.5, 8);
      g.lineTo(x(position) - 2.5, 12.5);
      g.closePath();
      g.fill();
    }
  }, [forme, fusion, duree, largeur, a, b, position, curseurVisible]);

  function aller(t: number) {
    if (audio.current) audio.current.currentTime = t;
    setPosition(t);
  }

  const tempsDepuis = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(duree, ((e.clientX - r.left) / r.width) * duree));
  };

  // Repère (A, B ou curseur de lecture « L ») sous le pointeur, à quelques pixels près ; A et B gagnent à distance égale.
  function repereSous(e: React.PointerEvent<HTMLCanvasElement>): "A" | "B" | "L" | null {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (texte: string) => {
      const t = lireTemps(texte);
      return t === null || t < 0 || t > duree ? null : (t / duree) * r.width;
    };
    const x = e.clientX - r.left;
    const pa = px(a);
    const pb = px(b);
    const da = pa === null ? Infinity : Math.abs(pa - x);
    const db = pb === null ? Infinity : Math.abs(pb - x);
    const dl = curseurVisible ? Math.abs((position / duree) * r.width - x) : Infinity;
    if (Math.min(da, db, dl) > 9) return null;
    if (dl < Math.min(da, db)) return "L";
    return da <= db ? "A" : "B";
  }

  function appuyerForme(e: React.PointerEvent<HTMLCanvasElement>) {
    const repere = repereSous(e);
    if (repere) {
      glissant.current = repere;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    aller(tempsDepuis(e));
  }

  function bougerForme(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!glissant.current) {
      e.currentTarget.style.cursor = repereSous(e) ? "ew-resize" : "pointer";
      return;
    }
    let t = tempsDepuis(e);
    if (glissant.current === "L") return aller(t);
    // A reste avant B et B après A.
    const autre = lireTemps(glissant.current === "A" ? b : a);
    if (autre !== null) t = glissant.current === "A" ? Math.min(t, autre - 0.1) : Math.max(t, autre + 0.1);
    (glissant.current === "A" ? setA : setB)(formaterTemps(Math.max(0, t)));
  }

  function lacherForme(e: React.PointerEvent<HTMLCanvasElement>) {
    glissant.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function basculerLecture() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  const lireAB = useCallback((): Segment | null => {
    const debut = lireTemps(a);
    const fin = lireTemps(b);
    if (debut === null || fin === null || fin <= debut) {
      setMessage("Indiquez un début (A) et une fin (B) valides, avec B après A (ex. 1:00 et 1:30).");
      return null;
    }
    return { debut: Math.max(0, debut), fin: Math.min(duree, fin) };
  }, [a, b, duree]);

  function retirer(segment?: Segment) {
    const s = segment ?? lireAB();
    if (!s) return;
    setRetraits((l) => [...l, s]);
    setResultat(null);
    setMessage(`Passage retiré : ${formaterTemps(s.debut)} → ${formaterTemps(s.fin)}.`);
  }

  function garder() {
    const s = lireAB();
    if (!s) return;
    setRetraits([{ debut: 0, fin: s.debut }, { debut: s.fin, fin: duree }]);
    setResultat(null);
    setMessage(`Seul le passage ${formaterTemps(s.debut)} → ${formaterTemps(s.fin)} est conservé.`);
  }

  async function creer() {
    if (!buffer || !fichier) return;
    setEncours(true);
    setResultat(null);
    setProgression(0);
    try {
      const prefixe = avecBip ? await chargerBip() : undefined;
      setResultat(await encoderMp3(buffer, conserves, QUALITES.find((q) => q.id === qualite)!.kbps, setProgression, prefixe));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Le montage a échoué.");
    } finally {
      setEncours(false);
    }
  }

  return (
    <section ref={conteneurPanneau} className={panneau}>
      <h2 className={titrePanneau}>✂ Couper une musique</h2>
      <p className="mb-3 text-xs text-muted">
        Choisissez un morceau, délimitez un passage avec A et B, puis retirez-le : le début et la fin se recollent. Exemple : A = 1:00 et B = 1:30 retire la minute à une minute trente. Plusieurs retraits sont possibles ; seuls
        les passages conservés sont assemblés.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 truncate rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground">{fichier ? fichier.name : "Aucun fichier choisi — cliquez sur Parcourir…"}</div>
        <input ref={champFichier} type="file" accept="audio/*,video/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,.mp4,.mov,.webm" className="hidden" onChange={(e) => e.target.files?.[0] && choisir(e.target.files[0])} />
        <button type="button" onClick={() => champFichier.current?.click()} className={bouton}>
          Parcourir…
        </button>
        <button type="button" disabled={!fichier} onClick={reinitialiser} className={bouton} title="Efface le morceau et toute la sélection">
          ↺ Reset
        </button>
      </div>

      {chargement && <p className="text-sm text-muted">Analyse du fichier…</p>}
      {erreur && <p className="text-sm text-danger">{erreur}</p>}

      {buffer && url && (
        <div className="space-y-4">
          <audio ref={audio} src={url} preload="auto" onPlay={() => setLecture(true)} onPause={() => setLecture(false)} onEnded={() => setLecture(false)} />

          <div ref={conteneur}>
            <canvas
              ref={canvas}
              onPointerDown={appuyerForme}
              onPointerMove={bougerForme}
              onPointerUp={lacherForme}
              onPointerCancel={lacherForme}
              style={{ width: "100%", height: HAUTEUR, touchAction: "none" }}
              className="cursor-pointer rounded border border-border-subtle bg-surface-alt"
              aria-label="Forme d’onde : cliquez pour vous placer, glissez les repères A et B pour les déplacer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>0:00</span>
              <span>{formaterTemps(duree)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={basculerLecture} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs text-background" title={lecture ? "Pause" : "Écouter (les passages retirés sont sautés)"}>
              {lecture ? "❚❚" : "▶"}
            </button>
            <span className="text-xs text-muted">Position : {formaterTemps(position)}</span>
            <button type="button" onClick={() => setA(formaterTemps(position))} className={bouton}>
              ⇤ Marquer A
            </button>
            <button type="button" onClick={() => setB(formaterTemps(position))} className={bouton}>
              Marquer B ⇥
            </button>
            <button type="button" disabled={!a && !b} onClick={() => { setA(""); setB(""); }} className={bouton} title="Efface les repères A et B (les passages déjà retirés restent)">
              ↺ Reset
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              Début (A)
              <input value={a} onChange={(e) => setA(e.target.value)} placeholder="ex. 1:00" className={`${champ} max-w-[8rem]`} />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              Fin (B)
              <input value={b} onChange={(e) => setB(e.target.value)} placeholder="ex. 1:30" className={`${champ} max-w-[8rem]`} />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => retirer()} className="accent-gradient rounded px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              ✂ Retirer la sélection A–B
            </button>
            <button type="button" onClick={garder} className={bouton}>
              Garder uniquement la sélection
            </button>
            <button type="button" disabled={retraits.length === 0} onClick={() => setRetraits((l) => l.slice(0, -1))} className={bouton}>
              ↶ Annuler le dernier retrait
            </button>
            <button type="button" disabled={retraits.length === 0} onClick={() => setRetraits([])} className={bouton}>
              ↺ Tout réafficher
            </button>
          </div>

          {message && <p className="text-xs text-muted">{message}</p>}

          <p className="text-sm text-foreground">
            Durée conservée : <span className="font-semibold">{formaterTemps(dureeConservee)}</span> <span className="text-xs text-muted">sur {formaterTemps(duree)}</span>
            {fusion.length > 0 && <span className="text-xs text-muted"> · {fusion.length} passage{fusion.length > 1 ? "s" : ""} retiré{fusion.length > 1 ? "s" : ""}</span>}
          </p>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={avecBip} onChange={(e) => setAvecBip(e.target.checked)} />
            Ajouter un bip au début de la musique
            <span className="text-xs text-muted">(à cocher seulement si la musique n’en a pas déjà un)</span>
          </label>

          {conserves.length === 0 && (
            <p className="rounded border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
              Il ne reste plus rien à conserver : tout le morceau a été retiré. Cliquez sur « Annuler le dernier retrait » ou « Tout réafficher » pour pouvoir créer le montage.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              Qualité
              <select value={qualite} onChange={(e) => setQualite(e.target.value)} className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none">
                {QUALITES.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" disabled={encours || conserves.length === 0} onClick={creer} className="accent-gradient rounded px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-from/20 hover:opacity-90 disabled:opacity-50">
              {encours ? `Création… ${Math.round(progression * 100)} %` : "✂ Créer le montage ➜"}
            </button>
          </div>

          {resultat && fichier && (
            <div className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
              <SortieMp3 blob={resultat} nom={nomMp3(fichier.name, " (montage)")} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
