// =============================================
//  Drona-a-charya v2 | app.js
//  Auth gate + real mentor data from MongoDB
// =============================================

// ---- STATE ----
let currentUser  = null;
let authToken    = null;
let mentorsData  = [];
let activeFilter = 'All';
let selectedSlot = null;
let activeMentorId = null;

const AVATAR_COLORS = [
  { bg:'#E1F5EE', text:'#085041' },
  { bg:'#E6F1FB', text:'#0C447C' },
  { bg:'#FAEEDA', text:'#633806' },
  { bg:'#FAECE7', text:'#4A1B0C' },
  { bg:'#EEEDFE', text:'#26215C' },
  { bg:'#9FE1CB', text:'#04342C' },
];

function avatarColor(name) {
  const idx = (name || 'A').charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
function initials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────
//  AUTH: stored token check on page load
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('drona_token');
  const user   = localStorage.getItem('drona_user');
  if (stored && user) {
    authToken   = stored;
    currentUser = JSON.parse(user);
    enterApp();
  }
});

// ─────────────────────────────────────────────
//  AUTH MODAL NAVIGATION
// ─────────────────────────────────────────────
let selectedRole = '';

function showLogin() {
  document.getElementById('loginForm').style.display  = 'block';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('btnLogin').classList.add('active');
  document.getElementById('btnSignup').classList.remove('active');
  clearErrors();
}

function showSignup() {
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'block';
  document.getElementById('btnSignup').classList.add('active');
  document.getElementById('btnLogin').classList.remove('active');
  goSlide1();
  clearErrors();
}

function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(el => {
    el.textContent = ''; el.classList.remove('show');
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

// ─── slide navigation ───
function goSlide1() {
  setSlide(1);
}
function goSlide2() {
  const name  = document.getElementById('suName').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pass  = document.getElementById('suPass').value;
  if (!name)            return showError('slide1Error', 'Please enter your name.');
  if (!email || !email.includes('@')) return showError('slide1Error', 'Please enter a valid email.');
  if (pass.length < 6)  return showError('slide1Error', 'Password must be at least 6 characters.');
  setSlide(2);
}
function goSlide3() {
  if (!selectedRole) return showError('slide2Error', 'Please select a role to continue.');
  document.getElementById('mentorDetails').style.display  = selectedRole === 'mentor' ? 'block' : 'none';
  document.getElementById('studentDetails').style.display = selectedRole === 'student'? 'block' : 'none';
  setSlide(3);
}

function setSlide(n) {
  [1,2,3].forEach(i => {
    document.getElementById('slide'+i).style.display = i === n ? 'block' : 'none';
    const dot = document.getElementById('dot'+i);
    dot.classList.toggle('active', i === n);
    dot.classList.toggle('done',   i < n);
  });
  clearErrors();
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('roleStudent').classList.toggle('selected', role === 'student');
  document.getElementById('roleMentor').classList.toggle('selected',  role === 'mentor');
}

function toggleChip(el) {
  el.classList.toggle('selected');
}

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!email || !password) return showError('loginError', 'Please enter email and password.');

  const btn = document.querySelector('#loginForm .auth-submit');
  btn.disabled = true; btn.textContent = 'Logging in…';

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      showError('loginError', data.message || 'Login failed.');
    } else {
      authToken   = data.token;
      currentUser = data.user;
      localStorage.setItem('drona_token', authToken);
      localStorage.setItem('drona_user',  JSON.stringify(currentUser));
      enterApp();
    }
  } catch (err) {
    showError('loginError', 'Network error. Is the server running?');
  } finally {
    btn.disabled = false; btn.textContent = 'Log in';
  }
}

// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────
async function doRegister() {
  const name     = document.getElementById('suName').value.trim();
  const email    = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPass').value;

  const payload = { name, email, password, role: selectedRole };

  if (selectedRole === 'mentor') {
    const chips = [...document.querySelectorAll('.exp-chip.selected')].map(c => c.dataset.val);
    payload.institution = document.getElementById('suInstitution').value.trim();
    payload.designation = document.getElementById('suDesignation').value.trim();
    payload.experience  = document.getElementById('suExperience').value.trim();
    payload.bio         = document.getElementById('suBio').value.trim();
    payload.expertise   = chips;
    if (!payload.institution || !payload.designation)
      return showError('slide3Error', 'Please fill institution and designation.');
    if (chips.length === 0)
      return showError('slide3Error', 'Please select at least one area of expertise.');
  }

  const btn = document.getElementById('finalBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) {
      showError('slide3Error', data.message || 'Registration failed.');
    } else {
      authToken   = data.token;
      currentUser = data.user;
      localStorage.setItem('drona_token', authToken);
      localStorage.setItem('drona_user',  JSON.stringify(currentUser));
      enterApp();
    }
  } catch (err) {
    showError('slide3Error', 'Network error. Is the server running?');
  } finally {
    btn.disabled = false; btn.textContent = 'Create account';
  }
}

// ─────────────────────────────────────────────
//  ENTER APP
// ─────────────────────────────────────────────
function enterApp() {
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('mainApp').style.display     = 'block';

  const av = avatarColor(currentUser.name);
  document.getElementById('navAvatar').textContent          = initials(currentUser.name);
  document.getElementById('navAvatar').style.background     = av.bg;
  document.getElementById('navAvatar').style.color          = av.text;
  document.getElementById('navUserName').textContent        = currentUser.name;

  loadMentors();
}

// ─────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem('drona_token');
  localStorage.removeItem('drona_user');
  authToken = null; currentUser = null; mentorsData = [];
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('mainApp').style.display     = 'none';
  showLogin();
}

// ─────────────────────────────────────────────
//  LOAD MENTORS FROM MONGODB via API
// ─────────────────────────────────────────────
async function loadMentors() {
  document.getElementById('mentorGrid').innerHTML =
    '<div class="loading-state">Loading mentors…</div>';

  try {
    const res  = await fetch('/api/mentors', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const data = await res.json();

    if (!data.success) {
      document.getElementById('mentorGrid').innerHTML =
        '<div class="empty-state">Could not load mentors. Please refresh.</div>';
      return;
    }

    mentorsData = data.data;

    // update stats
    document.getElementById('statMentors').textContent = mentorsData.length;
    document.getElementById('statAvail').textContent   = mentorsData.filter(m => m.available).length;

    renderCards();
  } catch (err) {
    document.getElementById('mentorGrid').innerHTML =
      '<div class="empty-state">Network error. Make sure the server is running.</div>';
  }
}

// ─────────────────────────────────────────────
//  RENDER MENTOR CARDS
// ─────────────────────────────────────────────
function tagClass(tag) {
  const map = { 'AI/ML':'tag-ml','Autonomous Flight':'tag-ai','Hardware':'tag-hw','Regulations':'tag-reg','UX':'tag-ux','Propulsion':'tag-hw' };
  return map[tag] || 'tag-reg';
}

function filterChip(el, filter) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeFilter = filter;
  renderCards();
}

