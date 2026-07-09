import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djwoovhshfrnsvruvywm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqd29vdmhzaGZybnN2cnV2eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjU5MzksImV4cCI6MjA5OTEwMTkzOX0.EkFuRbqGlp_PcskoK6at9j80rzO9PLmXog47cY0YM3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const email1 = `test1_${Date.now()}@test.com`;
  const email2 = `test2_${Date.now()}@test.com`;
  
  await supabase.auth.signUp({ email: email1, password: 'password123' });
  const { data: { session: session1 } } = await supabase.auth.signInWithPassword({ email: email1, password: 'password123' });
  
  const { data: profile1 } = await supabase.from('profiles').select('*').eq('id', session1.user.id).single();
  console.log("User 1 Profile:", profile1);

  // Sign out and sign in user 2
  await supabase.auth.signOut();

  await supabase.auth.signUp({ email: email2, password: 'password123' });
  const { data: { session: session2 } } = await supabase.auth.signInWithPassword({ email: email2, password: 'password123' });
  
  const { data: profile2 } = await supabase.from('profiles').select('*').eq('id', session2.user.id).single();
  console.log("User 2 Profile:", profile2);

  // User 2 tries to pair with User 1
  const { data: pairData, error: pairError } = await supabase.rpc('pair_buddy', { buddy_code_input: profile1.buddy_code });
  console.log("Pair Data:", pairData);
  console.log("Pair Error:", pairError);

  const { data: profile2After } = await supabase.from('profiles').select('*').eq('id', session2.user.id).single();
  console.log("User 2 Buddy ID after pair:", profile2After.buddy_id, "Expected:", profile1.id);
}

test();
