"use client";

import { useEffect } from "react";

const DOSSIER_AIDE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/aide`;

// Boîte de dialogue qui explique l'aide « Faire ces musiques » et fait télécharger, en une fois, tout ce qu'il faut pour l'installer.
// Les fichiers sont gardés sur le site (public/aide) : l'installeur Windows télécharge ensuite le reste (Node.js, yt-dlp, ffmpeg) tout seul.
export default function InstallerAide({
  systeme,
  telecharge,
  aidePrete,
  onTelecharge,
  onPlusTard,
  onFermer,
}: {
  systeme: "windows" | "mac" | "linux";
  // Le fichier d'installation a été téléchargé : on attend que l'aide réponde.
  telecharge: boolean;
  aidePrete: boolean;
  onTelecharge: () => void;
  onPlusTard: () => void;
  onFermer: () => void;
}) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-installer-aide"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border-strong bg-surface p-5 text-sm text-muted shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id="titre-installer-aide"
            className="text-base font-semibold text-foreground"
          >
            Installer l’aide pour YouTube et les liens web
          </h3>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="text-lg leading-none text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        {aidePrete ? (
          <>
            <p className="flex items-center gap-2 text-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
              Aide installée : YouTube et les autres liens sont pris en charge.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onFermer}
                className="accent-gradient rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Pour convertir en MP3 un lien YouTube ou d’une autre plateforme,
              l’application a besoin d’un petit programme sur cet ordinateur.
              Le reste de la page fonctionne sans lui.
            </p>

            {systeme === "windows" ? (
              <>
                <div>
                  <p className="mb-1 font-medium text-foreground">
                    Ce qui sera installé, une seule fois
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5">
                    <li>Node.js, yt-dlp et ffmpeg, s’ils manquent sur l’ordinateur.</li>
                    <li>
                      L’aide elle-même : elle démarre ensuite toute seule avec
                      Windows, sans fenêtre.
                    </li>
                  </ul>
                </div>
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>
                    Cliquez sur « Télécharger l’installeur » ci-dessous. Si le
                    navigateur hésite à garder le fichier, choisissez «
                    Conserver ».
                  </li>
                  <li>
                    Ouvrez « Installer-aide-musique.cmd ». Si Windows affiche «
                    Windows a protégé votre ordinateur », cliquez sur «
                    Informations complémentaires » puis « Exécuter quand même ».
                  </li>
                  <li>
                    Une fenêtre d’avancement s’ouvre et reste affichée pendant
                    toute l’installation (quelques minutes) : ne la fermez pas.
                    Windows peut demander votre autorisation pour Node.js :
                    répondez « Oui ». La fenêtre annonce la fin et se ferme avec
                    le bouton « Fermer ».
                  </li>
                  <li>
                    Revenez ici : cette fenêtre détecte l’aide toute seule. Si le
                    navigateur demande l’accès aux applications de cet appareil,
                    acceptez.
                  </li>
                </ol>
              </>
            ) : systeme === "mac" ? (
              <>
                <div>
                  <p className="mb-1 font-medium text-foreground">
                    Ce qui sera installé, une seule fois
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5">
                    <li>
                      Homebrew (l’installeur de programmes du Mac), s’il manque :
                      le Mac demande alors le mot de passe de votre session.
                    </li>
                    <li>Node.js, yt-dlp, ffmpeg et Deno, s’ils manquent.</li>
                    <li>
                      L’aide elle-même : elle démarre ensuite toute seule à
                      l’ouverture de votre session.
                    </li>
                  </ul>
                </div>
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>
                    Cliquez sur « Télécharger l’installeur » ci-dessous. Si le
                    fichier zip ne s’ouvre pas tout seul, double-cliquez dessus :
                    il contient « Installer-aide-musique ».
                  </li>
                  <li>
                    Double-cliquez sur « Installer-aide-musique ». Si le Mac dit
                    qu’il ne peut pas vérifier le fichier : clic droit sur le
                    fichier, « Ouvrir », puis « Ouvrir ».
                  </li>
                  <li>
                    Une fenêtre du Terminal s’ouvre et montre l’avancement :
                    laissez-la travailler et ne la fermez pas (quelques minutes,
                    jusqu’à 20 si Homebrew doit être installé). Si le Mac demande
                    le mot de passe de votre session, tapez-le dans cette
                    fenêtre : rien ne s’affiche pendant la frappe, c’est normal.
                  </li>
                  <li>
                    Revenez ici : cette fenêtre détecte l’aide toute seule. Si ce
                    n’est pas le cas dans Safari, essayez avec Chrome ou Firefox.
                  </li>
                </ol>
              </>
            ) : (
              <>
                <p>
                  Ce paquet installe l’aide et tout ce qu’il lui faut (Node.js,
                  yt-dlp, ffmpeg), puis la lance à chaque ouverture de session.
                </p>
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>Cliquez sur « Télécharger l’installeur » ci-dessous.</li>
                  <li>
                    Double-cliquez sur le fichier téléchargé : le gestionnaire de
                    paquets s’ouvre, cliquez sur « Installer » (mot de passe
                    demandé).
                  </li>
                  <li>
                    Revenez ici : cette fenêtre détecte l’aide toute seule.
                  </li>
                </ol>
                <p>
                  Autre distribution que Deepin, Ubuntu, Debian ou Mint :{" "}
                  <a
                    href={`${DOSSIER_AIDE}/Installer-aide-musique-linux.sh`}
                    download
                    onClick={onTelecharge}
                    className="underline hover:text-foreground"
                  >
                    installateur générique
                  </a>
                  .
                </p>
              </>
            )}

            {telecharge && (
              <p className="flex items-center gap-2 text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-border-strong border-t-accent-from"
                />
                En attente de l’aide…
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {!telecharge && (
                <button
                  type="button"
                  onClick={onPlusTard}
                  className="rounded border border-border-strong px-3 py-2 text-xs text-muted hover:text-foreground"
                >
                  Plus tard
                </button>
              )}
              <a
                href={
                  systeme === "windows"
                    ? `${DOSSIER_AIDE}/Installer-aide-musique.cmd`
                    : systeme === "mac"
                      ? `${DOSSIER_AIDE}/Installer-aide-musique-mac.zip`
                      : `${DOSSIER_AIDE}/ffg-aide-musique.deb`
                }
                download
                onClick={onTelecharge}
                className="accent-gradient inline-block rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {telecharge ? "Télécharger de nouveau" : "Télécharger l’installeur"}
              </a>
            </div>
            {!telecharge && (
              <p className="text-xs">
                « Plus tard » : cette fenêtre ne s’ouvrira plus toute seule sur
                cet appareil. Le lien « Installer l’aide » reste dans « Aide
                locale », sous l’adresse du lien.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
