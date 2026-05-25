import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Numele cookie-ului de sesiune pentru zona de administrare.
 * Reutilizat de rutele admin și (în Stage 4) de UI.
 */
export const ADMIN_COOKIE = "admin_session";

/** Durata sesiunii admin în secunde (~12 ore). */
export const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;

/**
 * Secretul folosit pentru a semna valoarea cookie-ului de sesiune.
 *
 * Folosim `ADMIN_PASSWORD` ca secret de semnare: e simplu și suficient
 * pentru acest scop (un singur administrator, fără cont de utilizator).
 * Astfel, dacă parola se schimbă, toate sesiunile vechi devin invalide.
 */
function sessionSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("Lipsește variabila de mediu ADMIN_PASSWORD.");
  }
  return secret;
}

/**
 * Compară două șiruri în timp constant (rezistent la timing attacks).
 * Returnează `false` dacă lungimile diferă (fără a scurge informația prin timp,
 * pentru valori de lungime comparabilă).
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Comparăm totuși cu sine pentru a păstra un timp similar, apoi returnăm false.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifică dacă parola furnizată corespunde cu `ADMIN_PASSWORD` (timing-safe).
 */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("Lipsește variabila de mediu ADMIN_PASSWORD.");
  }
  return safeEqual(password, expected);
}

/**
 * Creează valoarea (semnată) a cookie-ului de sesiune admin.
 *
 * Format: `<emisLa>.<semnătură>` unde semnătura este un HMAC-SHA256 peste
 * `<emisLa>` folosind secretul derivat din `ADMIN_PASSWORD`.
 */
export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  const signature = createHmac("sha256", sessionSecret())
    .update(issuedAt)
    .digest("hex");
  return `${issuedAt}.${signature}`;
}

/**
 * Validează valoarea unui cookie de sesiune admin: verifică semnătura HMAC
 * și că nu a expirat (mai vechi de `ADMIN_SESSION_MAX_AGE`).
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [issuedAt, signature] = parts;
  const expected = createHmac("sha256", sessionSecret())
    .update(issuedAt)
    .digest("hex");

  if (!safeEqual(signature, expected)) return false;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;

  const ageSeconds = (Date.now() - issuedAtMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_MAX_AGE) return false;

  return true;
}

/**
 * Verifică dacă cererea provine de la un administrator autentificat,
 * citind și validând cookie-ul de sesiune.
 *
 * Reutilizabil în orice Route Handler. Exemplu:
 * ```ts
 * if (!isAdmin(req)) {
 *   return Response.json({ error: "Neautorizat." }, { status: 401 });
 * }
 * ```
 */
export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}
