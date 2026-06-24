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
function readBody(req, cb) { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => cb(b)); }
function fileFor(id) { return path.join(SHOWS_DIR, id + '.json'); }
function snapFileFor(id) { return path.join(SNAPS_DIR, id + '.json'); }
function loadSnaps(id) { try { return JSON.parse(fs.readFileSync(snapFileFor(id), 'utf8')); } catch (_) { return { snapshots: [] }; } }
function saveSnaps(id, obj) { fs.writeFileSync(snapFileFor(id), JSON.stringify(obj)); }

// ---- Auth helpers --------------------------------------------------------
function loadUsers() { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (_) { return []; } }

function verifyPassword(user, password) {
  const [salt, hash] = (user.pass || '').split(':');
  if (!salt || !hash) return false;
  let test;
  try { test = crypto.scryptSync(String(password), salt, 32).toString('hex'); } catch (_) { return false; }
  const a = Buffer.from(hash, 'hex'); const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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
  return loadUsers().find((u) => u.id === id) || null;
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
    return sendJSON(res, 200, { id: u.id, name: u.name });
  }
  if (action === 'login' && req.method === 'POST') {
    return readBody(req, (body) => {
      let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
      const name = String(data.name || '').trim().toLowerCase();
      const user = loadUsers().find((u) => u.id === name || (u.name || '').toLowerCase() === name);
      if (!user || !verifyPassword(user, data.password)) return sendJSON(res, 401, { error: 'bad credentials' });
      const cookie = 'md_session=' + makeToken(user.id) + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + (60 * 60 * 24 * 90);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': cookie });
      res.end(JSON.stringify({ id: user.id, name: user.name }));
    });
  }
  if (action === 'logout' && req.method === 'POST') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': 'md_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    return res.end(JSON.stringify({ ok: true }));
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
    readBody(req, (body) => {
      let obj; try { obj = JSON.parse(body || '{}'); } catch (_) { obj = {}; }
      obj.owner = user.id; // stamp ownership on creation
      const newid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try { fs.writeFileSync(fileFor(newid), JSON.stringify(obj)); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
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
    return readBody(req, (body) => {
      let data; try { data = JSON.parse(body || '{}'); } catch (_) { data = {}; }
      const ids = loadUsers().map((u) => u.id);
      existing.collaborators = (Array.isArray(data.collaborators) ? data.collaborators : [])
        .filter((cid) => cid !== user.id && ids.indexOf(cid) >= 0);
      try { fs.writeFileSync(fileFor(sid), JSON.stringify(existing)); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { ok: true, collaborators: existing.collaborators });
    });
  }

  // Sub-action: /api/shows/:id/snapshots — whole-show version history.
  // GET (list metadata) · POST (create) · GET/:snapId (full data) ·
  // PUT/:snapId (rename) · DELETE/:snapId. Access already enforced above.
  if (parts[3] === 'snapshots') {
    if (!existing) return sendJSON(res, 404, { error: 'not found' });
    const snapId = parts[4] ? safeId(parts[4]) : null;
    const store = loadSnaps(sid);
    const meta = (s) => ({ id: s.id, label: s.label, ts: s.ts });

    if (req.method === 'GET' && !snapId) return sendJSON(res, 200, store.snapshots.map(meta));
    if (req.method === 'GET' && snapId) {
      const snap = store.snapshots.find((s) => s.id === snapId);
      return snap ? sendJSON(res, 200, snap) : sendJSON(res, 404, { error: 'not found' });
    }
    if (req.method === 'POST' && !snapId) {
      return readBody(req, (body) => {
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
        return sendJSON(res, 200, meta(snap));
      });
    }
    if (req.method === 'PUT' && snapId) {
      return readBody(req, (body) => {
        let d; try { d = JSON.parse(body || '{}'); } catch (_) { d = {}; }
        const snap = store.snapshots.find((s) => s.id === snapId);
        if (!snap) return sendJSON(res, 404, { error: 'not found' });
        if (typeof d.label === 'string') snap.label = d.label.trim().slice(0, 120);
        try { saveSnaps(sid, store); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
        return sendJSON(res, 200, meta(snap));
      });
    }
    if (req.method === 'DELETE' && snapId) {
      store.snapshots = store.snapshots.filter((s) => s.id !== snapId);
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
    readBody(req, (body) => {
      let obj; try { obj = JSON.parse(body || '{}'); } catch (_) { obj = {}; }
      // Preserve ownership/collaborators across saves; clients don't manage them yet.
      obj.owner = (existing && existing.owner) || user.id;
      if (existing && existing.collaborators) obj.collaborators = existing.collaborators;
      try { fs.writeFileSync(fileFor(sid), JSON.stringify(obj)); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { ok: true });
    });
    return;
  }
  if (req.method === 'DELETE') {
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

    // User directory (for the share picker) requires a valid session.
    if (p === '/api/users') {
      const user = currentUser(req);
      if (!user) return sendJSON(res, 401, { error: 'unauth' });
      if (USE_REMOTE) return proxyToRemote(req, res);
      return sendJSON(res, 200, loadUsers().map((u) => ({ id: u.id, name: u.name })));
    }

    // Shows API requires a valid session.
    if (p.startsWith('/api/shows')) {
      const user = currentUser(req);
      if (!user) return sendJSON(res, 401, { error: 'unauth' });
      if (USE_REMOTE) return proxyToRemote(req, res);
      handleApi(req, res, p.split('/').filter(Boolean), user);
      return;
    }

    // Gate the app itself: unauthenticated visitors get the login page.
    if (p === '/' || p === '' || p === '/index.html') {
      if (!currentUser(req)) { res.writeHead(302, { Location: '/login.html' }); res.end(); return; }
      p = '/index.html';
    }

    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    // Never serve secrets/users over HTTP.
    if (fp === USERS_FILE || fp === SECRET_FILE) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log('Musical Designer serving on http://localhost:' + PORT));
