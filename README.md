This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Impression des mouvements

Bouton « Imprimer » dans le constructeur de mouvement (le mouvement ouvert) et « Imprimer les mouvements » sur la fiche d'une gymnaste (tous ses mouvements, dans l'ordre Saut, Barres, Poutre, Sol). `src/components/FeuilleImpression.tsx` monte une feuille au clic, une page par mouvement : nom de la gymnaste, date, puis les panneaux « Mon mouvement » et « Analyse » (ceux de la page de partage, `Panneaux` dans `PartageMouvements.tsx`), sur fond blanc. `globals.css` (`@media print`) remplace les couleurs du thème sombre par des couleurs de papier dans `.feuille-impression` ; le reste de la page, dont la barre de navigation, est masqué par `print:hidden`. Format A4 portrait (page nommée `mouvement` ; le reste de l'application s'imprime en paysage), les deux panneaux restent côte à côte pour qu'un mouvement tienne sur une page.

## Aide « Faire ces musiques »

Convertir un lien YouTube (ou autre plateforme) en MP3 demande une aide installée sur l'ordinateur : `tools/aide-musique.mjs`, un petit serveur local (port 47615) qui utilise yt-dlp et ffmpeg. Un site web ne peut rien installer lui-même : l'utilisateur télécharge un fichier et l'ouvre une fois.

- **Dans l'appli** : sur l'onglet « Lien web » de « Faire ces musiques », si l'aide ne répond pas (Windows ou Linux de bureau), une boîte de dialogue (`src/components/InstallerAide.tsx`) explique ce qui sera installé, détaille les étapes, fait télécharger l'installeur en un clic et détecte l'aide toute seule. « Plus tard » l'empêche de s'ouvrir seule sur cet appareil ; elle revient par le lien « Installer l'aide » de « Aide locale », ou quand on tente de convertir un lien sans aide. La page ne lance jamais l'aide par le lien `ffg-aide://` si elle n'a pas déjà vu l'aide répondre sur l'appareil (sinon Windows ouvre une fenêtre « Microsoft Store » vide).
- **Windows** : `public/aide/Installer-aide-musique.cmd`, un seul fichier. Au double-clic il se relance sans fenêtre noire et affiche une seule fenêtre d'avancement (25 petits carrés bleus qui s'ajoutent, pourcentage, texte de l'étape en cours, bouton « Fermer » à la fin ; le PowerShell de cette fenêtre est à la fin du fichier `.cmd`, et l'installeur lui passe l'état par `etat.txt`, au format `ETAT:début %:fin %:message` : la jauge monte doucement entre les deux pourcentages pendant une étape longue), installe Node.js, yt-dlp et ffmpeg avec `winget` s'ils manquent, copie l'aide dans `%LOCALAPPDATA%\ffg-aide`, la lance au démarrage de Windows et enregistre le lien `ffg-aide://`. Le détail est dans `%LOCALAPPDATA%\ffg-aide\installation.log` ; avec l'option `/visible` il garde la fenêtre noire (pour comprendre un problème). Après une réinstallation de Windows, il suffit de le relancer. Pour enlever l'aide : `%LOCALAPPDATA%\ffg-aide\aide.cmd /desinstaller`.
- **Mac** (jamais essayé sur un vrai Mac) : `public/aide/Installer-aide-musique-mac.zip`, fabriqué à chaque build par `scripts/build-mac.mjs` à partir de `scripts/aide-mac/Installer-aide-musique.command` (le zip garde le droit d'exécution, qu'un `.command` téléchargé perdrait). Il installe Homebrew s'il manque (mot de passe de la session demandé), puis Node.js, yt-dlp, ffmpeg et Deno, copie l'aide dans `~/Library/Application Support/ffg-aide`, et la fait démarrer à l'ouverture de la session par un LaunchAgent (pas de lien `ffg-aide://` sur Mac). Pour l'enlever : `bash "$HOME/Library/Application Support/ffg-aide/installeur.command" desinstaller`. Incertitude : Safari peut refuser que le site parle à l'aide (`http` local depuis une page `https`) ; Chrome et Firefox ne devraient pas. La page ne propose l'installation que sur un vrai Mac (un iPad en mode « site pour ordinateur » est écarté par son écran tactile).
- **Linux** : `public/aide/ffg-aide-musique.deb` (Deepin, Ubuntu, Kubuntu, Debian, Mint ; double-clic, le gestionnaire de paquets installe Node.js, ffmpeg, python3 et curl, puis yt-dlp est téléchargé) ou `Installer-aide-musique-linux.sh`. Le paquet est refabriqué à chaque build par `scripts/build-deb.mjs` (sans Python) : il contient toujours l'aide actuelle.
- **Build** : `scripts/copie-aide.mjs` (lancé par `npm run build`) copie `tools/aide-musique.mjs` dans `public/aide/` et garde l'installeur Windows en fins de ligne CRLF, sans accent.
- L'aide garde la version de yt-dlp en mémoire : la page n'attend sa réponse que 1,5 seconde.
