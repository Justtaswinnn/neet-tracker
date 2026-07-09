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
let myFriends = [];
let pendingRequests = [];
let activeChatFriendId = null;
let friendsProgressMap = {};
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

let communityChart = null;

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    await loadUserData();
    buildUI();
    updateDashboard();
    startCountdown();
    loadFriendsGraph();
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
    document.getElementById('my-buddy-code').textContent = userProfile.buddy_code ? userProfile.buddy_code.toUpperCase() : '------';
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

  await loadFriendsData();
}


async function loadFriendsData() {
  const { data: friendships } = await supabase
    .from("friendships")
    .select("*")
    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

  pendingRequests = [];
  const acceptedFriendIds = [];

  if (friendships) {
    friendships.forEach(f => {
      if (f.status === "pending" && f.user2_id === currentUser.id) {
        pendingRequests.push(f.user1_id);
      } else if (f.status === "accepted") {
        acceptedFriendIds.push(f.user1_id === currentUser.id ? f.user2_id : f.user1_id);
      }
    });
  }

  const allIdsToFetch = [...new Set([...pendingRequests, ...acceptedFriendIds])];
  let profilesMap = {};
  if (allIdsToFetch.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", allIdsToFetch);
    if (profiles) {
      profiles.forEach(p => { profilesMap[p.id] = p; });
    }
  }

  myFriends = acceptedFriendIds.map(id => profilesMap[id]).filter(Boolean);
  const myPending = pendingRequests.map(id => profilesMap[id]).filter(Boolean);

  const reqContainer = document.getElementById("incoming-requests-container");
  const reqList = document.getElementById("requests-list");
  reqList.innerHTML = "";
  if (myPending.length > 0) {
    reqContainer.style.display = "block";
    myPending.forEach(p => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.innerHTML = `<span>${p.display_name}</span> <button class="btn-pair" onclick="acceptRequest('${p.id}')" style="padding:4px 8px; font-size:12px;">Accept</button>`;
      reqList.appendChild(li);
    });
  } else {
    reqContainer.style.display = "none";
  }

  friendsProgressMap = {};
  if (myFriends.length > 0) {
    const { data: fProg } = await supabase
      .from("progress")
      .select("*")
      .in("user_id", acceptedFriendIds)
      .eq("completed", true);
    
    if (fProg) {
      fProg.forEach(r => {
        if (!friendsProgressMap[r.user_id]) friendsProgressMap[r.user_id] = {};
        friendsProgressMap[r.user_id][r.chapter_id] = r;
      });
    }

    document.getElementById("friends-graph-section").style.display = "block";
    updateFriendsGraphData();
    initChat();
  } else {
    document.getElementById("friends-graph-section").style.display = "none";
    document.getElementById("btn-open-chat").style.display = "none";
    document.getElementById("chat-fab").style.display = "none";
  }
}

window.acceptRequest = async function(requesterId) {
  const { data, error } = await supabase.rpc("accept_buddy_request", { requester_id: requesterId });
  if (error) {
    showToast("Failed to accept.");
  } else {
    showToast("Request accepted!");
    await loadFriendsData();
    loadFriendsGraph();
  }
};


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
  
  loadFriendsGraph();
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


document.getElementById("btn-pair").addEventListener("click", async () => {
  const statusEl = document.getElementById("buddy-status");
  const code = document.getElementById("buddy-code-input").value.trim().toLowerCase();

  if (!code || code.length < 6) {
    statusEl.textContent = "Enter a valid 6-character code.";
    statusEl.style.color = "#ef4444";
    return;
  }

  const { data, error } = await supabase.rpc("send_buddy_request", { target_code: code });

  if (error) {
    statusEl.textContent = "Something went wrong. Try again.";
    statusEl.style.color = "#ef4444";
    return;
  }

  if (data && !data.success) {
    statusEl.textContent = data.error;
    statusEl.style.color = "#ef4444";
    return;
  }

  statusEl.textContent = "Request sent!";
  statusEl.style.color = "#10b981";
  showToast("Friend request sent!");
  document.getElementById("buddy-code-input").value = "";
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

// ===== FRIENDS GRAPH =====

let friendsChart = null;
let rawProgressData = [];

async function loadFriendsGraph() {
  if (myFriends.length === 0) return;
  const friendIds = myFriends.map(f => f.id);
  const { data: allProgress } = await supabase
    .from("progress")
    .select("user_id, completed, updated_at")
    .in("user_id", [currentUser.id, ...friendIds])
    .eq("completed", true);
  
  if (allProgress) {
    rawProgressData = allProgress;
    updateFriendsGraphData();
  }
}

function updateFriendsGraphData() {
  if (!rawProgressData || rawProgressData.length === 0) return;

  const users = { [currentUser.id]: userProfile.display_name };
  myFriends.forEach(f => users[f.id] = f.display_name);
  
  const timelineMap = {};
  
  rawProgressData.forEach(p => {
    const date = new Date(p.updated_at).toISOString().split("T")[0];
    if (!timelineMap[date]) timelineMap[date] = {};
    if (!timelineMap[date][p.user_id]) timelineMap[date][p.user_id] = 0;
    timelineMap[date][p.user_id] += (1/3); // 3 tasks = 1 chapter
  });

  const sortedDates = Object.keys(timelineMap).sort();
  const labels = sortedDates;
  
  const datasets = Object.keys(users).map((uid, index) => {
    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
    const color = colors[index % colors.length];
    
    let cumulative = 0;
    const data = sortedDates.map(date => {
      if (timelineMap[date] && timelineMap[date][uid]) {
        cumulative += timelineMap[date][uid];
      }
      return cumulative;
    });

    return {
      label: users[uid],
      data: data,
      borderColor: color,
      backgroundColor: color + "20",
      fill: true,
      tension: 0.4
    };
  });

  const ctx = document.getElementById("friendsChart");
  
  if (friendsChart) {
    friendsChart.data.labels = labels;
    friendsChart.data.datasets = datasets;
    friendsChart.update();
    return;
  }

  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.color = "#9ca3af";

  friendsChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: "#9ca3af" } },
        tooltip: {
          mode: 'index', intersect: false,
          backgroundColor: "#1f2937", titleFont: { size: 13, weight: "600" }, padding: 10
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.05)" } },
        x: { grid: { display: false } }
      }
    }
  });
}



