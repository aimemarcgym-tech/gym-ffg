"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import InstallerAide from "@/components/InstallerAide";
import SortieMp3 from "@/components/SortieMp3";
import { QUALITES, decoderFichier, encoderMp3, nomMp3 } from "@/lib/audio";
import {
  aideDejaInstallee,
  convertirLien,
  demarrerAide,
  etatAide,
  oublierAideInstallee,
  type EtatAide,
} from "@/lib/aide";
import { formatTaille } from "@/lib/format";
import {
  champ,
  onglets,
  ongletBouton,
  panneau,
  titrePanneau,
} from "@/lib/styles";

interface Element {
  id: string;
  nom: string;
  fichier: Blob;
  statut: "attente" | "encours" | "ok" | "erreur";
  progression: number;
  resultat?: Blob;
  message?: string;
  // Conversion faite par l'aide locale (lien YouTube…) : pas de fichier à relancer.
  lien?: boolean;
}

// Ces sites ne donnent pas de fichier direct : la conversion passe par l'aide locale (yt-dlp + ffmpeg sur l'ordinateur).
const PLATEFORMES =
  /(youtube\.com|youtu\.be|music\.youtube|dailymotion|vimeo|soundcloud|spotify|deezer|tiktok|facebook|instagram)/i;

// « Plus tard » sur la fenêtre d'installation de l'aide : elle ne s'ouvre plus toute seule sur cet appareil.
const CLE_PLUS_TARD = "ffg:aide-plus-tard";

