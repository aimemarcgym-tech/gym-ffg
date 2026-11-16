// Avant chaque build : met à disposition du site ce que télécharge l'installeur Windows de l'aide « Faire ces musiques ».
//   - copie tools/aide-musique.mjs dans public/aide/ (l'installeur le télécharge depuis le site) ;
//   - remet des fins de ligne Windows (CRLF) à l'installeur .cmd : sans elles, ses renvois internes peuvent échouer.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
copyFileSync(join(racine, "tools", "aide-musique.mjs"), join(racine, "public", "aide", "aide-musique.mjs"));

const installeur = join(racine, "public", "aide", "Installer-aide-musique.cmd");
const texte = readFileSync(installeur, "utf8");
const crlf = texte.replace(/\r?\n/g, "\r\n");
if (crlf !== texte) writeFileSync(installeur, crlf);
if (/[^\x00-\x7F]/.test(crlf)) throw new Error("Installer-aide-musique.cmd doit rester sans accent (ASCII).");
console.log("Aide musique : fichiers du site à jour.");
