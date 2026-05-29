"use client";

import type { MediaItem } from "@/lib/adminTypes";

interface MediaCardProps {
  item: MediaItem;
  deleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Un cadru din galerie: thumbnail (imagine) sau preview (video) cu marcaj,
 * suprapunere la hover cu data și buton de ștergere.
 */
export default function MediaCard({
  item,
  deleting,
  onOpen,
  onDelete,
}: MediaCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e7dcc7] bg-white/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Deschide ${item.original_name}`}
        className="block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {item.url ? (
          item.kind === "video" ? (
            <video
              src={item.url}
              muted
              playsInline
              preload="metadata"
              className="w-full bg-cream object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.original_name}
              loading="lazy"
              className="w-full bg-cream object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-cream text-sm text-muted">
            Indisponibil
          </div>
        )}

        {/* Voal subtil la hover + data */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="truncate text-left text-xs text-cream">
            {formatDate(item.created_at)}
          </p>
        </div>
      </button>

      {/* Marcaj video */}
      {item.kind === "video" && (
        <span className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          Video
        </span>
      )}

      {/* Ștergere */}
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Șterge ${item.original_name}`}
        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-cream shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-red-700/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60"
      >
        {deleting ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" />
          </svg>
        )}
      </button>
    </div>
  );
}
