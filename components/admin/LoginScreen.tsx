"use client";

import { useState } from "react";

interface LoginScreenProps {
  /** Apelat după autentificare reușită, ca să reîncărcăm galeria. */
  onSuccess: () => void;
}

/**
 * Ecranul de login al zonei mirilor: un singur câmp parolă + buton „Intră".
 * La succes setează cookie-ul de sesiune (server) și anunță părintele.
 */
export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setPassword("");
        onSuccess();
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Parolă incorectă.");
    } catch {
      setError("Nu am putut contacta serverul. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex w-full max-w-sm flex-1 flex-col items-center justify-center py-16">
      <div
        className="animate-fade-rise w-full rounded-3xl border border-[#e7dcc7] bg-white/70 px-8 py-12 text-center shadow-sm backdrop-blur-sm"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold-deep">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted">
          Zona mirilor
        </p>
        <h1 className="mt-3 text-3xl text-ink">Galeria nunții</h1>

        <div
          className="mx-auto mt-6 h-px w-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          }}
        />

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Introdu parola pentru a vedea toate momentele încărcate de invitați.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="Parola"
            aria-label="Parola"
            className="w-full rounded-full border border-[#dcceb2] bg-white/80 px-5 py-3 text-center text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
          />

          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="mt-1 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-ivory shadow-lg shadow-[#c9a24b]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)",
            }}
          >
            {loading ? "Se verifică…" : "Intră"}
          </button>
        </form>
      </div>
    </section>
  );
}
