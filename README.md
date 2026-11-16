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

## Aide « Faire ces musiques »

Convertir un lien YouTube (ou autre plateforme) en MP3 demande une aide installée sur l'ordinateur : `tools/aide-musique.mjs`, un petit serveur local (port 47615) qui utilise yt-dlp et ffmpeg. Un site web ne peut rien installer lui-même : l'utilisateur télécharge un fichier et l'ouvre une fois.

- **Dans l'appli** : sur l'onglet « Lien web » de « Faire ces musiques », si l'aide ne répond pas (Windows ou Linux de bureau), une boîte de dialogue (`src/components/InstallerAide.tsx`) explique ce qui sera installé, détaille les étapes, fait télécharger l'installeur en un clic et détecte l'aide toute seule. « Plus tard » l'empêche de s'ouvrir seule sur cet appareil ; elle revient par le lien « Installer l'aide » de « Aide locale », ou quand on tente de convertir un lien sans aide. La page ne lance jamais l'aide par le lien `ffg-aide://` si elle n'a pas déjà vu l'aide répondre sur l'appareil (sinon Windows ouvre une fenêtre « Microsoft Store » vide).
- **Windows** : `public/aide/Installer-aide-musique.cmd`, un seul fichier. Au double-clic il se relance sans fenêtre noire, annonce le début et la fin par des boîtes de message, installe Node.js, yt-dlp et ffmpeg avec `winget` s'ils manquent, copie l'aide dans `%LOCALAPPDATA%\ffg-aide`, la lance au démarrage de Windows et enregistre le lien `ffg-aide://`. Le détail est dans `%LOCALAPPDATA%\ffg-aide\installation.log` ; avec l'option `/visible` il garde la fenêtre noire (pour comprendre un problème). Après une réinstallation de Windows, il suffit de le relancer. Pour enlever l'aide : `%LOCALAPPDATA%\ffg-aide\aide.cmd /desinstaller`.
- **Linux** : `public/aide/ffg-aide-musique.deb` (fabriqué par `scripts/build-deb.py`, à relancer après une modification de l'aide) ou `Installer-aide-musique-linux.sh`.
- **Build** : `scripts/copie-aide.mjs` (lancé par `npm run build`) copie `tools/aide-musique.mjs` dans `public/aide/` et garde l'installeur Windows en fins de ligne CRLF, sans accent.
- L'aide garde la version de yt-dlp en mémoire : la page n'attend sa réponse que 1,5 seconde.
