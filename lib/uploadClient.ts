// Logică de procesare + upload pe partea de client (Stage 3).
// Toate funcțiile presupun rularea în browser.

import { supabaseBrowser } from "./supabase";
import {
  BUCKET,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type UploadUrlResponse,
} from "./uploadTypes";

const HEIC_EXT = /\.(heic|heif)$/i;

/** Detectează dacă un fișier este HEIC/HEIF (poze din iPhone). */
function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    // Unele telefoane nu setează `type` corect — verificăm și extensia.
    (file.type === "" && HEIC_EXT.test(file.name))
  );
}

/** „image" sau „video" pe baza tipului MIME / extensiei. */
export function detectKind(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  // HEIC fără tip corect -> tratăm ca imagine.
  if (HEIC_EXT.test(file.name)) return "image";
  // Fallback prin extensie video.
  if (/\.(mp4|mov|webm|m4v|avi|3gp|mkv)$/i.test(file.name)) return "video";
  return "image";
}

/** Format prietenos pentru dimensiune (ex. „3,4 MB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1).replace(".", ",")} MB`;
}

/**
 * Convertește HEIC/HEIF în JPEG. Import dinamic ca să nu strice build-ul SSR
 * (heic2any folosește API-uri de browser).
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  })) as Blob | Blob[];

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(HEIC_EXT, "") + ".jpg";
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Comprimă imaginile mari. Import dinamic (API de browser).
 * Țintă: max ~2,5 MB / 2560px latura mare, păstrând o calitate bună.
 * Imaginile deja mici sunt lăsate neatinse.
 */
async function compressImage(file: File): Promise<File> {
  // Sub 1,5 MB nu merită comprimarea — risc de pierdere fără câștig real.
  if (file.size <= 1.5 * 1024 * 1024) return file;

  const imageCompression = (await import("browser-image-compression")).default;
  const compressed = await imageCompression(file, {
    maxSizeMB: 2.5,
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: "image/jpeg",
  });

  // Dacă din vreun motiv a ieșit mai mare, păstrăm originalul.
  if (compressed.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([compressed], newName, {
    type: compressed.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

export interface ProcessedFile {
  file: File;
  kind: "image" | "video";
}

/**
 * Pregătește un fișier pentru upload: conversie HEIC -> comprimare imagine,
 * apoi validează limita de mărime. Aruncă eroare (în română) la depășire.
 */
export async function processFile(input: File): Promise<ProcessedFile> {
  const kind = detectKind(input);

  if (kind === "video") {
    if (input.size > MAX_VIDEO_BYTES) {
      throw new Error("Clipul este prea mare (limita este 200 MB).");
    }
    return { file: input, kind };
  }

  // Imagine: conversie HEIC dacă e cazul, apoi comprimare.
  let working = input;
  try {
    if (isHeic(working)) {
      working = await convertHeicToJpeg(working);
    }
    working = await compressImage(working);
  } catch {
    // Dacă procesarea eșuează, încercăm să urcăm originalul (dacă încape).
    working = input;
  }

  if (working.size > MAX_IMAGE_BYTES) {
    throw new Error(
      "Poza este prea mare chiar și după optimizare (limita este 25 MB).",
    );
  }

  return { file: working, kind };
}

/** Cere un signed URL de la backend pentru un fișier procesat. */
export async function requestUploadUrl(
  file: File,
): Promise<UploadUrlResponse> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!res.ok) {
    switch (res.status) {
      case 415:
        throw new Error("Tipul fișierului nu este acceptat.");
      case 413:
        throw new Error("Fișierul depășește limita de mărime.");
      case 400:
        throw new Error("Cerere invalidă. Încearcă din nou.");
      default:
        throw new Error("Serverul nu a putut pregăti încărcarea.");
    }
  }

  return (await res.json()) as UploadUrlResponse;
}

/** Urcă efectiv fișierul folosind signed URL-ul de la Supabase Storage. */
export async function uploadWithSignedUrl(
  path: string,
  token: string,
  file: File,
): Promise<void> {
  const supabase = supabaseBrowser();
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(path, token, file);

  if (error) {
    throw new Error("Încărcarea nu a reușit. Verifică conexiunea.");
  }
}
