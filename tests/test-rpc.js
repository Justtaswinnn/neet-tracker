import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djwoovhshfrnsvruvywm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqd29vdmhzaGZybnN2cnV2eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjU5MzksImV4cCI6MjA5OTEwMTkzOX0.EkFuRbqGlp_PcskoK6at9j80rzO9PLmXog47cY0YM3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  // try calling pair_buddy without auth, should get error about auth.uid() or missing function
  const { data, error } = await supabase.rpc('pair_buddy', { buddy_code_input: 'test' });
  console.log("RPC Data:", data);
  console.log("RPC Error:", error);
}

test();
