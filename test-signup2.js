import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djwoovhshfrnsvruvywm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqd29vdmhzaGZybnN2cnV2eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjU5MzksImV4cCI6MjA5OTEwMTkzOX0.EkFuRbqGlp_PcskoK6at9j80rzO9PLmXog47cY0YM3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const email1 = `test2_${Date.now()}@test.com`;
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email1, password: 'password123' });
  
  if (signUpError) {
     console.error("Sign up Error:", signUpError);
     return;
  }
  
  const { data: profile1, error: profileError } = await supabase.from('profiles').select('*').eq('id', signUpData.user.id).single();
  console.log("Profile Fetch Error:", profileError);
  console.log("Profile Data:", profile1);
}

test();
