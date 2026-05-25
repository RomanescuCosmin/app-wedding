import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";

interface LoginBody {
  password?: unknown;
}

/**
 * POST /api/admin/login
 *
 * Body: { password: string }
 * Răspuns 200: { ok: true }  — setează cookie httpOnly `admin_session`.
 * Răspuns 401: { error: string } — parolă greșită.
 *
 * Compară parola (timing-safe) cu `ADMIN_PASSWORD` și, la succes, emite
 * un cookie de sesiune semnat, valabil ~12 ore.
 */
export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "Zona de administrare nu este configurată pe server." },
      { status: 500 },
    );
  }

  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return Response.json(
      { error: "Corpul cererii trebuie să fie JSON valid." },
      { status: 400 },
    );
  }

  const { password } = body;
  if (typeof password !== "string" || password.length === 0) {
    return Response.json(
      { error: "Introdu parola." },
      { status: 400 },
    );
  }

  if (!verifyPassword(password)) {
    return Response.json(
      { error: "Parolă incorectă." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return Response.json({ ok: true }, { status: 200 });
}
