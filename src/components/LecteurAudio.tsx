"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuree } from "@/lib/format";

// Un seul lecteur joue à la fois : en lancer un met en pause celui qui jouait.
let enCours: HTMLAudioElement | null = null;

// Même lecteur que sur le site UFOLEP : lecture, barre de progression, durée, volume.
export default function LecteurAudio({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muet, setMuet] = useState(false);
  const barre = useRef<HTMLInputElement>(null);
  const reglageVolume = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Nouvelle musique : on repart du début.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLecture(false);
    setPosition(0);
    setDuree(0);
  }, [src]);

  function basculerLecture() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  }

  function aller(t: number) {
    if (audio.current) audio.current.currentTime = t;
    setPosition(t);
  }

  function basculerMuet() {
    const m = !muet;
    setMuet(m);
    if (audio.current) audio.current.muted = m;
  }

  function regler(v: number) {
    setVolume(v);
    setMuet(v === 0);
    if (audio.current) {
      audio.current.volume = v;
      audio.current.muted = v === 0;
    }
  }

  // La molette sur la barre de progression ou sur le volume les modifie : vers le haut, on avance / on monte le son.
  // Écouteurs natifs (non passifs) : sinon la page défile en même temps que la molette.
  useEffect(() => {
    const surPosition = (e: WheelEvent) => {
      e.preventDefault();
      const a = audio.current;
      if (!a || !Number.isFinite(a.duration)) return;
      a.currentTime = Math.min(
        a.duration,
        Math.max(0, a.currentTime + (e.deltaY < 0 ? 5 : -5)),
      );
    };
    const surVolume = (e: WheelEvent) => {
      e.preventDefault();
      const a = audio.current;
      if (!a) return;
      const v = Math.min(
        1,
        Math.max(
          0,
          Math.round(
            ((a.muted ? 0 : a.volume) + (e.deltaY < 0 ? 0.05 : -0.05)) * 100,
          ) / 100,
        ),
      );
      a.volume = v;
      a.muted = v === 0;
      setVolume(v);
      setMuet(v === 0);
    };
    const b = barre.current;
    const v = reglageVolume.current;
    b?.addEventListener("wheel", surPosition, { passive: false });
    v?.addEventListener("wheel", surVolume, { passive: false });
    return () => {
      b?.removeEventListener("wheel", surPosition);
      v?.removeEventListener("wheel", surVolume);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 rounded border border-border-strong bg-surface px-2 py-1.5">
      <audio
        ref={audio}
        src={src}
        onPlay={(e) => {
          if (enCours && enCours !== e.currentTarget) enCours.pause();
          enCours = e.currentTarget;
          setLecture(true);
        }}
        onPause={() => setLecture(false)}
        onEnded={() => setLecture(false)}
        onLoadedMetadata={(e) => setDuree(e.currentTarget.duration)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
      />
      <button
        type="button"
        onClick={basculerLecture}
        title={lecture ? "Pause" : "Lecture"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background"
      >
        {lecture ? "❚❚" : "▶"}
      </button>
      <span className="w-8 shrink-0 text-right text-[10px] text-muted tabular-nums">
        {formatDuree(position)}
      </span>
      <input
        ref={barre}
        type="range"
        min={0}
        max={duree || 0}
        step={0.1}
        value={position}
        onChange={(e) => aller(Number(e.target.value))}
        aria-label="Position"
        className="accent-gradient-range min-w-0 flex-1"
      />
      <span className="w-8 shrink-0 text-[10px] text-muted tabular-nums">
        {formatDuree(duree)}
      </span>
      <button
        type="button"
        onClick={basculerMuet}
        title={muet ? "Réactiver le son" : "Couper le son"}
        className="shrink-0 text-sm text-muted hover:text-foreground"
      >
        {muet || volume === 0 ? "🔇" : "🔊"}
      </button>
      <input
        ref={reglageVolume}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muet ? 0 : volume}
        onChange={(e) => regler(Number(e.target.value))}
        aria-label="Volume"
        className="accent-gradient-range w-16 shrink-0"
      />
    </div>
  );
}