export default function PanneauConversion({
  onCouper,
}: {
  onCouper?: (fichier: File) => void;
}) {
  const [source, setSource] = useState<"fichiers" | "lien">("fichiers");
  const [file, setFile] = useState<Element[]>([]);
  const [qualite, setQualite] = useState<string>("haute");
  const [lien, setLien] = useState("");
  const [messageLien, setMessageLien] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [survol, setSurvol] = useState(false);
  const champFichiers = useRef<HTMLInputElement>(null);
  const [aide, setAide] = useState<EtatAide | null | "verification">(
    "verification",
  );
  const [aideVisible, setAideVisible] = useState(false);
  // Ordinateur où l'aide peut s'installer : Windows, Mac ou Linux de bureau (pas Android, iPhone ni iPad). Ailleurs, rien n'est proposé.
  const [systeme, setSysteme] = useState<"windows" | "mac" | "linux" | null>(
    null,
  );
  // La fenêtre d'installation s'ouvre toute seule sur l'onglet « Lien web » quand l'aide ne répond pas ; « Plus tard » l'en empêche sur cet appareil.
  const [propositionMasquee, setPropositionMasquee] = useState(true);
  // Fermée par l'utilisateur pour cette visite ; ouverte à la main (lien « Installer l'aide », conversion sans aide).
  const [fenetreFermee, setFenetreFermee] = useState(false);
  const [fenetreDemandee, setFenetreDemandee] = useState(false);
  // L'utilisateur a téléchargé l'installeur : on guette l'aide.
  const [installation, setInstallation] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSysteme(
      /Windows/.test(ua)
        ? "windows"
        : // Un iPad en mode « site pour ordinateur » se présente comme un Mac : l'écran tactile le distingue.
          /Macintosh/.test(ua) && navigator.maxTouchPoints <= 1
          ? "mac"
          : /Linux|X11/.test(ua) && !/Android/.test(ua)
            ? "linux"
            : null,
    );
    let masquee = false;
    try {
      masquee = localStorage.getItem(CLE_PLUS_TARD) === "1";
    } catch {
      // stockage indisponible : on propose
    }
    setPropositionMasquee(masquee);
  }, []);

  function masquerProposition(masquee: boolean) {
    setPropositionMasquee(masquee);
    try {
      if (masquee) localStorage.setItem(CLE_PLUS_TARD, "1");
      else localStorage.removeItem(CLE_PLUS_TARD);
    } catch {
      // stockage indisponible : sans conséquence
    }
  }

  // Pendant l'installation : la page détecte l'aide toute seule dès qu'elle répond.
  const aidePrete = aide !== "verification" && !!aide?.ok;
  useEffect(() => {
    if (!installation || aidePrete) return;
    const minuteur = setInterval(async () => {
      const etat = await etatAide();
      if (etat) setAide(etat);
    }, 3000);
    return () => clearInterval(minuteur);
  }, [installation, aidePrete]);

  async function verifierAide() {
    setAide("verification");
    setAide(await etatAide());
  }

  function ouvrirFenetre() {
    setFenetreFermee(false);
    setFenetreDemandee(true);
  }

  function fermerFenetre() {
    setFenetreFermee(true);
    setFenetreDemandee(false);
  }

  // Lance l'aide si elle a été installée sur cet appareil (lien ffg-aide://). Jamais sinon : sans l'aide installée,
  // Windows ouvre une fenêtre « Obtenir une application » qui renvoie vers un Microsoft Store vide.
  async function lancerAide(): Promise<EtatAide | null> {
    setAide("verification");
    let etat = await etatAide();
    // Pas de lancement par lien sur Mac : l'aide y démarre à l'ouverture de la session, et le lien ffg-aide:// n'y existe pas.
    if (!etat && aideDejaInstallee() && systeme !== "mac") {
      etat = await demarrerAide();
      // Le lien est introuvable ou l'aide est cassée : on oublie qu'elle était installée et on repropose l'installation.
      if (!etat) oublierAideInstallee();
    }
    setAide(etat);
    return etat;
  }

  async function demarrerManuellement() {
    const etat = await lancerAide();
    if (!etat?.ok && systeme) ouvrirFenetre();
  }

  // Vérifie l'aide à l'ouverture de la page et à chaque passage sur « Lien web » (rien n'est lancé ici).
  useEffect(() => {
    let vivant = true;
    etatAide().then((e) => vivant && setAide(e));
    return () => {
      vivant = false;
    };
  }, []);

  useEffect(() => {
    if (source !== "lien") return;
    let vivant = true;
    etatAide().then((e) => vivant && setAide(e));
    return () => {
      vivant = false;
    };
  }, [source]);

  const modifier = (id: string, patch: Partial<Element>) =>
    setFile((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  function ajouter(fichiers: File[] | Blob[], noms?: string[]) {
    const nouveaux: Element[] = Array.from(fichiers).map((f, i) => ({
      id: crypto.randomUUID(),
      nom: noms?.[i] ?? (f as File).name,
      fichier: f,
      statut: "attente",
      progression: 0,
    }));
    setFile((l) => [...l, ...nouveaux]);
  }

  function deposer(e: DragEvent) {
    e.preventDefault();
    setSurvol(false);
    const fichiers = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type.startsWith("audio/") ||
        f.type.startsWith("video/") ||
        /\.(mp3|m4a|aac|wav|ogg|opus|flac|wma|mp4|mov|webm|mkv)$/i.test(f.name),
    );
    if (fichiers.length) ajouter(fichiers);
  }

  async function recupererLien() {
    setMessageLien(null);
    const adresse = lien.trim();
    if (!adresse) return;
    if (PLATEFORMES.test(adresse)) {
      setMessageLien("Démarrage de l’aide…");
      const etat = await lancerAide();
      if (!etat?.ok) {
        if (systeme) ouvrirFenetre();
        setMessageLien(
          !systeme
            ? "Les liens YouTube et autres plateformes demandent l’aide locale, qui n’existe que sur un ordinateur Windows, Mac ou Linux."
            : etat
              ? "L’aide est lancée mais yt-dlp ou ffmpeg est introuvable sur cet ordinateur : relancez l’installation proposée dans la fenêtre, puis cliquez de nouveau sur Convertir."
              : "L’aide n’est pas installée sur cet ordinateur, ou ne démarre pas : installez-la avec la fenêtre qui vient de s’ouvrir, puis cliquez de nouveau sur Convertir.",
        );
        return;
      }
      setMessageLien(null);
      convertirViaAide(adresse);
      setLien("");
      return;
    }
    try {
      const reponse = await fetch(adresse);
      if (!reponse.ok) throw new Error(`Réponse ${reponse.status}`);
      const blob = await reponse.blob();
      if (!blob.type.startsWith("audio/") && !blob.type.startsWith("video/")) {
        setMessageLien("Ce lien ne mène pas à un fichier audio ou vidéo.");
        return;
      }
      const nom =
        decodeURIComponent(
          new URL(adresse).pathname.split("/").pop() || "musique",
        ) || "musique";
      ajouter([blob], [nom.includes(".") ? nom : `${nom}.mp3`]);
      setLien("");
      setMessageLien("Fichier récupéré : il est dans la file de conversion.");
    } catch {
      setMessageLien(
        "Impossible de récupérer ce lien (le site n’autorise pas l’accès depuis une autre page, ou l’adresse est incorrecte). Téléchargez le fichier puis déposez-le dans « Fichiers de l’appareil ».",
      );
    }
  }

  async function convertirViaAide(adresse: string) {
    const id = crypto.randomUUID();
    setFile((l) => [
      ...l,
      {
        id,
        nom: adresse,
        fichier: new Blob(),
        statut: "encours",
        progression: 0,
        lien: true,
        message: "Démarrage…",
      },
    ]);
    try {
      const { blob, nom } = await convertirLien(
        adresse,
        QUALITES.find((q) => q.id === qualite)!.kbps,
        (p, message) => modifier(id, { progression: p, message }),
      );
      modifier(id, { statut: "ok", progression: 1, resultat: blob, nom });
    } catch (e) {
      modifier(id, {
        statut: "erreur",
        message: e instanceof Error ? e.message : "La conversion a échoué.",
      });
    }
  }

  async function convertir() {
    setEnCours(true);
    const kbps = QUALITES.find((q) => q.id === qualite)!.kbps;
    for (const e of file.filter(
      (x) => !x.lien && (x.statut === "attente" || x.statut === "erreur"),
    )) {
      modifier(e.id, { statut: "encours", progression: 0, message: undefined });
      try {
        const buffer = await decoderFichier(e.fichier);
        const mp3 = await encoderMp3(
          buffer,
          [{ debut: 0, fin: buffer.duration }],
          kbps,
          (p) => modifier(e.id, { progression: p }),
        );
        modifier(e.id, { statut: "ok", progression: 1, resultat: mp3 });
      } catch {
        modifier(e.id, {
          statut: "erreur",
          message: "Format non reconnu par le navigateur ou fichier abîmé.",
        });
      }
    }
    setEnCours(false);
  }

  const enAttente = file.filter(
    (x) => !x.lien && (x.statut === "attente" || x.statut === "erreur"),
  ).length;

  // Fenêtre d'installation : ouverte d'elle-même sur « Lien web » si l'aide ne répond pas (sauf « Plus tard » ou fermée),
  // ou à la demande ; reste ouverte pendant l'installation pour montrer qu'on attend l'aide, puis qu'elle est prête.
  const fenetreOuverte =
    !!systeme &&
    source === "lien" &&
    !fenetreFermee &&
    (installation ||
      fenetreDemandee ||
      (aide !== "verification" && !aide?.ok && !propositionMasquee));

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Convertir en MP3</h2>

      {/* Fenêtre d'installation de l'aide : s'ouvre sur l'onglet « Lien web » quand l'aide ne répond pas sur cet ordinateur. */}
      {fenetreOuverte && systeme && (
        <InstallerAide
          systeme={systeme}
          telecharge={installation}
          aidePrete={aidePrete}
          onTelecharge={() => setInstallation(true)}
          onPlusTard={() => {
            masquerProposition(true);
            fermerFenetre();
          }}
          onFermer={fermerFenetre}
        />
      )}

      <div className={`${onglets} mb-4`}>
        <button
          onClick={() => setSource("fichiers")}
          className={ongletBouton(source === "fichiers", "flex-1 px-3 py-2.5")}
        >
          📁 Fichiers de l’appareil
        </button>
        <button
          onClick={() => setSource("lien")}
          className={ongletBouton(source === "lien", "flex-1 px-3 py-2.5")}
        >
          🔗 Lien web
        </button>
      </div>

      {source === "fichiers" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
          className={`mb-4 flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center ${survol ? "border-accent-solid bg-accent-from/10" : "border-border-strong bg-surface-alt/40"}`}
        >
          <p className="text-sm text-foreground">
            Déposez vos fichiers ici (MP3, M4A, WAV, OGG, FLAC, MP4, MOV…)
          </p>
          <input
            ref={champFichiers}
            type="file"
            multiple
            accept="audio/*,video/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,.wma,.mp4,.mov,.webm,.mkv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) ajouter(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => champFichiers.current?.click()}
            className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Parcourir…
          </button>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          <label className="block text-xs font-medium tracking-wide text-muted uppercase">
            Adresse de la vidéo ou de la musique
          </label>
          <div className="flex gap-2">
            <input
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && recupererLien()}
              placeholder="https://www.youtube.com/watch?v=…"
              className={champ}
            />
          </div>
          {/* État de l'aide locale : masqué par défaut (le point de couleur suffit), déroulable pour vérifier ou démarrer l'aide. */}
          <button
            type="button"
            onClick={() => setAideVisible((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
            aria-expanded={aideVisible}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${aide === "verification" ? "bg-border-strong" : aide?.ok ? "bg-success" : "bg-danger"}`}
            />
            Aide locale {aideVisible ? "▴" : "▾"}
          </button>
          {aideVisible && (
            <div className="space-y-1 rounded border border-border-subtle bg-surface-alt/40 p-2 text-xs text-muted">
              <p className="flex flex-wrap items-center gap-2">
                {aide === "verification"
                  ? "Recherche de l’aide locale…"
                  : aide?.ok
                    ? "Aide locale détectée : YouTube et autres liens sont pris en charge."
                    : aide
                      ? "Aide locale lancée, mais yt-dlp ou ffmpeg est introuvable."
                      : "Aide locale non lancée : elle est nécessaire pour YouTube et les autres plateformes."}
                {aide !== "verification" && !aide?.ok && (
                  <button
                    type="button"
                    onClick={demarrerManuellement}
                    className="accent-gradient-text font-medium underline"
                  >
                    Démarrer l’aide
                  </button>
                )}
                {aide !== "verification" && !aide?.ok && systeme && (
                  <button
                    type="button"
                    onClick={ouvrirFenetre}
                    className="underline hover:text-foreground"
                  >
                    Installer l’aide
                  </button>
                )}
                <button
                  type="button"
                  onClick={verifierAide}
                  className="underline hover:text-foreground"
                >
                  Vérifier
                </button>
              </p>
              <p>
                Les adresses directes de fichiers (.mp3, .wav, .mp4…)
                fonctionnent sans l’aide, si le site les autorise.
              </p>
            </div>
          )}
          {messageLien && (
            <p className="rounded border border-border-strong bg-surface-alt p-2 text-xs text-foreground">
              {messageLien}
            </p>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
            Qualité
          </label>
          <select
            value={qualite}
            onChange={(e) => setQualite(e.target.value)}
            className={`${champ} sm:w-64`}
          >
            {QUALITES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={
            source === "lien" ? lien.trim() === "" : enCours || enAttente === 0
          }
          onClick={source === "lien" ? recupererLien : convertir}
          className="accent-gradient rounded px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-from/20 hover:opacity-90 disabled:opacity-50"
        >
          {enCours && source === "fichiers"
            ? "Conversion…"
            : `Convertir ➜${source === "fichiers" && enAttente > 0 ? ` (${enAttente})` : ""}`}
        </button>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-foreground">
        File de conversion
      </h3>
      {file.length === 0 ? (
        <p className="text-sm text-muted">Aucune conversion pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {file.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3"
            >
              {e.statut === "ok" && e.resultat ? (
                <SortieMp3
                  blob={e.resultat}
                  nom={nomMp3(e.nom)}
                  onCouper={onCouper}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      title={e.nom}
                    >
                      {e.nom}
                    </p>
                    <p
                      className={`text-xs ${e.statut === "erreur" ? "text-danger" : "text-muted"}`}
                    >
                      {e.statut === "attente" &&
                        `En attente · ${formatTaille(e.fichier.size)}`}
                      {e.statut === "encours" &&
                        `${e.lien ? (e.message ?? "Conversion…") : "Conversion…"} ${Math.round(e.progression * 100)} %`}
                      {e.statut === "erreur" && e.message}
                    </p>
                  </div>
                  {e.statut !== "encours" && (
                    <button
                      type="button"
                      onClick={() =>
                        setFile((l) => l.filter((x) => x.id !== e.id))
                      }
                      className="text-xs text-muted hover:text-danger"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              )}
              {e.statut === "encours" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-border-subtle">
                  <div
                    className="accent-gradient h-full"
                    style={{ width: `${Math.round(e.progression * 100)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
