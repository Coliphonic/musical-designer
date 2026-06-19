// Static server + tiny JSON API for saved shows (one file per show under ./shows).
// Absolute paths only (no process.cwd) to avoid sandbox getcwd restrictions.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8090;
const SHOWS_DIR = path.join(ROOT, 'shows');
try { fs.mkdirSync(SHOWS_DIR, { recursive: true }); } catch (e) { /* exists */ }

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

function handleApi(req, res, parts) {
  const id = parts[2];
  if (req.method === 'GET' && !id) {
    fs.readdir(SHOWS_DIR, (e, files) => {
      const list = [];
      (files || []).filter((f) => f.endsWith('.json')).forEach((f) => {
        try { const d = JSON.parse(fs.readFileSync(path.join(SHOWS_DIR, f), 'utf8')); list.push({ id: f.replace(/\.json$/, ''), title: d.title || 'Untitled', updated: d.updated || 0 }); } catch (_) { /* skip */ }
      });
      list.sort((a, b) => b.updated - a.updated);
      sendJSON(res, 200, list);
    });
    return;
  }
  if (req.method === 'POST' && !id) {
    readBody(req, (body) => {
      const newid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try { fs.writeFileSync(fileFor(newid), body || '{}'); } catch (_) { return sendJSON(res, 500, { error: 'write' }); }
      sendJSON(res, 200, { id: newid });
    });
    return;
  }
  const sid = safeId(id);
  if (!sid) return sendJSON(res, 400, { error: 'bad id' });
  if (req.method === 'GET') {
    fs.readFile(fileFor(sid), 'utf8', (e, d) => { if (e) return sendJSON(res, 404, { error: 'not found' }); res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(d); });
    return;
  }
  if (req.method === 'PUT') {
    readBody(req, (body) => { try { fs.writeFileSync(fileFor(sid), body || '{}'); } catch (_) { return sendJSON(res, 500, { error: 'write' }); } sendJSON(res, 200, { ok: true }); });
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
    if (p.startsWith('/api/shows')) { handleApi(req, res, p.split('/').filter(Boolean)); return; }
    if (p === '/' || p === '') p = '/index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log('Musical Designer serving on http://localhost:' + PORT));
