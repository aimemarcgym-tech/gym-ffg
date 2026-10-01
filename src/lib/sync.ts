import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Store } from "@/lib/data";

// Synchronisation entre appareils : les données (clubs, équipes, gymnastes, mouvements, séances…) restent d'abord dans l'appareil
// (rapide, marche sans réseau) puis sont recopiées dans Firestore, dans users/{uid}/donnees/{collection}, et reprises sur les autres appareils.
// Les fichiers lourds (musiques, photos, vidéos, documents de résultats) restent sur l'appareil : la Sauvegarde sert à les transférer.
const COLLECTIONS = ["clubs", "gymnastes", "equipes", "mouvements", "instantanes", "seances"] as const;
type Nom = (typeof COLLECTIONS)[number];

export type EtatSync = "inactif" | "connexion" | "synchronise" | "hors-ligne" | "erreur";

interface Acces {
  lire: () => Store;
  // Écrit dans l'appareil sans renvoyer vers le cloud.
  appliquer: (s: Store) => void;
}

let uid: string | null = null;
let acces: Acces | null = null;
let abonnements: (() => void)[] = [];
const recues = new Set<Nom>();
// Dernier contenu connu du cloud pour chaque collection : évite de renvoyer ce qui n'a pas changé.
const dernier = new Map<Nom, string>();

let etat: EtatSync = "inactif";
const ecouteursEtat = new Set<() => void>();
function changerEtat(e: EtatSync) {
  if (e === etat) return;
  etat = e;
  ecouteursEtat.forEach((f) => f());
}
export const etatSync = () => etat;
export function abonnerEtat(f: () => void) {
  ecouteursEtat.add(f);
  return () => {
    ecouteursEtat.delete(f);
  };
}

const items = (s: Store, nom: Nom): unknown[] => ((s[nom] as unknown[] | undefined) ?? []);

function reference(nom: Nom) {
  return doc(db, "users", uid!, "donnees", nom);
}

function envoyer(nom: Nom, json: string) {
  dernier.set(nom, json);
  setDoc(reference(nom), { json }).catch(() => changerEtat("erreur"));
}

// Appelé par data.ts après chaque écriture locale : n'envoie que les collections modifiées.
export function pousserVersCloud(s: Store) {
  if (!uid) return;
  for (const nom of COLLECTIONS) {
    // Tant que le cloud n'a pas répondu pour cette collection, on n'écrase rien.
    if (!recues.has(nom)) continue;
    const json = JSON.stringify(items(s, nom));
    if (json !== dernier.get(nom)) envoyer(nom, json);
  }
}

export function demarrerSync(utilisateur: string, a: Acces): () => void {
  arreterSync();
  uid = utilisateur;
  acces = a;
  changerEtat("connexion");
  let modifie = false;

  for (const nom of COLLECTIONS) {
    abonnements.push(
      onSnapshot(
        reference(nom),
        { includeMetadataChanges: true },
        (snap) => {
          // Écriture locale pas encore confirmée : le contenu vient de cet appareil, on n'y touche pas.
          if (snap.metadata.hasPendingWrites) return;
          // Hors ligne et rien en mémoire pour cette collection : on attend la réponse du serveur plutôt que de croire le cloud vide.
          if (!snap.exists() && snap.metadata.fromCache) return;
          const local = a.lire();
          const premiere = !recues.has(nom);
          recues.add(nom);
          changerEtat(snap.metadata.fromCache ? "hors-ligne" : "synchronise");

          if (!snap.exists()) {
            // Rien dans le cloud : première connexion, on y envoie les données de cet appareil.
            const json = JSON.stringify(items(local, nom));
            dernier.set(nom, "[]");
            if (json !== "[]") envoyer(nom, json);
            return;
          }
          const distant = JSON.parse((snap.data() as { json: string }).json) as unknown[];
          const json = JSON.stringify(distant);
          dernier.set(nom, json);
          if (json === JSON.stringify(items(local, nom))) return;
          // Le cloud fait foi. Avant d'écraser des données locales différentes (premier branchement), on en garde une copie.
          if (premiere && items(local, nom).length > 0) {
            try {
              localStorage.setItem(`ffg:avant-sync:${nom}`, JSON.stringify(items(local, nom)));
            } catch {}
          }
          a.appliquer({ ...local, [nom]: distant } as Store);
          modifie = true;
        },
        () => changerEtat("erreur"),
      ),
    );
  }
  // Après le premier tour de réponses, toute modification venue d'un autre appareil recharge l'affichage.
  const rafraichir = setInterval(() => {
    if (modifie && COLLECTIONS.every((n) => recues.has(n))) {
      modifie = false;
      window.dispatchEvent(new Event("ffg:distant"));
    }
  }, 300);
  abonnements.push(() => clearInterval(rafraichir));
  return arreterSync;
}

export function arreterSync() {
  abonnements.forEach((f) => f());
  abonnements = [];
  recues.clear();
  dernier.clear();
  uid = null;
  acces = null;
  changerEtat("inactif");
}

export const synchroActive = () => uid !== null && acces !== null;
