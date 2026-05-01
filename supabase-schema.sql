-- ============================================================
-- EXPENZO — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Entries table
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(10, 2) not null check (amount > 0),
  category     text not null check (category in ('Personal', 'Business')),
  subcategory  text not null,
  note         text,
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists entries_user_date_idx on public.entries (user_id, date desc);

-- Row Level Security — users can only see their own data
alter table public.entries enable row level security;

create policy "Users can read own entries"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.entries for delete
  using (auth.uid() = user_id);
