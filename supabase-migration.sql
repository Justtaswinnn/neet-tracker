-- 1. DROP OLD BUDDY SYSTEM
DROP FUNCTION IF EXISTS public.pair_buddy(text);
DROP POLICY IF EXISTS "Users can read messages with their buddy" ON public.messages;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS buddy_id;

-- 2. CREATE FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 3. RLS FOR FRIENDSHIPS
-- Users can see friendships they are part of
CREATE POLICY "Users can read own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 4. UPDATE RLS FOR OTHER TABLES TO SUPPORT MULTIPLE BUDDIES
-- Drop old buddy policies
DROP POLICY IF EXISTS "Users can read buddy profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can lookup by buddy code" ON public.profiles;
DROP POLICY IF EXISTS "Users can read buddy progress" ON public.progress;
DROP POLICY IF EXISTS "Users can read buddy xp" ON public.xp;

-- New Profile Policies
-- Users can read profiles of people they have an accepted friendship with, OR pending requests
CREATE POLICY "Users can read friend profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT user1_id FROM public.friendships WHERE user2_id = auth.uid()
      UNION
      SELECT user2_id FROM public.friendships WHERE user1_id = auth.uid()
    )
  );

-- New Progress Policy
CREATE POLICY "Users can read friend progress"
  ON public.progress FOR SELECT
  USING (
    user_id IN (
      SELECT user1_id FROM public.friendships WHERE user2_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user2_id FROM public.friendships WHERE user1_id = auth.uid() AND status = 'accepted'
    )
  );

-- New XP Policy
CREATE POLICY "Users can read friend xp"
  ON public.xp FOR SELECT
  USING (
    user_id IN (
      SELECT user1_id FROM public.friendships WHERE user2_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user2_id FROM public.friendships WHERE user1_id = auth.uid() AND status = 'accepted'
    )
  );

-- New Messages Policy
CREATE POLICY "Users can read messages with their friends"
  ON public.messages FOR SELECT
  USING (
    (auth.uid() = sender_id AND receiver_id IN (
      SELECT user1_id FROM public.friendships WHERE user2_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user2_id FROM public.friendships WHERE user1_id = auth.uid() AND status = 'accepted'
    ))
    OR
    (auth.uid() = receiver_id AND sender_id IN (
      SELECT user1_id FROM public.friendships WHERE user2_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user2_id FROM public.friendships WHERE user1_id = auth.uid() AND status = 'accepted'
    ))
  );

-- 5. RPC FOR SENDING & ACCEPTING REQUESTS

-- Send Request (user1_id is always the sender)
CREATE OR REPLACE FUNCTION public.send_buddy_request(target_code text)
RETURNS json as $$
DECLARE
  target_user uuid;
  my_id uuid;
  existing_status text;
BEGIN
  my_id := auth.uid();
  IF my_id IS NULL THEN RETURN '{"success": false, "error": "Not authenticated"}'; END IF;

  SELECT id INTO target_user FROM public.profiles WHERE buddy_code = target_code;
  IF target_user IS NULL THEN RETURN '{"success": false, "error": "Buddy code not found."}'; END IF;
  IF target_user = my_id THEN RETURN '{"success": false, "error": "You cannot add yourself."}'; END IF;

  -- Check if relationship already exists
  SELECT status INTO existing_status FROM public.friendships 
  WHERE (user1_id = my_id AND user2_id = target_user) OR (user1_id = target_user AND user2_id = my_id);

  IF existing_status = 'accepted' THEN 
    RETURN '{"success": false, "error": "Already buddies!"}'; 
  END IF;
  
  IF existing_status = 'pending' THEN 
    RETURN '{"success": false, "error": "Request already pending."}'; 
  END IF;

  INSERT INTO public.friendships (user1_id, user2_id, status) VALUES (my_id, target_user, 'pending');
  RETURN '{"success": true}';
END;
$$ language plpgsql security definer;

-- Accept Request
CREATE OR REPLACE FUNCTION public.accept_buddy_request(requester_id uuid)
RETURNS json as $$
DECLARE
  my_id uuid;
BEGIN
  my_id := auth.uid();
  IF my_id IS NULL THEN RETURN '{"success": false, "error": "Not authenticated"}'; END IF;

  UPDATE public.friendships 
  SET status = 'accepted' 
  WHERE user1_id = requester_id AND user2_id = my_id AND status = 'pending';

  RETURN '{"success": true}';
END;
$$ language plpgsql security definer;
