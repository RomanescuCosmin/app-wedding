import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";

/**
 * POST /api/admin/logout
 *
 * Expiră cookie-ul de sesiune admin (`admin_session`), deconectând mirii.
 * Răspuns 200: { ok: true }.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true }, { status: 200 });
}
