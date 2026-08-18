/* ===================== CONFIG ===================== */
const SUPABASE_URL = 'https://zqdgqwhzvveiindyolvh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CcfO-AXnPODr2YoZTLihTQ_RRaYvNz1';

let supabaseClient = null;
try {
  if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) { console.error('Supabase init error:', e); }

/* ===================== STATE ===================== */
let currentUser = null;
let currentScreen = 'auth';
let currentStatusType = 'lost';
let allItemsCache = [];
let selectedItem = null;
let currentActiveChat = null;
let activeChats = [
  {
    id: 'chat_1',
    itemTitle: 'Sample Item',
    participants: 'f20261066@pilani.bits-pilani.ac.in & finder@bits-pilani.ac.in',
    messages: [
      { sender: 'System', text: 'Secure channel opened.' },
      { sender: 'f20261066@pilani.bits-pilani.ac.in', text: 'Hi! Is this available?' }
    ]
  }
];

/* ===================== TOASTS ===================== */
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerText = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

/* ===================== SHELL ===================== */
function buildShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-frame">
      <header id="app-header" class="app-header hidden">
        <div class="app-header-inner">
          <div class="brand-row">
            <div class="logo-badge">BITS</div>
            <div>
              <div class="brand-title">Lost & Found</div>
              <div class="brand-sub">Campus Portal</div>
            </div>
          </div>
          <button class="account-btn" onclick="switchScreen('profile')">
            <i class="fa-solid fa-user-shield"></i> Account
          </button>
        </div>
      </header>

      <main id="screen-root" class="screen-root"></main>

      <nav id="bottom-nav" class="bottom-nav glass hidden">
        <button onclick="switchScreen('home')" id="nav-home" class="nav-btn">
          <i class="fa-solid fa-house"></i><span>Feed</span>
        </button>
        <button onclick="switchScreen('report')" id="nav-report" class="nav-btn">
          <i class="fa-solid fa-circle-plus"></i><span>Report</span>
        </button>
        <button onclick="switchScreen('chats')" id="nav-chats" class="nav-btn">
          <i class="fa-solid fa-comments"></i><span>Chats</span>
        </button>
        <button onclick="switchScreen('admin')" id="nav-admin" class="nav-btn hidden">
          <i class="fa-solid fa-shield-halved"></i><span>Admin</span>
        </button>
      </nav>

      <div id="item-modal" class="modal-backdrop hidden">
        <div class="modal-panel glass">
          <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-right:26px;">
            <h3 id="modal-title" style="font-size:14px;font-weight:700;">Item</h3>
            <span id="modal-type-badge" class="badge badge-lost">LOST</span>
          </div>
          <div id="modal-image-container" class="hidden">
            <img id="modal-image" class="modal-img" src="" alt="Item photo">
          </div>
          <p class="muted" style="font-size:12px;margin-top:8px;">
            <i class="fa-solid fa-location-dot" style="color:var(--gold);"></i>
            <span id="modal-location">Location</span>
          </p>
          <p id="modal-desc" class="item-desc" style="margin-top:10px;-webkit-line-clamp:unset;">Description</p>
          <div class="muted" style="font-size:10px;margin-top:10px;">
            Posted by: <strong id="modal-contact" style="color:var(--text);">User</strong>
          </div>
          <button class="btn btn-primary" style="margin-top:14px;" onclick="openChatFromModal()">
            <i class="fa-solid fa-comment-dots"></i> Open Secure Chat
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ===================== NAVIGATION ===================== */
function switchScreen(screenId) {
  if (!currentUser && screenId !== 'auth') screenId = 'auth';
  currentScreen = screenId;

  const header = document.getElementById('app-header');
  const nav = document.getElementById('bottom-nav');
  if (screenId === 'auth') {
    header.classList.add('hidden');
    nav.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
    nav.classList.remove('hidden');
  }

  renderScreen(screenId);

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeNav = document.getElementById('nav-' + screenId);
  if (activeNav) activeNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderScreen(screenId) {
  const root = document.getElementById('screen-root');
  switch (screenId) {
    case 'auth': root.innerHTML = tplAuth(); break;
    case 'home': root.innerHTML = tplHome(); fetchItems(); break;
    case 'report': root.innerHTML = tplReport(); break;
    case 'chats': root.innerHTML = tplChats(); renderChatsList(); break;
    case 'chat': root.innerHTML = tplChat(); renderChatMessages(); break;
    case 'admin': root.innerHTML = tplAdmin(); renderAdminList(); renderAdminChats(); break;
    case 'profile': root.innerHTML = tplProfile(); break;
  }
  root.className = 'screen-root screen-view';
}

/* ===================== TEMPLATES ===================== */
function tplAuth() {
  return `
    <div class="auth-wrap">
      <div class="auth-logo">BITS</div>
      <h2 style="text-align:center;font-size:19px;font-weight:700;">Campus Portal</h2>
      <p class="muted" style="text-align:center;font-size:11px;margin-top:4px;">Sign in with your BITS mail or admin account</p>
      <form onsubmit="handleAuth(event)" class="glass auth-card" style="margin-top:22px;">
        <label class="field-label">Email Address</label>
        <input type="email" id="auth-email" required placeholder="f20261066@pilani.bits-pilani.ac.in" class="input" style="margin-bottom:14px;">
        <label class="field-label">Password</label>
        <input type="password" id="auth-password" required placeholder="••••••••" class="input" style="margin-bottom:12px;">
        <div id="auth-error" class="error-text hidden" style="margin-bottom:10px;"></div>
        <button type="submit" id="auth-submit-btn" class="btn btn-primary">Sign In</button>
      </form>
      <p class="muted" style="text-align:center;font-size:10px;margin-top:14px;">Admin accounts start with "admin" (Pass: admin123)</p>
    </div>`;
}

function tplHome() {
  return `
    <div class="screen-view">
      <div class="search-row">
        <div class="search-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="search-input" oninput="filterItems()" placeholder="Search items..." class="input">
        </div>
        <select id="filter-type" onchange="filterItems()" class="input">
          <option value="all">All Types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
      </div>
      <div id="items-feed">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>`;
}

function tplReport() {
  return `
    <div class="screen-view">
      <h2 class="section-title">Post Lost or Found Item</h2>
      <form onsubmit="handleReportSubmit(event)" class="glass" style="padding:20px;">
        <div class="toggle-pair" style="margin-bottom:16px;">
          <button type="button" id="btn-type-lost" onclick="setReportType('lost')" class="toggle-btn active-lost">Lost Item</button>
          <button type="button" id="btn-type-found" onclick="setReportType('found')" class="toggle-btn">Found Item</button>
        </div>
        <label class="field-label">Item Title</label>
        <input type="text" id="report-title" required placeholder="e.g. Apple MacBook Air M1" class="input" style="margin-bottom:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div>
            <label class="field-label">Category</label>
            <select id="report-category" class="input">
              <option value="electronics">Electronics</option>
              <option value="documents">Documents/ID</option>
              <option value="keys">Keys</option>
              <option value="clothing">Clothing</option>
              <option value="stationery">Stationery</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="field-label">Campus</label>
            <input type="text" id="report-campus" value="Pilani" required class="input">
          </div>
        </div>
        <label class="field-label">Location Details</label>
        <input type="text" id="report-location" required placeholder="e.g. NAB Audi 2" class="input" style="margin-bottom:14px;">
        <label class="field-label">Description</label>
        <textarea id="report-desc" rows="3" required placeholder="Provide color, serial number or distinctive features..." class="input" style="margin-bottom:14px;"></textarea>
        <label class="field-label">Upload Photo (Optional)</label>
        <input type="file" id="report-image" accept="image/*" class="input" style="margin-bottom:18px;">
        <button type="submit" id="submit-btn" class="btn btn-primary">Publish Listing</button>
      </form>
    </div>`;
}

function tplChats() {
  return `
    <div class="screen-view">
      <h2 class="section-title">Secure Conversations</h2>
      <div id="chats-list-container"></div>
    </div>`;
}

function tplChat() {
  return `
    <div class="screen-view">
      <div class="chat-shell">
        <div class="glass chat-header">
          <button onclick="switchScreen('chats')" class="btn-ghost btn btn-sm" style="width:auto;">
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
          <h3 id="chat-item-title" style="font-size:12px;font-weight:700;">Chat Room</h3>
          <div style="width:40px;"></div>
        </div>
        <div id="chat-messages" class="glass chat-messages"></div>
        <div class="glass chat-input-row">
          <input type="text" id="chat-input" placeholder="Type a secure message..." class="input">
          <button onclick="sendChatMessage()" class="btn btn-primary btn-sm">Send</button>
        </div>
      </div>
    </div>`;
}

function tplAdmin() {
  return `
    <div class="screen-view">
      <div class="glass" style="padding:14px 16px;border-color:rgba(212,175,55,.35);margin-bottom:16px;">
        <h2 style="font-size:12px;font-weight:700;color:var(--gold-2);"><i class="fa-solid fa-shield-halved"></i> Administrator Control Center</h2>
        <p class="muted" style="font-size:10px;margin-top:4px;">Manage reported posts and audit discussions.</p>
      </div>
      <div class="glass" style="padding:16px;margin-bottom:16px;">
        <h3 class="section-title" style="border-bottom:1px solid var(--border);padding-bottom:10px;">Active Database Posts</h3>
        <div id="admin-items-list"></div>
      </div>
      <div class="glass" style="padding:16px;">
        <h3 class="section-title" style="border-bottom:1px solid var(--border);padding-bottom:10px;">Platform Chat Audits</h3>
        <div id="admin-chats-list"></div>
      </div>
    </div>`;
}

function tplProfile() {
  const initials = currentUser ? currentUser.email.substring(0, 2).toUpperCase() : '--';
  const role = currentUser && currentUser.isAdmin ? '🛡️ Campus Administrator' : 'Verified BITSian Student';
  return `
    <div class="screen-view">
      <div class="glass" style="padding:30px 20px;text-align:center;">
        <div class="auth-logo" style="width:64px;height:64px;font-size:18px;">${initials}</div>
        <h3 style="font-size:13px;font-weight:700;margin-top:12px;">${currentUser ? currentUser.email : ''}</h3>
        <p class="muted" style="font-size:10px;margin-top:4px;">${role}</p>
        <button onclick="handleLogout()" class="btn btn-danger" style="margin-top:18px;">Sign Out</button>
      </div>
    </div>`;
}

/* ===================== AUTH ===================== */
async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  const btn = document.getElementById('auth-submit-btn');
  errorEl.classList.add('hidden');

  const isAdmin = email.toLowerCase().startsWith('admin');

  btn.disabled = true;
  btn.innerText = 'Verifying...';

  // Real backend check (Express /api/auth/login) — validates BITS campus domain server-side.
  // Admin accounts skip domain validation (matches original client-only admin flow).
  if (!isAdmin) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        errorEl.innerText = data.message || 'Login failed.';
        errorEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerText = 'Sign In';
        return;
      }
    } catch (err) {
      console.error('Auth backend error:', err);
      errorEl.innerText = 'Could not reach the server. Try again.';
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.innerText = 'Sign In';
      return;
    }
  }

  if (isAdmin && password !== 'admin123') {
    errorEl.innerText = 'Incorrect password';
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.innerText = 'Sign In';
    return;
  }

  currentUser = { email, isAdmin, id: isAdmin ? 'admin_root' : 'bits_user_1' };
  toast(`Welcome, ${email.split('@')[0]}`, 'success');

  const adminNavBtn = document.getElementById('nav-admin');
  if (isAdmin) {
    adminNavBtn.classList.remove('hidden');
    switchScreen('admin');
  } else {
    adminNavBtn.classList.add('hidden');
    switchScreen('home');
  }
}

