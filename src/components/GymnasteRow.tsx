import { useState, type HTMLAttributes, type CSSProperties, type Ref } from "react";
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
}

export default function GymnasteRow({ gymnaste: g, horsCategorie, nbMouvements, style, rowRef, poignee, onRetirer, onSupprimer }: Props) {
  const [confirme, setConfirme] = useState(false);
  return (
    <li ref={rowRef} style={style} className="flex items-center gap-2 rounded-lg transition">
      {poignee ? <DragHandle {...poignee} /> : <span className="w-10 shrink-0" />}
      <div className="flex-1">
        <div className={carteLigne}>
          <Link href={`/gymnaste/?g=${g.id}`} className="flex-1">
            <div className="font-medium text-foreground">
              {g.prenom} {g.nom}
            </div>
            <div className="text-xs text-muted">
              {ageEnSaison(g.anneeNaissance)} ans · {nbMouvements} mouvement(s)
              {horsCategorie && <span className="ml-2 text-danger">hors catégorie</span>}
            </div>
          </Link>
          {confirme ? (
            <ConfirmerEnLigne
              question={`Supprimer ${g.prenom} ${g.nom} ?`}
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
            {onRetirer && (
              <button onClick={onRetirer} className="text-xs text-muted hover:text-foreground">
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
