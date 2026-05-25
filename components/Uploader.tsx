"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FileItem from "./FileItem";
import {
  detectKind,
  processFile,
  requestUploadUrl,
  uploadWithSignedUrl,
} from "@/lib/uploadClient";
import {
  MAX_CONCURRENT_UPLOADS,
  type UploadItem,
} from "@/lib/uploadTypes";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `f${Date.now()}-${idCounter}`;
}

export default function Uploader() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Referință stabilă la items pentru a o citi din coada de upload
  // fără a re-crea funcțiile la fiecare schimbare de stare.
  const itemsRef = useRef<UploadItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Curăță URL-urile de preview la demontare ca să nu rămână memorie ocupată.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      });
    };
  }, []);

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it)),
    );
  }, []);

  /** Procesează + urcă un singur fișier, actualizând starea pe parcurs. */
  const runItem = useCallback(
    async (id: string) => {
      const current = itemsRef.current.find((it) => it.id === id);
      if (!current) return;

      try {
        patch(id, { status: "processing", progress: 8, error: undefined });

        const { file } = await processFile(current.file);
        patch(id, { size: file.size, displayName: file.name, progress: 35 });

        // Pas 1: cere signed URL.
        patch(id, { status: "uploading", progress: 55 });
        const { path, token } = await requestUploadUrl(file);

        // Pas 2: upload efectiv (fără progres fin nativ -> punte 55 -> 90).
        patch(id, { progress: 80 });
        await uploadWithSignedUrl(path, token, file);

        patch(id, { status: "done", progress: 100 });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "A apărut o eroare neașteptată.";
        patch(id, { status: "error", error: message });
      }
    },
    [patch],
  );

  /**
   * Rulează coada cu maxim `MAX_CONCURRENT_UPLOADS` simultan.
   * Pornește toate fișierele aflate în „pending".
   */
  const runQueue = useCallback(async (explicitIds?: string[]) => {
    const queue =
      explicitIds ??
      itemsRef.current
        .filter((it) => it.status === "pending")
        .map((it) => it.id);

    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const id = queue[cursor];
        cursor += 1;
        await runItem(id);
      }
    }

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT_UPLOADS, queue.length) },
      () => worker(),
    );
    await Promise.all(workers);
  }, [runItem]);

  /** Adaugă fișiere noi în listă și pornește coada. */
  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const newItems: UploadItem[] = files.map((file) => {
        const kind = detectKind(file);
        let previewUrl: string | undefined;
        // Preview doar pentru imagini „normale" (HEIC nu poate fi afișat
        // direct în <img>, deci îl lăsăm cu placeholder de imagine).
        if (
          kind === "image" &&
          file.type.startsWith("image/") &&
          file.type !== "image/heic" &&
          file.type !== "image/heif"
        ) {
          previewUrl = URL.createObjectURL(file);
        }
        return {
          id: nextId(),
          file,
          displayName: file.name,
          size: file.size,
          kind,
          status: "pending",
          progress: 0,
          previewUrl,
        };
      });

      setItems((prev) => {
        const next = [...prev, ...newItems];
        itemsRef.current = next; // sincronizare imediată pentru coadă
        return next;
      });
      void runQueue(newItems.map((it) => it.id));
    },
    [runQueue],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = ""; // permite re-selectarea aceluiași fișier
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleRetry = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "pending" as const,
                progress: 0,
                error: undefined,
              }
            : it,
        );
        itemsRef.current = next;
        return next;
      });
      void runQueue([id]);
    },
    [runQueue],
  );

  const retryAll = useCallback(() => {
    const ids: string[] = [];
    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.status === "error") {
          ids.push(it.id);
          return {
            ...it,
            status: "pending" as const,
            progress: 0,
            error: undefined,
          };
        }
        return it;
      });
      itemsRef.current = next;
      return next;
    });
    void runQueue(ids);
  }, [runQueue]);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const reset = useCallback(() => {
    itemsRef.current.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
  }, []);

  // Derivate pentru rezumat / stări globale.
  const total = items.length;
  const doneCount = items.filter((it) => it.status === "done").length;
  const errorCount = items.filter((it) => it.status === "error").length;
  const activeCount = items.filter(
    (it) =>
      it.status === "pending" ||
      it.status === "processing" ||
      it.status === "uploading",
  ).length;

  const allDone = total > 0 && doneCount === total;

  // ── Ecranul de mulțumire ────────────────────────────────────────────────
  if (allDone) {
    return (
      <section className="animate-fade-rise w-full max-w-xl text-center">
        <div className="rounded-3xl border border-[#e7dcc7] bg-white/70 px-8 py-12 shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream text-2xl">
            <span aria-hidden>💛</span>
          </div>
          <h2 className="mt-6 text-3xl text-ink">Mulțumim din suflet!</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {doneCount === 1
              ? "Poza ta a ajuns la miri."
              : `Cele ${doneCount} fișiere ale tale au ajuns la miri.`}{" "}
            Înseamnă mult pentru noi.
          </p>
          <div
            className="mx-auto mt-7 h-px w-20"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
            }}
          />
          <button
            type="button"
            onClick={reset}
            className="mt-7 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-ivory shadow-lg shadow-[#c9a24b]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            style={{
              background:
                "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)",
            }}
          >
            Mai încarcă
          </button>
        </div>
      </section>
    );
  }

  // ── Interfața principală de upload ──────────────────────────────────────
  return (
    <section className="w-full max-w-xl">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onInputChange}
        className="sr-only"
      />

      {/* Dropzone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
          isDragging
            ? "border-gold bg-gold/10"
            : "border-[#dcceb2] bg-white/50 hover:border-gold/70 hover:bg-white/70"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold-deep transition-transform duration-300 group-hover:-translate-y-0.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" />
          </svg>
        </span>
        <span
          className="mt-5 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-ivory shadow-lg shadow-[#c9a24b]/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)",
          }}
        >
          Adaugă poze / video
        </span>
        <span className="mt-4 text-sm text-muted">
          Atinge pentru a alege din galerie sau trage fișierele aici
        </span>
      </button>

      {/* Rezumat + acțiuni globale */}
      {total > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {doneCount}/{total} trimise
            {activeCount > 0 && " · se lucrează…"}
          </p>
          {errorCount > 0 && (
            <button
              type="button"
              onClick={retryAll}
              className="rounded-full border border-gold/60 px-4 py-1.5 text-xs font-medium text-gold-deep transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Reîncearcă tot ({errorCount})
            </button>
          )}
        </div>
      )}

      {/* Lista de fișiere */}
      {total > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <FileItem
              key={item.id}
              item={item}
              onRetry={handleRetry}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
