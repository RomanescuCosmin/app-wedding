import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Numele bucket-ului privat de Storage. */
export const BUCKET = "wedding-media";

/** Limita de dimensiune pentru imagini: 25 MB. */
export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

/** Limita de dimensiune pentru video: 200 MB. */
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

type Kind = "image" | "video";

interface UploadUrlBody {
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
}

/**
 * Determină tipul (imagine / video) după `contentType`.
 * Returnează `null` dacă nu e nici imagine, nici video.
 */
function kindFromContentType(contentType: string): Kind | null {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return null;
}

/**
 * Curăță numele original al fișierului pentru a-l folosi în path-ul din Storage.
 * Păstrează litere, cifre, punct, liniuță și underscore; restul devin `-`.
 */
function sanitizeFileName(name: string): string {
  const trimmed = name.trim().replace(/\\/g, "/");
  const base = trimmed.split("/").pop() ?? "fisier";
  const safe = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe.length > 0 ? safe.slice(0, 120) : "fisier";
}

/**
 * POST /api/upload-url
 *
 * Body: { fileName: string, contentType: string, size: number }
 * Răspuns 200: { path: string, token: string, signedUrl: string }
 *
 * Generează un signed upload URL pentru încărcare directă în Storage
 * și înregistrează fișierul în tabelul `uploads`.
 */
export async function POST(req: NextRequest) {
  let body: UploadUrlBody;
  try {
    body = (await req.json()) as UploadUrlBody;
  } catch {
    return Response.json(
      { error: "Corpul cererii trebuie să fie JSON valid." },
      { status: 400 },
    );
  }

  const { fileName, contentType, size } = body;

  if (typeof fileName !== "string" || fileName.trim().length === 0) {
    return Response.json(
      { error: "Câmpul „fileName” este obligatoriu." },
      { status: 400 },
    );
  }

  if (typeof contentType !== "string" || contentType.trim().length === 0) {
    return Response.json(
      { error: "Câmpul „contentType” este obligatoriu." },
      { status: 400 },
    );
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return Response.json(
      { error: "Câmpul „size” trebuie să fie un număr pozitiv (octeți)." },
      { status: 400 },
    );
  }

  const kind = kindFromContentType(contentType);
  if (!kind) {
    return Response.json(
      { error: "Sunt acceptate doar fișiere imagine sau video." },
      { status: 415 },
    );
  }

  const maxSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    const tipText = kind === "image" ? "imaginile" : "fișierele video";
    return Response.json(
      {
        error: `Fișier prea mare. Limita pentru ${tipText} este de ${maxMb} MB.`,
      },
      { status: 413 },
    );
  }

  const safeName = sanitizeFileName(fileName);
  const path = `${kind}s/${randomUUID()}-${safeName}`;

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return Response.json(
      { error: "Configurare Supabase incompletă pe server." },
      { status: 500 },
    );
  }

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (signError || !signed) {
    return Response.json(
      { error: "Nu am putut genera URL-ul de încărcare. Încearcă din nou." },
      { status: 502 },
    );
  }

  const { error: insertError } = await admin.from("uploads").insert({
    path,
    kind,
    size,
    original_name: safeName,
  });

  if (insertError) {
    // Curățăm înregistrarea de Storage pentru a nu lăsa un slot orfan.
    await admin.storage.from(BUCKET).remove([path]);
    return Response.json(
      { error: "Nu am putut înregistra fișierul. Încearcă din nou." },
      { status: 500 },
    );
  }

  return Response.json(
    {
      path,
      token: signed.token,
      signedUrl: signed.signedUrl,
    },
    { status: 200 },
  );
}
