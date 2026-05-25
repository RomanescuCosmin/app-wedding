"use client";

import { formatBytes } from "@/lib/uploadClient";
import type { UploadItem } from "@/lib/uploadTypes";

interface FileItemProps {
  item: UploadItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

/** Eticheta de stare în română, afișată sub nume. */
function statusLabel(item: UploadItem): string {
  switch (item.status) {
    case "pending":
      return "În așteptare";
    case "processing":
      return "Se optimizează…";
    case "uploading":
      return "Se încarcă…";
    case "done":
      return "Trimisă";
    case "error":
      return item.error ?? "A eșuat";
  }
}

function VideoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="M15.5 10.5 21 8v8l-5.5-2.5" />
    </svg>
  );
}

export default function FileItem({ item, onRetry, onRemove }: FileItemProps) {
  const isDone = item.status === "done";
  const isError = item.status === "error";
  const isBusy = item.status === "processing" || item.status === "uploading";

  return (
    <li
      className="animate-fade-rise flex items-center gap-4 rounded-2xl border border-[#e7dcc7] bg-white/70 p-3 shadow-sm backdrop-blur-sm"
      style={{ animationDuration: "0.5s" }}
    >
      {/* Thumbnail / poster */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt={item.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold-deep">
            <VideoGlyph />
          </div>
        )}

        {/* Voal de stare peste thumbnail */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2e2a24]/45 text-ivory">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#7a2e2e]/55 text-ivory">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Detalii + progres */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {item.displayName}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span
            className={
              isError
                ? "text-[#a23b3b]"
                : isDone
                  ? "text-gold-deep"
                  : "text-muted"
            }
          >
            {statusLabel(item)}
          </span>
          <span aria-hidden className="text-[#d8ccb4]">
            •
          </span>
          <span className="text-muted">{formatBytes(item.size)}</span>
        </div>

        {/* Bara de progres — vizibilă cât timp nu e eroare */}
        {!isError && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#ece2d0]">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${item.progress}%`,
                background:
                  "linear-gradient(90deg, var(--color-gold), var(--color-gold-deep))",
              }}
            />
          </div>
        )}
      </div>

      {/* Acțiune contextuală */}
      <div className="shrink-0">
        {isError && (
          <button
            type="button"
            onClick={() => onRetry(item.id)}
            className="rounded-full border border-gold/60 px-3 py-1.5 text-xs font-medium text-gold-deep transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Reîncearcă
          </button>
        )}
        {!isBusy && !isError && !isDone && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Elimină fișierul"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-[#ece2d0] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        {isDone && (
          <span className="text-gold-deep" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
    </li>
  );
}
