"use client";

import { useCallback, useEffect } from "react";
import type { MediaItem } from "@/lib/adminTypes";

interface LightboxProps {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Previzualizare mare (lightbox) cu navigare prev/next, închidere și
 * suport pentru tastatură (← → Esc). Imagini full sau video cu controls.
 */
export default function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: LightboxProps) {
  const item = items[index];
  const count = items.length;

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + count) % count);
  }, [index, count, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % count);
  }, [index, count, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    // Blochează scroll-ul de fundal cât timp e deschis lightbox-ul.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Previzualizare moment"
    >
      {/* Voal */}
      <button
        type="button"
        aria-label="Închide previzualizarea"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out bg-ink/80 backdrop-blur-sm"
        style={{ animation: "fade-rise 0.3s ease both" }}
      />

      {/* Conținut */}
      <figure className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col items-center px-4">
        <div
          key={item.id}
          className="relative flex max-h-[78vh] w-full items-center justify-center"
          style={{ animation: "fade-rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          {item.url ? (
            item.kind === "video" ? (
              <video
                src={item.url}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] w-auto rounded-lg shadow-2xl shadow-black/40"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.original_name}
                className="max-h-[78vh] w-auto rounded-lg object-contain shadow-2xl shadow-black/40"
              />
            )
          ) : (
            <p className="rounded-lg bg-white/10 px-8 py-12 text-center text-cream">
              Previzualizarea nu este disponibilă.
            </p>
          )}
        </div>

        <figcaption className="mt-4 flex flex-col items-center text-center text-cream/90">
          <span className="max-w-md truncate text-sm tracking-wide">
            {item.original_name}
          </span>
          <span className="mt-1 text-xs text-cream/60">
            {formatDate(item.created_at)} · {index + 1} / {count}
          </span>
        </figcaption>
      </figure>

      {/* Navigare */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Momentul anterior"
            className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-ink/40 text-cream backdrop-blur-sm transition hover:bg-ink/70 sm:left-6"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Momentul următor"
            className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-ink/40 text-cream backdrop-blur-sm transition hover:bg-ink/70 sm:right-6"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}

      {/* Închide */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Închide"
        className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-cream/30 bg-ink/40 text-cream backdrop-blur-sm transition hover:bg-ink/70 sm:right-6 sm:top-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
