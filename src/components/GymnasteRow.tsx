import {
  useState,
  type HTMLAttributes,
  type CSSProperties,
  type Ref,
} from "react";
import { ConfirmerEnLigne } from "@/components/EnLigne";
import Link from "next/link";
import DragHandle from "@/components/DragHandle";
import { ageEnSaison } from "@/regulation/loader";
import { btnDanger, carteLigne, lienDegrade } from "@/lib/styles";
import type { Gymnaste } from "@/lib/data";

interface Props {
  gymnaste: Gymnaste;
  horsCategorie?: boolean;
  nbMouvements: number;
  style?: CSSProperties;
  rowRef?: Ref<HTMLLIElement>;
  poignee?: HTMLAttributes<HTMLSpanElement>;
  onRetirer?: () => void;
  onSupprimer: () => void;
  // Texte de confirmation propre (par défaut : suppression de la gymnaste).
  question?: string;
  // Engagement en individuelle sans recréer la gymnaste : bouton, ou mention quand elle y est déjà.
  individuelle?: { active: boolean; onMettre: () => void };
}

export default function GymnasteRow({
  gymnaste: g,
  horsCategorie,
  nbMouvements,
  style,
  rowRef,
  poignee,
  onRetirer,
  onSupprimer,
  individuelle,
  question,
}: Props) {
  const [confirme, setConfirme] = useState(false);
  return (
    <li
      ref={rowRef}
      style={style}
      className="flex items-center gap-2 rounded-lg transition"
    >
      {poignee ? (
        <DragHandle {...poignee} />
      ) : (
        <span className="w-10 shrink-0" />
      )}
      <div className="flex-1">
        <div className={carteLigne}>
          <Link href={`/gymnaste/?g=${g.id}`} className="flex-1">
            <div className="font-medium text-foreground">
              {g.prenom} {g.nom}
            </div>
            <div className="text-xs text-muted">
              {ageEnSaison(g.anneeNaissance)} ans · {nbMouvements} mouvement(s)
              {horsCategorie && (
                <span className="ml-2 text-danger">hors catégorie</span>
              )}
            </div>
          </Link>
          {confirme ? (
            <ConfirmerEnLigne
              question={question ?? `Supprimer ${g.prenom} ${g.nom} ?`}
              onConfirmer={() => {
                setConfirme(false);
                onSupprimer();
              }}
              onAnnuler={() => setConfirme(false)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link href={`/gymnaste/?g=${g.id}`} className={lienDegrade}>
                Ouvrir →
              </Link>
              {individuelle &&
                (individuelle.active ? (
                  <span className="text-xs text-muted">Individuelle ✓</span>
                ) : (
                  <button
                    onClick={individuelle.onMettre}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    + Individuelle
                  </button>
                ))}
              {onRetirer && (
                <button
                  onClick={onRetirer}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Retirer
                </button>
              )}
              <button onClick={() => setConfirme(true)} className={btnDanger}>
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
