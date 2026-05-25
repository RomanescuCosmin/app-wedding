import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BUCKET } from "@/app/api/upload-url/route";

interface DeleteBody {
  path?: unknown;
  id?: unknown;
}

/**
 * POST /api/admin/delete
 *
 * Necesită sesiune admin (cookie `admin_session`).
 * Body: { path: string, id: string }
 * Răspuns 200: { ok: true }
 * Răspuns 401: { error } — neautentificat.
 *
 * Șterge fișierul din Storage și rândul corespunzător din tabelul `uploads`.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return Response.json(
      { error: "Corpul cererii trebuie să fie JSON valid." },
      { status: 400 },
    );
  }

  const { path, id } = body;
  if (typeof path !== "string" || path.trim().length === 0) {
    return Response.json(
      { error: "Câmpul „path” este obligatoriu." },
      { status: 400 },
    );
  }
  if (typeof id !== "string" || id.trim().length === 0) {
    return Response.json(
      { error: "Câmpul „id” este obligatoriu." },
      { status: 400 },
    );
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

  const { error: storageError } = await admin.storage
    .from(BUCKET)
    .remove([path]);

  if (storageError) {
    return Response.json(
      { error: "Nu am putut șterge fișierul din Storage." },
      { status: 502 },
    );
  }

  const { error: dbError } = await admin.from("uploads").delete().eq("id", id);

  if (dbError) {
    return Response.json(
      { error: "Fișierul a fost șters, dar nu și înregistrarea din bază." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true }, { status: 200 });
}
