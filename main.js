import { createClient } from '@supabase/supabase-js';

// ===== CONFIG =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== SYLLABUS =====
const syllabus = {
  Physics: [
    "Units and Measurements","Motion in a Straight Line","Motion in a Plane",
    "Laws of Motion","Work, Energy and Power","System of Particles and Rotational Motion",
    "Gravitation","Mechanical Properties of Solids","Mechanical Properties of Fluids",
    "Thermal Properties of Matter","Thermodynamics","Kinetic Theory","Oscillations","Waves",
    "Electric Charges and Fields","Electrostatic Potential and Capacitance",
    "Current Electricity","Moving Charges and Magnetism","Magnetism and Matter",
    "Electromagnetic Induction","Alternating Current","Electromagnetic Waves",
    "Ray Optics and Optical Instruments","Wave Optics","Dual Nature of Radiation and Matter",
    "Atoms","Nuclei","Semiconductor Electronics"
  ],
  Chemistry: [
    "Some Basic Concepts of Chemistry","Structure of Atom",
    "Classification of Elements and Periodicity","Chemical Bonding and Molecular Structure",
    "States of Matter","Thermodynamics","Equilibrium","Redox Reactions",
    "Hydrogen","The s-Block Elements","Some p-Block Elements",
    "Organic Chemistry: Basic Principles","Hydrocarbons",
    "Solutions","Electrochemistry","Chemical Kinetics",
    "Surface Chemistry","General Principles of Isolation of Elements",
    "The p-Block Elements","The d- and f-Block Elements","Coordination Compounds",
    "Haloalkanes and Haloarenes","Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids","Amines","Biomolecules",
    "Polymers","Chemistry in Everyday Life"
  ],
  Biology: [
    "The Living World","Biological Classification","Plant Kingdom","Animal Kingdom",
    "Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals",
    "Cell: The Unit of Life","Biomolecules","Cell Cycle and Cell Division",
    "Transport in Plants","Mineral Nutrition",
    "Photosynthesis in Higher Plants","Respiration in Plants","Plant Growth and Development",
    "Digestion and Absorption","Breathing and Exchange of Gases",
    "Body Fluids and Circulation","Excretory Products and their Elimination",
    "Locomotion and Movement","Neural Control and Coordination","Chemical Coordination and Integration",
    "Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health",
    "Principles of Inheritance and Variation","Molecular Basis of Inheritance","Evolution",
    "Human Health and Disease","Strategies for Enhancement in Food Production",
    "Microbes in Human Welfare","Biotechnology: Principles and Processes",
    "Biotechnology and its Applications","Organisms and Populations","Ecosystem",
    "Biodiversity and Conservation","Environmental Issues"
  ]
};

const TOTAL_CHAPTERS = Object.values(syllabus).reduce((s, c) => s + c.length, 0);
const TOTAL_TASKS = TOTAL_CHAPTERS * 3;
const subjectPrefixes = { Physics: 'Phy', Chemistry: 'Che', Biology: 'Bio' };

// NEET 2027 estimated date (first Sunday of May 2027)
const NEET_DATE = new Date('2027-05-02T10:00:00+05:30');

// Rank system — aspirational titles
const RANKS = [
  { xp: 0,    title: 'Beginner' },
  { xp: 100,  title: 'Student' },
  { xp: 300,  title: 'Learner' },
  { xp: 600,  title: 'Scholar' },
  { xp: 1000, title: 'Dedicated' },
  { xp: 1500, title: 'Focused' },
  { xp: 2500, title: 'Grinder' },
  { xp: 4000, title: 'Warrior' },
  { xp: 6000, title: 'Champion' },
  { xp: 8000, title: 'Ace' },
  { xp: 10000,title: 'Legend' },
  { xp: 15000,title: 'Doctor 🩺' },
];

// ===== STATE =====
let currentUser = null;
let userProfile = null;
let userXp = 0;
let userStreak = { current_streak: 0, longest_streak: 0, last_study_date: null };
let buddyProfile = null;
let buddyProgressMap = {};
let progressMap = {};

// ===== AUTH =====
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const nameField = document.getElementById('name-field');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');
const authToggleLink = document.getElementById('auth-toggle-link');
const authToggleText = document.getElementById('auth-toggle-text');

