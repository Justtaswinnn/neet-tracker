import { createClient } from '@supabase/supabase-js';

// ===== CONFIG =====
const SUPABASE_URL = 'https://djwoovhshfrnsvruvywm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqd29vdmhzaGZybnN2cnV2eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjU5MzksImV4cCI6MjA5OTEwMTkzOX0.EkFuRbqGlp_PcskoK6at9j80rzO9PLmXog47cY0YM3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== SYLLABUS DATA =====
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
    "Thermodynamics","Equilibrium","Redox Reactions",
    "Organic Chemistry: Basic Principles","Hydrocarbons",
    "Solutions","Electrochemistry","Chemical Kinetics",
    "The d- and f-Block Elements","Coordination Compounds",
    "Haloalkanes and Haloarenes","Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids","Amines","Biomolecules"
  ],
  Biology: [
    "The Living World","Biological Classification","Plant Kingdom","Animal Kingdom",
    "Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals",
    "Cell: The Unit of Life","Biomolecules","Cell Cycle and Cell Division",
    "Photosynthesis in Higher Plants","Respiration in Plants","Plant Growth and Development",
    "Breathing and Exchange of Gases","Body Fluids and Circulation","Excretory Products and their Elimination",
    "Locomotion and Movement","Neural Control and Coordination","Chemical Coordination and Integration",
    "Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health",
    "Principles of Inheritance and Variation","Molecular Basis of Inheritance","Evolution",
    "Human Health and Disease","Microbes in Human Welfare","Biotechnology: Principles and Processes",
    "Biotechnology and its Applications","Organisms and Populations","Ecosystem","Biodiversity and Conservation"
  ]
};

const TOTAL_CHAPTERS = Object.values(syllabus).reduce((sum, chs) => sum + chs.length, 0);
const TOTAL_TASKS = TOTAL_CHAPTERS * 3; // T, Q, R per chapter
const subjectPrefixes = { Physics: 'Phy', Chemistry: 'Che', Biology: 'Bio' };

// ===== STATE =====
let currentUser = null;
let userProfile = null;
let userXp = 0;
let buddyProfile = null;
let buddyProgressMap = {};
let progressMap = {}; // { 'Phy-0-T': true, ... }
let savePending = false;

// ===== AUTH LOGIC =====
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
        email,
        password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      // Supabase may require email confirmation — handle gracefully
      if (data.user && !data.session) {
        authError.style.color = '#10b981';
        authError.textContent = 'Check your email to confirm your account, then sign in.';
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

document.getElementById('btn-signout').addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    await loadUserData();
    buildUI();
    updateDashboard();
  } else {
    currentUser = null;
    authScreen.style.display = 'flex';
    appScreen.style.display = 'none';
    authSubmit.disabled = false;
    authSubmit.textContent = 'Sign In';
  }
});

