// Tipuri și constante partajate pentru fluxul de upload (Stage 3).

/** Limite de mărime acceptate de backend (Stage 2). */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

/** Numărul maxim de upload-uri simultane. */
export const MAX_CONCURRENT_UPLOADS = 3;

/** Bucket-ul Supabase Storage. */
export const BUCKET = "wedding-media";

/** Stările prin care trece un fișier de la selectare până la final. */
export type UploadStatus =
  | "pending" // în coadă, neprocesat încă
  | "processing" // conversie HEIC / comprimare
  | "uploading" // se urcă la server
  | "done" // încărcat cu succes
  | "error"; // a eșuat (vezi `error`)

export interface UploadItem {
  /** Identificator stabil pentru randare (nu se schimbă la retry). */
  id: string;
  /** Fișierul original selectat de utilizator. */
  file: File;
  /** Numele afișat (poate diferi de original după conversia HEIC). */
  displayName: string;
  /** Dimensiunea curentă în bytes (se actualizează după comprimare). */
  size: number;
  /** „image" sau „video" — dictează preview-ul și limita. */
  kind: "image" | "video";
  status: UploadStatus;
  /** 0–100. */
  progress: number;
  /** URL local pentru thumbnail (doar imagini). Eliberat la cleanup. */
  previewUrl?: string;
  /** Mesaj de eroare în română, când `status === "error"`. */
  error?: string;
}

/** Răspunsul de la POST /api/upload-url. */
export interface UploadUrlResponse {
  path: string;
  token: string;
  signedUrl: string;
}
