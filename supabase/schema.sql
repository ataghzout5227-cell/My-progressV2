-- Ascend private cloud database setup (Supabase PostgreSQL)
-- Run in Supabase SQL editor for a project owned by you.
-- Row Level Security isolates each signed-in user's records.
-- This schema does not itself enable app sync: credentials and a client sync implementation are still required.
create extension if not exists pgcrypto;

create table if not exists public.ascend_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.ascend_profiles enable row level security;
create policy "profiles_owner_read" on public.ascend_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_owner_insert" on public.ascend_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_owner_update" on public.ascend_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_owner_delete" on public.ascend_profiles for delete to authenticated using ((select auth.uid()) = user_id);

-- The app data is stored per account. PIN and raw journal text should not be uploaded.
-- Journal entries should be encrypted locally before enabling journal syncing.
create table if not exists public.ascend_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.ascend_state enable row level security;
create policy "ascend_owner_select" on public.ascend_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "ascend_owner_insert" on public.ascend_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ascend_owner_update" on public.ascend_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ascend_owner_delete" on public.ascend_state for delete to authenticated using ((select auth.uid()) = user_id);

-- App implementation requirements:
-- 1) Never embed service_role keys in the Android APK.
-- 2) Sign in via Supabase Auth, use the public anon/publishable key only.
-- 3) Strip the existing journal PIN before sync; store authentication secrets in secure storage.
-- 4) Sync incrementally, preserve the last working offline copy and resolve version conflicts.
-- 5) Keep journal entries on-device until proper end-to-end encryption is available.
-- 6) Enable MFA on the Supabase account and protect the dashboard/project.