function renderCards() {
  const q    = (document.getElementById('search').value || '').toLowerCase();
  const grid = document.getElementById('mentorGrid');

  const filtered = mentorsData.filter(m => {
    const tags = m.expertise || [];
    const matchFilter = activeFilter === 'All' || tags.includes(activeFilter);
    const matchSearch = !q
      || m.name.toLowerCase().includes(q)
      || (m.designation || '').toLowerCase().includes(q)
      || (m.institution || '').toLowerCase().includes(q)
      || tags.some(t => t.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No mentors found matching your search.</div>';
    return;
  }

  grid.innerHTML = filtered.map(m => {
    const av    = avatarColor(m.name);
    const ini   = initials(m.name);
    const role  = [m.designation, m.institution].filter(Boolean).join(' · ');
    const tags  = (m.expertise || []).slice(0, 3);
    const idx   = mentorsData.findIndex(x => x._id === m._id);
    return `
    <div class="mentor-card">
      <div class="card-header">
        <div class="avatar" style="background:${av.bg};color:${av.text}">${ini}</div>
        <div class="card-info">
          <div class="card-name">${m.name}</div>
          <div class="card-role">${role || 'Drone Expert'}</div>
          <div style="margin-top:5px;font-size:11px;color:var(--text-muted)">
            <span class="avail-dot ${m.available ? 'avail-yes':'avail-no'}"></span>
            ${m.available ? 'Available this week' : 'Fully booked'}
          </div>
        </div>
      </div>
      <div class="card-tags">
        ${tags.map(t => `<span class="tag ${tagClass(t)}">${t}</span>`).join('')}
      </div>
      <div class="card-divider"></div>
      <div class="card-meta">
        <div class="meta-item">
          <svg class="meta-icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
          ${m.sessions || 0} sessions
        </div>
        <div class="meta-item">
          <svg class="meta-icon" viewBox="0 0 16 16"><polygon points="8,2 10,6 14,6.5 11,9.5 11.8,13.5 8,11.5 4.2,13.5 5,9.5 2,6.5 6,6"/></svg>
          ${m.rating || 'New'}
        </div>
        <div class="meta-item">
          <svg class="meta-icon" viewBox="0 0 16 16"><path d="M3 3h10v8H9l-3 2V11H3z"/></svg>
          ${m.projects || 0} projects
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-primary"   onclick="openPanel('${m._id}')">View Profile</button>
        <button class="btn-secondary" onclick="quickBook('${m._id}')">Quick Book</button>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
//  PROFILE PANEL
// ─────────────────────────────────────────────
function openPanel(id) {
  const m = mentorsData.find(x => x._id === id);
  if (!m) return;
  activeMentorId = id;
  selectedSlot   = null;
  const av  = avatarColor(m.name);
  const ini = initials(m.name);
  const role = [m.designation, m.institution].filter(Boolean).join(' · ');

  const defaultSlots = ['Mon 10am','Mon 3pm','Wed 11am','Wed 4pm','Fri 10am','Fri 2pm'];

  document.getElementById('panel').innerHTML = `
    <div class="panel-head">
      <div></div>
      <button class="close-btn" onclick="closePanel()">✕</button>
    </div>
    <div class="panel-body">
      <div class="panel-avatar" style="background:${av.bg};color:${av.text}">${ini}</div>
      <div class="panel-name">${m.name}</div>
      <div class="panel-role">${role || 'Drone Expert'}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
        <span class="avail-dot ${m.available?'avail-yes':'avail-no'}" style="display:inline-block"></span>
        ${m.available?'Available this week':'Fully booked'} &nbsp;·&nbsp;
        <span style="color:var(--accent-dark);font-weight:500">&#9733; ${m.rating||'New'}</span>
        &nbsp;·&nbsp; ${m.sessions||0} sessions
        ${m.experience ? '&nbsp;·&nbsp; '+m.experience : ''}
      </div>
      ${m.bio ? `
      <div class="panel-section">
        <div class="panel-section-label">About</div>
        <div class="panel-bio">${m.bio}</div>
      </div>` : ''}
      <div class="panel-section">
        <div class="panel-section-label">Expertise</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${(m.expertise||[]).map(t => `<span class="tag ${tagClass(t)}">${t}</span>`).join('')}
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-label">Choose a session slot</div>
        <div class="slots" id="slotGrid">
          ${defaultSlots.map(s => `<div class="slot" onclick="selectSlot(this,'${s}')">${s}</div>`).join('')}
        </div>
      </div>
      <button class="request-btn" onclick="requestSession()">Send session request</button>
    </div>`;

  document.getElementById('overlay').classList.add('open');
}

function selectSlot(el, slot) {
  document.querySelectorAll('#slotGrid .slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selectedSlot = slot;
}

function closePanel(e) {
  if (!e || e.target === document.getElementById('overlay'))
    document.getElementById('overlay').classList.remove('open');
}

async function requestSession() {
  const m = mentorsData.find(x => x._id === activeMentorId);
  if (!m) return;
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+authToken },
      body: JSON.stringify({ mentorId: activeMentorId, slot: selectedSlot || 'TBD', message: '' })
    });
  } catch (_) {}
  showToast(`Session request sent to ${m.name}${selectedSlot ? ' for '+selectedSlot : ''}!`);
  document.getElementById('overlay').classList.remove('open');
}

async function quickBook(id) {
  const m = mentorsData.find(x => x._id === id);
  if (!m) return;
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+authToken },
      body: JSON.stringify({ mentorId: id, slot: 'TBD', message: 'Quick booking request' })
    });
  } catch (_) {}
  showToast(`Quick request sent to ${m.name}!`);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
