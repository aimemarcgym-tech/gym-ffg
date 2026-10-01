import type { HTMLAttributes } from "react";

// Même poignée que sur le site UFOLEP : le caractère ⠿, zone tactile de 40 × 40.
export default function DragHandle(props: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      title="Glisser pour réordonner"
      {...props}
      style={{ touchAction: "none" }}
      className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded text-2xl leading-none text-muted select-none active:cursor-grabbing active:bg-accent-from/10"
    >
      ⠿
    </span>
  );
}
