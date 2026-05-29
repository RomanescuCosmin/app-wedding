"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Panou cu cod QR către pagina publică de upload (`/`).
 *
 * URL-ul codificat:
 *   1. `NEXT_PUBLIC_SITE_URL` dacă e setat (util pentru a fixa domeniul de
 *      producție, ex. https://numele-tau.vercel.app);
 *   2. altfel `window.location.origin` (determinat pe client).
 *
 * QR-ul folosește module întunecate (culoarea `--color-ink`) pe fundal ivoriu
 * deschis, cu nivel de corecție „H" și o zonă liniștită („quiet zone"), ca să
 * fie ușor de scanat chiar și printat pe hârtie.
 */

// Module întunecate pe fundal deschis — contrast bun pentru scanare.
const QR_FG = "#2e2a24"; // --color-ink
const QR_BG = "#faf6ef"; // --color-ivory
// Dimensiunea QR-ului exportat ca PNG (rezoluție bună pentru print).
const EXPORT_SIZE = 1024;
const EXPORT_MARGIN = 4; // module de „quiet zone"

function resolveEventUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    // Eliminăm un eventual slash final pentru un URL curat.
    return configured.replace(/\/+$/, "") + "/";
  }
  if (typeof window !== "undefined") {
    return window.location.origin + "/";
  }
  return "";
}

function fileSafeName(coupleNames: string): string {
  const base = coupleNames
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `qr-nunta-${base}` : "qr-nunta";
}

interface EventQRCodeProps {
  coupleNames: string;
}

export default function EventQRCode({ coupleNames }: EventQRCodeProps) {
  const [url, setUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  // Canvas ascuns, la rezoluție mare, folosit doar pentru export PNG.
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `window.location.origin` e disponibil doar pe client; setarea după montare
    // e intenționată — evită nepotrivirea de hidratare SSR/CSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(resolveEventUrl());
  }, []);

  function handleDownload() {
    const canvas = exportRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileSafeName(coupleNames)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handlePrint() {
    const canvas = exportRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(
      `<!doctype html><html lang="ro"><head><meta charset="utf-8">` +
        `<title>Cod QR — ${coupleNames}</title>` +
        `<style>` +
        `*{margin:0;padding:0;box-sizing:border-box}` +
        `body{font-family:Georgia,serif;color:#2e2a24;background:#faf6ef;` +
        `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
        `min-height:100vh;text-align:center;padding:40px}` +
        `h1{font-weight:500;font-size:28px;margin-bottom:8px}` +
        `p{color:#8a8276;font-size:14px;margin-bottom:24px;letter-spacing:.1em;text-transform:uppercase}` +
        `img{width:320px;height:320px}` +
        `.u{margin-top:20px;font-size:13px;color:#8a8276;word-break:break-all}` +
        `@media print{body{background:#fff}}` +
        `</style></head><body>` +
        `<h1>${coupleNames}</h1>` +
        `<p>Scanează pentru a încărca poze</p>` +
        `<img src="${dataUrl}" alt="Cod QR" />` +
        `<div class="u">${url}</div>` +
        `</body></html>`,
    );
    win.document.close();
    win.focus();
    // Lăsăm imaginea să se încarce înainte de dialogul de print.
    win.onload = () => win.print();
  }

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponibil — ignorăm discret */
    }
  }

  return (
    <section className="animate-fade-rise mt-16 w-full">
      <div className="mx-auto max-w-md rounded-3xl border border-[#e7dcc7] bg-white/70 px-8 py-10 text-center shadow-sm backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Pentru invitați
        </p>
        <h2 className="mt-3 text-3xl text-ink">Cod QR</h2>

        <div
          className="mx-auto mt-5 h-px w-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          }}
        />

        {/* QR vizibil */}
        <div className="mt-8 flex justify-center">
          <div className="rounded-2xl border border-[#e7dcc7] bg-ivory p-5 shadow-inner">
            {url ? (
              <QRCodeCanvas
                value={url}
                size={232}
                level="H"
                marginSize={4}
                fgColor={QR_FG}
                bgColor={QR_BG}
              />
            ) : (
              <div className="flex h-[272px] w-[272px] items-center justify-center text-sm text-muted">
                Se pregătește codul…
              </div>
            )}
          </div>
        </div>

        {/* URL afișat ca text */}
        {url && (
          <button
            type="button"
            onClick={handleCopy}
            title="Apasă pentru a copia linkul"
            className="mt-5 inline-block max-w-full break-all rounded-full bg-cream/70 px-4 py-2 text-xs text-gold-deep transition-colors hover:bg-cream"
          >
            {copied ? "Link copiat ✓" : url}
          </button>
        )}

        {/* Acțiuni */}
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!url}
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
            Descarcă QR (PNG)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!url}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-gold-deep transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9V3h12v6" />
              <rect x="6" y="13" width="12" height="8" rx="1" />
              <path d="M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
            </svg>
            Printează
          </button>
        </div>
      </div>

      {/* Canvas ascuns, la rezoluție mare — sursa pentru PNG-ul descărcat/printat */}
      <div ref={exportRef} aria-hidden className="sr-only">
        {url && (
          <QRCodeCanvas
            value={url}
            size={EXPORT_SIZE}
            level="H"
            marginSize={EXPORT_MARGIN}
            fgColor={QR_FG}
            bgColor="#ffffff"
          />
        )}
      </div>
    </section>
  );
}
