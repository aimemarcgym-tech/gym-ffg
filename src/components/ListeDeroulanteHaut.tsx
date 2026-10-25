"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

// Menu déroulant qui s'ouvre vers le haut : pour les menus placés en bas de page, où la liste ne doit pas partir sous l'écran.
export default function ListeDeroulanteHaut({
  options,
  value,
  placeholder,
  onChange,
  ariaLabel,
  className = "",
}: {
  options: Option[];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);
  const choisie = options.find((o) => o.value === value);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (racine.current && !racine.current.contains(e.target as Node))
        setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", fermer);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div ref={racine} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        className="flex w-full items-center justify-between gap-2 rounded border border-border-strong bg-surface-alt px-3 py-2 text-left text-sm text-foreground focus:border-accent-solid focus:outline-none"
      >
        <span className="truncate">
          {choisie ? choisie.label : placeholder}
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 transition-transform ${ouvert ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {ouvert && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-40 mb-1 max-h-72 w-full overflow-y-auto rounded border border-border-strong bg-surface-alt py-1 shadow-lg"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  setOuvert(false);
                  onChange(o.value);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-surface ${
                  o.value === value
                    ? "font-semibold text-white"
                    : "text-foreground"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