let isSignUp = false;

authToggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUp = !isSignUp;
  authSubmit.textContent = isSignUp ? 'Sign Up' : 'Sign In';
  authToggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
  authToggleLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
  nameField.style.display = isSignUp ? 'block' : 'none';
  authError.textContent = '';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  authSubmit.disabled = true;
  authSubmit.textContent = isSignUp ? 'Creating account...' : 'Signing in...';

  const email = authEmail.value.trim();
  const password = authPassword.value;

  try {
    if (isSignUp) {
      const displayName = authName.value.trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      if (data.user && !data.session) {
        authError.style.color = '#10b981';
        authError.textContent = 'Check your email to confirm, then sign in.';
        authSubmit.disabled = false;
        authSubmit.textContent = 'Sign Up';
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    authError.style.color = '#ef4444';
    authError.textContent = err.message;
    authSubmit.disabled = false;
    authSubmit.textContent = isSignUp ? 'Sign Up' : 'Sign In';
  }
});

document.getElementById('btn-signout').addEventListener('click', () => supabase.auth.signOut());

document.getElementById('btn-edit-name').addEventListener('click', async () => {
  if (!userProfile) return;
  const newName = prompt('Enter your new display name:', userProfile.display_name);
  if (!newName || newName.trim() === '' || newName.trim() === userProfile.display_name) return;

  const originalName = userProfile.display_name;
  userProfile.display_name = newName.trim();
  document.getElementById('user-name').textContent = userProfile.display_name;
  
  const { error } = await supabase.from('profiles').update({ display_name: userProfile.display_name }).eq('id', currentUser.id);
  if (error) {
    userProfile.display_name = originalName;
    document.getElementById('user-name').textContent = userProfile.display_name;
    showToast('Failed to update name.');
  } else {
    showToast('Name updated successfully!');
  }
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    await loadUserData();
    buildUI();
    updateDashboard();
    startCountdown();
  } else {
    currentUser = null;
    authScreen.style.display = 'flex';
    appScreen.style.display = 'none';
    authSubmit.disabled = false;
    authSubmit.textContent = 'Sign In';
  }
});

// ===== COUNTDOWN =====
function startCountdown() {
  function tick() {
    const now = new Date();
    const diff = NEET_DATE - now;

    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '0';
      document.getElementById('cd-hours').textContent = '0';
      document.getElementById('cd-mins').textContent = '0';
      document.getElementById('cd-secs').textContent = '0';
      document.getElementById('countdown-urgency').textContent = 'NEET day is here. You got this!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    document.getElementById('cd-days').textContent = days;
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
    document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');

    // Urgency messages based on days remaining
    const urgencyEl = document.getElementById('countdown-urgency');
    if (days > 300) urgencyEl.textContent = 'Start strong. Build the habit now.';
    else if (days > 200) urgencyEl.textContent = 'Consistency beats intensity.';
    else if (days > 100) urgencyEl.textContent = "Less than " + days + " days. No time to waste.";
    else if (days > 30) urgencyEl.textContent = 'Final stretch. Lock in.';
    else urgencyEl.textContent = '⚠️ Exam is around the corner!';
  }

  tick();
  setInterval(tick, 1000);
}

// ===== LOAD DATA =====
async function loadUserData() {
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = profile;

  if (userProfile) {
    document.getElementById('user-name').textContent = userProfile.display_name;
    document.getElementById('my-buddy-code').textContent = userProfile.buddy_code.toUpperCase();
  }

  const { data: progressRows } = await supabase
    .from('progress').select('chapter_id, completed').eq('user_id', currentUser.id);
  progressMap = {};
  if (progressRows) progressRows.forEach(r => { if (r.completed) progressMap[r.chapter_id] = true; });

  const { data: xpRow } = await supabase
    .from('xp').select('xp').eq('user_id', currentUser.id).single();
  userXp = xpRow?.xp || 0;

  // Load streak
  const { data: streakRow } = await supabase
    .from('streaks').select('*').eq('user_id', currentUser.id).single();
  if (streakRow) {
    userStreak = streakRow;
    // Check if streak needs reset (missed a day)
    if (streakRow.last_study_date) {
      const lastDate = new Date(streakRow.last_study_date);
      const today = new Date();
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        userStreak.current_streak = 0;
        await supabase.from('streaks').update({ current_streak: 0 }).eq('user_id', currentUser.id);
      }
    }
  }

  await loadBuddyData();
}

