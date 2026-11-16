"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import SortieMp3 from "@/components/SortieMp3";
import { QUALITES, decoderFichier, encoderMp3, nomMp3 } from "@/lib/audio";
import {
  aideDejaInstallee,
  convertirLien,
  demarrerAide,
  etatAide,
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

// « Plus tard » sur la proposition d'installation de l'aide : on ne la repropose plus à l'arrivée sur cet appareil.
const CLE_PLUS_TARD = "ffg:aide-plus-tard";
const DOSSIER_AIDE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/aide`;

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
  // Ordinateur où l'aide peut s'installer : Windows, ou Linux de bureau (pas Android). Ailleurs, rien n'est proposé.
  const [systeme, setSysteme] = useState<"windows" | "linux" | null>(null);
  // L'installation est proposée dès l'arrivée quand l'aide ne répond pas ; « Plus tard » la masque sur cet appareil.
  const [propositionMasquee, setPropositionMasquee] = useState(true);
  // L'utilisateur a téléchargé l'installeur : on affiche les étapes et on guette l'aide.
  const [installation, setInstallation] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSysteme(
      /Windows/.test(ua)
        ? "windows"
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

  // Lance l'aide toute seule (si elle a été installée), sinon explique l'installation.
  async function lancerAide(): Promise<EtatAide | null> {
    setAide("verification");
    const etat = (await etatAide()) ?? (await demarrerAide());
    setAide(etat);
    return etat;
  }

  // À l'ouverture de l'onglet : si l'aide ne répond pas, on la lance toute seule (une seule tentative).
  useEffect(() => {
    let vivant = true;
    (async () => {
      // Lancement automatique seulement si l'aide est déjà installée ici : sinon le système affiche une fenêtre « aucune application ».
      const etat = (await etatAide()) ?? (aideDejaInstallee() ? await demarrerAide() : null);
      if (vivant) setAide(etat);
    })();
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
        if (systeme) masquerProposition(false);
        setMessageLien(
          !systeme
            ? "Les liens YouTube et autres plateformes demandent l’aide locale, qui n’existe que sur un ordinateur Windows ou Linux."
            : etat
              ? "L’aide est lancée mais yt-dlp ou ffmpeg est introuvable sur cet ordinateur : relancez l’installation proposée en haut de ce panneau, puis cliquez de nouveau sur Convertir."
              : "L’aide n’est pas installée sur cet ordinateur, ou ne démarre pas : installez-la avec la proposition en haut de ce panneau, puis cliquez de nouveau sur Convertir.",
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

  return (
    <section className={panneau}>
      <h2 className={titrePanneau}>Convertir en MP3</h2>

      {/* Proposition d'installation de l'aide : affichée dès l'arrivée si l'aide ne répond pas sur cet ordinateur. */}
      {systeme &&
        aide !== "verification" &&
        !aide?.ok &&
        (!propositionMasquee || installation) && (
          <div
            role="status"
            className="mb-4 space-y-2 rounded-lg border border-accent-from/50 bg-surface-alt/40 p-3 text-xs text-muted"
          >
            <p className="text-sm font-semibold text-foreground">
              Installer l’aide pour YouTube et les liens web ?
            </p>
            <p>
              {aide
                ? "L’aide est lancée, mais yt-dlp ou ffmpeg manque sur cet ordinateur : relancez l’installation."
                : "Elle n’est pas installée sur cet ordinateur. Elle sert à convertir en MP3 un lien YouTube ou d’une autre plateforme ; le reste de la page fonctionne sans elle."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={
                  systeme === "windows"
                    ? `${DOSSIER_AIDE}/Installer-aide-musique.cmd`
                    : `${DOSSIER_AIDE}/ffg-aide-musique.deb`
                }
                download
                onClick={() => setInstallation(true)}
                className="accent-gradient inline-block rounded px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                {systeme === "windows"
                  ? "Installer l’aide"
                  : "Installer l’aide (Deepin, Ubuntu, Debian, Mint)"}
              </a>
              {!installation && (
                <button
                  type="button"
                  onClick={() => masquerProposition(true)}
                  className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  Plus tard
                </button>
              )}
            </div>
            {installation && systeme === "windows" && (
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Ouvrez le fichier téléchargé « Installer-aide-musique.cmd ».
                  Si le navigateur hésite à le garder, choisissez « Conserver ».
                </li>
                <li>
                  Si Windows affiche « Windows a protégé votre ordinateur »,
                  cliquez sur « Informations complémentaires » puis « Exécuter
                  quand même ».
                </li>
                <li>
                  Laissez la fenêtre noire travailler jusqu’à « Termine » : elle
                  installe ce qui manque (Windows peut demander votre
                  autorisation) et lance l’aide.
                </li>
                <li>
                  Revenez ici : la page détecte l’aide toute seule. Si le
                  navigateur demande l’accès aux applications de cet appareil,
                  acceptez.
                </li>
              </ol>
            )}
            {installation && systeme === "linux" && (
              <p>
                Double-cliquez sur le fichier téléchargé : le gestionnaire de
                paquets s’ouvre, cliquez sur « Installer » (mot de passe
                demandé). Tout le reste est automatique, et la page détecte
                l’aide toute seule.
              </p>
            )}
            {systeme === "linux" && (
              <p>
                Autre distribution :{" "}
                <a
                  href={`${DOSSIER_AIDE}/Installer-aide-musique-linux.sh`}
                  download
                  onClick={() => setInstallation(true)}
                  className="underline hover:text-foreground"
                >
                  installateur générique
                </a>
                .
              </p>
            )}
            {installation && (
              <p className="flex items-center gap-2 text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-border-strong border-t-accent-from"
                />
                En attente de l’aide…
              </p>
            )}
          </div>
        )}
      {installation && aidePrete && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-border-subtle bg-surface-alt/40 p-3 text-xs text-foreground"
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-success" />
          Aide installée : YouTube et les autres liens sont pris en charge.
        </p>
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
                    onClick={lancerAide}
                    className="accent-gradient-text font-medium underline"
                  >
                    Démarrer l’aide
                  </button>
                )}
                {aide !== "verification" &&
                  !aide?.ok &&
                  systeme &&
                  propositionMasquee &&
                  !installation && (
                    <button
                      type="button"
                      onClick={() => masquerProposition(false)}
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
