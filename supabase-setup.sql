-- ================================================
-- NEET 2027 Tracker — Supabase Setup
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Paste → Run)
-- ================================================

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  buddy_code text unique not null default substr(md5(random()::text), 1, 6),
  buddy_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can read their buddy's profile
create policy "Users can read buddy profile"
  on public.profiles for select
  using (
    id = (select buddy_id from public.profiles where id = auth.uid())
  );

-- Anyone can look up a profile by buddy_code (for pairing)
create policy "Anyone can lookup by buddy code"
  on public.profiles for select
  using (true);

-- 2. PROGRESS TABLE
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chapter_id text not null,
  completed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, chapter_id)
);

alter table public.progress enable row level security;

-- Users can manage their own progress
create policy "Users can read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id);

-- Users can read their buddy's progress
create policy "Users can read buddy progress"
  on public.progress for select
  using (
    user_id = (select buddy_id from public.profiles where id = auth.uid())
  );

-- 3. XP TABLE
create table public.xp (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  xp integer default 0
);

alter table public.xp enable row level security;

create policy "Users can read own xp"
  on public.xp for select
  using (auth.uid() = user_id);

create policy "Users can insert own xp"
  on public.xp for insert
  with check (auth.uid() = user_id);

create policy "Users can update own xp"
  on public.xp for update
  using (auth.uid() = user_id);

-- Users can read buddy's XP
create policy "Users can read buddy xp"
  on public.xp for select
  using (
    user_id = (select buddy_id from public.profiles where id = auth.uid())
  );

-- 4. AUTO-CREATE PROFILE ON SIGNUP (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.xp (user_id, xp)
  values (new.id, 0);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
