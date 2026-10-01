"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

interface DragState {
  id: string;
  dy: number;
  from: number;
  to: number;
}

const ECART = 8;

// Pointer Events plutôt que le glisser-déposer HTML5, qui ne marche pas au tactile.
// Les positions sont mesurées une seule fois au début du geste pour éviter un reflow à chaque déplacement.
export function useDragReorder(ids: string[], onReorder: (ids: string[]) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const mesures = useRef<{ top: number; height: number }[]>([]);
  const departY = useRef(0);

  const registre = (id: string) => (el: HTMLElement | null) => {
    if (el) elements.current.set(id, el);
    else elements.current.delete(id);
  };

  function debut(id: string, e: PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    mesures.current = ids.map((i) => {
      const r = elements.current.get(i)?.getBoundingClientRect();
      return { top: r?.top ?? 0, height: r?.height ?? 0 };
    });
    departY.current = e.clientY;
    const from = ids.indexOf(id);
    setDrag({ id, dy: 0, from, to: from });
  }

  function deplacement(e: PointerEvent<HTMLElement>) {
    if (!drag) return;
    const dy = e.clientY - departY.current;
    const m = mesures.current[drag.from];
    const centre = m.top + m.height / 2 + dy;
    let to = mesures.current.findIndex((x) => centre < x.top + x.height);
    if (to === -1) to = mesures.current.length - 1;
    setDrag({ ...drag, dy, to });
  }

  function fin() {
    if (drag && drag.to !== drag.from) {
      const suite = [...ids];
      const [deplace] = suite.splice(drag.from, 1);
      suite.splice(drag.to, 0, deplace);
      onReorder(suite);
    }
    setDrag(null);
  }

  function style(id: string): CSSProperties {
    if (!drag) return {};
    const i = ids.indexOf(id);
    if (id === drag.id) {
      return { transform: `translateY(${drag.dy}px)`, zIndex: 10, position: "relative", transition: "none", opacity: 0.9 };
    }
    const decalage = (mesures.current[drag.from]?.height ?? 0) + ECART;
    let dy = 0;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) dy = -decalage;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) dy = decalage;
    return { transform: `translateY(${dy}px)`, transition: "transform 150ms" };
  }

  return {
    registre,
    style,
    glissant: drag?.id ?? null,
    poignee: (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => debut(id, e),
      onPointerMove: deplacement,
      onPointerUp: fin,
      onPointerCancel: () => setDrag(null),
    }),
  };
}
