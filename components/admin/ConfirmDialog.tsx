"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  /** Titlul scurt al dialogului. */
  title: string;
  /** Mesajul explicativ (poate conține numele fișierului). */
  message: string;
  /** Eticheta butonului de confirmare (acțiunea distructivă). */
  confirmLabel?: string;
  /** Eticheta butonului de anulare. */
  cancelLabel?: string;
  /** True cât timp acțiunea e în curs (afișează spinner, blochează butoanele). */
  busy?: boolean;
  /** Mesaj de eroare afișat în dialog (dacă acțiunea a eșuat). */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog de confirmare stilizat (înlocuiește `window.confirm`), în paleta
 * nunții. Închidere cu Esc sau click pe voal; blochează scroll-ul de fundal.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulează",
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
      else if (e.key === "Enter" && !busy) onConfirm();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Voal */}
      <button
        type="button"
        aria-label="Închide"
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
        style={{ animation: "fade-rise 0.25s ease both" }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#e8dcc4] bg-ivory px-7 py-8 text-center shadow-[0_30px_80px_-30px_rgba(80,60,20,0.45)] sm:px-9"
        style={{ animation: "card-rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Iconiță coș într-un cerc */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" />
          </svg>
        </div>

        <h2 className="mt-5 text-2xl text-ink">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {message}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {/* Acțiuni */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-gold-deep transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-red-600 to-red-700 px-7 py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream shadow-lg shadow-red-700/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {busy && (
              <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
              </svg>
            )}
            {busy ? "Se șterge…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
