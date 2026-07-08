// Tiny CLI for managing accounts in users.json. No deps.
//   node users.js add <name> <password>      create an account
//   node users.js passwd <name> <password>   change a password
//   node users.js list                        list accounts
//   node users.js remove <name>               delete an account
//   node users.js claim <name>                give all owner-less shows to <name>
//   node users.js admin <name> [true|false]   grant/revoke admin-page access
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const USERS_FILE = path.join(ROOT, 'users.json');
const SHOWS_DIR = path.join(ROOT, 'shows');

function load() { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (_) { return []; } }
function save(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 }); }
function slug(name) { return String(name).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''); }
function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return salt + ':' + h;
}
function find(users, name) { const s = slug(name); return users.find((u) => u.id === s || slug(u.name) === s); }

const [, , cmd, arg1, arg2] = process.argv;
const users = load();

if (cmd === 'add') {
  if (!arg1 || !arg2) { console.error('usage: node users.js add <name> <password>'); process.exit(1); }
  const id = slug(arg1);
  if (!id) { console.error('invalid name'); process.exit(1); }
  if (find(users, arg1)) { console.error('user "' + id + '" already exists'); process.exit(1); }
  users.push({ id, name: arg1, pass: hash(arg2), createdAt: Date.now() });
  save(users);
  console.log('created user "' + id + '"');
} else if (cmd === 'passwd') {
  const u = find(users, arg1);
  if (!u) { console.error('no such user'); process.exit(1); }
  if (!arg2) { console.error('usage: node users.js passwd <name> <password>'); process.exit(1); }
  u.pass = hash(arg2);
  save(users);
  console.log('password updated for "' + u.id + '"');
} else if (cmd === 'list') {
  if (!users.length) { console.log('(no users yet — run: node users.js add <name> <password>)'); }
  users.forEach((u) => console.log('- ' + u.id + (u.name !== u.id ? '  (' + u.name + ')' : '') + (u.admin ? '  [admin]' : '') + (u.disabled ? '  [disabled]' : '')));
} else if (cmd === 'remove') {
  const u = find(users, arg1);
  if (!u) { console.error('no such user'); process.exit(1); }
  save(users.filter((x) => x !== u));
  console.log('removed "' + u.id + '"');
} else if (cmd === 'claim') {
  const u = find(users, arg1);
  if (!u) { console.error('no such user'); process.exit(1); }
  let n = 0;
  (fs.readdirSync(SHOWS_DIR) || []).filter((f) => f.endsWith('.json')).forEach((f) => {
    const fp = path.join(SHOWS_DIR, f);
    let d; try { d = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) { return; }
    if (!d.owner) { d.owner = u.id; fs.writeFileSync(fp, JSON.stringify(d)); n++; }
  });
  console.log('assigned ' + n + ' owner-less show(s) to "' + u.id + '"');
} else if (cmd === 'admin') {
  const u = find(users, arg1);
  if (!u) { console.error('no such user'); process.exit(1); }
  u.admin = arg2 !== 'false';
  save(users);
  console.log((u.admin ? 'granted' : 'revoked') + ' admin access for "' + u.id + '"');
} else {
  console.log('Musical Designer — user management\n');
  console.log('  node users.js add <name> <password>      create an account');
  console.log('  node users.js passwd <name> <password>   change a password');
  console.log('  node users.js list                        list accounts');
  console.log('  node users.js remove <name>               delete an account');
  console.log('  node users.js claim <name>                give owner-less shows to <name>');
  console.log('  node users.js admin <name> [true|false]   grant/revoke admin-page access');
}
