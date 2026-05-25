-- ============================================================================
-- Schema pentru aplicația de upload poze/video la nuntă
-- ----------------------------------------------------------------------------
-- Rulează acest fișier în Supabase Dashboard → SQL Editor (New query → Run).
-- Este IDEMPOTENT: îl poți rula de mai multe ori fără efecte secundare.
-- ============================================================================

-- Extensie pentru gen_random_uuid() (de regulă deja activată pe Supabase).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tabelul `uploads`: o înregistrare pentru fiecare fișier încărcat.
-- ----------------------------------------------------------------------------
create table if not exists public.uploads (
  id            uuid primary key default gen_random_uuid(),
  path          text not null,
  kind          text not null check (kind in ('image', 'video')),
  size          bigint,
  original_name text,
  created_at    timestamptz not null default now()
);

-- Index pentru listarea rapidă, ordonată descrescător după dată.
create index if not exists uploads_created_at_idx
  on public.uploads (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
-- Activăm RLS și NU adăugăm nicio politică publică. Astfel, niciun client cu
-- cheia `anon` nu poate citi sau scrie direct în tabel. Accesul se face EXCLUSIV
-- prin serverul Next.js, folosind cheia `service_role` (care ocolește RLS).
alter table public.uploads enable row level security;

-- ----------------------------------------------------------------------------
-- Bucket de Storage `wedding-media` (PRIVAT)
-- ----------------------------------------------------------------------------
-- Îl poți crea fie cu instrucțiunea de mai jos, fie manual din
-- Dashboard → Storage → New bucket (lasă „Public bucket" DEZACTIVAT).
--
-- `public = false` => fișierele NU sunt accesibile public; se accesează doar
-- prin URL-uri semnate generate pe server cu cheia `service_role`.
insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', false)
on conflict (id) do nothing;
