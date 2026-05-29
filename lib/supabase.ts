import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase pentru BROWSER / componente client.
 *
 * Folosește cheia publică (anon) și URL-ul public, pentru operații permise
 * de politicile RLS (Row Level Security).
 *
 * IMPORTANT — instanță unică (singleton):
 * Returnăm mereu același client. Crearea mai multor instanțe în browser face
 * ca acestea să se concureze pe „lock"-ul de autentificare (Web Locks API),
 * ceea ce poate BLOCA upload-urile după primul (al doilea/al treilea fișier
 * rămân agățate pe „se încarcă"). Tot din acest motiv dezactivăm sesiunea de
 * auth: aplicația publică folosește doar URL-uri semnate, nu autentificare.
 */
let browserClient: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Lipsesc variabilele NEXT_PUBLIC_SUPABASE_URL și/sau NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
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
