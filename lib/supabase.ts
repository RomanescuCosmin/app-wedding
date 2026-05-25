import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase pentru BROWSER / componente client.
 *
 * Folosește cheia publică (anon) și URL-ul public. Poate fi folosit
 * oriunde — atât pe server, cât și în browser — pentru operații
 * permise de politicile RLS (Row Level Security).
 */
export function supabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Lipsesc variabilele NEXT_PUBLIC_SUPABASE_URL și/sau NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, anonKey);
}

/**
 * Client Supabase ADMIN — DOAR PE SERVER.
 *
 * Folosește cheia de service role (secretă), care ocolește politicile RLS.
 * NU trebuie importat sau folosit niciodată în cod care ajunge în browser,
 * altfel cheia secretă ar fi expusă public.
 *
 * Sesiunea nu este persistată (`persistSession: false`), fiindcă acest
 * client e folosit pentru operații punctuale pe server (ex. acțiuni admin).
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Lipsesc variabilele NEXT_PUBLIC_SUPABASE_URL și/sau SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