// ===== LOAD USER DATA =====
async function loadUserData() {
  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  userProfile = profile;

  if (userProfile) {
    document.getElementById('user-name').textContent = userProfile.display_name;
    document.getElementById('my-buddy-code').textContent = userProfile.buddy_code.toUpperCase();
  }

  // Load progress
  const { data: progressRows } = await supabase
    .from('progress')
    .select('chapter_id, completed')
    .eq('user_id', currentUser.id);

  progressMap = {};
  if (progressRows) {
    progressRows.forEach(row => {
      if (row.completed) progressMap[row.chapter_id] = true;
    });
  }

  // Load XP
  const { data: xpRow } = await supabase
    .from('xp')
    .select('xp')
    .eq('user_id', currentUser.id)
    .single();

  userXp = xpRow?.xp || 0;

  // Load buddy
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
    .from('profiles')
    .select('*')
    .eq('id', userProfile.buddy_id)
    .single();

  buddyProfile = bProfile;

  if (buddyProfile) {
    const { data: bProgress } = await supabase
      .from('progress')
      .select('chapter_id, completed')
      .eq('user_id', buddyProfile.id);

    buddyProgressMap = {};
    if (bProgress) {
      bProgress.forEach(row => {
        if (row.completed) buddyProgressMap[row.chapter_id] = true;
      });
    }

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
        <h2>${subject}</h2>
        <span class="subject-meta" id="${subject}-prog">0/${chapters.length}</span>
      </div>
      <ul class="chapter-list" id="list-${subject}">${listHTML}</ul>`;

    container.appendChild(section);
  }

  // Attach checkbox listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', handleCheck);
  });

  // Collapsible subjects
  container.querySelectorAll('.subject-header').forEach(header => {
    header.addEventListener('click', () => {
      const list = document.getElementById(`list-${header.dataset.subject}`);
      list.classList.toggle('collapsed');
    });
  });
}

// ===== HANDLE CHECK =====
async function handleCheck(e) {
  const checkbox = e.target;
  const chapterTaskId = checkbox.dataset.cid;
  const isChecked = checkbox.checked;

  // Update local state
  if (isChecked) {
    progressMap[chapterTaskId] = true;
    userXp += 10;
    showToast('+10 XP');
    triggerConfetti(checkbox);
  } else {
    delete progressMap[chapterTaskId];
    userXp = Math.max(0, userXp - 10);
  }

  // Check if full chapter mastered
  const baseCid = chapterTaskId.slice(0, -2); // e.g., 'Phy-0'
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
    // If chapter WAS mastered and now isn't, deduct the 50 bonus
    if (nameEl.classList.contains('completed') && !isChecked) {
      userXp = Math.max(0, userXp - 50);
      showToast('−50 XP (chapter unmastered)');
    }
    nameEl.classList.remove('completed');
  }

  updateDashboard();

  // Save to Supabase (debounced)
  await saveToSupabase(chapterTaskId, isChecked);
}

// ===== SAVE TO SUPABASE =====
async function saveToSupabase(chapterTaskId, completed) {
  // Upsert progress
  await supabase
    .from('progress')
    .upsert({
      user_id: currentUser.id,
      chapter_id: chapterTaskId,
      completed: completed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,chapter_id' });

  // Update XP
  await supabase
    .from('xp')
    .upsert({
      user_id: currentUser.id,
      xp: userXp
    }, { onConflict: 'user_id' });
}

// ===== UPDATE DASHBOARD =====
function updateDashboard() {
  const completed = Object.keys(progressMap).length;
  const pct = ((completed / TOTAL_TASKS) * 100).toFixed(1);
  const level = Math.floor(userXp / 100) + 1;

  document.getElementById('xp-display').textContent = userXp;
  document.getElementById('level-display').textContent = level;
  document.getElementById('progress-percent').textContent = `${pct}%`;
  document.getElementById('main-progress').style.width = `${pct}%`;

  // Per-subject mastered count
  let totalMastered = 0;
  for (const [subject, chapters] of Object.entries(syllabus)) {
    const prefix = subjectPrefixes[subject];
    let mastered = 0;
    for (let i = 0; i < chapters.length; i++) {
      const cid = `${prefix}-${i}`;
      if (progressMap[`${cid}-T`] && progressMap[`${cid}-Q`] && progressMap[`${cid}-R`]) {
        mastered++;
      }
    }
    totalMastered += mastered;
    const el = document.getElementById(`${subject}-prog`);
    if (el) el.textContent = `${mastered}/${chapters.length}`;
  }

  document.getElementById('chapters-display').textContent = `${totalMastered}/${TOTAL_CHAPTERS}`;
}

// ===== BUDDY SYSTEM =====
document.getElementById('btn-copy-code').addEventListener('click', () => {
  const code = document.getElementById('my-buddy-code').textContent;
  navigator.clipboard.writeText(code);
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

  if (code === userProfile.buddy_code) {
    statusEl.textContent = "That's your own code!";
    statusEl.style.color = '#ef4444';
    return;
  }

  // Find the buddy by code
  const { data: buddy, error } = await supabase
    .from('profiles')
    .select('id, display_name, buddy_code')
    .eq('buddy_code', code)
    .single();

  if (error || !buddy) {
    statusEl.textContent = 'No user found with that code.';
    statusEl.style.color = '#ef4444';
    return;
  }

  // Link both users
  await supabase.from('profiles').update({ buddy_id: buddy.id }).eq('id', currentUser.id);
  await supabase.from('profiles').update({ buddy_id: currentUser.id }).eq('id', buddy.id);

  userProfile.buddy_id = buddy.id;
  statusEl.textContent = `Paired with ${buddy.display_name}!`;
  statusEl.style.color = '#10b981';
  showToast(`🤝 Paired with ${buddy.display_name}!`);

  await loadBuddyData();
});

// ===== CONFETTI =====
function triggerConfetti(el) {
  const rect = el.getBoundingClientRect();
  confetti({
    particleCount: 12,
    spread: 30,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    },
    colors: ['#111827', '#d1d5db', '#9ca3af'],
    gravity: 1.5,
    scalar: 0.7,
    disableForReducedMotion: true
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
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
