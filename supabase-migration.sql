-- ================================================
-- FINAL FIX FOR SUPABASE
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Drop the policies causing infinite recursion
drop policy if exists "Users can read buddy profile" on public.profiles;
drop policy if exists "Anyone can lookup by buddy code" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;

-- Create a single, non-recursive policy for selecting profiles
-- (This allows users to read profiles, avoiding the recursion crash)
create policy "Anyone can read profiles" 
  on public.profiles for select 
  using (true);

-- 2. Create the server-side pairing function (bypasses RLS)
create or replace function public.pair_buddy(buddy_code_input text)
returns json as $$
declare
  buddy_record record;
begin
  select id, display_name, buddy_code into buddy_record
  from public.profiles
  where buddy_code = lower(buddy_code_input);

  if not found then
    return json_build_object('success', false, 'error', 'No user found with that code');
  end if;

  if buddy_record.id = auth.uid() then
    return json_build_object('success', false, 'error', 'That is your own code');
  end if;

  -- Link both users to each other
  update public.profiles set buddy_id = buddy_record.id where id = auth.uid();
  update public.profiles set buddy_id = auth.uid() where id = buddy_record.id;

  return json_build_object('success', true, 'buddy_name', buddy_record.display_name);
end;
$$ language plpgsql security definer;

-- 3. Streaks table (if not already created)
create table if not exists public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date
);

alter table public.streaks enable row level security;

-- Drop streak policies if they exist so we can recreate cleanly
drop policy if exists "Users can read own streak" on public.streaks;
drop policy if exists "Users can insert own streak" on public.streaks;
drop policy if exists "Users can update own streak" on public.streaks;
drop policy if exists "Users can read buddy streak" on public.streaks;
drop policy if exists "Anyone can read streaks" on public.streaks;

-- Simple streaks read policy (avoids recursion)
create policy "Anyone can read streaks"
  on public.streaks for select using (true);

create policy "Users can insert own streak"
  on public.streaks for insert with check (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.streaks for update using (auth.uid() = user_id);

-- 4. Fix Progress and XP read policies to avoid recursion
drop policy if exists "Users can read buddy progress" on public.progress;
drop policy if exists "Users can read own progress" on public.progress;
create policy "Anyone can read progress" on public.progress for select using (true);

drop policy if exists "Users can read buddy xp" on public.xp;
drop policy if exists "Users can read own xp" on public.xp;
create policy "Anyone can read xp" on public.xp for select using (true);