function handleLogout() {
  currentUser = null;
  currentActiveChat = null;
  document.getElementById('nav-admin').classList.add('hidden');
  switchScreen('auth');
}

/* ===================== ITEMS (Supabase) ===================== */
async function fetchItems() {
  try {
    if (supabaseClient) {
      const response = await supabaseClient
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      if (response.error) {
        console.error('Supabase fetch error:', response.error.message);
        toast('Could not load items.', 'error');
      } else if (response.data) {
        allItemsCache = response.data;
      }
    }
  } catch (e) {
    console.error('Error connecting to Supabase:', e);
  }
  renderFeed(allItemsCache);
  if (currentUser && currentUser.isAdmin && currentScreen === 'admin') {
    renderAdminList();
    renderAdminChats();
  }
}

function renderFeed(items) {
  const feed = document.getElementById('items-feed');
  if (!feed) return;
  if (!items || !items.length) {
    feed.innerHTML = `<div class="empty-state">No items listed yet or database is empty.</div>`;
    return;
  }
  feed.innerHTML = items.map((item, idx) => {
    const itemType = item.type || 'lost';
    const badgeClass = itemType === 'lost' ? 'badge-lost' : 'badge-found';
    return `
      <div onclick="openModal(${idx})" class="glass item-card">
        <div class="item-card-top">
          <h3 class="item-title">${escapeHtml(item.title || 'Item')}</h3>
          <span class="badge ${badgeClass}">${itemType.toUpperCase()}</span>
        </div>
        <p class="item-loc"><i class="fa-solid fa-location-dot"></i>${escapeHtml(item.location || 'Campus')} (${escapeHtml(item.campus || 'Pilani')})</p>
        <p class="item-desc">${escapeHtml(item.description || '')}</p>
      </div>`;
  }).join('');
}

