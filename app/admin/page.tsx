// Pagina admin (zona mirilor) — Stage 4.
// Shell server component cu fundalul atmosferic; conținutul (login + galerie)
// trăiește într-un client component, fiindcă verificăm sesiunea și manipulăm
// jszip/file-saver în browser.

import type { Metadata } from "next";
import AdminGallery from "@/components/admin/AdminGallery";

export const metadata: Metadata = {
  title: "Galeria nunții · Zona mirilor",
  robots: { index: false, follow: false },
};

const COUPLE_NAMES = process.env.NEXT_PUBLIC_COUPLE_NAMES || "Ana & Mihai";

export default function AdminPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      {/* Fundal atmosferic — degradeuri discrete ivoriu → crem */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, var(--color-cream) 0%, var(--color-ivory) 55%, var(--color-ivory) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--color-gold)" }}
      />

      <AdminGallery coupleNames={COUPLE_NAMES} />
    </main>
  );
}
