-- ================================================
-- REAL-TIME BUDDY CHAT SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- ================================================

-- 1. Create the messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Drop existing policies if running multiple times
drop policy if exists "Users can insert their own messages" on public.messages;
drop policy if exists "Users can read messages with their buddy" on public.messages;

-- 2. Message RLS Policies
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can read messages with their friends"
  on public.messages for select
  using (
    (auth.uid() = sender_id and receiver_id in (
      select user1_id from public.friendships where user2_id = auth.uid() and status = 'accepted'
      union
      select user2_id from public.friendships where user1_id = auth.uid() and status = 'accepted'
    ))
    or
    (auth.uid() = receiver_id and sender_id in (
      select user1_id from public.friendships where user2_id = auth.uid() and status = 'accepted'
      union
      select user2_id from public.friendships where user1_id = auth.uid() and status = 'accepted'
    ))
  );

-- 3. Enable Realtime for messages
-- (This allows the frontend to instantly receive new messages)
DO $$
BEGIN
  -- Remove the table from publication if it's already there to avoid duplicates
  alter publication supabase_realtime drop table public.messages;
EXCEPTION WHEN others THEN
  -- Ignore error if it wasn't there
END $$;

alter publication supabase_realtime add table public.messages;

-- 4. Set up Storage for Chat Images
-- Insert the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do update set public = true;

-- Drop existing policies to cleanly recreate
drop policy if exists "Anyone can read chat images" on storage.objects;
drop policy if exists "Users can upload chat images" on storage.objects;

-- Allow anyone to read images
create policy "Anyone can read chat images"
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

-- Allow logged in users to upload images
create policy "Users can upload chat images"
  on storage.objects for insert
  with check ( bucket_id = 'chat-images' and auth.role() = 'authenticated' );
