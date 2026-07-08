// Static server + tiny JSON API for saved shows (one file per show under ./shows).
// Absolute paths only (no process.cwd) to avoid sandbox getcwd restrictions.
// Auth: signed session cookie (stateless). Users live in ./users.json (managed
// via users.js). Shows carry an `owner` userId and optional `collaborators`.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8090;
// Live show data lives OUTSIDE the repo so `git pull` never collides with it.
// Override with SHOWS_DIR (e.g. a data dir beside the repo on the server);
// defaults to ./shows for local dev. This dir is gitignored.
const SHOWS_DIR = process.env.SHOWS_DIR || path.join(ROOT, 'shows');
// Layer 2: when USE_REMOTE_DATA=true, /api/shows and /api/users are proxied to
// the production server instead of reading local files. Local auth still gates
// access (you must be logged into your local server). REMOTE_TOKEN is the
// md_session cookie value from your prod browser session (DevTools → Application
// → Cookies). Default off so local dev uses its own sandbox data.
const USE_REMOTE = process.env.USE_REMOTE_DATA === 'true';
const REMOTE_URL = (process.env.REMOTE_URL || 'https://musicaldesigner.colincreates.com').replace(/\/$/, '');
const REMOTE_TOKEN = process.env.REMOTE_TOKEN || '';
const SEED_DIR = path.join(ROOT, 'seed-shows');
const USERS_FILE = path.join(ROOT, 'users.json');
const SECRET_FILE = path.join(ROOT, 'secret.txt');
const INVITES_FILE = path.join(ROOT, 'invites.json');
try { fs.mkdirSync(SHOWS_DIR, { recursive: true }); } catch (e) { /* exists */ }
// Whole-show version history. Kept in a sibling dir (not SHOWS_DIR) so the show
// list endpoint, which scans every *.json in SHOWS_DIR, never trips over them.
const SNAPS_DIR = process.env.SNAPS_DIR || path.join(ROOT, 'snapshots');
try { fs.mkdirSync(SNAPS_DIR, { recursive: true }); } catch (e) { /* exists */ }

// Seed example shows into the data dir on first run. Never overwrites an
// existing file, so live edits are always preserved across restarts/deploys.
try {
  for (const f of fs.readdirSync(SEED_DIR)) {
    if (!f.endsWith('.json')) continue;
    const dest = path.join(SHOWS_DIR, f);
    if (!fs.existsSync(dest)) fs.copyFileSync(path.join(SEED_DIR, f), dest);
  }
} catch (_) { /* no seed dir — fine */ }

// Server secret for signing session cookies — auto-generated once, then reused
// so sessions survive restarts.
let SECRET = '';
try { SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim(); } catch (_) { /* none yet */ }
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex');
  try { fs.writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 }); } catch (_) { /* best effort */ }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function safeId(id) { return /^[a-z0-9-]+$/.test(id || '') ? id : null; }
// Shows are tens of KB even for a full novel; cap well above that so a stray
// or hostile huge body can't exhaust memory/disk on this box (458MB RAM).
const MAX_BODY_BYTES = 10 * 1024 * 1024;
function readBody(req, res, cb) {
  let b = ''; let bytes = 0; let killed = false;
  req.on('data', (c) => {
    if (killed) return;
    bytes += c.length;
    if (bytes > MAX_BODY_BYTES) { killed = true; sendJSON(res, 413, { error: 'payload too large' }); req.destroy(); return; }
    b += c;
  });
  req.on('end', () => { if (!killed) cb(b); });
}
// Write-then-rename so a crash or full disk mid-write can never leave a show
// file truncated/corrupt — rename is atomic on the same filesystem.
function writeFileAtomic(fp, data) {
  const tmp = fp + '.tmp-' + process.pid + '-' + Date.now();
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, fp);
}
function fileFor(id) { return path.join(SHOWS_DIR, id + '.json'); }
function snapFileFor(id) { return path.join(SNAPS_DIR, id + '.json'); }
function loadSnaps(id) {
  let d;
  try { d = JSON.parse(fs.readFileSync(snapFileFor(id), 'utf8')); } catch (_) { d = {}; }
  if (!Array.isArray(d.snapshots)) d.snapshots = [];
  if (!Array.isArray(d.auto)) d.auto = []; // separate, smaller-capped pool for automatic checkpoints
  return d;
}
function saveSnaps(id, obj) { writeFileAtomic(snapFileFor(id), JSON.stringify(obj)); }

