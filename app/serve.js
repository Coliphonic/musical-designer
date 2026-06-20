// Static server + tiny JSON API for saved shows (one file per show under ./shows).
// Absolute paths only (no process.cwd) to avoid sandbox getcwd restrictions.
// Auth: signed session cookie (stateless). Users live in ./users.json (managed
// via users.js). Shows carry an `owner` userId and optional `collaborators`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8090;
const SHOWS_DIR = path.join(ROOT, 'shows');
const USERS_FILE = path.join(ROOT, 'users.json');
const SECRET_FILE = path.join(ROOT, 'secret.txt');
try { fs.mkdirSync(SHOWS_DIR, { recursive: true }); } catch (e) { /* exists */ }

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
  '.txt': 'text/plain; charset=utf-8',
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function safeId(id) { return /^[a-z0-9-]+$/.test(id || '') ? id : null; }
function readBody(req, cb) { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => cb(b)); }
function fileFor(id) { return path.join(SHOWS_DIR, id + '.json'); }

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
          list.push({ id: f.replace(/\.json$/, ''), title: d.title || 'Untitled', updated: d.updated || 0, owner: d.owner || null, shared: !!(d.owner && d.owner !== user.id) });
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
    sendJSON(res, 200, { ok: true });
    return;
  }
  sendJSON(res, 405, { error: 'method' });
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);

    // Auth endpoints are always reachable.
    if (p.startsWith('/api/auth')) { handleAuth(req, res, p.split('/').filter(Boolean).slice(1)); return; }

    // Shows API requires a valid session.
    if (p.startsWith('/api/shows')) {
      const user = currentUser(req);
      if (!user) return sendJSON(res, 401, { error: 'unauth' });
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
