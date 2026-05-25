// Pagina publică de upload (Stage 3).
// Server component pentru hero (citește env), cu fluxul de upload într-un
// client component (<Uploader />). Mobile-first, ivoriu/auriu, serif.

import Uploader from "@/components/Uploader";

const COUPLE_NAMES = process.env.NEXT_PUBLIC_COUPLE_NAMES || "Ana & Mihai";
const WEDDING_DATE = process.env.NEXT_PUBLIC_WEDDING_DATE; // ex. 2026-06-12

function formatWeddingDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function Home() {
  const formattedDate = formatWeddingDate(WEDDING_DATE);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 pb-24 pt-16 text-center sm:px-8 sm:pt-24">
      {/* Fundal atmosferic — degradeuri discrete ivoriu → crem */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, var(--color-cream) 0%, var(--color-ivory) 55%, var(--color-ivory) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--color-gold)" }}
      />

      {/* Hero */}
      <header className="flex w-full max-w-2xl flex-col items-center">
        <p
          className="animate-fade-rise text-xs uppercase tracking-[0.35em] text-muted sm:text-sm"
          style={{ animationDelay: "0.05s" }}
        >
          Pozele nunții noastre
        </p>

        <h1
          className="animate-fade-rise mt-6 text-5xl leading-[1.05] text-ink sm:text-6xl md:text-7xl"
          style={{ animationDelay: "0.15s" }}
        >
          {COUPLE_NAMES}
        </h1>

        <div
          className="animate-draw-line mt-8 h-px w-28"
          style={{
            animationDelay: "0.4s",
            background:
              "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          }}
        />

        {formattedDate && (
          <p
            className="animate-fade-rise mt-8 text-base tracking-wide text-gold-deep sm:text-lg"
            style={{ animationDelay: "0.3s" }}
          >
            {formattedDate}
          </p>
        )}

        <p
          className="animate-fade-rise mt-6 max-w-md text-lg leading-relaxed text-muted sm:text-xl"
          style={{ animationDelay: "0.45s" }}
        >
          Împarte cu noi momentele surprinse de tine
        </p>
      </header>

      {/* Flux de upload */}
      <div
        className="animate-fade-rise mt-12 flex w-full justify-center"
        style={{ animationDelay: "0.6s" }}
      >
        <Uploader />
      </div>
    </main>
  );
}