// Automatic checkpoints: a lightweight safety net (a collaborator or a slip
// of your own can overwrite content; manual snapshots only help if you
// remembered to take one first). Time-gated rather than per-save, since
// scheduleSave() can fire every ~1s during active typing — snapshotting that
// often would blow through the cap in minutes and lose the point of having
// history spread over a useful span of time. Capped separately from manual
// snapshots so autosaves can never crowd out ones you took on purpose.
const AUTO_SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000; // at most one every 15 min
const AUTO_SNAPSHOT_CAP = 15;
function maybeAutoSnapshot(sid, previousData) {
  const store = loadSnaps(sid);
  const last = store.auto[0];
  if (last && Date.now() - last.ts < AUTO_SNAPSHOT_INTERVAL_MS) return;
  store.auto.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: Date.now(), data: previousData });
  if (store.auto.length > AUTO_SNAPSHOT_CAP) store.auto.length = AUTO_SNAPSHOT_CAP;
  try { saveSnaps(sid, store); } catch (_) { /* best effort — never block a save over this */ }
}
// Locates a snapshot by id across both the manual and automatic pools.
function findSnap(store, snapId) {
  let idx = store.snapshots.findIndex((s) => s.id === snapId);
  if (idx >= 0) return { list: store.snapshots, idx, kind: 'manual' };
  idx = store.auto.findIndex((s) => s.id === snapId);
  if (idx >= 0) return { list: store.auto, idx, kind: 'auto' };
  return null;
}

// ---- Auth helpers --------------------------------------------------------
function loadUsers() { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (_) { return []; } }
function saveUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 }); }
function loadInvites() { try { return JSON.parse(fs.readFileSync(INVITES_FILE, 'utf8')); } catch (_) { return []; } }
function saveInvites(invites) { try { fs.writeFileSync(INVITES_FILE, JSON.stringify(invites), { mode: 0o600 }); } catch (_) { /* best effort */ } }
function slugName(name) { return String(name).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''); }
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return salt + ':' + h;
}