async function loadBuddyData() {
  if (!userProfile?.buddy_id) {
    buddyProfile = null;
    buddyProgressMap = {};
    document.getElementById('buddy-progress-section').style.display = 'none';
    return;
  }

  const { data: bProfile } = await supabase
    .from('profiles').select('*').eq('id', userProfile.buddy_id).single();
  buddyProfile = bProfile;

  if (buddyProfile) {
    const { data: bProgress } = await supabase
      .from('progress').select('chapter_id, completed').eq('user_id', buddyProfile.id);
    buddyProgressMap = {};
    if (bProgress) bProgress.forEach(r => { if (r.completed) buddyProgressMap[r.chapter_id] = true; });

    document.getElementById('buddy-progress-section').style.display = 'block';
    document.getElementById('buddy-name-bar').textContent = buddyProfile.display_name;
    updateBuddyProgress();
  }
}

function updateBuddyProgress() {
  const completed = Object.keys(buddyProgressMap).length;
  const pct = ((completed / TOTAL_TASKS) * 100).toFixed(1);
  document.getElementById('buddy-progress-percent').textContent = `${pct}%`;
  document.getElementById('buddy-progress').style.width = `${pct}%`;

  // Comparison nudge
  const myCompleted = Object.keys(progressMap).length;
  const compEl = document.getElementById('buddy-comparison');
  const diff = myCompleted - completed;

  if (diff < 0) {
    compEl.className = 'buddy-comparison behind';
    compEl.textContent = `${buddyProfile.display_name} is ${Math.abs(diff)} tasks ahead of you. Step it up!`;
  } else if (diff > 0) {
    compEl.className = 'buddy-comparison ahead';
    compEl.textContent = `You're ${diff} tasks ahead. Keep the lead!`;
  } else {
    compEl.className = 'buddy-comparison';
    compEl.textContent = "You're neck and neck. Who will pull ahead?";
    compEl.style.color = '#6b7280';
  }
}

// ===== BUILD UI =====
function buildUI() {
  const container = document.getElementById('subjects-container');
  container.innerHTML = '';

  for (const [subject, chapters] of Object.entries(syllabus)) {
    const prefix = subjectPrefixes[subject];
    const section = document.createElement('section');
    section.className = 'subject-section';

    let listHTML = '';
    chapters.forEach((chapter, i) => {
      const cid = `${prefix}-${i}`;
      const tChecked = progressMap[`${cid}-T`] ? 'checked' : '';
      const qChecked = progressMap[`${cid}-Q`] ? 'checked' : '';
      const rChecked = progressMap[`${cid}-R`] ? 'checked' : '';
      const allDone = tChecked && qChecked && rChecked;

      listHTML += `
        <li class="chapter-row">
          <span class="chapter-name ${allDone ? 'completed' : ''}" id="name-${cid}">${chapter}</span>
          <div class="checkbox-group">
            <label class="task-checkbox">
              <input type="checkbox" ${tChecked} data-cid="${cid}-T" id="${cid}-T">
              <div class="checkmark-box"></div>
              <span class="task-label">Theory</span>
            </label>
            <label class="task-checkbox">
              <input type="checkbox" ${qChecked} data-cid="${cid}-Q" id="${cid}-Q">
              <div class="checkmark-box"></div>
              <span class="task-label">PYQs</span>
            </label>
            <label class="task-checkbox">
              <input type="checkbox" ${rChecked} data-cid="${cid}-R" id="${cid}-R">
              <div class="checkmark-box"></div>
              <span class="task-label">Revision</span>
            </label>
          </div>
        </li>`;
    });

    section.innerHTML = `
      <div class="subject-header" data-subject="${subject}">
        <h2>${subject} <span class="subject-pct" id="${subject}-pct">0%</span></h2>
        <span class="subject-meta" id="${subject}-prog">0/${chapters.length}</span>
      </div>
      <ul class="chapter-list" id="list-${subject}">${listHTML}</ul>`;

    container.appendChild(section);
  }

  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', handleCheck);
  });

  container.querySelectorAll('.subject-header').forEach(header => {
    header.addEventListener('click', () => {
      document.getElementById(`list-${header.dataset.subject}`).classList.toggle('collapsed');
    });
  });
}

