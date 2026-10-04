// Aide locale pour « Faire ces musiques » : un petit serveur qui tourne sur CET ordinateur (127.0.0.1) et utilise yt-dlp + ffmpeg
// déjà installés pour convertir un lien (YouTube, etc.) en MP3. L'appli web l'appelle quand il est lancé ; rien n'est hébergé en ligne.
//
// Lancement : npm run aide-musique   (ou double-clic sur Lancer-aide-musique.bat). Arrêt : Ctrl+C.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.AIDE_MUSIQUE_PORT ?? 47615);
// Seules les pages de l'appli (en local, ou l'adresse GitHub Pages) peuvent parler à cette aide : pas n'importe quel site web.
const ORIGINES = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/, ...(process.env.AIDE_MUSIQUE_ORIGINES ?? "https://aimemarcgym-tech.github.io,https://gym-ffg.web.app,https://gym-ffg.firebaseapp.com").split(",").map((o) => new RegExp(`^${o.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))];

const travaux = new Map();

function disponible(commande, args) {
  const r = spawnSync(commande, args, { encoding: "utf8", shell: false });
  return r.status === 0 ? String(r.stdout).split("\n")[0].trim() : null;
}
const versionYtdlp = () => disponible("yt-dlp", ["--version"]);
const versionFfmpeg = () => disponible("ffmpeg", ["-version"]);

function entetes(req, extra = {}) {
  const origine = req.headers.origin;
  const autorisee = origine && ORIGINES.some((re) => re.test(origine));
  return {
    ...(autorisee ? { "Access-Control-Allow-Origin": origine, Vary: "Origin" } : {}),
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Expose-Headers": "X-Nom-Fichier",
    ...extra,
  };
}

const json = (res, req, code, corps) => {
  res.writeHead(code, entetes(req, { "Content-Type": "application/json; charset=utf-8" }));
  res.end(JSON.stringify(corps));
};

function lire(req) {
  return new Promise((resolve, reject) => {
    let brut = "";
    req.on("data", (c) => {
      brut += c;
      if (brut.length > 10_000) reject(new Error("Requête trop grande"));
    });
    req.on("end", () => resolve(brut));
  });
}

function lancer(url, kbps, playlist) {
  const id = randomUUID();
  const dossier = mkdtempSync(join(tmpdir(), "aide-musique-"));
  const travail = { id, statut: "encours", progression: 0, message: "Démarrage…", dossier, fichier: null, nom: null, creeLe: Date.now() };
  travaux.set(id, travail);

  // Arguments passés sans shell : l'adresse ne peut pas injecter de commande.
  const args = [
    "-x", "--audio-format", "mp3", "--audio-quality", `${kbps}K`,
    playlist ? "--yes-playlist" : "--no-playlist",
    "--newline", "--no-warnings",
    "-o", join(dossier, "%(title).150B.%(ext)s"),
    "--", url,
  ];
  const p = spawn("yt-dlp", args, { shell: false });
  const lignes = (flux) => {
    let reste = "";
    flux.on("data", (morceau) => {
      reste += morceau;
      const parties = reste.split(/\r?\n/);
      reste = parties.pop() ?? "";
      for (const l of parties) {
        const m = l.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        if (m) {
          travail.progression = Math.min(0.9, (Number(m[1]) / 100) * 0.9);
          travail.message = "Téléchargement…";
        } else if (l.includes("[ExtractAudio]")) {
          travail.progression = 0.95;
          travail.message = "Conversion en MP3…";
        }
      }
    });
  };
  lignes(p.stdout);
  let erreurs = "";
  p.stderr.on("data", (c) => (erreurs += c));
  p.on("error", () => Object.assign(travail, { statut: "erreur", message: "yt-dlp est introuvable sur cet ordinateur." }));
  p.on("close", (code) => {
    const mp3 = readdirSync(dossier).filter((f) => f.toLowerCase().endsWith(".mp3"));
    if (code === 0 && mp3.length > 0) {
      Object.assign(travail, { statut: "ok", progression: 1, message: "Terminé", fichier: join(dossier, mp3[0]), nom: mp3[0] });
    } else if (travail.statut !== "erreur") {
      const derniere = erreurs.split("\n").filter((l) => l.includes("ERROR")).pop() ?? "";
      Object.assign(travail, { statut: "erreur", message: derniere.replace(/^ERROR:\s*/, "").slice(0, 300) || "La conversion a échoué." });
    }
  });
  return id;
}

function nettoyer() {
  for (const [id, t] of travaux) {
    if (Date.now() - t.creeLe > 30 * 60 * 1000) {
      rmSync(t.dossier, { recursive: true, force: true });
      travaux.delete(id);
    }
  }
}
setInterval(nettoyer, 5 * 60 * 1000).unref();

const serveur = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? "/", "http://x");
    if (req.method === "OPTIONS") {
      res.writeHead(204, entetes(req));
      return res.end();
    }
    // Protection contre le « DNS rebinding » : seule une requête adressée à localhost / 127.0.0.1 est acceptée.
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host ?? "")) return json(res, req, 403, { erreur: "Hôte non autorisé" });
    const origine = req.headers.origin;
    if (origine && !ORIGINES.some((re) => re.test(origine))) return json(res, req, 403, { erreur: "Origine non autorisée" });

    if (req.method === "GET" && pathname === "/etat") {
      const ytdlp = versionYtdlp();
      const ffmpeg = versionFfmpeg();
      return json(res, req, 200, { ok: !!ytdlp && !!ffmpeg, ytdlp, ffmpeg: !!ffmpeg });
    }
    if (req.method === "POST" && pathname === "/lancer") {
      const { url, kbps = 192, playlist = false } = JSON.parse((await lire(req)) || "{}");
      if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return json(res, req, 400, { erreur: "Adresse invalide" });
      const k = [128, 192, 320].includes(kbps) ? kbps : 192;
      return json(res, req, 200, { id: lancer(url, k, !!playlist) });
    }
    const m = pathname.match(/^\/travail\/([0-9a-f-]+)(\/fichier)?$/);
    if (m) {
      const t = travaux.get(m[1]);
      if (!t) return json(res, req, 404, { erreur: "Travail introuvable" });
      if (req.method === "GET" && !m[2]) return json(res, req, 200, { statut: t.statut, progression: t.progression, message: t.message, nom: t.nom });
      if (req.method === "GET" && m[2] && t.fichier) {
        const taille = statSync(t.fichier).size;
        res.writeHead(200, entetes(req, { "Content-Type": "audio/mpeg", "Content-Length": taille, "X-Nom-Fichier": encodeURIComponent(t.nom) }));
        return res.end(readFileSync(t.fichier));
      }
      if (req.method === "DELETE") {
        rmSync(t.dossier, { recursive: true, force: true });
        travaux.delete(t.id);
        return json(res, req, 200, { ok: true });
      }
    }
    return json(res, req, 404, { erreur: "Introuvable" });
  } catch (e) {
    return json(res, req, 500, { erreur: e instanceof Error ? e.message : "Erreur" });
  }
});

serveur.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("L'aide est déjà lancée sur ce port.");
    process.exit(0);
  }
  throw e;
});

serveur.listen(PORT, "127.0.0.1", () => {
  console.log(`Aide « Faire ces musiques » prête sur http://127.0.0.1:${PORT}`);
  console.log(`yt-dlp : ${versionYtdlp() ?? "INTROUVABLE"} · ffmpeg : ${versionFfmpeg() ? "ok" : "INTROUVABLE"}`);
  console.log("Laissez cette fenêtre ouverte pendant que vous utilisez l’appli. Ctrl+C pour arrêter.");
});
