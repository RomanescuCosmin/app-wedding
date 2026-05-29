"use client";

import { useCallback, useEffect, useState } from "react";
import type { ListResponse, MediaItem } from "@/lib/adminTypes";
import type { ZipProgress } from "@/lib/downloadZip";
import LoginScreen from "./LoginScreen";
import Lightbox from "./Lightbox";
import MediaCard from "./MediaCard";
import EventQRCode from "./EventQRCode";
import ConfirmDialog from "./ConfirmDialog";

type AuthState = "checking" | "out" | "in";

interface AdminGalleryProps {
  coupleNames: string;
}

function momentsLabel(n: number): string {
  if (n === 1) return "1 moment";
  return `${n} momente`;
}

/**
 * Componenta principală a zonei mirilor: verifică sesiunea, afișează login-ul
 * sau galeria, gestionează lightbox-ul, ștergerea și descărcarea ca ZIP.
 */
export default function AdminGallery({ coupleNames }: AdminGalleryProps) {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Elementul pentru care s-a cerut ștergerea (deschide dialogul de confirmare).
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Stare descărcare ZIP.
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipProgress | null>(null);
  const [zipMessage, setZipMessage] = useState<string | null>(null);

  /** Încarcă lista; tratează 401 setând starea de „neautentificat". */
  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list", { cache: "no-store" });
      setLoadError(null);
      if (res.status === 401) {
        setAuth("out");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setLoadError(data?.error ?? "Nu am putut încărca galeria.");
        setAuth("in");
        return;
      }
      const data = (await res.json()) as ListResponse;
      setItems(data.items ?? []);
      setAuth("in");
    } catch {
      setLoadError("Nu am putut contacta serverul.");
      setAuth("in");
    }
  }, []);

  useEffect(() => {
    // Verificarea inițială a sesiunii: toate setState-urile rulează după
    // `await`, niciodată sincron în corpul efectului.
    async function check() {
      await loadList();
    }
    void check();
  }, [loadList]);

  /** Cere ștergerea unui element — deschide dialogul de confirmare. */
  const requestDelete = useCallback((item: MediaItem) => {
    setDeleteError(null);
    setPendingDelete(item);
  }, []);

  /** Închide dialogul de confirmare (dacă nu e o ștergere în curs). */
  const cancelDelete = useCallback(() => {
    if (deletingId) return;
    setPendingDelete(null);
    setDeleteError(null);
  }, [deletingId]);

  /** Confirmă și execută efectiv ștergerea elementului din `pendingDelete`. */
  const confirmDelete = useCallback(async () => {
    const item = pendingDelete;
    if (!item || deletingId) return;

    setDeleteError(null);
    setDeletingId(item.id);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item.path, id: item.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setDeleteError(data?.error ?? "Nu am putut șterge fișierul.");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      // Dacă lightbox-ul era deschis, închide-l (elementul poate să fi dispărut).
      setLightboxIndex(null);
      setPendingDelete(null);
    } catch {
      setDeleteError("Nu am putut contacta serverul.");
    } finally {
      setDeletingId(null);
    }
  }, [pendingDelete, deletingId]);

  const handleDownloadAll = useCallback(async () => {
    if (zipBusy || items.length === 0) return;
    setZipBusy(true);
    setZipMessage(null);
    setZipProgress({ done: 0, total: items.length });
    try {
      const { downloadAllAsZip } = await import("@/lib/downloadZip");
      const { failed } = await downloadAllAsZip(items, (p) =>
        setZipProgress(p),
      );
      setZipMessage(
        failed > 0
          ? `Arhivă creată, dar ${failed} fișier(e) nu au putut fi descărcate.`
          : "Arhiva a fost descărcată.",
      );
    } catch {
      setZipMessage("Nu am putut crea arhiva. Încearcă din nou.");
    } finally {
      setZipBusy(false);
      setZipProgress(null);
    }
  }, [items, zipBusy]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignorăm — oricum trecem în starea de login */
    }
    setItems([]);
    setAuth("out");
  }, []);

  // ── Stări de nivel înalt ────────────────────────────────────────────────
  if (auth === "checking") {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="animate-pulse text-sm tracking-[0.2em] text-muted">
          Se încarcă…
        </p>
      </div>
    );
  }

  if (auth === "out") {
    return <LoginScreen onSuccess={loadList} />;
  }

  // ── Galeria ─────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full max-w-6xl flex-1 flex-col">
      <header className="animate-fade-rise flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Zona mirilor
        </p>
        <h1 className="mt-3 text-4xl text-ink sm:text-5xl">{coupleNames}</h1>
        <div
          className="mx-auto mt-6 h-px w-24"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          }}
        />
        <p className="mt-5 text-base text-muted">
          {momentsLabel(items.length)} de la invitați
        </p>
      </header>

      {/* Bara de acțiuni */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={zipBusy || items.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium uppercase tracking-[0.14em] text-ivory shadow-lg shadow-[#c9a24b]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
            <path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
          </svg>
          {zipBusy && zipProgress
            ? `Se pregătește arhiva… ${zipProgress.done}/${zipProgress.total}`
            : "Descarcă tot"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-gold-deep transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Ieși
        </button>
      </div>

      {zipMessage && (
        <p className="mt-3 text-center text-sm text-muted" role="status">
          {zipMessage}
        </p>
      )}

      {loadError && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm text-red-700" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void loadList()}
            className="rounded-full border border-gold/50 px-5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-gold-deep transition-colors hover:bg-gold/10"
          >
            Reîncearcă
          </button>
        </div>
      )}

      {/* Grila */}
      {items.length === 0 && !loadError ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-2xl">
            <span aria-hidden>🤍</span>
          </div>
          <p className="mt-5 text-lg text-ink">Încă nu există momente</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Pozele și clipurile încărcate de invitați vor apărea aici.
          </p>
        </div>
      ) : (
        <ul className="mt-12 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>li]:mb-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="animate-fade-rise break-inside-avoid"
              style={{
                animationDelay: `${Math.min(index * 0.04, 0.6)}s`,
              }}
            >
              <MediaCard
                item={item}
                deleting={deletingId === item.id}
                onOpen={() => setLightboxIndex(index)}
                onDelete={() => requestDelete(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Cod QR pentru invitați — vizibil doar în zona autentificată */}
      <EventQRCode coupleNames={coupleNames} />

      {lightboxIndex !== null && items[lightboxIndex] && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Ștergi acest moment?"
          message={`„${pendingDelete.original_name}" va fi șters definitiv din galerie și din stocare. Acțiunea nu poate fi anulată.`}
          confirmLabel="Șterge"
          cancelLabel="Anulează"
          busy={deletingId === pendingDelete.id}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
