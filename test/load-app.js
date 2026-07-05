'use strict';
// Loads app/app.js in a sandboxed vm context so its pure/round-trip logic
// (serialize, line parsing, emphasis markup, id migration, etc.) can be
// exercised from plain `node --test`, with zero new dependencies and zero
// changes to app.js itself. See CLEANUP-PLAN.md Phase 2 for why this exists
// and what it deliberately does NOT attempt (DOM layout code like
// paginateBlocks needs a real browser and is out of scope here).
//
// How it works: app.js assumes a browser (document/window/fetch/etc. at
// module scope, including a few unguarded top-level calls at the very
// bottom — initControls(), fetch('/api/auth/me'), navigateTo('board'), ...).
// We stub just enough of the browser surface that those calls no-op instead
// of throwing, then append a footer (in the SAME script, so it shares the
// same lexical scope) that copies the functions/state we want to test onto
// a global we can read back after vm.runInContext returns. Function
// declarations and the top-level `const`/`let` bindings they close over stay
// reachable via closure even though they're never global-object properties.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP_JS_PATH = path.join(__dirname, '..', 'app', 'app.js');

// Any DOM-ish call chain (document.getElementById(...).classList.toggle(...),
// element.style.display = 'none', etc.) resolves through this without
// throwing: every property access and every call returns another one of
// these. We don't care that the *results* are meaningless — only that
// app.js's boot-time DOM calls don't crash before we can extract functions.
function makeDomStub(label) {
  const target = function domStub() {};
  const handler = {
    get(t, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally' || prop === Symbol.iterator) return undefined;
      if (prop === 'length') return 0;
      if (!(prop in t)) t[prop] = makeDomStub(label + '.' + String(prop));
      return t[prop];
    },
    set(t, prop, value) { t[prop] = value; return true; },
    apply() { return makeDomStub(label + '()'); },
    has() { return true; },
  };
  return new Proxy(target, handler);
}

function makeSandbox() {
  const storage = new Map();
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => { storage.set(k, String(v)); },
    removeItem: (k) => { storage.delete(k); },
  };
  const fakeFetch = () => Promise.resolve({
    ok: false, status: 0,
    json: () => Promise.resolve(null),
    text: () => Promise.resolve(''),
  });
  const sandbox = {
    console,
    document: makeDomStub('document'),
    navigator: {},
    location: { hostname: 'localhost', href: 'http://localhost/', protocol: 'http:' },
    localStorage,
    fetch: fakeFetch,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: () => 0,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    escape, unescape,
    // data.js/lyric.js aren't loaded here (nothing under test needs their real
    // content) — but app.js's boot tail falls back to openReference('fiddler')
    // when there are no projects, which touches SHOWS unconditionally. A
    // minimal empty show avoids that becoming an async ReferenceError that
    // surfaces (as an unhandled rejection) after the test file has finished.
    SHOWS: { fiddler: { title: 'Fiddler (stub)', numbers: [] } },
    LYRIC: { load: () => {}, ready: () => true, inDict: () => true, lineSyll: () => 0 },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

// Functions/state pulled out for testing. Add to this list if a future test
// needs another pure function — nothing else about the harness has to change.
const EXPORTS = [
  'state', 'uid', 'countWords', 'seamlessToLines', 'linesToSeamless',
  'mergeLineIds', 'stampRevisions', 'emphToHtml', 'emphFromNode', 'escHtml',
  'migrateDna', 'migrateLegacyIds', 'cardFromStored', 'serialize', 'applyShowData',
  'cardBodyField', 'b64encode', 'b64decode',
];

// The synchronous try/catch around `boot` (below) can't reach async leftovers:
// app.js's tail kicks off loadProjects().then(...), which — against our fake
// fetch reporting zero projects — falls through to openReference('fiddler'),
// referencing the real reference-show data (SHOWS) that we deliberately don't
// load here. That throw surfaces as an unhandled rejection well after
// vm.runInContext has already returned what we need, so it's harmless noise
// for our purposes; swallow it rather than let it crash the test process.
let _rejectionGuardInstalled = false;
function installRejectionGuard() {
  if (_rejectionGuardInstalled) return;
  _rejectionGuardInstalled = true;
  process.on('unhandledRejection', (err) => {
    if (err && /SHOWS|LYRIC/.test(String(err.message))) return; // expected boot leftover
    throw err; // anything else is a real problem — don't hide it
  });
}

function loadApp() {
  installRejectionGuard();
  const src = fs.readFileSync(APP_JS_PATH, 'utf8');

  // Split right before the unguarded boot section (initControls(); and the
  // fetch/navigateTo/loadProjects calls after it) so a throw in there can't
  // prevent our export footer — appended after everything — from running.
  const bootMarker = '\ninitControls();';
  const splitAt = src.indexOf(bootMarker);
  if (splitAt < 0) throw new Error('load-app.js: boot marker not found — did app.js change shape?');
  const declarations = src.slice(0, splitAt);
  const boot = src.slice(splitAt);

  const footer = '\n;globalThis.__TEST_EXPORTS__ = {\n' +
    EXPORTS.map((n) => '  ' + n + ": (typeof " + n + " !== 'undefined' ? " + n + ' : undefined),').join('\n') +
    '\n};\n';

  const wrapped = declarations + '\ntry {' + boot + '\n} catch (_) { /* boot-time DOM calls; irrelevant to extracted functions */ }' + footer;

  const context = vm.createContext(makeSandbox());
  vm.runInContext(wrapped, context, { filename: 'app.js (sandboxed for tests)' });

  const exported = context.__TEST_EXPORTS__;
  if (!exported || typeof exported.serialize !== 'function') {
    throw new Error('load-app.js: extraction failed — __TEST_EXPORTS__ missing expected functions');
  }
  return exported;
}

module.exports = { loadApp };
