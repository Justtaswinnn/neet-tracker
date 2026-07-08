# Agent Memory: NEET 2027 Tracker

## Project Overview
A gamified, real-time tracking application for students preparing for the NEET 2027 medical entrance exam. It includes full syllabus tracking (Physics, Chemistry, Botany, Zoology), daily streaks, an XP and ranking system, and competitive social features (Buddy system, Community Leaderboard, Real-time Chat).

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript (built with Vite)
- **Backend / Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deployment**: Vercel

## Design Aesthetics (CRITICAL)
- **"No AI Slop"**: The user strictly prefers a clean, minimalistic, flat, and professional UI. 
- Avoid heavy box-shadows, extreme gradients, and generic placeholder aesthetics.
- Use soft, premium colors (e.g., Notion/Linear-like aesthetics) and structured, legible typography (Inter font).
- The Chat feature uses a soft pastel blue aesthetic with a subtle anime cat background pattern.

## Supabase Schema & Architecture
1. **profiles**: 
   - `id` (uuid, PK, references `auth.users`)
   - `display_name` (text)
   - `buddy_code` (text, unique 6-char hex)
   - `buddy_id` (uuid, FK to `profiles.id`)
   - **RLS**: Flat `select` policy (`true`) to prevent infinite recursion. Updates restricted to the owner.

2. **progress**:
   - `user_id` (uuid, FK), `chapter_id` (text), `completed` (boolean)
   - Tracks checkbox states (T, Q, R) for each chapter.
   
3. **xp** & **streaks**:
   - `user_id` (PK). Stores total XP and streak data (`current_streak`, `longest_streak`, `last_study_date`).

4. **messages**:
   - `sender_id`, `receiver_id`, `content`, `image_url`, `created_at`.
   - **Realtime**: Enabled via `supabase_realtime` publication.
   - **Storage Bucket**: `chat-images` (public).

5. **RPC Functions**:
   - `pair_buddy(my_id, target_buddy_code)`: A `SECURITY DEFINER` function used to atomically link two users, bypassing standard RLS limitations to ensure mutual buddy assignments.

## Key Frontend Logic (`main.js`)
- `progressMap` and `buddyProgressMap` track completed tasks.
- `updateDashboard()` calculates completion percentage and recalculates ranks.
- `initChat()` manages Supabase Realtime subscriptions (insert events and broadcast typing indicators).
- **Environment Variables**: Managed via Vite `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Known Issues / Past Bugs Resolved
- **RLS Infinite Recursion (Error 42P17)**: Occurred when `profiles` had a policy that checked `buddy_id` which itself queried `profiles`. Fixed by making `profiles` readable by anyone and restricting updates, alongside the backend RPC.
- **Vite Module Error**: Ensure any script tag referencing `main.js` uses `type="module"` because the script relies on `import.meta.env`.