// ===== REAL-TIME CHAT =====
let chatChannel = null;
let typingTimeout = null;

async function initChat() {
  if (myFriends.length === 0) return;
  
  document.getElementById("chat-fab").style.display = "flex";
  document.getElementById("btn-open-chat").style.display = "block";

  const selector = document.getElementById("chat-friend-selector");
  selector.innerHTML = "";
  myFriends.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.display_name;
    selector.appendChild(opt);
  });

  if (!activeChatFriendId && myFriends.length > 0) {
    activeChatFriendId = myFriends[0].id;
  }
  
  if (activeChatFriendId) {
    selector.value = activeChatFriendId;
  }

  selector.addEventListener("change", (e) => {
    activeChatFriendId = e.target.value;
    loadChatHistory();
  });

  await loadChatHistory();
  
  if (!chatChannel) {
    chatChannel = supabase.channel('global_chat');
    
    chatChannel.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      const msg = payload.new;
      if (msg.receiver_id === currentUser.id || msg.sender_id === currentUser.id) {
        
        // Only append if it belongs to current active chat
        if ((msg.sender_id === currentUser.id && msg.receiver_id === activeChatFriendId) ||
            (msg.sender_id === activeChatFriendId && msg.receiver_id === currentUser.id)) {
          appendMessage(msg);
        }

        if (msg.sender_id !== currentUser.id && !document.getElementById("chat-window").classList.contains("show")) {
          const badge = document.getElementById("chat-unread-badge");
          badge.style.display = "block";
        }
      }
    });

    chatChannel.on("broadcast", { event: "typing" }, payload => {
      if (payload.payload.user_id === activeChatFriendId) {
        const ind = document.getElementById("chat-typing-indicator");
        ind.style.visibility = "visible";
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { ind.style.visibility = "hidden"; }, 2000);
      }
    });

    chatChannel.subscribe();
  }
}

async function loadChatHistory() {
  if (!activeChatFriendId) return;

  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatFriendId}),and(sender_id.eq.${activeChatFriendId},receiver_id.eq.${currentUser.id})`)
    .order("created_at", { ascending: true })
    .limit(50);
  
  const container = document.getElementById("chat-messages");
  container.innerHTML = "";
  if (data) {
    data.forEach(msg => appendMessage(msg));
  }
}

function appendMessage(msg) {
  const container = document.getElementById("chat-messages");
  const isSent = msg.sender_id === currentUser.id;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${isSent ? "chat-bubble-sent" : "chat-bubble-received"}`;
  
  let contentHtml = "";
  if (msg.image_url) {
    contentHtml += `<img src="${msg.image_url}" class="chat-image" alt="Image"><br>`;
  }
  if (msg.content) {
    const text = document.createElement("div");
    text.textContent = msg.content;
    contentHtml += text.innerHTML;
  }
  
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  bubble.innerHTML = `${contentHtml}<span class="chat-time">${time}</span>`;
  
  container.appendChild(bubble);
  document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;
}

document.getElementById("chat-fab").addEventListener("click", toggleChat);
document.getElementById("btn-open-chat").addEventListener("click", toggleChat);
document.getElementById("btn-close-chat").addEventListener("click", () => {
  document.getElementById("chat-window").classList.remove("show");
});

function toggleChat() {
  const win = document.getElementById("chat-window");
  win.classList.toggle("show");
  if (win.classList.contains("show")) {
    document.getElementById("chat-unread-badge").style.display = "none";
    document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;
    document.getElementById("chat-input").focus();
  }
}

document.getElementById("chat-input").addEventListener("input", () => {
  if (chatChannel && activeChatFriendId) {
    chatChannel.send({ type: "broadcast", event: "typing", payload: { user_id: currentUser.id } });
  }
});

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const content = input.value.trim();
  if (content && activeChatFriendId) {
    input.value = "";
    await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: activeChatFriendId,
      content: content
    });
  }
}

document.getElementById("chat-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

document.getElementById("btn-send-msg").addEventListener("click", sendMessage);

document.getElementById("btn-attach-image").addEventListener("click", () => {
  document.getElementById("chat-image-input").click();
});

document.getElementById("chat-image-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !activeChatFriendId) return;
  
  const ext = file.name.split(".").pop();
  const fileName = `${currentUser.id}_${Date.now()}.${ext}`;
  
  const { data, error } = await supabase.storage.from("chat-images").upload(fileName, file);
  if (error) {
    showToast("Failed to upload image");
    return;
  }
  
  const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
  
  await supabase.from("messages").insert({
    sender_id: currentUser.id,
    receiver_id: activeChatFriendId,
    image_url: urlData.publicUrl
  });
  
  e.target.value = ""; // reset
});
