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

-- Users can read profiles of people they have an accepted friendship with, OR pending requests
create policy "Users can read friend profiles"
  on public.profiles for select
  using (
    id in (
      select user1_id from public.friendships where user2_id = auth.uid()
      union
      select user2_id from public.friendships where user1_id = auth.uid()
    )
  );

-- 1.5 FRIENDSHIPS TABLE
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they are part of
create policy "Users can read own friendships"
  on public.friendships for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

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

-- Users can read their friends progress
create policy "Users can read friend progress"
  on public.progress for select
  using (
    user_id in (
      select user1_id from public.friendships where user2_id = auth.uid() and status = 'accepted'
      union
      select user2_id from public.friendships where user1_id = auth.uid() and status = 'accepted'
    )
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

-- Users can read friends's XP
create policy "Users can read friend xp"
  on public.xp for select
  using (
    user_id in (
      select user1_id from public.friendships where user2_id = auth.uid() and status = 'accepted'
      union
      select user2_id from public.friendships where user1_id = auth.uid() and status = 'accepted'
    )
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

-- 5. RPC FOR SENDING & ACCEPTING REQUESTS

-- Send Request (user1_id is always the sender)
create or replace function public.send_buddy_request(target_code text)
returns json as $$
declare
  target_user uuid;
  my_id uuid;
  existing_status text;
begin
  my_id := auth.uid();
  if my_id is null then return '{"success": false, "error": "Not authenticated"}'; end if;

  select id into target_user from public.profiles where buddy_code = target_code;
  if target_user is null then return '{"success": false, "error": "Buddy code not found."}'; end if;
  if target_user = my_id then return '{"success": false, "error": "You cannot add yourself."}'; end if;

  -- Check if relationship already exists
  select status into existing_status from public.friendships 
  where (user1_id = my_id and user2_id = target_user) or (user1_id = target_user and user2_id = my_id);

  if existing_status = 'accepted' then 
    return '{"success": false, "error": "Already buddies!"}'; 
  end if;
  
  if existing_status = 'pending' then 
    return '{"success": false, "error": "Request already pending."}'; 
  end if;

  insert into public.friendships (user1_id, user2_id, status) values (my_id, target_user, 'pending');
  return '{"success": true}';
end;
$$ language plpgsql security definer;

-- Accept Request
create or replace function public.accept_buddy_request(requester_id uuid)
returns json as $$
declare
  my_id uuid;
begin
  my_id := auth.uid();
  if my_id is null then return '{"success": false, "error": "Not authenticated"}'; end if;

  update public.friendships 
  set status = 'accepted' 
  where user1_id = requester_id and user2_id = my_id and status = 'pending';

  return '{"success": true}';
end;
$$ language plpgsql security definer;