function filterItems() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const t = document.getElementById('filter-type').value;
  renderFeed(allItemsCache.filter(i => {
    const matchesTitle = (i.title || '').toLowerCase().includes(q);
    const matchesType = (t === 'all' || (i.type || 'lost') === t);
    return matchesTitle && matchesType;
  }));
}

function setReportType(type) {
  currentStatusType = type;
  document.getElementById('btn-type-lost').className = 'toggle-btn' + (type === 'lost' ? ' active-lost' : '');
  document.getElementById('btn-type-found').className = 'toggle-btn' + (type === 'found' ? ' active-found' : '');
}

function handleReportSubmit(e) {
  e.preventDefault();
  const imageInput = document.getElementById('report-image');
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (uploadEvent) => saveNewItem(uploadEvent.target.result);
    reader.readAsDataURL(file);
  } else {
    saveNewItem(null);
  }
}

async function saveNewItem(imageUrl) {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.innerText = 'Publishing to Supabase...';
  submitBtn.disabled = true;

  const newItem = {
    title: document.getElementById('report-title').value,
    location: document.getElementById('report-location').value,
    description: document.getElementById('report-desc').value,
    category: document.getElementById('report-category').value,
    campus: document.getElementById('report-campus').value,
    image_url: imageUrl,
    type: currentStatusType,
    status: 'active',
    contact_email: currentUser ? currentUser.email : 'student@bits-pilani.ac.in'
  };

  try {
    if (!supabaseClient) {
      toast('Supabase client is not initialized.', 'error');
    } else {
      const response = await supabaseClient.from('items').insert([newItem]).select();
      if (response.error) {
        console.error('Supabase Insert Error:', response.error);
        toast('Failed to publish listing: ' + response.error.message, 'error');
      } else {
        toast('Listing published!', 'success');
      }
    }
  } catch (e) {
    console.error('Exception during Supabase save:', e);
    toast('An error occurred while saving to database.', 'error');
  }

  submitBtn.innerText = 'Publish Listing';
  submitBtn.disabled = false;

  switchScreen(currentUser && currentUser.isAdmin ? 'admin' : 'home');
}

