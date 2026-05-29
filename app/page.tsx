// Pagina publică — invitație minimalistă (numele mirilor și ale nașilor),
// urmată imediat de fluxul de upload pentru invitați.
// Server component pentru conținut (citește env); upload într-un client component.

import Invitation from "@/components/Invitation";
import Uploader from "@/components/Uploader";

const COUPLE_NAMES = process.env.NEXT_PUBLIC_COUPLE_NAMES || "Ana & Mihai";

/** Extrage inițialele cuplului din „Andrei & Irina" → ["A", "I"]. */
function coupleInitials(names: string): [string, string] {
  // Desparte pe „&", „+" (cu spații opționale) sau cuvântul „și" (între spații).
  const parts = names.split(/\s*[&+]\s*|\s+și\s+/i).filter(Boolean);
  const first = parts[0]?.trim().charAt(0).toUpperCase() || "A";
  const second = parts[1]?.trim().charAt(0).toUpperCase() || "I";
  return [first, second];
}

export default function Home() {
  const initials = coupleInitials(COUPLE_NAMES);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
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

      {/* Invitația minimalistă */}
      <Invitation coupleNames={COUPLE_NAMES} initials={initials} />

      {/* Invitație la upload — imediat după */}
      <div
        className="animate-fade-rise mt-12 flex w-full max-w-lg flex-col items-center text-center"
        style={{ animationDelay: "0.5s" }}
      >
        <span
          aria-hidden
          className="h-10 w-px bg-gradient-to-b from-transparent to-gold/50"
        />
        <h2 className="mt-6 text-2xl leading-tight text-ink sm:text-3xl">
          Împarte un moment cu noi
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          Ai surprins un cadru drag de la nunta noastră? Încarcă-l aici.
        </p>
      </div>

      {/* Flux de upload */}
      <div
        className="animate-fade-rise mt-8 flex w-full justify-center"
        style={{ animationDelay: "0.6s" }}
      >
        <Uploader />
      </div>
    </main>
  );
}