// ===== HANDLE CHECK =====
async function handleCheck(e) {
  const checkbox = e.target;
  const chapterTaskId = checkbox.dataset.cid;
  const isChecked = checkbox.checked;

  if (isChecked) {
    progressMap[chapterTaskId] = true;
    userXp += 10;
    showToast('+10 XP');
    triggerConfetti(checkbox);
  } else {
    delete progressMap[chapterTaskId];
    userXp = Math.max(0, userXp - 10);
  }

  const baseCid = chapterTaskId.slice(0, -2);
  const t = progressMap[`${baseCid}-T`];
  const q = progressMap[`${baseCid}-Q`];
  const r = progressMap[`${baseCid}-R`];
  const nameEl = document.getElementById(`name-${baseCid}`);

  if (t && q && r) {
    if (!nameEl.classList.contains('completed') && isChecked) {
      userXp += 50;
      showToast('Chapter Mastered! +50 XP');
      triggerBigConfetti();
    }
    nameEl.classList.add('completed');
  } else {
    if (nameEl.classList.contains('completed') && !isChecked) {
      userXp = Math.max(0, userXp - 50);
      showToast('−50 XP (chapter unmastered)');
    }
    nameEl.classList.remove('completed');
  }

  // Update streak
  if (isChecked) await updateStreak();

  updateDashboard();
  await saveToSupabase(chapterTaskId, isChecked);
}

// ===== STREAK =====
async function updateStreak() {
  const today = new Date().toISOString().split('T')[0];

  if (userStreak.last_study_date === today) return; // Already studied today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (userStreak.last_study_date === yesterday) {
    userStreak.current_streak += 1;
  } else {
    userStreak.current_streak = 1;
  }

  if (userStreak.current_streak > userStreak.longest_streak) {
    userStreak.longest_streak = userStreak.current_streak;
  }

  userStreak.last_study_date = today;

  if (userStreak.current_streak > 1) {
    showToast(`🔥 ${userStreak.current_streak} day streak!`);
  }

  await supabase.from('streaks').upsert({
    user_id: currentUser.id,
    current_streak: userStreak.current_streak,
    longest_streak: userStreak.longest_streak,
    last_study_date: today
  }, { onConflict: 'user_id' });
}