/* ===================== ADMIN ===================== */
function renderAdminList() {
  const container = document.getElementById('admin-items-list');
  if (!container) return;
  if (!allItemsCache.length) {
    container.innerHTML = `<p class="empty-state">No active posts.</p>`;
    return;
  }
  container.innerHTML = allItemsCache.map((item, idx) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.04);padding:12px;border-radius:12px;border:1px solid var(--border);margin-bottom:8px;">
      <div>
        <h4 style="font-size:12px;font-weight:700;">${escapeHtml(item.title)}</h4>
        <p class="muted" style="font-size:10px;">By: ${escapeHtml(item.contact_email || 'Unknown')} | Loc: ${escapeHtml(item.location)}</p>
      </div>
      <button onclick="deleteItem(${idx})" class="btn btn-danger btn-sm">Delete</button>
    </div>`).join('');
}

function renderAdminChats() {
  const container = document.getElementById('admin-chats-list');
  if (!container) return;
  if (!activeChats.length) {
    container.innerHTML = `<p class="empty-state">No ongoing chats.</p>`;
    return;
  }
  container.innerHTML = activeChats.map((chat, idx) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.04);padding:12px;border-radius:12px;border:1px solid var(--border);margin-bottom:8px;">
      <div>
        <h4 style="font-size:12px;font-weight:700;">${escapeHtml(chat.itemTitle)}</h4>
        <p class="muted" style="font-size:10px;">Users: ${escapeHtml(chat.participants)}</p>
        <p style="font-size:9px;color:var(--gold);font-weight:600;margin-top:2px;">${chat.messages.length} messages logged</p>
      </div>
      <button onclick="auditChat(${idx})" class="btn btn-cyan btn-sm">Audit Chat</button>
    </div>`).join('');
}

