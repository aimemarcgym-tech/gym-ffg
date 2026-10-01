import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";

if (!existsSync("out")) throw new Error("Dossier out/ introuvable : lancer next build d'abord.");

// On vide le contenu plutôt que le dossier : Windows refuse de supprimer un dossier tenu ouvert par un serveur local.
mkdirSync("docs", { recursive: true });
for (const nom of readdirSync("docs")) rmSync(`docs/${nom}`, { recursive: true, force: true });
cpSync("out", "docs", { recursive: true });
// GitHub Pages ignorerait sinon les dossiers commençant par _ (comme _next).
writeFileSync("docs/.nojekyll", "");
console.log("docs/ synchronisé depuis out/");