// ===== SAVE =====
async function saveToSupabase(chapterTaskId, completed) {
  await supabase.from('progress').upsert({
    user_id: currentUser.id,
    chapter_id: chapterTaskId,
    completed,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,chapter_id' });

  await supabase.from('xp').upsert({
    user_id: currentUser.id, xp: userXp
  }, { onConflict: 'user_id' });
}

// ===== UPDATE DASHBOARD =====
function updateDashboard() {
  const completed = Object.keys(progressMap).length;
  const pct = ((completed / TOTAL_TASKS) * 100).toFixed(1);

  // Rank
  let rank = RANKS[0].title;
  for (const r of RANKS) {
    if (userXp >= r.xp) rank = r.title;
  }

  document.getElementById('xp-display').textContent = userXp;
  document.getElementById('rank-display').textContent = rank;
  document.getElementById('streak-display').textContent = userStreak.current_streak;
  document.getElementById('progress-percent').textContent = `${pct}%`;
  document.getElementById('main-progress').style.width = `${pct}%`;

  // Progress nudge — psychological pressure
  const nudgeEl = document.getElementById('progress-nudge');
  const pctNum = parseFloat(pct);
  if (pctNum === 0) {
    nudgeEl.textContent = "You haven't started yet. Your competitor already has. Open a chapter.";
    nudgeEl.style.display = 'block';
  } else if (pctNum < 10) {
    nudgeEl.textContent = `Only ${pct}% done. You can do more today.`;
    nudgeEl.style.display = 'block';
  } else if (pctNum < 50) {
    nudgeEl.textContent = `${pct}% — not even halfway. Keep going.`;
    nudgeEl.style.display = 'block';
  } else if (pctNum < 90) {
    nudgeEl.style.background = '#ecfdf5';
    nudgeEl.style.color = '#10b981';
    nudgeEl.textContent = `${pct}% done! The finish line is in sight.`;
    nudgeEl.style.display = 'block';
  } else {
    nudgeEl.style.background = '#ecfdf5';
    nudgeEl.style.color = '#10b981';
    nudgeEl.textContent = '🏆 Almost there. You are built different.';
    nudgeEl.style.display = 'block';
  }

  // Per-subject stats
  let totalMastered = 0;
  for (const [subject, chapters] of Object.entries(syllabus)) {
    const prefix = subjectPrefixes[subject];
    let mastered = 0;
    let subjectTasks = 0;

    for (let i = 0; i < chapters.length; i++) {
      const cid = `${prefix}-${i}`;
      const t = progressMap[`${cid}-T`] ? 1 : 0;
      const q = progressMap[`${cid}-Q`] ? 1 : 0;
      const r = progressMap[`${cid}-R`] ? 1 : 0;
      subjectTasks += t + q + r;
      if (t && q && r) mastered++;
    }
    totalMastered += mastered;

    const progEl = document.getElementById(`${subject}-prog`);
    if (progEl) progEl.textContent = `${mastered}/${chapters.length}`;

    // Subject percentage badge with color
    const pctEl = document.getElementById(`${subject}-pct`);
    if (pctEl) {
      const subjPct = Math.round((subjectTasks / (chapters.length * 3)) * 100);
      pctEl.textContent = `${subjPct}%`;
      pctEl.className = 'subject-pct';
      if (subjPct >= 70) pctEl.classList.add('great');
      else if (subjPct >= 30) pctEl.classList.add('good');
      // < 30% stays red (default)
    }
  }

  document.getElementById('chapters-display').textContent = `${totalMastered}/${TOTAL_CHAPTERS}`;

  // Update buddy comparison if paired
  if (buddyProfile) updateBuddyProgress();
}

// ===== BUDDY SYSTEM (FIXED — uses RPC) =====
document.getElementById('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('my-buddy-code').textContent);
  showToast('Code copied!');
});

document.getElementById('btn-pair').addEventListener('click', async () => {
  const statusEl = document.getElementById('buddy-status');
  const code = document.getElementById('buddy-code-input').value.trim().toLowerCase();

  if (!code || code.length < 6) {
    statusEl.textContent = 'Enter a valid 6-character code.';
    statusEl.style.color = '#ef4444';
    return;
  }

  // Use the server-side RPC function (bypasses RLS)
  const { data, error } = await supabase.rpc('pair_buddy', { buddy_code_input: code });

  if (error) {
    statusEl.textContent = 'Something went wrong. Try again.';
    statusEl.style.color = '#ef4444';
    return;
  }

  if (data && !data.success) {
    statusEl.textContent = data.error;
    statusEl.style.color = '#ef4444';
    return;
  }

  userProfile.buddy_id = true; // Will be refreshed
  statusEl.textContent = `Paired with ${data.buddy_name}!`;
  statusEl.style.color = '#10b981';
  showToast(`🤝 Paired with ${data.buddy_name}!`);

  // Reload profile and buddy data
  const { data: refreshedProfile } = await supabase
    .from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = refreshedProfile;
  await loadBuddyData();
  updateDashboard();
});

// ===== CONFETTI =====
function triggerConfetti(el) {
  const rect = el.getBoundingClientRect();
  confetti({
    particleCount: 12, spread: 30,
    origin: { x: (rect.left + rect.width/2) / window.innerWidth, y: (rect.top + rect.height/2) / window.innerHeight },
    colors: ['#111827','#d1d5db','#9ca3af'], gravity: 1.5, scalar: 0.7, disableForReducedMotion: true
  });
}

function triggerBigConfetti() {
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 50, origin: { x: 0 }, colors: ['#111827','#10b981','#6b7280'] });
    confetti({ particleCount: 4, angle: 120, spread: 50, origin: { x: 1 }, colors: ['#111827','#10b981','#6b7280'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ===== TOAST =====
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    <span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}