async function deleteItem(index) {
  const item = allItemsCache[index];
  if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
  try {
    if (supabaseClient && item.id) {
      const response = await supabaseClient.from('items').delete().eq('id', item.id);
      if (response.error) toast('Error deleting from database: ' + response.error.message, 'error');
      else toast('Item deleted.', 'success');
    }
  } catch (e) {
    console.error('Error deleting from Supabase:', e);
  }
  allItemsCache.splice(index, 1);
  renderFeed(allItemsCache);
  renderAdminList();
}

/* ===================== ITEM MODAL ===================== */
function openModal(index) {
  selectedItem = allItemsCache[index];
  document.getElementById('modal-title').innerText = selectedItem.title;
  document.getElementById('modal-location').innerText = `${selectedItem.location || ''} (${selectedItem.campus || 'Pilani'})`;
  document.getElementById('modal-desc').innerText = selectedItem.description;
  document.getElementById('modal-contact').innerText = selectedItem.contact_email || 'Verified BITSian';

  const badge = document.getElementById('modal-type-badge');
  const isLost = (selectedItem.type || 'lost') === 'lost';
  badge.innerText = isLost ? 'LOST ITEM' : 'FOUND ITEM';
  badge.className = 'badge ' + (isLost ? 'badge-lost' : 'badge-found');

  const imgContainer = document.getElementById('modal-image-container');
  const imgElem = document.getElementById('modal-image');
  if (selectedItem.image_url) {
    imgElem.src = selectedItem.image_url;
    imgContainer.classList.remove('hidden');
  } else {
    imgContainer.classList.add('hidden');
  }
  document.getElementById('item-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('item-modal').classList.add('hidden');
}

/* ===================== CHATS ===================== */
function renderChatsList() {
  const container = document.getElementById('chats-list-container');
  if (!container) return;
  if (!activeChats.length) {
    container.innerHTML = `<p class="empty-state">No conversations yet.</p>`;
    return;
  }
  container.innerHTML = activeChats.map((chat, idx) => `
    <div onclick="auditChat(${idx})" class="glass item-card" style="margin-bottom:10px;">
      <h3 class="item-title">${escapeHtml(chat.itemTitle)}</h3>
      <p class="muted" style="font-size:10px;margin-top:4px;">${escapeHtml(chat.participants)}</p>
      <p style="font-size:9px;color:var(--gold);font-weight:600;margin-top:4px;">${chat.messages.length} messages</p>
    </div>`).join('');
}

function auditChat(index) {
  currentActiveChat = activeChats[index];
  switchScreen('chat');
  document.getElementById('chat-item-title').innerText = 'Chat: ' + currentActiveChat.itemTitle;
  renderChatMessages();
}

function openChatFromModal() {
  closeModal();
  let existingChat = activeChats.find(c => c.itemTitle === selectedItem.title);
  if (!existingChat) {
    existingChat = {
      id: 'chat_' + Date.now(),
      itemTitle: selectedItem.title,
      participants: `${currentUser.email} & ${selectedItem.contact_email || 'Finder'}`,
      messages: [
        { sender: 'System', text: `Secure channel opened for "${selectedItem.title}". Monitored by campus administration.` }
      ]
    };
    activeChats.push(existingChat);
  }
  currentActiveChat = existingChat;
  switchScreen('chat');
  document.getElementById('chat-item-title').innerText = 'Chat: ' + selectedItem.title;
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container || !currentActiveChat) return;
  container.innerHTML = currentActiveChat.messages.map(m => {
    let cls = 'msg-them';
    if (m.sender === 'System') cls = 'msg-system';
    else if (currentUser && m.sender === currentUser.email) cls = 'msg-me';
    return `
      <div class="msg ${cls}">
        ${m.sender !== 'System' ? `<div style="font-size:9px;opacity:.7;margin-bottom:2px;">${escapeHtml(m.sender)}</div>` : ''}
        <div>${escapeHtml(m.text)}</div>
      </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const val = input.value.trim();
  if (!val || !currentActiveChat) return;
  currentActiveChat.messages.push({ sender: currentUser.email, text: val });
  input.value = '';
  renderChatMessages();
}

/* ===================== UTIL ===================== */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
  buildShell();
  switchScreen('auth');
});