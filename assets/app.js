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
let activeChats = [];
let chatLoading = false;

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

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div class="eyebrow">Encrypted-style campus channels</div>
          <h2 class="section-title" style="margin-top:4px;margin-bottom:0;">
            Secure Conversations
          </h2>
        </div>

        <div class="chat-live-indicator">
          <span></span>
          SYNCED
        </div>
      </div>

      <div
        id="chats-list-container"
      >
        <div class="chat-loading glass">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          Loading conversations...
        </div>
      </div>

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
    errorEl.innerText = 'Incorrect password get out of here';
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

/* ===================== REAL MATCHING ENGINE ===================== */

const MATCH_CONFIG = {
  minimumScore: 42,
  maximumResults: 5,

  weights: {
    category: 30,
    campus: 20,
    keywords: 50
  },

  stopWords: new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at',
    'for', 'with', 'is', 'was', 'were', 'has', 'have', 'had',
    'my', 'this', 'that', 'it', 'from', 'near', 'found', 'lost',
    'item', 'please', 'very', 'some', 'also', 'there', 'then',
    'campus', 'bits', 'pilani'
  ])
};

/**
 * Converts text into meaningful searchable keywords.
 */
function tokenizeMatchText(text) {
  if (!text) return [];

  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word =>
      word.length >= 3 &&
      !MATCH_CONFIG.stopWords.has(word)
    );
}

/**
 * Gives extra importance to distinctive words.
 */
function getUniqueKeywords(item) {
  const text = [
    item.title || '',
    item.description || '',
    item.location || ''
  ].join(' ');

  return [...new Set(tokenizeMatchText(text))];
}

/**
 * Calculates keyword similarity using Jaccard-style overlap.
 */
function calculateKeywordScore(lostItem, foundItem) {
  const lostKeywords = new Set(getUniqueKeywords(lostItem));
  const foundKeywords = new Set(getUniqueKeywords(foundItem));

  if (!lostKeywords.size || !foundKeywords.size) {
    return {
      score: 0,
      sharedKeywords: []
    };
  }

  const sharedKeywords = [...lostKeywords].filter(word =>
    foundKeywords.has(word)
  );

  if (!sharedKeywords.length) {
    return {
      score: 0,
      sharedKeywords: []
    };
  }

  const union = new Set([
    ...lostKeywords,
    ...foundKeywords
  ]);

  const similarity = sharedKeywords.length / union.size;

  return {
    score: similarity * MATCH_CONFIG.weights.keywords,
    sharedKeywords
  };
}

/**
 * Calculates the complete match score.
 */
function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  const lostCategory = String(lostItem.category || '').toLowerCase().trim();
  const foundCategory = String(foundItem.category || '').toLowerCase().trim();

  const lostCampus = String(lostItem.campus || '').toLowerCase().trim();
  const foundCampus = String(foundItem.campus || '').toLowerCase().trim();

  // Category match
  if (
    lostCategory &&
    foundCategory &&
    lostCategory === foundCategory
  ) {
    score += MATCH_CONFIG.weights.category;
    reasons.push('Same category');
  }

  // Campus match
  if (
    lostCampus &&
    foundCampus &&
    lostCampus === foundCampus
  ) {
    score += MATCH_CONFIG.weights.campus;
    reasons.push('Same campus');
  }

  // Keyword match
  const keywordResult = calculateKeywordScore(
    lostItem,
    foundItem
  );

  score += keywordResult.score;

  if (keywordResult.sharedKeywords.length) {
    reasons.push(
      `${keywordResult.sharedKeywords.length} matching keyword${
        keywordResult.sharedKeywords.length === 1 ? '' : 's'
      }`
    );
  }

  return {
    score: Math.round(score),
    reasons,
    sharedKeywords: keywordResult.sharedKeywords
  };
}

/**
 * Finds potential found-item matches for a newly created lost item.
 */
async function findPossibleMatches(lostItem) {
  if (!supabaseClient || !lostItem) {
    return [];
  }

  try {
    const response = await supabaseClient
      .from('items')
      .select('*')
      .eq('type', 'found')
      .eq('status', 'active')
      .limit(100);

    if (response.error) {
      console.error(
        'Matching engine query error:',
        response.error
      );

      return [];
    }

    const foundItems = response.data || [];

    const scoredMatches = foundItems
      .map(foundItem => {
        const result = calculateMatchScore(
          lostItem,
          foundItem
        );

        return {
          item: foundItem,
          ...result
        };
      })
      .filter(match =>
        match.score >= MATCH_CONFIG.minimumScore
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MATCH_CONFIG.maximumResults);

    return scoredMatches;

  } catch (error) {
    console.error(
      'Matching engine exception:',
      error
    );

    return [];
  }
}