function verifyPassword(user, password) {
  const [salt, hash] = (user.pass || '').split(':');
  if (!salt || !hash) return false;
  let test;
  try { test = crypto.scryptSync(String(password), salt, 32).toString('hex'); } catch (_) { return false; }
  const a = Buffer.from(hash, 'hex'); const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Invite/reset links: opaque single-use tokens stored server-side (not signed
// like session tokens — the token itself IS the secret, like a password-reset
// email link). type 'invite' creates a brand-new account; type 'reset' resets
// an existing account's password (forUserId set). Admin-only to create.
function validateInvite(inv) {
  if (!inv) return { ok: false, reason: 'This invite link is not valid.' };
  if (inv.revoked) return { ok: false, reason: 'This invite link was revoked.' };
  if (inv.usedAt) return { ok: false, reason: 'This invite link was already used.' };
  if (inv.expiresAt && Date.now() > inv.expiresAt) return { ok: false, reason: 'This invite link has expired.' };
  return { ok: true };
}
function joinUrl(req, token) {
  const proto = req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http');
  return proto + '://' + (req.headers.host || '') + '/join.html?t=' + token;
}

// Song Plot and Prose Plot are served from sibling subdomains of the same
// registrable domain (e.g. songplot.X / proseplot.X); COOKIE_DOMAIN widens
// md_session to that shared parent so logging in on one keeps you logged
// into the other. Empty (host-only cookie) unless set, so local/single-host
// deploys are unaffected.
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

// ---- Per-subdomain app branding -------------------------------------------
// Which app a request is for is derived purely from the Host header — no new
// data model, same shared SHOWS_DIR/API either way (shows are already
// partitioned by their own `format` field).
const BRANDS = {
  song: {
    title: 'Song Plot — Musical Designer', shortName: 'Song Plot',
    description: 'Plot songs and beats for your musical.',
    themeColor: '#3a3475', bg: '#3a3475',
  },
  prose: {
    title: 'Prose Plot — Novel Designer', shortName: 'Prose Plot',
    description: 'Plot chapters and scenes for your novel.',
    themeColor: '#dd6349', bg: '#dd6349',
  },
};
function brandFor(req) {
  const host = String((req.headers.host || '')).split(':')[0].toLowerCase();
  return host.startsWith('proseplot.') ? BRANDS.prose : BRANDS.song;
}

function sign(val) { return crypto.createHmac('sha256', SECRET).update(val).digest('hex'); }
function makeToken(userId) { return userId + '.' + sign(userId); }
function parseToken(tok) {
  if (!tok) return null;
  const i = tok.lastIndexOf('.');
  if (i < 0) return null;
  const id = tok.slice(0, i); const sig = tok.slice(i + 1);
  const expect = sign(id);
  const a = Buffer.from(sig); const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
function currentUser(req) {
  const id = parseToken(cookies(req).md_session);
  if (!id) return null;
  const u = loadUsers().find((u) => u.id === id) || null;
  if (u && u.disabled) return null; // disabled accounts are logged out immediately, even with a valid cookie
  return u;
}
function canAccess(show, user) {
  if (!show || !user) return false;
  if (!show.owner) return true; // legacy show, not yet claimed
  return show.owner === user.id || (show.collaborators || []).indexOf(user.id) >= 0;
}

// ---- Auth endpoints ------------------------------------------------------
function handleAuth(req, res, parts) {
  const action = parts[1]; // login | logout | me
  if (action === 'me' && req.method === 'GET') {
    const u = currentUser(req);
    if (!u) return sendJSON(res, 401, { error: 'unauth' });
    return sendJSON(res, 200, { id: u.id, name: u.name, admin: !!u.admin });
  }
  if (action === 'login' && req.method === 'POST') {
    return readBody(req, res, (body) => {
      let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
      const name = String(data.name || '').trim().toLowerCase();
      const users = loadUsers();
      const user = users.find((u) => u.id === name || (u.name || '').toLowerCase() === name);
      if (!user || !verifyPassword(user, data.password)) return sendJSON(res, 401, { error: 'bad credentials' });
      if (user.disabled) return sendJSON(res, 403, { error: 'account disabled' });
      user.lastLogin = Date.now();
      try { saveUsers(users); } catch (_) { /* best effort */ }
      const domainAttr = COOKIE_DOMAIN ? '; Domain=' + COOKIE_DOMAIN : '';
      const cookie = 'md_session=' + makeToken(user.id) + '; HttpOnly; SameSite=Lax; Path=/' + domainAttr + '; Max-Age=' + (60 * 60 * 24 * 90);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': cookie });
      res.end(JSON.stringify({ id: user.id, name: user.name }));
    });
  }
  if (action === 'logout' && req.method === 'POST') {
    const domainAttr = COOKIE_DOMAIN ? '; Domain=' + COOKIE_DOMAIN : '';
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': 'md_session=; HttpOnly; SameSite=Lax; Path=/' + domainAttr + '; Max-Age=0' });
    return res.end(JSON.stringify({ ok: true }));
  }
  return sendJSON(res, 404, { error: 'not found' });
}

// ---- Join / reset (public, token-gated — no account signup exists otherwise) ---
function handleJoin(req, res, parts) {
  if (req.method === 'GET' && parts[0]) {
    const inv = loadInvites().find((i) => i.token === parts[0]);
    const check = validateInvite(inv);
    if (!check.ok) return sendJSON(res, 410, { error: check.reason });
    const forUser = inv.type === 'reset' ? loadUsers().find((u) => u.id === inv.forUserId) : null;
    return sendJSON(res, 200, { type: inv.type, existingName: forUser ? forUser.name : null });
  }
  if (req.method === 'POST' && !parts[0]) {
    return readBody(req, res, (body) => {
      let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
      const invites = loadInvites();
      const inv = invites.find((i) => i.token === data.token);
      const check = validateInvite(inv);
      if (!check.ok) return sendJSON(res, 410, { error: check.reason });
      const password = String(data.password || '');
      if (password.length < 8) return sendJSON(res, 400, { error: 'Password must be at least 8 characters.' });
      const users = loadUsers();
      let user;
      if (inv.type === 'reset') {
        user = users.find((u) => u.id === inv.forUserId);
        if (!user) return sendJSON(res, 404, { error: 'That account no longer exists.' });
        user.pass = hashPassword(password);
      } else {
        const name = String(data.name || '').trim();
        const id = slugName(name);
        if (!name || !id) return sendJSON(res, 400, { error: 'Please enter a name.' });
        if (users.find((u) => u.id === id)) return sendJSON(res, 409, { error: 'That name is already taken.' });
        user = { id, name, pass: hashPassword(password), createdAt: Date.now() };
        users.push(user);
      }
      inv.usedAt = Date.now();
      inv.usedBy = user.id;
      try { saveUsers(users); saveInvites(invites); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      const domainAttr = COOKIE_DOMAIN ? '; Domain=' + COOKIE_DOMAIN : '';
      const cookie = 'md_session=' + makeToken(user.id) + '; HttpOnly; SameSite=Lax; Path=/' + domainAttr + '; Max-Age=' + (60 * 60 * 24 * 90);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': cookie });
      res.end(JSON.stringify({ id: user.id, name: user.name }));
    });
  }
  return sendJSON(res, 404, { error: 'not found' });
}

// ---- Admin (requires an account with admin:true) --------------------------
function handleAdmin(req, res, parts, adminUser) {
  const section = parts[0];
  if (section === 'users') {
    const uid = parts[1];
    if (req.method === 'GET' && !uid) {
      const users = loadUsers();
      const showCounts = {};
      try {
        fs.readdirSync(SHOWS_DIR).filter((f) => f.endsWith('.json')).forEach((f) => {
          try {
            const d = JSON.parse(fs.readFileSync(path.join(SHOWS_DIR, f), 'utf8'));
            if (d.owner) showCounts[d.owner] = (showCounts[d.owner] || 0) + 1;
          } catch (_) { /* skip */ }
        });
      } catch (_) { /* no shows dir */ }
      return sendJSON(res, 200, users.map((u) => ({
        id: u.id, name: u.name, admin: !!u.admin, disabled: !!u.disabled,
        createdAt: u.createdAt || null, lastLogin: u.lastLogin || null,
        showCount: showCounts[u.id] || 0,
      })));
    }
    if (uid && parts[2] === 'toggle-disabled' && req.method === 'POST') {
      const users = loadUsers();
      const u = users.find((x) => x.id === uid);
      if (!u) return sendJSON(res, 404, { error: 'not found' });
      if (u.id === adminUser.id) return sendJSON(res, 400, { error: "You can't disable your own account." });
      u.disabled = !u.disabled;
      try { saveUsers(users); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      return sendJSON(res, 200, { id: u.id, disabled: u.disabled });
    }
    if (uid && parts[2] === 'reset-link' && req.method === 'POST') {
      const users = loadUsers();
      const u = users.find((x) => x.id === uid);
      if (!u) return sendJSON(res, 404, { error: 'not found' });
      const invites = loadInvites();
      const token = crypto.randomBytes(24).toString('hex');
      const inv = {
        token, type: 'reset', forUserId: u.id, label: 'Password reset for ' + u.name,
        createdBy: adminUser.id, createdAt: Date.now(), expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
      };
      invites.push(inv);
      saveInvites(invites);
      return sendJSON(res, 200, { token, url: joinUrl(req, token), expiresAt: inv.expiresAt });
    }
    return sendJSON(res, 404, { error: 'not found' });
  }
  if (section === 'invites') {
    if (req.method === 'GET' && !parts[1]) {
      return sendJSON(res, 200, loadInvites().slice().reverse());
    }
    if (req.method === 'POST' && !parts[1]) {
      return readBody(req, res, (body) => {
        let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
        const invites = loadInvites();
        const token = crypto.randomBytes(24).toString('hex');
        const inv = {
          token, type: 'invite', forUserId: null, label: String(data.label || '').trim().slice(0, 120),
          createdBy: adminUser.id, createdAt: Date.now(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        invites.push(inv);
        saveInvites(invites);
        return sendJSON(res, 200, { token, url: joinUrl(req, token), expiresAt: inv.expiresAt });
      });
    }
    if (req.method === 'DELETE' && parts[1]) {
      const invites = loadInvites();
      const inv = invites.find((i) => i.token === parts[1]);
      if (inv) inv.revoked = true;
      saveInvites(invites);
      return sendJSON(res, 200, { ok: true });
    }
    return sendJSON(res, 405, { error: 'method' });
  }
  return sendJSON(res, 404, { error: 'not found' });
}

// ---- Shows API (auth required) -------------------------------------------
function handleApi(req, res, parts, user) {
  const id = parts[2];
  if (req.method === 'GET' && !id) {
    fs.readdir(SHOWS_DIR, (e, files) => {
      const list = [];
      (files || []).filter((f) => f.endsWith('.json')).forEach((f) => {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(SHOWS_DIR, f), 'utf8'));
          if (!canAccess(d, user)) return;
          list.push({
            id: f.replace(/\.json$/, ''), title: d.title || 'Untitled', updated: d.updated || 0,
            mode: d.mode || 'full', status: d.status || 'active', folder: d.folder || '', owner: d.owner || null,
            format: d.format || 'song',
            collaborators: d.collaborators || [], shared: !!(d.owner && d.owner !== user.id),
          });
        } catch (_) { /* skip */ }
      });
      list.sort((a, b) => b.updated - a.updated);
      sendJSON(res, 200, list);
    });
    return;
  }
  if (req.method === 'POST' && !id) {
    readBody(req, res, (body) => {
      let obj; try { obj = JSON.parse(body || '{}'); } catch (_) { obj = {}; }
      obj.owner = user.id; // stamp ownership on creation
      const newid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try { writeFileAtomic(fileFor(newid), JSON.stringify(obj)); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { id: newid });
    });
    return;
  }
  const sid = safeId(id);
  if (!sid) return sendJSON(res, 400, { error: 'bad id' });

  // Load existing show (if any) to enforce access on read/update/delete.
  let existing = null;
  try { existing = JSON.parse(fs.readFileSync(fileFor(sid), 'utf8')); } catch (_) { existing = null; }
  if (existing && !canAccess(existing, user)) return sendJSON(res, 403, { error: 'forbidden' });

  // Sub-action: PUT /api/shows/:id/share — owner sets the collaborator list.
  if (parts[3] === 'share') {
    if (req.method !== 'PUT') return sendJSON(res, 405, { error: 'method' });
    if (!existing) return sendJSON(res, 404, { error: 'not found' });
    if (existing.owner && existing.owner !== user.id) return sendJSON(res, 403, { error: 'owner only' });
    return readBody(req, res, (body) => {
      let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
      const ids = loadUsers().map((u) => u.id);
      existing.collaborators = (Array.isArray(data.collaborators) ? data.collaborators : [])
        .filter((cid) => cid !== user.id && ids.indexOf(cid) >= 0);
      try { writeFileAtomic(fileFor(sid), JSON.stringify(existing)); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { ok: true, collaborators: existing.collaborators });
    });
  }

  // Sub-action: /api/shows/:id/snapshots — whole-show version history.
  // Two pools: manual (capped 30, user-labeled) and auto (capped 15, written
  // by maybeAutoSnapshot on every save). GET (list metadata, both pools
  // tagged with kind) · POST (create manual) · GET/:snapId (full data) ·
  // PUT/:snapId (rename, manual only) · DELETE/:snapId (owner only).
  if (parts[3] === 'snapshots') {
    if (!existing) return sendJSON(res, 404, { error: 'not found' });
    const snapId = parts[4] ? safeId(parts[4]) : null;
    const store = loadSnaps(sid);
    const meta = (s, kind) => ({ id: s.id, label: s.label || '', ts: s.ts, kind });

    if (req.method === 'GET' && !snapId) {
      const list = store.snapshots.map((s) => meta(s, 'manual')).concat(store.auto.map((s) => meta(s, 'auto')));
      list.sort((a, b) => b.ts - a.ts);
      return sendJSON(res, 200, list);
    }
    if (req.method === 'GET' && snapId) {
      const found = findSnap(store, snapId);
      return found ? sendJSON(res, 200, Object.assign({}, found.list[found.idx], { kind: found.kind })) : sendJSON(res, 404, { error: 'not found' });
    }
    if (req.method === 'POST' && !snapId) {
      return readBody(req, res, (body) => {
        let d; try { d = JSON.parse(body || '{}'); } catch (_) { d = {}; }
        const snap = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          label: (typeof d.label === 'string' ? d.label.trim() : '').slice(0, 120),
          ts: Date.now(),
          data: (d.data && typeof d.data === 'object') ? d.data : {},
        };
        store.snapshots.unshift(snap);
        if (store.snapshots.length > 30) store.snapshots.length = 30; // cap; drop oldest
        try { saveSnaps(sid, store); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
        return sendJSON(res, 200, meta(snap, 'manual'));
      });
    }
    if (req.method === 'PUT' && snapId) {
      return readBody(req, res, (body) => {
        let d; try { d = JSON.parse(body || '{}'); } catch (_) { d = {}; }
        const snap = store.snapshots.find((s) => s.id === snapId); // rename applies to manual snapshots only
        if (!snap) return sendJSON(res, 404, { error: 'not found' });
        if (typeof d.label === 'string') snap.label = d.label.trim().slice(0, 120);
        try { saveSnaps(sid, store); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
        return sendJSON(res, 200, meta(snap, 'manual'));
      });
    }
    if (req.method === 'DELETE' && snapId) {
      if (existing.owner && existing.owner !== user.id) return sendJSON(res, 403, { error: 'owner only' });
      const found = findSnap(store, snapId);
      if (found) found.list.splice(found.idx, 1);
      try { saveSnaps(sid, store); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      return sendJSON(res, 200, { ok: true });
    }
    return sendJSON(res, 405, { error: 'method' });
  }

  if (req.method === 'GET') {
    if (!existing) return sendJSON(res, 404, { error: 'not found' });
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(existing));
    return;
  }
  if (req.method === 'PUT') {
    readBody(req, res, (body) => {
      let obj; try { obj = JSON.parse(body || '{}'); } catch (_) { obj = {}; }
      // Preserve ownership/collaborators across saves; clients don't manage them yet.
      obj.owner = (existing && existing.owner) || user.id;
      if (existing && existing.collaborators) obj.collaborators = existing.collaborators;
      try {
        if (existing) maybeAutoSnapshot(sid, existing); // checkpoint the pre-save version, time-gated
        writeFileAtomic(fileFor(sid), JSON.stringify(obj));
      } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { ok: true });
    });
    return;
  }
  if (req.method === 'DELETE') {
    if (!existing) return sendJSON(res, 404, { error: 'not found' });
    if (existing.owner && existing.owner !== user.id) return sendJSON(res, 403, { error: 'owner only' });
    try { fs.unlinkSync(fileFor(sid)); } catch (_) { /* gone */ }
    try { fs.unlinkSync(snapFileFor(sid)); } catch (_) { /* none */ }
    sendJSON(res, 200, { ok: true });
    return;
  }
  sendJSON(res, 405, { error: 'method' });
}

// ---- Remote proxy (USE_REMOTE_DATA mode) ---------------------------------
// Forwards a request to the production server, injecting the stored prod
// session token. Streams the response directly back to the browser.
function proxyToRemote(req, res) {
  const target = new URL(REMOTE_URL);
  const isHttps = target.protocol === 'https:';
  const options = {
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, {
      host: target.hostname,
      cookie: 'md_session=' + REMOTE_TOKEN,
    }),
  };
  const transport = isHttps ? https : http;
  const proxy = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', (e) => {
    console.error('proxy error:', e.message);
    if (!res.headersSent) sendJSON(res, 502, { error: 'proxy error' });
  });
  req.pipe(proxy);
}

if (USE_REMOTE) {
  if (!REMOTE_TOKEN) console.warn('[USE_REMOTE_DATA] REMOTE_TOKEN not set — /api requests will be rejected by prod (401).');
  console.log('[USE_REMOTE_DATA] Shows API → ' + REMOTE_URL);
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);

    // Auth endpoints are always reachable.
    if (p.startsWith('/api/auth')) { handleAuth(req, res, p.split('/').filter(Boolean).slice(1)); return; }

    // Join/reset endpoints are public but token-gated — this is the only way
    // an account gets created (no open signup).
    if (p.startsWith('/api/join')) { handleJoin(req, res, p.split('/').filter(Boolean).slice(2)); return; }

    // Admin endpoints require an account with admin:true.
    if (p.startsWith('/api/admin')) {
      const user = currentUser(req);
      if (!user || !user.admin) return sendJSON(res, 403, { error: 'forbidden' });
      handleAdmin(req, res, p.split('/').filter(Boolean).slice(2), user);
      return;
    }

    // User directory (for the share picker) requires a valid session.
    if (p === '/api/users') {
      const user = currentUser(req);
      if (!user) return sendJSON(res, 401, { error: 'unauth' });
      if (USE_REMOTE) return proxyToRemote(req, res);
      return sendJSON(res, 200, loadUsers().filter((u) => !u.disabled).map((u) => ({ id: u.id, name: u.name })));
    }

    // Shows API requires a valid session.
    if (p.startsWith('/api/shows')) {
      const user = currentUser(req);
      if (!user) return sendJSON(res, 401, { error: 'unauth' });
      if (USE_REMOTE) return proxyToRemote(req, res);
      handleApi(req, res, p.split('/').filter(Boolean), user);
      return;
    }

    // Per-subdomain PWA identity: manifest is generated, not a static file.
    if (p === '/manifest.webmanifest') {
      const b = brandFor(req);
      return sendJSON(res, 200, {
        name: b.title, short_name: b.shortName, description: b.description,
        start_url: '/', scope: '/', display: 'standalone', orientation: 'any',
        background_color: b.bg, theme_color: b.themeColor,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      });
    }

    // Gate the app itself: unauthenticated visitors get the login page.
    if (p === '/' || p === '' || p === '/index.html') {
      if (!currentUser(req)) { res.writeHead(302, { Location: '/login.html' }); res.end(); return; }
      p = '/index.html';
    }

    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    // Never serve secrets/users over HTTP.
    if (fp === USERS_FILE || fp === SECRET_FILE || fp === INVITES_FILE) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      // index.html carries per-subdomain title/theme-color; patch on the way out.
      if (fp === path.join(ROOT, 'index.html')) {
        const b = brandFor(req);
        const html = data.toString('utf8')
          .replace(/<title>.*?<\/title>/, '<title>' + b.shortName + '<\/title>')
          .replace(/name="theme-color" content="[^"]*"/, 'name="theme-color" content="' + b.themeColor + '"')
          .replace(/name="apple-mobile-web-app-title" content="[^"]*"/, 'name="apple-mobile-web-app-title" content="' + b.shortName + '"');
        res.writeHead(200, { 'content-type': TYPES['.html'] });
        res.end(html);
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log('Musical Designer serving on http://localhost:' + PORT));
