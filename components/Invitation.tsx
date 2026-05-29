// Invitația digitală — variantă minimalistă: doar numele mirilor și ale nașilor.
// Server component — fără interactivitate, doar micro-animații CSS la încărcare.
//
// ▸ Pentru a edita nașii, modifică `GODPARENTS` de mai jos.

/** Nașii — editează aici. */
const GODPARENTS = "Mitică și Liliana Smeadă";

/** Inimioară aurie, plină — folosită în monogram. */
function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.9-10-9.5C.3 8.2 1.7 4.5 5.2 4.5c2 0 3.4 1.2 4.3 2.6.4.6 1.6.6 2 0 .9-1.4 2.3-2.6 4.3-2.6 3.5 0 4.9 3.7 3.2 7C19.5 16.1 12 21 12 21z" />
    </svg>
  );
}

/** Crenguță de măslin delicată — accent botanic din colțuri. */
function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 70 130"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M46 128 C40 96 30 62 20 6" />
      <g strokeWidth="0.9">
        <path d="M42 104 C30 102 22 94 26 84 C38 86 46 95 42 104 Z" />
        <path d="M38 88 C50 86 58 92 55 102 C43 100 35 92 38 88 Z" />
        <path d="M33 74 C22 71 16 62 21 53 C32 56 38 65 33 74 Z" />
        <path d="M29 58 C40 55 47 60 45 70 C34 68 27 60 29 58 Z" />
        <path d="M24 42 C14 38 9 29 15 21 C25 25 30 34 24 42 Z" />
        <path d="M21 28 C31 24 38 28 37 38 C27 37 20 30 21 28 Z" />
      </g>
    </svg>
  );
}

/** Despărțitor cu rombul auriu central. */
function Divider() {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/60" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

interface InvitationProps {
  /** Numele cuplului, ex. „Andrei & Irina" (din env). */
  coupleNames: string;
  /** Inițialele pentru monogram, ex. „A" și „I". */
  initials: [string, string];
}

export default function Invitation({ coupleNames, initials }: InvitationProps) {
  return (
    <section className="animate-card-rise relative w-full max-w-lg">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-[#e8dcc4] px-8 py-14 shadow-[0_30px_80px_-30px_rgba(80,60,20,0.35)] sm:px-12 sm:py-16"
        style={{
          background:
            "radial-gradient(130% 80% at 50% 0%, #fffdf8 0%, var(--color-ivory) 60%, #f6efe2 100%)",
        }}
      >
        {/* Arcada aurie dublă (deschisă la bază) */}
        <div
          aria-hidden
          className="animate-arch-reveal pointer-events-none absolute inset-x-5 top-6 bottom-0 rounded-t-[48%_30%] border border-b-0 border-gold/45 sm:inset-x-8"
        />
        <div
          aria-hidden
          className="animate-arch-reveal pointer-events-none absolute inset-x-7 top-8 bottom-0 rounded-t-[46%_28%] border border-b-0 border-gold/25 sm:inset-x-11"
          style={{ animationDelay: "0.08s" }}
        />

        {/* Accente botanice */}
        <Sprig className="pointer-events-none absolute -bottom-2 right-3 h-32 w-16 text-gold/45 sm:right-7 sm:h-40 sm:w-20" />
        <Sprig className="pointer-events-none absolute -bottom-2 left-3 h-28 w-14 -scale-x-100 text-gold/30 sm:left-7 sm:h-36 sm:w-16" />

        {/* Conținut */}
        <div className="relative flex flex-col items-center text-center">
          {/* Monogram A ♥ I */}
          <div className="flex items-center gap-2.5 font-serif text-2xl tracking-[0.18em] text-gold-deep sm:text-3xl">
            <span>{initials[0]}</span>
            <Heart className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
            <span>{initials[1]}</span>
          </div>

          <p className="mt-7 text-[0.7rem] uppercase tracking-[0.4em] text-muted">
            Cu drag,
          </p>

          {/* Numele mirilor — punctul focal */}
          <h1 className="font-script mt-2 text-7xl leading-[0.95] text-ink sm:text-8xl">
            {coupleNames}
          </h1>

          <div className="mt-9">
            <Divider />
          </div>

          {/* Nașii */}
          <p className="mt-7 text-[0.7rem] uppercase tracking-[0.4em] text-muted">
            Alături de nașii
          </p>
          <p className="font-script mt-2 text-4xl text-gold-deep sm:text-5xl">
            {GODPARENTS}
          </p>
        </div>
      </div>
    </section>
  );
}
