import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BUCKET } from "@/app/api/upload-url/route";

/** Durata de valabilitate a URL-urilor de descărcare semnate: 1 oră. */
const SIGNED_URL_TTL = 3600;

interface UploadRow {
  id: string;
  path: string;
  kind: "image" | "video";
  size: number;
  original_name: string;
  created_at: string;
}

/**
 * GET /api/admin/list
 *
 * Necesită sesiune admin (cookie `admin_session`).
 * Răspuns 200: { items: Array<{ id, path, kind, size, original_name, created_at, url }> }
 * Răspuns 401: { error } — neautentificat.
 *
 * Listează toate fișierele (desc. după dată) și atașează un signed download URL
 * (valabil 1 oră) pentru fiecare.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return Response.json(
      { error: "Configurare Supabase incompletă pe server." },
      { status: 500 },
    );
  }

  const { data, error } = await admin
    .from("uploads")
    .select("id, path, kind, size, original_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: "Nu am putut încărca lista de fișiere." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as UploadRow[];

  const items = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(row.path, SIGNED_URL_TTL);

      return {
        id: row.id,
        path: row.path,
        kind: row.kind,
        size: row.size,
        original_name: row.original_name,
        created_at: row.created_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  return Response.json({ items }, { status: 200 });
}