/**
 * Displays the post-confirmation matching screen.
 */
function showMatchConfirmation(lostItem, matches) {
  const root = document.getElementById('screen-root');

  if (!root) return;

  root.className = 'screen-root screen-view';

  const matchCount = matches.length;

  root.innerHTML = `
    <div class="match-success-shell">

      <div class="match-success-icon">
        <i class="fa-solid fa-check"></i>
      </div>

      <div class="eyebrow">Listing Published</div>

      <h2 class="match-success-title">
        ${matchCount
          ? 'We found possible matches.'
          : 'Your lost item is now live.'}
      </h2>

      <p class="match-success-subtitle">
        ${
          matchCount
            ? `Our matching engine compared your lost item against active found reports on campus.`
            : `No strong matches were detected yet. We'll keep your listing available for other students to find.`
        }
      </p>

      ${
        matchCount
          ? `
            <div class="match-detection-banner glass">
              <div class="match-banner-icon">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>

              <div>
                <strong>${matchCount} possible match${
                  matchCount === 1 ? '' : 'es'
                } detected</strong>

                <span>
                  Ranked using category, campus and keyword similarity.
                </span>
              </div>
            </div>

            <div class="possible-match-list">
              ${matches.map((match, index) =>
                renderPossibleMatch(match, index)
              ).join('')}
            </div>
          `
          : `
            <div class="no-match-card glass">
              <div class="no-match-icon">
                <i class="fa-solid fa-radar"></i>
              </div>

              <h3>No strong matches yet</h3>

              <p>
                Don't worry. Your listing remains searchable and can still
                match with a future found-item report.
              </p>
            </div>
          `
      }

      <div class="match-action-row">
        <button
          class="btn btn-primary"
          onclick="viewPublishedListing()"
        >
          <i class="fa-solid fa-eye"></i>
          View Your Live Listing
        </button>

        <button
          class="btn btn-ghost"
          onclick="switchScreen('home')"
        >
          <i class="fa-solid fa-compass"></i>
          Browse All Listings
        </button>

        <button
          class="btn btn-ghost"
          onclick="switchScreen('report')"
        >
          <i class="fa-solid fa-plus"></i>
          Report Another Item
        </button>

      </div>

    </div>
  `;
}

function viewPublishedListing() {
  if (!lastPublishedItem) {
    switchScreen('home');
    return;
  }

  selectedItem = lastPublishedItem;
  document.getElementById('modal-title').innerText = selectedItem.title || 'Item';
  document.getElementById('modal-location').innerText =
    `${selectedItem.location || ''} (${selectedItem.campus || 'Pilani'})`;
  document.getElementById('modal-desc').innerText = selectedItem.description || '';
  document.getElementById('modal-contact').innerText =
    selectedItem.contact_email || 'Verified BITSian';

  const isLost = selectedItem.type === 'lost';
  const badge = document.getElementById('modal-type-badge');
  badge.innerText = isLost ? 'LOST ITEM' : 'FOUND ITEM';
  badge.className = `badge ${isLost ? 'badge-lost' : 'badge-found'}`;

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

/**
 * Renders one possible match.
 */
function renderPossibleMatch(match, index) {
  const item = match.item;

  const safeTitle = escapeHtml(
    item.title || 'Found Item'
  );

  const safeDescription = escapeHtml(
    item.description || 'No description provided.'
  );

  const safeLocation = escapeHtml(
    item.location || 'Unknown location'
  );

  const safeCampus = escapeHtml(
    item.campus || 'Unknown campus'
  );

  const score = Math.min(
    99,
    Math.max(0, match.score)
  );

  const image = item.image_url
    ? `
      <img
        src="${escapeHtml(item.image_url)}"
        alt="${safeTitle}"
        class="possible-match-image"
      >
    `
    : `
      <div class="possible-match-image-placeholder">
        <i class="fa-solid fa-box-open"></i>
      </div>
    `;

  const reasons = match.reasons.length
    ? match.reasons.map(reason => `
        <span class="match-reason">
          <i class="fa-solid fa-check"></i>
          ${escapeHtml(reason)}
        </span>
      `).join('')
    : '';

  return `
    <div
      class="glass possible-match-card"
      onclick="openMatchedItem(${index})"
      data-match-index="${index}"
    >

      <div class="match-card-image">
        ${image}

        <div class="match-score">
          <span>${score}%</span>
          <small>MATCH</small>
        </div>
      </div>

      <div class="possible-match-content">

        <div class="possible-match-top">
          <div>
            <div class="eyebrow">
              Possible Match #${index + 1}
            </div>

            <h3>
              ${safeTitle}
            </h3>
          </div>

          <span class="badge badge-found">
            FOUND
          </span>
        </div>

        <p class="possible-match-description">
          ${safeDescription}
        </p>

        <div class="possible-match-location">
          <i class="fa-solid fa-location-dot"></i>
          ${safeLocation}
          <span>•</span>
          ${safeCampus}
        </div>

        <div class="match-reasons">
          ${reasons}
        </div>

        <button
          class="btn btn-cyan match-view-btn"
          onclick="event.stopPropagation(); openMatchedItem(${index})"
        >
          View Possible Match
          <i class="fa-solid fa-arrow-right"></i>
        </button>

      </div>

    </div>
  `;
}

/**
 * Holds the matches currently displayed on the confirmation screen.
 */
let currentPossibleMatches = [];
let lastPublishedItem = null;

/**
 * Opens a matched found item using the existing item modal.
 */
function openMatchedItem(index) {
  const match = currentPossibleMatches[index];

  if (!match || !match.item) return;

  selectedItem = match.item;

  document.getElementById('modal-title').innerText =
    selectedItem.title || 'Found Item';

  document.getElementById('modal-location').innerText =
    `${selectedItem.location || ''} (${selectedItem.campus || 'Pilani'})`;

  document.getElementById('modal-desc').innerText =
    selectedItem.description || '';

  document.getElementById('modal-contact').innerText =
    selectedItem.contact_email || 'Verified BITSian';

  const badge =
    document.getElementById('modal-type-badge');

  badge.innerText = 'FOUND ITEM';
  badge.className = 'badge badge-found';

  const imgContainer =
    document.getElementById('modal-image-container');

  const imgElem =
    document.getElementById('modal-image');

  if (selectedItem.image_url) {
    imgElem.src = selectedItem.image_url;
    imgContainer.classList.remove('hidden');
  } else {
    imgContainer.classList.add('hidden');
  }

  document
    .getElementById('item-modal')
    .classList.remove('hidden');
}

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

  if (!submitBtn) return;

  submitBtn.innerText = 'Publishing...';
  submitBtn.disabled = true;

  const newItem = {
    title: document.getElementById('report-title').value.trim(),
    location: document.getElementById('report-location').value.trim(),
    description: document.getElementById('report-desc').value.trim(),
    category: document.getElementById('report-category').value,
    campus: document.getElementById('report-campus').value.trim(),
    image_url: imageUrl,
    type: currentStatusType,
    status: 'active',
    contact_email: currentUser
      ? currentUser.email
      : 'student@bits-pilani.ac.in'
  };

  try {
    if (!supabaseClient) {
      toast(
        'Supabase client is not initialized.',
        'error'
      );

      submitBtn.innerText = 'Publish Listing';
      submitBtn.disabled = false;
      return;
    }

    const response = await supabaseClient
      .from('items')
      .insert([newItem])
      .select()
      .single();

    if (response.error) {
      console.error(
        'Supabase Insert Error:',
        response.error
      );

      toast(
        'Failed to publish listing: ' +
        response.error.message,
        'error'
      );

      submitBtn.innerText = 'Publish Listing';
      submitBtn.disabled = false;
      return;
    }

    const createdItem = response.data;

    toast(
      'Listing published successfully!',
      'success'
    );

    /*
     * Only LOST items enter the matching engine.
     * FOUND items simply go back to the feed.
     */
    if (createdItem.type !== 'lost') {
      allItemsCache.unshift(createdItem);

      submitBtn.innerText = 'Publish Listing';
      submitBtn.disabled = false;

      switchScreen('home');
      return;
    }

    /*
     * Search existing FOUND listings.
     */
    submitBtn.innerText = 'Scanning for matches...';

    const matches = await findPossibleMatches(
      createdItem
    );

    /*
     * Save matches globally so the confirmation
     * screen can open the existing item modal.
     */
    currentPossibleMatches = matches;
    lastPublishedItem = createdItem;

    /*
     * Keep local cache synchronized.
     */
    allItemsCache.unshift(createdItem);

    /*
     * Show intelligent matching results.
     */
    showMatchConfirmation(
      createdItem,
      matches
    );

  } catch (error) {

    console.error(
      'Exception during item publishing:',
      error
    );

    toast(
      'An unexpected error occurred while publishing.',
      'error'
    );

    submitBtn.innerText = 'Publish Listing';
    submitBtn.disabled = false;
  }
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

async function renderAdminChats() {

  const container =
    document.getElementById(
      'admin-chats-list'
    );

  if (!container) return;

  container.innerHTML = `
    <div class="chat-loading glass">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      Loading persistent chat audit...
    </div>
  `;

  try {

    if (!supabaseClient) {
      throw new Error(
        'Supabase client unavailable'
      );
    }

    /*
     * Admin gets the complete message stream.
     */
    const response =
      await supabaseClient
        .from('messages')
        .select(`
          id,
          item_id,
          sender_email,
          message,
          created_at,
          items (
            id,
            title,
            contact_email
          )
        `)
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (response.error) {
      throw response.error;
    }

    const messages =
      response.data || [];

    if (!messages.length) {

      container.innerHTML = `
        <p class="empty-state">
          No persistent conversations yet.
        </p>
      `;

      return;
    }

    /*
     * Group messages by item.
     */
    const grouped = {};

    messages.forEach(message => {

      const itemId =
        message.item_id;

      if (!grouped[itemId]) {

        grouped[itemId] = {
          itemId,
          itemTitle:
            message.items?.title ||
            'Unknown Item',
          participants:
            new Set(),
          messages: []
        };
      }

      grouped[itemId]
        .participants
        .add(message.sender_email);

      grouped[itemId]
        .messages
        .push(message);
    });

    const conversations =
      Object.values(grouped);

    container.innerHTML =
      conversations
        .map((chat, index) => {

          const latest =
            chat.messages[0];

          return `
            <div
              class="persistent-admin-chat"
            >

              <div
                class="persistent-chat-icon"
              >
                <i class="fa-solid fa-message"></i>
              </div>

              <div
                class="persistent-chat-main"
              >

                <div
                  class="persistent-chat-top"
                >
                  <h3>
                    ${escapeHtml(
                      chat.itemTitle
                    )}
                  </h3>

                  <span>
                    ${formatChatTime(
                      latest.created_at
                    )}
                  </span>
                </div>

                <p>
                  ${escapeHtml(
                    latest.message
                  )}
                </p>

                <div
                  class="persistent-chat-meta"
                >
                  <i
                    class="fa-solid fa-users"
                  ></i>

                  ${
                    chat.participants.size
                  }
                  participant${
                    chat.participants.size === 1
                      ? ''
                      : 's'
                  }

                  •

                  ${
                    chat.messages.length
                  }
                  message${
                    chat.messages.length === 1
                      ? ''
                      : 's'
                  }
                </div>

              </div>

              <button
                onclick="adminOpenPersistentChat(${index})"
                class="btn btn-cyan btn-sm"
              >
                Audit
              </button>

            </div>
          `;
        })
        .join('');

    /*
     * Keep the complete conversations available
     * for the audit button.
     */
    window.adminChatAuditData =
      conversations;

  } catch (error) {

    console.error(
      'Admin chat audit error:',
      error
    );

    container.innerHTML = `
      <p class="empty-state">
        Could not load chat audit data.
      </p>
    `;
  }
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
/* ===================== PERSISTENT CHAT ENGINE ===================== */

/**
 * Loads all conversations belonging to the current user.
 *
 * A conversation is represented by an item.
 * Messages are stored permanently in Supabase.
 */
async function loadUserChats() {
  if (!currentUser || !supabaseClient) {
    activeChats = [];
    return;
  }

  try {
    chatLoading = true;

    /*
     * Find messages sent by the current user.
     * We use these item IDs to discover conversations.
     */
    const ownMessagesResponse = await supabaseClient
      .from('messages')
      .select('item_id')
      .eq('sender_email', currentUser.email);

    if (ownMessagesResponse.error) {
      console.error(
        'Could not load user conversations:',
        ownMessagesResponse.error
      );

      activeChats = [];
      return;
    }

    const ownItemIds = [
      ...new Set(
        (ownMessagesResponse.data || [])
          .map(row => row.item_id)
          .filter(Boolean)
      )
    ];

    /*
     * If the current user has no messages yet,
     * there are no persisted conversations to display.
     */
    if (!ownItemIds.length) {
      activeChats = [];
      return;
    }

    /*
     * Fetch the corresponding items.
     */
    const itemsResponse = await supabaseClient
      .from('items')
      .select('*')
      .in('id', ownItemIds);

    if (itemsResponse.error) {
      console.error(
        'Could not load chat items:',
        itemsResponse.error
      );

      activeChats = [];
      return;
    }

    /*
     * Build each conversation from its item.
     */
    const chats = [];

    for (const item of itemsResponse.data || []) {

      const messagesResponse = await supabaseClient
        .from('messages')
        .select('*')
        .eq('item_id', item.id)
        .order('created_at', {
          ascending: true
        });

      if (messagesResponse.error) {
        console.error(
          `Could not load messages for item ${item.id}:`,
          messagesResponse.error
        );

        continue;
      }

      const messages = messagesResponse.data || [];

      const participants = [
        ...new Set(
          messages
            .map(message => message.sender_email)
            .filter(Boolean)
        )
      ];

      /*
       * Add the item's reporter as a participant too.
       */
      if (
        item.contact_email &&
        !participants.includes(item.contact_email)
      ) {
        participants.push(item.contact_email);
      }

      chats.push({
        id: `chat_${item.id}`,
        itemId: item.id,
        itemTitle: item.title || 'Item',
        participants: participants.join(' & '),
        messages
      });
    }

    activeChats = chats;

  } catch (error) {

    console.error(
      'Persistent chat loading error:',
      error
    );

    activeChats = [];

  } finally {
    chatLoading = false;
  }
}

/**
 * Loads one conversation directly from Supabase.
 */
async function loadChatForItem(itemId) {
  if (!supabaseClient || !itemId) {
    return null;
  }

  try {

    const itemResponse = await supabaseClient
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemResponse.error) {
      console.error(
        'Could not load chat item:',
        itemResponse.error
      );

      return null;
    }

    const messagesResponse = await supabaseClient
      .from('messages')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', {
        ascending: true
      });

    if (messagesResponse.error) {
      console.error(
        'Could not load chat messages:',
        messagesResponse.error
      );

      return null;
    }

    const messages = messagesResponse.data || [];

    const participants = [
      ...new Set(
        messages
          .map(message => message.sender_email)
          .filter(Boolean)
      )
    ];

    if (
      itemResponse.data.contact_email &&
      !participants.includes(itemResponse.data.contact_email)
    ) {
      participants.push(
        itemResponse.data.contact_email
      );
    }

    return {
      id: `chat_${itemId}`,
      itemId,
      itemTitle: itemResponse.data.title || 'Item',
      participants: participants.join(' & '),
      messages
    };

  } catch (error) {

    console.error(
      'Chat loading exception:',
      error
    );

    return null;
  }
}

/**
 * Opens or creates a persistent conversation.
 */
async function openPersistentChat(item) {

  if (!currentUser || !item || !item.id) {
    toast(
      'Unable to open this conversation.',
      'error'
    );

    return;
  }

  currentActiveChat = await loadChatForItem(
    item.id
  );

  /*
   * The chat does not need a separate database row.
   * The item itself identifies the conversation.
   */
  if (!currentActiveChat) {

    currentActiveChat = {
      id: `chat_${item.id}`,
      itemId: item.id,
      itemTitle: item.title || 'Item',
      participants: [
        currentUser.email,
        item.contact_email || 'Verified BITSian'
      ].join(' & '),
      messages: []
    };
  }

  /*
   * Add to local cache if not already present.
   */
  const existingIndex = activeChats.findIndex(
    chat => chat.itemId === item.id
  );

  if (existingIndex >= 0) {
    activeChats[existingIndex] =
      currentActiveChat;
  } else {
    activeChats.unshift(
      currentActiveChat
    );
  }

  switchScreen('chat');

  const titleElement =
    document.getElementById('chat-item-title');

  if (titleElement) {
    titleElement.innerText =
      'Chat: ' +
      currentActiveChat.itemTitle;
  }

  renderChatMessages();
}

/**
 * Persists a message in Supabase.
 */
async function sendPersistentMessage() {

  const input =
    document.getElementById('chat-input');

  if (
    !input ||
    !currentActiveChat ||
    !currentUser
  ) {
    return;
  }

  const text = input.value.trim();

  if (!text) {
    return;
  }

  if (!currentActiveChat.itemId) {
    toast(
      'This conversation is missing its item.',
      'error'
    );

    return;
  }

  const sendButton =
    document.querySelector(
      '.chat-input-row button'
    );

  if (sendButton) {
    sendButton.disabled = true;
    sendButton.innerText = 'Sending...';
  }

  try {

    const response = await supabaseClient
      .from('messages')
      .insert([{
        item_id: currentActiveChat.itemId,
        sender_email: currentUser.email,
        message: text
      }])
      .select()
      .single();

    if (response.error) {

      console.error(
        'Message insert error:',
        response.error
      );

      toast(
        'Message could not be sent.',
        'error'
      );

      return;
    }

    /*
     * Add the database-generated message to the
     * current UI immediately.
     */
    currentActiveChat.messages.push(
      response.data
    );

    input.value = '';

    renderChatMessages();

    /*
     * Keep the local conversation cache synchronized.
     */
    const index = activeChats.findIndex(
      chat =>
        chat.itemId ===
        currentActiveChat.itemId
    );

    if (index >= 0) {
      activeChats[index] =
        currentActiveChat;
    }

  } catch (error) {

    console.error(
      'Persistent message exception:',
      error
    );

    toast(
      'Could not send message.',
      'error'
    );

  } finally {

    if (sendButton) {
      sendButton.disabled = false;
      sendButton.innerText = 'Send';
    }
  }
}
/* ===================== CHATS ===================== */
async function renderChatsList() {

  const container = document.getElementById(
      'chats-list-container'
    );

  if (!container) return;

  container.innerHTML = `
    <div class="chat-loading glass">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      Synchronizing with Supabase...
    </div>
  `;

  await loadUserChats();

  if (!container) return;

  if (!activeChats.length) {

    container.innerHTML = `
      <div class="empty-chat-state glass">

        <div class="empty-chat-icon">
          <i class="fa-solid fa-comments"></i>
        </div>

        <h3>No conversations yet</h3>

        <p>
          Open a listing and start a secure conversation.
          Your messages will remain available after refreshing
          or reopening the app.
        </p>

        <button
          onclick="switchScreen('home')"
          class="btn btn-primary"
          style="margin-top:14px;"
        >
          Browse Listings
        </button>

      </div>
    `;

    return;
  }

  container.innerHTML =
    activeChats.map((chat, index) => {

      const lastMessage =
        chat.messages &&
        chat.messages.length
          ? chat.messages[
              chat.messages.length - 1
            ]
          : null;

      const preview =
        lastMessage
          ? lastMessage.message
          : 'Conversation opened';

      const time =
        lastMessage &&
        lastMessage.created_at
          ? formatChatTime(
              lastMessage.created_at
            )
          : '';

      return `
        <div
          onclick="openChatFromList(${index})"
          class="glass persistent-chat-card"
        >

          <div class="persistent-chat-icon">
            <i class="fa-solid fa-shield-halved"></i>
          </div>

          <div class="persistent-chat-main">

            <div class="persistent-chat-top">
              <h3>
                ${escapeHtml(chat.itemTitle)}
              </h3>

              <span>
                ${escapeHtml(time)}
              </span>
            </div>

            <p>
              ${escapeHtml(preview)}
            </p>

            <div class="persistent-chat-meta">
              <i class="fa-solid fa-user-group"></i>
              ${escapeHtml(chat.participants)}
            </div>

          </div>

          <i class="fa-solid fa-chevron-right chat-arrow"></i>

        </div>
      `;
    }).join('');
}

async function openChatFromList(index) {

  const chat = activeChats[index];

  if (!chat || !chat.itemId) {
    toast(
      'Conversation could not be opened.',
      'error'
    );

    return;
  }

  const refreshedChat =
    await loadChatForItem(
      chat.itemId
    );

  if (refreshedChat) {
    currentActiveChat =
      refreshedChat;
  } else {
    currentActiveChat =
      chat;
  }

  switchScreen('chat');

  const titleElement =
    document.getElementById(
      'chat-item-title'
    );

  if (titleElement) {
    titleElement.innerText =
      'Chat: ' +
      currentActiveChat.itemTitle;
  }

  renderChatMessages();
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
