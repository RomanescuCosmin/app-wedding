// Helper de descărcare a tuturor fișierelor ca arhivă ZIP (client-only).
// Folosit din componenta de galerie admin. Importat dinamic acolo unde e
// nevoie ca să nu împovărăm bundle-ul inițial.

import type { MediaItem } from "@/lib/adminTypes";

export interface ZipProgress {
  /** Câte fișiere au fost procesate până acum. */
  done: number;
  /** Totalul de fișiere de procesat. */
  total: number;
}

/**
 * Dezambiguizează numele de fișier în interiorul arhivei, adăugând un sufix
 * „ (2)", „ (3)" etc. când numele se repetă, păstrând extensia.
 */
function uniqueName(name: string, used: Set<string>): string {
  let candidate = name && name.trim().length > 0 ? name : "fisier";
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }

  const dot = candidate.lastIndexOf(".");
  const base = dot > 0 ? candidate.slice(0, dot) : candidate;
  const ext = dot > 0 ? candidate.slice(dot) : "";

  let counter = 2;
  do {
    candidate = `${base} (${counter})${ext}`;
    counter += 1;
  } while (used.has(candidate));

  used.add(candidate);
  return candidate;
}

/**
 * Descarcă fiecare element ca blob (secvențial, pentru a nu satura rețeaua
 * sau memoria), le adaugă într-un ZIP și salvează arhiva `wedding-media.zip`.
 *
 * @param items   elementele de arhivat (folosește `url` pentru descărcare)
 * @param onProgress callback apelat după fiecare fișier procesat
 * @returns numărul de fișiere care au eșuat la descărcare
 */
export async function downloadAllAsZip(
  items: MediaItem[],
  onProgress?: (p: ZipProgress) => void,
): Promise<{ failed: number }> {
  const [{ default: JSZip }, fileSaver] = await Promise.all([
    import("jszip"),
    import("file-saver"),
  ]);

  const zip = new JSZip();
  const usedNames = new Set<string>();
  const total = items.length;
  let done = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (!item.url) throw new Error("URL indisponibil");
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name = uniqueName(item.original_name, usedNames);
      zip.file(name, blob);
    } catch {
      failed += 1;
    } finally {
      done += 1;
      onProgress?.({ done, total });
    }
  }

  const archive = await zip.generateAsync({ type: "blob" });
  fileSaver.saveAs(archive, "wedding-media.zip");

  return { failed };
}
