// Phase 2 board. 3-act spine (Act 1 / 2A / 2B / 3) with intermission|midpoint marker.
// Click a card to open the detail drawer and edit every field, incl. "why does this sing?".
// Drag sideways to reorder or into another lane to change act. + per lane adds a song/beat.

const SVGNS = 'http://www.w3.org/2000/svg';
let _uid = 0;
// Cards get 'c' ids that are regenerated from scratch on every load (cards
// aren't stored with ids — see cardFromStored/exportShow), so the counter
// reliably lands on the same numbers each session. Notes and revisions DO
// keep a stored, permanent id across sessions — give them their own prefixes
// so a fresh session's card ids (or a newly-created note/revision) can never
// collide with an old note/revision id that happens to share a number.
const uid = (prefix) => (prefix || 'c') + (++_uid);

const LANES = [
  { key: '1', label: 'Act 1' },
  { key: '2A', label: 'Act 2A' },
  { key: '2B', label: 'Act 2B' },
  { key: '3', label: 'Act 3' },
];
const LANE_KEYS = LANES.map((l) => l.key);
const STATUS = {
  idea: { label: 'Idea', c: '#b4b2a9' },
  lyric: { label: 'Lyric draft', c: '#EF9F27' },
  music: { label: 'Music draft', c: '#378ADD' },
  demo: { label: 'Demo', c: '#1D9E75' },
  locked: { label: 'Locked', c: '#639922' },
};
// Beats aren't music — same 5 stages/colors, prose-friendly wording.
const STATUS_BEAT = { idea: 'Idea', lyric: 'Sketch', music: 'Draft', demo: 'Revised', locked: 'Locked' };
function statusLabel(c, key) { return c.type === 'beat' && STATUS_BEAT[key] ? STATUS_BEAT[key] : STATUS[key].label; }
// Scene-change at the end of a card, set from the card face (no dropdown).
const CHANGE_OPTS = [
  { key: '', label: 'No change', sym: '~' },
  { key: 'positive', label: 'Positive', sym: '+' },
  { key: 'negative', label: 'Negative', sym: '−' },
];

// Song Plot and Prose Plot are served from their own subdomains in production;
// when running there, the hostname IS the app choice, so the Library should
// default to it and the waffle switch should navigate instead of just
// flipping in-page state. Single-domain deploys (local dev, or if the split
// is ever undone) fall back to the old in-page toggle untouched.
const APP_HOSTS = { song: 'musicaldesigner.colincreates.com', prose: 'proseplot.colincreates.com' };
function appFromHost() {
  const h = (typeof location !== 'undefined' && location.hostname || '').toLowerCase();
  if (h === APP_HOSTS.prose) return 'prose';
  if (h === APP_HOSTS.song) return 'song';
  return null;
}

// Front/back matter block kinds (Prose Plot book output). Declared before
// `state` because bookDefaults() runs inside the state initializer below.
// `cls` drives the editor UI in rebuildBookMatter: 'generated' blocks have no
// text field (derived from title/book.meta/chapters at render time, in Phase
// 1b); 'freetext' is one plain-text-with-emphasis field; 'templated'
// (copyright only) is a small form of its own fields.
const bid = () => 'b' + Math.random().toString(36).slice(2, 9);
const BOOK_MATTER_KINDS = {
  front: [
    { kind: 'halftitle', label: 'Half-title page', cls: 'generated' },
    { kind: 'titlepage', label: 'Title page', cls: 'generated' },
    { kind: 'copyright', label: 'Copyright page', cls: 'templated' },
    { kind: 'dedication', label: 'Dedication', cls: 'freetext' },
    { kind: 'epigraph', label: 'Epigraph', cls: 'freetext' },
    { kind: 'toc', label: 'Table of contents', cls: 'generated' },
    { kind: 'foreword', label: 'Foreword', cls: 'freetext' },
    { kind: 'preface', label: 'Preface', cls: 'freetext' },
    { kind: 'prologue', label: 'Prologue', cls: 'freetext' },
  ],
  back: [
    { kind: 'acknowledgments', label: 'Acknowledgments', cls: 'freetext' },
    { kind: 'abouttheauthor', label: 'About the Author', cls: 'freetext' },
    { kind: 'alsoby', label: 'Also By', cls: 'freetext' },
    { kind: 'newsletter', label: 'Newsletter signup', cls: 'freetext' },
  ],
};

const state = {
  showKey: 'fiddler',
  title: '',
  format: 'song',      // 'song' | 'prose' — which Plot Suite app this show belongs to
  currentApp: appFromHost() || 'song',  // which app's Library you're currently browsing (waffle launcher)
  wordTarget: 0,       // Prose Plot only — the ribbon's "words / target" progress stat
  wordCountBaseline: 0,     // total word count as of the start of wordCountBaselineDate
  wordCountBaselineDate: '', // 'YYYY-MM-DD', local time — rolls forward in buildStats
  projectId: null,
  role: 'owner',       // 'owner' | 'editor' | 'viewer' — role on the currently open project
  readonly: true,
  loading: false,
  projects: [],
  users: [],
  me: null,
  status: 'active',
  folder: '',
  mode: 'full',
  view: 'full',
  page: 'board',
  sidebarOpen: (() => { try { return localStorage.getItem('md-sidebar') !== 'closed'; } catch (_) { return true; } })(),
  cards: [],
  revisions: [],     // [{id, name, color, date}] — Final Draft-style revision sets
  currentRev: null,  // id of the active revision; null = not tracking (no marks)
  pageLock: null,    // { lockedAt, date, pages:[{label, anchor}] } — frozen page boundaries (A-pages)
  characters: {},
  notes: [],
  storyDna: dnaDefaults(),
  titlePage: { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } },
  scriptHeader: { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false },
  book: bookDefaults(), // Prose Plot only; see BOOK-FORMATTING-PLAN.md
  msOptions: (() => { try { return JSON.parse(localStorage.getItem('md-ms-opts') || '{}'); } catch (_) { return {}; } })(),
  dragFrom: null,
  openAct: null,
  lyricWinId: null,
  lyricWinMode: 'edit', // 'edit' | 'sheet' — lyric window pane, session-only (not persisted to disk)
};

// ---- Song Sheet options (lyric window's Sheet mode) -----------------------
// Independent of Manuscript's state.msOptions (per-device, not per-show) — a
// reader flipping Chords/Section tags off in a card's Sheet shouldn't touch
// the writer's Manuscript print settings, and vice versa.
const sheetOpts = (() => {
  try { return Object.assign({ showChords: true, showSectionTags: true, font: 'courierprime' }, JSON.parse(localStorage.getItem('md-sheet-opts') || '{}')); }
  catch (_) { return { showChords: true, showSectionTags: true, font: 'courierprime' }; }
})();
function saveSheetOpts() { try { localStorage.setItem('md-sheet-opts', JSON.stringify(sheetOpts)); } catch (_) {} }

function el(tag, attrs, kids) {
  const svgTags = ['svg', 'path', 'polyline', 'line', 'circle', 'polygon', 'text', 'rect', 'g'];
  const node = svgTags.includes(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === 'text') node.textContent = attrs[k];
    else if (k === 'html') node.innerHTML = attrs[k];
    else node.setAttribute(k, attrs[k]);
  }
  for (const c of (kids || [])) node.appendChild(c);
  return node;
}
function cardById(id) { return state.cards.find((c) => c.id === id); }

// ---- model ----
function cardFromTuple(t) {
  const [act, title, fn, voicing, min] = t;
  return { id: uid(), type: 'song', act, title, fn, voicing, min };
}
function cardFromObj(o) {
  const act = o.lane || o.act;
  if (o.type === 'beat') return { id: uid(), type: 'beat', act, title: o.title, note: o.note || '', min: o.min || 1.5, beatFn: o.beatFn || '' };
  if (o.type === 'scene') return { id: uid(), type: 'scene', act, title: o.title, words: o.words || 0 };
  return { id: uid(), type: 'song', act, title: o.title, fn: o.fn, voicing: o.voicing, min: o.min };
}
function assignLanes(numbers) {
  const total = numbers.reduce((s, t) => s + t[4], 0) || 1;
  let cum = 0;
  const pct = numbers.map((t) => { const mid = cum + t[4] / 2; cum += t[4]; return (mid / total) * 100; });
  const lane = {};
  numbers.forEach((t, i) => { lane[i] = t[0] === 1 ? (pct[i] < 20 ? '1' : '2A') : (pct[i] >= 80 ? '3' : '2B'); });
  return lane;
}
function cardFromStored(o) { return Object.assign({}, o, { id: uid() }); }

// Which field holds a card's *manuscript body* (the text the editor + Print view
// read). Songs write lyrics; scenes write note; a beat's body is always lyrics —
// its note is the Beatline synopsis, never manuscript content, so it must never
// be picked up here even when lyrics is empty (a blank new beat, or one whose
// lyrics were cleared, must read/write lyrics — not fall through to the
// Beatline and start amending it). This is also the field the structured
// `card.lines` identity sidecar mirrors.
function cardBodyField(c) {
  if (c.type === 'beat') return 'lyrics';
  if ((c.lyrics || '').trim()) return 'lyrics';
  if ((c.note || '').trim()) return 'note';
  return c.type === 'scene' ? 'note' : 'lyrics';
}

// Word count on the manuscript body — strips emphasis markup (see emphToHtml)
// so **bold**/_underline_/~~strike~~/==highlight== symbols, and inline-note
// markers, aren't counted as their own words.
function countWords(text) {
  const cleaned = (text || '')
    .replace(/\[\[note:[a-z0-9]+:[A-Za-z0-9+/=]*\]\]/g, '')
    .replace(/\[\[\/note\]\]/g, '')
    .replace(CHORD_RE, '')
    .replace(/[*_~=]/g, ' ');
  const m = cleaned.match(/\S+/g);
  return m ? m.length : 0;
}
function totalShowWords() {
  // Reference novels carry no typed body text (their chapters hold `words`,
  // the published word-count ballpark, instead) — sum that instead so the
  // Words stat isn't just 0 for a read-only study object.
  if (state.readonly && state.showKey && NOVELS[state.showKey]) {
    return state.cards.reduce((s, c) => s + (c.type === 'scene' ? (c.words || 0) : 0), 0);
  }
  return state.cards.reduce((s, c) => s + countWords(c[cardBodyField(c)] || ''), 0);
}

// Sum of a chapter's own body plus every beat under it, up to (not including)
// the next scene card in reading order — mirrors editOrder's per-scene slice
// in buildManuscriptPage, so "current chapter" always means the same span.
function chapterWordCount(sceneId) {
  const order = displayOrder();
  const startPos = order.findIndex((i) => state.cards[i] && state.cards[i].id === sceneId);
  if (startPos < 0) return 0;
  // Reference novels carry no typed body — the chapter's `words` ballpark is
  // its count (mirrors totalShowWords), so per-chapter numbers still sum to the
  // book total on a read-only study object instead of reading 0.
  if (state.readonly && state.showKey && NOVELS[state.showKey]) {
    return state.cards[order[startPos]].words || 0;
  }
  let sum = 0;
  for (let j = startPos; j < order.length; j++) {
    const c = state.cards[order[j]];
    if (j > startPos && c.type === 'scene') break;
    sum += countWords(c[cardBodyField(c)] || '');
  }
  return sum;
}

function saveLastOpened(type, val) {
  try { localStorage.setItem('md-last', JSON.stringify({ type, val })); } catch (_) {}
}

function openReference(key) {
  // Flush a pending debounced save before leaving the real project open now —
  // see openProject's identical guard for why.
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; doSave(); }
  // References are read-only examples — don't let them overwrite the last
  // opened *project*, so reopening the app returns to the user's own work.
  state.loading = true;
  state.showKey = key;
  const isNovel = !SHOWS[key] && !!NOVELS[key];
  const show = SHOWS[key] || NOVELS[key];
  const fmt = isNovel ? 'prose' : 'song';
  if (show.cards) state.cards = show.cards.map(cardFromObj);
  else { const lanes = assignLanes(show.numbers); state.cards = show.numbers.map((t, i) => { const c = cardFromTuple(t); c.act = lanes[i]; return c; }); }
  // Enriched references may carry a character registry and a title page (no lyrics).
  // Plain references have neither — fall back to empty so stale project data never leaks in.
  state.revisions = []; state.currentRev = null; state.pageLock = null; // references aren't revised
  state.characters = show.characters ? JSON.parse(JSON.stringify(show.characters)) : {};
  state.notes = show.notes ? JSON.parse(JSON.stringify(show.notes)) : [];
  state.storyDna = migrateDna(show.storyDna);
  const tpDefaults = { subtitle: isNovel ? 'A novel' : 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } };
  state.titlePage = Object.assign({}, tpDefaults, show.titlePage || {});
  state.titlePage.include = Object.assign({}, tpDefaults.include, (show.titlePage || {}).include || {});
  state.scriptHeader = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
  state.book = bookDefaults();
  state.title = show.title;
  state.projectId = null;
  state.readonly = true;
  state.folder = '';
  state.mode = isNovel ? 'oneact' : (show.form === 'one-act-90' ? 'oneact' : 'full');
  state.format = fmt;
  state.currentApp = fmt;
  state.wordTarget = 0;
  state.wordCountBaseline = 0;
  state.wordCountBaselineDate = '';
  state.paraStyle = 'indent';
  state.loading = false;
  render();
  setSaveInd('ref');
}

// One-time upgrade for shows saved before notes/revisions got their own id
// namespaces (see uid() above): a stored 'c'-prefixed note/revision id can
// collide with a card id regenerated this session, or a note/revision id
// minted from now on. Re-mint any legacy id, fixing up whatever else in
// `state` points at it. Must run after state.cards is assigned (cardFromStored
// consumes the low end of the counter, so migrated ids land safely above it).
function migrateLegacyIds() {
  (state.notes || []).forEach((n) => {
    if (!/^c\d+$/.test(n.id)) return;
    const newId = uid('n');
    if (notesSelId === n.id) notesSelId = newId;
    n.id = newId;
  });
  (state.revisions || []).forEach((r) => {
    if (!/^c\d+$/.test(r.id)) return;
    const newId = uid('r');
    if (state.currentRev === r.id) state.currentRev = newId;
    if (state.pageLock && state.pageLock.lockedAt === r.id) state.pageLock.lockedAt = newId;
    r.id = newId;
  });
}

// Load a show payload (from the server, or a restored snapshot) into state.
// Does not touch projectId/showKey/readonly or render — the caller owns those.
function applyShowData(d) {
  state.cards = (d.cards || []).map(cardFromStored);
  state.revisions = d.revisions || [];
  state.currentRev = d.currentRev || null;
  state.pageLock = d.pageLock || null;
  state.characters = d.characters || {};
  state.notes = d.notes || [];
  migrateLegacyIds();
  state.storyDna = migrateDna(d.storyDna);
  const tpDefaults = { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } };
  state.titlePage = Object.assign({}, tpDefaults, d.titlePage || {});
  state.titlePage.include = Object.assign({}, tpDefaults.include, (d.titlePage || {}).include || {});
  const shDefaults = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
  state.scriptHeader = Object.assign({}, shDefaults, d.scriptHeader || {});
  state.book = migrateBook(d.book);
  state.title = d.title || 'Untitled show';
  state.mode = d.mode || 'full';
  state.status = d.status || 'active';
  state.folder = d.folder || '';
  state.format = d.format || 'song';
  state.currentApp = state.format;
  state.wordTarget = d.wordTarget || 0;
  state.wordCountBaseline = d.wordCountBaseline || 0;
  state.wordCountBaselineDate = d.wordCountBaselineDate || '';
  state.paraStyle = d.paraStyle || 'indent';
}

function openProject(id, afterOpen) {
  // Flush a pending debounced save (see scheduleSave) before switching away —
  // otherwise its 700ms timer would fire after state.projectId already points
  // at the new show and get dropped by doSave's staleness guard, silently
  // losing the last ~700ms of edits to the show being left.
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; doSave(); }
  saveLastOpened('project', id);
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    state.loading = true;
    applyShowData(d);
    state.projectId = id;
    state.showKey = null;
    state.role = d.role || 'owner';
    // A 'viewer' collaborator gets the same read-only rendering as the
    // reference library (no card edits, no lyric editing, no saves) — see
    // the state.readonly call sites for what that disables. state.showKey
    // staying null is what distinguishes "viewer of a real show" from
    // "studying a reference show" at the couple of spots that need to.
    state.readonly = state.role === 'viewer';
    state.loading = false;
    render();
    // render() only rebuilds the Board (#board). The show switcher popover
    // (unlike a Library card) doesn't navigate away first, so if the writer
    // switches shows while sitting on Manuscript/Notes/Characters/Story DNA,
    // that page's DOM is still built from the show just left and would keep
    // showing its stale content until some other click happened to force a
    // rebuild. Rebuild whichever of those pages is currently active too.
    if (state.page === 'manuscript') buildManuscriptPage();
    else if (state.page === 'notes') buildNotesPage();
    else if (state.page === 'characters') buildCharactersPage();
    else if (state.page === 'storydna') buildStoryDnaPage();
    setSaveInd(state.role === 'viewer' ? 'viewonly' : 'saved');
    if (afterOpen) afterOpen();
  }).catch(() => setSaveInd('error'));
}

function serializeData() {
  return {
    title: state.title, mode: state.mode, status: state.status || 'active', folder: state.folder || '', updated: Date.now(),
    format: state.format || 'song',
    wordTarget: state.wordTarget || 0,
    wordCountBaseline: state.wordCountBaseline || 0,
    wordCountBaselineDate: state.wordCountBaselineDate || '',
    paraStyle: state.paraStyle || 'indent',
    cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }),
    revisions: state.revisions,
    currentRev: state.currentRev,
    pageLock: state.pageLock,
    characters: state.characters,
    notes: state.notes,
    storyDna: state.storyDna,
    titlePage: state.titlePage,
    scriptHeader: state.scriptHeader,
    book: state.book,
  };
}
function serialize() { return JSON.stringify(serializeData()); }
let _saveTimer = null;
function scheduleSave() {
  if (state.readonly || !state.projectId || state.loading) return;
  setSaveInd('saving');
  clearTimeout(_saveTimer);
  // Capture which show this edit belongs to. If the user switches shows
  // before the timer fires, state.cards/etc. will belong to the NEW show but
  // state.projectId would too — without this, doSave would serialize the new
  // show's state and PUT it over the old show's id (or vice versa). Instead,
  // if the target has changed by fire time, doSave bails and the edit is
  // simply dropped rather than corrupting either show. openProject() also
  // flushes a pending save synchronously before switching, so in practice
  // this only guards the residual gap between "switch" and "flush".
  const targetId = state.projectId;
  _saveTimer = setTimeout(() => doSave(targetId), 700);
}
// targetId is only passed by scheduleSave()'s timer, to detect a show switch
// that happened while it was pending. Direct/synchronous callers (status
// change, folder move, snapshot restore, immediate blur-saves) omit it and
// always mean "save whatever show is open right now" — no staleness risk
// since there's no delay between call and fetch.
function doSave(targetId) {
  const id = targetId || state.projectId;
  if (state.readonly || state.loading || !state.projectId || state.projectId !== id) return;
  fetch('/api/shows/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: serialize() })
    .then((r) => { if (!r.ok) throw new Error('save failed: ' + r.status); setSaveInd('saved'); loadProjects(); })
    .catch(() => setSaveInd('error'));
}
function loadProjects() {
  return fetch('/api/shows').then((r) => r.json()).then((list) => { state.projects = list || []; renderShowBtn(); if (state.page === 'library') buildLibraryPage(); }).catch(() => {});
}
function duplicateProject() {
  const body = JSON.stringify({ title: state.title + ' (copy)', mode: state.mode, format: state.format || 'song', updated: Date.now(), cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }) });
  fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).then((r) => r.json()).then((d) => loadProjects().then(() => openProject(d.id)));
}
function deleteProject() {
  if (state.readonly || !state.projectId) return;
  if (!confirm('Delete "' + state.title + '"? This cannot be undone.')) return;
  fetch('/api/shows/' + state.projectId, { method: 'DELETE' }).then(() => loadProjects().then(() => {
    if (state.projects.length) openProject(state.projects[0].id); else openReference('fiddler');
  }));
}
// ---- Library / file management -------------------------------------------
function relTime(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return m + (m === 1 ? ' min ago' : ' mins ago');
  const h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? ' hr ago' : ' hrs ago');
  const d = Math.floor(h / 24); if (d === 1) return 'yesterday';
  if (d < 30) return d + ' days ago';
  const mo = Math.floor(d / 30); if (mo < 12) return mo + (mo === 1 ? ' mo ago' : ' mos ago');
  return Math.floor(mo / 12) + ' yr ago';
}
function userName(id) { const u = (state.users || []).find((x) => x.id === id); return u ? u.name : id; }
function isOwner(p) { return !p.owner || (state.me && p.owner === state.me.id); }

function existingFolders() {
  const set = {};
  (state.projects || []).forEach((p) => { const f = (p.folder || '').trim(); if (f) set[f] = true; });
  return Object.keys(set).sort((a, b) => a.localeCompare(b));
}

function libSection(name, builders) {
  const sec = el('div', { class: 'lib-section' });
  if (name) {
    const head = el('div', { class: 'lib-section-head' });
    head.appendChild(el('span', { class: 'lib-folder-ico', text: '▸' }));
    head.appendChild(el('span', { class: 'lib-section-name', text: name }));
    head.appendChild(el('span', { class: 'lib-section-count', text: builders.length }));
    sec.appendChild(head);
  }
  const grid = el('div', { class: 'lib-grid-inner' });
  builders.forEach((fn) => grid.appendChild(fn()));
  sec.appendChild(grid);
  return sec;
}

function buildLibraryPage() {
  const host = document.getElementById('lib-grid');
  if (!host) return;
  const isProseLib = state.currentApp === 'prose';
  const titleEl = document.getElementById('lib-title');
  if (titleEl) titleEl.textContent = (isProseLib ? 'Prose Plot' : 'Song Plot') + ' Library';
  const newBtn = document.getElementById('lib-new');
  if (newBtn) newBtn.textContent = isProseLib ? '+ New novel' : '+ New show';
  const archChk = document.getElementById('lib-show-archived');
  const showArchived = archChk && archChk.checked;
  host.innerHTML = '';
  let items = (state.projects || []).slice();
  // Song Plot and Prose Plot keep fully separate libraries (per-app, not a
  // filter) — a show only ever appears in the app it was created under.
  items = items.filter((p) => (p.format || 'song') === state.currentApp);
  if (!showArchived) items = items.filter((p) => (p.status || 'active') !== 'archived');

  const ungrouped = items.filter((p) => !(p.folder || '').trim());
  const folders = {};
  items.filter((p) => (p.folder || '').trim()).forEach((p) => { const f = p.folder.trim(); (folders[f] = folders[f] || []).push(p); });

  if (!items.length) {
    host.appendChild(el('div', { class: 'lib-empty', text: showArchived ? 'No shows yet.' : 'No active shows yet. Click “+ New show” to start.' }));
  } else {
    if (ungrouped.length) host.appendChild(libSection(null, ungrouped.map((p) => () => libCard(p))));
    Object.keys(folders).sort((a, b) => a.localeCompare(b)).forEach((f) => host.appendChild(libSection(f, folders[f].map((p) => () => libCard(p)))));
  }

  // Reference library — read-only study examples, always in their own
  // section. Song Plot studies musicals (SHOWS); Prose Plot studies novels
  // (NOVELS) — fully separate shelves, per the partitioned-library rule.
  const refKeys = Object.keys(state.currentApp === 'song' ? SHOWS : NOVELS);
  if (refKeys.length) host.appendChild(libSection('Reference', refKeys.map((k) => () => libRefCard(k))));
}

function libRefCard(key) {
  const r = SHOWS[key] || NOVELS[key];
  const card = el('div', { class: 'lib-card lib-card-ref' });
  card.addEventListener('click', () => { closeCardMenu(); openReference(key); navigateTo('board'); });
  const top = el('div', { class: 'lib-card-top' });
  top.appendChild(el('span', { class: 'lib-card-title', text: r.title }));
  card.appendChild(top);
  const meta = el('div', { class: 'lib-card-meta' });
  meta.appendChild(el('span', { class: 'lib-fmt', text: r.form === 'two-act' ? 'Two-act' : (r.form ? r.form.replace(/-/g, ' ') : 'Reference') }));
  if (r.year) { meta.appendChild(el('span', { class: 'lib-dot', text: '·' })); meta.appendChild(el('span', { text: String(r.year) })); }
  card.appendChild(meta);
  if (r.teaches) card.appendChild(el('div', { class: 'lib-teaches', text: r.teaches }));
  const tags = el('div', { class: 'lib-card-tags' });
  tags.appendChild(el('span', { class: 'lib-badge lib-ref-badge', text: 'Reference' }));
  card.appendChild(tags);
  return card;
}

function libCard(p) {
  const card = el('div', { class: 'lib-card' + (state.projectId === p.id ? ' current' : '') });
  card.addEventListener('click', () => { closeCardMenu(); openProject(p.id, () => navigateTo('board')); });

  const top = el('div', { class: 'lib-card-top' });
  top.appendChild(el('span', { class: 'lib-card-title', text: p.title || 'Untitled' }));
  const dots = el('button', { class: 'lib-card-dots', title: 'Actions', text: '⋯' });
  dots.addEventListener('click', (e) => { e.stopPropagation(); openCardMenu(p, dots); });
  top.appendChild(dots);
  card.appendChild(top);

  const meta = el('div', { class: 'lib-card-meta' });
  // `mode` (one-act/full-length) is a musical act-structure concept — Prose
  // Plot always stores 'oneact' under the hood (see createProject) since a
  // novel has no intermission to speak of, so surfacing it here would just
  // be a meaningless label for novelists.
  if ((p.format || 'song') !== 'prose') {
    meta.appendChild(el('span', { class: 'lib-fmt', text: p.mode === 'oneact' ? 'One-act' : 'Full length' }));
    meta.appendChild(el('span', { class: 'lib-dot', text: '·' }));
  }
  meta.appendChild(el('span', { class: 'lib-updated', text: relTime(p.updated) }));
  card.appendChild(meta);

  const tags = el('div', { class: 'lib-card-tags' });
  const status = p.status || 'active';
  tags.appendChild(el('span', { class: 'lib-badge lib-status-' + status, text: status.charAt(0).toUpperCase() + status.slice(1) }));
  if (p.shared) tags.appendChild(el('span', { class: 'lib-badge lib-shared', text: 'Shared by ' + userName(p.owner) + (p.role === 'viewer' ? ' · View only' : '') }));
  else if ((p.collaborators || []).length) tags.appendChild(el('span', { class: 'lib-badge lib-shared', text: 'Shared · ' + p.collaborators.length }));
  card.appendChild(tags);
  return card;
}

function closeCardMenu() { const m = document.getElementById('lib-card-menu'); if (m) m.remove(); }
function openCardMenu(p, anchor) {
  closeCardMenu();
  const menu = el('div', { class: 'lib-menu', id: 'lib-card-menu' });
  const add = (label, fn, danger) => {
    const b = el('button', { class: 'lib-menu-item' + (danger ? ' danger' : ''), text: label });
    b.addEventListener('click', (e) => { e.stopPropagation(); closeCardMenu(); fn(); });
    menu.appendChild(b);
  };
  add('Open', () => openProject(p.id, () => navigateTo('board')));
  if (isOwner(p)) add('Share…', () => openShareModal(p.id));
  add('Duplicate', () => duplicateShowById(p.id));
  add('Move to folder…', () => openFolderModal(p.id));
  const status = p.status || 'active';
  add(status === 'archived' ? 'Unarchive' : 'Archive', () => setShowStatus(p.id, status === 'archived' ? 'active' : 'archived'));
  if (isOwner(p)) add('Delete', () => deleteShowById(p.id, p.title), true);

  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.left = Math.max(8, r.right - menu.offsetWidth) + 'px';
}

// Update one show's status without disturbing the currently open project.
function setShowStatus(id, status) {
  if (state.projectId === id) { state.status = status; doSave(); buildLibraryPage(); return; }
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    d.status = status; d.updated = d.updated || Date.now();
    return fetch('/api/shows/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  }).then(() => loadProjects().then(buildLibraryPage));
}
// Move a show into a folder ('' = top level), without disturbing the open project.
function setShowFolder(id, folder) {
  if (state.projectId === id) { state.folder = folder; doSave(); loadProjects().then(buildLibraryPage); return; }
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    d.folder = folder; d.updated = d.updated || Date.now();
    return fetch('/api/shows/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  }).then(() => loadProjects().then(buildLibraryPage));
}

// ---- Folder picker --------------------------------------------------------
let _folderId = null;
function openFolderModal(id) {
  _folderId = id;
  const p = (state.projects || []).find((x) => x.id === id);
  const cur = p ? (p.folder || '').trim() : '';
  const list = document.getElementById('folder-list');
  list.innerHTML = '';
  const none = el('button', { class: 'folder-opt' + (!cur ? ' active' : ''), text: 'No folder (top level)' });
  none.addEventListener('click', () => applyFolder(''));
  list.appendChild(none);
  existingFolders().forEach((f) => {
    const b = el('button', { class: 'folder-opt' + (f === cur ? ' active' : ''), text: f });
    b.addEventListener('click', () => applyFolder(f));
    list.appendChild(b);
  });
  document.getElementById('folder-new').value = '';
  document.getElementById('folder-modal').style.display = '';
}
function closeFolderModal() { document.getElementById('folder-modal').style.display = 'none'; _folderId = null; }
function applyFolder(folder) { const id = _folderId; closeFolderModal(); if (id) setShowFolder(id, folder); }
function createFolderAndMove() {
  const name = (document.getElementById('folder-new').value || '').trim();
  if (!name) { closeFolderModal(); return; }
  applyFolder(name);
}

// ---- Find & Replace --------------------------------------------------------
// Searches every card's manuscript body (song lyrics / scene note — see
// cardBodyField) plus every note's body. Card titles and structural fields
// (fn, voicing, min) are intentionally out of scope so a rename can't corrupt
// board metadata.
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function findOpts() {
  return {
    case: !!document.getElementById('find-case').checked,
    whole: !!document.getElementById('find-whole').checked,
  };
}
function buildFindRegex(query, opts) {
  if (!query) return null;
  let pattern = escapeRegExp(query);
  if (opts.whole) pattern = '\\b' + pattern + '\\b';
  try { return new RegExp(pattern, 'g' + (opts.case ? '' : 'i')); } catch (_) { return null; }
}
function htmlToText(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
}
// Replaces within text nodes only, so bold/italic/links survive. A match that
// spans a formatting boundary (half bold, half not) won't be found — a known
// limitation shared with most rich-text editors' basic find/replace.
function replaceInHtml(html, re, replacement) {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  let changed = false;
  nodes.forEach((node) => {
    re.lastIndex = 0;
    if (re.test(node.nodeValue)) {
      re.lastIndex = 0;
      node.nodeValue = node.nodeValue.replace(re, replacement);
      changed = true;
    }
  });
  return changed ? container.innerHTML : null;
}
function countMatches(text, re) {
  if (!text || !re) return 0;
  re.lastIndex = 0;
  const m = text.match(re);
  return m ? m.length : 0;
}
function findMatchCount(re) {
  let count = 0;
  state.cards.forEach((c) => { count += countMatches(c[cardBodyField(c)] || '', re); });
  (state.notes || []).forEach((n) => { count += countMatches(htmlToText(n.body), re); });
  return count;
}
function setFindStatus(text) { document.getElementById('find-status').textContent = text; }
let findMode = 'find';
let _findIdx = -1; // current position within the live match list (Find mode only)
function updateFindStatus() {
  const q = document.getElementById('find-q').value;
  if (!q) { setFindStatus(state.format === 'prose' ? 'Searches chapter text and notes.' : 'Searches song & scene text and notes.'); return; }
  const re = buildFindRegex(q, findOpts());
  const n = re ? findMatchCount(re) : 0;
  if (findMode === 'find' && n) {
    setFindStatus((_findIdx >= 0 ? (_findIdx + 1) + ' of ' : '') + n + ' match' + (n === 1 ? '' : 'es') + '.');
  } else {
    setFindStatus(n ? (n + ' match' + (n === 1 ? '' : 'es') + ' found.') : 'No matches found.');
  }
}
function setFindMode(mode) {
  findMode = mode;
  _findIdx = -1;
  document.querySelectorAll('#find-mode-seg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('find-r-row').hidden = mode !== 'replace';
  document.getElementById('find-replace').hidden = mode !== 'replace';
  document.getElementById('find-nav').hidden = mode !== 'find';
  updateFindStatus();
}
function openFindModal() {
  document.getElementById('find-modal').style.display = '';
  setFindMode('find');
  const q = document.getElementById('find-q');
  q.focus();
  q.select();
}
function closeFindModal() { document.getElementById('find-modal').style.display = 'none'; }

// Ordered list of every match location, in Board/card order then Notes order —
// rebuilt fresh on each Next/Prev press so it always reflects live text.
function buildFindMatches(re) {
  const list = [];
  state.cards.forEach((c) => {
    const n = countMatches(c[cardBodyField(c)] || '', re);
    for (let i = 0; i < n; i++) list.push({ kind: 'card', id: c.id });
  });
  (state.notes || []).forEach((n) => {
    const cnt = countMatches(htmlToText(n.body), re);
    for (let i = 0; i < cnt; i++) list.push({ kind: 'note', id: n.id });
  });
  return list;
}
function flashEl(node) {
  if (!node) return;
  node.classList.remove('find-flash');
  void node.offsetWidth; // restart the animation if it's already mid-flash
  node.classList.add('find-flash');
  setTimeout(() => node.classList.remove('find-flash'), 1200);
}
function goToMatch(match) {
  if (match.kind === 'card') {
    navigateTo('manuscript');
    const body = document.getElementById('ms-body');
    const anchor = body && body.querySelector('[data-anchor="card:' + match.id + '"]');
    if (anchor) anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
    flashEl((body && body.querySelector('.ms-card-section[data-card-id="' + match.id + '"]')) || anchor);
  } else {
    notesSelId = match.id;
    navigateTo('notes');
    flashEl(document.querySelector('#page-notes .notes-editor'));
  }
}
function stepFindMatch(dir) {
  const q = document.getElementById('find-q').value;
  const re = buildFindRegex(q, findOpts());
  if (!re) return;
  const matches = buildFindMatches(re);
  if (!matches.length) { _findIdx = -1; updateFindStatus(); return; }
  _findIdx = ((_findIdx < 0 ? (dir > 0 ? -1 : 0) : _findIdx) + dir + matches.length) % matches.length;
  goToMatch(matches[_findIdx]);
  updateFindStatus();
}
function doReplaceAll() {
  if (state.readonly) return;
  const q = document.getElementById('find-q').value;
  if (!q) return;
  const rep = document.getElementById('find-r').value;
  const re = buildFindRegex(q, findOpts());
  if (!re) return;
  let total = 0;
  state.cards.forEach((c) => {
    const field = cardBodyField(c);
    const text = c[field] || '';
    const n = countMatches(text, re);
    if (!n) return;
    total += n;
    re.lastIndex = 0;
    setCardBody(c, field, text.replace(re, rep));
  });
  (state.notes || []).forEach((n) => {
    const n2 = countMatches(htmlToText(n.body), re);
    if (!n2) return;
    const newHtml = replaceInHtml(n.body, re, rep);
    if (newHtml == null) return;
    total += n2;
    n.body = newHtml;
    n.updatedAt = Date.now();
  });
  if (total > 0) {
    scheduleSave();
    if (state.page === 'manuscript') { const a = captureMsAnchor(); buildManuscriptPage(); restoreMsAnchor(a); }
    if (state.page === 'notes') buildNotesPage();
  }
  setFindStatus(total ? ('Replaced ' + total + ' match' + (total === 1 ? '' : 'es') + '.') : 'No matches found.');
}

function duplicateShowById(id) {
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    const body = JSON.stringify({ title: (d.title || 'Untitled') + ' (copy)', mode: d.mode, format: d.format || 'song', status: 'draft', updated: Date.now(), cards: d.cards || [], characters: d.characters || {}, titlePage: d.titlePage, scriptHeader: d.scriptHeader, book: d.book });
    return fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  }).then(() => loadProjects().then(buildLibraryPage));
}
function deleteShowById(id, title) {
  if (!confirm('Delete "' + (title || 'this show') + '"? This cannot be undone.')) return;
  fetch('/api/shows/' + id, { method: 'DELETE' }).then(() => {
    if (state.projectId === id) { state.projectId = null; }
    loadProjects().then(buildLibraryPage);
  });
}

// ---- Sharing --------------------------------------------------------------
let _shareId = null;
function openShareModal(id) {
  _shareId = id;
  const p = (state.projects || []).find((x) => x.id === id);
  if (!p) return;
  if (!isOwner(p)) { alert('Only the owner can change sharing.'); return; }
  const list = document.getElementById('share-list');
  list.innerHTML = '';
  const collab = p.collaborators || [];
  const others = (state.users || []).filter((u) => !state.me || u.id !== state.me.id);
  if (!others.length) {
    const isAdmin = state.me && state.me.admin;
    list.appendChild(el('div', { class: 'share-empty', text: isAdmin ? 'No other accounts yet. Invite a collaborator from the Admin page.' : 'No other accounts yet. Ask an admin to invite a collaborator.' }));
    if (isAdmin) {
      const goBtn = el('button', { class: 'pbtn', style: 'align-self:flex-start;margin-top:8px', text: 'Open Admin page' });
      goBtn.addEventListener('click', () => { closeShareModal(); navigateTo('admin'); });
      list.appendChild(goBtn);
    }
  } else {
    const roles = p.collabRoles || {};
    others.forEach((u) => {
      const row = el('div', { class: 'share-row' });
      const cbLabel = el('label', { class: 'share-cb-label' });
      const cb = el('input'); cb.type = 'checkbox'; cb.value = u.id; cb.checked = collab.indexOf(u.id) >= 0;
      cbLabel.appendChild(cb);
      cbLabel.appendChild(el('span', { class: 'share-name', text: u.name }));
      row.appendChild(cbLabel);
      // Role only matters while the collaborator is checked in — disabled
      // (but still visible) otherwise so the choice isn't lost if they
      // uncheck-then-recheck within the same modal session.
      const roleSel = el('select', { class: 'share-role' });
      roleSel.appendChild(el('option', { value: 'editor', text: 'Can edit' }));
      roleSel.appendChild(el('option', { value: 'viewer', text: 'Can view' }));
      roleSel.value = roles[u.id] === 'viewer' ? 'viewer' : 'editor';
      roleSel.disabled = !cb.checked;
      roleSel.dataset.uid = u.id;
      cb.addEventListener('change', () => { roleSel.disabled = !cb.checked; });
      row.appendChild(roleSel);
      list.appendChild(row);
    });
  }
  document.getElementById('share-modal').style.display = '';
}
function closeShareModal() { document.getElementById('share-modal').style.display = 'none'; _shareId = null; }
function saveSharing() {
  if (!_shareId) { closeShareModal(); return; }
  const ids = Array.from(document.querySelectorAll('#share-list input:checked')).map((c) => c.value);
  const roles = {};
  document.querySelectorAll('#share-list select.share-role').forEach((sel) => { if (sel.value === 'viewer') roles[sel.dataset.uid] = 'viewer'; });
  const id = _shareId;
  fetch('/api/shows/' + id + '/share', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborators: ids, roles }) })
    .then((r) => r.json()).then(() => { closeShareModal(); loadProjects().then(() => { if (state.page === 'library') buildLibraryPage(); }); })
    .catch(() => { closeShareModal(); });
}

// ---- Admin (accounts + invite links) --------------------------------------
function adminRelTime(ts) { return ts ? relTime(ts) : '—'; }

function copyToClipboard(text, btn) {
  const done = () => { if (!btn) return; const old = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = old; }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done).catch(() => prompt('Copy this link:', text)); }
  else prompt('Copy this link:', text);
}

function showInviteLinkModal(url, label) {
  const overlay = el('div', { class: 'modal-overlay' });
  const box = el('div', { class: 'modal-box' });
  box.appendChild(el('h3', { class: 'modal-title', text: label || 'Invite link created' }));
  box.appendChild(el('p', { style: 'font-size:13px;color:var(--muted);margin:0', text: 'Share this link however you like. It works once and expires automatically.' }));
  const row = el('div', { style: 'display:flex;gap:8px' });
  const input = el('input');
  input.type = 'text'; input.readOnly = true; input.value = url;
  input.style.cssText = 'flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-size:13px';
  const copyBtn = el('button', { class: 'pbtn', text: 'Copy' });
  copyBtn.addEventListener('click', () => copyToClipboard(url, copyBtn));
  row.appendChild(input); row.appendChild(copyBtn);
  box.appendChild(row);
  const btns = el('div', { class: 'modal-btns' });
  const closeBtn = el('button', { class: 'pbtn primary', text: 'Done' });
  closeBtn.addEventListener('click', () => overlay.remove());
  btns.appendChild(closeBtn);
  box.appendChild(btns);
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  input.focus(); input.select();
}

function adminApi(method, path, body) {
  const opts = { method };
  if (body !== undefined) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
  return fetch('/api/admin' + path, opts).then((r) => r.json().then((data) => { if (!r.ok) throw new Error(data.error || 'request failed'); return data; }));
}

function buildAdminPage() {
  const host = document.getElementById('page-admin');
  if (!host) return;
  host.innerHTML = '';
  if (!state.me || !state.me.admin) {
    host.appendChild(el('div', { class: 'ch-empty', text: 'Admins only.' }));
    return;
  }

  const toolbar = el('div', { class: 'ch-toolbar ribbon' });
  toolbar.appendChild(el('span', { class: 'ch-toolbar-title', text: 'Admin' }));
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  const inviteBtn = el('button', { class: 'pbtn', text: '+ Invite someone' });
  inviteBtn.addEventListener('click', () => {
    const label = prompt('Optional label for this invite (e.g. a name), or leave blank:') || '';
    adminApi('POST', '/invites', { label }).then((d) => { showInviteLinkModal(d.url, label ? ('Invite for ' + label) : 'Invite link created'); reloadInvites(); })
      .catch((e) => alert(e.message));
  });
  toolbar.appendChild(inviteBtn);
  host.appendChild(toolbar);

  const wrap = el('div', { style: 'padding:20px 24px;max-width:900px;display:flex;flex-direction:column;gap:32px' });
  host.appendChild(wrap);

  const usersSection = el('div');
  usersSection.appendChild(el('h3', { style: 'margin:0 0 10px;font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em', text: 'Accounts' }));
  const usersHost = el('div', { class: 'admin-table-host' });
  usersSection.appendChild(usersHost);
  wrap.appendChild(usersSection);

  const invitesSection = el('div');
  invitesSection.appendChild(el('h3', { style: 'margin:0 0 10px;font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em', text: 'Invite links' }));
  const invitesHost = el('div', { class: 'admin-table-host' });
  invitesSection.appendChild(invitesHost);
  wrap.appendChild(invitesSection);

  function reloadUsers() {
    adminApi('GET', '/users').then((users) => renderAdminUsers(usersHost, users)).catch((e) => {
      usersHost.innerHTML = ''; usersHost.appendChild(el('div', { class: 'ch-empty', text: e.message }));
    });
  }
  function reloadInvites() {
    adminApi('GET', '/invites').then((invites) => renderAdminInvites(invitesHost, invites)).catch((e) => {
      invitesHost.innerHTML = ''; invitesHost.appendChild(el('div', { class: 'ch-empty', text: e.message }));
    });
  }
  window.__adminReloadUsers = reloadUsers;
  window.__adminReloadInvites = reloadInvites;
  reloadUsers();
  reloadInvites();
}

function renderAdminUsers(host, users) {
  host.innerHTML = '';
  const table = el('table', { class: 'admin-table' });
  const thead = el('tr');
  ['Name', 'Created', 'Last seen', 'Shows', 'Status', ''].forEach((h) => thead.appendChild(el('th', { text: h })));
  table.appendChild(thead);
  users.forEach((u) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: u.name + (u.admin ? '  ★' : '') }));
    tr.appendChild(el('td', { text: adminRelTime(u.createdAt) }));
    tr.appendChild(el('td', { text: adminRelTime(u.lastLogin) }));
    tr.appendChild(el('td', { text: String(u.showCount) }));
    tr.appendChild(el('td', { text: u.disabled ? 'Disabled' : 'Active', class: u.disabled ? 'admin-status-disabled' : 'admin-status-active' }));
    const actions = el('td', { class: 'admin-actions' });
    const resetBtn = el('button', { class: 'pbtn', text: 'Reset link' });
    resetBtn.addEventListener('click', () => {
      adminApi('POST', '/users/' + encodeURIComponent(u.id) + '/reset-link').then((d) => showInviteLinkModal(d.url, 'Password reset for ' + u.name)).catch((e) => alert(e.message));
    });
    actions.appendChild(resetBtn);
    if (u.id !== state.me.id) {
      const toggleBtn = el('button', { class: 'pbtn' + (u.disabled ? '' : ' danger'), text: u.disabled ? 'Enable' : 'Disable' });
      toggleBtn.addEventListener('click', () => {
        if (!u.disabled && !confirm('Disable "' + u.name + '"? They will be signed out and unable to log back in until re-enabled.')) return;
        adminApi('POST', '/users/' + encodeURIComponent(u.id) + '/toggle-disabled').then(() => { if (window.__adminReloadUsers) window.__adminReloadUsers(); }).catch((e) => alert(e.message));
      });
      actions.appendChild(toggleBtn);
    }
    tr.appendChild(actions);
    table.appendChild(tr);
  });
  host.appendChild(table);
}

function renderAdminInvites(host, invites) {
  host.innerHTML = '';
  if (!invites.length) { host.appendChild(el('div', { class: 'ch-empty', text: 'No invite links yet.' })); return; }
  const table = el('table', { class: 'admin-table' });
  const thead = el('tr');
  ['Label', 'Type', 'Created', 'Status', ''].forEach((h) => thead.appendChild(el('th', { text: h })));
  table.appendChild(thead);
  invites.forEach((inv) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: inv.label || '(no label)' }));
    tr.appendChild(el('td', { text: inv.type === 'reset' ? 'Password reset' : 'New account' }));
    tr.appendChild(el('td', { text: adminRelTime(inv.createdAt) }));
    let status = 'Pending', cls = 'admin-status-active';
    if (inv.revoked) { status = 'Revoked'; cls = 'admin-status-disabled'; }
    else if (inv.usedAt) { status = 'Used'; cls = ''; }
    else if (inv.expiresAt && Date.now() > inv.expiresAt) { status = 'Expired'; cls = 'admin-status-disabled'; }
    tr.appendChild(el('td', { text: status, class: cls }));
    const actions = el('td', { class: 'admin-actions' });
    const pending = !inv.revoked && !inv.usedAt && !(inv.expiresAt && Date.now() > inv.expiresAt);
    if (pending) {
      const copyBtn = el('button', { class: 'pbtn', text: 'Copy link' });
      copyBtn.addEventListener('click', () => copyToClipboard(location.origin + '/join.html?t=' + inv.token, copyBtn));
      actions.appendChild(copyBtn);
      const revokeBtn = el('button', { class: 'pbtn danger', text: 'Revoke' });
      revokeBtn.addEventListener('click', () => {
        adminApi('DELETE', '/invites/' + inv.token).then(() => { if (window.__adminReloadInvites) window.__adminReloadInvites(); }).catch((e) => alert(e.message));
      });
      actions.appendChild(revokeBtn);
    }
    tr.appendChild(actions);
    table.appendChild(tr);
  });
  host.appendChild(table);
}

// ---- Plot Suite: app theme + waffle launcher ------------------------------
// Prose Plot re-skins Song Plot's shared substrate with a coral accent —
// active whenever you're editing/reading a prose-format show, or browsing the
// Prose Plot library (state.currentApp), even with no show open yet.
function applyAppTheme() {
  const prose = state.page === 'library' ? state.currentApp === 'prose' : state.format === 'prose';
  document.body.classList.toggle('app-prose', prose);
}
function updateWaffleLabel() {
  const nameEl = document.getElementById('tn-waffle-name');
  if (nameEl) nameEl.textContent = state.currentApp === 'prose' ? 'Prose Plot' : 'Song Plot';
}
// The waffle launcher only replaces the show-title/save-dot slot while
// browsing the Library (there's no "show" open to switch between yet); once
// a show is opened, the normal show-switcher slots back into the same place.
function applyTopbarSlot() {
  const showBtn = document.getElementById('sb-show-btn');
  const waffleBtn = document.getElementById('tn-waffle-btn');
  if (!showBtn || !waffleBtn) return;
  const onLibrary = state.page === 'library';
  showBtn.hidden = onLibrary;
  waffleBtn.hidden = !onLibrary;
}
function closeWaffleMenu() {
  const m = document.getElementById('waffle-menu');
  if (m) m.remove();
  const btn = document.getElementById('tn-waffle-btn');
  if (btn) btn.classList.remove('pop-open');
}
function toggleWaffleMenu() {
  if (document.getElementById('waffle-menu')) { closeWaffleMenu(); return; }
  const btn = document.getElementById('tn-waffle-btn');
  if (!btn) return;
  btn.classList.add('pop-open');
  const menu = el('div', { class: 'waffle-menu', id: 'waffle-menu' });
  [['song', 'Song Plot'], ['prose', 'Prose Plot']].forEach(([app, label]) => {
    const item = el('button', { class: 'waffle-item' + (state.currentApp === app ? ' active' : '') }, [
      el('span', { class: 'waffle-item-check', html: state.currentApp === app ? '✓' : '' }),
      el('span', { class: 'waffle-item-label', text: label }),
    ]);
    item.addEventListener('click', (e) => { e.stopPropagation(); closeWaffleMenu(); setCurrentApp(app); });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
}
function setCurrentApp(app) {
  if (state.currentApp === app) return;
  // On the production split, the two apps live on separate subdomains — the
  // in-page state flip alone would leave the URL (and PWA identity) pointing
  // at the wrong app, so send the browser there instead.
  if (appFromHost() && APP_HOSTS[app]) { location.href = 'https://' + APP_HOSTS[app] + '/'; return; }
  state.currentApp = app;
  updateWaffleLabel();
  applyAppTheme();
  if (state.page === 'library') buildLibraryPage();
}

function setSaveInd(s) {
  const e = document.getElementById('save-ind'); if (!e) return;
  const cls = s === 'saving' ? 'saving' : s === 'saved' ? 'saved' : s === 'ref' ? 'ref' : s === 'viewonly' ? 'viewonly' : s === 'error' ? 'err' : 'unsaved';
  e.className = 'sb-save-dot ' + cls;
  e.title = s === 'saving' ? 'Saving…' : s === 'saved' ? 'Saved' : s === 'ref' ? 'Reference · read-only' : s === 'viewonly' ? 'View only — your changes here wouldn\'t be saved' : s === 'error' ? 'Save failed' : 'Unsaved changes';
}
function renderShowBtn() {
  const nameEl = document.getElementById('sb-show-name');
  if (nameEl) nameEl.textContent = state.title || (state.showKey && (SHOWS[state.showKey] || NOVELS[state.showKey]) ? (SHOWS[state.showKey] || NOVELS[state.showKey]).title : '—');
  // Snapshots and Find & Replace apply to the user's own editable shows, not
  // read-only references.
  const snap = document.getElementById('sb-snapshots');
  if (snap) snap.hidden = !(state.projectId && !state.readonly);
  const fnd = document.getElementById('sb-find');
  if (fnd) fnd.hidden = !(state.projectId && !state.readonly);
}

function closeShowPopover() {
  const pop = document.getElementById('show-popover');
  if (pop) pop.remove();
  const btn = document.getElementById('sb-show-btn');
  if (btn) btn.classList.remove('pop-open');
}

function showShowPopover() {
  if (document.getElementById('show-popover')) { closeShowPopover(); return; }
  const btn = document.getElementById('sb-show-btn');
  if (!btn) return;
  btn.classList.add('pop-open');

  const pop = el('div', { class: 'show-popover', id: 'show-popover' });

  const closeRow = el('div', { class: 'sp-close-row' });
  closeRow.appendChild(el('span', { class: 'sp-close-label', text: 'Shows' }));
  const closeBtn = el('button', { class: 'sp-close-btn', title: 'Close' });
  closeBtn.innerHTML = '<svg viewBox="0 0 10 6" width="10" height="6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); });
  closeRow.appendChild(closeBtn);
  pop.appendChild(closeRow);

  if (state.projects && state.projects.length) {
    const recents = state.projects.filter((p) => (p.status || 'active') !== 'archived').slice(0, 5);
    pop.appendChild(el('div', { class: 'sp-label', text: 'Recent' }));
    recents.forEach((p) => {
      const row = el('div', { class: 'sp-item-row' });
      const item = el('button', { class: 'sp-item' + (state.projectId === p.id ? ' active' : '') });
      item.textContent = p.title || 'Untitled';
      item.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); openProject(p.id); });
      const dots = el('button', { class: 'sp-dots', title: 'Show settings', text: '⋯' });
      dots.addEventListener('click', (e) => {
        e.stopPropagation();
        closeShowPopover();
        if (state.projectId === p.id) {
          openShowSettingsModal();
        } else {
          openProject(p.id, () => openShowSettingsModal());
        }
      });
      row.appendChild(item);
      row.appendChild(dots);
      pop.appendChild(row);
    });
  }

  pop.appendChild(el('div', { class: 'sp-divider' }));

  const actions = el('div', { class: 'sp-actions' });
  const newBtn = el('button', { class: 'pbtn', text: '+ New' });
  newBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); openNewShowModal(); });
  const dupBtn = el('button', { class: 'pbtn', text: 'Duplicate' });
  dupBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); duplicateProject(); });
  const delBtn = el('button', { class: 'pbtn danger', text: 'Delete' });
  const curProject = (state.projects || []).find((p) => p.id === state.projectId);
  delBtn.disabled = state.readonly || (curProject ? !isOwner(curProject) : false);
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); deleteProject(); });

  [newBtn, dupBtn, delBtn].forEach((b) => actions.appendChild(b));
  pop.appendChild(actions);

  if (state.projectId && !state.readonly) {
    const snapItem = el('button', { class: 'sp-item', text: '⟲  Snapshots…' });
    snapItem.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); openSnapshotsDrawer(); });
    pop.appendChild(snapItem);
  }

  // Account / sign out
  pop.appendChild(el('div', { class: 'sp-divider' }));
  if (state.me && state.me.name) pop.appendChild(el('div', { class: 'sp-label', text: 'Signed in as ' + state.me.name }));
  if (state.me && state.me.admin) {
    const adminItem = el('button', { class: 'sp-item', text: '⚙  Admin' });
    adminItem.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); navigateTo('admin'); });
    pop.appendChild(adminItem);
  }
  const signOut = el('button', { class: 'sp-item sp-signout', text: '⏻  Sign out' });
  signOut.addEventListener('click', (e) => {
    e.stopPropagation();
    closeShowPopover();
    fetch('/api/auth/logout', { method: 'POST' }).then(() => { window.location.href = '/login.html'; }).catch(() => { window.location.href = '/login.html'; });
  });
  pop.appendChild(signOut);

  document.body.appendChild(pop);
}

// ---- Snapshots (whole-show version history) ------------------------------
function snapApi(method, sub, body) {
  const opts = { method };
  if (body !== undefined) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
  return fetch('/api/shows/' + state.projectId + '/snapshots' + (sub || ''), opts).then((r) => r.json());
}
function snapRelTime(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return m + ' min' + (m > 1 ? 's' : '') + ' ago';
  const h = Math.floor(m / 60); if (h < 24) return h + ' hour' + (h > 1 ? 's' : '') + ' ago';
  const dd = Math.floor(h / 24); if (dd === 1) return 'yesterday';
  if (dd < 7) return dd + ' days ago';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function snapDefaultLabel() {
  return new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function saveSnapshot(label, cb) {
  if (state.readonly || !state.projectId) return;
  // snapApi stringifies the body synchronously, so live nested refs are safe.
  snapApi('POST', '', { label: label || '', data: serializeData() }).then((m) => cb && cb(m)).catch(() => {});
}
function restoreSnapshot(snapId) {
  if (state.readonly || !state.projectId) return;
  // Non-destructive: checkpoint the current state first, then load the chosen one.
  snapApi('POST', '', { label: 'Before restore', data: serializeData() })
    .then(() => snapApi('GET', '/' + snapId))
    .then((snap) => {
      if (!snap || !snap.data) return;
      state.loading = true;
      applyShowData(snap.data);
      state.loading = false;
      render();
      doSave(); // persist the restored version as the live show
      closeSnapshotsDrawer();
      setSaveInd('saved');
    }).catch(() => {});
}
function closeSnapshotsDrawer() {
  const d = document.getElementById('snap-drawer'); if (d) d.remove();
  const ov = document.getElementById('snap-overlay'); if (ov) ov.remove();
}
function openSnapshotsDrawer() {
  closeShowPopover();
  if (document.getElementById('snap-drawer')) { closeSnapshotsDrawer(); return; }
  if (state.readonly || !state.projectId) return;

  const overlay = el('div', { class: 'snap-overlay', id: 'snap-overlay' });
  overlay.addEventListener('click', closeSnapshotsDrawer);
  document.body.appendChild(overlay);

  const drawer = el('div', { class: 'snap-drawer', id: 'snap-drawer' });
  const head = el('div', { class: 'snap-head' });
  head.appendChild(el('span', { class: 'snap-title', text: '⟲  Snapshots' }));
  const saveBtn = el('button', { class: 'pbtn primary snap-save-btn', text: '+ Save snapshot' });
  saveBtn.addEventListener('click', () => {
    const label = prompt('Name this snapshot:', snapDefaultLabel());
    if (label === null) return;
    saveSnapshot(label.trim() || snapDefaultLabel(), renderSnapList);
  });
  head.appendChild(saveBtn);
  const xBtn = el('button', { class: 'snap-close xclose', text: '✕', title: 'Close' });
  xBtn.addEventListener('click', closeSnapshotsDrawer);
  head.appendChild(xBtn);
  drawer.appendChild(head);

  const reassure = el('div', { class: 'snap-reassure', text: 'Restoring saves your current version first — nothing is ever lost.' });
  drawer.appendChild(reassure);

  const list = el('div', { class: 'snap-list' });
  drawer.appendChild(list);
  document.body.appendChild(drawer);

  function renderSnapList() {
    snapApi('GET', '').then((snaps) => {
      list.innerHTML = '';
      if (!snaps || !snaps.length) {
        list.appendChild(el('div', { class: 'snap-empty', text: 'No snapshots yet. Save one before a big change.' }));
        return;
      }
      snaps.forEach((s) => list.appendChild(snapRow(s)));
    }).catch(() => {});
  }
  function snapRow(s) {
    const isAuto = s.kind === 'auto';
    const row = el('div', { class: 'snap-row' });
    const top = el('div', { class: 'snap-row-top' });
    if (isAuto) top.appendChild(el('span', { class: 'snap-badge', text: 'Auto' }));
    top.appendChild(el('span', { class: 'snap-label', text: s.label || (isAuto ? 'Automatic checkpoint' : snapDefaultLabel()) }));
    top.appendChild(el('span', { class: 'snap-time', text: snapRelTime(s.ts) }));
    row.appendChild(top);
    const actions = el('div', { class: 'snap-actions' });
    const restore = el('button', { class: 'snap-restore', text: '⟲ Restore' });
    restore.addEventListener('click', () => {
      if (confirm('Restore "' + (s.label || 'this snapshot') + '"?\n\nYour current version will be snapshotted first, so this is safe.')) restoreSnapshot(s.id);
    });
    actions.appendChild(restore);
    if (!isAuto) {
      const rename = el('button', { class: 'snap-act', text: 'Rename' });
      rename.addEventListener('click', () => {
        const nl = prompt('Rename snapshot:', s.label || '');
        if (nl === null) return;
        snapApi('PUT', '/' + s.id, { label: nl.trim() }).then(renderSnapList).catch(() => {});
      });
      actions.appendChild(rename);
    }
    // Deleting a snapshot is owner-only (server enforces this too) — a
    // collaborator shouldn't be able to erase the owner's version history.
    const curProject = (state.projects || []).find((p) => p.id === state.projectId);
    if (!curProject || isOwner(curProject)) {
      const del = el('button', { class: 'snap-act danger', text: 'Delete' });
      del.addEventListener('click', () => {
        if (confirm('Delete this snapshot? This can’t be undone.')) snapApi('DELETE', '/' + s.id).then(renderSnapList).catch(() => {});
      });
      actions.appendChild(del);
    }
    row.appendChild(actions);
    return row;
  }
  renderSnapList();
}

function openShowSettingsModal() {
  document.getElementById('ssm-title').value = state.title || '';
  const currentMode = state.mode === 'oneact' ? 'oneact' : 'full';
  document.querySelectorAll('#ssm-mode-seg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === currentMode));
  const currentStatus = state.status || 'active';
  document.querySelectorAll('#ssm-status-seg button').forEach((b) => b.classList.toggle('active', b.dataset.status === currentStatus));
  const shareBtn = document.getElementById('ssm-share');
  if (shareBtn) shareBtn.style.display = (state.projectId && !state.readonly && isOwner({ owner: (state.projects.find((p) => p.id === state.projectId) || {}).owner })) ? '' : 'none';
  const saveBtn = document.getElementById('ssm-save');
  const titleInput = document.getElementById('ssm-title');
  const modeSeg = document.getElementById('ssm-mode-seg');
  if (state.readonly) {
    titleInput.disabled = true;
    modeSeg.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    saveBtn.disabled = true;
  } else {
    titleInput.disabled = false;
    modeSeg.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    saveBtn.disabled = false;
  }
  document.getElementById('show-settings-modal').style.display = '';
  setTimeout(() => titleInput.focus(), 50);
}
function closeShowSettingsModal() {
  document.getElementById('show-settings-modal').style.display = 'none';
}
function saveShowSettings() {
  if (state.readonly) { closeShowSettingsModal(); return; }
  const title = document.getElementById('ssm-title').value.trim() || state.title || 'Untitled show';
  const activeBtn = document.querySelector('#ssm-mode-seg button.active');
  const mode = activeBtn ? activeBtn.dataset.mode : state.mode;
  const statusBtn = document.querySelector('#ssm-status-seg button.active');
  const status = statusBtn ? statusBtn.dataset.status : (state.status || 'active');
  state.title = title;
  state.mode = mode;
  state.status = status;
  closeShowSettingsModal();
  renderShowBtn();
  scheduleSave();
  render();
}

let _nsmMode = 'full';
function openNewShowModal() {
  const isProse = state.currentApp === 'prose';
  // Novels have no intermission to speak of, so Prose Plot skips the length
  // choice entirely and just defaults to the one-act (no-intermission) model.
  _nsmMode = isProse ? 'oneact' : 'full';
  document.getElementById('nsm-title').value = '';
  document.getElementById('nsm-title').placeholder = isProse ? 'My Novel' : 'My Musical';
  document.getElementById('nsm-mode-row').hidden = isProse;
  document.getElementById('nsm-modal-title').textContent = isProse ? 'New novel' : 'New show';
  document.getElementById('nsm-create').textContent = isProse ? 'Create novel' : 'Create show';
  document.querySelectorAll('#nsm-mode-seg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === _nsmMode));
  document.getElementById('new-show-modal').style.display = '';
  setTimeout(() => document.getElementById('nsm-title').focus(), 50);
}
function closeNewShowModal() {
  document.getElementById('new-show-modal').style.display = 'none';
}
function createProject(title, mode) {
  const isProse = state.currentApp === 'prose';
  const template = isProse ? PROSE_TEMPLATE : DEFAULT_TEMPLATE;
  const body = JSON.stringify({ title, mode, format: state.currentApp, wordTarget: isProse ? 75000 : 0, cards: template.map((c) => Object.assign({}, c)), updated: Date.now() });
  fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    .then((r) => r.json()).then((d) => loadProjects().then(() => openProject(d.id)));
}

function displayOrder() {
  const order = [];
  LANE_KEYS.forEach((a) => state.cards.forEach((c, i) => { if (c.act === a) order.push(i); }));
  return order;
}
function lastIndexOfAct(act) {
  let last = -1;
  state.cards.forEach((c, i) => { if (c.act === act) last = i; });
  if (last >= 0) return last;
  const li = LANE_KEYS.indexOf(act);
  for (let p = li - 1; p >= 0; p--) { let l = -1; state.cards.forEach((c, i) => { if (c.act === LANE_KEYS[p]) l = i; }); if (l >= 0) return l; }
  return -1;
}
// Default card shapes, shared by the board's insertCard and the Manuscript
// quick-create paths (Navigator gap "+", /song slash command). An explicit
// title overrides the default one.
function makeNewCard(type, act, title) {
  // In Prose Plot a "scene" card is a chapter — title it "Chapter N" (one past
  // the current highest chapter number) rather than "Scene 1".
  const sceneTitle = state.format === 'prose'
    ? 'Chapter ' + (state.cards.filter((c) => c.type === 'scene').length + 1)
    : 'Scene 1';
  const card = type === 'song'
    ? { id: uid(), type: 'song', act, title: 'New song', fn: 'ballad', voicing: '', min: 3, status: 'idea', purpose: '', change: null }
    : type === 'scene'
    ? { id: uid(), type: 'scene', act, title: sceneTitle, note: '', min: 0 }
    : { id: uid(), type: 'beat', act, title: 'New beat', note: '', lyrics: '', min: 1.5, change: null };
  if (title) card.title = title;
  return card;
}
function insertCard(act, type) {
  const card = makeNewCard(type, act);
  state.cards.splice(lastIndexOfAct(act) + 1, 0, card);
  state.openAct = null;
  if (type === 'beat' && state.view === 'songs') state.view = 'full';
  render();
  // Seamless: a new card lands with its title focused for typing right on the board.
  // Scenes have no inline title (vertical), so they open the editor instead.
  if (!focusCardTitle(card.id)) openLyricWindow(card.id);
}
// Positioned insert — the board's inline "+" gap picker drops a card at an exact
// spot, not just the end of the act. Mirrors insertCard but splices relative to a
// neighbor card index instead of lastIndexOfAct.
function insertCardAt(refIdx, where, type) {
  const ref = state.cards[refIdx];
  if (!ref) return;
  const card = makeNewCard(type, ref.act);
  state.cards.splice(refIdx + (where === 'after' ? 1 : 0), 0, card);
  state.openAct = null;
  if (type === 'beat' && state.view === 'songs') state.view = 'full';
  render();
  // Same landing as insertCard: title focused on the board, or the editor for
  // scenes (no inline title).
  if (!focusCardTitle(card.id)) openLyricWindow(card.id);
}
function moveCard(from, to, newAct) {
  const moved = state.cards.splice(from, 1)[0];
  moved.act = newAct;
  let t = to;
  if (from < to) t -= 1;
  state.cards.splice(t, 0, moved);
}

// Inline between-card insert affordance for the board — a thin hover "+" in the
// gap to a card's left, opening a tiny type picker (mirrors the Manuscript
// Navigator's quick-add). Nothing shows until hover, so the board stays clean.
let _boardPicker = null;
function closeBoardPicker() {
  if (!_boardPicker) return;
  _boardPicker.zone.classList.remove('picking');
  _boardPicker.picker.remove();
  document.removeEventListener('mousedown', _boardPickerDoc, true);
  _boardPicker = null;
}
function _boardPickerDoc(e) {
  if (_boardPicker && !_boardPicker.zone.contains(e.target)) closeBoardPicker();
}
function boardInsertZone(refIdx) {
  const isProse = state.format === 'prose';
  const zone = el('div', { class: 'board-ins', title: 'Insert a card here' }, [
    el('div', { class: 'board-ins-line' }, [el('span', { class: 'board-ins-plus', text: '+' })]),
  ]);
  zone.setAttribute('draggable', 'false');
  zone.addEventListener('mousedown', (e) => e.stopPropagation()); // never start a card drag
  zone.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_boardPicker && _boardPicker.zone === zone) { closeBoardPicker(); return; }
    closeBoardPicker();
    const opt = (t, icon, label) => {
      const b = el('button', { class: 'board-ins-opt', type: 'button' }, [
        el('span', { class: 'board-ins-opt-icon', text: icon }),
        el('span', { text: label }),
      ]);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); closeBoardPicker(); insertCardAt(refIdx, 'before', t); });
      return b;
    };
    const picker = el('div', { class: 'board-ins-picker' }, isProse ? [
      opt('scene', '◆', 'Chapter'), opt('beat', '▸', 'Beat'),
    ] : [
      opt('song', '♪', 'Song'), opt('beat', '▸', 'Beat'), opt('scene', '◆', 'Scene'),
    ]);
    zone.classList.add('picking');
    zone.appendChild(picker);
    _boardPicker = { zone, picker };
    document.addEventListener('mousedown', _boardPickerDoc, true);
  });
  return zone;
}

function percentages() {
  const order = displayOrder();
  const total = order.reduce((s, i) => s + (state.cards[i].min || 0), 0) || 1;
  let cum = 0; const pct = {};
  order.forEach((i) => { const c = state.cards[i]; const mid = cum + (c.min || 0) / 2; cum += (c.min || 0); pct[i] = Math.round((mid / total) * 100); });
  return pct;
}


// ---- cards ----
// Beats carry a freeform story-function label (e.g. "Inciting Incident", "Dark
// Night of the Soul") — the beat analogue of a song's function pill, but typed
// straight onto the card rather than chosen from a fixed taxonomy.
function makeBeatFnPill(c) {
  const val = (c.beatFn || '').trim();
  if (state.readonly) return el('span', { class: 'pill beat-pill', text: val || 'Beat' });
  const pill = el('span', { class: 'pill beat-pill beat-fn' + (val ? '' : ' empty'), text: val });
  pill.setAttribute('contenteditable', 'true');
  pill.setAttribute('spellcheck', 'false');
  pill.title = 'Beat function — type the story beat (e.g. Inciting Incident)';
  // When empty, the placeholder is a ::before pseudo-element with no real text
  // node, so clicking it can't place a caret and the click falls through to the
  // card. Focus the pill ourselves so a click anywhere on "+ Beat" starts typing.
  pill.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (!pill.textContent.trim()) { e.preventDefault(); pill.focus(); }
  });
  pill.addEventListener('click', (e) => e.stopPropagation());
  pill.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); pill.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); pill.textContent = c.beatFn || ''; pill.blur(); }
  });
  pill.addEventListener('blur', () => {
    const v = pill.textContent.replace(/\s+/g, ' ').trim();
    pill.textContent = v;
    pill.classList.toggle('empty', !v);
    if (v !== (c.beatFn || '')) { c.beatFn = v; scheduleSave(); }
  });
  return pill;
}

// Inline-edit a card-face element (title, voicing, note) in place. Saves on blur,
// commits on Enter, reverts on Escape. Guards against starting a drag while editing.
function makeCardEditable(elm, getter, setter, placeholder) {
  if (state.readonly) return elm;
  elm.classList.add('cardedit');
  elm.setAttribute('spellcheck', 'false');
  if (placeholder) elm.setAttribute('data-ph', placeholder);
  // Editable on demand: the field stays non-editable so the whole card surface
  // can be dragged. A plain click (not a drag, which never reaches click) turns
  // on editing; stopPropagation keeps the card's open-editor handler from firing.
  elm.addEventListener('click', (e) => {
    e.stopPropagation();
    if (elm.getAttribute('contenteditable') !== 'true') {
      elm.setAttribute('contenteditable', 'true');
      elm.focus();
    }
  });
  elm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); elm.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); elm.textContent = getter() || ''; elm.blur(); }
  });
  elm.addEventListener('blur', () => {
    const v = elm.textContent.replace(/\s+/g, ' ').trim();
    elm.textContent = v;
    elm.removeAttribute('contenteditable');
    if (v !== (getter() || '')) { setter(v); scheduleSave(); }
  });
  return elm;
}

// Song function pill that doubles as a picker: a transparent native <select>
// overlays the pill so a click opens the OS dropdown — no custom popover needed.
function makeFnPicker(c) {
  const meta = FN[c.fn] || FN.ballad;
  const pill = el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label });
  if (state.readonly) return pill;
  const sel = el('select', { class: 'pill-select', title: 'Song function' });
  Object.entries(FN).forEach(([k, v]) => { const o = el('option', { value: k, text: v.label }); if (k === c.fn) o.setAttribute('selected', 'selected'); sel.appendChild(o); });
  sel.value = c.fn;
  sel.addEventListener('mousedown', (e) => e.stopPropagation());
  sel.addEventListener('click', (e) => e.stopPropagation());
  sel.addEventListener('change', (e) => {
    e.stopPropagation();
    c.fn = sel.value; scheduleSave();
    const m = FN[c.fn] || FN.ballad;
    pill.textContent = m.label; pill.setAttribute('data-fam', m.fam);
  });
  return el('span', { class: 'pill-wrap' }, [pill, sel]);
}

// Focus a freshly-created card's inline title for immediate typing. Returns false
// when the card has no editable title (scenes), so the caller can open the editor.
function focusCardTitle(id) {
  // .cardedit marks a title wired up by makeCardEditable (song/beat titles);
  // it only gets contenteditable="true" on click, so a fresh card needs that
  // turned on here rather than checking for it.
  const t = document.querySelector('.bcard[data-id="' + id + '"] .title.cardedit');
  if (!t) return false;
  t.setAttribute('contenteditable', 'true');
  t.focus();
  const range = document.createRange(); range.selectNodeContents(t);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(range);
  return true;
}

// A small labeled chooser anchored under a card-face control. One click sets the
// value — replaces the old Details dropdowns for Status and Scene change.
function closeMiniPopover() { const p = document.getElementById('mini-pop'); if (p) p.remove(); }
function openMiniPopover(anchor, items, currentKey, onPick) {
  closeMiniPopover();
  const pop = el('div', { class: 'minipop', id: 'mini-pop' });
  items.forEach((it) => {
    const row = el('button', { class: 'minipop-item' + (it.key === currentKey ? ' active' : ''), type: 'button' });
    if (it.color) row.appendChild(el('span', { class: 'minipop-dot', style: 'background:' + it.color }));
    else if (it.sym != null) row.appendChild(el('span', { class: 'minipop-sym ' + (it.cls || ''), text: it.sym }));
    row.appendChild(el('span', { text: it.label }));
    row.addEventListener('click', (e) => { e.stopPropagation(); closeMiniPopover(); onPick(it.key); });
    pop.appendChild(row);
  });
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  let left = r.left, top = r.bottom + 4;
  if (left + pr.width > window.innerWidth - 8) left = window.innerWidth - pr.width - 8;
  if (top + pr.height > window.innerHeight - 8) top = r.top - pr.height - 4;
  pop.style.left = Math.max(8, left) + 'px';
  pop.style.top = Math.max(8, top) + 'px';
}

// Clickable status dot for a song card — cycles through the labeled STATUS set.
function statusControl(c) {
  const key = STATUS[c.status] ? c.status : 'idea';
  const meta = STATUS[key];
  const dot = el('span', { class: 'statusdot click', style: 'background:' + meta.c, title: 'Status: ' + statusLabel(c, key) + ' — click to change' });
  dot.addEventListener('click', (e) => {
    e.stopPropagation();
    openMiniPopover(dot, Object.entries(STATUS).map(([k, v]) => ({ key: k, label: statusLabel(c, k), color: v.c })),
      c.status || 'idea', (key) => { c.status = key; scheduleSave(); render(); });
  });
  return dot;
}

// Clickable scene-change chip — always present (faint when none) so it can be set.
function changeControl(c) {
  const cur = c.change || '';
  const meta = CHANGE_OPTS.find((o) => o.key === cur) || CHANGE_OPTS[0];
  const cls = cur === 'positive' ? 'pos' : cur === 'negative' ? 'neg' : 'none';
  const chip = el('span', { class: 'change-badge click ' + cls, text: meta.sym, title: 'Scene change: ' + meta.label + ' — click to change' });
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    openMiniPopover(chip, CHANGE_OPTS.map((o) => ({ key: o.key, label: o.label, sym: o.sym, cls: o.key === 'positive' ? 'pos' : o.key === 'negative' ? 'neg' : 'none' })),
      cur, (key) => { c.change = key || null; scheduleSave(); render(); });
  });
  return chip;
}

function buildCard(c, trueIdx, pct) {
  const top = el('div', { class: 'top' });
  if (c.type === 'song') {
    top.appendChild(makeFnPicker(c));
    top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
  } else if (c.type === 'beat') {
    top.appendChild(makeBeatFnPill(c));
    if (state.format === 'prose' && c.wordTarget) {
      const n = countWords(c[cardBodyField(c)] || '');
      top.appendChild(el('span', { class: 'pct' + (n >= c.wordTarget ? ' pct-hit' : ''), text: n.toLocaleString() + ' / ' + c.wordTarget.toLocaleString() }));
    } else {
      top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
    }
  }

  const kids = c.type === 'scene' ? [] : [top];
  if (c.type === 'song') {
    kids.push(makeCardEditable(el('div', { class: 'title', text: c.title }), () => c.title, (v) => { c.title = v; }, 'Untitled'));
    kids.push(makeCardEditable(el('div', { class: 'sub', text: c.purpose || '' }), () => c.purpose, (v) => { c.purpose = v; }, 'why does this sing…'));
    kids.push(el('div', { class: 'foot' }, [changeControl(c), makeCardEditable(el('span', { class: 'conflict', text: c.conflict || '' }), () => c.conflict, (v) => { c.conflict = v; }, '+ Conflict'), statusControl(c)]));
  } else if (c.type === 'scene') {
    kids.push(el('div', { class: 'title scene-title', text: c.title }));
    if (state.readonly && c.words) kids.push(el('div', { class: 'sub', text: '~' + c.words.toLocaleString() + ' words' }));
    const readBtn = el('button', { class: 'scene-read-btn', title: 'Read this scene' }, [el('span', { text: '▶' })]);
    readBtn.addEventListener('click', (e) => { e.stopPropagation(); openManuscript(c.id); });
    kids.push(readBtn);
  } else {
    kids.push(makeCardEditable(el('div', { class: 'title', text: c.title }), () => c.title, (v) => { c.title = v; }, 'Untitled'));
    kids.push(makeCardEditable(el('div', { class: 'sub note', text: c.note || '' }), () => c.note, (v) => { setCardBody(c, 'note', v); }, 'add a note…'));
    kids.push(el('div', { class: 'foot' }, [changeControl(c), makeCardEditable(el('span', { class: 'conflict', text: c.conflict || '' }), () => c.conflict, (v) => { c.conflict = v; }, '+ Conflict'), statusControl(c)]));
  }

  const card = el('div', { class: 'bcard' + (c.type === 'beat' ? ' beat' : '') + (c.type === 'scene' ? ' scene' : ''), draggable: 'true', 'data-pos': trueIdx, 'data-id': c.id }, kids);
  card.addEventListener('click', (e) => { if (!card.classList.contains('justdragged')) openLyricWindow(c.id); });
  wireCardDrag(card);
  // Between-card insert: a hover "+" in the gap to this card's left inserts a new
  // card before it. Absolutely positioned so it never disturbs the lane's flex flow.
  if (!state.readonly) card.appendChild(boardInsertZone(trueIdx));
  return card;
}

function wireCardDrag(card) {
  card.addEventListener('dragstart', (e) => {
    if (e.target.isContentEditable || e.target.tagName === 'SELECT') { e.preventDefault(); return; } // editing a field, not dragging
    state.dragFrom = +card.dataset.pos;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.pos);
  });
  card.addEventListener('dragend', () => {
    card.classList.add('justdragged');
    setTimeout(() => card.classList.remove('justdragged'), 0);
    card.classList.remove('dragging');
    document.querySelectorAll('.bcard').forEach((r) => r.classList.remove('drop-before', 'drop-after'));
    document.querySelectorAll('.actcards').forEach((a) => a.classList.remove('dragover'));
  });
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    const pos = +card.dataset.pos;
    const before = e.offsetX < card.offsetWidth / 2;
    card.classList.toggle('drop-before', before && pos !== state.dragFrom);
    card.classList.toggle('drop-after', !before && pos !== state.dragFrom);
  });
  card.addEventListener('dragleave', () => card.classList.remove('drop-before', 'drop-after'));
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const from = state.dragFrom;
    let to = +card.dataset.pos;
    const targetAct = state.cards[to].act;
    const before = e.offsetX < card.offsetWidth / 2;
    if (from == null) return;
    to = before ? to : to + 1;
    moveCard(from, to, targetAct);
    state.dragFrom = null;
    render();
  });
}

function wireLaneDrop(lane, act) {
  lane.addEventListener('dragover', (e) => { e.preventDefault(); lane.classList.add('dragover'); });
  lane.addEventListener('dragleave', (e) => { if (e.target === lane) lane.classList.remove('dragover'); });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    if (state.dragFrom == null) return;
    moveCard(state.dragFrom, lastIndexOfAct(act) + 1, act);
    state.dragFrom = null;
    render();
  });
}

function addTile(act) {
  const btn = el('button', { class: 'addbtn', text: '+', title: 'Add to this act' });
  // Prose Plot has no songs — offer Chapter (a scene card) + Beat instead.
  const isProse = state.format === 'prose';
  const menu = el('div', { class: 'addmenu' + (state.openAct === act ? ' open' : '') }, isProse ? [
    el('button', { text: '◆  Chapter' }),
    el('button', { text: '▸  Beat' }),
  ] : [
    el('button', { text: '♪  Song' }),
    el('button', { text: '▸  Beat' }),
    el('button', { text: '≡  Scene' }),
  ]);
  if (isProse) {
    menu.children[0].addEventListener('click', (e) => { e.stopPropagation(); insertCard(act, 'scene'); });
    menu.children[1].addEventListener('click', (e) => { e.stopPropagation(); insertCard(act, 'beat'); });
    btn.addEventListener('click', (e) => { e.stopPropagation(); state.openAct = state.openAct === act ? null : act; render(); });
    return el('div', { class: 'addtile' }, [btn, menu]);
  }
  menu.children[0].addEventListener('click', (e) => { e.stopPropagation(); insertCard(act, 'song'); });
  menu.children[1].addEventListener('click', (e) => { e.stopPropagation(); insertCard(act, 'beat'); });
  menu.children[2].addEventListener('click', (e) => { e.stopPropagation(); insertCard(act, 'scene'); });
  btn.addEventListener('click', (e) => { e.stopPropagation(); state.openAct = state.openAct === act ? null : act; render(); });
  return el('div', { class: 'addtile' }, [btn, menu]);
}

function buildBoard() {
  const wrap = el('div', { class: 'acts' });
  const pct = percentages();
  const order = displayOrder();
  LANES.forEach((L) => {
    if (L.key === '2B') {
      const label = state.mode === 'full' ? 'Intermission' : 'Midpoint';
      wrap.appendChild(el('div', { class: 'laneint' + (state.mode === 'full' ? ' interm' : '') }, [el('span', { text: label })]));
    }
    const lane = el('div', { class: 'actcards' });
    wireLaneDrop(lane, L.key);
    order.forEach((i) => {
      const c = state.cards[i];
      if (c.act !== L.key) return;
      // "Songs only" is Song Plot's filter; Prose Plot has no songs, so the
      // same toggle repurposes to "Chapters only" (scene cards) instead.
      if (state.view === 'songs' && c.type !== (state.format === 'prose' ? 'scene' : 'song')) return;
      lane.appendChild(buildCard(c, i, pct[i]));
    });
    if (!state.readonly) lane.appendChild(addTile(L.key));
    wrap.appendChild(el('div', { class: 'actband' }, [el('div', { class: 'actlabel' }, [el('span', { text: L.label })]), lane]));
  });
  return wrap;
}

// ---- detail drawer ----
function field(label, control, note) {
  const kids = [el('span', { class: 'fl', text: label }), control];
  if (note) kids.push(el('span', { class: 'dnote', text: note }));
  return el('div', { class: 'fld' }, kids);
}
function textInput(field, val, on) {
  const i = el('input', { class: 'fi', type: 'text', 'data-field': field });
  i.value = val || '';
  i.addEventListener('input', () => on(i.value));
  return i;
}
function numInput(val, on) {
  const i = el('input', { class: 'fi', type: 'number', step: '0.5', min: '0' });
  i.value = val;
  i.addEventListener('input', () => on(parseFloat(i.value) || 0));
  return i;
}
function selectInput(opts, val, on) {
  const s = el('select', { class: 'fi' });
  opts.forEach(([v, l]) => { const o = el('option', { value: v, text: l }); if (v === val) o.setAttribute('selected', 'selected'); s.appendChild(o); });
  s.value = val;
  s.addEventListener('change', () => on(s.value));
  return s;
}
function textareaInput(val, on, ph) {
  const t = el('textarea', { class: 'ft', placeholder: ph || '' });
  t.value = val || '';
  t.addEventListener('input', () => on(t.value));
  return t;
}
function checkInput(val, on, label) {
  const box = el('input', { type: 'checkbox' });
  box.checked = !!val;
  box.addEventListener('change', () => on(box.checked));
  return el('label', { class: 'check' }, [box, el('span', { text: label })]);
}

function commit() { render(); }

// ---- lyric bench ----
function lastNonEmptyLine(text) {
  const lines = (text || '').split('\n').filter((l) => l.trim());
  return lines.length ? lines[lines.length - 1] : '';
}
// Verse-length check, rendered as amber syllable counts in the editor gutter
// (it used to be a sentence in a sidebar card, which cost a whole zone to
// mostly say "all clear"). Runs of sung lines (broken by blanks, cues, or
// sections) are verses; each verse is compared line-by-line against the
// nearest EARLIER verse with the same number of lines — verse against verse,
// chorus against chorus. Comparing everything against verse 1 (the old rule)
// flagged every chorus line as a "mismatch" with a differently-shaped verse.
// Returns tokenIndex -> expected syllable count for the lines that diverge.
function verseMismatches(tokens) {
  const verses = [];
  let cur = [];
  const flush = () => { if (cur.length >= 2) verses.push(cur); cur = []; };
  tokens.forEach((tok, i) => {
    if (tok.type === 'sung') cur.push({ i, s: LYRIC.lineSyll(tok.text) });
    else if (tok.type === 'blank' || tok.type === 'cue' || tok.type === 'section') flush();
  });
  flush();
  const marks = new Map();
  for (let v = 1; v < verses.length; v++) {
    let ref = null;
    for (let p = v - 1; p >= 0; p--) if (verses[p].length === verses[v].length) { ref = verses[p]; break; }
    if (!ref) continue; // one-of-a-kind shape (a bridge, a tag) — nothing to hold it to
    for (let k = 0; k < verses[v].length; k++) {
      if (verses[v][k].s !== ref[k].s) marks.set(verses[v][k].i, ref[k].s);
    }
  }
  return marks;
}
// ---- lyric parser ----
// Plain text is context-sensitive: after a @cue or sung/dialogue line = spoken dialogue
// (small indent); standalone between action paragraphs = stage action (right-shifted).
// A bare ALL-CAPS line reads as a character cue — no leading @ required. A
// trailing parenthetical (e.g. "WIDGET (sings)" or "WIDGET (CONT'D)") is allowed.
function looksLikeCue(t) {
  const base = t.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (!base || base.length > 40) return false;
  if (!/[A-Za-z]/.test(base)) return false;          // needs at least one letter
  return base === base.toUpperCase() && !/[a-z]/.test(base);
}
// Split a cue label into its name + sung/spoken mode. A trailing (sings)/(spoken)
// parenthetical overrides the block; otherwise it inherits the card default.
// Other parentheticals (e.g. (CONT'D)) are kept as part of the name.
function splitCueMode(label, defaultSung) {
  let sung = !!defaultSung, name = label;
  const m = label.match(/\(([^)]*)\)\s*$/);
  if (m) {
    const tag = m[1].trim().toLowerCase();
    if (/^(sung|sings|singing|sing)$/.test(tag)) { sung = true; name = label.slice(0, m.index).trim(); }
    else if (/^(spoken|speaks|speaking|speak|said)$/.test(tag)) { sung = false; name = label.slice(0, m.index).trim(); }
  }
  return { name, sung };
}

// Classify a single raw line in context. `ctx = { inCharBlock, blockSung }`
// carries the running block state the same way parseLyricLines' loop locals
// did; the returned `ctx` is the state to hand to the *next* line. Split out
// of parseLyricLines so the rich editor's inference engine can classify one
// line on demand (replaying prior context) without a parallel classifier that
// could drift from the canonical parse. Behavior must stay byte-identical to
// the original inline loop — parseLyricLines below is now a thin wrapper.
function classifyLyricLine(ln, ctx, defaultSung) {
  let { inCharBlock, blockSung } = ctx;
  const t = ln.trim();
  if (!t) return { tok: { type: 'blank', text: '' }, ctx: { inCharBlock: false, blockSung } };
  if (/^\*{3,}$/.test(t)) return { tok: { type: 'scenebreak', text: t }, ctx: { inCharBlock: false, blockSung } };
  if (/^\[.+\]$/.test(t)) {
    const inner = t.slice(1, -1);
    let subtype = 'section';
    if (/^act[\s\d]/i.test(inner)) subtype = 'act';
    else if (/^scene[\s\d]/i.test(inner)) subtype = 'scene';
    else if (/^#\d+[\s\-]/i.test(inner)) subtype = 'song-num';
    return { tok: { type: 'section', subtype, text: inner }, ctx: { inCharBlock: false, blockSung } };
  }
  // Fountain dual-dialogue marker: a trailing ^ means "simultaneous with the
  // previous cue" — the two render side by side. Strip it before classifying.
  let dual = false, body = t;
  if (/\s*\^$/.test(t)) { dual = true; body = t.replace(/\s*\^\s*$/, '').trim(); }
  if (/^@.+/.test(body)) {
    const { name, sung } = splitCueMode(body.slice(1).trim(), defaultSung);
    return { tok: { type: 'cue', text: name, dual }, ctx: { inCharBlock: true, blockSung: sung } };
  }
  if (/^~/.test(t)) return { tok: { type: 'sung', text: t.slice(1).trim() }, ctx: { inCharBlock: true, blockSung } }; // ~ forces this line only
  if (/^!/.test(t)) return { tok: { type: 'action', text: t.slice(1).trim() }, ctx: { inCharBlock: false, blockSung } }; // ! forces action (Fountain), closing the block
  if (/^\(.*\)$/.test(t)) return { tok: { type: 'paren', text: t }, ctx: { inCharBlock, blockSung } };
  // Implicit cue: an ALL-CAPS line that opens a block (Fountain convention —
  // a blank line or section/cue must precede it, so caps lyrics aren't eaten).
  if (!inCharBlock && looksLikeCue(body)) {
    const { name, sung } = splitCueMode(body, defaultSung);
    return { tok: { type: 'cue', text: name, dual }, ctx: { inCharBlock: true, blockSung: sung } };
  }
  if (inCharBlock) return { tok: (blockSung ? { type: 'sung', text: t } : { type: 'dialogue', text: ln }), ctx: { inCharBlock, blockSung } };
  return { tok: { type: 'action', text: ln }, ctx: { inCharBlock, blockSung } };
}
// Classify each text line into exactly one token (1:1 with input lines, so the
// result can drive the syllable gutter and rhyme tools as well as rendering).
// `defaultSung` decides whether unmarked lines in a character block are sung
// (songs) or spoken dialogue (beats/scenes). Legacy @cue / ~sung markers still
// parse, so older shows are unaffected.
function parseLyricLines(text, defaultSung) {
  const out = [];
  let ctx = { inCharBlock: false, blockSung: !!defaultSung };
  for (const ln of (text || '').split('\n')) {
    const { tok, ctx: next } = classifyLyricLine(ln, ctx, defaultSung);
    out.push(tok);
    ctx = next;
  }
  return out;
}

// ---- Structured line model (Phase 10 foundation, §13b) -------------------
// A card's libretto round-trips between the seamless CAPS-cue text blob (the
// canonical saved/export format) and an array of *identified* lines. Each line
// carries a stable id so per-line state (revision marks, dual-column pairing,
// variants) can attach to it. seamlessToLines parses; linesToSeamless is the
// exact inverse — and shares serializeRows with the rich editor so the editor
// and the model can never drift.
const lid = () => 'l' + Math.random().toString(36).slice(2, 9);
const nid = () => 'n' + Math.random().toString(36).slice(2, 9);
// UTF-8-safe base64 — inline note text rides inside the [[note:id:b64]] marker
// opaque to the emphasis parser, so it can hold any characters (including the
// literal brackets the marker syntax itself uses) without corrupting the parse.
function b64encode(s) { try { return btoa(unescape(encodeURIComponent(s || ''))); } catch (_) { return ''; } }
function b64decode(s) { try { return decodeURIComponent(escape(atob(s || ''))); } catch (_) { return ''; } }

// rows ({type,text}[]) → seamless text. The single source of truth for going
// back to the blob, used by both buildRichEditor and linesToSeamless.
function serializeRows(rows, isSong) {
  const blockModeFrom = (i) => {
    let hasSung = false, hasDialogue = false;
    for (let j = i + 1; j < rows.length; j++) {
      const ty = rows[j].type;
      if (ty === 'cue' || ty === 'section' || !(rows[j].text || '').trim()) break;
      if (ty === 'sung') hasSung = true; else if (ty === 'dialogue') hasDialogue = true;
    }
    if (hasSung && !hasDialogue) return true;
    if (hasDialogue && !hasSung) return false;
    if (hasSung && hasDialogue) return false;   // mixed → spoken base, ~ marks the sung lines
    return !!isSong;                            // empty block → card default
  };
  const parts = [];
  let blockSung = !!isSong;
  let inBlock = false; // mirrors the parser's inCharBlock, so action rows know when they need the ! marker
  rows.forEach((row, i) => {
    const type = row.type, text = (row.text || '').trim();
    if (type === 'scenebreak') { parts.push('***'); blockSung = !!isSong; inBlock = false; return; }
    if (!text) { parts.push(''); blockSung = !!isSong; inBlock = false; return; }
    if (type === 'cue') {
      inBlock = true;
      blockSung = blockModeFrom(i);
      let label = text.toUpperCase();
      if (blockSung && !isSong) label += ' (sings)';
      else if (!blockSung && isSong) label += ' (spoken)';
      if (row.dual) label += ' ^'; // preserve Fountain dual-dialogue marker
      if (parts.length && parts[parts.length - 1] !== '') parts.push('');
      parts.push(label);
    } else if (type === 'sung') {
      parts.push(blockSung ? text : '~' + text);
    } else if (type === 'paren') {
      parts.push('(' + text.replace(/^\(/, '').replace(/\)$/, '') + ')');
    } else if (type === 'section') {
      parts.push('[' + text.replace(/^\[/, '').replace(/\]$/, '') + ']');
      inBlock = false;
    } else if (type === 'scenebreak') {
      parts.push('***');
    } else if (type === 'action') {
      // In-block action would re-parse as dialogue/lyric (plain text inside a
      // character block) — the ! forced-action marker keeps it an action
      // through the round-trip, and closes the block exactly like the parser.
      parts.push(inBlock ? '!' + text : text);
      inBlock = false;
    } else {
      parts.push(text);
    }
  });
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function seamlessToLines(text, defaultSung) {
  return parseLyricLines(text || '', defaultSung).map((tok) => ({
    id: lid(), type: tok.type, text: tok.text || '', subtype: tok.subtype, dual: tok.dual,
  }));
}
function linesToSeamless(lines, isSong) { return serializeRows(lines || [], isSong); }

// Tokens for a card's manuscript body, sourced from its persisted lines (so each
// carries lastRev for revision marks) when present, else parsed from the blob.
function cardBodyTokens(c) {
  const toks = (Array.isArray(c.lines) && c.lines.length)
    ? c.lines.map((l) => ({ type: l.type, text: l.text, subtype: l.subtype, dual: l.dual, lastRev: l.lastRev, key: l.id ? 'l:' + l.id : undefined }))
    : parseLyricLines(c[cardBodyField(c)] || '', c.type === 'song');
  // Consecutive blank lines the writer typed are intentional vertical padding —
  // e.g. dropping a dual-dialogue column so its lines stagger below the next
  // voice. Tag the 2nd+ blank in any run as `pad` so the manuscript's
  // blank-collapse (buildBlocks) preserves the run instead of merging it to one.
  for (let i = 1; i < toks.length; i++) {
    if (toks[i].type === 'blank' && toks[i - 1].type === 'blank') toks[i] = { ...toks[i], pad: true };
  }
  return toks;
}

// ---- Step 2: persisted structured lines -----------------------------------
// `card.lines` is the identity sidecar for the manuscript body. The text blob
// (lyrics/note) stays canonical for the dozen readers that consume it; `lines`
// rides alongside, kept aligned on every write, so each line carries a stable id
// that revisions/variants can attach to. Migration is lazy: a card gains `lines`
// the first time its body is edited.

// Freeze the current page boundaries: snapshot the leading anchor of each page
// (from a natural, unlocked pagination) so that from here on earlier pages never
// reflow — grown content spills onto A-pages instead. FD "Lock Pages."
function lockPages() {
  const pages = paginateBlocks(buildBlocks(buildContentTokens(null)), null);
  const locked = pages
    .map((p, i) => ({ label: String(i + 1), anchor: pageLeadKey(p) }))
    .filter((p) => p.anchor);
  state.pageLock = { lockedAt: state.currentRev || null, date: Date.now(), pages: locked };
}
function unlockPages() { state.pageLock = null; }

// Final Draft-style revision sets, in standard issue order (paper colors).
const REV_COLORS = [
  { name: 'Blue',      hex: '#2b6cb0' },
  { name: 'Pink',      hex: '#d53f8c' },
  { name: 'Yellow',    hex: '#b7791f' },
  { name: 'Green',     hex: '#2f855a' },
  { name: 'Goldenrod', hex: '#9c6f1a' },
  { name: 'Buff',      hex: '#8a6d3b' },
  { name: 'Salmon',    hex: '#c05621' },
  { name: 'Cherry',    hex: '#c53030' },
];
const currentRevColor = () => {
  const r = (state.revisions || []).find((x) => x.id === state.currentRev);
  return r ? r.hex : '#2b6cb0';
};

// Stamp lastRev on lines that changed (or are new) under the active revision, so
// each marked line shows a revision asterisk. No-ops when not tracking — the base
// draft stays unmarked until the writer issues the first revision (FD behavior).
function stampRevisions(oldLines, newLines) {
  const rev = state.currentRev;
  if (!rev) return newLines;
  const byId = {};
  (oldLines || []).forEach((l) => { if (l && l.id) byId[l.id] = l; });
  return newLines.map((nl) => {
    const old = byId[nl.id];
    const changed = !old || old.text !== nl.text || old.type !== nl.type;
    return Object.assign({}, nl, { lastRev: changed ? rev : old.lastRev });
  });
}

// Editor path — the rich editor hands back id-carrying rows, so an edited line
// keeps its identity exactly (not a heuristic match). lines becomes canonical;
// the blob is derived from it.
function setCardLines(c, lines) {
  c.lines = stampRevisions(c.lines, lines);
  c[cardBodyField(c)] = linesToSeamless(c.lines, c.type === 'song');
}

// Text path — a raw-text write (Fountain textarea, drawer note, paste). Re-derive
// lines from the new text, preserving ids of unchanged lines via mergeLineIds.
// Only the manuscript body field drives lines (a beat's separate synopsis note
// must not clobber its lyrics' identity). Returns true if the text changed.
function setCardBody(c, field, text) {
  if ((c[field] || '') === (text || '')) return false;
  c[field] = text;
  if (field === cardBodyField(c)) {
    c.lines = stampRevisions(c.lines, mergeLineIds(c.lines, seamlessToLines(text, c.type === 'song')));
  }
  return true;
}

// Re-parse text while preserving the id + per-line state of lines whose
// type+text are unchanged. Used when content arrives as raw text (import/paste)
// rather than through the id-carrying editor, so identity survives where it can.
function mergeLineIds(oldLines, newLines) {
  const pool = (oldLines || []).slice();
  return (newLines || []).map((nl) => {
    const i = pool.findIndex((ol) => ol.type === nl.type && ol.text === nl.text);
    if (i < 0) return nl;
    const keep = pool.splice(i, 1)[0];
    return Object.assign({}, nl, { id: keep.id, lastRev: keep.lastRev, pairId: keep.pairId, col: keep.col });
  });
}

// Rhyme-scheme letters aligned 1:1 with the tokens (cues/sections reset to A).
function rhymeLetters(tokens) {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let seen = {}, next = 0;
  return tokens.map((tok) => {
    if (tok.type === 'cue' || tok.type === 'section') { seen = {}; next = 0; return ''; }
    if (tok.type !== 'sung') return '';
    const k = LYRIC.keyOf(LYRIC.lastWord(tok.text));
    if (!k) return '?';
    if (seen[k] == null) { seen[k] = AL[next % 26]; next++; }
    return seen[k];
  });
}

// Every character cue name used anywhere in the show — uppercase, unique, sorted.
// Parses via parseLyricLines so it catches both legacy @cues and seamless CAPS
// cues, plus any manually-registered characters. Feeds the cue autocomplete.
// Called per keystroke from the cue autocomplete, so re-tokenizing the whole
// show each time adds up. Memoize per card on the lyrics string itself —
// identity check is cheap and any edit swaps the string.
const _cueNameCache = new Map(); // card.id → { lyrics, names }
function collectCharacterNames() {
  const set = new Set();
  (state.cards || []).forEach((c) => {
    if (!c || !c.lyrics) return;
    let hit = _cueNameCache.get(c.id);
    if (!hit || hit.lyrics !== c.lyrics) {
      const names = [];
      parseLyricLines(c.lyrics, c.type === 'song').forEach((tok) => {
        if (tok.type === 'cue') { const n = (tok.text || '').trim().toUpperCase(); if (n) names.push(n); }
      });
      hit = { lyrics: c.lyrics, names };
      _cueNameCache.set(c.id, hit);
    }
    hit.names.forEach((n) => set.add(n));
  });
  Object.keys(state.characters || {}).forEach((n) => { const u = (n || '').trim().toUpperCase(); if (u) set.add(u); });
  return [...set].sort();
}

// Reusable rich (Tab/Enter) line editor. Builds a contenteditable element list
// from `text`, lets the user cycle element types with Tab / advance with Enter,
// and on blur serializes back to the seamless lyric format via onSave(value).
// Used by both the Manuscript Edit mode and the lyric window's Rich tab.
const RICH_EL_LABELS = { cue: 'Character', sung: 'Lyrics', dialogue: 'Dialogue', paren: 'Parenthetical', action: 'Action', section: 'Section', blank: 'Blank line' };
const RICH_EL_CLASS  = { cue: 'lw-char', sung: 'lw-sung', dialogue: 'lw-dialogue', paren: 'lw-paren', action: 'lw-action', section: 'lw-section-row', scenebreak: 'lw-scenebreak' };
const RICH_EL_CYCLE  = ['cue', 'dialogue', 'sung', 'paren', 'action', 'section'];
// Prose Plot's element set is deliberately narrow — no cue/dialogue/lyric/paren,
// since a novel is one flowing stream of paragraphs, not typed script lines.
const RICH_EL_LABELS_PROSE = { action: 'Body', scenebreak: 'Scene break', blank: 'Blank line' };
const RICH_EL_CYCLE_PROSE  = ['action', 'scenebreak'];

// ---- inline chords (typed [C] shorthand, auto-converted while typing) -----
// Anchored per-token so only chord-shaped brackets ever convert or render —
// never section headers, stage directions, or the [[note:...]] marker (a
// colon isn't in this character set, so it can't collide with that pattern).
const CHORD_TOKEN = '[A-G][#b]?(?:maj9|maj7|maj|min9|min7|min|m7b5|m9|m7|m6|m11|m13|madd9|m|sus2|sus4|sus|dim7|dim|aug|add9|add11|add|6\\/9|6|7sus4|7b9|7#9|7b5|7#5|7|9|11|13)?(?:\\/[A-G][#b]?)?';
const CHORD_INNER_RE = new RegExp('^(?:' + CHORD_TOKEN + ')$');
const CHORD_RE = new RegExp('\\[(' + CHORD_TOKEN + ')\\]', 'g');

// ---- inline emphasis (Fountain ↔ HTML) -----------------------------------
// Bold/italic/underline ride in the line text as Fountain markup (**bold**,
// *italic*, _underline_) so they round-trip through the plain-text body blob and
// print. These helpers convert that markup to display HTML and back.
function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function emphToHtml(text) {
  let s = escHtml(text);
  s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, '<b><i>$1</i></b>')
       .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
       .replace(/\*([^*]+?)\*/g, '<i>$1</i>')
       .replace(/_([^_]+?)_/g, '<u>$1</u>')
       .replace(/~~([^~]+?)~~/g, '<s>$1</s>')     // strikethrough
       // Inline chord: a zero-width marker anchored at this exact character —
       // renders as a small label floating above via CSS, doesn't shift the lyric.
       .replace(CHORD_RE, (_m, chord) => '<mark class="chord-tag" data-chord="' + chord + '" contenteditable="false"></mark>')
       // Inline note: an id + base64 note text ride in the marker, invisible in
       // the rendered phrase — see buildRichEditor's note popup / toggleHighlight sibling.
       .replace(/\[\[note:([a-z0-9]+):([A-Za-z0-9+/=]*)\]\]([\s\S]*?)\[\[\/note\]\]/g,
         (_m, id, enc, inner) => '<mark class="note-mark" data-note-id="' + id + '" data-note-text="' + enc + '">' + inner + '</mark>')
       .replace(/==([^=]+?)==/g, '<mark>$1</mark>'); // editorial highlight
  return s;
}
// Walk a DOM node, turning b/i/u (and strong/em) back into Fountain markup and
// dropping any other tags (keeps only their text) — the canonical clean form.
function emphFromNode(node) {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) { out += n.nodeValue; return; }
    if (n.nodeType !== 1) return;
    const tag = n.nodeName.toLowerCase();
    // Chord tags are empty markers (no child text) — resolve before the
    // empty-inner bail-out below, or they'd vanish on serialize.
    if (tag === 'mark' && n.dataset && n.dataset.chord) { out += '[' + n.dataset.chord + ']'; return; }
    const inner = emphFromNode(n);
    if (!inner) return;
    if (tag === 'b' || tag === 'strong') out += '**' + inner + '**';
    else if (tag === 'i' || tag === 'em') out += '*' + inner + '*';
    else if (tag === 'u') out += '_' + inner + '_';
    else if (tag === 's' || tag === 'strike' || tag === 'del') out += '~~' + inner + '~~';
    else if (tag === 'mark' && n.dataset && n.dataset.noteId) out += '[[note:' + n.dataset.noteId + ':' + (n.dataset.noteText || '') + ']]' + inner + '[[/note]]';
    else if (tag === 'mark') out += '==' + inner + '==';
    else if (tag === 'br') out += '';
    else out += inner;
  });
  return out;
}
// Inline tags the editor keeps inside a line; anything else (pasted spans/divs,
// CSS-styled runs) is "disallowed" and gets flattened back to clean markup.
const EMPH_TAGS = new Set(['B', 'I', 'U', 'EM', 'STRONG', 'S', 'STRIKE', 'DEL', 'MARK']);
function hasDisallowedMarkup(node) {
  for (const ch of node.children) {
    if (!EMPH_TAGS.has(ch.tagName) || hasDisallowedMarkup(ch)) return true;
  }
  return false;
}

// ---- inline notes (highlighted phrase + attached comment) ----------------
// A note's text lives inside its own marker (see emphToHtml), so deleting the
// highlighted phrase deletes the note with it — no separate store to garbage-collect.
const NOTE_RE = /\[\[note:([a-z0-9]+):([A-Za-z0-9+/=]*)\]\]([\s\S]*?)\[\[\/note\]\]/g;
function extractCardNotes(c) {
  const text = c[cardBodyField(c)] || '';
  const out = [];
  let m;
  NOTE_RE.lastIndex = 0;
  while ((m = NOTE_RE.exec(text))) {
    const phrase = m[3].replace(/\[\[note:[^\]]*\]\]/g, '').replace(/\[\[\/note\]\]/g, '').replace(/[*_~=]/g, '');
    out.push({ id: m[1], text: b64decode(m[2]), phrase });
  }
  return out;
}
// Read-only popover for a note-mark clicked outside an active editor (static
// manuscript render / print view). Editing happens only via buildRichEditor's
// own popup, opened when the mark is clicked while its card is being edited.
let _roNotePopover = null;
let _roNoteOutsideHandler = null;
function closeReadOnlyNotePopover() {
  if (_roNotePopover) { _roNotePopover.remove(); _roNotePopover = null; }
  if (_roNoteOutsideHandler) { document.removeEventListener('mousedown', _roNoteOutsideHandler); _roNoteOutsideHandler = null; }
}
function showReadOnlyNotePopover(mark) {
  closeReadOnlyNotePopover();
  const text = b64decode(mark.dataset.noteText || '');
  const pop = el('div', { class: 'note-popup note-popup-ro' }, [
    el('div', { class: 'note-popup-text', text: text || '(empty note)' }),
    el('button', { class: 'note-popup-close xclose', type: 'button', text: '✕', title: 'Close' }),
  ]);
  document.body.appendChild(pop);
  const rect = mark.getBoundingClientRect();
  const top = rect.bottom + 8 + pop.offsetHeight > window.innerHeight ? rect.top - pop.offsetHeight - 8 : rect.bottom + 8;
  pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
  pop.style.top = Math.max(8, top) + 'px';
  _roNotePopover = pop;
  pop.querySelector('.note-popup-close').addEventListener('click', closeReadOnlyNotePopover);
  _roNoteOutsideHandler = (e) => { if (!pop.contains(e.target)) closeReadOnlyNotePopover(); };
  setTimeout(() => document.addEventListener('mousedown', _roNoteOutsideHandler), 0);
}
// A read-only body line matching the editor's mkLine markup exactly, so the
// static edit-doc render and the live editor have identical line boxes (no
// reflow on click-in). Emphasis is rendered the same way in both.
// Canonical scroll anchor for a token/card key, shared by Edit and Print views so
// switching modes can keep the same content under the viewport top. Line keys
// ('l:'+id) match identically in both views; structural keys (sc:/sg:/note:) all
// collapse to their owning card ('card:'+id) so a header matches its card divider.
function anchorFromKey(key) {
  if (!key) return null;
  return key.startsWith('l:') ? key : 'card:' + key.replace(/^[a-z]+:/, '');
}

function bodyLineEl(type, text, key) {
  const div = el('div', { class: 'ms-el ' + (RICH_EL_CLASS[type] || 'lw-blank ms-el-blank'), 'data-type': type });
  let display = (text || '');
  if (type === 'paren')   display = display.replace(/^\(/, '').replace(/\)$/, '');
  if (type === 'section') display = display.replace(/^\[/, '').replace(/\]$/, '');
  div.innerHTML = emphToHtml(display);
  const a = anchorFromKey(key);
  if (a) div.dataset.anchor = a;
  return div;
}

// `detachBar`: don't mount the style ribbon inside the editor — the caller mounts
// it elsewhere (the manuscript hoists it into one persistent bar). `onClose`: run
// once when the editor commits (so the caller can release that shared bar).
function buildRichEditor({ text, lines, isSong, onSave, autofocus, detachBar, onClose, onSpawnCard }) {
  // Typing model: content decides, live. Enter creates a PREDICTED row — styled
  // at the likely next element's indent but not committed to it; what the
  // writer types re-classifies it as the text identifies itself (liveInferRow),
  // and commit (leaving the line) resolves markers. Prose Plot writes in one
  // flowing paragraph stream, not typed script lines — it gets its own narrow
  // element set (Body / Scene break) and cycle, and skips live inference.
  const isProse = state.format === 'prose';
  const elCycle  = isProse ? RICH_EL_CYCLE_PROSE  : RICH_EL_CYCLE;
  const elLabels = isProse ? RICH_EL_LABELS_PROSE : RICH_EL_LABELS;
  // Prediction for the row Enter creates — STYLE only, never a commitment.
  // Predicting the CONTINUATION (another lyric after a lyric, more dialogue
  // after dialogue) rather than the Final Draft ReturnKey hop (dialogue →
  // Character) minimizes restyles, because runs of the same element dominate;
  // a caps name flips the row to Character the moment it reads as one.
  const predictNext = (row) => {
    const type = row.dataset.type;
    if (!(row.textContent || '').trim()) return 'action'; // Enter on an emptied row: the block just closed, action is next
    if (type === 'cue') return row.dataset.mode ? (row.dataset.mode === 'sung' ? 'sung' : 'dialogue') : (isSong ? 'sung' : 'dialogue'); // a (sings)/(spoken) tag steers the block
    if (type === 'paren') return isSong ? 'sung' : 'dialogue';
    if (type === 'section') return isSong ? 'cue' : 'action';
    if (type === 'scenebreak' || type === 'blank') return 'action';
    return type; // sung → sung, dialogue → dialogue, action → action
  };
  const tabNext   = (type) => { const i = elCycle.indexOf(type); return elCycle[(i + 1) % elCycle.length]; };
  // Each row carries data-id so an edited line keeps its identity across saves
  // (the line-identity model). New rows mint a fresh id.
  const mkLine = (type, t, dual, id, subtype) => {
    // No per-row contentEditable: the container is the single editable host, so
    // selection and Backspace can cross line boundaries like a real editor.
    // Blank rows take the lw-blank class so the print-view spacing-collapse rules
    // apply in the editor too (no doubled gap / page shift on click-in).
    const div = el('div', { class: 'ms-el ' + (RICH_EL_CLASS[type] || 'lw-blank ms-el-blank'), 'data-type': type });
    div.dataset.id = id || lid();
    if (dual && type === 'cue') div.dataset.dual = '1';
    if (subtype) div.dataset.subtype = subtype;
    let display = (t || '');
    if (type === 'paren')   display = display.replace(/^\(/, '').replace(/\)$/, '');
    if (type === 'section') display = display.replace(/^\[/, '').replace(/\]$/, '');
    if (type === 'scenebreak') display = '⁂'; // the *** markup is a divider, not text to edit
    div.innerHTML = emphToHtml(display); // render **bold** / *italic* / _underline_
    return div;
  };
  const setLineType = (div, type) => {
    div.dataset.type = type;
    div.className = 'ms-el ' + (RICH_EL_CLASS[type] || 'lw-blank ms-el-blank');
    if (type !== 'cue') { delete div.dataset.dual; delete div.dataset.mode; } // dual/mode only apply to cues
    // Scene break is a divider, not text — converting a line into one discards
    // whatever it held (serializeRows would anyway; ***  round-trips regardless
    // of displayed text) and shows the glyph instead.
    if (type === 'scenebreak') div.innerHTML = emphToHtml('⁂');
  };
  // ---- Highland/Fountain-style inference, in two phases ----
  // Content decides what a line is. A LIVE pass (liveInferRow, below) restyles
  // the row on every keystroke without touching its text — caps become a
  // Character, plain text becomes lyric/dialogue/action by block context. A
  // COMMIT pass (inferRow) runs when the line is left and additionally strips
  // markers (@ ~ ! parens brackets ***). Tab/⌘N/dropdown stay a silent
  // override (setOrInsertType / the Tab handler mark the row dataset.man='1',
  // which locks it out of inference for good). Both passes reuse
  // classifyLyricLine (the same function parseLyricLines calls) so the
  // editor's guess and the printed parse can never drift apart.
  // Replay the block state classifyLyricLine would be carrying by the time it
  // reached `row`, from the ACTUAL committed types of the rows above (not by
  // re-parsing their text — a manually-overridden row's text may no longer
  // match its type, and its type is the ground truth). A cue resets blockSung
  // to its remembered (sings)/(spoken) mode (dataset.mode, stamped when the
  // tag was stripped) or the card default; a sung/dialogue row seen afterward
  // corrects it either way.
  const blockCtxBefore = (row) => {
    let inCharBlock = false, blockSung = !!isSong;
    for (let p = lineEd.firstElementChild; p && p !== row; p = p.nextElementSibling) {
      // A row with no text is a blank for context purposes no matter what its
      // (possibly just-predicted) type says — an empty predicted-Character row
      // must not open a block, and Enter-Enter must genuinely close one.
      // (Scene breaks are never empty — they display the ⁂ glyph.)
      if (!(p.textContent || '').trim()) { inCharBlock = false; continue; }
      const type = p.dataset.type;
      if (type === 'cue') { inCharBlock = true; blockSung = p.dataset.mode ? p.dataset.mode === 'sung' : !!isSong; }
      else if (type === 'sung') { if (inCharBlock) blockSung = true; }
      else if (type === 'dialogue') { if (inCharBlock) blockSung = false; }
      else if (type === 'blank' || type === 'scenebreak' || type === 'section') { inCharBlock = false; }
      // paren/action never change the block state (action only ever occurs
      // when already out of a block, so there's nothing to flip back).
    }
    return { inCharBlock, blockSung };
  };
  // Infer and (if it changed) retype exactly this one row — never a neighbor,
  // never a row above the caret. Only runs on a row the user actually edited
  // this session (dataset.dirty) and skips a manually-typed row (dataset.man).
  const inferRow = (row) => {
    if (!row || row.dataset.man === '1' || row.dataset.dirty !== '1') return;
    const type = row.dataset.type;
    if (type === 'blank' || type === 'scenebreak') { delete row.dataset.dirty; return; } // nothing to reclassify from
    // emphFromNode (not textContent) so bold/italic/underline survive a retype —
    // it round-trips back through emphToHtml exactly like the rest of the editor.
    const rowMarkup = emphFromNode(row);
    const raw = type === 'paren' ? '(' + rowMarkup + ')'
      : type === 'section' ? '[' + rowMarkup + ']'
      : rowMarkup;
    if (!raw.trim()) { delete row.dataset.dirty; return; }
    if (isProse) {
      // Prose's element set has no cue/dialogue/paren/section vocabulary (see
      // RICH_EL_CYCLE_PROSE) — the only inference that applies is the
      // scene-break marker; a bracketed heading stays plain Body text.
      if (type !== 'scenebreak' && /^\*{3,}$/.test(raw.trim())) { setLineType(row, 'scenebreak'); if (getFocusedLine(lineEd) === row) styleSel.value = 'scenebreak'; pushHistory(); }
      delete row.dataset.dirty;
      return;
    }
    let { tok } = classifyLyricLine(raw, blockCtxBefore(row), isSong);
    let newType = tok.type === 'blank' ? type : tok.type; // classifyLyricLine only yields blank for empty text, already excluded above
    // A name is a name, even mid-block. Fountain reads a bare CAPS line inside
    // a character block as a shouted lyric/dialogue continuation, but in the
    // editor the far more common intent is "new speaker" — so a row that is
    // already a Character, or was born fresh this session (Enter-made, see
    // dataset.fresh), re-classifies as a block OPENER, resolving the name and
    // any (sings)/(spoken)/^ markers exactly as a normal cue would.
    // serializeRows inserts the separating blank on save, so the round-trip
    // parse agrees. Fresh rows need ≥2 letters so a lone "I" lyric never
    // promotes; a real shouted caps lyric stays reachable with ~ or Tab.
    const cueLetters = (raw.replace(/\s*\([^)]*\)\s*$/, '').match(/[A-Za-z]/g) || []).length;
    if ((type === 'cue' || (row.dataset.fresh === '1' && cueLetters >= 2)) && newType !== 'cue' && looksLikeCue(raw)) {
      ({ tok } = classifyLyricLine(raw, { inCharBlock: false, blockSung: !!isSong }, isSong));
      newType = tok.type;
    }
    const sameSubtype = newType !== 'section' || tok.subtype === row.dataset.subtype;
    const sameDual = newType !== 'cue' || !!tok.dual === (row.dataset.dual === '1');
    // An explicit (sings)/(spoken) tag is stripped from the display below, so
    // remember its mode on the row — blockCtxBefore/predictNext honor it,
    // letting the tag steer the very first line typed underneath (before any
    // sung/dialogue rows exist to derive the mode from). serializeRows
    // re-emits the tag from the block's actual line types, so nothing extra is
    // persisted. Stamped BEFORE the no-change return: live inference usually
    // typed the row correctly already, so type equality alone can't skip this.
    if (newType === 'cue') {
      const m = raw.match(/\(([^)]*)\)\s*\^?\s*$/);
      const tag = m && m[1].trim().toLowerCase();
      if (/^(sung|sings|singing|sing)$/.test(tag || '')) row.dataset.mode = 'sung';
      else if (/^(spoken|speaks|speaking|speak|said)$/.test(tag || '')) row.dataset.mode = 'spoken';
    }
    // Display form with markers (~, @, !, [...], (...), a trailing sung/spoken
    // tag) stripped — classifyLyricLine's tok.text is already the stripped
    // form for every marker-driven type. The no-change return must ALSO
    // require the text to match this form: live inference restyles without
    // stripping, so a marker-typed row usually arrives here with the right
    // type but the marker still in its text.
    const display = newType === 'scenebreak' ? '⁂'
      : newType === 'paren' ? (tok.text || '').replace(/^\(/, '').replace(/\)$/, '')
      : (tok.text || '');
    const textSame = display.trim() === rowMarkup.trim();
    if (newType === type && sameSubtype && sameDual && textSame) { delete row.dataset.dirty; delete row.dataset.fresh; return; }
    const focused = getFocusedLine(lineEd) === row;
    const caretOff = focused ? caretOffsetIn(row) : 0;
    setLineType(row, newType);
    if (newType === 'section' && tok.subtype) row.dataset.subtype = tok.subtype; else delete row.dataset.subtype;
    if (newType === 'cue' && tok.dual) row.dataset.dual = '1'; else if (newType !== 'cue') delete row.dataset.dual;
    if (newType === 'cue' || newType === 'sung' || newType === 'action' || newType === 'paren' || newType === 'section' || newType === 'scenebreak') {
      row.innerHTML = emphToHtml(display);
      if (focused) placeCaretAtOffset(row, Math.min(caretOff, (row.textContent || '').length));
    }
    if (focused) styleSel.value = newType;
    delete row.dataset.dirty;
    delete row.dataset.fresh; // committed — from here on, edits use the conservative rules
    pushHistory(); // fold the retype into its own undo step, distinct from the text edit that triggered it
  };
  // ---- live inference (as-you-type) ----
  // The commit pass above strips markers, so it can only run when a line is
  // being left. This lighter pass runs on every keystroke and only RESTYLES —
  // text is never rewritten, so it's safe mid-thought. It covers the four
  // plain-text elements (Character/Lyrics/Dialogue/Action); marker-driven
  // types (@ ~ ! (...) [...] ***) keep their commit-time conversion, since
  // converting those live would eat characters while they're still being typed.
  const LIVE_TYPES = ['cue', 'sung', 'dialogue', 'action'];
  const liveInferRow = (row) => {
    if (isProse || !row || row.dataset.man === '1') return;
    const type = row.dataset.type;
    if (!LIVE_TYPES.includes(type) && type !== 'blank') return; // paren/section/scenebreak rows: commit-only
    const t = emphFromNode(row).trim();
    if (!t || /^[@~!([/]/.test(t) || /^\*/.test(t)) return; // empty keeps its predicted style; markers (and a /command being typed) wait for commit
    let newType;
    const letters = (t.replace(/\s*\([^)]*\)\s*$/, '').match(/[A-Za-z]/g) || []).length;
    if (row.dataset.fresh === '1' && letters >= 2 && looksLikeCue(t)) newType = 'cue'; // a name is a name, even mid-block
    else {
      // An existing Character row holds its ground while its NAME still reads
      // like one — including mid-typing of a trailing "(spoken" tag, whose
      // unclosed paren would otherwise fail looksLikeCue and demote the row to
      // lyric/dialogue on every keystroke (e.g. backspacing into an
      // autocompleted cue to add a mode tag). It only demotes live when the
      // name itself gains lowercase — a real rewrite into text. Commit
      // (inferRow) re-resolves the finished tag either way.
      if (type === 'cue') {
        const base = t.replace(/\s*\([^)]*\)?\s*$/, '').trim();
        if (!base || !/[a-z]/.test(base)) return; // still a caps name (or only a tag fragment) — hold
      }
      newType = classifyLyricLine(t, blockCtxBefore(row), isSong).tok.type;
    }
    if (newType === type || !LIVE_TYPES.includes(newType)) return;
    // Never restyle to Character off a single letter — "S" is probably the
    // start of "She…", not a name. The flip waits for the second caps letter
    // (or commit, which classifies with the parser's full rules).
    if (newType === 'cue' && letters < 2) return;
    setLineType(row, newType);
    if (getFocusedLine(lineEd) === row) styleSel.value = newType;
  };
  // Read the DOM rows back as identified lines — text re-wrapped so each row's
  // text matches parseLyricLines output (so the blob round-trips exactly).
  const rowsFrom = (lineEd) => [...lineEd.querySelectorAll('.ms-el')].map((div) => {
    const type = div.dataset.type;
    let txt = emphFromNode(div).trim(); // serialize b/i/u back to Fountain markup
    if (type === 'paren' && txt) txt = '(' + txt.replace(/^\(/, '').replace(/\)$/, '') + ')';
    const row = { id: div.dataset.id || lid(), type, text: txt, dual: div.dataset.dual === '1' };
    if (div.dataset.subtype) row.subtype = div.dataset.subtype;
    return row;
  });
  const serializeLines = (lineEd) => serializeRows(rowsFrom(lineEd), isSong);
  const serializeToLines = (lineEd) => rowsFrom(lineEd);
  const getFocusedLine = (lineEd) => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    let n = sel.anchorNode;
    // The selection can land directly on the editable container (between block
    // rows); map that to the child the caret is nearest.
    if (n === lineEd) {
      const idx = Math.min(sel.anchorOffset, lineEd.children.length - 1);
      return lineEd.children[idx] || null;
    }
    while (n && n !== lineEd) {
      if (n.nodeType === 1 && n.classList && n.classList.contains('ms-el')) return n;
      n = n.parentNode;
    }
    return null;
  };
  const placeCursorAt = (div, atEnd) => {
    lineEd.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    if (atEnd) { r.selectNodeContents(div); r.collapse(false); }
    else { r.setStart(div, 0); r.collapse(true); }
    sel.removeAllRanges();
    sel.addRange(r);
  };
  // Place the caret `off` characters into a line, walking its text nodes.
  const placeCaretAtOffset = (div, off) => {
    lineEd.focus();
    let target = null, rem = off;
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { if (rem <= c.length) { target = c; return true; } rem -= c.length; }
        else if (walk(c)) return true;
      }
      return false;
    };
    walk(div);
    const sel = window.getSelection();
    const r = document.createRange();
    if (target) r.setStart(target, rem); else r.setStart(div, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  };
  // Characters before the caret within `line` (0 = caret at the line's start).
  const caretOffsetIn = (line) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return 0;
    const r = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(line);
    try { pre.setEnd(r.startContainer, r.startOffset); } catch (_) { return 0; }
    return pre.toString().length;
  };
  const caretAtStart = (line) => { const s = window.getSelection(); return s.isCollapsed && caretOffsetIn(line) === 0; };
  const caretAtEnd   = (line) => { const s = window.getSelection(); return s.isCollapsed && caretOffsetIn(line) === (line.textContent || '').length; };
  // Like placeCaretAtOffset, but returns the {node, offset} point instead of
  // moving the selection — lets a Range span two offsets within the same line.
  const pointAtOffset = (div, off) => {
    let result = null, rem = off;
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { if (rem <= c.length) { result = { node: c, offset: rem }; return true; } rem -= c.length; }
        else if (walk(c)) return true;
      }
      return false;
    };
    walk(div);
    return result || { node: div, offset: 0 };
  };
  // Typed "[C]" shorthand auto-converts to an atomic chord tag the instant the
  // closing "]" lands — mirrors ChordPro notation, but only when the bracketed
  // text is chord-shaped (CHORD_INNER_RE), so stage directions like "[laughs]"
  // or a mid-line "[Bridge]" never trigger it.
  const tryAutoConvertChord = () => {
    const line = getFocusedLine(lineEd);
    if (!line) return;
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed) return;
    const offset = caretOffsetIn(line);
    const text = line.textContent || '';
    if (text[offset - 1] !== ']') return;
    const open = text.lastIndexOf('[', offset - 2);
    if (open === -1) return;
    const inner = text.slice(open + 1, offset - 1);
    if (!CHORD_INNER_RE.test(inner)) return;
    const start = pointAtOffset(line, open);
    const end = pointAtOffset(line, offset);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    range.deleteContents();
    const tag = document.createElement('mark');
    tag.className = 'chord-tag';
    tag.dataset.chord = inner;
    tag.contentEditable = 'false';
    range.insertNode(tag);
    const r2 = document.createRange();
    r2.setStartAfter(tag);
    r2.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r2);
  };
  // Smart typography (Prose Plot only) — curly quotes, em dash, ellipsis,
  // auto-substituted as you type (iA Writer / Ulysses convention). Screenplay
  // convention doesn't want this, so it's gated to isProse; Song Plot is
  // untouched. Operates directly on the text node at the caret, same
  // post-hoc-replace pattern as tryAutoConvertChord above.
  const trySmartTypography = () => {
    if (!isProse) return;
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeType !== 3) return;
    const node = sel.anchorNode;
    const offset = sel.anchorOffset;
    const text = node.nodeValue || '';
    if (offset >= 2 && text.slice(offset - 2, offset) === '--') {
      node.replaceData(offset - 2, 2, '—'); // em dash
      sel.collapse(node, offset - 1);
      return;
    }
    if (offset >= 3 && text.slice(offset - 3, offset) === '...') {
      node.replaceData(offset - 3, 3, '…'); // ellipsis
      sel.collapse(node, offset - 2);
      return;
    }
    const ch = text[offset - 1];
    if (ch === '"' || ch === "'") {
      const before = offset >= 2 ? text[offset - 2] : null;
      const isOpen = before == null || /[\s([{]/.test(before); // an em/en dash before a quote usually closes a line, not opens
      const curly = ch === '"' ? (isOpen ? '“' : '”') : (isOpen ? '‘' : '’');
      node.replaceData(offset - 1, 1, curly);
      sel.collapse(node, offset);
    }
  };
  // Bookmark the caret by line-id + offset so it survives a normalize pass.
  const caretBookmark = () => { const line = getFocusedLine(lineEd); return line ? { id: line.dataset.id, off: caretOffsetIn(line) } : null; };
  const restoreBookmark = (bm) => {
    if (!bm) return;
    const line = [...lineEd.querySelectorAll('.ms-el')].find((d) => d.dataset.id === bm.id);
    if (line) placeCaretAtOffset(line, Math.min(bm.off, (line.textContent || '').length));
  };
  // After native edits (cross-line selection delete, paste of rich content) the
  // browser can leave stray text nodes, nested blocks, or rows missing our
  // metadata. Flatten everything back to a clean list of typed .ms-el rows.
  const normalize = (preserve) => {
    const bm = preserve ? caretBookmark() : null;
    let prev = null;
    [...lineEd.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.classList.contains('ms-el')) {
        // Keep b/i/u; flatten any other nested markup back to clean emphasis HTML.
        if (hasDisallowedMarkup(node) && (node.textContent || '').trim()) node.innerHTML = emphToHtml(emphFromNode(node));
        if (!node.dataset.type) { setLineType(node, prev ? prev.dataset.type : (isSong ? 'sung' : 'action')); node.dataset.dirty = '1'; }
        if (!node.dataset.id) node.dataset.id = lid();
        if (node.dataset.type === 'blank' && (node.textContent || '').trim()) { setLineType(node, isSong ? 'sung' : 'action'); node.dataset.dirty = '1'; }
        prev = node;
      } else {
        const txt = node.textContent || '';
        if (prev && txt.trim()) { prev.appendChild(document.createTextNode(txt)); node.remove(); prev.dataset.dirty = '1'; } // append (don't reset prev's textContent — that would drop its emphasis)
        else if (txt.trim()) { const nl = mkLine(isSong ? 'sung' : 'action', txt.trim()); nl.dataset.dirty = '1'; lineEd.insertBefore(nl, node); node.remove(); prev = nl; }
        else node.remove();
      }
    });
    if (!lineEd.querySelector('.ms-el')) lineEd.appendChild(mkLine('cue', ''));
    if (preserve) restoreBookmark(bm);
  };
  const needsNormalize = () => {
    for (const n of lineEd.childNodes) {
      if (n.nodeType !== 1 || !n.classList.contains('ms-el')) return true;
      if (hasDisallowedMarkup(n)) return true; // b/i/u are fine; only foreign markup needs cleaning
      if (n.dataset.type === 'blank' && (n.textContent || '').trim()) return true;
    }
    return false;
  };

  // ---- undo / redo (custom snapshot history) ----
  // The editor mutates the DOM directly (line splits, type changes, merges), which
  // the browser's native undo stack can't track coherently — so we keep our own.
  // Each entry is the editor's full innerHTML plus a caret bookmark. Typing is
  // coalesced (debounced) into one step; structural ops snapshot immediately.
  const history = [];
  let histIndex = -1;
  let histTimer = null;
  let syncUndoButtons = () => {}; // replaced once the buttons exist
  const snapshot = () => ({ html: lineEd.innerHTML, caret: caretBookmark() });
  const pushHistory = () => {
    if (histTimer) { clearTimeout(histTimer); histTimer = null; }
    const snap = snapshot();
    if (histIndex >= 0 && history[histIndex].html === snap.html) { history[histIndex].caret = snap.caret; return; }
    history.length = histIndex + 1;            // drop any redo branch
    history.push(snap);
    if (history.length > 200) history.shift(); // cap memory; keep index valid below
    histIndex = history.length - 1;
    syncUndoButtons();
  };
  const queueHistory = () => { if (histTimer) clearTimeout(histTimer); histTimer = setTimeout(pushHistory, 350); };
  const restoreSnap = (snap) => { lineEd.innerHTML = snap.html; restoreBookmark(snap.caret); syncPicker(); };
  const undo = () => {
    pushHistory();                  // fold any pending keystrokes into a discrete step first
    if (histIndex <= 0) return;
    histIndex--;
    restoreSnap(history[histIndex]);
    syncUndoButtons();
  };
  const redo = () => {
    if (histIndex >= history.length - 1) return;
    histIndex++;
    restoreSnap(history[histIndex]);
    syncUndoButtons();
  };

  // ---- editorial highlight (inline <mark>, persisted as ==text==) ----
  // Custom (not execCommand 'hiliteColor', which emits styled spans the normalize
  // pass would strip). Toggles a <mark> around the selection; click inside an
  // existing highlight removes it.
  const findMarkAncestor = (node) => {
    while (node && node !== lineEd) { if (node.nodeType === 1 && node.nodeName === 'MARK') return node; node = node.parentNode; }
    return null;
  };
  const toggleHighlight = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    // Removal: any <mark> the caret sits in OR that the selection overlaps.
    const caretMark = findMarkAncestor(sel.anchorNode) || findMarkAncestor(sel.focusNode);
    const overlap = Array.from(lineEd.querySelectorAll('mark')).filter((m) => {
      try { return range.intersectsNode(m); } catch (_) { return false; }
    });
    const existing = caretMark ? [caretMark, ...overlap.filter((m) => m !== caretMark)] : overlap;
    if (existing.length) {
      existing.forEach((m) => {
        const parent = m.parentNode;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        if (parent.normalize) parent.normalize();  // merge the split text nodes
      });
    } else {
      if (range.collapsed) return;                 // a highlight needs a selection
      const frag = range.extractContents();
      const mark = document.createElement('mark');
      mark.appendChild(frag);
      range.insertNode(mark);
      const r2 = document.createRange();           // keep the run selected
      r2.selectNodeContents(mark);
      sel.removeAllRanges(); sel.addRange(r2);
    }
    if (needsNormalize()) normalize(true);
    pushHistory();
    syncPicker();
  };

  // ---- inline notes (highlighted phrase + attached comment) ----
  // A floating "+ Note" pill appears near a single-line selection; clicking it
  // (or an existing note phrase) opens a small popup to type/edit/delete the
  // note. Both live in document.body (outside richWrap/styleBar) so the
  // focusout handler below must explicitly treat them as "still in the editor."
  const singleLineSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;
    const line = getFocusedLine(lineEd);
    if (!line || !line.contains(range.startContainer) || !line.contains(range.endContainer)) return null;
    return range;
  };

  const noteToolbar = el('div', { class: 'note-float-toolbar', style: 'display:none' });
  const noteToolbarBtn = el('button', {
    class: 'note-float-btn', type: 'button', title: 'Add note',
    html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Note',
  });
  noteToolbar.appendChild(noteToolbarBtn);
  document.body.appendChild(noteToolbar);
  const hideNoteToolbar = () => { noteToolbar.style.display = 'none'; };
  const updateNoteToolbar = () => {
    if (notePopup.style.display !== 'none') { hideNoteToolbar(); return; } // popup open takes priority
    const range = singleLineSelection();
    if (!range) { hideNoteToolbar(); return; }
    const rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { hideNoteToolbar(); return; }
    noteToolbar.style.left = Math.round(rect.left + rect.width / 2) + 'px';
    noteToolbar.style.top = Math.round(rect.top) + 'px';
    noteToolbar.style.display = '';
  };

  const notePopup = el('div', { class: 'note-popup note-popup-edit', style: 'display:none' });
  const noteTextarea = el('textarea', { class: 'note-popup-ta', placeholder: 'Type a note…' });
  const noteDeleteBtn = el('button', { class: 'pbtn note-popup-delete', type: 'button', text: 'Delete' });
  const noteCancelBtn = el('button', { class: 'pbtn', type: 'button', text: 'Cancel' });
  const noteSaveBtn = el('button', { class: 'pbtn primary', type: 'button', text: 'Save' });
  notePopup.appendChild(noteTextarea);
  notePopup.appendChild(el('div', { class: 'note-popup-btns' }, [noteDeleteBtn, noteCancelBtn, noteSaveBtn]));
  document.body.appendChild(notePopup);
  let noteCtx = null; // { mode: 'create', range } | { mode: 'edit', mark }

  const positionNotePopup = (rect) => {
    notePopup.style.display = '';
    const top = rect.bottom + 8 + 120 > window.innerHeight ? Math.max(8, rect.top - 128) : rect.bottom + 8;
    notePopup.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 260)) + 'px';
    notePopup.style.top = top + 'px';
  };
  const closeNotePopup = (refocus) => {
    notePopup.style.display = 'none';
    noteCtx = null;
    if (refocus !== false) lineEd.focus({ preventScroll: true });
  };
  const openNoteCreate = () => {
    const range = singleLineSelection();
    if (!range) return;
    noteCtx = { mode: 'create', range: range.cloneRange() };
    noteTextarea.value = '';
    noteDeleteBtn.hidden = true;
    hideNoteToolbar();
    positionNotePopup(range.getBoundingClientRect());
    noteTextarea.focus();
  };
  const openNoteEdit = (mark) => {
    noteCtx = { mode: 'edit', mark };
    noteTextarea.value = b64decode(mark.dataset.noteText || '');
    noteDeleteBtn.hidden = false;
    hideNoteToolbar();
    positionNotePopup(mark.getBoundingClientRect());
    noteTextarea.focus();
  };
  const doDeleteNote = () => {
    if (noteCtx && noteCtx.mode === 'edit') {
      const m = noteCtx.mark;
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      if (parent.normalize) parent.normalize();
      pushHistory();
      syncPicker();
    }
    closeNotePopup();
  };
  const doSaveNote = () => {
    if (!noteCtx) return;
    const text = noteTextarea.value.trim();
    if (!text) { if (noteCtx.mode === 'edit') doDeleteNote(); else closeNotePopup(); return; }
    if (noteCtx.mode === 'create') {
      const range = noteCtx.range;
      const frag = range.extractContents();
      const mark = document.createElement('mark');
      mark.className = 'note-mark';
      mark.dataset.noteId = nid();
      mark.dataset.noteText = b64encode(text);
      mark.appendChild(frag);
      range.insertNode(mark);
      lineEd.focus({ preventScroll: true });
      const r2 = document.createRange();
      r2.selectNodeContents(mark);
      r2.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r2);
    } else {
      noteCtx.mark.dataset.noteText = b64encode(text);
      lineEd.focus({ preventScroll: true });
    }
    if (needsNormalize()) normalize(true);
    pushHistory();
    syncPicker();
    closeNotePopup(false); // already refocused above
  };
  noteToolbarBtn.addEventListener('mousedown', (e) => { e.preventDefault(); openNoteCreate(); });
  noteSaveBtn.addEventListener('mousedown', (e) => { e.preventDefault(); doSaveNote(); });
  noteDeleteBtn.addEventListener('mousedown', (e) => { e.preventDefault(); doDeleteNote(); });
  noteCancelBtn.addEventListener('mousedown', (e) => { e.preventDefault(); closeNotePopup(); });
  noteTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeNotePopup(); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSaveNote(); }
  });
  document.addEventListener('selectionchange', updateNoteToolbar);
  const onNoteDocMouseDown = (e) => {
    // Exempt the "+ Note" toolbar itself — this same mousedown is what opens the
    // popup (bubbling here right after), so without this it would close on arrival.
    if (notePopup.style.display !== 'none' && !notePopup.contains(e.target) && !noteToolbar.contains(e.target) && !(e.target.closest && e.target.closest('mark.note-mark'))) closeNotePopup();
  };
  document.addEventListener('mousedown', onNoteDocMouseDown);

  const styleBar = el('div', { class: 'ms-style-bar' });
  const styleSel = el('select', { class: 'ms-style-sel' });
  const modKey = navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl+';
  Object.entries(elLabels).forEach(([val, label]) => {
    const n = val === 'blank' ? 7 : elCycle.indexOf(val) + 1;
    styleSel.appendChild(el('option', { value: val, text: n ? label + '  (' + modKey + n + ')' : label }));
  });
  // A button that runs an arbitrary action (undo/redo/highlight) while keeping the
  // editor's focus + selection (mousedown preventDefault, like the emphasis buttons).
  const actBtn = (html, title, fn) => {
    const b = el('button', { class: 'ms-fmt-btn', type: 'button', title, html });
    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); fn(); });
    return b;
  };
  // Undo / redo at the far left (word-processor convention), driving our own history.
  const undoBtn = actBtn('↶', 'Undo (' + modKey + 'Z)', undo);
  const redoBtn = actBtn('↷', 'Redo (' + modKey + '⇧Z)', redo);
  syncUndoButtons = () => { undoBtn.disabled = histIndex <= 0; redoBtn.disabled = histIndex >= history.length - 1; };
  // Dual-dialogue toggle: marks the focused character cue as simultaneous with
  // the cue before it (renders side by side in Print View). No prose analog —
  // a novel has no simultaneous-speech column layout — so it's built but never
  // mounted in Prose Plot.
  const dualBtn = el('button', { class: 'ms-dual-btn', type: 'button', text: 'Dual ⇄', title: 'Mark this character as speaking with the one above (' + modKey + 'D)' });
  const toggleDual = (line) => {
    if (!line || line.dataset.type !== 'cue') return false;
    if (line.dataset.dual === '1') delete line.dataset.dual; else line.dataset.dual = '1';
    dualBtn.classList.toggle('active', line.dataset.dual === '1');
    pushHistory();
    return true;
  };
  dualBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleDual(getFocusedLine(lineEd)); });

  // Bold / Italic / Underline — operate on the current selection in the focused
  // editor. preventDefault keeps focus (and the selection) in the editor; the
  // edit persists as Fountain markup via emphFromNode on save.
  const applyEmphasis = (cmd) => {
    document.execCommand('styleWithCSS', false, false); // produce <b>/<i>/<u>, not styled spans
    document.execCommand(cmd, false, null);
    if (needsNormalize()) normalize(true);
    pushHistory();
    syncPicker();
  };
  const fmtBtn = (html, cmd, title) => {
    const b = el('button', { class: 'ms-fmt-btn', type: 'button', title, html });
    b.addEventListener('mousedown', (e) => { e.preventDefault(); applyEmphasis(cmd); });
    return b;
  };
  const boldBtn = fmtBtn('<b>B</b>', 'bold', 'Bold (' + modKey + 'B)');
  const italicBtn = fmtBtn('<i>I</i>', 'italic', 'Italic (' + modKey + 'I)');
  const underlineBtn = fmtBtn('<u>U</u>', 'underline', 'Underline (' + modKey + 'U)');
  const strikeBtn = fmtBtn('<s>S</s>', 'strikeThrough', 'Strikethrough (' + modKey + '⇧X)');
  // Highlight as an editorial note — the button previews its own color.
  const highlightBtn = actBtn('<mark>H</mark>', 'Highlight as note (' + modKey + '⇧H)', toggleHighlight);
  highlightBtn.classList.add('ms-fmt-hl');

  styleBar.appendChild(undoBtn);
  styleBar.appendChild(redoBtn);
  styleBar.appendChild(el('span', { class: 'ms-fmt-divider' }));
  if (isProse) {
    // Writing font — a per-device comfort preference (state.msOptions.editFont),
    // separate from emphasis/element controls. Changing it restyles the whole
    // Edit-mode document (via --edit-font on .ms-edit-doc), not just this line;
    // Manuscript output is untouched, since it never reads --edit-font.
    const fontSel = el('select', { class: 'ms-font-sel', title: 'Writing font (Manuscript output stays Courier regardless of this setting)' });
    Object.entries(EDIT_FONT_LABELS).forEach(([val, label]) => fontSel.appendChild(el('option', { value: val, text: label })));
    fontSel.value = state.msOptions.editFont || 'courier';
    fontSel.addEventListener('change', () => {
      state.msOptions.editFont = fontSel.value;
      try { localStorage.setItem('md-ms-opts', JSON.stringify(state.msOptions)); } catch (_) {}
      applyEditFont();
    });
    // Ribbon ordered by word-processor convention (Word/Docs), left→right by
    // scope: history (undo/redo, above) | selectors that pick WHAT you're
    // styling (writing font, then line element) | character emphasis + the note
    // highlight, kept as one contiguous cluster rather than split around the
    // selects.
    styleBar.appendChild(fontSel);
    styleBar.appendChild(styleSel);
    styleBar.appendChild(el('span', { class: 'ms-fmt-divider' }));
    styleBar.appendChild(boldBtn);
    styleBar.appendChild(italicBtn);
    styleBar.appendChild(underlineBtn);
    styleBar.appendChild(strikeBtn);
    styleBar.appendChild(highlightBtn);
  } else {
    styleBar.appendChild(styleSel);
    styleBar.appendChild(dualBtn);
    styleBar.appendChild(el('span', { class: 'ms-fmt-divider' }));
    styleBar.appendChild(boldBtn);
    styleBar.appendChild(italicBtn);
    styleBar.appendChild(underlineBtn);
    styleBar.appendChild(strikeBtn);
    styleBar.appendChild(highlightBtn);
  }
  const hint = isProse
    ? 'Enter · next line   Tab · cycle   ' + modKey + '1–2 · jump'
    : 'Enter · next element   ⇧Enter · same   Tab · cycle   ' + modKey + '1–7 · jump';
  styleBar.appendChild(el('span', { class: 'ms-style-hint', text: hint }));

  const lineEd = el('div', { class: 'ms-line-editor ms-sheet-content' });
  lineEd.contentEditable = 'true'; // single editable host for the whole document
  // Seed from persisted identified lines when available (ids survive the edit);
  // otherwise parse the text blob (and mint ids — lazy migration on first edit).
  const seed = (lines && lines.length)
    ? lines.map((l) => ({ type: l.type, text: l.text, dual: l.dual, id: l.id, subtype: l.subtype }))
    : parseLyricLines(text || '', isSong).map((tok) => ({ type: tok.type, text: tok.text, dual: tok.dual, id: null, subtype: tok.subtype }));
  // Existing note phrase clicked while its card is being edited: open the same
  // popup for editing (a click outside the editor is handled by the read-only
  // popover wired in initControls instead).
  lineEd.addEventListener('click', (e) => {
    const mark = e.target.closest && e.target.closest('mark.note-mark');
    if (mark) openNoteEdit(mark);
  });
  // A brand-new empty document seeds one line of the cycle's first type — cue
  // (Character) in the screenplay set, Body in Prose Plot's (there is no cue).
  if (!seed.some((t) => t.type !== 'blank')) lineEd.appendChild(mkLine(elCycle[0], ''));
  else seed.forEach((l) => lineEd.appendChild(mkLine(l.type, l.text, l.dual, l.id, l.subtype)));

  // ---- FD-style character-name autocomplete (cue lines only) ----
  const acBox = el('div', { class: 'rich-ac', style: 'display:none' });
  const ac = { open: false, items: [], index: 0, line: null, dismissed: false, lastFocus: null };
  const closeAc = () => { ac.open = false; ac.items = []; ac.line = null; acBox.style.display = 'none'; };
  const renderAc = () => {
    acBox.innerHTML = '';
    ac.items.forEach((name, i) => {
      const it = el('div', { class: 'rich-ac-item' + (i === ac.index ? ' active' : ''), text: name });
      it.addEventListener('mousedown', (ev) => { ev.preventDefault(); ac.index = i; acceptAc(false); });
      acBox.appendChild(it);
    });
  };
  const acceptAc = (advance) => {
    const line = ac.line, name = ac.items[ac.index];
    if (!line || !name) return;
    line.textContent = name;
    line.dataset.dirty = '1';
    closeAc();
    if (advance) {
      const newType = predictNext(line);
      const newLine = mkLine(newType, '');
      newLine.dataset.fresh = '1'; // predicted, not committed — typing decides
      line.after(newLine);
      placeCursorAt(newLine, false);
      styleSel.value = newType;
    } else {
      placeCursorAt(line, true);
    }
  };
  const refreshAc = (line) => {
    if (!line || line.dataset.type !== 'cue' || ac.dismissed) { closeAc(); return; }
    const q = (line.textContent || '').trim().toUpperCase();
    const items = collectCharacterNames().filter((n) => n !== q && (!q || n.startsWith(q)));
    if (!items.length) { closeAc(); return; }
    ac.open = true; ac.items = items; ac.line = line;
    if (ac.index >= items.length) ac.index = 0;
    renderAc();
    // Position via layout offsets (relative to richWrap, the positioned parent)
    // rather than getBoundingClientRect, so it stays correct under the
    // manuscript viewport's zoom transform.
    acBox.style.left = line.offsetLeft + 'px';
    acBox.style.top = (line.offsetTop + line.offsetHeight + 2) + 'px';
    acBox.style.display = '';
  };

  // Tracks whichever row last held the caret, so a caret move (arrow keys,
  // click into another row) can infer the row just left — inference only ever
  // fires on the row being *committed*, never the one now under the caret.
  let lastActiveLine = null;
  const syncPicker = () => {
    const line = getFocusedLine(lineEd);
    if (line !== lastActiveLine) {
      if (lastActiveLine && lineEd.contains(lastActiveLine)) inferRow(lastActiveLine);
      lastActiveLine = line;
    }
    if (line) styleSel.value = line.dataset.type;
    dualBtn.disabled = !(line && line.dataset.type === 'cue');
    dualBtn.classList.toggle('active', !!(line && line.dataset.dual === '1'));
    // Reflect emphasis at the caret on the B/I/U buttons.
    if (document.queryCommandState) {
      try {
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
        strikeBtn.classList.toggle('active', document.queryCommandState('strikeThrough'));
      } catch (_) {}
    }
    const csel = window.getSelection();
    highlightBtn.classList.toggle('active', !!(csel && csel.anchorNode && findMarkAncestor(csel.anchorNode)));
    if (line !== ac.lastFocus) { ac.lastFocus = line; ac.dismissed = false; ac.index = 0; }
    refreshAc(line);
  };
  lineEd.addEventListener('keyup', syncPicker);
  lineEd.addEventListener('click', syncPicker);
  lineEd.addEventListener('input', () => {
    tryAutoConvertChord(); trySmartTypography();
    if (needsNormalize()) normalize(true);
    const cl = getFocusedLine(lineEd);
    if (cl) { cl.dataset.dirty = '1'; liveInferRow(cl); } // dirty: eligible for commit inference; live: restyle as the text identifies itself
    refreshAc(cl); // after live inference, so a caps name that just became a cue opens name autocomplete immediately
    queueHistory();
  });
  // Paste as plain text, splitting on newlines into typed rows (strip rich markup).
  lineEd.addEventListener('paste', (e) => {
    e.preventDefault();
    const data = (e.clipboardData || window.clipboardData);
    const text = data ? data.getData('text/plain') : '';
    if (!text) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) sel.deleteFromDocument();
    const line = getFocusedLine(lineEd);
    if (!line) return;
    const segs = text.replace(/\r\n/g, '\n').split('\n');
    if (segs.length === 1) { document.execCommand('insertText', false, segs[0]); syncPicker(); return; }
    const off = caretOffsetIn(line);
    const whole = line.textContent || '';
    const after = whole.slice(off);
    line.textContent = whole.slice(0, off) + segs[0];
    line.dataset.dirty = '1';
    let anchor = line;
    for (let i = 1; i < segs.length; i++) {
      const txt = segs[i] + (i === segs.length - 1 ? after : '');
      // empty pasted lines are stanza breaks, not empty rows of the cloned type
      const nl = txt.trim() ? mkLine(line.dataset.type, txt) : mkLine('blank', '');
      nl.dataset.dirty = '1';
      anchor.after(nl); anchor = nl;
    }
    placeCaretAtOffset(anchor, segs[segs.length - 1].length);
    // Classify the pasted rows like typed ones (Highland behavior). Document
    // order matters: each row's block-context replay must see the corrected
    // types of the rows above it.
    const stop = anchor.nextElementSibling;
    for (let n = line; n && n !== stop; n = n.nextElementSibling) inferRow(n);
    syncPicker();
    pushHistory();
  });
  styleSel.addEventListener('mousedown', () => { styleSel._activeLine = getFocusedLine(lineEd); });
  // Apply an element type to a line. "Blank line" on a line that already has text
  // inserts a fresh spacer below rather than erasing the text (a blank carrying
  // text reverts on normalize). Stack several to stagger dual-dialogue columns;
  // Enter on a blank adds another. Shared by the element dropdown and ⌘1–7.
  const setOrInsertType = (line, type) => {
    if (type === 'blank' && (line.textContent || '').trim()) {
      const nl = mkLine('blank', '');
      nl.dataset.man = '1'; // explicitly chosen — inference never touches it
      line.after(nl);
      placeCursorAt(nl, false);
    } else {
      setLineType(line, type);
      line.dataset.man = '1'; // manual override (dropdown / ⌘1–7) locks the row out of inference
      placeCursorAt(line, true);
    }
    styleSel.value = type;
  };
  styleSel.addEventListener('change', () => {
    const line = styleSel._activeLine || getFocusedLine(lineEd);
    if (!line) return;
    setOrInsertType(line, styleSel.value);
    pushHistory();
  });
  lineEd.addEventListener('keydown', (e) => {
    const line = getFocusedLine(lineEd);
    if (!line) return;
    // While the autocomplete is open, arrows/enter/tab/esc drive the menu.
    if (ac.open && ac.items.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); ac.index = (ac.index + 1) % ac.items.length; renderAc(); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); ac.index = (ac.index - 1 + ac.items.length) % ac.items.length; renderAc(); return; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); acceptAc(true); return; }
      if (e.key === 'Tab')       { e.preventDefault(); acceptAc(false); return; }
      if (e.key === 'Escape')    { e.preventDefault(); ac.dismissed = true; closeAc(); return; }
    }
    // Undo / redo — intercepted before the browser's native (and here unreliable)
    // stack. ⌘Z / ⌘⇧Z, plus ⌘Y for redo on Windows muscle memory.
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault(); redo(); return;
    }
    // Strikethrough (⌘⇧X) and editorial highlight (⌘⇧H).
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault(); applyEmphasis('strikeThrough'); return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault(); toggleHighlight(); return;
    }
    // Final Draft-style direct jumps: Ctrl/⌘ + 1–6 set the current line's
    // element type outright, no Tab-cycling. Order matches RICH_EL_CYCLE so the
    // numbers line up with the style-bar labels (1 Character … 6 Section).
    // Ctrl/⌘+D toggles dual dialogue on the current character cue.
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      if (toggleDual(line)) { e.preventDefault(); return; }
    }
    // Ctrl/⌘ + B / I / U toggle emphasis on the selection (forced to clean tags).
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && /^[biu]$/i.test(e.key)) {
      e.preventDefault();
      applyEmphasis({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key >= '1' && e.key <= '7') {
      const newType = e.key === '7' ? 'blank' : elCycle[parseInt(e.key, 10) - 1];
      if (!newType) return; // e.g. ⌘3–6 are unused in Prose Plot's 2-item cycle
      e.preventDefault();
      setOrInsertType(line, newType);
      refreshAc(getFocusedLine(lineEd) || line);
      pushHistory();
      return;
    }
    if (e.key === 'Enter') {
      // Slash command: committing a line of the form "/song Title" (or /beat,
      // /scene, /chapter) spawns a NEW card right after the one being edited.
      // The command line is removed before commit so it never lands as content;
      // anything that doesn't match falls through and commits as a normal line.
      if (onSpawnCard && !e.shiftKey) {
        const cmd = (line.textContent || '').trim().match(/^\/(song|beat|scene|chapter)(?:\s+(.*))?$/i);
        if (cmd) {
          e.preventDefault();
          const kind = cmd[1].toLowerCase();
          const type = kind === 'chapter' ? 'scene' : kind;
          delete line.dataset.dirty; // never commit-infer the removed command line
          if (line === lastActiveLine) lastActiveLine = null;
          line.remove();
          commit(); // save this card as it stands (minus the slash line)
          onSpawnCard(type, (cmd[2] || '').trim());
          return;
        }
      }
      // Enter → a fresh predicted row (see predictNext — style, not commitment);
      // Shift+Enter → force another line of the SAME element. A caret in
      // mid-line splits it; the text after the caret carries into the new row.
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) sel.deleteFromDocument();
      const cur = getFocusedLine(lineEd) || line;
      inferRow(cur); // classify the line being committed before computing what follows it
      const curType = cur.dataset.type;
      const off = caretOffsetIn(cur);
      const whole = cur.textContent || '';
      cur.textContent = whole.slice(0, off);
      const carried = whole.slice(off);
      // A mid-line split keeps the same element on both halves (it's the same
      // content, just wrapped); a clean end-of-line Enter births a PREDICTED
      // row — styled at the likely next element's indent but uncommitted, and
      // marked fresh so what's typed into it decides what it really is.
      const newType = (e.shiftKey || carried.trim()) ? curType : predictNext(cur);
      const newLine = mkLine(newType, carried);
      newLine.dataset.dirty = '1'; // carries user text into a new row this session
      if (!carried.trim()) newLine.dataset.fresh = '1'; // born empty — full inference freedom, caps → Character
      cur.after(newLine);
      placeCursorAt(newLine, false);
      styleSel.value = newType;
      syncPicker();
      pushHistory();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newType = tabNext(line.dataset.type);
      setLineType(line, newType);
      line.dataset.man = '1'; // manual cycle — locks the row out of inference
      styleSel.value = newType;
      refreshAc(line);
      pushHistory();
    } else if (e.key === 'Backspace') {
      // Let the browser delete a selection or a mid-line character. Only intercept
      // a collapsed caret at the very start of a line, where we merge it into the
      // previous row (word-processor behavior) instead of blurring out of edit mode.
      const sel = window.getSelection();
      if (!sel.isCollapsed || !caretAtStart(line)) return;
      const prev = line.previousElementSibling;
      if (!prev) { e.preventDefault(); return; }
      e.preventDefault();
      if (prev.classList.contains('ms-el-blank')) {
        prev.remove();               // backspacing into a gap removes the gap
        placeCursorAt(line, false);
      } else {
        const at = (prev.textContent || '').length;
        prev.textContent = (prev.textContent || '') + (line.textContent || '');
        prev.dataset.dirty = '1';
        line.remove();
        placeCaretAtOffset(prev, at);
        styleSel.value = prev.dataset.type;
      }
      syncPicker();
      pushHistory();
    } else if (e.key === 'Delete') {
      // Forward-delete at line end merges the next row up (symmetric with above).
      const sel = window.getSelection();
      if (!sel.isCollapsed || !caretAtEnd(line)) return;
      const next = line.nextElementSibling;
      if (!next) { e.preventDefault(); return; }
      e.preventDefault();
      if (next.classList.contains('ms-el-blank')) { next.remove(); }
      else {
        const at = (line.textContent || '').length;
        line.textContent = (line.textContent || '') + (next.textContent || '');
        line.dataset.dirty = '1';
        next.remove();
        placeCaretAtOffset(line, at);
      }
      syncPicker();
      pushHistory();
    }
  });

  const richWrap = el('div', { class: 'ms-card-rich-editor' });
  // Commit edits exactly once per editor instance. Exposed as _commit so the
  // manuscript can close an open editor when the user clicks into another scene
  // (one editor open at a time → a single style ribbon, on the active scene).
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    inferRow(lastActiveLine); // classify the last row touched before serializing
    closeAc();
    hideNoteToolbar();
    closeNotePopup(false);
    document.removeEventListener('selectionchange', updateNoteToolbar);
    document.removeEventListener('mousedown', onNoteDocMouseDown);
    noteToolbar.remove();
    notePopup.remove();
    if (onSave) onSave(serializeLines(lineEd), serializeToLines(lineEd));
    if (onClose) onClose();
  };
  richWrap._commit = commit;
  richWrap.addEventListener('focusout', (e) => {
    // The style bar may live outside richWrap (detachBar) — focusing it (the
    // element-type select, dual toggle) must not count as leaving the editor.
    // The note toolbar/popup also live outside richWrap (document.body, so they
    // can be positioned in fixed viewport coordinates) — same treatment.
    if (richWrap.contains(e.relatedTarget) || styleBar.contains(e.relatedTarget) || noteToolbar.contains(e.relatedTarget) || notePopup.contains(e.relatedTarget)) return;
    commit();
  });
  if (!detachBar) richWrap.appendChild(styleBar);
  richWrap.appendChild(lineEd);
  richWrap.appendChild(acBox);
  richWrap._styleBar = styleBar; // for callers that mount the bar themselves
  richWrap._syncBar = syncPicker; // refresh the bar to the focused line on demand
  richWrap._lineEd = lineEd; // host element, so callers can re-anchor scroll to it
  richWrap._focusFirst = () => {
    const first = lineEd.querySelector('.ms-el');
    if (first) { placeCursorAt(first, false); styleSel.value = first.dataset.type || 'cue'; }
  };
  // Open with the caret exactly where the user clicked (one click → ready to
  // type at that spot), falling back to the first line if the point misses.
  // preventScroll: the manuscript re-anchors the scroll itself before this runs,
  // so a focus-driven scroll here would undo it and throw off the hit-test.
  richWrap._focusFromPoint = (x, y) => {
    lineEd.focus({ preventScroll: true });
    let range = null;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (p) { range = document.createRange(); range.setStart(p.offsetNode, p.offset); }
    }
    if (range && lineEd.contains(range.startContainer)) {
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      richWrap._focusFirst();
    }
    syncPicker();
  };
  if (autofocus) richWrap._focusFirst();
  pushHistory(); // seed history[0] with the editor's opening state
  return richWrap;
}

// ---- manuscript view (paginated) ----

function buildContentTokens(sceneId) {
  const toks = [];
  const order = displayOrder();
  let actDone = { one: false, two: false };
  let songNum = 0;

  const pushLyric = (t) => {
    if (t.type === 'section' && t.subtype === 'section' && state.msOptions.showSectionTags === false) return;
    toks.push(t);
  };

  // Whole-note action blocks aren't line-split; mark the block if any of its
  // lines changed under the current revision.
  const noteRev = (c) => (Array.isArray(c.lines) && state.currentRev && c.lines.some((l) => l.lastRev === state.currentRev)) ? state.currentRev : undefined;

  const emitCard = (c) => {
    if (c.type === 'scene') {
      toks.push({ type: 'scene-header', text: c.title || 'Scene', key: 'sc:' + c.id });
      // Tokenize the same way beats/songs do (cardBodyTokens), not one flat
      // block — a scene's note supports the full rich element set (action,
      // cue/dialogue, and in Prose Plot, Body/Scene break), and a chapter in
      // Prose Plot IS a scene card, so it needs real paragraph-by-paragraph
      // rendering here, not a single glob of text.
      if (c.note && c.note.trim()) { toks.push({ type: 'blank' }); cardBodyTokens(c).forEach(pushLyric); toks.push({ type: 'blank' }); }
    } else if (c.type === 'beat') {
      // The beat's Beatline ("what it's about") is an outline reference, not
      // script — render it as a distinct note (sage), gated by its own
      // Beatlines toggle (independent of Section tags — a Song Plot-only
      // markup feature that has nothing to do with this).
      if (c.note && c.note.trim() && state.msOptions.showBeatlines !== false) { toks.push({ type: 'note', text: c.note, lastRev: noteRev(c), key: 'note:' + c.id }); toks.push({ type: 'blank' }); }
      if (c.lyrics && c.lyrics.trim()) { cardBodyTokens(c).forEach(pushLyric); toks.push({ type: 'blank' }); }
    } else if (c.type === 'song') {
      songNum++;
      toks.push({ type: 'song-num', num: songNum, title: c.title || 'Untitled', key: 'sg:' + c.id });
      toks.push({ type: 'blank' });
      if (c.lyrics && c.lyrics.trim()) cardBodyTokens(c).forEach(pushLyric);
      else toks.push({ type: 'action', text: (state.readonly && state.showKey) ? '(lyrics not reproduced)' : '(no lyrics yet)' });
      toks.push({ type: 'blank' });
    }
  };

  if (sceneId) {
    const startPos = order.findIndex((i) => state.cards[i].id === sceneId);
    if (startPos >= 0) {
      const sc = state.cards[order[startPos]];
      songNum = order.slice(0, startPos).filter((i) => state.cards[i].type === 'song').length;
      toks.push({ type: 'scene-header', text: sc.title || 'Scene' });
      toks.push({ type: 'blank' });
      if (sc.note) { toks.push({ type: 'action', text: sc.note, lastRev: noteRev(sc) }); toks.push({ type: 'blank' }); }
      for (let j = startPos + 1; j < order.length; j++) {
        const c = state.cards[order[j]];
        if (c.type === 'scene') break;
        emitCard(c);
      }
    }
    return toks;
  }

  const msOpts = state.msOptions;
  if (msOpts.showTitle !== false) {
    // No spacer after the title — its own 2em bottom margin plus the following
    // header's top margin carry the gap. (Explicit blanks pushed act headers,
    // which keep their 2em top margin, too far down.)
    toks.push({ type: 'ms-title', text: (state.title || 'Untitled Show').toUpperCase(), key: 'title' });
  }

  order.forEach((i) => {
    const c = state.cards[i];
    if ((c.act === '1' || c.act === '2A') && !actDone.one) {
      actDone.one = true;
      if (state.mode !== 'oneact' && msOpts.showActHeaders !== false) { toks.push({ type: 'act-header', text: 'ACT ONE', key: 'act1' }); toks.push({ type: 'blank' }); }
    }
    if ((c.act === '2B' || c.act === '3') && !actDone.two) {
      actDone.two = true;
      if (state.mode === 'full') {
        toks.push({ type: 'ms-divider', text: 'INTERMISSION', key: 'intermission' });
        toks.push({ type: 'blank' });
        if (msOpts.showActHeaders !== false) { toks.push({ type: 'act-header', text: 'ACT TWO', key: 'act2' }); toks.push({ type: 'blank' }); }
      }
    }
    emitCard(c);
  });
  return toks;
}

// ---- Pagination engine (§13a) -------------------------------------------
// The engine consumes an ordered list of BLOCKS — atomic units of layout — and
// places them on print pages by measuring real rendered height against an
// off-screen sheet sized exactly like the page. buildBlocks is the seam: the
// one place that knows how the flat token stream groups into units. Keeping the
// grouping here (not inline in the placer) is what lets the future land cleanly:
//   • §13b structured lines → a block can carry stable line ids
//   • dual dialogue → a block can carry `columns` (parallel token lists laid
//     side by side; the placer measures max(column heights) as the block height)
//   • over-tall content → a `splittable` block can break across a page boundary
// None of those touch the placer's measure-and-break loop.

// Flat tokens → blocks. A cue keeps its following lines together (a character
// never orphaned from their first line); headers stand alone with orphan
// control; blanks are spacers that never trigger a break.
function buildBlocks(toksRaw) {
  // Collapse consecutive blanks first — a stanza break is one blank; structural
  // doubles arise from hidden section tags leaving an orphan blank, or from
  // act/card boundaries abutting. Done up front so the cue-gathering loop (which
  // absorbs trailing blanks) never traps a double. Exception: blanks tagged
  // `pad` by cardBodyTokens are deliberate vertical spacing (column staggering)
  // and survive — only an untagged blank following another blank is dropped.
  const toks = [];
  for (const t of toksRaw) {
    if (t.type === 'blank' && !t.pad && toks.length && toks[toks.length - 1].type === 'blank') continue;
    toks.push(t);
  }
  const blocks = [];
  let i = 0;
  let prevRealType = null; // last non-blank token type seen
  let lastCueName = null; // last character to speak, for same-page CONT'D
  while (i < toks.length) {
    const tok = toks[i];
    // Scene/act/song boundaries break the CONT'D chain even if no other character spoke.
    if (['act-header', 'scene-header', 'song-num', 'section'].includes(tok.type)) lastCueName = null;
    if (tok.type === 'cue') {
      if (!tok.dual && lastCueName && tok.text.trim().toLowerCase() === lastCueName.trim().toLowerCase()) {
        tok.contd = true;
      }
      if (!tok.dual) lastCueName = tok.text;
      const tokens = [tok];
      let j = i + 1;
      while (j < toks.length) {
        const nxt = toks[j];
        const isMajor = ['act-header', 'song-num', 'scene-header', 'ms-divider', 'ms-title', 'action', 'note', 'section'].includes(nxt.type);
        const isNewCue = nxt.type === 'cue' && tokens.some((t) => !['cue', 'blank'].includes(t.type));
        if (isMajor || isNewCue) break;
        tokens.push(nxt);
        j++;
      }
      i = j;
      prevRealType = tokens[tokens.length - 1].type;
      // Dual dialogue: pair this cue with the one before it as side-by-side
      // columns. Drop any blank spacers sitting between them, then either start a
      // two-column block or extend an existing one (3+ way duals).
      if (tok.dual) {
        while (blocks.length && blocks[blocks.length - 1].blank) blocks.pop();
        const prev = blocks[blocks.length - 1];
        if (prev && !prev.blank && !prev.header) {
          blocks.pop();
          const cols = prev.columns ? [...prev.columns, tokens] : [prev.tokens, tokens];
          blocks.push({ tokens: [{ type: 'dual', columns: cols }], header: false, splittable: false, columns: cols });
          continue;
        }
      }
      blocks.push({ tokens, header: false, splittable: true, columns: null });
      continue;
    }
    if (tok.type === 'blank') { blocks.push({ tokens: [tok], blank: true, columns: null }); i++; continue; }
    const header = tok.type === 'act-header' || tok.type === 'scene-header' || tok.type === 'song-num';
    // Scene headings start a fresh page (screenplay/libretto convention) — except
    // the first scene under an act header, which rides on the act header's page.
    // The first scene rides on whatever opens the script — an act header or, in a
    // one-act (or a titled script with no act header), the show title page.
    const forceBreak = tok.type === 'scene-header' && prevRealType !== 'act-header' && prevRealType !== 'ms-title';
    blocks.push({ tokens: [tok], header, splittable: false, columns: null, forceBreak });
    prevRealType = tok.type;
    i++;
  }
  return blocks;
}

function paginateTokens(toks, lock) {
  return paginateBlocks(buildBlocks(toks), lock === undefined ? state.pageLock : lock);
}

// First stable key carried by a block / a placed page (skips blank spacers).
function blockLeadKey(b) {
  for (const t of b.tokens) { if (t.key) return t.key; }
  return null;
}
function pageLeadKey(page) {
  for (const t of page) { if (t.key) return t.key; }
  return null;
}

// Assign each page its production label. Unlocked → plain 1..N. Locked → each page
// whose leading anchor is a locked boundary keeps that boundary's number; pages
// that appear between two boundaries (because locked content grew) become A-pages
// (12A, 12B…). New trailing pages past the last boundary continue as A-pages of it.
function assignLabels(pages, lock) {
  if (!lock || !lock.pages || !lock.pages.length) {
    pages.forEach((p, i) => { p.label = String(i + 1); });
    return pages;
  }
  const anchorLabel = new Map(lock.pages.map((p) => [p.anchor, p.label]));
  let base = '1';
  let letter = 0;
  pages.forEach((p, i) => {
    const k = pageLeadKey(p);
    if (i === 0 && (!k || !anchorLabel.has(k))) { p.label = '1'; base = '1'; letter = 0; return; }
    if (k && anchorLabel.has(k)) { base = anchorLabel.get(k); letter = 0; p.label = base; }
    else { letter++; p.label = base + String.fromCharCode(64 + letter); }
  });
  return pages;
}

function paginateBlocks(blocks, lock) {
  const anchorSet = (lock && lock.pages) ? new Set(lock.pages.map((p) => p.anchor)) : null;
  const rig = el('div', { class: 'ms-sheet' });
  rig.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden; height:11in; min-height:0;';
  const hdr = renderSheetHeader(1, 1);
  rig.appendChild(hdr);
  const probe = el('div', { class: 'ms-sheet-content' });
  // Natural height (don't stretch to the page) so we can compare against the
  // real space available below the header.
  probe.style.cssText = 'flex:0 0 auto;';
  rig.appendChild(probe);
  document.body.appendChild(rig);

  const pages = [];
  let page = [];
  const ORPHAN_PX = 48; // ~3 lines: don't strand a header at the very bottom
  const BUDGET = rig.clientHeight - hdr.offsetHeight; // space below the header for content
  const fits = () => probe.offsetHeight <= BUDGET + 0.5;
  const remaining = () => BUDGET - probe.offsetHeight;
  const renderUnit = (unit) => unit.forEach((t) => renderPageToken(t, probe));

  let pending = []; // blank spacers held back so they never overflow or lead a page
  const breakPage = () => { pages.push(page); page = []; pending = []; probe.innerHTML = ''; };

  const isReal = (t) => t.type !== 'blank';
  const MIN_HEAD = 2; // cue + ≥1 line must stay together on the first page
  const MIN_TAIL = 2; // never push a lone widow line to the continuation

  // A splittable dialogue/lyric block overflowed the current page but would fit on
  // a fresh one — rather than move it whole (stranding a big gap), break it across
  // the boundary like Final Draft: fill this page, continue on the next with a
  // (CONT'D) cue. Returns true if it split; false to fall back to move-whole.
  const splitFill = (unit) => {
    // Re-measure against the real current page (probe currently holds the failed
    // tentative render): committed page + held blanks, then add lines until full.
    probe.innerHTML = '';
    page.forEach((t) => renderPageToken(t, probe));
    pending.forEach((t) => renderPageToken(t, probe));
    let fitN = 0;
    for (let n = 0; n < unit.length; n++) {
      renderPageToken(unit[n], probe);
      if (!fits()) { probe.removeChild(probe.lastChild); break; }
      fitN++;
    }
    const realIn = (a, b) => unit.slice(a, b).filter(isReal).length;
    // Prefer a stanza boundary: split at the latest blank spacer that fits, so a
    // whole stanza is never broken across pages. (The blank is the separator and
    // is dropped at the page foot.)
    let split = -1;
    for (let p = Math.min(fitN, unit.length - 1); p >= 1; p--) {
      if (unit[p].type === 'blank' && realIn(0, p) >= MIN_HEAD && realIn(p, unit.length) >= MIN_TAIL) { split = p; break; }
    }
    // No usable stanza break fits (a single stanza is taller than the space) —
    // fall back to a line-level split after the last real line that fit.
    if (split < 0) {
      split = fitN;
      while (split > 0 && !isReal(unit[split - 1])) split--;
      while (split > 0 && realIn(split, unit.length) < MIN_TAIL) {
        split--;
        while (split > 0 && !isReal(unit[split - 1])) split--;
      }
      if (realIn(0, split) < MIN_HEAD || realIn(split, unit.length) < MIN_TAIL) return false;
    }

    const head = unit.slice(0, split);
    // Drop leading blanks on the continuation so it never opens with a spacer.
    let ts = split; while (ts < unit.length && !isReal(unit[ts])) ts++;
    const tailTokens = unit.slice(ts);

    pending.forEach((t) => page.push(t)); pending = [];
    head.forEach((t) => page.push(t));
    breakPage();

    const cueTok = unit.find((t) => t.type === 'cue');
    const cont = [];
    if (cueTok && tailTokens[0] && tailTokens[0].type !== 'cue') {
      cont.push(Object.assign({}, cueTok, { contd: true, key: undefined })); // synthetic CONT'D, no anchor
    }
    tailTokens.forEach((t) => cont.push(t));
    placeBlock({ tokens: cont, header: false, splittable: true, columns: null });
    return true;
  };

  // Place one block. `header` units get orphan control; splittable dialogue/lyric
  // breaks across the page boundary; a block taller than a whole page (rare) is
  // laid token-by-token so nothing ever clips.
  const placeBlock = (b) => {
    const unit = b.tokens, header = !!b.header;
    const splittable = !!b.splittable && !b.columns && unit.filter(isReal).length > MIN_HEAD;
    pending.forEach((t) => renderPageToken(t, probe)); // tentatively include held blanks
    renderUnit(unit);
    const overflow = page.length > 0 && !fits();
    const orphaned = header && page.length > 0 && remaining() < ORPHAN_PX;
    if (!overflow && !orphaned) {
      pending.forEach((t) => page.push(t)); // blanks earned their place between content
      pending = [];
      unit.forEach((t) => page.push(t));
      return;
    }
    if (overflow && splittable && page.length > 0 && splitFill(unit)) return;
    // Won't fit here → fresh page; held blanks are dropped at the boundary.
    breakPage();
    renderUnit(unit);
    if (fits() || unit.length <= 1) { unit.forEach((t) => page.push(t)); return; }
    // Taller than a whole page: lay tokens one at a time, breaking as they fill.
    probe.innerHTML = '';
    unit.forEach((t) => {
      renderPageToken(t, probe);
      if (page.length > 0 && !fits()) { probe.removeChild(probe.lastChild); breakPage(); renderPageToken(t, probe); }
      page.push(t);
    });
  };

  blocks.forEach((b) => {
    if (b.blank) { pending.push(b.tokens[0]); return; } // defer — decide at the next real block
    // Locked boundary: a frozen page always begins exactly where it did at lock
    // time, so earlier pages never reflow when later content changes.
    const atAnchor = anchorSet && page.length > 0 && anchorSet.has(blockLeadKey(b));
    if ((b.forceBreak || atAnchor) && page.length > 0) breakPage(); // scene / locked boundary starts a new page
    placeBlock(b);
  });
  // trailing pending blanks are intentionally dropped (no spacer at a page foot)

  rig.remove();
  if (page.length) pages.push(page);

  // Mark CONT'D: if the same character's cue is both last on page N and first on page N+1
  for (let p = 1; p < pages.length; p++) {
    let lastCue = null;
    for (let i = pages[p - 1].length - 1; i >= 0; i--) {
      if (pages[p - 1][i].type === 'cue') { lastCue = pages[p - 1][i]; break; }
    }
    if (!lastCue) continue;
    for (let i = 0; i < pages[p].length; i++) {
      if (pages[p][i].type === 'blank') continue;
      if (pages[p][i].type === 'cue' && pages[p][i].text === lastCue.text) {
        pages[p][i] = { ...pages[p][i], contd: true };
      }
      break;
    }
  }

  return assignLabels(pages, lock);
}

function renderPageToken(tok, container) {
  if (tok.type === 'blank') {
    container.appendChild(el('div', { class: 'lw-blank' }));
  } else if (tok.type === 'ms-title') {
    container.appendChild(el('div', { class: 'ms-sheet-show-title', text: tok.text }));
  } else if (tok.type === 'act-header') {
    container.appendChild(el('div', { class: 'lw-act-header', text: tok.text }));
  } else if (tok.type === 'ms-divider') {
    container.appendChild(el('div', { class: 'ms-divider' }, [el('span', { text: tok.text })]));
  } else if (tok.type === 'scene-header') {
    container.appendChild(el('div', { class: 'lw-scene-header', text: tok.text.toUpperCase() }));
  } else if (tok.type === 'song-num') {
    container.appendChild(el('div', { class: 'lw-song-header', text: `(#${String(tok.num).padStart(2, '0')}) ${(tok.title || '').toUpperCase()}` }));
  } else if (tok.type === 'section') {
    if (tok.subtype === 'act') container.appendChild(el('div', { class: 'lw-act-header', text: tok.text.toUpperCase() }));
    else if (tok.subtype === 'scene') container.appendChild(el('div', { class: 'lw-scene-header', text: tok.text.toUpperCase() }));
    else if (tok.subtype === 'song-num') { const m = tok.text.match(/^#(\d+)[\s\-](.*)/i); container.appendChild(el('div', { class: 'lw-song-header', text: m ? `(#${m[1]}) ${m[2].toUpperCase()}` : tok.text })); }
    else container.appendChild(el('div', { class: 'lw-section-row' }, [el('span', { class: 'lw-section-tag', text: '[' + tok.text + ']' })]));
  } else if (tok.type === 'cue')      { container.appendChild(el('div', { class: 'lw-char', html: emphToHtml(tok.text.toUpperCase()) + (tok.contd ? " (CONT'D)" : '') }));
  } else if (tok.type === 'sung')     { container.appendChild(el('div', { class: 'lw-sung' + (tok.lane ? ' lw-chord-lane' : ''), html: emphToHtml(tok.text) }));
  } else if (tok.type === 'paren')    { container.appendChild(el('div', { class: 'lw-paren', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'dialogue') { container.appendChild(el('div', { class: 'lw-dialogue', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'action')   { container.appendChild(el('div', { class: 'lw-action', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'scenebreak') { container.appendChild(el('div', { class: 'lw-scenebreak', text: '⁂' })); // ⁂ divider, centered — text itself isn't meaningful
  } else if (tok.type === 'note')     { container.appendChild(el('div', { class: 'lw-note-ms', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'dual') {
    // Side-by-side columns. Each column renders its own token list; the row's
    // height is naturally max(column heights), which the placer measures.
    const row = el('div', { class: 'lw-dual' });
    tok.columns.forEach((col) => {
      const cell = el('div', { class: 'lw-col' });
      col.forEach((t) => renderPageToken(t, cell));
      row.appendChild(cell);
    });
    container.appendChild(row);
  }
  // Tag the rendered element with a scroll anchor so switching to/from Edit view
  // can keep the same content under the viewport top (see anchorFromKey).
  const node = container.lastElementChild;
  if (node) {
    const a = anchorFromKey(tok.key);
    if (a && !node.dataset.anchor) node.dataset.anchor = a;
  }
  // Revision mark: a margin asterisk on any line changed under the active revision.
  if (tok.lastRev && state.currentRev && tok.lastRev === state.currentRev && state.msOptions.showRevisions !== false) {
    if (node) { node.classList.add('lw-rev'); node.style.setProperty('--revc', currentRevColor()); }
  }
}

// ---- Book pagination (Prose Plot, Phase 1b) -------------------------------
// A dedicated, simpler measure-and-break loop for Book view. Deliberately NOT
// sharing paginateBlocks/renderPageToken: those are tuned for script content
// (dual columns, cue/CONT'D handling, stanza-aware splitFill) and the ground
// rule for this phase is that Manuscript output must stay pixel-identical —
// safest guarantee of that is a fully separate render+paginate path for Book.
// Chapters come straight from state.cards (a chapter IS a scene card in Prose
// Plot — see cardBodyField/emitCard); a chapter's body tokens are exactly what
// cardBodyTokens() already produces (action/scenebreak/blank), so no new
// parsing is needed, only a new renderer + pagination loop for them.
function bookChapters() {
  const order = displayOrder();
  return order
    .map((i) => state.cards[i])
    .filter((c) => c.type === 'scene')
    .map((c) => ({ id: c.id, key: 'sc:' + c.id, title: c.title || 'Chapter', tokens: cardBodyTokens(c) }));
}

// Flat chapters → atomic blocks. Paragraphs and scene breaks are not split
// across pages in this phase (a "render skeleton" — see BOOK-FORMATTING-PLAN.md);
// a block taller than the page just moves whole to the next one.
function buildBookBlocks(chapters) {
  const blocks = [];
  chapters.forEach((ch, ci) => {
    blocks.push({ tokens: [{ type: 'book-chapter-title', text: ch.title, key: ch.key, num: ci + 1 }], forceBreak: ci > 0 });
    let firstDone = false;
    ch.tokens.forEach((t) => {
      if (t.type === 'blank') return; // book paragraph spacing is margin-based, not spacer tokens
      // Mark the chapter's first body paragraph so the theme's opener flourish
      // (drop cap / raised cap / small caps) lands there. Copy the token — never
      // mutate cardBodyTokens' output, which the Edit/Print/Fountain renderers share.
      if (!firstDone && t.type === 'action') { blocks.push({ tokens: [{ ...t, firstPara: true }] }); firstDone = true; }
      else blocks.push({ tokens: [t] });
    });
  });
  return blocks;
}

function paginateBookBlocks(blocks, bookFont, dims) {
  const rig = el('div', { class: 'book-sheet ' + bookThemeClasses(state.book.theme) });
  rig.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden; min-height:0;';
  if (dims) applyBookDims(rig, dims);
  // A fixed measurement height (page height), not min-height, so clientHeight is
  // exactly the page — the content budget is that minus the sheet's own padding.
  rig.style.height = dims ? (dims.hIn * BOOK_DPI) + 'px' : '11in';
  if (bookFont) rig.style.setProperty('--book-font', bookFont);
  const probe = el('div', { class: 'book-sheet-content' });
  probe.style.cssText = 'flex:0 0 auto;';
  rig.appendChild(probe);
  document.body.appendChild(rig);

  const pages = [];
  let page = [];
  const BUDGET = rig.clientHeight;
  const fits = () => probe.offsetHeight <= BUDGET + 0.5;
  const breakPage = () => { pages.push(page); page = []; probe.innerHTML = ''; };
  const renderUnit = (unit) => unit.forEach((t) => renderBookToken(t, probe));

  blocks.forEach((b) => {
    if (b.forceBreak && page.length > 0) breakPage();
    renderUnit(b.tokens);
    if (page.length > 0 && !fits()) {
      breakPage();
      renderUnit(b.tokens);
    }
    b.tokens.forEach((t) => page.push(t));
  });

  rig.remove();
  if (page.length) pages.push(page);
  return pages;
}

function renderBookToken(tok, container) {
  const theme = state.book.theme;
  if (tok.type === 'book-chapter-title') {
    // A chapter opener is the auto-generated label ("Chapter One" / "I" / "1")
    // plus, optionally, the card's own title beneath it. The label style, the
    // font, and the first-paragraph flourish all come from the active theme.
    const wrap = el('div', { class: 'book-chapter-title bk-label-' + theme.chapterLabel });
    const labelText = chapterLabelText(theme, tok.num || 1);
    if (labelText) wrap.appendChild(el('div', { class: 'book-ch-label' }, [document.createTextNode(labelText)]));
    const title = (tok.text || '').trim();
    // Skip the card title when it's just a restatement of the auto label
    // (e.g. a chapter literally named "Chapter 1") to avoid printing it twice.
    if (theme.showChapterTitle && title && title.toLowerCase() !== labelText.trim().toLowerCase()) {
      wrap.appendChild(el('div', { class: 'book-ch-name', html: emphToHtml(title) }));
    }
    container.appendChild(wrap);
  } else if (tok.type === 'action') {
    const p = el('p', { class: 'book-para', html: emphToHtml(tok.text) });
    if (tok.firstPara && theme.opener && theme.opener !== 'plain') applyChapterOpener(p, theme.opener);
    container.appendChild(p);
  } else if (tok.type === 'scenebreak') {
    const div = el('div', { class: 'book-scenebreak bk-break-' + theme.sceneBreak });
    const g = sceneBreakGlyph(theme.sceneBreak);
    if (g) div.textContent = g;
    container.appendChild(div);
  }
  const node = container.lastElementChild;
  if (node) {
    const a = anchorFromKey(tok.key);
    if (a && !node.dataset.anchor) node.dataset.anchor = a;
  }
}
// Scene-break glyph per theme. 'space'/'rule' return '' (the gap / the thin rule
// are drawn by CSS on .bk-break-space / .bk-break-rule); the rest are glyphs.
// 'ornament' (asterism) predates Phase 5 and is kept for saved shows.
function sceneBreakGlyph(style) {
  switch (style) {
    case 'space': return '';
    case 'rule': return '';
    case 'ornament': return '⁂';
    case 'fleuron': return '❦';
    case 'dot': return '·';
    case 'asterisks': default: return '* * *';
  }
}

// Phase 5 theme classes that ride on the .book-sheet (and the pagination probe,
// so page breaks fall at the same leading/paragraph metrics the render uses).
// Paragraph style (indent vs block), line spacing, and opener size are all
// carried here rather than as inline vars so the CSS enum stays in one place.
function bookThemeClasses(theme) {
  return 'bk-para-' + (theme.paraStyle === 'block' ? 'block' : 'indent')
    + ' bk-lead-' + (theme.lineSpacing || 'normal')
    + ' bk-opener-' + (theme.openerSize || 'medium');
}

// Chapter heading text for the label style. 'word'/'numeral' keep the "Chapter"
// prefix; 'roman'/'bare' are the numeral alone (a minimal opener); 'custom' uses
// the author's string with '#' standing in for the chapter number.
function chapterLabelText(theme, num) {
  switch (theme.chapterLabel) {
    case 'word': return 'Chapter ' + numberToWords(num);
    case 'numeral': return 'Chapter ' + num;
    case 'roman': return romanNumeral(num);
    case 'bare': return String(num);
    case 'custom': {
      const t = (theme.chapterLabelCustom || '').trim();
      return t ? t.replace(/#/g, num) : 'Chapter ' + num;
    }
    default: return 'Chapter ' + num;
  }
}
const ONES_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS_WORDS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function numberToWords(n) {
  n = Math.floor(n);
  if (n < 0) return String(n);
  if (n < 20) return ONES_WORDS[n];
  if (n < 100) { const t = Math.floor(n / 10), o = n % 10; return TENS_WORDS[t] + (o ? '-' + ONES_WORDS[o].toLowerCase() : ''); }
  return String(n); // beyond ninety-nine, fall back to the numeral
}
function romanNumeral(n) {
  n = Math.floor(n);
  if (n <= 0 || n >= 4000) return String(n);
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '', x = n;
  for (let i = 0; i < map.length; i++) { while (x >= map[i][0]) { r += map[i][1]; x -= map[i][0]; } }
  return r;
}
// First-paragraph flourish (drop cap / raised cap / small-caps opening).
// Operates on the rendered DOM's first visible text node so it composes with
// emphasis markup, and runs in the pagination probe too — the measurement pass
// sees the exact styles the render pass uses, so line-wrapping stays honest.
function applyChapterOpener(p, opener) {
  const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
  let node = null, n;
  while ((n = tw.nextNode())) { if (n.nodeValue && n.nodeValue.trim()) { node = n; break; } }
  if (!node) return;
  const raw = node.nodeValue;
  if (opener === 'smallcaps') {
    const m = raw.match(/^(\s*)((?:\S+\s+){0,3}\S+)([\s\S]*)$/);
    if (!m) return;
    const span = el('span', { class: 'book-smallcaps' }, [document.createTextNode(m[2])]);
    node.replaceWith(document.createTextNode(m[1]), span, document.createTextNode(m[3]));
    return;
  }
  const m = raw.match(/^(\s*)(\S)([\s\S]*)$/);
  if (!m) return;
  const cls = opener === 'raisedcap' ? 'book-raisedcap' : 'book-dropcap';
  const span = el('span', { class: cls }, [document.createTextNode(m[2])]);
  node.replaceWith(document.createTextNode(m[1]), span, document.createTextNode(m[3]));
}

// Front/back-matter blocks with no printed heading in the finished book
// (dedication/epigraph are conventionally just centered text, no label).
const NO_HEADING_MATTER_KINDS = new Set(['dedication', 'epigraph']);
function matterKindLabel(kind) {
  const all = BOOK_MATTER_KINDS.front.concat(BOOK_MATTER_KINDS.back);
  const m = all.find((k) => k.kind === kind);
  return m ? m.label : kind;
}
function renderMatterBody(container, text) {
  (text || '').split(/\n{2,}/).forEach((para) => {
    const p = para.trim();
    if (p) container.appendChild(el('p', { class: 'book-para', html: emphToHtml(p) }));
  });
}

const BOOK_FONT_FAMILIES = {
  ebgaramond: "'EB Garamond', Georgia, 'Times New Roman', serif",
  literata: "'Literata', Georgia, 'Times New Roman', serif",
  crimsonpro: "'Crimson Pro', Georgia, 'Times New Roman', serif",
};
function bookFontFamily(id) {
  return BOOK_FONT_FAMILIES[id] || BOOK_FONT_FAMILIES.ebgaramond;
}

// Vellum-style "pick one bundle" themes. Choosing a preset copies its values
// into state.book.theme (not a live reference), so editing any single knob
// afterward diverges the theme to 'custom' — presets and manual knobs coexist.
const BOOK_THEME_PRESETS = [
  { id: 'classic', name: 'Classic', font: 'ebgaramond', chapterLabel: 'word', opener: 'plain', sceneBreak: 'asterisks' },
  { id: 'modern', name: 'Modern', font: 'literata', chapterLabel: 'bare', opener: 'smallcaps', sceneBreak: 'space' },
  { id: 'elegant', name: 'Elegant', font: 'crimsonpro', chapterLabel: 'roman', opener: 'dropcap', sceneBreak: 'ornament' },
  { id: 'plain', name: 'Plain', font: 'literata', chapterLabel: 'numeral', opener: 'plain', sceneBreak: 'asterisks' },
];
function applyThemePreset(id) {
  const p = BOOK_THEME_PRESETS.find((t) => t.id === id);
  if (!p) return;
  const t = state.book.theme;
  t.id = p.id; t.font = p.font; t.chapterLabel = p.chapterLabel; t.opener = p.opener; t.sceneBreak = p.sceneBreak;
  // showChapterTitle and chapterLabelCustom are the author's, not the preset's —
  // leave them untouched across a preset switch.
}

// Book trim (page) sizes. Book view/PDF render at these real dimensions rather
// than US Letter. 96 CSS px per inch — sizing in inches (not px) keeps the
// print @page and the on-screen sheet exactly aligned.
const BOOK_DPI = 96;
const BOOK_TRIM_SIZES = {
  '5x8': { w: 5, h: 8, label: '5 × 8″' },
  '5.25x8': { w: 5.25, h: 8, label: '5.25 × 8″' },
  '5.5x8.5': { w: 5.5, h: 8.5, label: '5.5 × 8.5″' },
  '6x9': { w: 6, h: 9, label: '6 × 9″' },
};
// Resolve the active trim to page dimensions + margins (all inches). When
// `mirrored`, the inner (gutter/spine) and outer (fore-edge) margins differ and
// flip per page side (recto/verso — Phase 3b); otherwise both collapse to their
// average, matching the pre-3b uniform look. `sideIn` stays as that average for
// any sheet rendered without a recto/verso class (e.g. the pagination probe).
function bookTrimDims() {
  const t = (state.book && state.book.trim) || {};
  const size = BOOK_TRIM_SIZES[t.size] || BOOK_TRIM_SIZES['6x9'];
  const gutter = t.gutterIn != null ? t.gutterIn : 0.75;
  const outside = t.outsideIn != null ? t.outsideIn : 0.5;
  const avg = (gutter + outside) / 2;
  const mirrored = t.mirrored !== false;
  return {
    wIn: size.w,
    hIn: size.h,
    innerIn: mirrored ? gutter : avg,
    outerIn: mirrored ? outside : avg,
    sideIn: avg,
    topIn: t.topIn != null ? t.topIn : 0.75,
    bottomIn: t.bottomIn != null ? t.bottomIn : 0.75,
    mirrored,
    chapterStartRecto: t.chapterStartRecto !== false,
  };
}
// Stamp the page/margin CSS variables the .book-sheet + .book-sheet-content
// rules read. Applied to every sheet AND the pagination probe so measurement
// wraps text at the exact same content width the render does. inner/outer are
// mirrored per side by the .recto/.verso CSS; their sum is constant, so the
// content width (and thus line-wrapping) is identical on either side.
function applyBookDims(node, dims) {
  node.style.setProperty('--book-page-w', (dims.wIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-page-h', (dims.hIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-pad-top', (dims.topIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-pad-bottom', (dims.bottomIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-pad-inner', (dims.innerIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-pad-outer', (dims.outerIn * BOOK_DPI) + 'px');
  node.style.setProperty('--book-pad-side', (dims.sideIn * BOOK_DPI) + 'px');
}

// Prose Plot's Edit-mode writing font — a per-device comfort preference
// (state.msOptions, like zoom/paraStyle), independent of Manuscript output,
// which stays Courier for agent submission regardless of this setting.
const EDIT_FONT_LABELS = {
  courier: 'Courier (Manuscript)',
  ebgaramond: 'EB Garamond',
  literata: 'Literata',
  crimsonpro: 'Crimson Pro',
  iawriterduo: 'iA Writer Duo',
};
const EDIT_FONT_FAMILIES = {
  courier: "'Courier Prime', 'Courier New', Courier, monospace",
  ebgaramond: "'EB Garamond', Georgia, 'Times New Roman', serif",
  literata: "'Literata', Georgia, 'Times New Roman', serif",
  crimsonpro: "'Crimson Pro', Georgia, 'Times New Roman', serif",
  iawriterduo: "'iA Writer Duo', 'Courier Prime Sans', 'Courier New', Courier, monospace",
};
function editFontFamily(id) {
  return EDIT_FONT_FAMILIES[id] || EDIT_FONT_FAMILIES.courier;
}

// Song Sheet reading font — a presentation choice for the lyric-window Sheet
// view (screen, Print, and PDF), picked from the sheet bar and persisted in
// sheetOpts.font. The Manuscript is deliberately excluded: it always stays
// Courier (it never reads --sheet-font, so the fallback below applies).
const SHEET_FONT_LABELS = {
  courierprime: 'Courier Prime',
  courierprimesans: 'Courier Prime Sans',
  crimsonpro: 'Crimson Pro',
  literata: 'Literata',
  helvetica: 'Helvetica',
};
const SHEET_FONT_FAMILIES = {
  courierprime: "'Courier Prime', 'Courier New', Courier, monospace",
  courierprimesans: "'Courier Prime Sans', 'Courier New', Courier, monospace",
  crimsonpro: "'Crimson Pro', Georgia, 'Times New Roman', serif",
  literata: "'Literata', Georgia, 'Times New Roman', serif",
  helvetica: "Helvetica, Arial, sans-serif",
};
function sheetFontFamily(id) { return SHEET_FONT_FAMILIES[id] || SHEET_FONT_FAMILIES.courierprime; }
function applyEditFont() {
  const doc = document.querySelector('.ms-edit-doc');
  if (doc) doc.style.setProperty('--edit-font', editFontFamily(state.msOptions.editFont));
}

// Build the full Book-view sheet list: front matter → chapters → back matter.
// Shared by the on-screen Book mode (rebuildBook, inside buildManuscriptPage)
// and exportBookPDF (top-level) so the two can never drift apart.
//
// Phase 3b: the flat sheet list first becomes an ordered list of page
// descriptors; a second pass then assigns page *sides* (recto/verso), folios
// (roman for front matter, arabic restarting at chapter one), running heads,
// and any chapterStartRecto blanks — the trade-layout logic every real book
// obeys. Descriptors → DOM last, so consumers still receive .book-sheet nodes.
function buildBookSheets() {
  const book = state.book;
  const bookTitle = state.title || 'Untitled';
  const author = book.meta.authorName || '';
  const bookFont = bookFontFamily(book.theme.font);
  const dims = bookTrimDims();
  const chapters = bookChapters();
  const bodyPages = paginateBookBlocks(buildBookBlocks(chapters), bookFont, dims);

  const mkContent = (inner) => el('div', { class: 'book-sheet-content' }, [inner]);

  // ── Pass 1: build page descriptors in reading order ───────────────
  const pages = [];
  const tocFrontIndex = book.matter.front.findIndex((b) => b.include && b.kind === 'toc');

  book.matter.front.forEach((b, fi) => {
    if (!b.include) return;
    if (b.kind === 'halftitle') {
      pages.push({ zone: 'front', frontIndex: fi, contentEl: mkContent(el('div', { class: 'book-halftitle' }, [el('div', { class: 'book-halftitle-text', text: bookTitle })])) });
    } else if (b.kind === 'titlepage') {
      const kids = [el('div', { class: 'book-titlepage-title', text: bookTitle })];
      if (author) kids.push(el('div', { class: 'book-titlepage-author', text: author }));
      pages.push({ zone: 'front', frontIndex: fi, outlineTitle: 'Title Page', contentEl: mkContent(el('div', { class: 'book-titlepage' }, kids)) });
    } else if (b.kind === 'copyright') {
      const wrap = el('div', { class: 'book-copyright' });
      const year = b.copyrightYear || String(new Date().getFullYear());
      const holder = b.copyrightHolder || author;
      wrap.appendChild(el('p', { class: 'book-copyright-line', text: `Copyright © ${year}${holder ? ' ' + holder : ''}` }));
      if (b.edition) wrap.appendChild(el('p', { class: 'book-copyright-line', text: b.edition }));
      wrap.appendChild(el('p', { class: 'book-copyright-line', text: 'All rights reserved.' }));
      if (b.rightsText && b.rightsText.trim()) renderMatterBody(wrap, b.rightsText);
      pages.push({ zone: 'front', frontIndex: fi, outlineTitle: 'Copyright', contentEl: mkContent(wrap) });
    } else if (b.kind === 'toc') {
      // Rows are filled after side/folio assignment so the TOC can show each
      // chapter's real book folio (arabic), not a body-flow ordinal.
      const wrap = el('div', { class: 'book-toc' }, [el('div', { class: 'book-toc-heading', text: 'Contents' })]);
      pages.push({ zone: 'front', frontIndex: fi, kind: 'toc', outlineTitle: 'Contents', tocWrap: wrap, contentEl: mkContent(wrap) });
    } else {
      const wrap = el('div', { class: 'book-matter-freetext' });
      if (!NO_HEADING_MATTER_KINDS.has(b.kind)) wrap.appendChild(el('div', { class: 'book-chapter-title', text: b.title || matterKindLabel(b.kind) }));
      renderMatterBody(wrap, b.text);
      pages.push({ zone: 'front', frontIndex: fi, outlineTitle: b.title || matterKindLabel(b.kind), contentEl: mkContent(wrap) });
    }
  });

  bodyPages.forEach((pageToks) => {
    const content = el('div', { class: 'book-sheet-content' });
    pageToks.forEach((tok) => renderBookToken(tok, content));
    const first = pageToks[0];
    const isOpener = !!(first && first.type === 'book-chapter-title');
    pages.push({ zone: 'body', contentEl: content, isChapterOpener: isOpener, chapterKey: isOpener ? first.key : null, outlineTitle: isOpener ? first.text : null });
  });

  book.matter.back.forEach((b) => {
    if (!b.include) return;
    const wrap = el('div', { class: 'book-matter-freetext' });
    wrap.appendChild(el('div', { class: 'book-chapter-title', text: b.title || matterKindLabel(b.kind) }));
    renderMatterBody(wrap, b.text);
    pages.push({ zone: 'back', outlineTitle: b.title || matterKindLabel(b.kind), contentEl: mkContent(wrap) });
  });

  // ── Pass 2: insert chapterStartRecto blanks ───────────────────────
  // A chapter should open on a recto (right-hand, odd page). If it would fall
  // on a verso, pad with a blank leaf. The blank before the FIRST chapter is a
  // front-matter leaf (roman) so arabic numbering starts clean at chapter one;
  // blanks between later chapters are body leaves (they consume an arabic page).
  const seq = [];
  let bodyStarted = false;
  pages.forEach((p) => {
    if (p.zone === 'body' && p.isChapterOpener && dims.chapterStartRecto) {
      if ((seq.length + 1) % 2 === 0) seq.push({ blank: true, zone: bodyStarted ? 'body' : 'front' });
    }
    if (p.zone === 'body') bodyStarted = true;
    seq.push(p);
  });

  // ── Pass 3: assign sides, folios, running heads ───────────────────
  let roman = 0, arabic = 0;
  seq.forEach((p, i) => {
    p.side = (i + 1) % 2 === 1 ? 'recto' : 'verso';
    const arabicZone = p.zone !== 'front';
    if (arabicZone) p.folioNum = ++arabic; else p.folioNum = ++roman;
    if (p.blank) { p.folioText = ''; p.headText = ''; return; }
    if (arabicZone) {
      p.folioText = p.isChapterOpener ? '' : String(p.folioNum);
    } else {
      // Front matter carries roman folios, printed only from the TOC onward
      // (half-title/title/copyright/dedication are conventionally unnumbered).
      const show = tocFrontIndex >= 0 && p.frontIndex >= tocFrontIndex;
      p.folioText = show ? romanNumeral(p.folioNum).toLowerCase() : '';
    }
    // Running heads live on body text pages only: author verso, title recto.
    // Chapter openers, front/back matter, and blanks stay head-free.
    p.headText = (p.zone === 'body' && !p.isChapterOpener)
      ? (p.side === 'verso' ? author : bookTitle)
      : '';
  });

  // ── Fill TOC rows with real chapter folios ────────────────────────
  const chapterFolio = {};
  seq.forEach((p) => {
    if (p.zone === 'body' && p.isChapterOpener && p.chapterKey && chapterFolio[p.chapterKey] === undefined) chapterFolio[p.chapterKey] = p.folioNum;
  });
  pages.forEach((p) => {
    if (p.kind !== 'toc') return;
    chapters.forEach((ch) => {
      const row = el('div', { class: 'book-toc-row' }, [
        el('span', { class: 'book-toc-title', text: ch.title }),
        el('span', { class: 'book-toc-num', text: String(chapterFolio[ch.key] || '') }),
      ]);
      row.dataset.pdfChapterKey = ch.key;   // PDF export turns each row into a clickable link
      p.tocWrap.appendChild(row);
    });
  });

  // ── Pass 4: descriptors → .book-sheet DOM ─────────────────────────
  return seq.map((p) => {
    let cls = 'book-sheet ' + (p.side || 'recto') + ' ' + bookThemeClasses(state.book.theme);
    if (p.blank) cls += ' book-blank';
    const sheet = el('div', { class: cls });
    sheet.style.setProperty('--book-font', bookFont);
    applyBookDims(sheet, dims);
    // PDF export reads these to build bookmarks + resolve TOC links (harmless elsewhere).
    if (!p.blank && p.outlineTitle) sheet.dataset.pdfOutline = p.outlineTitle;
    if (p.chapterKey) sheet.dataset.pdfChapterKey = p.chapterKey;
    if (p.headText) sheet.appendChild(el('div', { class: 'book-head', text: p.headText }));
    sheet.appendChild(p.contentEl || el('div', { class: 'book-sheet-content' }));
    if (p.folioText) sheet.appendChild(el('div', { class: 'book-folio', text: p.folioText }));
    return sheet;
  });
}

function exportBookPDF() {
  const prev = document.getElementById('pdf-print-root');
  if (prev) prev.remove();
  const prevStyle = document.getElementById('book-trim-print');
  if (prevStyle) prevStyle.remove();
  // @page can't read runtime CSS variables, so emit the trim's literal page size
  // (and a matching sheet box) as a one-off <style> just for this print. The
  // sheet height is shaved 0.4in below the page — same WebKit double-break guard
  // as the Letter rule in styles.css; ink never reaches there (bottom margin ≥ 0.4in).
  const dims = bookTrimDims();
  const style = el('style', { id: 'book-trim-print' });
  style.textContent =
    '@media print{@page{size:' + dims.wIn + 'in ' + dims.hIn + 'in;margin:0}' +
    '#pdf-print-root .book-sheet{width:' + dims.wIn + 'in;height:' + (dims.hIn - 0.4) + 'in}}';
  document.head.appendChild(style);
  const root = el('div', { id: 'pdf-print-root' });
  buildBookSheets().forEach((sheet) => root.appendChild(sheet));
  document.body.appendChild(root);
  const cleanup = () => { root.remove(); style.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
}

// ─── EPUB export (Prose Plot) — Phase 4a: packaging + chapter XHTML ───────────
// Dependency-free EPUB 3. A stored-only (no compression) ZIP writer keeps this to
// vanilla JS: the `mimetype` entry just has to be written first. Phase 4a produces
// a minimally-valid, openable book (container + OPF + nav + chapter XHTML + themed
// CSS with the embedded serif face); full metadata, cover, front/back matter, and
// the user-facing download button are Phase 4b.

// CRC-32 (IEEE, reflected) — the one checksum ZIP entries require.
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Assemble a ZIP archive with every entry STORED (method 0). Entries are
// { name, bytes:Uint8Array }; `mimetype` must be caller's first entry. Returns a
// Blob(application/epub+zip). Local headers → central directory → EOCD, the
// minimal spec-legal layout; a fixed 1980-01-01 DOS date avoids the invalid
// zero-date some validators flag (and keeps output deterministic).
function zipStore(entries) {
  const parts = [];
  let offset = 0;
  const u16 = (n) => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF]);
  const u32 = (n) => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
  const push = (a) => { parts.push(a); offset += a.length; };
  const DOS_DATE = 0x0021; // 1980-01-01
  const DOS_TIME = 0x0000; // 00:00:00

  const records = entries.map((e) => {
    const nameBytes = new TextEncoder().encode(e.name);
    const crc = crc32(e.bytes);
    const localOffset = offset;
    push(u32(0x04034b50)); // local file header signature
    push(u16(20));         // version needed
    push(u16(0));          // flags
    push(u16(0));          // method 0 = stored
    push(u16(DOS_TIME)); push(u16(DOS_DATE));
    push(u32(crc));
    push(u32(e.bytes.length)); // compressed size (== uncompressed, stored)
    push(u32(e.bytes.length)); // uncompressed size
    push(u16(nameBytes.length));
    push(u16(0));          // extra length
    push(nameBytes);
    push(e.bytes);
    return { nameBytes, crc, size: e.bytes.length, localOffset };
  });

  const cdStart = offset;
  records.forEach((r) => {
    push(u32(0x02014b50)); // central directory signature
    push(u16(20)); push(u16(20)); // version made by / needed
    push(u16(0)); push(u16(0));    // flags / method
    push(u16(DOS_TIME)); push(u16(DOS_DATE));
    push(u32(r.crc));
    push(u32(r.size)); push(u32(r.size));
    push(u16(r.nameBytes.length));
    push(u16(0)); push(u16(0));    // extra / comment length
    push(u16(0)); push(u16(0));    // disk # start / internal attrs
    push(u32(0));                  // external attrs
    push(u32(r.localOffset));
    push(r.nameBytes);
  });
  const cdSize = offset - cdStart;

  push(u32(0x06054b50)); // end of central directory
  push(u16(0)); push(u16(0)); // disk numbers
  push(u16(records.length)); push(u16(records.length));
  push(u32(cdSize));
  push(u32(cdStart));
  push(u16(0));          // comment length

  let total = 0; parts.forEach((p) => { total += p.length; });
  const out = new Uint8Array(total);
  let at = 0; parts.forEach((p) => { out.set(p, at); at += p.length; });
  return new Blob([out], { type: 'application/epub+zip' });
}

// Text → escaped XML content (element bodies only — quotes stay literal, which is
// fine outside attributes). Strips app-only markup (notes/chords/highlight/strike)
// exactly like the Fountain exporter — those must never leak into a book — then
// applies book emphasis. Bold/italic/underline survive; nothing else does.
function emphToXhtml(text) {
  let s = escHtml(stripToFountainText(text || ''));
  s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
       .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
       .replace(/_([^_]+?)_/g, '<u>$1</u>');
  return s;
}

const EPUB_FONT_FILES = {
  ebgaramond: { family: 'EB Garamond', files: { regular: 'EBGaramond-Regular.woff2', italic: 'EBGaramond-Italic.woff2', bold: 'EBGaramond-Bold.woff2', bolditalic: 'EBGaramond-BoldItalic.woff2' } },
  literata: { family: 'Literata', files: { regular: 'Literata-Regular.woff2', italic: 'Literata-Italic.woff2', bold: 'Literata-Bold.woff2', bolditalic: 'Literata-BoldItalic.woff2' } },
  crimsonpro: { family: 'Crimson Pro', files: { regular: 'CrimsonPro-Regular.woff2', italic: 'CrimsonPro-Italic.woff2', bold: 'CrimsonPro-Bold.woff2', bolditalic: 'CrimsonPro-BoldItalic.woff2' } },
};

// Wrap inner markup in an XHTML5 document shell (charset, title, book.css link).
function epubXhtmlDoc(titleText, bodyClass, innerHtml) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">\n' +
    '<head>\n<meta charset="utf-8"/>\n<title>' + escHtml(titleText || '') + '</title>\n' +
    '<link rel="stylesheet" type="text/css" href="book.css"/>\n</head>\n' +
    '<body' + (bodyClass ? ' class="' + bodyClass + '"' : '') + '>\n' + innerHtml + '\n</body>\n</html>\n';
}
// A matter block's free text → paragraph markup (double-newline splits, book
// emphasis only). Shared by copyright rights text and every freetext block.
function epubMatterParas(text) {
  return (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => '<p>' + emphToXhtml(p) + '</p>').join('\n');
}
// Decode a data: URL to { bytes, mime }. Covers are re-encoded to JPEG on upload,
// but this stays general (base64 or percent-encoded, any image mime).
function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma); // after "data:"
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const data = dataUrl.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const bin = atob(data);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return { bytes: u8, mime };
  }
  return { bytes: new TextEncoder().encode(decodeURIComponent(data)), mime };
}
// Read an image File, downscale so its longest side ≤ maxDim, and re-encode as a
// JPEG data URL. Normalizes any upload (huge PNG, HEIC-via-browser, etc.) to a
// compact, metadata-free cover the EPUB can embed. Runs on a canvas — no deps.
function downscaleImageToJpeg(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode the image.'));
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// One matter block → { docTitle, bodyClass, inner, nav }. `nav` is the TOC label
// (or null to keep it out of the reading-order nav). Mirrors buildBookSheets'
// front/back rendering, but as XHTML strings for the ebook.
function epubMatterDoc(b, ctx) {
  const kind = b.kind;
  if (kind === 'halftitle') {
    return { docTitle: ctx.title, bodyClass: 'matter halftitle', nav: null,
      inner: '<div class="mt-center"><p class="book-title">' + escHtml(ctx.title) + '</p></div>' };
  }
  if (kind === 'titlepage') {
    let inner = '<div class="mt-center"><p class="book-title">' + escHtml(ctx.title) + '</p>';
    if (ctx.author) inner += '<p class="book-author">' + escHtml(ctx.author) + '</p>';
    inner += '</div>';
    return { docTitle: 'Title Page', bodyClass: 'matter titlepage', inner, nav: null };
  }
  if (kind === 'copyright') {
    const year = b.copyrightYear || String(new Date().getFullYear());
    const holder = b.copyrightHolder || ctx.author || '';
    let inner = '<div class="copyright"><p>Copyright © ' + escHtml(year + (holder ? ' ' + holder : '')) + '</p>';
    if (b.edition) inner += '<p>' + escHtml(b.edition) + '</p>';
    inner += '<p>All rights reserved.</p>';
    if (b.rightsText && b.rightsText.trim()) inner += epubMatterParas(b.rightsText);
    inner += '</div>';
    return { docTitle: 'Copyright', bodyClass: 'matter copyright-page', inner, nav: null };
  }
  if (kind === 'toc') {
    // Visual contents page — chapter links only (folios are meaningless in a
    // reflowable ebook). The machine-readable nav.xhtml is separate.
    let inner = '<h1 class="matter-title">Contents</h1>\n<ol class="book-contents">';
    ctx.chapterDocs.forEach((cd) => { inner += '\n<li><a href="' + cd.href + '">' + escHtml(cd.navTitle) + '</a></li>'; });
    inner += '\n</ol>';
    return { docTitle: 'Contents', bodyClass: 'matter contents', inner, nav: null };
  }
  // Freetext (dedication/epigraph centered & headless by convention; the rest headed).
  const label = matterKindLabel(kind);
  const noHeading = NO_HEADING_MATTER_KINDS.has(kind);
  const heading = noHeading ? '' : '<h1 class="matter-title">' + escHtml(b.title || label) + '</h1>\n';
  const inner = '<div class="matter-body' + (noHeading ? ' matter-centered' : '') + '">\n' + heading + epubMatterParas(b.text) + '\n</div>';
  return { docTitle: b.title || label, bodyClass: 'matter', inner, nav: noHeading ? null : (b.title || label) };
}

// One chapter card → an XHTML5 document. Chapter opener (label + optional title)
// and paragraphs come from the same theme + cardBodyTokens() the print book uses,
// so the ebook matches the PDF. Openers/scene-breaks are driven by body classes +
// book.css (reflow-safe: drop/raised caps via ::first-letter, small caps via
// ::first-line — no per-word span markup that ereaders mangle).
function epubChapterXhtml(chapter, num) {
  const theme = state.book.theme;
  const label = escHtml(chapterLabelText(theme, num));
  const cardTitle = (chapter.title || '').trim();
  const showName = theme.showChapterTitle && cardTitle && cardTitle.toLowerCase() !== chapterLabelText(theme, num).trim().toLowerCase();
  let head = '<h1 class="chapter-title">';
  if (label) head += '<span class="ch-label">' + label + '</span>';
  if (showName) head += '<span class="ch-name">' + emphToXhtml(cardTitle) + '</span>';
  head += '</h1>';

  const body = [];
  let firstDone = false;
  chapter.tokens.forEach((t) => {
    if (t.type === 'blank') return;
    if (t.type === 'scenebreak') {
      const sb = theme.sceneBreak;
      if (sb === 'space') body.push('<p class="scene-break scene-break-space"></p>');
      else if (sb === 'rule') body.push('<p class="scene-break scene-break-rule"></p>');
      else body.push('<p class="scene-break">' + escHtml(sceneBreakGlyph(sb)) + '</p>');
      return;
    }
    if (t.type !== 'action') return; // prose chapters carry only action/scenebreak
    const cls = (!firstDone) ? ' class="first-para"' : '';
    if (!firstDone) firstDone = true;
    body.push('<p' + cls + '>' + emphToXhtml(t.text) + '</p>');
  });

  const docTitle = (label ? chapterLabelText(theme, num) : cardTitle) || cardTitle || 'Chapter';
  return epubXhtmlDoc(docTitle, 'opener-' + theme.opener, head + '\n' + body.join('\n'));
}

// The in-book stylesheet: the theme's serif face (embedded when fetched), justified
// indented body, chapter-title layout, scene-break + opener flourishes.
function epubBookCss(fontMeta, haveFonts) {
  const fam = fontMeta ? fontMeta.family : 'Georgia';
  // Phase 5 knobs — mirror the on-screen book so the EPUB matches what the drawer
  // preview showed. Reflow-safe: leading/indent are relative, caps use ::first-*.
  const theme = state.book.theme;
  const lh = theme.lineSpacing === 'tight' ? 1.35 : theme.lineSpacing === 'relaxed' ? 1.72 : 1.5;
  const blockPara = theme.paraStyle === 'block';
  const openerScale = theme.openerSize === 'small' ? 0.82 : theme.openerSize === 'large' ? 1.18 : 1;
  const dropSize = (3.4 * openerScale).toFixed(2);
  const raiseSize = (2.2 * openerScale).toFixed(2);
  const scFontSize = theme.openerSize === 'large' ? 'font-size:1.06em;' : '';
  let css = '';
  if (fontMeta && haveFonts) {
    const f = fontMeta.files, F = fontMeta.family;
    css +=
      "@font-face{font-family:'" + F + "';font-weight:normal;font-style:normal;src:url(fonts/" + f.regular + ") format('woff2');}\n" +
      "@font-face{font-family:'" + F + "';font-weight:normal;font-style:italic;src:url(fonts/" + f.italic + ") format('woff2');}\n" +
      "@font-face{font-family:'" + F + "';font-weight:bold;font-style:normal;src:url(fonts/" + f.bold + ") format('woff2');}\n" +
      "@font-face{font-family:'" + F + "';font-weight:bold;font-style:italic;src:url(fonts/" + f.bolditalic + ") format('woff2');}\n";
  }
  css +=
    "body{font-family:'" + fam + "',Georgia,'Times New Roman',serif;line-height:" + lh + ";margin:0;padding:0 1em;}\n" +
    (blockPara
      ? "p{margin:0 0 0.8em;text-indent:0;text-align:justify;-webkit-hyphens:auto;hyphens:auto;}\n"
      : "p{margin:0;text-indent:1.5em;text-align:justify;-webkit-hyphens:auto;hyphens:auto;}\n") +
    "h1.chapter-title{text-align:center;margin:2.5em 0 2em;font-weight:normal;}\n" +
    ".ch-label{display:block;font-size:1.5em;letter-spacing:0.12em;text-transform:uppercase;}\n" +
    ".ch-name{display:block;margin-top:0.5em;font-size:1.05em;font-style:italic;}\n" +
    ".first-para{text-indent:0;}\n" +
    ".scene-break{text-align:center;text-indent:0;margin:1.5em 0;letter-spacing:0.3em;}\n" +
    ".scene-break-space{margin:2.2em 0;}\n" +
    ".scene-break-rule{margin:1.8em 0;}\n" +
    ".scene-break-rule::after{content:'';display:block;width:2.5em;height:1px;background:currentColor;opacity:0.4;margin:0 auto;}\n" +
    ".opener-dropcap .first-para::first-letter{float:left;font-size:" + dropSize + "em;line-height:0.82;padding:0.02em 0.08em 0 0;font-weight:bold;}\n" +
    ".opener-raisedcap .first-para::first-letter{font-size:" + raiseSize + "em;line-height:1;font-weight:bold;}\n" +
    ".opener-smallcaps .first-para::first-line{font-variant:small-caps;letter-spacing:0.03em;" + scFontSize + "}\n" +
    // Front/back matter + cover.
    ".mt-center{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center;}\n" +
    ".book-title{font-size:2em;letter-spacing:0.04em;text-transform:uppercase;margin:0;text-indent:0;text-align:center;}\n" +
    ".book-author{margin-top:1.5em;font-size:1.1em;text-indent:0;text-align:center;}\n" +
    ".copyright{margin-top:40vh;font-size:0.85em;line-height:1.7;text-align:center;}\n" +
    ".copyright p{text-indent:0;text-align:center;}\n" +
    ".matter-title{text-align:center;font-size:1.4em;font-weight:normal;letter-spacing:0.08em;text-transform:uppercase;margin:2.5em 0 1.5em;}\n" +
    ".matter-centered{margin-top:20vh;font-style:italic;}\n" +
    ".matter-centered p{text-indent:0;text-align:center;}\n" +
    ".book-contents{list-style:none;padding:0;margin:0;}\n" +
    ".book-contents li{margin:0.4em 0;text-indent:0;}\n" +
    ".book-contents a{text-decoration:none;color:inherit;}\n" +
    "body.cover{margin:0;padding:0;}\n" +
    ".cover-wrap{text-align:center;margin:0;padding:0;}\n" +
    ".cover-wrap img{max-width:100%;height:auto;}\n";
  return css;
}

// Build a complete EPUB 3 as a Blob. Async: it fetches the theme font's woff2
// files to embed them (degrades to a system-serif fallback if any fetch fails —
// e.g. offline). Reading order: cover → front matter → chapters → back matter,
// mirroring the print book's front/back matter and cover.
async function buildEpub() {
  const enc = new TextEncoder();
  const T = (s) => enc.encode(s);
  const book = state.book;
  const title = state.title || 'Untitled';
  const author = book.meta.authorName || 'Unknown';
  const chapters = bookChapters();
  const fontMeta = EPUB_FONT_FILES[book.theme.font] || null;

  // Try to embed the theme font. All-or-nothing per family so we never emit a
  // book.css @font-face that points at a file we failed to include.
  const fontEntries = [];
  let haveFonts = false;
  if (fontMeta) {
    try {
      const names = Object.values(fontMeta.files);
      const bufs = await Promise.all(names.map((n) => fetch('fonts/' + n).then((r) => { if (!r.ok) throw new Error(n); return r.arrayBuffer(); })));
      names.forEach((n, i) => fontEntries.push({ name: 'OEBPS/fonts/' + n, bytes: new Uint8Array(bufs[i]) }));
      haveFonts = true;
    } catch (_) { haveFonts = false; }
  }

  const uuid = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => { const r = (self.crypto ? crypto.getRandomValues(new Uint8Array(1))[0] : 0) % 16; const v = ch === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }));
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const isbn = (book.meta.isbn || '').replace(/[^0-9Xx]/g, '');
  const identifier = isbn ? ('urn:isbn:' + isbn) : ('urn:uuid:' + uuid);

  // ── Documents, in spine order ─────────────────────────────────────
  const docs = [];          // { id, href, xhtml, nav }
  const imageEntries = [];   // cover image bytes
  let coverManifest = '', coverMeta = '';

  // Cover first (when set) — image page + cover-image manifest property + the
  // legacy <meta name="cover"> that Kindle/EPUB2 readers still look for.
  const coverData = (book.meta.coverImage || '').trim();
  if (/^data:image\//i.test(coverData)) {
    const { bytes, mime } = dataUrlToBytes(coverData);
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    imageEntries.push({ name: 'OEBPS/cover.' + ext, bytes });
    coverManifest = '<item id="cover-image" href="cover.' + ext + '" media-type="' + mime + '" properties="cover-image"/>';
    coverMeta = '<meta name="cover" content="cover-image"/>\n    ';
    docs.push({ id: 'cover', href: 'cover.xhtml', nav: null,
      xhtml: epubXhtmlDoc(title, 'cover', '<div class="cover-wrap"><img src="cover.' + ext + '" alt="' + escHtml(title) + '"/></div>') });
  }

  // Chapters (built first so the visual TOC page can link them).
  const chapterDocs = chapters.map((ch, i) => ({ id: 'ch' + (i + 1), href: 'ch' + (i + 1) + '.xhtml', xhtml: epubChapterXhtml(ch, i + 1), navTitle: ch.title || ('Chapter ' + (i + 1)) }));
  const ctx = { title, author, chapterDocs };

  book.matter.front.forEach((b, i) => {
    if (!b.include) return;
    const m = epubMatterDoc(b, ctx);
    docs.push({ id: 'fm' + i, href: 'fm' + i + '.xhtml', nav: m.nav, xhtml: epubXhtmlDoc(m.docTitle, m.bodyClass, m.inner) });
  });
  chapterDocs.forEach((cd) => docs.push({ id: cd.id, href: cd.href, xhtml: cd.xhtml, nav: cd.navTitle }));
  book.matter.back.forEach((b, i) => {
    if (!b.include) return;
    const m = epubMatterDoc(b, ctx);
    docs.push({ id: 'bm' + i, href: 'bm' + i + '.xhtml', nav: m.nav, xhtml: epubXhtmlDoc(m.docTitle, m.bodyClass, m.inner) });
  });

  // OPF: metadata, manifest (css + nav + cover + fonts + all docs), spine.
  const manifestItems = ['<item id="css" href="book.css" media-type="text/css"/>',
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'];
  if (coverManifest) manifestItems.push(coverManifest);
  if (haveFonts) Object.values(fontMeta.files).forEach((n, i) => manifestItems.push('<item id="font' + i + '" href="fonts/' + n + '" media-type="font/woff2"/>'));
  docs.forEach((d) => manifestItems.push('<item id="' + d.id + '" href="' + d.href + '" media-type="application/xhtml+xml"/>'));
  const spineItems = docs.map((d) => '<itemref idref="' + d.id + '"/>').join('\n    ');

  let metadata = '<dc:identifier id="bookid">' + identifier + '</dc:identifier>\n    ' +
    '<dc:title>' + escHtml(title) + '</dc:title>\n    ' +
    '<dc:creator>' + escHtml(author) + '</dc:creator>\n    ' +
    '<dc:language>en</dc:language>\n    ';
  if (book.meta.publisher && book.meta.publisher.trim()) metadata += '<dc:publisher>' + escHtml(book.meta.publisher.trim()) + '</dc:publisher>\n    ';
  if (book.meta.description && book.meta.description.trim()) metadata += '<dc:description>' + escHtml(book.meta.description.trim()) + '</dc:description>\n    ';
  metadata += coverMeta + '<meta property="dcterms:modified">' + modified + '</meta>';

  const opf = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">\n' +
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n    ' + metadata + '\n  </metadata>\n' +
    '  <manifest>\n    ' + manifestItems.join('\n    ') + '\n  </manifest>\n' +
    '  <spine>\n    ' + spineItems + '\n  </spine>\n' +
    '</package>\n';

  // EPUB 3 nav (toc): substantive front/back sections + all chapters.
  const navList = docs.filter((d) => d.nav).map((d) => '      <li><a href="' + d.href + '">' + escHtml(d.nav) + '</a></li>').join('\n');
  const nav = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">\n' +
    '<head><meta charset="utf-8"/><title>' + escHtml(title) + '</title></head>\n' +
    '<body>\n  <nav epub:type="toc" id="toc">\n    <h1>Contents</h1>\n    <ol>\n' + navList + '\n    </ol>\n  </nav>\n</body>\n</html>\n';

  const container = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
    '  <rootfiles>\n    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>\n';

  // Entry order: mimetype FIRST (spec), then container, then the OEBPS payload.
  const entries = [
    { name: 'mimetype', bytes: T('application/epub+zip') },
    { name: 'META-INF/container.xml', bytes: T(container) },
    { name: 'OEBPS/content.opf', bytes: T(opf) },
    { name: 'OEBPS/nav.xhtml', bytes: T(nav) },
    { name: 'OEBPS/book.css', bytes: T(epubBookCss(fontMeta, haveFonts)) },
  ];
  docs.forEach((d) => entries.push({ name: 'OEBPS/' + d.href, bytes: T(d.xhtml) }));
  imageEntries.forEach((e) => entries.push(e));
  fontEntries.forEach((e) => entries.push(e));

  return { blob: zipStore(entries), entries: entries.map((e) => e.name), haveFonts, chapters: chapterDocs.length, docs: docs.length };
}

// Dev-only trigger (Phase 4a has no UI button — that's 4b). Call from the console:
// `downloadEpub()`.
async function downloadEpub() {
  const { blob } = await buildEpub();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (state.title || 'book').replace(/[^\w.-]+/g, '_') + '.epub';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

const VOICE_TYPES = ['Soprano', 'Mezzo-Soprano', 'Alto', 'Tenor', 'Baritone', 'Bass', 'Child', 'Ensemble', 'Speaking'];
const LANE_LABELS = { '1': 'Act 1', '2A': 'Act 2A', '2B': 'Act 2B', '3': 'Act 3' };

function extractCharacters() {
  const appearances = {};
  state.cards.forEach((c) => {
    if (!c.lyrics) return;
    const seen = new Set();
    // parseLyricLines sees both legacy @cues and seamless CAPS cues (and strips
    // any (sings)/(spoken) tag), so this catches characters in either format.
    parseLyricLines(c.lyrics, c.type === 'song').forEach((tok) => {
      if (tok.type !== 'cue') return;
      const name = (tok.text || '').trim().toUpperCase();
      if (!name || seen.has(name)) return;
      seen.add(name);
      if (!appearances[name]) appearances[name] = [];
      appearances[name].push({ id: c.id, title: c.title || '(untitled)', act: c.act });
    });
  });
  // merge: keep existing voiceType/note, add new names, flag removed ones
  const merged = {};
  Object.keys(appearances).forEach((name) => {
    merged[name] = Object.assign({ voiceType: '', desc: '', note: '' }, state.characters[name] || {});
  });
  // preserve manually-added chars not found in lyrics (mark as manual)
  Object.keys(state.characters).forEach((name) => {
    if (!merged[name]) merged[name] = Object.assign({ voiceType: '', desc: '', note: '', manual: true }, state.characters[name]);
  });
  return { merged, appearances };
}

// A "group" cue is an arrangement of people (ALL, BOTH, COMPANY) or a multi-name
// cue (LUNA & FELIX) — tracked, but not a real character. autoKind() is the guess;
// an explicit record.kind (set via the Characters-page toggle) always wins and is
// never clobbered by re-syncing.
const GROUP_WORDS = new Set(['ALL', 'BOTH', 'EVERYONE', 'EVERYBODY', 'COMPANY', 'FULL COMPANY', 'ENSEMBLE', 'CHORUS', 'CROWD', 'MEN', 'WOMEN', 'THE MEN', 'THE WOMEN', 'BOYS', 'GIRLS', 'OTHERS', 'ALL OTHERS', 'GROUP', 'TOGETHER', 'TUTTI', 'OMNES']);
function autoKind(name) {
  const n = (name || '').toUpperCase().trim();
  if (GROUP_WORDS.has(n)) return 'group';
  if (/\s*&\s*|\s+AND\s+|\s*\/\s*|\s*,\s*|\s*\+\s*|\s+WITH\s+/.test(n)) return 'group'; // arrangement of people
  return 'character';
}
function charKind(name) {
  const rec = state.characters[name];
  if (rec && (rec.kind === 'character' || rec.kind === 'group')) return rec.kind;
  return autoKind(name);
}

// Deterministic hue (0–359) from a character name, so each card's avatar/accent
// is stable and well-distributed across the spectrum.
function charHue(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function buildCharactersPage() {
  const host = document.getElementById('page-characters');
  host.innerHTML = '';

  const { merged, appearances } = extractCharacters();
  const names = Object.keys(merged).sort();

  const isProse = state.format === 'prose';
  const toolbar = el('div', { class: 'ch-toolbar ribbon' });
  const syncBtn = el('button', { class: 'pbtn pbtn-ico' });
  syncBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';
  syncBtn.appendChild(el('span', { text: isProse ? 'Sync from manuscript' : 'Sync from lyrics' }));
  syncBtn.addEventListener('click', () => {
    state.characters = extractCharacters().merged;
    scheduleSave();
    buildCharactersPage();
  });
  const addBtn = el('button', { class: 'pbtn', text: '+ Add character' });
  addBtn.addEventListener('click', () => {
    const name = prompt('Character name:');
    if (!name || !name.trim()) return;
    const key = name.trim().toUpperCase();
    if (!state.characters[key]) state.characters[key] = { voiceType: '', note: '', manual: true };
    scheduleSave();
    buildCharactersPage();
  });
  toolbar.appendChild(el('span', { class: 'ch-toolbar-title', text: 'Characters' }));
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  if (!state.readonly) toolbar.appendChild(syncBtn);
  if (!state.readonly) toolbar.appendChild(addBtn);
  host.appendChild(toolbar);

  if (!names.length) {
    const empty = el('div', { class: 'ch-empty' });
    empty.appendChild(el('div', { class: 'ch-empty-icon', text: '◎' }));
    empty.appendChild(el('p', { text: isProse ? 'No characters yet. Add character cues — any ALL-CAPS line in your manuscript — then click Sync.' : 'No characters yet. Add character cues — any ALL-CAPS line in your lyrics or dialogue — then click Sync.' }));
    host.appendChild(empty);
    return;
  }

  const makeCard = (name) => {
    const data = merged[name];
    const apps = appearances[name] || [];
    const hue = charHue(name);
    const kind = charKind(name);
    const card = el('div', { class: 'ch-card' + (data.manual && !apps.length ? ' ch-manual' : '') + (kind === 'group' ? ' ch-group' : '') });
    card.style.setProperty('--ch-hue', hue);

    const cardHead = el('div', { class: 'ch-card-head' });
    const parts = name.trim().split(/\s+/);
    const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
    cardHead.appendChild(el('span', { class: 'ch-avatar', text: initials }));
    const headText = el('div', { class: 'ch-head-text' });
    headText.appendChild(el('span', { class: 'ch-name', text: name }));
    if (data.manual && !apps.length && !state.readonly) headText.appendChild(el('span', { class: 'ch-tag ch-tag-manual', text: 'manual' }));
    else { const unit = isProse ? 'chapter' : 'song'; headText.appendChild(el('span', { class: 'ch-count', text: apps.length + ' ' + unit + (apps.length !== 1 ? 's' : '') })); }
    cardHead.appendChild(headText);
    card.appendChild(cardHead);

    // Character vs. group toggle — groups drop out of the cast list and the web.
    const kindWrap = el('div', { class: 'ch-kind', title: 'A group (ALL, BOTH, a duet cue) is an arrangement, not a character — kept out of the cast list and the Story DNA web.' });
    [['character', 'Character'], ['group', 'Group']].forEach(([k, lbl]) => {
      const b = el('button', { class: 'ch-kind-btn' + (kind === k ? ' active' : '') });
      b.textContent = lbl;
      if (state.readonly) b.disabled = true;
      else b.addEventListener('click', () => {
        if (kind === k) return;
        const rec = state.characters[name] || (state.characters[name] = {});
        rec.kind = k;
        scheduleSave();
        buildCharactersPage();
      });
      kindWrap.appendChild(b);
    });
    card.appendChild(kindWrap);

    // Voice type selector
    const vtWrap = el('div', { class: 'ch-field' });
    vtWrap.appendChild(el('label', { class: 'ch-label', text: 'Voice type' }));
    const vtSel = el('select', { class: 'ch-select fi' });
    vtSel.appendChild(el('option', { value: '', text: '—' }));
    VOICE_TYPES.forEach((vt) => {
      const opt = el('option', { value: vt, text: vt });
      if (data.voiceType === vt) opt.setAttribute('selected', '');
      vtSel.appendChild(opt);
    });
    vtSel.addEventListener('change', () => {
      if (!state.characters[name]) state.characters[name] = {};
      state.characters[name].voiceType = vtSel.value;
      scheduleSave();
    });
    vtWrap.appendChild(vtSel);
    card.appendChild(vtWrap);

    // Brief description
    const descWrap = el('div', { class: 'ch-field' });
    descWrap.appendChild(el('label', { class: 'ch-label', text: 'Brief description' }));
    const descIn = el('input', { class: 'fi', type: 'text', placeholder: '43 years old, a cartoonist…', value: data.desc || '' });
    descIn.addEventListener('input', () => {
      if (!state.characters[name]) state.characters[name] = {};
      state.characters[name].desc = descIn.value;
      scheduleSave();
    });
    descWrap.appendChild(descIn);
    card.appendChild(descWrap);

    // Notes
    const noteWrap = el('div', { class: 'ch-field' });
    noteWrap.appendChild(el('label', { class: 'ch-label', text: 'Notes' }));
    const noteTA = el('textarea', { class: 'ch-note fi', placeholder: 'Arc, relationships, costume notes…', text: data.note || '' });
    noteTA.addEventListener('input', () => {
      if (!state.characters[name]) state.characters[name] = {};
      state.characters[name].note = noteTA.value;
      scheduleSave();
    });
    noteWrap.appendChild(noteTA);
    card.appendChild(noteWrap);

    // Appearances
    if (apps.length) {
      const appsWrap = el('div', { class: 'ch-field' });
      appsWrap.appendChild(el('label', { class: 'ch-label', text: 'Appears in' }));
      const appList = el('div', { class: 'ch-apps' });
      apps.forEach((a) => {
        const chip = el('button', { class: 'ch-app-chip' });
        chip.appendChild(el('span', { class: 'ch-app-act', text: LANE_LABELS[a.act] || a.act }));
        chip.appendChild(el('span', { class: 'ch-app-title', text: a.title || '(untitled)' }));
        chip.addEventListener('click', () => navigateTo('board'));
        appList.appendChild(chip);
      });
      appsWrap.appendChild(appList);
      card.appendChild(appsWrap);
    }

    // Remove button (only for manual chars or user projects)
    if (!state.readonly) {
      const removeBtn = el('button', { class: 'ch-remove', title: 'Remove character' });
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        delete state.characters[name];
        scheduleSave();
        buildCharactersPage();
      });
      card.appendChild(removeBtn);
    }

    return card;
  };

  const realNames = names.filter((n) => charKind(n) === 'character');
  const groupNames = names.filter((n) => charKind(n) === 'group');

  const grid = el('div', { class: 'ch-grid' });
  if (realNames.length) realNames.forEach((name) => grid.appendChild(makeCard(name)));
  else grid.appendChild(el('p', { class: 'ch-empty-note', text: 'No individual characters yet — everything below is a grouping.' }));
  host.appendChild(grid);

  if (groupNames.length) {
    const sec = el('div', { class: 'ch-groupsec' });
    const head = el('div', { class: 'ch-section-head' });
    head.appendChild(el('span', { class: 'ch-section-title', text: 'Ensemble & groupings' }));
    head.appendChild(el('span', { class: 'ch-section-sub', text: 'Arrangements like ALL or BOTH — kept out of the cast list and the character web. Flip one to Character if it belongs in the cast.' }));
    sec.appendChild(head);
    const ggrid = el('div', { class: 'ch-grid' });
    groupNames.forEach((name) => ggrid.appendChild(makeCard(name)));
    sec.appendChild(ggrid);
    host.appendChild(sec);
  }
}

// ---- Research notes (SPEC §14) --------------------------------------------
// The writer's notebook: a named list of freeform notes (Apple Notes / Scrivener
// binder feel), stored on the show as notes = [{id, title, body, createdAt, updatedAt}].
// The Navigator rail IS the note index — each note is its own anchor, no
// heading-scan needed. Editor is deliberately simpler than the Manuscript's:
// headings, paragraphs, block quotes, links only.
function notesSeed() {
  const now = Date.now();
  return ['Characters', 'Theme', 'Sources'].map((title) => ({ id: uid('n'), title, body: '', createdAt: now, updatedAt: now }));
}
let notesSelId = (() => { try { return localStorage.getItem('md-notes-sel') || null; } catch (_) { return null; } })();
function buildNotesPage() {
  const host = document.getElementById('page-notes');
  host.innerHTML = '';
  if (!Array.isArray(state.notes)) state.notes = [];
  const ro = state.readonly;
  if (!state.notes.length && !ro) {
    state.notes = notesSeed();
    scheduleSave();
  }
  if (!notesSelId || !state.notes.find((n) => n.id === notesSelId)) {
    notesSelId = state.notes.length ? state.notes[0].id : null;
  }
  try { if (notesSelId) localStorage.setItem('md-notes-sel', notesSelId); } catch (_) {}

  const wrap = el('div', { class: 'notes-wrap' });

  // ── Rail — the note index / Navigator ──
  const rail = el('div', { class: 'notes-rail' });
  const railHead = el('div', { class: 'notes-rail-head' }, [
    el('span', { class: 'notes-rail-title', text: 'Notes' }),
  ]);
  if (!ro) {
    const addBtn = el('button', { class: 'notes-add-btn', title: 'New note', text: '+' });
    addBtn.addEventListener('click', () => {
      const n = { id: uid('n'), title: 'Untitled note', body: '', createdAt: Date.now(), updatedAt: Date.now() };
      state.notes.push(n);
      notesSelId = n.id;
      scheduleSave();
      buildNotesPage();
    });
    railHead.appendChild(addBtn);
  }
  rail.appendChild(railHead);

  const railList = el('div', { class: 'notes-rail-list' });
  state.notes.forEach((n) => {
    const row = el('div', { class: 'notes-rail-row' + (n.id === notesSelId ? ' active' : '') });
    row.appendChild(el('span', { class: 'notes-rail-label', text: n.title || 'Untitled note' }));
    row.addEventListener('click', () => {
      if (notesSelId === n.id) return;
      notesSelId = n.id;
      buildNotesPage();
    });
    // Rename / Delete live in a per-note context menu (dots on hover, or
    // right-click) — keeps those destructive/rename actions off the format bar.
    if (!ro) {
      const dots = el('button', { class: 'notes-rail-dots', title: 'Note options',
        html: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' });
      dots.addEventListener('click', (e) => { e.stopPropagation(); openNoteMenu(n, dots); });
      row.addEventListener('contextmenu', (e) => { e.preventDefault(); openNoteMenu(n, dots); });
      row.appendChild(dots);
    }
    railList.appendChild(row);
  });
  rail.appendChild(railList);
  wrap.appendChild(rail);

  // ── Pane — the selected note ──
  const pane = el('div', { class: 'notes-pane' });
  const note = state.notes.find((n) => n.id === notesSelId);
  if (!note) {
    pane.appendChild(el('div', { class: 'notes-empty' }, [
      el('p', { text: ro ? 'No notes yet.' : 'No notes yet. Click + to start one.' }),
    ]));
    wrap.appendChild(pane);
    host.appendChild(wrap);
    return;
  }

  const toolbar = el('div', { class: 'notes-toolbar ribbon' });

  // Zoom control (declared early; applied once the document is built). Same as
  // the Manuscript's, but right-anchored — the format bar leads on the left, the
  // way Word / Google Docs / Scrivener put controls where the text begins.
  const ZOOM_STEP = 0.15, ZOOM_MIN = 0.4, ZOOM_MAX = 2.0;
  let zoom = (() => { try { return parseFloat(localStorage.getItem('md-notes-zoom')) || 1; } catch (_) { return 1; } })();
  const zoomOut = el('button', { class: 'ms-zoom-btn', text: '−', title: 'Zoom out' });
  const zoomIn  = el('button', { class: 'ms-zoom-btn', text: '+', title: 'Zoom in' });
  const zoomLbl = el('span', { class: 'ms-zoom-lbl' });
  const zoomWrap = el('div', { class: 'ms-zoom-wrap' }, [zoomOut, zoomLbl, zoomIn]);

  let docEl, editorEl;
  const applyZoom = () => {
    if (docEl) docEl.style.zoom = zoom;
    zoomLbl.textContent = Math.round(zoom * 100) + '%';
    zoomOut.disabled = zoom <= ZOOM_MIN;
    zoomIn.disabled = zoom >= ZOOM_MAX;
    try { localStorage.setItem('md-notes-zoom', zoom); } catch (_) {}
  };
  zoomOut.addEventListener('click', () => { zoom = Math.max(ZOOM_MIN, +(zoom - ZOOM_STEP).toFixed(2)); applyZoom(); });
  zoomIn.addEventListener('click', () => { zoom = Math.min(ZOOM_MAX, +(zoom + ZOOM_STEP).toFixed(2)); applyZoom(); });

  if (!ro) {
    const mod = navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl+';
    const ICON = {
      quote: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M9 11H5.5c0-1.66 1.34-3 3-3V6C5.46 6 3 8.46 3 11.5V17h6v-6zm11 0h-3.5c0-1.66 1.34-3 3-3V6c-3.04 0-5.5 2.46-5.5 5.5V17h6v-6z"/></svg>',
      bullet: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg>',
      number: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2.5" y="8.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">1</text><text x="2.5" y="14.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">2</text><text x="2.5" y="20.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">3</text></svg>',
      link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      table: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>',
    };
    const fmt = el('div', { class: 'notes-fmt' });
    // label may be plain text or an SVG icon (html:true); extraCls tunes glyph weight/style
    const mkBtn = (label, title, run, opts) => {
      const o = opts || {};
      const b = el('button', { class: 'notes-fmt-btn' + (o.cls ? ' ' + o.cls : ''), title });
      if (o.html) b.innerHTML = label; else b.textContent = label;
      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep the text selection alive
      b.addEventListener('click', () => { run(); editorEl.focus(); });
      return b;
    };
    const cmd = (name, val) => () => document.execCommand(name, false, val);
    const divider = () => el('span', { class: 'notes-fmt-divider' });

    // Block style
    fmt.appendChild(mkBtn('Heading', 'Heading', cmd('formatBlock', 'H2'), { cls: 'wide' }));
    fmt.appendChild(mkBtn('Body', 'Body text', cmd('formatBlock', 'P'), { cls: 'wide' }));
    fmt.appendChild(mkBtn(ICON.quote, 'Block quote', cmd('formatBlock', 'BLOCKQUOTE'), { html: true }));
    fmt.appendChild(divider());
    // Emphasis
    fmt.appendChild(mkBtn('B', 'Bold (' + mod + 'B)', cmd('bold'), { cls: 'strong' }));
    fmt.appendChild(mkBtn('I', 'Italic (' + mod + 'I)', cmd('italic'), { cls: 'em' }));
    fmt.appendChild(divider());
    // Lists
    fmt.appendChild(mkBtn(ICON.bullet, 'Bulleted list', cmd('insertUnorderedList'), { html: true }));
    fmt.appendChild(mkBtn(ICON.number, 'Numbered list', cmd('insertOrderedList'), { html: true }));
    fmt.appendChild(divider());
    // Insert
    fmt.appendChild(mkBtn(ICON.link, 'Insert link', () => {
      const url = prompt('Link URL:');
      if (url) document.execCommand('createLink', false, url);
    }, { html: true }));
    fmt.appendChild(mkBtn(ICON.table, 'Insert table', () => {
      document.execCommand('insertHTML', false,
        '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>');
    }, { html: true }));
    toolbar.appendChild(fmt);
  }
  toolbar.appendChild(zoomWrap); // right-anchored via CSS margin-left:auto
  pane.appendChild(toolbar);

  // Scrolling document — a big editable title heading (the page title, like
  // Notion / Apple Notes) above the freeform body. Both scale with zoom.
  const scroll = el('div', { class: 'notes-scroll' });
  docEl = el('div', { class: 'notes-doc' });

  const titleHead = el('input', { class: 'notes-title-head', type: 'text', value: note.title || '', placeholder: 'Untitled note' });
  if (ro) titleHead.disabled = true;
  else {
    titleHead.addEventListener('input', () => {
      note.title = titleHead.value;
      note.updatedAt = Date.now();
      scheduleSave();
      const idx = state.notes.indexOf(note);
      const row = railList.children[idx];
      if (row) row.querySelector('.notes-rail-label').textContent = titleHead.value || 'Untitled note';
    });
    titleHead.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); editorEl.focus(); }
    });
  }
  docEl.appendChild(titleHead);

  editorEl = el('div', { class: 'notes-editor' });
  editorEl.innerHTML = note.body || '';
  if (ro) editorEl.setAttribute('contenteditable', 'false');
  else {
    editorEl.setAttribute('contenteditable', 'true');
    editorEl.addEventListener('input', () => {
      note.body = editorEl.innerHTML;
      note.updatedAt = Date.now();
      scheduleSave();
    });
    // Tab/Shift+Tab inside a list item nests/un-nests it (Word / Apple Notes
    // convention). Nested levels get different bullet/number shapes via CSS
    // (see .notes-editor ul/ol depth rules), matching what execCommand('indent')
    // actually produces (a real nested <ul>/<ol>), rather than tracking depth in JS.
    editorEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const sel = window.getSelection();
      const node = sel && sel.anchorNode;
      const li = node && (node.nodeType === 3 ? node.parentElement : node).closest('li');
      if (!li) return;
      e.preventDefault();
      document.execCommand(e.shiftKey ? 'outdent' : 'indent');
    });
  }
  docEl.appendChild(editorEl);
  scroll.appendChild(docEl);
  pane.appendChild(scroll);
  applyZoom();

  wrap.appendChild(pane);
  host.appendChild(wrap);
}

// Per-note Rename / Delete menu — reuses the library card menu chrome (and its
// global outside-click close handler, keyed on #lib-card-menu).
function openNoteMenu(note, anchor) {
  closeCardMenu();
  const menu = el('div', { class: 'lib-menu', id: 'lib-card-menu' });
  const add = (label, fn, danger) => {
    const b = el('button', { class: 'lib-menu-item' + (danger ? ' danger' : ''), text: label });
    b.addEventListener('click', (e) => { e.stopPropagation(); closeCardMenu(); fn(); });
    menu.appendChild(b);
  };
  add('Rename', () => {
    const t = prompt('Rename note:', note.title || '');
    if (t == null) return;
    note.title = t.trim() || 'Untitled note';
    note.updatedAt = Date.now();
    scheduleSave();
    buildNotesPage();
  });
  add('Delete', () => {
    if (!confirm('Delete "' + (note.title || 'Untitled note') + '"? This cannot be undone.')) return;
    state.notes = state.notes.filter((n) => n.id !== note.id);
    if (notesSelId === note.id) notesSelId = null;
    scheduleSave();
    buildNotesPage();
  }, true);
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.left = Math.max(8, r.right - menu.offsetWidth) + 'px';
}

// ---- Story DNA -----------------------------------------------------------
// A broad-strokes analysis surface, decoupled from the board in v1: a mirrored
// 7-beat chiasmus (Threshold carries a broken-out catch), a three-level stakes
// theme (Arndt), and a character web (Truby) projected from the real cast.
// See SPEC §15.
function dnaDefaults() {
  return {
    whatIf: '',
    beats: { setUpWant: '', threshold: '', catch: '', pinch: '', midpoint: '', crisis: '', aha: '', resolution: '' },
    stakes: {
      external: { truth: '', flaw: '' },
      internal: { truth: '', flaw: '' },
      philosophical: { truth: '', flaw: '' },
    },
  };
}
function migrateDna(d) {
  const base = dnaDefaults();
  if (!d || typeof d !== 'object') return base;
  base.whatIf = d.whatIf || '';
  if (d.beats) Object.assign(base.beats, d.beats);
  if (d.stakes) ['external', 'internal', 'philosophical'].forEach((k) => { if (d.stakes[k]) Object.assign(base.stakes[k], d.stakes[k]); });
  return base;
}
function dnaGrow(t) { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 22) + 'px'; }

// ---- Book formatting (Prose Plot) -----------------------------------------
// Per-show container for the book-output side (front/back matter, theme, trim
// size) — separate from state.msOptions, which is per-device. See
// BOOK-FORMATTING-PLAN.md. Empty/no-op until later phases render from it.
function defaultMatterBlocks(section) {
  return BOOK_MATTER_KINDS[section].map(({ kind }) => ({
    id: bid(), kind, include: (kind === 'titlepage' || kind === 'copyright'), title: '', text: '',
  }));
}
function bookDefaults() {
  return {
    meta: { authorName: '', isbn: '', publisher: '', description: '', coverImage: null },
    theme: { id: 'classic', font: 'ebgaramond', chapterLabel: 'word', chapterLabelCustom: '', showChapterTitle: true, opener: 'plain', openerSize: 'medium', sceneBreak: 'asterisks', paraStyle: 'indent', lineSpacing: 'normal' },
    trim: { size: '6x9', mirrored: true, gutterIn: 0.75, outsideIn: 0.5, topIn: 0.75, bottomIn: 0.75, chapterStartRecto: true },
    matter: { front: defaultMatterBlocks('front'), back: defaultMatterBlocks('back') },
  };
}
function migrateBook(d) {
  const base = bookDefaults();
  if (!d || typeof d !== 'object') return base;
  if (d.meta) Object.assign(base.meta, d.meta);
  if (d.theme) Object.assign(base.theme, d.theme);
  if (d.trim) Object.assign(base.trim, d.trim);
  if (d.matter) {
    // Only trust saved arrays once they're non-empty — old shows saved during
    // Phase 0 have `{front:[],back:[]}` and should still get real defaults.
    if (Array.isArray(d.matter.front) && d.matter.front.length) base.matter.front = d.matter.front;
    if (Array.isArray(d.matter.back) && d.matter.back.length) base.matter.back = d.matter.back;
  }
  return base;
}

function buildStoryDnaPage() {
  const host = document.getElementById('page-storydna');
  host.innerHTML = '';
  const dna = state.storyDna || (state.storyDna = dnaDefaults());
  const ro = state.readonly;

  const bindArea = (node, get, set) => {
    node.value = get() || '';
    if (ro) node.setAttribute('readonly', '');
    else node.addEventListener('input', () => { set(node.value); dnaGrow(node); scheduleSave(); });
    requestAnimationFrame(() => dnaGrow(node));
    return node;
  };
  const bindInput = (node, get, set) => {
    node.value = get() || '';
    if (ro) node.setAttribute('readonly', '');
    else node.addEventListener('input', () => { set(node.value); scheduleSave(); });
    return node;
  };

  const toolbar = el('div', { class: 'ribbon dna-toolbar' });
  toolbar.appendChild(el('span', { class: 'ch-toolbar-title', text: 'Story DNA' }));
  host.appendChild(toolbar);

  const wrap = el('div', { class: 'dna-wrap' });
  host.appendChild(wrap);

  // 1 — the "what if"
  const wi = el('div', { class: 'dna-field' });
  wi.appendChild(el('label', { class: 'dna-field-lbl', text: 'What if…' }));
  const wiTA = el('textarea', { class: 'dna-field-in', rows: '2', placeholder: 'The premise in a sentence — the “what if” at the heart of the story' });
  wi.appendChild(bindArea(wiTA, () => dna.whatIf, (v) => { dna.whatIf = v; }));
  wrap.appendChild(wi);

  // 2 — the 7-beat chiasmus, laid out chronologically. Mirrored pairs share
  // an indent level, stepping inward to the Midpoint hinge and back out —
  // the diamond shape carries the mirror structure, so the old line labels
  // ("truth line · beat 7") and connector pills aren't needed.
  // Placeholders synthesize Chamberlain (Nutshell), McKee, Wells (7-point),
  // and Snyder — each names what the beat is and why it's load-bearing,
  // without pronouns or any one method's jargon.
  const BEAT_PH = {
    setUpWant: 'The want that drives the story — specific, urgent, and out of reach',
    threshold: 'The event that breaks normal life and sets the story in motion',
    catch: 'The trap inside the goal — getting the want will mean facing the flaw',
    pinch: 'The opposition strikes; the easy way forward disappears',
    midpoint: 'The shift from reacting to acting — after this there is no way back',
    crisis: 'The impossible choice between the want and the truth',
    aha: 'The climactic choice that answers the crisis and proves the change',
    resolution: 'The new normal — the opening image, transformed',
  };
  const beatRow = (key, name, depth) => {
    const card = el('div', { class: 'dna-beat dna-depth-' + depth });
    card.appendChild(el('div', { class: 'dna-beat-name', text: name }));
    const ta = el('textarea', { class: 'dna-in', rows: '1', placeholder: BEAT_PH[key] });
    card.appendChild(bindArea(ta, () => dna.beats[key], (v) => { dna.beats[key] = v; }));
    if (key === 'threshold') {
      const cw = el('div', { class: 'dna-catch' });
      cw.appendChild(el('div', { class: 'dna-beat-name', text: 'The catch' }));
      const cta = el('textarea', { class: 'dna-in', rows: '1', placeholder: BEAT_PH.catch });
      cw.appendChild(bindArea(cta, () => dna.beats.catch, (v) => { dna.beats.catch = v; }));
      card.appendChild(cw);
    }
    return card;
  };
  const bHead = el('div', { class: 'dna-sec-head' });
  bHead.appendChild(el('h3', { class: 'dna-sec-title', text: 'Beats' }));
  wrap.appendChild(bHead);
  const grid = el('div', { class: 'dna-chiasmus' });
  [
    ['setUpWant', 'Set up want', 0],
    ['threshold', 'Threshold', 1],
    ['pinch', 'Pinch', 2],
    ['midpoint', 'Midpoint', 3],
    ['crisis', 'Crisis', 2],
    ['aha', 'A-ha', 1],
    ['resolution', 'Resolution', 0],
  ].forEach(([key, name, depth]) => grid.appendChild(beatRow(key, name, depth)));
  wrap.appendChild(grid);

  // 3 — the theme, three levels of stakes
  wrap.appendChild(el('div', { class: 'dna-divider' }));
  const stHead = el('div', { class: 'dna-sec-head' });
  stHead.appendChild(el('h3', { class: 'dna-sec-title', text: 'Theme' }));
  wrap.appendChild(stHead);
  const stakes = el('div', { class: 'dna-stakes dna-ledger' });
  [['external', 'External'], ['internal', 'Internal'], ['philosophical', 'Philosophical']].forEach(([k, label]) => {
    const row = el('div', { class: 'dna-stake-row' });
    const lab = el('div', { class: 'dna-stake-lbl' });
    lab.appendChild(el('span', { class: 'dna-stake-name', text: label }));
    row.appendChild(lab);
    const tIn = el('input', { class: 'dna-pole dna-pole-truth', type: 'text', placeholder: 'Truth' });
    row.appendChild(bindInput(tIn, () => dna.stakes[k].truth, (v) => { dna.stakes[k].truth = v; }));
    row.appendChild(el('span', { class: 'dna-vs', text: '↔' }));
    const fIn = el('input', { class: 'dna-pole dna-pole-flaw', type: 'text', placeholder: 'Flaw' });
    row.appendChild(bindInput(fIn, () => dna.stakes[k].flaw, (v) => { dna.stakes[k].flaw = v; }));
    stakes.appendChild(row);
  });
  wrap.appendChild(stakes);

  // 4 — the character web (Truby), projected from the real cast
  wrap.appendChild(el('div', { class: 'dna-divider' }));
  const webHead = el('div', { class: 'dna-sec-head' });
  webHead.appendChild(el('h3', { class: 'dna-sec-title', text: 'Character web' }));
  wrap.appendChild(webHead);
  buildDnaWeb(wrap, dna, ro);
}

function buildDnaWeb(wrap, dna, ro) {
  const iT = dna.stakes.internal.truth, iF = dna.stakes.internal.flaw;
  const pT = dna.stakes.philosophical.truth, pF = dna.stakes.philosophical.flaw;
  const head = (v, fallback, cls) => v
    ? el('div', { class: cls, text: v })
    : el('div', { class: cls + ' dna-web-ph', text: fallback });

  const cast = Object.keys(extractCharacters().merged).filter((n) => charKind(n) === 'character').sort();
  const chipsFor = (p, i) => cast.filter((n) => { const w = state.characters[n] && state.characters[n].web; return w && w.p === p && w.i === i; });
  const cell = (p, i) => {
    const c = el('div', { class: 'dna-web-cell' });
    const chips = chipsFor(p, i);
    if (chips.length) chips.forEach((n) => c.appendChild(el('span', { class: 'dna-web-chip', text: n })));
    else c.appendChild(el('span', { class: 'dna-web-hole', text: '—' }));
    return c;
  };

  const web = el('div', { class: 'dna-web dna-ledger' });
  web.appendChild(el('div', { class: 'dna-web-corner' }));
  web.appendChild(head(iT, 'Internal truth', 'dna-web-colhead dna-truth-ink'));
  web.appendChild(head(iF, 'Internal flaw', 'dna-web-colhead dna-flaw-ink'));
  web.appendChild(head(pT, 'Philosophical truth', 'dna-web-rowhead dna-truth-ink'));
  web.appendChild(cell('truth', 'truth'));
  web.appendChild(cell('truth', 'flaw'));
  web.appendChild(head(pF, 'Philosophical flaw', 'dna-web-rowhead dna-flaw-ink'));
  web.appendChild(cell('flaw', 'truth'));
  web.appendChild(cell('flaw', 'flaw'));
  wrap.appendChild(web);

  if (!cast.length) {
    wrap.appendChild(el('p', { class: 'dna-sec-sub', text: 'No characters yet — add them on the Characters page to plot the web.' }));
    return;
  }

  // Placement tray: two selects per character; the grid above is a live projection.
  const tray = el('div', { class: 'dna-tray' });
  tray.appendChild(el('div', { class: 'dna-tray-lbl', text: 'Place the cast' }));
  const opt = (sel, val, txt) => { const o = el('option', { value: val, text: txt }); if (sel === val) o.setAttribute('selected', ''); return o; };
  const poleSelect = (name, axis, tLabel, fLabel) => {
    const cur = (state.characters[name] && state.characters[name].web && state.characters[name].web[axis]) || '';
    const sel = el('select', { class: 'dna-tray-sel fi' });
    sel.appendChild(opt(cur, '', '—'));
    sel.appendChild(opt(cur, 'truth', tLabel || 'Truth'));
    sel.appendChild(opt(cur, 'flaw', fLabel || 'Flaw'));
    if (ro) sel.setAttribute('disabled', '');
    else sel.addEventListener('change', () => {
      const rec = state.characters[name] || (state.characters[name] = {});
      rec.web = rec.web || { i: '', p: '' };
      rec.web[axis] = sel.value;
      scheduleSave();
      const y = window.scrollY;
      buildStoryDnaPage();
      window.scrollTo(0, y);
    });
    return sel;
  };
  const field = (label, node) => {
    const w = el('label', { class: 'dna-tray-field' });
    w.appendChild(el('span', { class: 'dna-tray-field-lbl', text: label }));
    w.appendChild(node);
    return w;
  };
  cast.forEach((name) => {
    const row = el('div', { class: 'dna-tray-row' });
    row.appendChild(el('span', { class: 'dna-tray-name', text: name }));
    row.appendChild(field('Internal', poleSelect(name, 'i', iT, iF)));
    row.appendChild(field('Philosophical', poleSelect(name, 'p', pT, pF)));
    tray.appendChild(row);
  });
  wrap.appendChild(tray);
}

// Per-mode position memory (SPEC §14 phase 2): Board keeps its scroll for free
// (its DOM is never rebuilt on navigation), but Manuscript and Notes rebuild
// their page from scratch on every visit, which would otherwise reset scroll
// to the top. Capture the outgoing page's spot before it's torn down, restore
// it once the incoming page's fresh DOM is in place.
let msSavedAnchor = null;
let notesScrollTop = 0;
// Set by buildManuscriptPage while Focus mode is on (Edit mode only); the
// global Escape handler calls this to exit rather than reaching into the
// per-instance closure directly, since buildManuscriptPage reruns every time
// the Manuscript page is (re)entered.
let msFocusExit = null;

// Manuscript uses content-anchored (not raw scrollTop) memory, matching the
// anchor system already used for its own Edit/Print mode switches — offsets
// don't line up between visits since displayOrder/pagination can shift.
function captureMsAnchor() {
  const outer = document.getElementById('ms-body');
  const body = outer && outer.querySelector('.ms-body');
  if (!body) return null;
  const top = body.getBoundingClientRect().top;
  const out = [];
  for (const n of body.querySelectorAll('[data-anchor]')) {
    const r = n.getBoundingClientRect();
    if (r.bottom > top + 1) { out.push({ key: n.dataset.anchor, offset: r.top - top }); if (out.length >= 6) break; }
  }
  return out.length ? out : null;
}
function restoreMsAnchor(anchors) {
  if (!anchors) return;
  const outer = document.getElementById('ms-body');
  const body = outer && outer.querySelector('.ms-body');
  if (!body) return;
  for (const a of anchors) {
    const n = body.querySelector('[data-anchor="' + a.key + '"]');
    if (n) { body.scrollTop += (n.getBoundingClientRect().top - body.getBoundingClientRect().top) - a.offset; return; }
  }
}

function navigateTo(page, sceneId) {
  const prevPage = state.page;
  if (prevPage === 'manuscript') msSavedAnchor = captureMsAnchor();
  if (prevPage === 'manuscript' && page !== 'manuscript' && msFocusExit) msFocusExit(); // never leave focus mode's chrome hidden on another page
  if (prevPage === 'notes') {
    const sc = document.querySelector('#page-notes .notes-scroll');
    if (sc) notesScrollTop = sc.scrollTop;
  }
  state.page = page;
  document.body.classList.toggle('on-library', page === 'library');
  document.querySelectorAll('.page').forEach((p) => { p.style.display = 'none'; });
  const target = document.getElementById('page-' + page);
  if (target) target.style.display = '';
  document.querySelectorAll('.tn-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  applyTopbarSlot();
  applyAppTheme();
  if (page === 'library') buildLibraryPage();
  if (page === 'manuscript') { buildManuscriptPage(sceneId); restoreMsAnchor(msSavedAnchor); }
  if (page === 'notes') {
    buildNotesPage();
    const sc = document.querySelector('#page-notes .notes-scroll');
    if (sc) sc.scrollTop = notesScrollTop;
  }
  if (page === 'characters') buildCharactersPage();
  if (page === 'storydna') buildStoryDnaPage();
  if (page === 'admin') buildAdminPage();
}

function exportShow() {
  const data = {
    version: 1,
    title: state.title,
    mode: state.mode,
    format: state.format,
    cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }),
    characters: state.characters,
    book: state.book,
    exported: Date.now(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.title || 'untitled').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pshow';
  a.click();
  URL.revokeObjectURL(url);
}

function importShow(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.cards) throw new Error('missing cards');
      const body = JSON.stringify({
        title: data.title || 'Imported show',
        mode: data.mode || 'full',
        format: data.format || 'song', // older backups predate the format field
        cards: data.cards,
        characters: data.characters || {},
        book: data.book,
        updated: Date.now(),
      });
      fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        .then((r) => r.json()).then((d) => loadProjects().then(() => { openProject(d.id); navigateTo('board'); }));
    } catch (_) {
      alert('Could not read file. Make sure it\'s a valid .pshow file.');
    }
  };
  reader.readAsText(file);
}

// Strip inline emphasis that has no Fountain equivalent (chords, notes,
// strikethrough, highlight), keeping the plain text underneath. Bold/italic/
// underline (**/*/_) are left untouched — they're already valid Fountain
// inline markup, unchanged since Fountain's own convention predates ours.
function stripToFountainText(text) {
  return (text || '')
    .replace(NOTE_RE, '$3')          // drop the note wrapper, keep the highlighted phrase
    .replace(CHORD_RE, '')           // chords have no Fountain analog
    .replace(/~~([^~]+?)~~/g, '$1')  // strikethrough has no Fountain analog
    .replace(/==([^=]+?)==/g, '$1'); // editorial highlight has no Fountain analog
}

// Emit a card's manuscript body via the same cardBodyTokens() the Manuscript
// and PDF export already render from — so Fountain export always reflects
// current lyric-line classification (seamless cues, dual dialogue, section
// tags) instead of a hand-rolled parser that predates them.
function emitCardBodyFountain(c, lines) {
  let lastWasBlank = true; // start-of-card counts as blank, so a leading cue never needs a spacer first
  cardBodyTokens(c).forEach((tok) => {
    if (tok.type === 'blank') { lines.push(''); lastWasBlank = true; return; }
    if (tok.type === 'scenebreak') { lines.push('> * * * <'); lastWasBlank = false; return; }
    if (tok.type === 'section') { lines.push('= ' + stripToFountainText(tok.text)); lastWasBlank = false; return; }
    if (tok.type === 'cue') {
      if (!lastWasBlank) lines.push(''); // Fountain requires a blank line before a character cue
      lines.push(stripToFountainText(tok.text).toUpperCase() + (tok.dual ? ' ^' : ''));
      lastWasBlank = false;
      return;
    }
    // sung / dialogue / paren / action — plain body lines (paren already
    // carries its own parens from the parser)
    lines.push(stripToFountainText(tok.text));
    lastWasBlank = false;
  });
}

function exportFountain() {
  const lines = [];

  // Title page
  lines.push('Title: ' + (state.title || 'Untitled Show'));
  lines.push('');
  lines.push('');

  const order = displayOrder();
  let actHeaderDone = { one: false, two: false };
  let songNum = 0;

  order.forEach((i) => {
    const c = state.cards[i];

    // Act / intermission headers
    if ((c.act === '1' || c.act === '2A') && !actHeaderDone.one) {
      actHeaderDone.one = true;
      if (state.mode !== 'oneact') { lines.push('# ACT ONE'); lines.push(''); }
    }
    if ((c.act === '2B' || c.act === '3') && !actHeaderDone.two) {
      actHeaderDone.two = true;
      if (state.mode === 'full') {
        lines.push('> INTERMISSION <'); lines.push('');
        lines.push('# ACT TWO'); lines.push('');
      }
    }

    if (c.type === 'scene') {
      lines.push('## ' + (c.title || 'Scene'));
      lines.push('');
      emitCardBodyFountain(c, lines);
      lines.push('');

    } else if (c.type === 'beat') {
      // The Beatline (c.note) is a planning logline shown above the lyrics in
      // Manuscript, not performed text — export it as a synopsis line (same
      // "= " convention as section tags) so it isn't mistaken for action.
      if (c.note && c.note.trim() && state.msOptions.showBeatlines !== false) {
        lines.push('= ' + stripToFountainText(c.note));
        lines.push('');
      }
      const before = lines.length;
      emitCardBodyFountain(c, lines);
      if (lines.length > before) lines.push('');

    } else if (c.type === 'song') {
      songNum++;
      const num = String(songNum).padStart(2, '0');
      lines.push('> #' + num + ' ' + (c.title || 'UNTITLED SONG').toUpperCase() + ' <');
      lines.push('');
      const before = lines.length;
      emitCardBodyFountain(c, lines);
      if (lines.length === before) lines.push('(no lyrics yet)');
      lines.push('');
    }
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.title || 'untitled').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.fountain';
  a.click();
  URL.revokeObjectURL(url);
}

// A page counts as "revised" if any of its tokens (including inside dual columns)
// changed under the given revision — used by "print revised pages only."
function pageIsRevised(pageToks, rev) {
  const hit = (t) => t.lastRev === rev || (t.columns && t.columns.some((col) => col.some(hit)));
  return pageToks.some(hit);
}

// ============================================================================
// PDF export engine (dependency-free). Both manuscript and (later) book PDFs are
// produced by *transcribing* already-rendered DOM sheets: the browser lays the
// page out, we read back per-word client rects + computed styles and emit them
// as positioned PDF text runs. No second layout engine, so page breaks/wrapping
// can never drift from the on-screen view. Manuscript is monospace Courier — one
// of the 14 standard PDF base fonts — so no font embedding is needed here.
// ----------------------------------------------------------------------------

// Unicode -> WinAnsi (CP1252) byte for the punctuation the app actually emits.
// Base Latin-1 (0x20..0xFF) maps 1:1; these are the CP1252 exceptions 0x80..0x9F.
const PDF_WINANSI = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

// Encode a JS string to a PDF literal-string body in WinAnsi, escaping ( ) \ and
// octal-escaping high bytes. Unmapped chars degrade to '?'.
function pdfWinAnsiLiteral(str) {
  let out = '';
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    let b;
    if (cp === 0x2011) b = 0x2d;                    // non-breaking hyphen -> '-'
    else if (cp === 0x00a0) b = 0x20;               // nbsp -> space
    else if (cp <= 0xff) b = cp;
    else if (PDF_WINANSI[cp] != null) b = PDF_WINANSI[cp];
    else b = 0x3f;                                  // '?'
    if (b === 0x28 || b === 0x29 || b === 0x5c) out += '\\' + String.fromCharCode(b);
    else if (b < 0x20 || b > 0x7e) out += '\\' + b.toString(8).padStart(3, '0');
    else out += String.fromCharCode(b);
  }
  return out;
}

// A PDF document text string (Info values, outline titles). ASCII stays a literal
// (...) string; anything else is emitted as UTF-16BE with a BOM, which every
// reader decodes unambiguously. (Literal high bytes are read as PDFDocEncoding,
// not WinAnsi, so an em-dash would otherwise mojibake — hence the UTF-16 path.)
function pdfTextString(str) {
  str = str == null ? '' : String(str);
  if (/^[\x20-\x7e]*$/.test(str)) return '(' + str.replace(/[\\()]/g, '\\$&') + ')';
  let hex = 'FEFF';
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp > 0xffff) { const c = cp - 0x10000; hex += (0xd800 + (c >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (c & 0x3ff)).toString(16).padStart(4, '0'); }
    else hex += cp.toString(16).padStart(4, '0');
  }
  return '<' + hex.toUpperCase() + '>';
}

// zlib(deflate) a Uint8Array via the platform CompressionStream -> FlateDecode.
async function pdfDeflate(bytes) {
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  writer.write(bytes); writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

// The base-14 font a (family, bold, italic) run maps to.
function pdfBase14(family, bold, italic) {
  const f = (family || '').toLowerCase();
  // Sans checks come first: the "sans-serif" generic contains the substring
  // "serif", so a serif-first test would misroute Helvetica/Arial to Times.
  const fam = /helvetica|arial|sans-serif/.test(f) ? 'Helvetica'
    : /courier|mono/.test(f) ? 'Courier'
    : /times|serif|garamond|literata|crimson|georgia/.test(f) ? 'Times'
    : 'Helvetica';
  if (fam === 'Times') {
    if (bold && italic) return 'Times-BoldItalic';
    if (bold) return 'Times-Bold';
    if (italic) return 'Times-Italic';
    return 'Times-Roman';
  }
  return fam + (bold && italic ? '-BoldOblique' : bold ? '-Bold' : italic ? '-Oblique' : '');
}

// ---- TrueType parser (Book PDF) --------------------------------------------
// Just enough to embed a font as a CIDFontType2: unitsPerEm, glyph count,
// per-glyph advances (hmtx), a Unicode->GID cmap (format 4/12), and descriptor
// metrics (bbox, ascent, capHeight, italic). Verified against fontTools.
function pdfParseTTF(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (o) => dv.getUint16(o), i16 = (o) => dv.getInt16(o), u32 = (o) => dv.getUint32(o), i32 = (o) => dv.getInt32(o);
  const numTables = u16(4);
  const tbl = {};
  for (let i = 0; i < numTables; i++) {
    const r = 12 + i * 16;
    tbl[String.fromCharCode(bytes[r], bytes[r + 1], bytes[r + 2], bytes[r + 3])] = { offset: u32(r + 8), length: u32(r + 12) };
  }
  const head = tbl.head.offset;
  const unitsPerEm = u16(head + 18);
  const bbox = [i16(head + 36), i16(head + 38), i16(head + 40), i16(head + 42)];
  const hhea = tbl.hhea.offset;
  const ascent = i16(hhea + 4), descent = i16(hhea + 6), numHM = u16(hhea + 34);
  const numGlyphs = u16(tbl.maxp.offset + 4);
  const hm = tbl.hmtx.offset;
  const advance = (gid) => u16(hm + (gid < numHM ? gid : numHM - 1) * 4);
  let capHeight = 0, italicAngle = 0, weight = 400;
  if (tbl['OS/2']) { const o = tbl['OS/2'].offset, ver = u16(o); weight = u16(o + 4); if (ver >= 2 && tbl['OS/2'].length >= 90) capHeight = i16(o + 88); }
  if (tbl.post) italicAngle = i32(tbl.post.offset + 4) / 65536;
  if (!capHeight) capHeight = Math.round(ascent * 0.7);
  const cmap = pdfParseCmap(dv, tbl.cmap.offset, u16, i16, u32);
  return { unitsPerEm, bbox, ascent, descent, numGlyphs, capHeight, italicAngle, weight, advance, cmap, raw: bytes };
}
function pdfParseCmap(dv, base, u16, i16, u32) {
  const n = u16(base + 2);
  let best = -1, bestScore = -1;
  for (let i = 0; i < n; i++) {
    const r = base + 4 + i * 8, plat = u16(r), enc = u16(r + 2), off = u32(r + 4);
    let score = (plat === 3 && enc === 10) ? 5 : (plat === 0 && enc >= 4) ? 5 : (plat === 3 && enc === 1) ? 4 : (plat === 0) ? 3 : 0;
    if (score > bestScore) { bestScore = score; best = base + off; }
  }
  const map = {};
  if (best < 0) return map;
  const fmt = u16(best);
  if (fmt === 4) {
    const segX2 = u16(best + 6), segCount = segX2 / 2;
    const endO = best + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
    for (let s = 0; s < segCount; s++) {
      const end = u16(endO + s * 2), start = u16(startO + s * 2), delta = i16(deltaO + s * 2), rangeOff = u16(rangeO + s * 2);
      if (start === 0xffff) continue;
      for (let c = start; c <= end; c++) {
        let g;
        if (rangeOff === 0) g = (c + delta) & 0xffff;
        else { g = u16(rangeO + s * 2 + rangeOff + (c - start) * 2); if (g !== 0) g = (g + delta) & 0xffff; }
        if (g !== 0) map[c] = g;
      }
    }
  } else if (fmt === 12) {
    const nGroups = u32(best + 12);
    for (let gI = 0; gI < nGroups; gI++) {
      const r = best + 16 + gI * 12, startC = u32(r), endC = u32(r + 4), startG = u32(r + 8);
      for (let c = startC; c <= endC; c++) map[c] = startG + (c - startC);
    }
  }
  return map;
}

// Minimal PDF 1.7 document builder. addPage returns a per-page drawing API:
// text() draws a base-14 run (manuscript, WinAnsi), textEmbed() draws an
// embedded-TrueType run as a hex string of 2-byte glyph IDs (book). toBlob
// (async, for the deflate) serializes catalog/pages/fonts/xref/trailer.
function createPdf(meta) {
  const pages = [];
  const fontReg = {};   // key -> { token, kind:'b14'|'embed', ... }
  const outline = [];   // flat, reading order: { title, pageIndex, level } (level 0/1)
  const annots = [];    // link annotations: { pageIndex, rect:[x0,y0,x1,y1]pt, dest:pageIndex }
  let fontSeq = 0;
  function b14Token(name) { const k = 'b14:' + name; if (!fontReg[k]) { fontSeq += 1; fontReg[k] = { token: 'F' + fontSeq, kind: 'b14', name }; } return fontReg[k].token; }
  function embedEntry(key, ttf, psname) { const k = 'em:' + key; if (!fontReg[k]) { fontSeq += 1; fontReg[k] = { token: 'F' + fontSeq, kind: 'embed', ttf, psname: (psname || ('Font' + fontSeq)).replace(/[^\w-]/g, ''), key, usedGids: new Set([0]), gidToUni: new Map() }; } return fontReg[k]; }
  function tokenEntry(tok) { for (const k in fontReg) if (fontReg[k].token === tok) return fontReg[k]; return null; }
  function fmt(n) { return (Math.round(n * 1000) / 1000).toString(); }

  function addPage(wPt, hPt) {
    const page = { w: wPt, h: hPt, ops: [], tokens: new Set() };
    const pageIndex = pages.length;
    const api = {
      index: pageIndex,
      text(x, y, str, opt) {
        opt = opt || {};
        if (!str) return;
        const tok = b14Token(pdfBase14(opt.family, opt.bold, opt.italic)); page.tokens.add(tok);
        const c = opt.color || [0, 0, 0];
        page.ops.push('q ' + fmt(c[0]) + ' ' + fmt(c[1]) + ' ' + fmt(c[2]) + ' rg BT /' + tok +
          ' ' + fmt(opt.size || 12) + ' Tf 1 0 0 1 ' + fmt(x) + ' ' + fmt(y) + ' Tm (' +
          pdfWinAnsiLiteral(str) + ') Tj ET Q');
      },
      textEmbed(x, y, str, opt) {
        opt = opt || {};
        if (!str) return;
        const e = embedEntry(opt.fontKey, opt.ttf, opt.psname); page.tokens.add(e.token);
        const c = opt.color || [0, 0, 0];
        let hex = '';
        for (const ch of str) { const cp = ch.codePointAt(0); const gid = e.ttf.cmap[cp] || 0; e.usedGids.add(gid); if (gid && !e.gidToUni.has(gid)) e.gidToUni.set(gid, cp); hex += gid.toString(16).padStart(4, '0'); }
        page.ops.push('q ' + fmt(c[0]) + ' ' + fmt(c[1]) + ' ' + fmt(c[2]) + ' rg BT /' + e.token +
          ' ' + fmt(opt.size || 12) + ' Tf 1 0 0 1 ' + fmt(x) + ' ' + fmt(y) + ' Tm <' + hex + '> Tj ET Q');
      },
      rect(x, y, w, h, color) {
        const c = color || [0, 0, 0];
        page.ops.push('q ' + fmt(c[0]) + ' ' + fmt(c[1]) + ' ' + fmt(c[2]) + ' rg ' +
          fmt(x) + ' ' + fmt(y) + ' ' + fmt(w) + ' ' + fmt(h) + ' re f Q');
      },
    };
    pages.push(page);
    return api;
  }

  async function toBlob() {
    const enc = new TextEncoder();
    const chunks = [];
    let offset = 0;
    const xref = [];
    const put = (b) => { chunks.push(b); offset += b.length; };
    const putStr = (s) => put(enc.encode(s));
    const obj = (id, body) => { xref[id] = offset; putStr(id + ' 0 obj\n' + body + '\nendobj\n'); };

    putStr('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n');

    const nPages = pages.length;
    const pageIds = [], contentIds = [];
    let next = 3;
    for (let i = 0; i < nPages; i++) { pageIds.push(next++); contentIds.push(next++); }
    const entries = Object.values(fontReg);
    for (const e of entries) { if (e.kind === 'b14') e.oid = next++; else { e.type0 = next++; e.cid = next++; e.fd = next++; e.ff = next++; e.tu = next++; } }
    const infoId = next++;
    const pageAnnots = annots.map((a) => ({ ...a, id: next++ }));
    let outlineRootId = 0;
    if (outline.length) { outlineRootId = next++; for (const o of outline) o.id = next++; }

    obj(1, '<< /Type /Catalog /Pages 2 0 R' +
      (outline.length ? ' /Outlines ' + outlineRootId + ' 0 R /PageMode /UseOutlines' : '') + ' >>');
    obj(2, '<< /Type /Pages /Kids [' + pageIds.map((id) => id + ' 0 R').join(' ') + '] /Count ' + nPages + ' >>');

    for (let i = 0; i < nPages; i++) {
      const p = pages[i];
      const fontRes = [...p.tokens].map((tok) => { const e = tokenEntry(tok); return '/' + tok + ' ' + (e.kind === 'b14' ? e.oid : e.type0) + ' 0 R'; }).join(' ');
      const myAnnots = pageAnnots.filter((a) => a.pageIndex === i);
      const annotStr = myAnnots.length ? ' /Annots [' + myAnnots.map((a) => a.id + ' 0 R').join(' ') + ']' : '';
      obj(pageIds[i], '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + fmt(p.w) + ' ' + fmt(p.h) +
        '] /Resources << /Font << ' + fontRes + ' >> >> /Contents ' + contentIds[i] + ' 0 R' + annotStr + ' >>');
      const comp = await pdfDeflate(enc.encode(p.ops.join('\n')));
      xref[contentIds[i]] = offset;
      putStr(contentIds[i] + ' 0 obj\n<< /Length ' + comp.length + ' /Filter /FlateDecode >>\nstream\n');
      put(comp);
      putStr('\nendstream\nendobj\n');
    }

    for (const e of entries) {
      if (e.kind === 'b14') { obj(e.oid, '<< /Type /Font /Subtype /Type1 /BaseFont /' + e.name + ' /Encoding /WinAnsiEncoding >>'); continue; }
      const ttf = e.ttf, scale = 1000 / ttf.unitsPerEm, sc = (v) => Math.round(v * scale);
      let widths = ''; for (let g = 0; g < ttf.numGlyphs; g++) widths += (g ? ' ' : '') + sc(ttf.advance(g));
      const bbox = ttf.bbox.map(sc);
      const flags = 32 | 2 | (ttf.italicAngle ? 64 : 0); // nonsymbolic serif (+italic)
      const stemV = ttf.weight >= 600 ? 120 : 80;
      let bf = '', cnt = 0;
      for (const [gid, cp] of e.gidToUni.entries()) {
        let u;
        if (cp > 0xffff) { const c = cp - 0x10000; u = (0xd800 + (c >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (c & 0x3ff)).toString(16).padStart(4, '0'); }
        else u = cp.toString(16).padStart(4, '0');
        bf += '<' + gid.toString(16).padStart(4, '0') + '> <' + u + '>\n'; cnt++;
      }
      const cmapStr = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n' + cnt + ' beginbfchar\n' + bf + 'endbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
      const tuComp = await pdfDeflate(enc.encode(cmapStr));
      const ffComp = await pdfDeflate(ttf.raw);
      obj(e.type0, '<< /Type /Font /Subtype /Type0 /BaseFont /' + e.psname + ' /Encoding /Identity-H /DescendantFonts [' + e.cid + ' 0 R] /ToUnicode ' + e.tu + ' 0 R >>');
      obj(e.cid, '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /' + e.psname + ' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ' + e.fd + ' 0 R /CIDToGIDMap /Identity /DW 1000 /W [0 [' + widths + ']] >>');
      obj(e.fd, '<< /Type /FontDescriptor /FontName /' + e.psname + ' /Flags ' + flags + ' /FontBBox [' + bbox.join(' ') + '] /ItalicAngle ' + Math.round(ttf.italicAngle) + ' /Ascent ' + sc(ttf.ascent) + ' /Descent ' + sc(ttf.descent) + ' /CapHeight ' + sc(ttf.capHeight) + ' /StemV ' + stemV + ' /FontFile2 ' + e.ff + ' 0 R >>');
      xref[e.ff] = offset; putStr(e.ff + ' 0 obj\n<< /Length ' + ffComp.length + ' /Length1 ' + ttf.raw.length + ' /Filter /FlateDecode >>\nstream\n'); put(ffComp); putStr('\nendstream\nendobj\n');
      xref[e.tu] = offset; putStr(e.tu + ' 0 obj\n<< /Length ' + tuComp.length + ' /Filter /FlateDecode >>\nstream\n'); put(tuComp); putStr('\nendstream\nendobj\n');
    }

    // Internal link annotations — each jumps to a whole destination page (/Fit).
    for (const a of pageAnnots) {
      obj(a.id, '<< /Type /Annot /Subtype /Link /Rect [' + a.rect.map(fmt).join(' ') +
        '] /Border [0 0 0] /Dest [' + pageIds[a.dest] + ' 0 R /Fit] >>');
    }

    // Outline (bookmarks). Flat list with levels 0/1 → a two-level tree: each
    // level-1 item nests under the most recent level-0 item.
    if (outline.length) {
      const roots = [];
      let lastTop = null; // most recent level-0 item; only level-0 items can parent
      for (const n of outline) {
        n.children = []; n.parent = null;
        if (n.level > 0 && lastTop) { n.parent = lastTop; lastTop.children.push(n); }
        else { roots.push(n); lastTop = n.level === 0 ? n : lastTop; }
      }
      const linkSibs = (list) => list.forEach((n, k) => { n.prev = k > 0 ? list[k - 1] : null; n.next = k < list.length - 1 ? list[k + 1] : null; });
      linkSibs(roots); outline.forEach((n) => { if (n.children.length) linkSibs(n.children); });
      obj(outlineRootId, '<< /Type /Outlines /First ' + roots[0].id + ' 0 R /Last ' +
        roots[roots.length - 1].id + ' 0 R /Count ' + outline.length + ' >>');
      for (const n of outline) {
        let s = '<< /Title ' + pdfTextString(n.title) + ' /Parent ' + (n.parent ? n.parent.id : outlineRootId) + ' 0 R';
        if (n.prev) s += ' /Prev ' + n.prev.id + ' 0 R';
        if (n.next) s += ' /Next ' + n.next.id + ' 0 R';
        if (n.children.length) s += ' /First ' + n.children[0].id + ' 0 R /Last ' + n.children[n.children.length - 1].id + ' 0 R /Count ' + n.children.length;
        s += ' /Dest [' + pageIds[n.pageIndex] + ' 0 R /Fit] >>';
        obj(n.id, s);
      }
    }

    const m = meta || {};
    const info = [];
    if (m.title) info.push('/Title ' + pdfTextString(m.title));
    if (m.author) info.push('/Author ' + pdfTextString(m.author));
    if (m.subject) info.push('/Subject ' + pdfTextString(m.subject));
    if (m.keywords) info.push('/Keywords ' + pdfTextString(m.keywords));
    info.push('/Creator ' + pdfTextString(m.creator || 'Plot Suite'));
    info.push('/Producer ' + pdfTextString(m.producer || 'Plot Suite'));
    if (m.date) { info.push('/CreationDate (' + m.date + ')'); info.push('/ModDate (' + m.date + ')'); }
    obj(infoId, '<< ' + info.join(' ') + ' >>');

    const xrefStart = offset;
    const count = next;
    let xr = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (let id = 1; id < count; id++) xr += String(xref[id] || 0).padStart(10, '0') + ' 00000 n \n';
    putStr(xr);
    putStr('trailer\n<< /Size ' + count + ' /Root 1 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF');

    return new Blob(chunks, { type: 'application/pdf' });
  }

  // Navigation: register a bookmark (outline item, level 0/1) or an internal link
  // annotation. Both jump to a whole page (/Fit), so no coordinate math is needed.
  function addOutline(title, pageIndex, level) { if (title && pageIndex != null) outline.push({ title: String(title), pageIndex, level: level || 0 }); }
  function addLink(pageIndex, rect, destPageIndex) { if (destPageIndex != null) annots.push({ pageIndex, rect, dest: destPageIndex }); }

  return { addPage, toBlob, addOutline, addLink };
}

// ---- DOM -> PDF transcriber -------------------------------------------------
const PDF_PX_TO_PT = 72 / 96; // CSS px (96/in) -> PDF pt (72/in)

let _pdfMeasureCtx = null;
// fontBoundingBoxAscent matches the Range-rect top reference (verified: a 16px
// Courier line's baseline sits exactly this far below its client-rect top).
function pdfAscent(fontStr) {
  if (!_pdfMeasureCtx) _pdfMeasureCtx = document.createElement('canvas').getContext('2d');
  _pdfMeasureCtx.font = fontStr;
  return _pdfMeasureCtx.measureText('Hg').fontBoundingBoxAscent;
}
function pdfFontString(cs) { return cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; }
function pdfParseColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return [0, 0, 0];
  const p = m[1].split(',').map((s) => parseFloat(s));
  return [p[0] / 255, p[1] / 255, p[2] / 255];
}
function pdfWordRuns(text) {
  const runs = [];
  const re = /\S+/g; let m;
  while ((m = re.exec(text))) runs.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  return runs;
}

// Transcribe one rendered sheet element onto a new PDF page (sized to the sheet).
// `fonts`/`fontId` are optional embedded fonts (from pdfLoadBookFonts): when the
// sheet uses a proportional book font (Crimson/Literata), we must DRAW the same
// font we MEASURED with — base-14 substitution (Times) has different metrics, so
// word positions measured on-screen would collapse the inter-word spaces. The
// mono/Helvetica fonts skip this: their base-14 equivalent matches the screen
// metrics, so page.text() stays correct (and needs no font embedding).
function pdfTranscribeSheet(pdf, sheet, fonts, fontId) {
  const sr = sheet.getBoundingClientRect();
  const pageHpx = sr.height;
  const page = pdf.addPage(sr.width * PDF_PX_TO_PT, pageHpx * PDF_PX_TO_PT);
  const xPt = (cssLeft) => (cssLeft - sr.left) * PDF_PX_TO_PT;
  const yPt = (topFromSheet) => (pageHpx - topFromSheet) * PDF_PX_TO_PT;

  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(n.parentElement);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    const cs = getComputedStyle(node.parentElement);
    const ascent = pdfAscent(pdfFontString(cs));
    const sizePt = parseFloat(cs.fontSize) * PDF_PX_TO_PT;
    const bold = parseInt(cs.fontWeight, 10) >= 600;
    const italic = /italic|oblique/.test(cs.fontStyle);
    const color = pdfParseColor(cs.color);
    const family = cs.fontFamily;
    const deco = cs.textDecorationLine || cs.textDecoration || '';
    const underline = /underline/.test(deco), strike = /line-through/.test(deco);
    // text-transform is paint-time: node.nodeValue is the untransformed source,
    // but the sheet lays out and displays the transformed text (lyric lines are
    // upper-cased by CSS). Courier is monospace so per-char geometry is
    // identical either way — draw what the reader sees. (Same treatment the
    // Book transcriber has had since Phase 2.)
    const tt = cs.textTransform || 'none';
    const styleName = (bold && italic) ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'regular';
    const ttf = fonts ? fonts[styleName] : null;

    for (const run of pdfWordRuns(node.nodeValue)) {
      const range = document.createRange();
      range.setStart(node, run.start); range.setEnd(node, run.end);
      const rects = range.getClientRects();
      if (rects.length) {
        const rect = rects[0];
        const drawn = tt === 'uppercase' ? run.text.toUpperCase() : tt === 'lowercase' ? run.text.toLowerCase() : run.text;
        // Embed the real font when we have it and it covers this word; otherwise
        // fall back to the base-14 mapping (per-word, so a stray missing glyph
        // never breaks the whole line).
        if (ttf && pdfFontHasAll(ttf, drawn)) {
          page.textEmbed(xPt(rect.left), yPt((rect.top - sr.top) + ascent), drawn, { ttf, fontKey: fontId + '-' + styleName, psname: ttf.psname, size: sizePt, color });
        } else {
          page.text(xPt(rect.left), yPt((rect.top - sr.top) + ascent), drawn, { family, size: sizePt, bold, italic, color });
        }
      }
    }

    if (underline || strike) {
      const nr = document.createRange(); nr.selectNodeContents(node);
      const thick = Math.max(0.5, sizePt * 0.055);
      for (const rect of nr.getClientRects()) {
        const base = (rect.top - sr.top) + ascent;
        if (underline) page.rect(xPt(rect.left), yPt(base + Math.max(1.5, sizePt * 0.12)), rect.width * PDF_PX_TO_PT, thick, color);
        if (strike) page.rect(xPt(rect.left), yPt(base - ascent * 0.32), rect.width * PDF_PX_TO_PT, thick, color);
      }
    }
  }
  return page;
}

// Chord labels are ::after pseudo-elements (content: attr(data-chord)) — a
// text-node walker can't see them, so they'd silently vanish from a
// transcribed PDF. Before transcribing, replace each with a real
// absolutely-positioned span carrying the same computed metrics (the
// .pdf-chords-real class on the root suppresses the ::after so the label
// isn't doubled if the same root also goes through the print dialog).
// Absolute positioning means zero reflow — lyric geometry is untouched.
// Hidden chords (display:none marks under a Chords-off toggle) are skipped.
function pdfMaterializeChords(root) {
  root.classList.add('pdf-chords-real');
  root.querySelectorAll('mark.chord-tag').forEach((m) => {
    if (getComputedStyle(m).display === 'none') return;
    const cs = getComputedStyle(m, '::after');
    const s = el('span', { text: m.dataset.chord || '' });
    // Sage pinned dark, like the Sheet pane's override: the paper is always
    // white, and var(--sage) computes washy-light under body.dark.
    s.style.cssText = 'position:absolute; left:1px; bottom:100%; line-height:1; white-space:nowrap;'
      + ' text-transform:none; color:#5f7d57; -webkit-text-fill-color:#5f7d57;'
      + ' font-size:' + cs.fontSize + '; font-weight:' + cs.fontWeight + ';';
    m.appendChild(s);
  });
}

// PDF date string: D:YYYYMMDDHHmmSS±HH'mm' (Info CreationDate/ModDate).
function pdfDateString(d) {
  const p = (n, w) => String(Math.abs(n)).padStart(w || 2, '0');
  const off = -d.getTimezoneOffset(); // minutes east of UTC
  const sign = off >= 0 ? '+' : '-';
  const tz = off === 0 ? 'Z' : sign + p(Math.trunc(off / 60)) + "'" + p(off % 60) + "'";
  return 'D:' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
    p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + tz;
}

// A readable, filesystem-safe download name from the show title.
function pdfFilename(title, ext) {
  const base = (title || 'Untitled').replace(/[\/\\:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';
  return base + '.' + ext;
}

// Manuscript PDF for Song Plot and Prose Plot (same ms-sheet render path). Builds
// the sheets offscreen inside #pdf-print-root (so paper colors apply), transcribes
// each to a PDF page, and downloads a titled file with real metadata.
async function exportManuscriptPDF(includeTitlePages, revisedOnly) {
  const old = document.getElementById('pdf-print-root'); if (old) old.remove();
  const root = el('div', { id: 'pdf-print-root' });
  // #pdf-print-root is display:none on screen (shown only under @media print);
  // force it visible off-viewport so the sheets get real layout to transcribe.
  // The id still applies the paper-color rules (e.g. #pdf-print-root .lw-note-ms).
  // Ligatures OFF: the screen webfont (Courier Prime) ligates "fi"/"fl", laying a
  // word out ~1 char narrower than the base-14 Courier we draw with — which would
  // collapse the following space. Disabling them makes layout true-monospace, the
  // canonical manuscript look and an exact width match for PDF Courier.
  root.style.cssText = 'display:block; position:absolute; left:-99999px; top:0; width:816px;'
    + ' font-variant-ligatures:none; font-feature-settings:"liga" 0, "clig" 0, "dlig" 0, "hlig" 0;';

  if (includeTitlePages) {
    const tp = buildTitlePages();
    tp.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
    Array.from(tp.children).forEach((sheet) => root.appendChild(sheet));
  }

  const toks = buildContentTokens(null);
  let pages = paginateTokens(toks);
  const total = pages.length;
  if (revisedOnly && state.currentRev) pages = pages.filter((p) => pageIsRevised(p, state.currentRev));
  if (!pages.length) { alert('No revised pages — nothing has changed under the current revision yet.'); return; }
  pages.forEach((pageToks, pi) => {
    const sheet = el('div', { class: 'ms-sheet' });
    const isFirst = !revisedOnly && pi === 0;
    sheet.appendChild(renderSheetHeader(pageToks.label || (pi + 1), total, isFirst));
    const content = el('div', { class: 'ms-sheet-content' });
    pageToks.forEach((tok) => renderPageToken(tok, content));
    sheet.appendChild(content);
    root.appendChild(sheet);
  });

  document.body.appendChild(root);
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* fonts already loaded */ } }

  const isProse = state.format === 'prose';
  const meta = {
    title: state.title || 'Untitled', author: (state.titlePage && state.titlePage.authors) || '',
    subject: isProse ? 'Manuscript' : 'Libretto manuscript',
    creator: isProse ? 'Prose Plot' : 'Song Plot', producer: isProse ? 'Prose Plot' : 'Song Plot',
    date: pdfDateString(new Date()),
  };
  const pdf = createPdf(meta);

  // Transcribe each sheet, and build bookmarks from the heading tokens it carries:
  // act headers are top-level, scene/song headers nest one level under (or sit at
  // top level when the manuscript has no acts). Points at the page the heading opens.
  const sheets = [...root.querySelectorAll('.ms-sheet')];
  const anyActs = !!root.querySelector('.lw-act-header');
  sheets.forEach((sheet, i) => {
    pdfTranscribeSheet(pdf, sheet);
    sheet.querySelectorAll('.lw-act-header, .lw-scene-header, .lw-song-header').forEach((h) => {
      const isAct = h.classList.contains('lw-act-header');
      const title = (h.textContent || '').trim();
      if (title) pdf.addOutline(title, i, isAct ? 0 : (anyActs ? 1 : 0));
    });
  });

  const blob = await pdf.toBlob();
  root.remove();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = pdfFilename(state.title, 'pdf');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Book PDF (Prose Plot) — embedded serif fonts + justified transcription --
// The book uses real proportional serif fonts (EB Garamond / Literata / Crimson),
// so the PDF embeds them (see createPdf's textEmbed / TTF path). TrueType copies
// live beside the woff2 the screen uses (same metrics), fetched only at export.
// Fonts we can embed in a PDF (a bundled .ttf per style). Keyed by the id used
// in the Book font picker AND the Sheet font picker (sheetOpts.font) — pdfLoadBookFonts
// + exportSheetPDF look up here to decide whether to embed vs. fall back to base-14.
// Courier Prime Sans is here for the Sheet: base-14 Courier would draw it as plain
// Courier, so we embed its .ttf for exact fidelity. (Plain "Courier Prime" has no
// bundled file — it renders as Courier New, which base-14 Courier already matches —
// and Helvetica is a system font, so neither is embeddable.)
const PDF_BOOK_FONT_FILES = {
  ebgaramond: { regular: 'EBGaramond-Regular', bold: 'EBGaramond-Bold', italic: 'EBGaramond-Italic', bolditalic: 'EBGaramond-BoldItalic', family: 'EB Garamond' },
  literata: { regular: 'Literata-Regular', bold: 'Literata-Bold', italic: 'Literata-Italic', bolditalic: 'Literata-BoldItalic', family: 'Literata' },
  crimsonpro: { regular: 'CrimsonPro-Regular', bold: 'CrimsonPro-Bold', italic: 'CrimsonPro-Italic', bolditalic: 'CrimsonPro-BoldItalic', family: 'Crimson Pro' },
  courierprimesans: { regular: 'CourierPrimeSans-Regular', bold: 'CourierPrimeSans-Bold', italic: 'CourierPrimeSans-Italic', bolditalic: 'CourierPrimeSans-BoldItalic', family: 'Courier Prime Sans' },
};
const _pdfBookFontCache = {};
async function pdfLoadBookFonts(id) {
  const files = PDF_BOOK_FONT_FILES[id] || PDF_BOOK_FONT_FILES.ebgaramond;
  const out = {};
  for (const style of ['regular', 'bold', 'italic', 'bolditalic']) {
    const name = files[style];
    if (!_pdfBookFontCache[name]) {
      const res = await fetch('/fonts/' + name + '.ttf');
      if (!res.ok) throw new Error('font ' + name + ' failed to load (' + res.status + ')');
      const parsed = pdfParseTTF(new Uint8Array(await res.arrayBuffer()));
      parsed.psname = name;
      _pdfBookFontCache[name] = parsed;
    }
    out[style] = _pdfBookFontCache[name];
  }
  return out;
}
function pdfApplyTransform(text, t) {
  if (t === 'uppercase') return text.toUpperCase();
  if (t === 'lowercase') return text.toLowerCase();
  if (t === 'capitalize') return text.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
  return text;
}
function pdfFontHasAll(ttf, str) { for (const ch of str) if (!ttf.cmap[ch.codePointAt(0)]) return false; return true; }
function pdfCharRect(node, k) { const r = document.createRange(); r.setStart(node, k); r.setEnd(node, k + 1); const rects = r.getClientRects(); return rects.length ? rects[0] : null; }
function pdfStrWidthPx(ttf, str, sizePx) { let w = 0; for (const ch of str) { const gid = ttf.cmap[ch.codePointAt(0)] || 0; w += ttf.advance(gid) * sizePx / ttf.unitsPerEm; } return w; }

// Transcribe a book sheet with embedded fonts. Handles text-transform (running
// heads/chapter labels), justified per-word placement, hyphenated words that
// wrap across lines (split per line + trailing hyphen), synthesized small caps,
// and scene-break ornaments the serif font lacks (fall back to centered "* * *").
function pdfTranscribeBookSheet(pdf, sheet, fonts, fontId) {
  const sr = sheet.getBoundingClientRect();
  const pageHpx = sr.height;
  const page = pdf.addPage(sr.width * PDF_PX_TO_PT, pageHpx * PDF_PX_TO_PT);
  const xPt = (cssLeft) => (cssLeft - sr.left) * PDF_PX_TO_PT;
  const yPt = (topFromSheet) => (pageHpx - topFromSheet) * PDF_PX_TO_PT;

  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(n.parentElement);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    const cs = getComputedStyle(parent);
    const bold = parseInt(cs.fontWeight, 10) >= 600;
    const italic = /italic|oblique/.test(cs.fontStyle);
    const styleName = (bold && italic) ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'regular';
    const ttf = fonts[styleName];
    const fontKey = fontId + '-' + styleName;
    const sizePx = parseFloat(cs.fontSize);
    const sizePt = sizePx * PDF_PX_TO_PT;
    const ascent = pdfAscent(pdfFontString(cs));
    const color = pdfParseColor(cs.color);
    const transform = cs.textTransform;
    const smallcaps = /small-caps/.test((cs.fontVariantCaps || '') + ' ' + (cs.fontVariant || ''));
    const emit = (cssLeft, topFromSheet, str, szPt) => page.textEmbed(xPt(cssLeft), yPt(topFromSheet + ascent), str, { ttf, fontKey, psname: ttf.psname, size: szPt, color });

    // Scene-break ornament the serif font can't render (fleuron/asterism): draw a
    // centered "* * *" in the same font instead of a .notdef box.
    if (parent.classList && parent.classList.contains('book-scenebreak') && !pdfFontHasAll(ttf, node.nodeValue.trim())) {
      const er = parent.getBoundingClientRect();
      const fb = '* * *';
      const cx = (er.left + er.right) / 2;
      emit(cx - pdfStrWidthPx(ttf, fb, sizePx) / 2, (er.top - sr.top), fb, sizePt);
      continue;
    }

    // Small caps: synthesize — every letter drawn as a capital, originally-lower
    // letters at ~0.78x. Per character so each lands on its measured position.
    if (smallcaps) {
      const txt = node.nodeValue;
      for (let k = 0; k < txt.length; k++) {
        const ch = txt[k];
        if (!/\S/.test(ch)) continue;
        const r = pdfCharRect(node, k); if (!r) continue;
        const isLower = ch.toLowerCase() === ch && ch.toUpperCase() !== ch;
        emit(r.left, (r.top - sr.top), ch.toUpperCase(), isLower ? sizePt * 0.78 : sizePt);
      }
      continue;
    }

    // Normal text: place each word at its measured left. A word that hyphenates
    // across a line break returns >1 client rect — split it per line and add the
    // trailing hyphen the browser drew.
    for (const run of pdfWordRuns(node.nodeValue)) {
      const range = document.createRange();
      range.setStart(node, run.start); range.setEnd(node, run.end);
      const rects = range.getClientRects();
      if (rects.length <= 1) {
        if (rects.length) emit(rects[0].left, (rects[0].top - sr.top), pdfApplyTransform(run.text, transform), sizePt);
      } else {
        const groups = [];
        for (let k = run.start; k < run.end; k++) {
          const cr = pdfCharRect(node, k); if (!cr) continue;
          let g = groups.find((G) => Math.abs(G.top - cr.top) < 2);
          if (!g) { g = { top: cr.top, left: cr.left, chars: '' }; groups.push(g); }
          g.chars += node.nodeValue[k];
        }
        groups.forEach((g, gi) => emit(g.left, (g.top - sr.top), pdfApplyTransform(g.chars, transform) + (gi < groups.length - 1 ? '-' : ''), sizePt));
      }
    }
  }
  return page;
}

// Book PDF via the engine (Prose Plot). Renders the same buildBookSheets() the
// on-screen Book view uses, offscreen, then transcribes each to an embedded-font
// PDF page at the book's real trim size.
async function exportBookPDFEngine() {
  const fontId = (state.book && state.book.theme && state.book.theme.font) || 'ebgaramond';
  const fonts = await pdfLoadBookFonts(fontId);

  const old = document.getElementById('pdf-print-root'); if (old) old.remove();
  const root = el('div', { id: 'pdf-print-root' });
  root.style.cssText = 'display:block; position:absolute; left:-99999px; top:0;';
  buildBookSheets().forEach((s) => root.appendChild(s));
  document.body.appendChild(root);

  // Ensure the book webfont is laid out before measuring (else metrics differ).
  if (document.fonts) {
    const fam = (PDF_BOOK_FONT_FILES[fontId] || PDF_BOOK_FONT_FILES.ebgaramond).family;
    try { await Promise.all(['', 'italic ', 'bold ', 'bold italic '].map((p) => document.fonts.load(p + '16px "' + fam + '"'))); } catch (e) { /* already loaded */ }
    try { await document.fonts.ready; } catch (e) { /* ready */ }
  }

  const bookAuthor = (state.book && state.book.meta && state.book.meta.authorName) || (state.titlePage && state.titlePage.authors) || '';
  const meta = {
    title: state.title || 'Untitled', author: bookAuthor,
    subject: 'A novel', creator: 'Prose Plot', producer: 'Prose Plot', date: pdfDateString(new Date()),
  };
  const pdf = createPdf(meta);

  // Transcribe each sheet (page index = sheet order); collect bookmarks, the
  // chapter→page map, and the TOC rows to turn into clickable links afterward.
  const chapterPage = {};      // chapterKey -> page index
  const tocLinks = [];         // { pageIndex, rect, chapterKey }
  root.querySelectorAll('.book-sheet').forEach((sheet, i) => {
    pdfTranscribeBookSheet(pdf, sheet, fonts, fontId);
    if (sheet.dataset.pdfChapterKey) chapterPage[sheet.dataset.pdfChapterKey] = i;
    if (sheet.dataset.pdfOutline) pdf.addOutline(sheet.dataset.pdfOutline, i, 0);
    const rows = sheet.querySelectorAll('.book-toc-row[data-pdf-chapter-key]');
    if (rows.length) {
      const sr = sheet.getBoundingClientRect();
      rows.forEach((row) => {
        const rr = row.getBoundingClientRect();
        tocLinks.push({
          pageIndex: i, chapterKey: row.dataset.pdfChapterKey,
          rect: [(rr.left - sr.left) * PDF_PX_TO_PT, (sr.height - (rr.bottom - sr.top)) * PDF_PX_TO_PT,
            (rr.right - sr.left) * PDF_PX_TO_PT, (sr.height - (rr.top - sr.top)) * PDF_PX_TO_PT],
        });
      });
    }
  });
  tocLinks.forEach((l) => { if (chapterPage[l.chapterKey] != null) pdf.addLink(l.pageIndex, l.rect, chapterPage[l.chapterKey]); });

  const blob = await pdf.toBlob();
  root.remove();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = pdfFilename(state.title, 'pdf');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPDF(includeTitlePages, revisedOnly) {
  // Print in-page (not a popup window) so the browser's own preview/print
  // pipeline handles it — popups freeze the macOS print preview. The print
  // styles for #pdf-print-root live in styles.css under @media print.
  const prev = document.getElementById('pdf-print-root');
  if (prev) prev.remove();

  const root = el('div', { id: 'pdf-print-root' });

  if (includeTitlePages) {
    const tp = buildTitlePages();
    tp.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
    Array.from(tp.children).forEach((sheet) => root.appendChild(sheet));
  }

  const toks = buildContentTokens(null);
  let pages = paginateTokens(toks);
  const total = pages.length;
  // "Revised pages only": keep just the pages bearing the current revision's
  // marks (each keeps its production label, so a recipient can drop them into
  // the locked script). Title pages are omitted from a revised-pages packet.
  if (revisedOnly && state.currentRev) pages = pages.filter((p) => pageIsRevised(p, state.currentRev));
  if (!pages.length) { root.remove(); alert('No revised pages — nothing has changed under the current revision yet.'); return; }
  pages.forEach((pageToks, pi) => {
    const sheet = el('div', { class: 'ms-sheet' });
    const isFirst = !revisedOnly && pi === 0;
    sheet.appendChild(renderSheetHeader(pageToks.label || (pi + 1), total, isFirst));
    const content = el('div', { class: 'ms-sheet-content' });
    pageToks.forEach((tok) => renderPageToken(tok, content));
    sheet.appendChild(content);
    root.appendChild(sheet);
  });

  document.body.appendChild(root);

  const cleanup = () => { root.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  // Give the layout a tick to settle (fonts already loaded in-page) then print.
  setTimeout(() => window.print(), 60);
}

// Export & backup lives in a right-side drawer (like Snapshots), reached from
// the topnav icon — not its own page.
function closeExportDrawer() {
  const d = document.getElementById('exp-drawer'); if (d) d.remove();
  const ov = document.getElementById('exp-overlay'); if (ov) ov.remove();
}
// One room, two doors: everything that leaves the app lives here. ctx names the
// view the drawer was opened from ('book' | 'manuscript' | null) so the matching
// document floats to the top, tinted and tagged — the tweak→export→look loop
// stays a decision-free tap. The topnav opens it with no context (ctx null).
function openExportDrawer(ctx) {
  closeShowPopover();
  if (document.getElementById('exp-drawer')) { closeExportDrawer(); return; }
  ctx = (ctx === 'book' || ctx === 'manuscript') ? ctx : null;

  const overlay = el('div', { class: 'snap-overlay', id: 'exp-overlay' });
  overlay.addEventListener('click', closeExportDrawer);
  document.body.appendChild(overlay);

  const drawer = el('div', { class: 'snap-drawer', id: 'exp-drawer' });
  const head = el('div', { class: 'snap-head' });
  head.appendChild(el('span', { class: 'snap-title', text: 'Export' }));
  const xBtn = el('button', { class: 'snap-close xclose', text: '✕', title: 'Close' });
  xBtn.addEventListener('click', closeExportDrawer);
  head.appendChild(xBtn);
  drawer.appendChild(head);

  const body = el('div', { class: 'exp-drawer-body' });
  const isProse = state.format === 'prose';
  const title = state.title || 'show';

  // ── Icon tiles (34px rounded) — reuse the exact SVGs the toolbar/print paths
  //    already use, so the row and the button it replaced read as one thing.
  const ICON_FILE_LINES = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>';
  const ICON_FILE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
  const ICON_BOOK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M17 20h3V7a1 1 0 0 0-1-1h-2"/><line x1="8" y1="8" x2="13" y2="8"/><line x1="8" y1="11" x2="13" y2="11"/></svg>';
  const ICON_PRINT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
  const ICON_TRAY_DOWN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  const ICON_TRAY_UP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  // Right-side action glyph: download-into-tray for files that land on disk;
  // diagonal arrow for the two rows that open a dialog (Print, Open backup).
  const GLYPH_DOWNLOAD = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><polyline points="8 11 12 15 16 11"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
  const GLYPH_DIALOG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

  // Row factory. Every row is icon-tile + name(+chip) + sub + right glyph; only
  // the handler and the busy behavior differ. Async rows (PDF/EPUB build
  // offscreen) swap the sub to "Building…" and freeze the row until it settles.
  const makeRow = (o) => {
    const row = el('div', { class: 'exp-row' + (o.seeded ? ' seeded' : '') + (o.disabled ? ' disabled' : '') });
    const icon = el('span', { class: 'exp-row-icon' + (o.iconText ? ' exp-row-icon-mono' : '') });
    if (o.iconText) icon.textContent = o.iconText; else icon.innerHTML = o.icon;
    row.appendChild(icon);
    const txt = el('span', { class: 'exp-row-text' });
    const name = el('span', { class: 'exp-row-name' });
    name.appendChild(el('span', { text: o.name }));
    if (o.chip) name.appendChild(el('span', { class: 'exp-chip', text: o.chip }));
    txt.appendChild(name);
    const sub = el('span', { class: 'exp-row-sub', text: o.sub });
    txt.appendChild(sub);
    row.appendChild(txt);
    row.appendChild(el('span', { class: 'exp-row-act', html: o.glyph }));
    if (o.disabled) return row; // reference-show gating: no handler, styled inert
    row.addEventListener('click', async () => {
      if (row.classList.contains('exp-busy')) return;
      if (!o.async) { o.run(); return; }
      const prev = sub.textContent;
      row.classList.add('exp-busy'); sub.textContent = 'Building…';
      try { await o.run(); }
      catch (e) { alert('Export failed: ' + (e && e.message ? e.message : e)); }
      finally { row.classList.remove('exp-busy'); sub.textContent = prev; }
    });
    return row;
  };

  // ── Documents ─────────────────────────────────────────────────────
  // Trim size, if the book theme carries one, sharpens the Book (PDF) sub.
  let trimSuffix = '';
  const bt = state.book && state.book.trim;
  const bsz = bt && BOOK_TRIM_SIZES[bt.size];
  if (bsz && bsz.label) trimSuffix = ' · ' + bsz.label + ' trim';

  const docDefs = {
    manuscript: { icon: ICON_FILE_LINES, name: 'Manuscript (PDF)',
      sub: isProse ? 'Standard submission manuscript, Courier' : 'Standard libretto manuscript',
      glyph: GLYPH_DOWNLOAD, async: true, run: () => exportManuscriptPDF(true, false) },
    print: { icon: ICON_PRINT, name: 'Print…', sub: 'Paper, via the system print dialog',
      glyph: GLYPH_DIALOG, async: false,
      // Book view prints its trim-sized layout; every other view prints the manuscript.
      run: () => { closeExportDrawer(); if (ctx === 'book') exportBookPDF(); else exportPDF(true); } },
  };
  if (isProse) {
    docDefs.book = { icon: ICON_FILE, name: 'Book (PDF)', sub: 'Typeset book, fonts embedded' + trimSuffix,
      glyph: GLYPH_DOWNLOAD, async: true, run: () => exportBookPDFEngine() };
    docDefs.epub = { icon: ICON_BOOK, name: 'EPUB', sub: 'Ebook for Kindle, Books & e-readers',
      glyph: GLYPH_DOWNLOAD, async: true, run: () => downloadEpub() };
  }

  // The seeded row floats to the top; the rest follow a fixed per-context order.
  // Song Plot has no Book/EPUB, so its list is naturally just manuscript + print.
  let order;
  if (ctx === 'book' && isProse) order = ['book', 'epub', 'manuscript', 'print'];
  else if (ctx === 'manuscript') order = isProse ? ['manuscript', 'print', 'book', 'epub'] : ['manuscript', 'print'];
  else order = isProse ? ['manuscript', 'book', 'epub', 'print'] : ['manuscript', 'print'];

  body.appendChild(el('div', { class: 'exp-group-label', text: 'Documents' }));
  order.forEach((k) => {
    const d = docDefs[k];
    body.appendChild(makeRow(Object.assign({}, d, { seeded: k === ctx, chip: k === ctx ? 'this view' : null })));
  });

  // ── Interchange ───────────────────────────────────────────────────
  body.appendChild(el('div', { class: 'exp-group-div' }));
  body.appendChild(el('div', { class: 'exp-group-label', text: 'Interchange' }));
  body.appendChild(makeRow({ iconText: 'F', name: 'Fountain', sub: 'Plain-text screenplay · Final Draft, Highland',
    glyph: GLYPH_DOWNLOAD, async: false, run: exportFountain, disabled: state.readonly }));

  // ── Backup ────────────────────────────────────────────────────────
  body.appendChild(el('div', { class: 'exp-group-div' }));
  body.appendChild(el('div', { class: 'exp-group-label', text: 'Backup' }));
  body.appendChild(makeRow({ icon: ICON_TRAY_DOWN, name: 'Save backup', sub: title + '.pshow — complete show data',
    glyph: GLYPH_DOWNLOAD, async: false, run: exportShow, disabled: state.readonly && state.showKey }));
  // Open backup keeps the hidden file-input mechanism (importShow adds a new project).
  const fileInput = el('input', { type: 'file', accept: '.pshow,.songplot,.json', class: 'exp-file-input', id: 'exp-file-input' });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) { closeExportDrawer(); importShow(e.target.files[0]); } });
  body.appendChild(makeRow({ icon: ICON_TRAY_UP, name: 'Open backup…', sub: 'Restore a .pshow as a new project',
    glyph: GLYPH_DIALOG, async: false, run: () => fileInput.click() }));
  body.appendChild(fileInput);
  // Document exports stay live for reference shows (they mutate nothing); only
  // Save backup and Fountain go inert, so the explanation lives with Backup.
  if (state.readonly) body.appendChild(el('p', { class: 'exp-note', text: 'Switch to a project (not a reference show) to export.' }));

  drawer.appendChild(body);
  document.body.appendChild(drawer);
}

function tpEditable(tag, cls, value, key, isArray) {
  const d = el(tag, { class: cls, contenteditable: state.readonly ? 'false' : 'true' });
  d.textContent = value;
  if (!state.readonly) {
    d.addEventListener('input', () => {
      if (isArray) {
        state.titlePage[key] = d.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
      } else {
        state.titlePage[key] = d.innerText;
      }
      scheduleSave();
    });
  }
  return d;
}

function buildTitlePages() {
  const tp = state.titlePage;
  const inc = tp.include || {};
  const viewport = el('div', { class: 'ms-viewport' });

  // ── Page 1: Title ──────────────────────────────────────────────
  const p1 = el('div', { class: 'ms-sheet' });
  const p1c = el('div', { class: 'ms-sheet-content tp-title-page' });

  // Title cluster, vertically centered between two equal flex spacers.
  p1c.appendChild(el('div', { class: 'tp-spacer-push' }));
  p1c.appendChild(tpEditable('div', 'tp-show-title', (state.title || 'UNTITLED').toUpperCase(), '_title_readonly'));
  if (inc.rule === true) p1c.appendChild(el('div', { class: 'tp-rule' }));
  if (inc.subtitle === true) {
    p1c.appendChild(el('div', { class: 'tp-spacer' }));
    p1c.appendChild(tpEditable('div', 'tp-subtitle', tp.subtitle || 'A musical', 'subtitle'));
  }
  p1c.appendChild(el('div', { class: 'tp-spacer' }));
  p1c.appendChild(tpEditable('div', 'tp-authors', tp.authors || 'Book by\nYour Name\n\nMusic by\nYour Name\n\nLyrics by\nYour Name', 'authors'));

  if (inc.draft === true) {
    p1c.appendChild(el('div', { class: 'tp-spacer-large' }));
    const draft = el('div', { class: 'tp-draft-block' });
    draft.appendChild(tpEditable('div', 'tp-draft-line', tp.draftLine1 || 'Draft', 'draftLine1'));
    draft.appendChild(tpEditable('div', 'tp-draft-line', tp.draftLine2 || 'Date', 'draftLine2'));
    p1c.appendChild(draft);
  }

  p1c.appendChild(el('div', { class: 'tp-spacer-push' }));
  if (inc.contact !== false) {
    const contact = el('div', { class: 'tp-contact-block' });
    contact.appendChild(el('div', { class: 'tp-contact-label', text: 'Contact:' }));
    contact.appendChild(tpEditable('div', 'tp-contact-line', tp.contactName || 'Your Name', 'contactName'));
    contact.appendChild(tpEditable('div', 'tp-contact-line', tp.contactAddress || 'Address', 'contactAddress'));
    contact.appendChild(tpEditable('div', 'tp-contact-line', tp.contactPhone || 'Phone', 'contactPhone'));
    contact.appendChild(tpEditable('div', 'tp-contact-line', tp.contactEmail || 'Email', 'contactEmail'));
    contact.appendChild(tpEditable('div', 'tp-contact-or', tp.representedBy || 'or represented by:', 'representedBy'));
    p1c.appendChild(contact);
  }
  p1.appendChild(p1c);
  viewport.appendChild(p1);

  let pageNum = 2;
  const showTitle = (state.title || 'UNTITLED').toUpperCase();

  const addSheet = (buildFn) => {
    const sheet = el('div', { class: 'ms-sheet' });
    const hdr = el('div', { class: 'ms-sheet-header' });
    hdr.appendChild(el('span', { text: showTitle }));
    hdr.appendChild(el('span', { text: String(pageNum++) }));
    sheet.appendChild(hdr);
    const content = el('div', { class: 'ms-sheet-content' });
    buildFn(content);
    sheet.appendChild(content);
    viewport.appendChild(sheet);
  };

  // ── Page 2: Cast of Characters ─────────────────────────────────
  if (inc.cast !== false) addSheet((c) => {
    c.appendChild(el('div', { class: 'tp-section-heading tp-cast-heading', text: 'Characters' }));
    c.appendChild(el('div', { class: 'tp-spacer' }));
    const charNames = Object.keys(state.characters).filter((n) => charKind(n) === 'character').sort();
    if (charNames.length === 0) {
      c.appendChild(el('div', { class: 'tp-cast-hint', text: '(No characters yet — add @NAME cues in lyrics, then sync on the Characters page)' }));
    } else {
      charNames.forEach((name) => {
        const ch = state.characters[name] || {};
        const parts = [];
        if (ch.desc) parts.push(ch.desc);
        else if (ch.voiceType) parts.push(ch.voiceType);
        const text = parts.length ? name + ' – ' + parts.join(', ') : name;
        c.appendChild(el('div', { class: 'tp-cast-row', text }));
      });
    }
  });

  // ── Page 3: Settings ───────────────────────────────────────────
  if (inc.settings !== false) addSheet((c) => {
    c.appendChild(el('div', { class: 'tp-section-heading', text: 'SETTINGS' }));
    c.appendChild(el('div', { class: 'tp-spacer' }));
    const settingsVal = (tp.settings && tp.settings.length) ? tp.settings.join('\n') : '';
    const settingsEl = tpEditable('div', 'tp-settings-list', settingsVal, 'settings', true);
    if (!settingsVal && !state.readonly) settingsEl.setAttribute('data-placeholder', 'One setting per line…');
    c.appendChild(settingsEl);
  });

  // ── Songs ──────────────────────────────────────────────────────
  if (inc.songs !== false) addSheet((c) => {
    c.appendChild(el('div', { class: 'tp-section-heading tp-songs-heading', text: 'SONGS' }));
    c.appendChild(el('div', { class: 'tp-spacer' }));
    const songs = displayOrder()
      .map((i) => state.cards[i])
      .filter((c) => c.type === 'song' && c.title);
    if (songs.length === 0) {
      c.appendChild(el('div', { class: 'tp-cast-hint', text: '(No songs yet — add song cards on the Board)' }));
    } else {
      songs.forEach((s) => c.appendChild(el('div', { class: 'tp-song-row', text: s.title })));
    }
  });

  // ── Page 4: Production Notes ───────────────────────────────────
  if (inc.productionNotes !== false) addSheet((c) => {
    c.appendChild(el('div', { class: 'tp-section-heading', text: 'PRODUCTION NOTES' }));
    c.appendChild(el('div', { class: 'tp-spacer' }));
    const pnEl = tpEditable('div', 'tp-freetext', tp.productionNotes || '', 'productionNotes');
    if (!tp.productionNotes && !state.readonly) pnEl.setAttribute('data-placeholder', 'Time, place, production context…');
    c.appendChild(pnEl);
  });

  // ── Page 5: Acknowledgements ───────────────────────────────────
  if (inc.acknowledgements !== false) addSheet((c) => {
    c.appendChild(el('div', { class: 'tp-section-heading', text: 'ACKNOWLEDGEMENTS' }));
    c.appendChild(el('div', { class: 'tp-spacer' }));
    const ackEl = tpEditable('div', 'tp-freetext', tp.acknowledgements || '', 'acknowledgements');
    if (!tp.acknowledgements && !state.readonly) ackEl.setAttribute('data-placeholder', 'Thank you to…');
    c.appendChild(ackEl);
  });

  return viewport;
}

function renderSheetHeader(pageLabel, totalPages, isFirst) {
  const sh = state.scriptHeader;
  const hdr = el('div', { class: 'ms-sheet-header' });
  if (isFirst === undefined) isFirst = String(pageLabel) === '1';
  if (!sh.enabled || (isFirst && !sh.firstPage)) {
    hdr.style.visibility = 'hidden';
    return hdr;
  }
  const text = (sh.format || '')
    .replace('{title}', (state.title || 'Untitled Show').toUpperCase())
    .replace('{date}', sh.revisionDate || '')
    .replace('{page}', pageLabel);
  const span = el('span', { class: 'ms-sheet-hdr-text', text });
  span.style.textAlign = sh.alignment || 'right';
  if (sh.alignment === 'left') { hdr.appendChild(span); hdr.appendChild(el('span')); }
  else if (sh.alignment === 'center') { hdr.appendChild(el('span')); hdr.appendChild(span); hdr.appendChild(el('span')); }
  else { hdr.appendChild(el('span')); hdr.appendChild(span); }
  return hdr;
}

function buildHeaderDrawer(onUpdate) {
  const sh = state.scriptHeader;
  const drawer = el('div', { class: 'ms-hd-drawer', id: 'ms-hd-drawer' });
  const inner = el('div', { class: 'ms-hd-inner' });

  // Sticky title bar
  const titleBar = el('div', { class: 'ms-hd-titlebar' });
  titleBar.appendChild(el('span', { class: 'ms-hd-title', text: 'Page setup' }));
  const closeBtn = el('button', { class: 'ms-hd-close xclose', text: '✕', title: 'Close' });
  closeBtn.addEventListener('click', () => { drawer.classList.remove('open'); });
  titleBar.appendChild(closeBtn);
  inner.appendChild(titleBar);

  // Helpers: stacked row (label above a control) and inline toggle (label + checkbox)
  const stacked = (label, control) => {
    const r = el('div', { class: 'ms-hd-row' });
    r.appendChild(el('label', { class: 'ms-hd-label', text: label }));
    r.appendChild(control);
    return r;
  };
  const toggle = (label, checked, onChange) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = checked;
    const r = el('label', { class: 'ms-hd-toggle' });
    r.appendChild(el('span', { class: 'ms-hd-toggle-label', text: label }));
    r.appendChild(cb);
    cb.addEventListener('change', () => onChange(cb.checked));
    return { row: r, cb };
  };
  const sectionHead = (t) => el('div', { class: 'ms-hd-section-head', text: t });

  // ── Sub-panel plumbing ───────────────────────────────────────────
  // A summary row on the drawer root slides a detail pane in from the
  // right; the manuscript stays visible behind it for live preview, and a
  // back arrow returns to the root. (Title pages keeps its own full-screen
  // sub-mode — it's a page editor, not a settings pane.) mkSubpanel/
  // mkSummaryRow/openSubpanel are returned so the caller can add its own
  // panes, e.g. Revisions.
  const closeSubpanels = () => drawer.querySelectorAll('.ms-hd-subpanel').forEach((p) => p.classList.remove('open'));
  const mkSubpanel = (title) => {
    const panel = el('div', { class: 'ms-hd-subpanel' });
    const bar = el('div', { class: 'ms-hd-titlebar ms-hd-subbar' });
    const back = el('button', { class: 'ms-hd-back', title: 'Back' });
    back.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    back.addEventListener('click', closeSubpanels);
    bar.appendChild(back);
    bar.appendChild(el('span', { class: 'ms-hd-title', text: title }));
    panel.appendChild(bar);
    const pbody = el('div', { class: 'ms-hd-subbody' });
    panel.appendChild(pbody);
    drawer.appendChild(panel);
    return { panel, body: pbody };
  };
  const openSubpanel = (panel) => { closeSubpanels(); panel.classList.add('open'); };
  const mkSummaryRow = (label, getState, onOpen) => {
    const row = el('button', { class: 'ms-hd-navrow', type: 'button' });
    row.appendChild(el('span', { text: label }));
    const r = el('span', { class: 'ms-hd-navrow-r' });
    r.appendChild(el('span', { class: 'ms-hd-navrow-val', text: getState() }));
    r.innerHTML += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
    row.appendChild(r);
    row.addEventListener('click', onOpen);
    return { row, refresh: () => { const v = row.querySelector('.ms-hd-navrow-val'); if (v) v.textContent = getState(); } };
  };

  // ── Running header (summary row → slide-in sub-panel) ────────────
  // The "Show header on pages" toggle is itself the disclosure: turn the
  // header on and its detail controls (format, date, alignment, first-page)
  // appear below; turn it off and they collapse away. No separate preview —
  // the header is already visible on the pages in the main window.
  const { panel: hdPanel, body: hdBody } = mkSubpanel('Running header');

  const sub = el('div', { class: 'ms-hd-subgroup' });
  const syncVisibility = () => { sub.style.display = sh.enabled ? '' : 'none'; };

  const enabled = toggle('Show header on pages', sh.enabled, (v) => { sh.enabled = v; syncVisibility(); headerRow.refresh(); scheduleSave(); onUpdate(); });
  hdBody.appendChild(enabled.row);

  // Format template
  const fmtWrap = el('div', { class: 'ms-hd-fmt-wrap' });
  const fmtIn = el('input', { class: 'fi ms-hd-fmt-input', type: 'text', value: sh.format || '' });
  fmtIn.placeholder = '{title} – {date} – {page}.';
  fmtIn.addEventListener('input', () => { sh.format = fmtIn.value; scheduleSave(); onUpdate(); });
  fmtWrap.appendChild(fmtIn);
  const tokens = el('div', { class: 'ms-hd-tokens' });
  ['{title}', '{date}', '{page}'].forEach((tok) => {
    const chip = el('button', { class: 'ms-hd-token', text: tok });
    chip.addEventListener('click', () => {
      const s = fmtIn.selectionStart, e = fmtIn.selectionEnd;
      fmtIn.value = fmtIn.value.slice(0, s) + tok + fmtIn.value.slice(e);
      fmtIn.selectionStart = fmtIn.selectionEnd = s + tok.length;
      fmtIn.focus();
      sh.format = fmtIn.value;
      scheduleSave(); onUpdate();
    });
    tokens.appendChild(chip);
  });
  fmtWrap.appendChild(tokens);
  sub.appendChild(stacked('Format', fmtWrap));

  // Revision date
  const dateIn = el('input', { class: 'fi', type: 'text', value: sh.revisionDate || '' });
  dateIn.placeholder = '3/30/18, DRAFT, Workshop…';
  dateIn.addEventListener('input', () => { sh.revisionDate = dateIn.value; scheduleSave(); onUpdate(); });
  sub.appendChild(stacked('Revision / date', dateIn));

  // Alignment
  const alignSeg = el('div', { class: 'seg' });
  ['left', 'center', 'right'].forEach((a) => {
    const b = el('button', { text: a[0].toUpperCase() + a.slice(1) });
    if (sh.alignment === a) b.classList.add('active');
    b.addEventListener('click', () => {
      sh.alignment = a;
      alignSeg.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
      b.classList.add('active');
      scheduleSave(); onUpdate();
    });
    alignSeg.appendChild(b);
  });
  sub.appendChild(stacked('Alignment', alignSeg));

  // First page toggle
  const fp = toggle('Show on first page', sh.firstPage, (v) => { sh.firstPage = v; scheduleSave(); onUpdate(); });
  sub.appendChild(fp.row);

  hdBody.appendChild(sub);
  syncVisibility();

  const headerRow = mkSummaryRow('Running header', () => sh.enabled ? 'On' : 'Off', () => openSubpanel(hdPanel));

  drawer.appendChild(inner);
  return { drawer, inner, headerRow, mkSubpanel, mkSummaryRow, openSubpanel, closeSubpanels };
}

function buildManuscriptPage(sceneId) {
  const toolbar = document.getElementById('ms-toolbar');
  const body = document.getElementById('ms-body');
  toolbar.innerHTML = '';
  body.innerHTML = '';

  const ZOOM_STEP = 0.15, ZOOM_MIN = 0.4, ZOOM_MAX = 2.0;
  let zoom = (() => { try { return parseFloat(localStorage.getItem('md-ms-zoom')) || 0.75; } catch (_) { return 0.75; } })();
  let msMode = (() => { try { return localStorage.getItem('md-ms-mode') || 'edit'; } catch (_) { return 'edit'; } })();
  if (msMode === 'book' && state.format !== 'prose') msMode = 'edit'; // Book view is Prose Plot-only
  if (msMode !== 'edit' && msMode !== 'layout' && msMode !== 'book') msMode = 'edit'; // never boot into title pages (or a stale value)
  let lastDocMode = msMode; // where "Done with title pages" returns to

  const zoomOut = el('button', { class: 'ms-zoom-btn', text: '−', title: 'Zoom out' });
  const zoomIn  = el('button', { class: 'ms-zoom-btn', text: '+', title: 'Zoom in' });
  const zoomLbl = el('span', { class: 'ms-zoom-lbl' });
  const zoomWrap = el('div', { class: 'ms-zoom-wrap' }, [zoomOut, zoomLbl, zoomIn]);

  // View-mode toggle as a segmented control (matches the Board's view switcher),
  // so it reads as a state toggle rather than an action button.
  const modeSeg = el('div', { class: 'seg ms-mode-seg', title: 'Switch view' });
  const editTab = el('button', { text: 'Edit' });
  // Prose Plot renames "Print View" → "Manuscript" (it IS the manuscript
  // format) and adds a third Book segment; Song Plot keeps Edit | Print View.
  const layoutTab = el('button', { text: state.format === 'prose' ? 'Manuscript' : 'Print View' });
  modeSeg.appendChild(editTab);
  modeSeg.appendChild(layoutTab);
  let bookTab = null;
  if (state.format === 'prose') {
    bookTab = el('button', { text: 'Book' });
    modeSeg.appendChild(bookTab);
  }
  // Title pages is a third msMode under the hood, but to the writer it's
  // set-up-once document furniture, not a place they work — so it's entered
  // from the Page-setup drawer, and while it's open the Edit/Print switcher
  // swaps for a single Done button that returns to wherever you were.
  const titleDoneBtn = el('button', { class: 'ms-title-done', text: '✓ Done with title pages' });
  // Every "leaves the app" action now lives in the Export drawer; the toolbar
  // keeps one door to it, wearing the topnav's tray icon so both read as the
  // same room. It seeds the drawer with whichever document this view is —
  // Book view → Book (PDF), any other manuscript view → Manuscript (PDF).
  const exportBtn = el('button', { class: 'ms-print-btn', title: 'Export this manuscript (PDF, EPUB, print, backup…)' });
  exportBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/></svg><span>Export</span>';
  exportBtn.addEventListener('click', () => openExportDrawer(msMode === 'book' ? 'book' : 'manuscript'));
  const settingsBtn = el('button', { class: 'ms-settings-btn', title: 'Page settings' });
  settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const navBtn = el('button', { class: 'ms-nav-btn', title: 'Show/hide the outline navigation' });
  navBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg><span>Navigation</span>';
  const focusBtn = el('button', { class: 'ms-focus-btn', title: 'Focus mode — hide the chrome and dim everything but the scene you’re in (Esc to exit)' });
  focusBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg><span>Focus</span>';
  const wcLbl = el('span', { class: 'ms-wc-lbl' });
  const updateWordCount = () => { wcLbl.textContent = totalShowWords().toLocaleString() + ' words'; };
  updateWordCount();

  const saveMsOpts = () => { try { localStorage.setItem('md-ms-opts', JSON.stringify(state.msOptions)); } catch (_) {} };
  // Chords hide via a body class (CSS only) rather than stripping the [C]
  // markup, so toggling back on needs no reparse — mirrors Section tags below.
  const applyChordVisibility = () => { document.body.classList.toggle('ms-hide-chords', state.msOptions.showChords === false); };
  applyChordVisibility();
  // Paragraph convention (Prose Plot only) — Indent (default, tight/first-line
  // indent) vs Block (no indent, gap between paragraphs). A body class, so
  // Edit and Print View both pick it up via the CSS in the app-prose block —
  // no reflow/reparse needed, just like chord/section visibility above.
  const applyParaStyle = () => { document.body.classList.toggle('ms-para-block', state.paraStyle === 'block'); };
  applyParaStyle();

  toolbar.appendChild(navBtn); // leftmost — the outline opens on the left
  toolbar.appendChild(wcLbl);
  toolbar.appendChild(zoomWrap); // absolutely centered via CSS
  // Mode toggle lives on the right beside Print so it stays anchored when the
  // Edit-only Navigation button disappears in Print View.
  const tbRight = el('div', { class: 'ms-tb-right' });
  tbRight.appendChild(modeSeg);
  tbRight.appendChild(titleDoneBtn); // occupies the switcher's slot while title pages are open
  // Focus (Edit-only) and Export (Print View/Book-only) share one slot and one
  // fixed width: exactly one shows per mode, so the row's width stays constant
  // and the Edit | Print View toggle never shifts when you tab between views.
  tbRight.appendChild(focusBtn);
  tbRight.appendChild(exportBtn);
  tbRight.appendChild(el('span', { class: 'ms-tb-divider' }));
  tbRight.appendChild(settingsBtn); // settings last — it opens the right-edge drawer
  toolbar.appendChild(tbRight);

  const msWrap = el('div', { class: 'ms-wrap' });

  // ── Layout mode (paginated) ──────────────────────────────────────
  const rebuildSheets = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });
    const toks = buildContentTokens(sceneId);
    const pages = paginateTokens(toks, sceneId ? null : undefined);
    const viewport = el('div', { class: 'ms-viewport' });
    viewport.style.zoom = zoom;
    pages.forEach((pageToks, pi) => {
      const sheet = el('div', { class: 'ms-sheet' });
      sheet.appendChild(renderSheetHeader(pages[pi].label || (pi + 1), pages.length, pi === 0));
      const content = el('div', { class: 'ms-sheet-content' });
      pageToks.forEach((tok) => renderPageToken(tok, content));
      sheet.appendChild(content);
      viewport.appendChild(sheet);
    });
    newBody.appendChild(viewport);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
  };

  // ── Book mode (Prose Plot only — front matter → chapters → back matter) ──
  // Read-only, like Print View. See BOOK-FORMATTING-PLAN.md Phase 1b. Sheet
  // assembly lives in the top-level buildBookSheets() so exportBookPDF (which
  // isn't inside this closure) can reuse the exact same rendering — never
  // fork the two like exportPDF/rebuildSheets historically didn't need to
  // (they share renderPageToken already; this keeps Book to the same rule).
  const rebuildBook = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });
    const viewport = el('div', { class: 'ms-viewport book-viewport' });
    viewport.style.zoom = zoom;
    buildBookSheets().forEach((sheet) => viewport.appendChild(sheet));
    newBody.appendChild(viewport);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
  };

  // ── Title-pages mode (front matter) ─────────────────────────────
  // The former standalone Title Pages tab, folded into Manuscript as a view.
  // Include-checkboxes sit inline above the zoomable sheet preview; Print
  // (exportPDF(true)) already emits these pages ahead of the script.
  const rebuildTitle = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });

    const checks = el('div', { class: 'tp-checks' });
    let vp = null;
    const renderVp = () => {
      if (vp) vp.remove();
      vp = buildTitlePages();
      vp.style.zoom = zoom;
      newBody.appendChild(vp);
    };
    const groups = [
      { label: 'Title page', items: [
        { key: 'subtitle', label: 'Subtitle', defOff: true },
        { key: 'rule', label: 'Title line', defOff: true },
        { key: 'draft', label: 'Draft / date', defOff: true },
        { key: 'contact', label: 'Contact info' },
      ] },
      { label: 'Additional pages', items: [
        { key: 'cast', label: 'Cast of Characters' },
        { key: 'settings', label: 'Settings' },
        { key: 'songs', label: 'Songs' },
        { key: 'productionNotes', label: 'Production Notes' },
        { key: 'acknowledgements', label: 'Acknowledgements' },
      ] },
    ];
    groups.forEach(({ label: groupLabel, items }) => {
      const group = el('div', { class: 'tp-checks-group' });
      group.appendChild(el('span', { class: 'tp-checks-label', text: groupLabel }));
      items.forEach(({ key, label, defOff }) => {
        const lbl = el('label', { class: 'tp-check-item' });
        const cb = el('input', { type: 'checkbox' });
        cb.checked = defOff ? state.titlePage.include[key] === true : state.titlePage.include[key] !== false;
        if (state.readonly) cb.disabled = true;
        cb.addEventListener('change', () => { state.titlePage.include[key] = cb.checked; scheduleSave(); renderVp(); });
        lbl.appendChild(cb);
        lbl.appendChild(el('span', { text: label }));
        group.appendChild(lbl);
      });
      checks.appendChild(group);
    });
    newBody.appendChild(checks);
    renderVp();
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
  };

  // ── Book-matter mode (Prose Plot only, front/back matter data + editors) ──
  // Phase 1a of BOOK-FORMATTING-PLAN.md: create/edit/reorder front & back
  // matter blocks and book.meta. Rendering into an actual Book view is 1b —
  // this mode is just the editor, mirroring rebuildTitle's structure above.
  const rebuildBookMatter = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body bm-body' });
    const book = state.book;

    const metaField = (label, key, placeholder) => {
      const row = el('div', { class: 'bm-field' });
      row.appendChild(el('label', { class: 'bm-field-label', text: label }));
      const inp = el('input', { class: 'bm-field-in', type: 'text', value: book.meta[key] || '', placeholder: placeholder || '' });
      if (state.readonly) inp.disabled = true;
      else inp.addEventListener('input', () => { book.meta[key] = inp.value; scheduleSave(); });
      row.appendChild(inp);
      return row;
    };
    const metaSec = el('div', { class: 'bm-meta' });
    metaSec.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Book details' }));
    metaSec.appendChild(metaField('Author name', 'authorName'));
    metaSec.appendChild(metaField('ISBN', 'isbn'));
    metaSec.appendChild(metaField('Publisher', 'publisher'));
    const descRow = el('div', { class: 'bm-field' });
    descRow.appendChild(el('label', { class: 'bm-field-label', text: 'Description' }));
    const descArea = el('textarea', { class: 'bm-field-area', placeholder: 'Back-cover copy…' });
    descArea.value = book.meta.description || '';
    if (state.readonly) descArea.setAttribute('readonly', '');
    else descArea.addEventListener('input', () => { book.meta.description = descArea.value; scheduleSave(); });
    descRow.appendChild(descArea);
    metaSec.appendChild(descRow);

    // Cover image — stored as a downscaled JPEG data URL in book.meta.coverImage,
    // embedded into the EPUB at export (Phase 4b).
    const coverRow = el('div', { class: 'bm-field' });
    coverRow.appendChild(el('label', { class: 'bm-field-label', text: 'Cover image' }));
    const coverBox = el('div', { class: 'bm-cover-box' });
    const renderCover = () => {
      coverBox.innerHTML = '';
      if (book.meta.coverImage) {
        coverBox.appendChild(el('img', { class: 'bm-cover-thumb', src: book.meta.coverImage, alt: 'Cover' }));
        if (!state.readonly) {
          const rm = el('button', { type: 'button', class: 'bm-cover-rm', text: 'Remove cover' });
          rm.addEventListener('click', () => { book.meta.coverImage = null; scheduleSave(); renderCover(); });
          coverBox.appendChild(rm);
        }
      } else {
        const fileIn = el('input', { type: 'file', accept: 'image/*', class: 'bm-cover-input', id: 'bm-cover-input' });
        const lbl = el('label', { class: 'pbtn bm-cover-btn', for: 'bm-cover-input', text: '+ Choose cover image…' });
        if (state.readonly) fileIn.disabled = true;
        fileIn.addEventListener('change', () => {
          const f = fileIn.files && fileIn.files[0];
          if (!f) return;
          downscaleImageToJpeg(f, 1600, 0.82)
            .then((dataUrl) => { book.meta.coverImage = dataUrl; scheduleSave(); renderCover(); })
            .catch((e) => alert(e.message || 'Could not read that image.'));
        });
        coverBox.appendChild(fileIn);
        coverBox.appendChild(lbl);
      }
    };
    renderCover();
    coverRow.appendChild(coverBox);
    metaSec.appendChild(coverRow);

    const buildCol = (section, sectionLabel) => {
      const col = el('div', { class: 'bm-col' });
      col.appendChild(el('div', { class: 'ms-hd-section-head', text: sectionLabel }));
      const list = el('div', { class: 'bm-list' });
      const blocks = book.matter[section];
      const renderList = () => {
        list.innerHTML = '';
        blocks.forEach((b, i) => {
          const kindMeta = BOOK_MATTER_KINDS[section].find((k) => k.kind === b.kind) || {};
          const row = el('div', { class: 'bm-row' });
          const head = el('div', { class: 'bm-row-head' });
          const cb = el('input', { type: 'checkbox' });
          cb.checked = b.include !== false;
          if (state.readonly) cb.disabled = true;
          else cb.addEventListener('change', () => { b.include = cb.checked; scheduleSave(); });
          head.appendChild(cb);
          head.appendChild(el('span', { class: 'bm-row-label', text: kindMeta.label || b.kind }));
          const btns = el('div', { class: 'bm-row-btns' });
          const upBtn = el('button', { type: 'button', class: 'bm-reorder-btn', text: '↑', title: 'Move up' });
          const downBtn = el('button', { type: 'button', class: 'bm-reorder-btn', text: '↓', title: 'Move down' });
          if (i === 0 || state.readonly) upBtn.disabled = true;
          if (i === blocks.length - 1 || state.readonly) downBtn.disabled = true;
          upBtn.addEventListener('click', () => { [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]]; scheduleSave(); renderList(); });
          downBtn.addEventListener('click', () => { [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]]; scheduleSave(); renderList(); });
          btns.appendChild(upBtn);
          btns.appendChild(downBtn);
          head.appendChild(btns);
          row.appendChild(head);

          if (kindMeta.cls === 'freetext') {
            const ta = el('textarea', { class: 'bm-freetext' });
            ta.value = b.text || '';
            ta.placeholder = 'Write ' + (kindMeta.label || b.kind).toLowerCase() + '…';
            if (state.readonly) ta.setAttribute('readonly', '');
            else ta.addEventListener('input', () => { b.text = ta.value; scheduleSave(); });
            row.appendChild(ta);
          } else if (kindMeta.cls === 'templated') {
            const form = el('div', { class: 'bm-copyright-form' });
            const cField = (label, key, ph) => {
              const r = el('div', { class: 'bm-field' });
              r.appendChild(el('label', { class: 'bm-field-label', text: label }));
              const inp = el('input', { class: 'bm-field-in', type: 'text', value: b[key] || '', placeholder: ph || '' });
              if (state.readonly) inp.disabled = true;
              else inp.addEventListener('input', () => { b[key] = inp.value; scheduleSave(); });
              r.appendChild(inp);
              return r;
            };
            form.appendChild(cField('Copyright year', 'copyrightYear', String(new Date().getFullYear())));
            form.appendChild(cField('Copyright holder', 'copyrightHolder', book.meta.authorName || 'Author name'));
            form.appendChild(cField('Edition', 'edition', 'First edition'));
            const rr = el('div', { class: 'bm-field' });
            rr.appendChild(el('label', { class: 'bm-field-label', text: 'Rights' }));
            const rta = el('textarea', { class: 'bm-field-area' });
            rta.value = b.rightsText || '';
            rta.placeholder = 'All rights reserved.';
            if (state.readonly) rta.setAttribute('readonly', '');
            else rta.addEventListener('input', () => { b.rightsText = rta.value; scheduleSave(); });
            rr.appendChild(rta);
            form.appendChild(rr);
            row.appendChild(form);
          } else {
            row.appendChild(el('div', { class: 'bm-generated-hint', text: 'Generated automatically from your title and book details.' }));
          }
          list.appendChild(row);
        });
      };
      renderList();
      col.appendChild(list);
      return col;
    };
    const cols = el('div', { class: 'bm-cols' });
    cols.appendChild(buildCol('front', 'Front matter'));
    cols.appendChild(buildCol('back', 'Back matter'));

    const wrap = el('div', { class: 'bm-wrap' });
    wrap.appendChild(metaSec);
    wrap.appendChild(cols);
    newBody.appendChild(wrap);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
  };

  // ── Edit mode (per-card sections) ───────────────────────────────
  // The manuscript body field — shared with the rest of the app (and the
  // `card.lines` identity sidecar) via the top-level cardBodyField.
  const cardField = cardBodyField;

  // A beat's Beatline is editable in place, right from its sage rendering — the
  // hinge made tangible (A4). mousedown stops propagation first: the section's
  // own mousedown listener (below) would otherwise swap in the rich editor and
  // tear this element out of the DOM before its click ever fires.
  const makeBeatlineEditable = (elm, c) => {
    if (state.readonly) return elm;
    elm.classList.add('lw-note-ms-edit');
    elm.setAttribute('spellcheck', 'false');
    elm.addEventListener('mousedown', (e) => e.stopPropagation());
    elm.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elm.getAttribute('contenteditable') !== 'true') { elm.setAttribute('contenteditable', 'true'); elm.focus(); }
    });
    elm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); elm.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); elm.textContent = c.note || ''; elm.blur(); }
    });
    elm.addEventListener('blur', () => {
      if (state.loading) return;
      const v = elm.textContent.replace(/\s+/g, ' ').trim();
      elm.textContent = v;
      elm.removeAttribute('contenteditable');
      if (v !== (c.note || '')) { setCardBody(c, 'note', v); doSave(); if (refreshNav) refreshNav(); }
    });
    return elm;
  };

  // Rename a card straight from its Manuscript divider. Click the title to edit;
  // Enter/blur commits, Escape reverts. Commit resyncs the Navigator row and the
  // (hidden) board — navigateTo('board') only unhides stale DOM, so the title
  // wouldn't otherwise update there.
  const makeDividerTitleEditable = (elm, c) => {
    if (state.readonly) return elm;
    elm.classList.add('ms-div-title-edit');
    elm.setAttribute('spellcheck', 'false');
    elm.setAttribute('title', 'Click to rename');
    elm.addEventListener('mousedown', (e) => e.stopPropagation());
    elm.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elm.getAttribute('contenteditable') === 'true') return;
      elm.setAttribute('contenteditable', 'true');
      elm.focus();
      const r = document.createRange(); r.selectNodeContents(elm);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    });
    elm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); elm.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); elm.textContent = c.title || 'Untitled'; elm.blur(); }
    });
    elm.addEventListener('blur', () => {
      if (state.loading) return;
      const v = elm.textContent.replace(/\s+/g, ' ').trim();
      const changed = v !== (c.title || '');
      elm.textContent = v || 'Untitled';
      elm.removeAttribute('contenteditable');
      if (changed) { c.title = v; doSave(); render(); if (refreshNav) refreshNav(); }
    });
    return elm;
  };

  const renderCardSection = (sec, c) => {
    sec.innerHTML = '';
    // A beat's body is specifically `lyrics` — its `note` is the sage outline
    // Beatline, not written content. cardBodyField's generic fallback (lyrics,
    // else note) exists for scenes/songs and would otherwise treat a beat's
    // Beatline as body text too, duplicating it as a plain action line right
    // under its own sage rendering (matches Print view's emitCard, which
    // already keeps these separate for beats — see buildContentTokens above).
    const text = (c.type === 'beat' ? (c.lyrics || '') : (c[cardField(c)] || '')).trim();
    const isEmpty = !text;
    // Beatline shown as a sage outline reference — consistent with Print view.
    // Read-only here (edited via the card / Details); hidden with its own
    // Beatlines toggle (CSS, under .hide-beatlines) so it round-trips cleanly.
    const hasBeatline = c.type === 'beat' && (c.note || '').trim();
    const inner = el('div', { class: 'ms-card-content ms-sheet-content' + (isEmpty && !hasBeatline ? ' ms-card-section-empty' : '') });
    if (hasBeatline) inner.appendChild(makeBeatlineEditable(el('div', { class: 'lw-note-ms', text: c.note }), c));
    if (isEmpty) {
      const sceneWord = state.format === 'prose' ? 'chapter heading' : 'scene heading';
      const phText = state.readonly
        ? (c.type === 'scene' ? '(' + sceneWord + ')' : c.type === 'beat' ? '' : '(lyrics not reproduced)')
        : (c.type === 'scene' ? '(' + sceneWord + ' — click to write)' : c.type === 'beat' ? '(new beat — click to write)' : '(no lyrics yet — click to write)');
      inner.appendChild(el('div', { class: 'ms-card-placeholder', text: phText }));
    } else {
      // Render with the same .ms-el markup the editor uses, so clicking in swaps
      // to an identical box layout — no reflow.
      cardBodyTokens(c).forEach((tok) => inner.appendChild(bodyLineEl(tok.type, tok.text, tok.key)));
    }
    sec.appendChild(inner);
  };

  const enterCardEditRich = (sec, c, ev) => {
    if (state.readonly) return; // references are read-only study objects
    if (sec.querySelector('.ms-card-rich-editor')) return;
    // Anchor: remember where this card's body content sits in the viewport before
    // we mutate the DOM, so the style ribbon appearing (and any other open editor
    // collapsing) doesn't shift the text out from under the cursor.
    const msBody = sec.closest('.ms-body');
    const bodyStart = sec.querySelector('.ms-card-content > :not(.lw-note-ms)');
    const anchorY = ev && bodyStart ? bodyStart.getBoundingClientRect().top : null;
    // One editor open at a time: commit & collapse any other scene still in edit
    // mode (its onSave reverts it to the static render), so only the scene the
    // cursor is in shows the style ribbon.
    const docEl = sec.closest('.ms-edit-doc');
    if (docEl) docEl.querySelectorAll('.ms-card-rich-editor').forEach((rw) => { if (rw._commit) rw._commit(); });
    sec.innerHTML = '';
    // Keep the sage Beatline pinned above the editor while editing (it's edited via
    // the card/Details, not here) so it doesn't vanish when you click in. Wrapped in
    // .ms-sheet-content so it inherits the script column width and wraps like static.
    const hasBeatline = c.type === 'beat' && (c.note || '').trim() && state.msOptions.showBeatlines !== false;
    sec.classList.toggle('ms-has-logline', !!hasBeatline);
    if (hasBeatline) {
      sec.appendChild(el('div', { class: 'ms-sheet-content ms-edit-logline' }, [makeBeatlineEditable(el('div', { class: 'lw-note-ms', text: c.note }), c)]));
    }
    const rich = buildRichEditor({
      text: c[cardField(c)] || '',
      lines: c.lines,
      isSong: c.type === 'song',
      autofocus: !ev, // a click positions the caret at its point instead
      detachBar: true, // the ribbon lives in the one persistent bar, not in the card
      onSave: (val, lines) => {
        setCardLines(c, lines); // lines canonical; derives the body blob
        doSave(); // persist immediately — blur may be followed by navigating away
        renderCardSection(sec, c);
        updateWordCount();
        if (refreshNav) refreshNav(); // outline's note sub-rows track this card's body
      },
      onClose: () => { if (setActiveFormatBar) setActiveFormatBar(null); }, // release the shared bar
      // "/song Title" + Enter in the editor: a new card lands right after this
      // one (same act), the doc rebuilds, and the caret drops into it.
      onSpawnCard: (type, title) => {
        const at = state.cards.indexOf(c);
        spawnCardAt(type, at < 0 ? state.cards.length - 1 : at, 'after', title);
      },
    });
    sec.appendChild(rich);
    // Hoist this editor's ribbon into the single sticky bar (it controls whichever
    // card the cursor is in), then sync it to the focused line.
    if (setActiveFormatBar) setActiveFormatBar(rich._styleBar);
    // Re-anchor: scroll the body so the editor's first line returns to where the
    // static content sat, then drop the caret at the original click point.
    if (anchorY != null && msBody && rich._lineEd) {
      const firstEl = rich._lineEd.querySelector('.ms-el') || rich._lineEd;
      msBody.scrollTop += firstEl.getBoundingClientRect().top - anchorY;
    }
    if (ev && rich._focusFromPoint) rich._focusFromPoint(ev.clientX, ev.clientY);
    // No event (quick-create paths): buildRichEditor's own autofocus ran while
    // the editor was still detached, so re-focus now that it's in the DOM.
    else if (rich._focusFirst) rich._focusFirst();
    if (rich._syncBar) rich._syncBar();
  };

  // ── Quick-create (Navigator gap "+" and the /song slash command) ─────
  // Insert a new card before/after the card at state.cards[refIdx] (act taken
  // from that neighbor), save, rebuild the doc, then scroll to the new card
  // and open its editor ready to type. Any open editor commits first so no
  // in-flight text is lost to the rebuild.
  const spawnCardAt = (type, refIdx, where, title) => {
    const ref = state.cards[refIdx];
    if (!ref) return;
    msWrap.querySelectorAll('.ms-card-rich-editor').forEach((rw) => { if (rw._commit) rw._commit(); });
    const card = makeNewCard(type, ref.act, title);
    state.cards.splice(refIdx + (where === 'after' ? 1 : 0), 0, card);
    doSave();
    render();      // rebuild the (hidden) board too — navigateTo('board') only
                   // unhides it, so without this the new card never shows there
    rebuildEdit(); // refreshes the Navigator itself
    openCardEditor(card.id);
  };
  // Delete a card from the Navigator (hover "×"). Mirrors spawnCardAt: commit any
  // open editor, splice, persist, resync the board, rebuild the manuscript.
  const deleteCardFromNav = (id) => {
    const i = state.cards.findIndex((x) => x.id === id);
    if (i < 0) return;
    const c = state.cards[i];
    if (!confirm('Delete "' + (c.title || 'Untitled') + '"?')) return;
    msWrap.querySelectorAll('.ms-card-rich-editor').forEach((rw) => { if (rw._commit) rw._commit(); });
    state.cards.splice(i, 1);
    doSave();
    render();
    rebuildEdit();
  };
  const openCardEditor = (id) => {
    const bodyEl = msWrap.querySelector('.ms-body');
    const c = state.cards.find((x) => x.id === id);
    if (!bodyEl || !c) return;
    const div = bodyEl.querySelector('.ms-card-divider[data-card-id="' + id + '"]');
    if (div) div.scrollIntoView({ block: 'center' });
    const sec = bodyEl.querySelector('.ms-card-section[data-card-id="' + id + '"]');
    if (sec) enterCardEditRich(sec, c); // no event → autofocus at the first line
  };

  // Card indices shown in Edit mode — the full reading order, or a single
  // scene's slice when opened via a scene's ▶ button. Shared by the document
  // builder and the outline navigator so they always agree.
  const editOrder = () => {
    const order = displayOrder();
    if (!sceneId) return order;
    const startPos = order.findIndex((i) => state.cards[i] && state.cards[i].id === sceneId);
    if (startPos < 0) return order;
    const endPos = order.findIndex((i, j) => j > startPos && state.cards[i] && state.cards[i].type === 'scene');
    return order.slice(startPos, endPos >= 0 ? endPos : undefined);
  };

  // Assigned once the navigator is built (below); called after each rebuild.
  let refreshNav = null;
  // Assigned in rebuildEdit: mounts the active editor's style ribbon into the one
  // persistent bar (or restores the idle disabled bar when nothing is being edited).
  let setActiveFormatBar = null;

  const rebuildEdit = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });
    // One persistent formatting bar, sticky at the top of the editing surface. It
    // always occupies its slot (so opening/closing a card editor never shifts the
    // page) and reflects/controls whichever card the cursor is currently in.
    const formatBar = el('div', { class: 'ms-format-bar' });
    // Idle state: the same control layout, disabled — so the bar reads consistently
    // and never changes height between idle and active.
    const idleBar = (() => {
      const isProse = state.format === 'prose';
      const bar = el('div', { class: 'ms-style-bar ms-style-bar-idle' });
      ['↶', '↷'].forEach((h) => bar.appendChild(el('button', { class: 'ms-fmt-btn', type: 'button', disabled: 'disabled', html: h })));
      bar.appendChild(el('span', { class: 'ms-fmt-divider' }));
      if (isProse) {
        // Mirror the active bar's grouping exactly (selectors | emphasis), so the
        // bar's shape never shifts between idle and editing.
        const curFontLabel = EDIT_FONT_LABELS[state.msOptions.editFont] || EDIT_FONT_LABELS.courier;
        bar.appendChild(el('select', { class: 'ms-font-sel', disabled: 'disabled' }, [el('option', { text: curFontLabel })]));
        bar.appendChild(el('select', { class: 'ms-style-sel', disabled: 'disabled' }, [el('option', { text: 'Body' })]));
        bar.appendChild(el('span', { class: 'ms-fmt-divider' }));
        ['<b>B</b>', '<i>I</i>', '<u>U</u>', '<s>S</s>'].forEach((h) => bar.appendChild(el('button', { class: 'ms-fmt-btn', type: 'button', disabled: 'disabled', html: h })));
      } else {
        bar.appendChild(el('select', { class: 'ms-style-sel', disabled: 'disabled' }, [el('option', { text: 'Element' })]));
        bar.appendChild(el('button', { class: 'ms-dual-btn', type: 'button', disabled: 'disabled', text: 'Dual ⇄' }));
        bar.appendChild(el('span', { class: 'ms-fmt-divider' }));
        ['<b>B</b>', '<i>I</i>', '<u>U</u>', '<s>S</s>'].forEach((h) => bar.appendChild(el('button', { class: 'ms-fmt-btn', type: 'button', disabled: 'disabled', html: h })));
      }
      bar.appendChild(el('button', { class: 'ms-fmt-btn ms-fmt-hl', type: 'button', disabled: 'disabled', html: '<mark>H</mark>' }));
      // No "click a line to edit" hint — the dimmed, disabled controls already
      // read as "inactive," and the instruction states the obvious.
      return bar;
    })();
    setActiveFormatBar = (styleBarEl) => {
      formatBar.innerHTML = '';
      formatBar.classList.toggle('active', !!styleBarEl);
      formatBar.appendChild(styleBarEl || idleBar);
    };
    if (!state.readonly) { setActiveFormatBar(null); newBody.appendChild(formatBar); }
    // Mirror the Print view's "Section tags" and "Beatlines" toggles here: hide
    // section pills / Beatlines in both the static render and the rich editor
    // when their option is off. CSS hides them (lines stay in the DOM, so they
    // round-trip and reappear when toggled back on).
    const doc = el('div', { class: 'ms-edit-doc'
      + (state.msOptions.showSectionTags === false ? ' hide-sections' : '')
      + (state.msOptions.showBeatlines === false ? ' hide-beatlines' : '') });
    if (state.format === 'prose') doc.style.setProperty('--edit-font', editFontFamily(state.msOptions.editFont));

    editOrder().forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      const isEmpty = !(c[cardField(c)] || '').trim();
      const div = el('div', { class: 'ms-card-divider' + (isEmpty ? ' ms-card-divider-empty' : ''), 'data-card-id': c.id, 'data-anchor': 'card:' + c.id });
      const icon = c.type === 'song' ? '♪' : c.type === 'scene' ? '◆' : '◦';
      const label = el('span', { class: 'ms-card-divider-label' }, [
        el('span', { class: 'ms-card-divider-icon', text: icon }),
        makeDividerTitleEditable(el('span', { class: 'ms-card-divider-title', text: c.title || 'Untitled' }), c),
      ]);
      div.appendChild(label);
      doc.appendChild(div);
      const sec = el('div', { class: 'ms-card-section', 'data-card-id': c.id });
      renderCardSection(sec, c);
      // Use mousedown (not click) and preventDefault so focus stays ours: one
      // press opens the editor AND drops the caret at the click point, ready to
      // type. Once editing, native mousedown handles cursor moves / selection.
      sec.addEventListener('mousedown', (e) => {
        if (state.readonly) return;
        if (sec.querySelector('.ms-card-rich-editor')) return;
        e.preventDefault();
        enterCardEditRich(sec, c, e);
      });
      doc.appendChild(sec);
    });
    newBody.appendChild(doc);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
    if (refreshNav) refreshNav();
  };

  // ── Mode switching ───────────────────────────────────────────────
  // Capture which content sits at the viewport top (an anchored line or card) and
  // its pixel offset, so the new layout can scroll the same content back into the
  // same spot — Edit (continuous) and Print (paginated) have different geometry,
  // so a raw scrollTop carry-over lands on the wrong place.
  // Capture the first few anchored elements at/below the viewport top (with their
  // pixel offsets). A list, not one, so restore can skip an anchor that's unique to
  // one view (act headers in Print, section lines hidden from Print) and use the
  // next shared one.
  const captureAnchor = () => {
    const body = msWrap.querySelector('.ms-body');
    if (!body) return null;
    const top = body.getBoundingClientRect().top;
    const out = [];
    for (const n of body.querySelectorAll('[data-anchor]')) {
      const r = n.getBoundingClientRect();
      if (r.bottom > top + 1) { out.push({ key: n.dataset.anchor, offset: r.top - top }); if (out.length >= 6) break; }
    }
    return out.length ? out : null;
  };
  const restoreAnchor = (anchors) => {
    if (!anchors) return;
    const body = msWrap.querySelector('.ms-body');
    if (!body) return;
    for (const a of anchors) {
      const n = body.querySelector('[data-anchor="' + a.key + '"]');
      if (n) { body.scrollTop += (n.getBoundingClientRect().top - body.getBoundingClientRect().top) - a.offset; return; }
    }
    // None of the captured anchors exist in the target view — keep carried scrollTop.
  };

  const applyMode = () => {
    const anchor = captureAnchor();
    editTab.classList.toggle('active', msMode === 'edit');
    layoutTab.classList.toggle('active', msMode === 'layout');
    if (bookTab) bookTab.classList.toggle('active', msMode === 'book');
    const isSideMode = msMode === 'title' || msMode === 'book-matter'; // document furniture, not a real document mode
    if (!isSideMode) lastDocMode = msMode;
    // While on title pages/book matter the Edit/Print switcher gives way to one Done button.
    modeSeg.style.display = isSideMode ? 'none' : '';
    titleDoneBtn.style.display = isSideMode ? '' : 'none';
    titleDoneBtn.textContent = msMode === 'book-matter' ? '✓ Done with book matter' : '✓ Done with title pages';
    // Persist only real document modes — a reload should never land on title pages/book matter.
    try { localStorage.setItem('md-ms-mode', lastDocMode); } catch (_) {}
    if (msMode !== 'edit' && focusMode) exitFocus(); // Focus is an Edit-only concept
    // Export swaps into the Focus slot: it's meaningful only where there's a
    // finished document to hand off (Print View, Book), and its fixed width
    // matches Focus so the toggle beside it never shifts. Hidden on Edit (Focus
    // shows there) and on the side modes (title/book-matter have their own Done).
    exportBtn.style.display = (msMode === 'layout' || msMode === 'book') ? '' : 'none';
    applyNav(); // outline panel + Navigation button reflect Edit/Print state
    applyFocus();
    // Title/book-matter modes have their own inline controls, so the settings
    // gear (script options: title/act headers/section tags) is hidden there.
    settingsBtn.style.display = isSideMode ? 'none' : '';
    // Manuscript and Book each have their own settings drawer — close
    // whichever one doesn't belong to the view we're switching to, so
    // re-opening the gear always starts from a closed state. (applyMode()
    // is only ever invoked after both drawers are constructed below.)
    const relevantDrawer = (msMode === 'book' && bookDrawer) ? bookDrawer : drawer;
    const otherDrawer = relevantDrawer === drawer ? bookDrawer : drawer;
    if (otherDrawer) otherDrawer.classList.remove('open');
    if (isSideMode) relevantDrawer.classList.remove('open');
    if (built) built.closeSubpanels(); // switching views always returns to the drawer root
    // Gear button reflects whichever drawer is relevant to the view we just
    // switched to — closing the other view's drawer above must not leave the
    // gear looking "active" when nothing is actually open anymore.
    settingsBtn.classList.toggle('active', relevantDrawer.classList.contains('open'));
    if (msMode === 'edit') rebuildEdit();
    else if (msMode === 'title') rebuildTitle();
    else if (msMode === 'book-matter') rebuildBookMatter();
    else if (msMode === 'book') rebuildBook();
    else rebuildSheets();
    applyZoom();
    restoreAnchor(anchor);
  };
  editTab.addEventListener('click', () => { if (msMode !== 'edit') { msMode = 'edit'; applyMode(); } });
  layoutTab.addEventListener('click', () => { if (msMode !== 'layout') { msMode = 'layout'; applyMode(); } });
  if (bookTab) bookTab.addEventListener('click', () => { if (msMode !== 'book') { msMode = 'book'; applyMode(); } });
  titleDoneBtn.addEventListener('click', () => { msMode = lastDocMode; applyMode(); });

  // ── Settings drawer ──────────────────────────────────────────────
  // A "leave to a full page" row for entries that navigate to a sub-screen
  // (title pages, book matter) rather than sliding a panel in place. The
  // diagonal arrow + subtitle mark it apart from the summary rows above,
  // whose chevron promises an in-drawer panel — this one takes you away.
  const mkNavRow = (label, onOpen, sublabel) => {
    const row = el('button', { class: 'ms-hd-navrow ms-hd-navrow-leave', type: 'button' });
    const main = el('span', { class: 'ms-hd-navrow-main' });
    main.appendChild(el('span', { text: label }));
    if (sublabel) main.appendChild(el('span', { class: 'ms-hd-navrow-sub', text: sublabel }));
    row.appendChild(main);
    row.innerHTML += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg>';
    row.addEventListener('click', onOpen);
    return row;
  };

  const built = buildHeaderDrawer(() => { if (msMode === 'layout') rebuildSheets(); else rebuildEdit(); });
  const drawer = built.drawer;
  const drawerInner = built.inner;
  // Daily document toggles sit at the top level; the heavier setup (running
  // header, title pages, revisions) hangs off summary rows below, so the
  // drawer root stays short.
  drawerInner.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Document' }));
  const mkDrawerToggle = (label, key, defaultVal) => {
    if (state.msOptions[key] === undefined) state.msOptions[key] = defaultVal !== false;
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state.msOptions[key];
    cb.addEventListener('change', () => {
      state.msOptions[key] = cb.checked;
      saveMsOpts();
      applyChordVisibility();
      if (msMode === 'layout') rebuildSheets(); else rebuildEdit();
    });
    const r = el('label', { class: 'ms-hd-toggle' });
    r.appendChild(el('span', { class: 'ms-hd-toggle-label', text: label }));
    r.appendChild(cb);
    return r;
  };
  drawerInner.appendChild(mkDrawerToggle('Show title', 'showTitle', false));
  drawerInner.appendChild(mkDrawerToggle('Beatlines', 'showBeatlines', true));
  if (state.format === 'prose') {
    // Paragraph convention — a segmented choice, not a boolean, so it doesn't
    // fit mkDrawerToggle's checkbox shape. Novel-writing convention: Indent
    // (tight, first-line indent) or Block (no indent, gap between paragraphs).
    const row = el('div', { class: 'ms-hd-toggle' });
    row.appendChild(el('span', { class: 'ms-hd-toggle-label', text: 'Paragraph style' }));
    const seg = el('div', { class: 'seg ms-para-seg' });
    const indentBtn = el('button', { type: 'button', text: 'Indent' });
    const blockBtn = el('button', { type: 'button', text: 'Block' });
    const sync = () => {
      const isBlock = state.paraStyle === 'block';
      indentBtn.classList.toggle('active', !isBlock);
      blockBtn.classList.toggle('active', isBlock);
    };
    // Paragraph convention is a property of the book (it changes the printed
    // output), so it persists per-novel via scheduleSave — not per-device like
    // the writing font above.
    indentBtn.addEventListener('click', () => { state.paraStyle = 'indent'; scheduleSave(); applyParaStyle(); sync(); });
    blockBtn.addEventListener('click', () => { state.paraStyle = 'block'; scheduleSave(); applyParaStyle(); sync(); });
    sync();
    seg.appendChild(indentBtn);
    seg.appendChild(blockBtn);
    row.appendChild(seg);
    drawerInner.appendChild(row);
  } else {
    // Act headers/Section tags/Chords are all Song Plot-only concepts — a
    // novel has no intermission-split acts (Prose Plot's default is always
    // one-act) and no chord or section markup.
    drawerInner.appendChild(mkDrawerToggle('Act headers', 'showActHeaders', true));
    drawerInner.appendChild(mkDrawerToggle('Section tags', 'showSectionTags', false));
    drawerInner.appendChild(mkDrawerToggle('Chords', 'showChords', true));
  }
  drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));
  // Running header opens its slide-in sub-panel (built in buildHeaderDrawer).
  // Kept next to Revisions below — both are in-drawer panels, unlike Title
  // pages, which navigates away to a full-page editor and sits on its own.
  drawerInner.appendChild(built.headerRow.row);

  // ── Revisions (Final Draft-style) — summary row → slide-in sub-panel ──
  if (!state.readonly) {
    const rerenderMs = () => { if (msMode === 'layout') rebuildSheets(); else rebuildEdit(); };
    const revPane = built.mkSubpanel('Revisions');
    const revRow = built.mkSummaryRow('Revisions', () => {
      const cur = (state.revisions || []).find((r) => r.id === state.currentRev);
      return cur ? cur.name : 'Off';
    }, () => built.openSubpanel(revPane.panel));
    drawerInner.appendChild(revRow.row);
    const revSection = el('div', { class: 'ms-rev-section' });
    revPane.body.appendChild(revSection);
    const renderRevSection = () => {
      revRow.refresh();
      revSection.innerHTML = '';
      const cur = (state.revisions || []).find((r) => r.id === state.currentRev);
      if (cur) {
        const row = el('div', { class: 'ms-rev-current' });
        row.appendChild(el('span', { class: 'ms-rev-swatch', style: 'background:' + cur.hex }));
        row.appendChild(el('span', { class: 'ms-rev-name', text: cur.name + ' Revision' }));
        revSection.appendChild(row);
        revSection.appendChild(mkDrawerToggle('Show revision marks', 'showRevisions', true));
        const printRevBtn = el('button', { class: 'ms-rev-btn ms-rev-lockbtn', text: 'Print revised pages only' });
        printRevBtn.addEventListener('click', () => exportPDF(false, true));
        revSection.appendChild(printRevBtn);
      } else {
        revSection.appendChild(el('div', { class: 'ms-rev-none', text: 'Not tracking yet — start a revision to mark changes from here on.' }));
      }
      const startBtn = el('button', { class: 'ms-rev-btn', text: cur ? 'Start new revision' : 'Start tracking revisions' });
      startBtn.addEventListener('click', () => {
        // Baseline every card to identified lines (unstamped) so the next revision
        // only marks lines that actually change from here on, not whole cards on
        // their first edit (FD treats all existing lines as the baseline).
        state.cards.forEach((c) => {
          if (!Array.isArray(c.lines)) {
            const f = cardBodyField(c);
            if ((c[f] || '').trim()) c.lines = seamlessToLines(c[f], c.type === 'song');
          }
        });
        const color = REV_COLORS[(state.revisions || []).length % REV_COLORS.length];
        state.revisions = (state.revisions || []).concat([{ id: uid('r'), name: color.name, hex: color.hex, date: Date.now() }]);
        state.currentRev = state.revisions[state.revisions.length - 1].id;
        if (state.msOptions.showRevisions === undefined) { state.msOptions.showRevisions = true; saveMsOpts(); }
        doSave();
        renderRevSection();
        rerenderMs();
      });
      revSection.appendChild(startBtn);
      if ((state.revisions || []).length) {
        const list = el('div', { class: 'ms-rev-list' });
        state.revisions.forEach((r) => {
          const item = el('div', { class: 'ms-rev-item' + (r.id === state.currentRev ? ' active' : '') });
          item.appendChild(el('span', { class: 'ms-rev-swatch', style: 'background:' + r.hex }));
          item.appendChild(el('span', { text: r.name + (r.id === state.currentRev ? ' · current' : '') }));
          list.appendChild(item);
        });
        revSection.appendChild(list);
      }
      // Page locking — freeze boundaries so revisions spill onto A-pages.
      const locked = !!state.pageLock;
      if (locked) {
        const n = (state.pageLock.pages || []).length;
        revSection.appendChild(el('div', { class: 'ms-rev-locknote', text: '🔒 Pages locked (' + n + ') — new material flows to A-pages.' }));
      }
      const lockBtn = el('button', { class: 'ms-rev-btn ms-rev-lockbtn', text: locked ? 'Unlock pages' : 'Lock pages' });
      lockBtn.addEventListener('click', () => {
        if (locked) unlockPages();
        else lockPages();
        doSave();
        renderRevSection();
        rerenderMs();
      });
      revSection.appendChild(lockBtn);
    };
    renderRevSection();
  }

  // Title pages sits below its own divider, apart from the header/revisions
  // slide-in rows — it's document furniture you set up once, and it navigates
  // to a full-page editor (the diagonal arrow + subtitle signal that it leaves
  // the drawer rather than opening a panel in place).
  drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));
  drawerInner.appendChild(mkNavRow('Title pages', () => {
    drawer.classList.remove('open');
    settingsBtn.classList.remove('active');
    msMode = 'title';
    applyMode();
  }));

  // ── Book drawer (Prose Plot only) ──────────────────────────────────
  // Book-specific setup lives in its own drawer, opened by the same gear
  // while in Book view, rather than a "Book" section bolted onto the
  // Manuscript drawer — so a manuscript-mode writer never sees book matter,
  // and a book-mode writer never sees running-header/revision controls that
  // don't apply to the book render.
  let bookDrawer = null;
  if (state.format === 'prose') {
    bookDrawer = el('div', { class: 'ms-hd-drawer', id: 'ms-book-drawer' });
    const bkInner = el('div', { class: 'ms-hd-inner' });
    const bkTitleBar = el('div', { class: 'ms-hd-titlebar' });
    bkTitleBar.appendChild(el('span', { class: 'ms-hd-title', text: 'Book setup' }));
    const bkCloseBtn = el('button', { class: 'ms-hd-close xclose', text: '✕', title: 'Close' });
    bkCloseBtn.addEventListener('click', () => { bookDrawer.classList.remove('open'); settingsBtn.classList.remove('active'); });
    bkTitleBar.appendChild(bkCloseBtn);
    bkInner.appendChild(bkTitleBar);
    bkInner.appendChild(mkNavRow('Front and back matter', () => {
      bookDrawer.classList.remove('open');
      settingsBtn.classList.remove('active');
      msMode = 'book-matter';
      applyMode();
    }));
    bkInner.appendChild(el('div', { class: 'ms-hd-divider' }));

    // ── Theme picker ── four preset bundles + the individual knobs beneath, so
    // an author can start from a preset and diverge one setting at a time. Only
    // the Book render responds; Manuscript output is untouched.
    bkInner.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Theme' }));
    const themeHost = el('div', { class: 'bk-theme-host' });
    bkInner.appendChild(themeHost);
    const afterThemeChange = () => { scheduleSave(); if (msMode === 'book') rebuildBook(); renderThemePicker(); };
    function renderThemePicker() {
      themeHost.innerHTML = '';
      const theme = state.book.theme;
      const strip = el('div', { class: 'bk-theme-strip' });
      BOOK_THEME_PRESETS.forEach((p) => {
        const card = el('button', { class: 'bk-theme-card' + (theme.id === p.id ? ' sel' : ''), type: 'button' });
        card.appendChild(el('span', { class: 'bk-theme-name', text: p.name }));
        const sw = el('span', { class: 'bk-theme-swatch', text: 'Aa' });
        sw.style.fontFamily = bookFontFamily(p.font);
        card.appendChild(sw);
        card.addEventListener('click', () => { applyThemePreset(p.id); afterThemeChange(); });
        strip.appendChild(card);
      });
      themeHost.appendChild(strip);

      const mkSelect = (label, options, current, onChange) => {
        const field = el('label', { class: 'bk-knob' });
        field.appendChild(el('span', { class: 'bk-knob-label', text: label }));
        const sel = el('select');
        options.forEach(([val, txt]) => { const o = el('option', { value: val, text: txt }); if (val === current) o.selected = true; sel.appendChild(o); });
        sel.addEventListener('change', () => onChange(sel.value));
        field.appendChild(sel);
        return field;
      };
      const knobs = el('div', { class: 'bk-knobs' });
      knobs.appendChild(mkSelect('Font', [['ebgaramond', 'EB Garamond'], ['literata', 'Literata'], ['crimsonpro', 'Crimson Pro']], theme.font, (v) => { theme.font = v; theme.id = 'custom'; afterThemeChange(); }));
      knobs.appendChild(mkSelect('Chapter label', [['word', 'Chapter One'], ['numeral', 'Chapter 1'], ['roman', 'I  (roman)'], ['bare', '1  (number)'], ['custom', 'Custom…']], theme.chapterLabel, (v) => { theme.chapterLabel = v; theme.id = 'custom'; afterThemeChange(); }));
      knobs.appendChild(mkSelect('Chapter opener', [['plain', 'Plain'], ['dropcap', 'Drop cap'], ['raisedcap', 'Raised cap'], ['smallcaps', 'Small caps opening']], theme.opener, (v) => { theme.opener = v; theme.id = 'custom'; afterThemeChange(); }));
      // Opener size only bites when there's an opener flourish to scale.
      knobs.appendChild(mkSelect('Opener size', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']], theme.openerSize || 'medium', (v) => { theme.openerSize = v; theme.id = 'custom'; afterThemeChange(); }));
      // The scene-break knob is the ornament chooser — one control, all the glyphs
      // plus the two "no glyph" options (blank space / thin rule).
      knobs.appendChild(mkSelect('Scene break', [['asterisks', 'Asterisks   * * *'], ['fleuron', 'Fleuron   ❦'], ['ornament', 'Asterism   ⁂'], ['dot', 'Dot   ·'], ['rule', 'Thin rule'], ['space', 'Blank space']], theme.sceneBreak, (v) => { theme.sceneBreak = v; theme.id = 'custom'; afterThemeChange(); }));
      knobs.appendChild(mkSelect('Paragraphs', [['indent', 'Indented first line'], ['block', 'Block  (space between)']], theme.paraStyle || 'indent', (v) => { theme.paraStyle = v; theme.id = 'custom'; afterThemeChange(); }));
      knobs.appendChild(mkSelect('Line spacing', [['tight', 'Tight'], ['normal', 'Normal'], ['relaxed', 'Relaxed']], theme.lineSpacing || 'normal', (v) => { theme.lineSpacing = v; theme.id = 'custom'; afterThemeChange(); }));
      themeHost.appendChild(knobs);

      if (theme.chapterLabel === 'custom') {
        const cf = el('label', { class: 'bk-knob bk-knob-wide' });
        cf.appendChild(el('span', { class: 'bk-knob-label', text: 'Custom label  (# = chapter number)' }));
        const inp = el('input', { type: 'text', value: theme.chapterLabelCustom || '', placeholder: 'e.g. Part #' });
        inp.addEventListener('input', () => { theme.chapterLabelCustom = inp.value; scheduleSave(); if (msMode === 'book') rebuildBook(); });
        cf.appendChild(inp);
        themeHost.appendChild(cf);
      }

      const tgl = el('label', { class: 'bk-toggle' });
      const cb = el('input', { type: 'checkbox' });
      cb.checked = theme.showChapterTitle !== false;
      cb.addEventListener('change', () => { theme.showChapterTitle = cb.checked; afterThemeChange(); });
      tgl.appendChild(cb);
      tgl.appendChild(el('span', { text: 'Show chapter titles beneath the label' }));
      themeHost.appendChild(tgl);

      // ── Live preview ── a real chapter opener + scene break rendered through the
      // book path (renderBookToken), so every knob's effect shows without leaving
      // the drawer. Compact type + padding via .bk-preview; the theme classes ride
      // the sheet exactly as they do in the full Book render.
      themeHost.appendChild(el('div', { class: 'ms-hd-section-head bk-preview-head', text: 'Live preview' }));
      const pv = el('div', { class: 'bk-preview' });
      const pvSheet = el('div', { class: 'book-sheet ' + bookThemeClasses(theme) });
      pvSheet.style.setProperty('--book-font', bookFontFamily(theme.font));
      const pvContent = el('div', { class: 'book-sheet-content' });
      pvSheet.appendChild(pvContent);
      pv.appendChild(pvSheet);
      themeHost.appendChild(pv);
      const sample = [
        { type: 'book-chapter-title', text: 'The Harbor', num: 1 },
        { type: 'action', text: 'The morning fog had not yet lifted from the harbor when she first understood what the letter meant, and what it would cost her to answer it.', firstPara: true },
        { type: 'action', text: 'He had written only three lines, but she read them a dozen times before the kettle began to sing.' },
        { type: 'scenebreak' },
        { type: 'action', text: 'By noon the decision was made, though she would not admit it aloud for another week.' },
      ];
      sample.forEach((t) => renderBookToken(t, pvContent));
    }
    renderThemePicker();

    // ── Page (trim size) ── real book dimensions for the Book render + PDF.
    bkInner.appendChild(el('div', { class: 'ms-hd-divider' }));
    bkInner.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Page' }));
    const pageHost = el('div', { class: 'bk-theme-host' });
    const trimField = el('label', { class: 'bk-knob bk-knob-wide' });
    trimField.appendChild(el('span', { class: 'bk-knob-label', text: 'Trim size' }));
    const trimSel = el('select');
    Object.keys(BOOK_TRIM_SIZES).forEach((k) => {
      const o = el('option', { value: k, text: BOOK_TRIM_SIZES[k].label });
      if ((state.book.trim.size || '6x9') === k) o.selected = true;
      trimSel.appendChild(o);
    });
    trimSel.addEventListener('change', () => { state.book.trim.size = trimSel.value; scheduleSave(); if (msMode === 'book') rebuildBook(); });
    trimField.appendChild(trimSel);
    pageHost.appendChild(trimField);

    // Recto-start toggle (Phase 3b): pad with a blank so each chapter opens on
    // a right-hand page — the standard trade-book layout. Mirrored gutters,
    // running heads, and folios are always on; this is the one page-flow choice.
    const rectoTgl = el('label', { class: 'bk-toggle' });
    const rectoCb = el('input', { type: 'checkbox' });
    rectoCb.checked = state.book.trim.chapterStartRecto !== false;
    rectoCb.addEventListener('change', () => { state.book.trim.chapterStartRecto = rectoCb.checked; scheduleSave(); if (msMode === 'book') rebuildBook(); });
    rectoTgl.appendChild(rectoCb);
    rectoTgl.appendChild(el('span', { text: 'Start each chapter on a right-hand page' }));
    pageHost.appendChild(rectoTgl);

    bkInner.appendChild(pageHost);

    bookDrawer.appendChild(bkInner);
  }

  const applyZoom = () => {
    const vp = msWrap.querySelector('.ms-viewport');
    if (vp) vp.style.zoom = zoom;
    const ed = msWrap.querySelector('.ms-edit-doc');
    if (ed) ed.style.zoom = zoom;
    zoomLbl.textContent = Math.round(zoom * 100) + '%';
    zoomOut.disabled = zoom <= ZOOM_MIN;
    zoomIn.disabled  = zoom >= ZOOM_MAX;
    try { localStorage.setItem('md-ms-zoom', zoom); } catch (_) {}
  };
  zoomOut.addEventListener('click', () => { zoom = Math.max(ZOOM_MIN, +(zoom - ZOOM_STEP).toFixed(2)); applyZoom(); });
  zoomIn.addEventListener('click',  () => { zoom = Math.min(ZOOM_MAX, +(zoom + ZOOM_STEP).toFixed(2)); applyZoom(); });

  // ── Edit-mode outline navigator — shown/hidden via the ribbon's "Navigation" ──
  const isProse = state.format === 'prose';
  const msNav = el('div', { class: 'ms-nav' });
  const navHead = el('div', { class: 'ms-nav-head' }, [
    el('span', { class: 'ms-nav-title', text: 'Navigation' }),
  ]);
  const navList = el('div', { class: 'ms-nav-list' });
  msNav.appendChild(navHead);
  msNav.appendChild(navList);

  // Prose-only word-count footer, pinned to the bottom of the outline panel —
  // tracks whichever chapter the scroll position (see applyActive below) is
  // currently in, so it reads like a live "how's this chapter going" gauge
  // while writing, without cluttering the top toolbar.
  let navFootChapEl = null, navFootBookEl = null;
  if (isProse) {
    navFootChapEl = el('div', { class: 'v', text: '—' });
    navFootBookEl = el('div', { class: 'v', text: '—' });
    const navFoot = el('div', { class: 'ms-nav-foot' }, [
      el('div', { class: 'ms-nav-foot-stat' }, [el('div', { class: 'k', text: 'This chapter' }), navFootChapEl]),
      el('div', { class: 'ms-nav-foot-stat' }, [el('div', { class: 'k', text: 'Book total' }), navFootBookEl]),
    ]);
    msNav.appendChild(navFoot);
  }
  const updateNavFoot = (chapterId) => {
    if (!isProse) return;
    navFootBookEl.textContent = totalShowWords().toLocaleString();
    navFootChapEl.textContent = chapterId != null ? chapterWordCount(chapterId).toLocaleString() : '—';
  };

  let navOpen = (() => { try { return localStorage.getItem('md-ms-nav') !== 'closed'; } catch (_) { return true; } })();
  const applyNav = () => {
    const showNav = navOpen && msMode === 'edit';
    msNav.style.display = showNav ? '' : 'none';
    navBtn.classList.toggle('active', navOpen);
    navBtn.style.display = msMode === 'edit' ? '' : 'none'; // outline is Edit-only
  };
  navBtn.addEventListener('click', () => {
    navOpen = !navOpen;
    try { localStorage.setItem('md-ms-nav', navOpen ? 'open' : 'closed'); } catch (_) {}
    applyNav();
  });

  // ── Focus mode — Edit-only, never persisted (always a deliberate, one-session
  // choice, unlike zoom/nav which remember themselves). Hides the topbar, the
  // manuscript toolbar, and the outline via a body class (pure CSS), and dims
  // every card section except the one the caret is currently in.
  const exitPill = el('button', { class: 'ms-focus-exit-pill', title: 'Exit focus mode (Esc)', text: '✕ Exit focus' });
  msWrap.appendChild(exitPill);
  let focusMode = false;
  let pillTimer = null;
  const showExitPill = () => {
    if (!focusMode) return;
    exitPill.classList.add('show');
    clearTimeout(pillTimer);
    pillTimer = setTimeout(() => exitPill.classList.remove('show'), 1800);
  };
  const applyFocus = () => {
    document.body.classList.toggle('ms-focus', focusMode);
    focusBtn.classList.toggle('active', focusMode);
    focusBtn.style.display = msMode === 'edit' ? '' : 'none'; // like navBtn — Edit-only
    msFocusExit = focusMode ? exitFocus : null;
    if (focusMode) showExitPill();
  };
  function exitFocus() { focusMode = false; applyFocus(); }
  focusBtn.addEventListener('click', () => { focusMode = !focusMode; applyFocus(); });
  exitPill.addEventListener('click', exitFocus);
  msWrap.addEventListener('mousemove', showExitPill);
  // Track which card section currently has the caret so CSS can dim the rest —
  // works for every path into a card editor (click, keyboard nav, Tab) since
  // they all end in a real DOM focus on the contenteditable.
  msWrap.addEventListener('focusin', (e) => {
    if (!focusMode) return;
    const sec = e.target.closest && e.target.closest('.ms-card-section');
    if (!sec) return;
    msWrap.querySelectorAll('.ms-card-section.ms-card-focused').forEach((s) => { if (s !== sec) s.classList.remove('ms-card-focused'); });
    sec.classList.add('ms-card-focused');
  });
  // Typewriter scrolling — a blank page with a cursor keeps the cursor still and
  // moves the page instead. rAF-coalesced so a burst of keystrokes only scrolls
  // once per frame; 'auto' (not 'smooth') so it reads as the page moving under a
  // fixed cursor rather than a lagging animated scroll. Focus-only; independent
  // of the .ms-card-focused dimming tracked above.
  let twRaf = null;
  const typewriterScroll = () => {
    if (twRaf) return;
    twRaf = requestAnimationFrame(() => {
      twRaf = null;
      if (!focusMode) return;
      const active = document.activeElement;
      if (!active || !active.closest || !active.closest('.ms-line-editor')) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const body = msWrap.querySelector('.ms-body');
      if (!body) return;
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      let rect = range.getClientRects()[0];
      if (!rect) rect = range.startContainer && range.startContainer.nodeType === 1
        ? range.startContainer.getBoundingClientRect()
        : (range.startContainer && range.startContainer.parentElement && range.startContainer.parentElement.getBoundingClientRect());
      if (!rect) return;
      const bodyRect = body.getBoundingClientRect();
      const targetY = bodyRect.top + bodyRect.height * 0.45;
      const delta = rect.top - targetY;
      if (Math.abs(delta) < 2) return;
      body.scrollTo({ top: body.scrollTop + delta, behavior: 'auto' });
    });
  };
  msWrap.addEventListener('input', (e) => { if (e.target && e.target.closest && e.target.closest('.ms-line-editor')) typewriterScroll(); });
  msWrap.addEventListener('keyup', (e) => {
    if (!(e.target && e.target.closest && e.target.closest('.ms-line-editor'))) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
      || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab') typewriterScroll();
  });
  applyFocus();

  let navObserver = null;
  const navRows = new Map(); // card id -> row element
  refreshNav = () => {
    navList.innerHTML = '';
    navRows.clear();
    if (navObserver) { navObserver.disconnect(); navObserver = null; }
    const bodyEl = msWrap.querySelector('.ms-body');
    if (!bodyEl) return;
    const order = editOrder();
    // ── Quick-add: the gap between rows (and after the last row of an act)
    // reveals a thin "+" insertion line on hover; clicking it opens a tiny
    // inline type picker and inserts a card at exactly that spot. Nothing is
    // visible until hover — the zones are zero-height hit areas straddling
    // the gaps. target = { idx (into state.cards), where: 'before'|'after' }.
    let openPicker = null;
    const closePicker = () => {
      if (!openPicker) return;
      openPicker.zone.classList.remove('picking');
      openPicker.el.remove();
      document.removeEventListener('mousedown', openPicker.onDoc, true);
      openPicker = null;
    };
    const addInsertZone = (target) => {
      if (state.readonly) return;
      const zone = el('div', { class: 'ms-nav-ins' }, [
        el('div', { class: 'ms-nav-ins-line' }, [el('span', { class: 'ms-nav-ins-plus', text: '+' })]),
      ]);
      // Don't steal focus on mousedown: blurring an open card editor would
      // commit it and rebuild this very navigator mid-click, killing the
      // gesture. spawnCardAt commits open editors itself once a type is picked.
      zone.addEventListener('mousedown', (e) => e.preventDefault());
      zone.addEventListener('click', (e) => {
        e.stopPropagation();
        if (openPicker && openPicker.zone === zone) { closePicker(); return; }
        closePicker();
        const opt = (type, icon, label) => {
          const b = el('button', { class: 'ms-nav-ins-opt', type: 'button' }, [
            el('span', { class: 'ms-nav-ins-opt-icon', text: icon }),
            el('span', { text: label }),
          ]);
          b.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closePicker();
            spawnCardAt(type, target.idx, target.where);
          });
          return b;
        };
        const picker = el('div', { class: 'ms-nav-ins-picker' }, [
          opt('song', '♪', 'Song'),
          opt('beat', '◦', 'Beat'),
          opt('scene', '◆', state.format === 'prose' ? 'Chapter' : 'Scene'),
        ]);
        const onDoc = (ev) => { if (!zone.contains(ev.target)) closePicker(); };
        zone.classList.add('picking');
        zone.appendChild(picker);
        document.addEventListener('mousedown', onDoc, true);
        openPicker = { zone, el: picker, onDoc };
      });
      navList.appendChild(zone);
    };
    let curAct = null;
    let lastIdx = null; // last card idx appended — anchors the end-of-act zones
    order.forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      if (c.act !== curAct) {
        if (lastIdx != null) addInsertZone({ idx: lastIdx, where: 'after' }); // end of the previous act
        curAct = c.act;
        navList.appendChild(el('div', { class: 'ms-nav-act', text: LANE_LABELS[c.act] || c.act }));
      }
      addInsertZone({ idx, where: 'before' });
      lastIdx = idx;
      const icon = c.type === 'song' ? '♪' : c.type === 'scene' ? '◆' : '◦';
      const rowKids = [
        el('span', { class: 'ms-nav-icon', text: icon }),
        el('span', { class: 'ms-nav-label', text: c.title || 'Untitled' }),
      ];
      // Prose: show each chapter's running word count on its Navigator row, so
      // the outline reads as a weight map at a glance (the footer only covers
      // the chapter you're currently scrolled into).
      if (isProse && c.type === 'scene') {
        rowKids.push(el('span', { class: 'ms-nav-count', text: chapterWordCount(c.id).toLocaleString() }));
      }
      // Hover "×" delete — a span (not a button; this row is itself a button)
      // revealed on row hover, matching the quick-add "+" vocabulary. Its
      // mousedown is swallowed so it never commits/blurs an open editor.
      if (!state.readonly) {
        const del = el('span', { class: 'ms-nav-del', title: 'Delete card', text: '×' });
        del.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        del.addEventListener('click', (e) => { e.stopPropagation(); deleteCardFromNav(c.id); });
        rowKids.push(del);
      }
      const row = el('button', { class: 'ms-nav-row ms-nav-' + c.type }, rowKids);
      row.addEventListener('click', () => {
        const target = bodyEl.querySelector('.ms-card-divider[data-card-id="' + c.id + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      navList.appendChild(row);
      navRows.set(c.id, row);
      extractCardNotes(c).forEach((note) => {
        const nrow = el('button', { class: 'ms-nav-row ms-nav-note' }, [
          el('span', { class: 'ms-nav-icon ms-nav-note-icon', text: '✎' }),
          el('span', { class: 'ms-nav-label', text: note.text || note.phrase || '(empty note)' }),
        ]);
        nrow.addEventListener('click', () => {
          const cardTarget = bodyEl.querySelector('.ms-card-divider[data-card-id="' + c.id + '"]');
          if (cardTarget) cardTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const markEl = bodyEl.querySelector('mark.note-mark[data-note-id="' + note.id + '"]');
            if (!markEl) return;
            markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            flashEl(markEl);
            showReadOnlyNotePopover(markEl);
          }, 260);
        });
        navList.appendChild(nrow);
      });
    });
    if (lastIdx != null) addInsertZone({ idx: lastIdx, where: 'after' }); // end of the final act
    // Highlight the card whose content currently fills the top of the
    // viewport — not just the instant its divider passes by. Track which
    // dividers have scrolled above a trigger line near the top of the body;
    // the active row is the *last* one passed, so it stays lit through the
    // whole card until the next divider crosses the same line.
    const TRIGGER_FRAC = 0.15; // 15% down from the top of the scroll container
    const passed = new Map(); // card id -> has its divider scrolled above the trigger line
    const applyActive = () => {
      let activeId = null, chapterId = null, activeChapterId = null;
      for (const idx of order) {
        const c = state.cards[idx];
        if (!c) continue;
        if (c.type === 'scene') chapterId = c.id; // the nearest preceding chapter header
        if (passed.get(c.id)) { activeId = c.id; activeChapterId = chapterId; }
      }
      navRows.forEach((r, id) => r.classList.toggle('active', id === activeId));
      if (isProse) updateNavFoot(activeChapterId);
    };
    navObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const id = e.target.getAttribute('data-card-id');
        const triggerY = e.rootBounds ? e.rootBounds.top + e.rootBounds.height * TRIGGER_FRAC : 0;
        passed.set(id, e.boundingClientRect.top < triggerY);
      });
      applyActive();
    }, { root: bodyEl, rootMargin: `0px 0px -${Math.round((1 - TRIGGER_FRAC) * 100)}% 0px`, threshold: 0 });
    const rootRect = bodyEl.getBoundingClientRect();
    bodyEl.querySelectorAll('.ms-card-divider[data-card-id]').forEach((d) => {
      // Seed the initial state synchronously — the observer only reports
      // future crossings, so without this the right row won't light up
      // until the next scroll (e.g. right after opening the manuscript).
      const rect = d.getBoundingClientRect();
      passed.set(d.getAttribute('data-card-id'), rect.top < rootRect.top + rootRect.height * TRIGGER_FRAC);
      navObserver.observe(d);
    });
    applyActive();
  };

  msWrap.appendChild(msNav);
  msWrap.appendChild(drawer);
  if (bookDrawer) msWrap.appendChild(bookDrawer);
  settingsBtn.addEventListener('click', () => {
    // Book view gets its own drawer; every other mode gets the manuscript one.
    const active = (msMode === 'book' && bookDrawer) ? bookDrawer : drawer;
    const inactive = active === drawer ? bookDrawer : drawer;
    if (inactive) { inactive.classList.remove('open'); }
    // Always reopen at the drawer root, never a sub-panel left open earlier.
    built.closeSubpanels();
    active.classList.toggle('open');
    settingsBtn.classList.toggle('active', active.classList.contains('open'));
  });

  body.appendChild(msWrap);
  applyMode();
  applyZoom();
}

function openManuscript(sceneId) { navigateTo('manuscript', sceneId); }

function insertAtCursor(ta, text) {
  const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
  const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
  ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
  ta.selectionStart = ta.selectionEnd = s + text.length;
  ta.focus();
}
// The three updaters below run together on every editor keystroke; callers
// precompute tokens/letters once and pass them in (each falls back to parsing
// itself so one-off calls stay simple).
// Instant hover tip for amber gutter counts. A native title needs a second of
// motionless hover and is silently dropped by the browser half the time, which
// made the warning feel broken; this one appears on mouseenter. Singleton —
// at most one tip exists, and it dies on mouseleave, scroll, or gutter rebuild.
let _gutterTip = null;
function hideGutterTip() { if (_gutterTip) { _gutterTip.remove(); _gutterTip = null; } }
function showGutterTip(anchor, text) {
  hideGutterTip();
  const tip = el('div', { class: 'gtip', text });
  document.body.appendChild(tip);
  const r = anchor.getBoundingClientRect();
  tip.style.left = (r.right + 10) + 'px';
  tip.style.top = Math.max(8, r.top + r.height / 2 - tip.offsetHeight / 2) + 'px';
  _gutterTip = tip;
}
function updateGutter(c, gutter, tokens, letters) {
  gutter.innerHTML = '';
  hideGutterTip(); // its anchor row just got rebuilt out from under it
  if (!gutter._tipWired) { gutter.addEventListener('scroll', hideGutterTip); gutter._tipWired = true; }
  tokens = tokens || parseLyricLines(c.lyrics || '', c.type === 'song');
  letters = letters || rhymeLetters(tokens);
  const marks = verseMismatches(tokens);
  tokens.forEach((tok, i) => {
    if (tok.type === 'cue' || tok.type === 'section') {
      gutter.appendChild(el('div', { class: 'lwg-row lwg-section' }));
      return;
    }
    const sung = tok.type === 'sung';
    const want = sung ? marks.get(i) : undefined;
    const syl = el('span', { class: 'g-syl' + (want != null ? ' g-syl-warn' : ''), text: sung ? LYRIC.lineSyll(tok.text) : '' });
    if (want != null) {
      const tip = `vs ${want} in the matching line of the earlier verse`;
      syl.addEventListener('mouseenter', () => showGutterTip(syl, tip));
      syl.addEventListener('mouseleave', hideGutterTip);
    }
    gutter.appendChild(el('div', { class: 'lwg-row' }, [
      el('span', { class: 'g-letter', text: sung ? letters[i] : '' }),
      syl,
    ]));
  });
}
// The lyric-window header stat line — for prose only, a live word count (songs
// dropped the sung-lines/syllables/scheme readout; the gutter carries per-line
// detail). Word count is the metric a novelist actually watches.
function updateProseSummary(text, node, target) {
  const n = countWords(text || '');
  const base = n === 1 ? '1 word' : `${n.toLocaleString()} words`;
  node.textContent = target ? `${base} / ${target.toLocaleString()}` : base;
}
function renderRhymeChips(words, container, editor, refresh) {
  words.forEach((w) => {
    const chip = el('span', { class: 'rchip click', text: w, title: 'Click to insert' });
    chip.addEventListener('click', () => { insertAtCursor(editor, w); if (refresh) refresh(); });
    container.appendChild(chip);
  });
}

function renderRhymesInsertable(word, container, editor, refresh) {
  container.innerHTML = '';
  word = (word || '').toLowerCase().replace(/[^a-z']/g, '');
  if (!word) { container.appendChild(el('span', { class: 'rhint', text: 'Type a word to find perfect rhymes.' })); return; }
  if (!LYRIC.ready()) { container.appendChild(el('span', { class: 'rhint', text: 'loading dictionary…' })); return; }
  if (!LYRIC.inDict(word)) { container.appendChild(el('span', { class: 'rhint', text: '"' + word + '" isn\'t in the dictionary' })); return; }
  const r = LYRIC.suggest(word);
  if (!r.perfect.length) { container.appendChild(el('span', { class: 'rhint', text: 'no perfect rhymes for "' + word + '"' })); return; }
  renderRhymeChips(r.perfect, container, editor, refresh);
}

function renderNearRhymes(word, container, editor, refresh) {
  container.innerHTML = '';
  word = (word || '').toLowerCase().replace(/[^a-z']/g, '');
  if (!word) { container.appendChild(el('span', { class: 'rhint', text: 'Type a word to find near rhymes.' })); return; }
  if (!LYRIC.ready()) { container.appendChild(el('span', { class: 'rhint', text: 'loading dictionary…' })); return; }
  if (!LYRIC.inDict(word)) { container.appendChild(el('span', { class: 'rhint', text: '"' + word + '" isn\'t in the dictionary' })); return; }
  const r = LYRIC.nearSuggest(word);
  if (!r.near.length) { container.appendChild(el('span', { class: 'rhint', text: 'no near rhymes for "' + word + '"' })); return; }
  renderRhymeChips(r.near, container, editor, refresh);
}

// Prose Plot's equivalent of the rhyme lookup — synonyms for the word under
// the cursor, from a packed word->synonym list (see thesaurus.js).
function renderSynonymsInsertable(word, container, editor, refresh) {
  container.innerHTML = '';
  word = (word || '').toLowerCase().replace(/[^a-z']/g, '');
  if (!word) { container.appendChild(el('span', { class: 'rhint', text: 'Type a word to find synonyms.' })); return; }
  if (!THES.ready()) { container.appendChild(el('span', { class: 'rhint', text: 'loading thesaurus…' })); return; }
  // Try the word, then its base forms (chairs -> chair, went -> go) so an
  // inflected selection still finds synonyms. DEFS supplies the stemmer; if the
  // dictionary hasn't loaded yet it just falls back to the literal word.
  const forms = (typeof DEFS !== 'undefined' && DEFS.ready()) ? DEFS.baseForms(word) : [word];
  let list = [];
  for (const f of forms) { list = THES.lookup(f); if (list.length) break; }
  if (!list.length) { container.appendChild(el('span', { class: 'rhint', text: 'no synonyms for "' + word + '"' })); return; }
  renderRhymeChips(list, container, editor, refresh);
}

// Definitions for the word under the cursor (see defs.js). Unlike rhymes and
// synonyms these aren't insertable — they're read-only sense lines, so no
// chips and no editor/refresh plumbing.
function renderDefinitions(word, container) {
  container.innerHTML = '';
  word = (word || '').toLowerCase().replace(/[^a-z'-]/g, '');
  if (!word) { container.appendChild(el('span', { class: 'rhint', text: 'Type or select a word to define it.' })); return; }
  if (!DEFS.ready()) { container.appendChild(el('span', { class: 'rhint', text: 'loading dictionary…' })); return; }
  const senses = DEFS.lookup(word);
  if (!senses.length) { container.appendChild(el('span', { class: 'rhint', text: 'no definition for "' + word + '"' })); return; }
  senses.forEach((s) => {
    container.appendChild(el('div', { class: 'defsense' }, [
      el('span', { class: 'defpos', text: s.label }),
      el('span', { class: 'defgloss', text: s.gloss }),
    ]));
  });
}
// The card's metadata fields as a collapsible panel inside the editor sidebar —
// the former right-side detail drawer, folded in. onChange syncs the editor header.
function buildDetailsPanel(c, onChange) {
  const wrap = el('div', { class: 'lwdetails' });
  const caret = el('span', { class: 'lwdetails-caret', text: '▾' });
  const head = el('button', { class: 'lwdetails-head', type: 'button' }, [caret, el('span', { text: 'Details' })]);
  const body = el('div', { class: 'lwdetails-body' });
  let open = true;
  head.addEventListener('click', () => { open = !open; body.style.display = open ? '' : 'none'; caret.textContent = open ? '▾' : '▸'; });
  wrap.appendChild(head);
  wrap.appendChild(body);

  const commit = () => { scheduleSave(); if (onChange) onChange(); };
  const isProse = state.format === 'prose';

  body.appendChild(field('Title', textInput('title', c.title, (v) => { c.title = v; commit(); })));

  // Act is set by dragging the card between lanes; Status and Scene change are now
  // card-face controls (click the dot / change chip). Details keeps the slow basics.
  if (c.type === 'song') {
    const fnOpts = Object.entries(FN).map(([k, v]) => [k, v.label]);
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Function', selectInput(fnOpts, c.fn, (v) => { c.fn = v; commit(); })),
      field('Duration (min)', numInput(c.min, (v) => { c.min = v; commit(); })),
    ]));
    body.appendChild(field('Voicing / who sings', textInput('voicing', c.voicing, (v) => { c.voicing = v; commit(); })));
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Key', textInput('key', c.key, (v) => { c.key = v; }), 'blank = needs score'),
      field('Style', textInput('style', c.style, (v) => { c.style = v; })),
    ]));
    body.appendChild(field('', checkInput(c.diegetic, (v) => { c.diegetic = v; }, 'Diegetic — performed in-world (not inner-life)')));
    const sing = el('div', { class: 'sing' + (!(c.purpose && c.purpose.trim()) ? ' empty' : '') }, [
      el('span', { class: 'fl', text: 'Why does this sing?' }),
      textareaInput(c.purpose, (v) => { c.purpose = v; sing.classList.toggle('empty', !v.trim()); }, 'What does this number do that speech can\'t? What is different when it ends?'),
    ]);
    body.appendChild(sing);
  } else if (c.type === 'scene') {
    // Scene metadata lives in its title + board position; nothing else to tune here.
  } else { // beat — the editor body is its script; the note is its one-line logline
    // Prose has no runtime to track, but chasing a word target per beat is the
    // equivalent thing writers want to see progress against.
    body.appendChild(isProse
      ? field('Word target', numInput(c.wordTarget, (v) => { c.wordTarget = v; commit(); }))
      : field('Duration (min)', numInput(c.min, (v) => { c.min = v; commit(); })));
    body.appendChild(field('Beatline / what happens', textareaInput(c.note, (v) => { setCardBody(c, 'note', v); commit(); }, 'The book scene — what happens here?')));
  }

  const del = el('button', { class: 'lwdelete', text: 'Delete card' });
  del.addEventListener('click', () => {
    if (!confirm('Delete this card?')) return;
    const i = state.cards.indexOf(c); if (i >= 0) state.cards.splice(i, 1);
    closeLyricWindow();
  });
  body.appendChild(del);
  return wrap;
}

// ---- Song Sheet (lyric window read-only render) ---------------------------
// A single-card slice of the same tokenizer + static renderer the Manuscript
// Print View uses (cardBodyTokens / renderPageToken / paginateTokens) — no
// second lyric-formatting codepath, just a different token list assembled
// from one card instead of the whole show.
function buildSheetTokens(c) {
  const toks = [];
  if (c.type === 'song') {
    // 'ms-title' is the same token type buildContentTokens uses for the show
    // title page — same underlined heading look, just for one song.
    toks.push({ type: 'ms-title', text: (c.title || 'Untitled').toUpperCase() });
    toks.push({ type: 'blank' });
    if (c.lyrics && c.lyrics.trim()) {
      cardBodyTokens(c).forEach((t) => {
        if (t.type === 'section' && t.subtype === 'section' && sheetOpts.showSectionTags === false) return;
        toks.push(t);
      });
    } else {
      toks.push({ type: 'action', text: '(no lyrics yet)' });
    }
  } else if (c.type === 'beat') {
    // Beat sheet = title + the Beatline/outline note — the outline reference,
    // not a script dump (matches how the Beatline reads in Manuscript).
    toks.push({ type: 'scene-header', text: c.title || 'Beat' });
    toks.push({ type: 'blank' });
    if (c.note && c.note.trim()) toks.push({ type: 'note', text: c.note });
    else toks.push({ type: 'action', text: '(no beatline yet)' });
  }
  // Stanza-level chord lane: if any line of a contiguous sung run carries a
  // chord, every line in the run reserves the label lane (tok.lane →
  // .lw-chord-lane in renderPageToken), so the stanza sits on one even grid
  // instead of alternating double/single spacing per line — the classic
  // chord-chart look. Flagged on the tokens, not post-render, so
  // paginateTokens measures exactly what the printed sheet gets. Safe to
  // mutate: cardBodyTokens builds fresh token objects per call. Manuscript's
  // buildContentTokens never sets .lane, so its output is untouched.
  const chordRe = new RegExp(CHORD_RE.source); // fresh — CHORD_RE is /g (stateful lastIndex)
  let run = [];
  const flushRun = () => {
    if (run.some((t) => chordRe.test(t.text || ''))) run.forEach((t) => { t.lane = true; });
    run = [];
  };
  toks.forEach((t) => { if (t.type === 'sung') run.push(t); else flushRun(); });
  flushRun();
  return toks;
}

// Builds the paper-styled DOM for one card's Sheet — reused by both the
// lyric window's on-screen Sheet pane and its Print button.
function renderSheetContent(c, host) {
  host.innerHTML = '';
  host.classList.toggle('lw-sheet-hide-chords', sheetOpts.showChords === false);
  buildSheetTokens(c).forEach((t) => renderPageToken(t, host));
}

// Print just this one card. Same pattern as exportPDF: build a fresh
// #pdf-print-root off-screen, print, clean up on afterprint. Paginated via
// the shared paginateTokens/buildBlocks (lock: null — a single-card print has
// no relationship to the show's frozen page numbers) so a long song still
// spans multiple sheets instead of clipping against the fixed-height print page.
function printSheetCard(c) {
  const prev = document.getElementById('pdf-print-root');
  if (prev) prev.remove();
  const root = el('div', { id: 'pdf-print-root' });
  root.style.setProperty('--sheet-font', sheetFontFamily(sheetOpts.font || 'courierprime'));
  const pages = paginateTokens(buildSheetTokens(c), null);
  pages.forEach((pageToks) => {
    const sheet = el('div', { class: 'ms-sheet' });
    const content = el('div', { class: 'ms-sheet-content' });
    content.classList.toggle('lw-sheet-hide-chords', sheetOpts.showChords === false);
    pageToks.forEach((t) => renderPageToken(t, content));
    sheet.appendChild(content);
    root.appendChild(sheet);
  });
  document.body.appendChild(root);
  const cleanup = () => { root.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
}

// One-card Sheet → PDF, through the same transcription engine as the
// Manuscript export (createPdf + pdfTranscribeSheet). Builds the identical
// paginated ms-sheets printSheetCard does, but offscreen-visible (so they
// get real geometry) and transcribed to a downloaded file instead of routed
// through the system print dialog. Chords are materialized into real spans
// first — the transcriber's text walker can't see ::after labels.
async function exportSheetPDF(c) {
  const old = document.getElementById('pdf-print-root'); if (old) old.remove();
  const root = el('div', { id: 'pdf-print-root' });
  // Same forced-visible + ligatures-off treatment as exportManuscriptPDF (see
  // the comment there: Courier Prime's fi/fl ligatures shrink a word below
  // base-14 Courier's width, which would swallow the following space).
  root.style.cssText = 'display:block; position:absolute; left:-99999px; top:0; width:816px;'
    + ' font-variant-ligatures:none; font-feature-settings:"liga" 0, "clig" 0, "dlig" 0, "hlig" 0;';
  root.style.setProperty('--sheet-font', sheetFontFamily(sheetOpts.font || 'courierprime'));
  const pages = paginateTokens(buildSheetTokens(c), null);
  pages.forEach((pageToks) => {
    const sheet = el('div', { class: 'ms-sheet' });
    const content = el('div', { class: 'ms-sheet-content' });
    content.classList.toggle('lw-sheet-hide-chords', sheetOpts.showChords === false);
    pageToks.forEach((t) => renderPageToken(t, content));
    sheet.appendChild(content);
    root.appendChild(sheet);
  });
  document.body.appendChild(root);
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* fonts already loaded */ } }
  pdfMaterializeChords(root);

  const pdf = createPdf({
    title: c.title || 'Untitled',
    author: (state.titlePage && state.titlePage.authors) || '',
    subject: (c.type === 'song' ? 'Song sheet — ' : 'Beat sheet — ') + (state.title || 'Untitled'),
    creator: 'Song Plot', producer: 'Song Plot',
    date: pdfDateString(new Date()),
  });
  // Proportional book fonts (Crimson/Literata) must be embedded so the PDF draws
  // the same metrics we measured on screen; the mono/Helvetica fonts stay on the
  // base-14 path (pdfTranscribeSheet falls back automatically when fonts is null).
  const sheetFont = sheetOpts.font || 'courierprime';
  let embedFonts = null;
  if (PDF_BOOK_FONT_FILES[sheetFont]) {
    try { embedFonts = await pdfLoadBookFonts(sheetFont); } catch (e) { embedFonts = null; }
  }
  root.querySelectorAll('.ms-sheet').forEach((sheet) => pdfTranscribeSheet(pdf, sheet, embedFonts, sheetFont));

  const blob = await pdf.toBlob();
  root.remove();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = pdfFilename(c.title, 'pdf');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Sheet mode's pane: toolbar (Chords / Section tags / Print) + the paper itself.
// Rebuilt fresh each time the lyric window switches into Sheet mode, so it
// always reflects the card's latest saved text.
function buildSheetPane(c) {
  const wrap = el('div', { class: 'lw-sheet-pane' });
  const bar = el('div', { class: 'lw-sheet-bar' });

  const mkOpt = (label, key) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = sheetOpts[key] !== false;
    const lbl = el('label', { class: 'lw-sheet-opt' }, [cb, el('span', { text: label })]);
    cb.addEventListener('change', () => { sheetOpts[key] = cb.checked; saveSheetOpts(); renderSheetContent(c, content); });
    return lbl;
  };
  bar.appendChild(mkOpt('Chords', 'showChords'));
  bar.appendChild(mkOpt('Section tags', 'showSectionTags'));

  // Reading font for this sheet (screen + Print + PDF). Manuscript stays Courier.
  const fontSel = el('select', { class: 'ms-font-sel lw-sheet-font', title: 'Reading font for this song sheet (the Manuscript always stays Courier)' });
  Object.entries(SHEET_FONT_LABELS).forEach(([val, label]) => fontSel.appendChild(el('option', { value: val, text: label })));
  fontSel.value = sheetOpts.font || 'courierprime';
  fontSel.addEventListener('change', () => {
    sheetOpts.font = fontSel.value; saveSheetOpts();
    wrap.style.setProperty('--sheet-font', sheetFontFamily(sheetOpts.font));
  });
  bar.appendChild(fontSel);

  bar.appendChild(el('span', { style: 'flex:1' }));
  // PDF beside Print — the sheet is the one deliberate per-object exception to
  // the unified Export drawer (it exports this card, so it stays with the card).
  // Both wear the drawer's own glyphs (download-into-tray / printer) and the
  // ribbon's bare-button language, so they read as that room's siblings.
  const SHEET_GLYPH_DOWNLOAD = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><polyline points="8 11 12 15 16 11"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
  const SHEET_GLYPH_PRINT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
  const pdfBtn = el('button', { class: 'lw-sheet-act lw-sheet-pdf', type: 'button', title: 'Download this song as a PDF' });
  const pdfLbl = el('span', { text: 'PDF' });
  pdfBtn.innerHTML = SHEET_GLYPH_DOWNLOAD;
  pdfBtn.appendChild(pdfLbl);
  pdfBtn.addEventListener('click', async () => {
    pdfBtn.disabled = true; pdfLbl.textContent = 'Building…';
    try { await exportSheetPDF(c); }
    catch (e) { alert('PDF failed: ' + ((e && e.message) || e)); }
    finally { pdfBtn.disabled = false; pdfLbl.textContent = 'PDF'; }
  });
  bar.appendChild(pdfBtn);
  const printBtn = el('button', { class: 'lw-sheet-act lw-sheet-print', type: 'button', title: 'Print this song' });
  printBtn.innerHTML = SHEET_GLYPH_PRINT;
  printBtn.appendChild(el('span', { text: 'Print' }));
  printBtn.addEventListener('click', () => printSheetCard(c));
  bar.appendChild(printBtn);

  const scroll = el('div', { class: 'lw-sheet-scroll' });
  const paper = el('div', { class: 'ms-sheet' });
  const content = el('div', { class: 'ms-sheet-content' });
  paper.appendChild(content);
  scroll.appendChild(paper);

  renderSheetContent(c, content);

  wrap.style.setProperty('--sheet-font', sheetFontFamily(sheetOpts.font || 'courierprime'));
  wrap.appendChild(bar);
  wrap.appendChild(scroll);
  return wrap;
}

function buildLyricWindow(c) {
  const win = el('div', { class: 'lyricwin' });
  const summary = el('span', { class: 'lwsummary' });
  const closeBtn = el('button', { class: 'dclose xclose', text: '✕', title: 'Close (Esc)' });
  closeBtn.addEventListener('click', closeLyricWindow);

  // Push into Manuscript: the travel gesture that unifies the two rooms — finish
  // a draft here, then read it in the flow of the show around it. Reuses
  // goToMatch (Find & Replace's jump helper), which already navigates + scrolls
  // + pulses the card's section. Always lands in Edit mode: this is an editing
  // continuation, so a stale Print View mode from a prior session would be wrong.
  const pushBtn = el('button', { class: 'lwpush', text: 'Manuscript →', title: 'Continue in Manuscript' });
  pushBtn.addEventListener('click', () => {
    const id = c.id;
    closeLyricWindow();
    try { localStorage.setItem('md-ms-mode', 'edit'); } catch (_) {}
    goToMatch({ kind: 'card', id });
  });

  const pillEl = c.type === 'song'
    ? (() => { const meta = FN[c.fn] || FN.ballad; return el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label }); })()
    : el('span', { class: 'pill beat-pill', text: (c.beatFn || '').trim() || 'Beat' });

  const lwtitleEl = el('span', { class: 'lwtitle', text: c.title || 'Untitled' });
  const head = el('div', { class: 'lwhead' }, [
    pillEl,
    lwtitleEl,
    summary,
    el('span', { style: 'flex:1' }),
    pushBtn,
    closeBtn,
  ]);

  // The editor is the single workspace for a card. Songs/beats edit the lyric/script
  // body; scenes edit their prose note (no syllable gutter or rhyme tools — "plain").
  const bodyField = c.type === 'scene' ? 'note' : 'lyrics';
  const plain = c.type === 'scene';
  const isProse = state.format === 'prose';
  // Prose Plot has no rhyme/syllable/song-section concept at all — hide that
  // tooling for beats too (not just scenes), and swap in a word count + a
  // scene-break shortcut instead. The Rich tab already picks up Prose Plot's
  // Body/Scene-break element set automatically (buildRichEditor reads
  // state.format itself), so it stays available for beats.
  const richTools = !plain && !isProse;
  // The header stat line is only the live word count for prose; songs/beats no
  // longer show sung-lines/syllables/scheme up here (the gutter has the per-line
  // detail). Drop the node entirely for non-prose so it leaves no stray gap.
  if (!isProse) summary.remove();

  // Edit | Sheet segmented toggle — song/beat cards in Song Plot only (the
  // same richTools gate: no rhyme/section tooling in Prose Plot, no Sheet
  // either — a chapter/scene has no song-sheet analogue). Styled like the
  // Manuscript mode segment (.ms-mode-seg). Mode lives in state.lyricWinMode
  // so it carries across prev/next navigation but resets on app reload.
  let editModeBtn, sheetModeBtn;
  if (richTools) {
    editModeBtn = el('button', { type: 'button', text: 'Edit' });
    sheetModeBtn = el('button', { type: 'button', text: 'Sheet' });
    const modeSeg = el('div', { class: 'ms-mode-seg lw-mode-seg' }, [editModeBtn, sheetModeBtn]);
    head.insertBefore(modeSeg, pushBtn);
  }

  // Keep the editor header in sync when a basic is changed in the Details panel.
  const syncHead = () => {
    lwtitleEl.textContent = c.title || 'Untitled';
    if (c.type === 'song') { const m = FN[c.fn] || FN.ballad; pillEl.textContent = m.label; pillEl.setAttribute('data-fam', m.fam); }
    else if (c.type === 'beat') { pillEl.textContent = (c.beatFn || '').trim() || 'Beat'; }
  };

  // ---- editor ----
  const gutter = el('div', { class: 'lwgutter' });
  const editorPlaceholder = isProse
    ? (c.type === 'scene'
        ? 'Write the chapter here…\n\nJust write — paragraphs flow one after another.\n*italic* / **bold** — inline emphasis\n***  — a scene break (on its own line)'
        : 'Write the scene here…\n\nJust write — paragraphs flow one after another.\n*italic* / **bold** — inline emphasis\n***  — a scene break (on its own line)\nCHARACTER — a CAPS line still works for dialogue cues, if you want them')
    : c.type === 'beat'
    ? 'Write the scene here…\n\nCHARACTER — a CAPS line is who speaks\nDialogue — plain text below the name\n(Parenthetical) — tone / action mid-line\nAction — plain line outside a character\n!Line — force action inside dialogue\nCHARACTER (sings) — mark a sung outburst\n[Scene] — section heading\n/song Title — start a new song card (Manuscript)'
    : 'Write here…\n\nCHARACTER — a CAPS line is who sings\nLyrics — just type below the name (rhyme-tracked)\nCHARACTER (spoken) — mark a spoken aside\n(Parenthetical) — inline note\n[Chorus] — section chip (resets rhyme)\n[Scene 1: Title] — scene heading\n[#01 Title] — song number header\n/song Title — start a new song card (Manuscript)';
  const editor = el('textarea', { class: 'lweditor', wrap: (plain || isProse) ? 'soft' : 'off', spellcheck: 'true', placeholder: (plain && !isProse) ? 'Write the scene here — the book prose for this moment.' : editorPlaceholder });
  editor.value = c[bodyField] || '';

  // ---- sidebar ----
  const side = el('div', { class: 'lwside' });
  const rin = el('input', { class: 'fi', type: 'text', placeholder: 'word to rhyme' });
  const res = el('div', { class: 'rhymeresults' });

  // Section headers ([Verse], [Chorus], …) used to have a row of insert chips
  // here. They're typed directly now — bracket-completed as you write — so the
  // chips were redundant chrome and the space goes to the Dictionary instead.
  let showRhymes = () => {};
  let showLookup = () => {};
  const rhymeTabWrap = el('div', { class: 'rhyme-tab-wrap' });
  const lookupTabWrap = el('div', { class: 'rhyme-tab-wrap' });
  const lres = el('div', { class: 'rhymeresults' });
  if (richTools) {
    // Rhyme tabs
    let rhymeMode = 'perfect';
    const tabPerfect = el('button', { class: 'rhyme-tab active', text: 'Perfect' });
    const tabNear    = el('button', { class: 'rhyme-tab', text: 'Near' });
    rhymeTabWrap.appendChild(tabPerfect);
    rhymeTabWrap.appendChild(tabNear);

    showRhymes = (word) => {
      if (rhymeMode === 'perfect') renderRhymesInsertable(word, res, editor, refresh);
      else renderNearRhymes(word, res, editor, refresh);
    };

    tabPerfect.addEventListener('click', () => {
      rhymeMode = 'perfect';
      tabPerfect.classList.add('active'); tabNear.classList.remove('active');
      showRhymes(rin.value);
    });
    tabNear.addEventListener('click', () => {
      rhymeMode = 'near';
      tabNear.classList.add('active'); tabPerfect.classList.remove('active');
      showRhymes(rin.value);
    });

    // Dictionary tabs — Definition (read-only sense lines) | Synonyms
    // (insertable chips, same as Prose Plot's thesaurus). Driven by the same
    // word as the rhyme panel, so selecting a word fills both at once.
    let lookupMode = 'define';
    const tabDefine = el('button', { class: 'rhyme-tab active', text: 'Definition' });
    const tabSyn    = el('button', { class: 'rhyme-tab', text: 'Synonyms' });
    lookupTabWrap.appendChild(tabDefine);
    lookupTabWrap.appendChild(tabSyn);

    showLookup = (word) => {
      if (lookupMode === 'define') renderDefinitions(word, lres);
      else renderSynonymsInsertable(word, lres, editor, refresh);
    };

    tabDefine.addEventListener('click', () => {
      lookupMode = 'define';
      tabDefine.classList.add('active'); tabSyn.classList.remove('active');
      showLookup(rin.value);
    });
    tabSyn.addEventListener('click', () => {
      lookupMode = 'syn';
      tabSyn.classList.add('active'); tabDefine.classList.remove('active');
      showLookup(rin.value);
    });
  }

  // Group the lyric-writing tools into accented zones so each function reads
  // distinctly: Sections (sage, matches loglines) and Rhymes (rose). None of
  // this applies in Prose Plot — no rhyme scheme, no song sections — so it's
  // gated on richTools (musical beats only) instead of just `!plain`.
  if (richTools) {
    side.appendChild(el('div', { class: 'lwzone lwzone-rhymes' }, [
      el('span', { class: 'fl', text: 'Rhymes' }),
      rhymeTabWrap, rin, res,
    ]));
    // Same word as the rhyme panel above — select a word in the lyric and its
    // rhymes and its meaning land side by side.
    side.appendChild(el('div', { class: 'lwzone lwzone-lookup' }, [
      el('span', { class: 'fl', text: 'Dictionary' }),
      lookupTabWrap, lres,
    ]));
    ensureThesaurusLoaded();
    ensureDefsLoaded();
  }
  // Prose Plot's equivalent of the Sections zone — a single Scene break
  // insert, since that's the only structural marker prose writing needs here.
  const tin = el('input', { class: 'fi', type: 'text', placeholder: 'word to look up' });
  const tres = el('div', { class: 'rhymeresults' });
  if (isProse) {
    const breakBtn = el('span', { class: 'rchip click', text: '⁂ Scene break', title: 'Insert a scene break' });
    breakBtn.addEventListener('click', () => {
      const s = editor.selectionStart != null ? editor.selectionStart : editor.value.length;
      const before = editor.value.slice(0, s), after = editor.value.slice(s);
      const pre = before.length && !before.endsWith('\n') ? '\n\n' : '';
      const post = after.length && !after.startsWith('\n') ? '\n\n' : '';
      insertAtCursor(editor, pre + '***' + post);
      refresh();
    });
    side.appendChild(el('div', { class: 'lwzone lwzone-sections' }, [
      el('span', { class: 'fl', text: 'Structure' }),
      el('div', { class: 'lwsection-btns' }, [breakBtn]),
    ]));
    side.appendChild(el('div', { class: 'lwzone lwzone-rhymes' }, [
      el('span', { class: 'fl', text: 'Thesaurus' }),
      tin, tres,
    ]));
    ensureThesaurusLoaded();
  }
  const showSynonyms = (word) => renderSynonymsInsertable(word, tres, editor, refresh);
  tin.addEventListener('input', () => { tin._touched = true; showSynonyms(tin.value); });

  // The card's metadata — formerly the right-side detail drawer — now lives here so
  // one window covers everything: write the content, tune the basics, all in place.
  side.appendChild(buildDetailsPanel(c, syncHead));

  // ---- panes ----
  // The 2-column layout (no gutter) has its own grid — .lwbody-plain — so it
  // must be applied whenever the gutter is omitted, not just for scenes: a
  // Prose Plot beat also skips the gutter (no syllable/rhyme column) but was
  // falling through to the 3-column grid (58px | 1fr | 264px) with only 2
  // children, which squeezed the editor into the narrow 58px gutter track.
  const noGutter = plain || isProse;

  // ---- chord-dimming backdrop (guttered song/beat editor only) ----
  // The lyric editor is a plain textarea, so a typed [C] chord sits inline as
  // literal bracket text and breaks up the lyric line while drafting. A mirror
  // div behind a transparent-text textarea repaints just the chord tokens in
  // --muted so they recede — the text and caret are untouched (nothing is
  // parsed or rewritten; the backdrop only re-colours). Only where chords live
  // (richTools === !noGutter), so scenes/prose keep the bare textarea.
  let editorHost = editor;
  let syncMarks = () => {};
  let syncMarksScroll = () => {};
  if (richTools) {
    const marks = el('div', { class: 'lweditor-marks', 'aria-hidden': 'true' });
    const backdrop = el('div', { class: 'lweditor-backdrop', 'aria-hidden': 'true' }, [marks]);
    editorHost = el('div', { class: 'lweditor-wrap' }, [backdrop, editor]);
    editor.classList.add('lweditor-lit'); // transparent text, visible caret — the backdrop shows the words
    const chordRe = new RegExp(CHORD_RE.source, 'g'); // own instance: CHORD_RE is stateful (/g lastIndex)
    const litHtml = (val) => escHtml(val).replace(chordRe, (m) => '<span class="lwchord-dim">' + m + '</span>');
    syncMarksScroll = () => { marks.style.transform = 'translate(' + (-editor.scrollLeft) + 'px, ' + (-editor.scrollTop) + 'px)'; };
    // Trailing newline keeps the mirror's height in step with the textarea's own
    // phantom final line, so the last row never drifts out of caret alignment.
    syncMarks = () => { marks.innerHTML = litHtml(editor.value) + '\n'; syncMarksScroll(); };
    syncMarks();
  }

  const editPane = el('div', { class: 'lwbody' + (noGutter ? ' lwbody-plain' : '') }, noGutter ? [editor, side] : [gutter, editorHost, side]);

  // The rhyme/dictionary panels follow an EXPLICIT selection only — double-click
  // a word, or drag across a phrase (its last word wins). A bare caret does not
  // steer them: following the caret meant the whole right-hand column churned on
  // every keystroke and cursor move, which is distracting while you're writing.
  // With nothing selected the panels simply hold whatever they last showed.
  let lastRhymeWord = null;
  const editorRhymeWord = () => {
    const val = editor.value;
    const s = editor.selectionStart == null ? val.length : editor.selectionStart;
    const e = editor.selectionEnd == null ? s : editor.selectionEnd;
    if (e <= s) return ''; // collapsed caret: leave the panels alone
    return LYRIC.lastWord(val.slice(s, e));
  };
  const updateRhymeFollow = () => {
    if (!richTools) return;
    const w = editorRhymeWord();
    if (!w || w === lastRhymeWord) return; // no selection, or the same word — hold
    lastRhymeWord = w;
    rin.value = w;
    showRhymes(w);
    showLookup(w); // Rhymes and Dictionary track the same word
  };

  const refreshTools = () => {
    if (richTools) {
      // One parse + one rhyme pass shared by the gutter and rhyme panel.
      const tokens = parseLyricLines(c.lyrics || '', c.type === 'song');
      const letters = rhymeLetters(tokens);
      updateGutter(c, gutter, tokens, letters); // includes the amber verse-length marks
      updateRhymeFollow();
      syncMarks(); // repaint the chord-dim backdrop (also catches section/rhyme inserts)
    } else if (isProse) {
      updateProseSummary(editor.value, summary, c.wordTarget);
      if (!tin._touched) { tin.value = LYRIC.lastWord(lastNonEmptyLine(editor.value)); showSynonyms(tin.value); }
    }
  };

  const refresh = () => {
    setCardBody(c, bodyField, editor.value); // keep the lines identity sidecar aligned
    refreshTools();
    scheduleSave();
  };

  editor.addEventListener('input', refresh);
  // Two-way scroll lock: the editor drives the gutter, and wheel-scrolling the
  // gutter itself drives the editor right back — otherwise the rhyme letters
  // drift off their lines. No loop: assigning an unchanged scrollTop fires no
  // scroll event, so the ping-pong settles immediately.
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; syncMarksScroll(); });
  gutter.addEventListener('scroll', () => { editor.scrollTop = gutter.scrollTop; });
  // Selections (double-click, shift-arrow, drag) steer the rhyme panel without
  // touching the text, so they must NOT go through refresh (which saves) — just
  // the lightweight follow. (It ignores collapsed carets, so plain typing and
  // cursor moves cost one no-op call.)
  ['keyup', 'mouseup', 'select'].forEach((ev) => editor.addEventListener(ev, () => updateRhymeFollow()));
  rin.addEventListener('input', () => { lastRhymeWord = rin.value; showRhymes(rin.value); showLookup(rin.value); });

  // Sheet mode swaps editPane out for a read-only render of just this card —
  // built fresh each time (so it always reflects the latest saved text), while
  // editPane itself is a single long-lived instance whose listeners/scroll
  // position survive being detached and reattached.
  const startSheet = richTools && state.lyricWinMode === 'sheet';
  let activePane = startSheet ? buildSheetPane(c) : editPane;
  const setLyricWinMode = (mode) => {
    state.lyricWinMode = mode;
    const nextPane = (mode === 'sheet' && richTools) ? buildSheetPane(c) : editPane;
    if (nextPane !== activePane) { win.replaceChild(nextPane, activePane); activePane = nextPane; }
    if (richTools) {
      editModeBtn.classList.toggle('active', mode !== 'sheet');
      sheetModeBtn.classList.toggle('active', mode === 'sheet');
    }
    if (mode !== 'sheet') setTimeout(() => editor.focus(), 0);
  };
  if (richTools) {
    editModeBtn.addEventListener('click', () => setLyricWinMode('edit'));
    sheetModeBtn.addEventListener('click', () => setLyricWinMode('sheet'));
    editModeBtn.classList.toggle('active', !startSheet);
    sheetModeBtn.classList.toggle('active', startSheet);
  }

  win.appendChild(head);
  win.appendChild(activePane);

  if (richTools) {
    const tokens = parseLyricLines(c.lyrics || '', c.type === 'song');
    const letters = rhymeLetters(tokens);
    updateGutter(c, gutter, tokens, letters);
    // Seed with the last line's rhyme word; from then on only an explicit
    // selection (or typing in the box) changes what the panels show.
    rin.value = LYRIC.lastWord(lastNonEmptyLine(c[bodyField] || ''));
    lastRhymeWord = rin.value;
    renderRhymesInsertable(rin.value, res, editor, refresh);
    showLookup(rin.value);
  } else if (isProse) {
    updateProseSummary(c[bodyField] || '', summary, c.wordTarget);
    tin.value = LYRIC.lastWord(lastNonEmptyLine(c[bodyField] || ''));
    renderSynonymsInsertable(tin.value, tres, editor, refresh);
  }
  if (!startSheet) setTimeout(() => editor.focus(), 0);
  return win;
}
// Walk the show from the Workshop without bouncing back to the Board — bare
// chevrons that live in the dimmed overlay margin, outside the window itself,
// so the window's own chrome stays untouched. Faint at rest, full-strength on
// hover; the dead side at either end of the show is simply absent, not
// disabled. All card types (song/beat/scene) in document order.
function buildLyricWindowNav(id) {
  const order = displayOrder().map((i) => state.cards[i]);
  const idx = order.findIndex((c) => c.id === id);
  const frag = document.createDocumentFragment();
  if (idx > 0) {
    const prevBtn = el('button', { class: 'lwnav lwnav-prev', title: 'Previous card', 'aria-label': 'Previous card', text: '‹' });
    prevBtn.addEventListener('click', () => openLyricWindow(order[idx - 1].id));
    frag.appendChild(prevBtn);
  }
  if (idx >= 0 && idx < order.length - 1) {
    const nextBtn = el('button', { class: 'lwnav lwnav-next', title: 'Next card', 'aria-label': 'Next card', text: '›' });
    nextBtn.addEventListener('click', () => openLyricWindow(order[idx + 1].id));
    frag.appendChild(nextBtn);
  }
  return frag;
}
function openLyricWindow(id) {
  state.lyricWinId = id;
  const host = document.getElementById('lyricwin');
  host.innerHTML = '';
  host.appendChild(buildLyricWindow(cardById(id)));
  host.appendChild(buildLyricWindowNav(id));
  host.style.display = '';
}
function closeLyricWindow() {
  // Flush any pending edit before tearing down.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  state.lyricWinId = null;
  const host = document.getElementById('lyricwin');
  host.style.display = 'none';
  host.innerHTML = '';
  render();
}
function refreshLyricWindow() { if (state.lyricWinId) openLyricWindow(state.lyricWinId); }

// ---- stats ----
// Rolls the baseline forward to today's start-of-day total the first time
// buildStats runs on a new day, so "Today" always reads as words written
// since then — a lightweight stand-in for a full sprint/session timer.
function todayLocalStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayWordDelta() {
  const today = todayLocalStr();
  const words = totalShowWords();
  if (state.wordCountBaselineDate !== today) {
    state.wordCountBaselineDate = today;
    state.wordCountBaseline = words;
    scheduleSave();
  }
  return words - state.wordCountBaseline;
}
function buildStats() {
  const wrap = document.getElementById('stats');
  wrap.innerHTML = '';
  const stat = (k, v) => el('div', { class: 'stat' }, [el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v })]);
  if (state.format === 'prose') {
    // Runtime/minutes don't mean anything for a novel — chapters replace
    // songs, the pre/post split counts chapters instead of minutes either
    // side of the midpoint, and the words stat becomes a target/progress
    // readout (click to set the target) instead of a bare count.
    const chapters = state.cards.filter((c) => c.type === 'scene').length;
    const beats = state.cards.filter((c) => c.type === 'beat').length;
    wrap.appendChild(stat('Chapters', chapters));
    wrap.appendChild(stat('Beats', beats));
    const words = totalShowWords();
    const target = state.wordTarget || 0;
    const wordsStat = stat('Words', target ? `${words.toLocaleString()} / ${target.toLocaleString()}` : words.toLocaleString());
    if (!state.readonly) {
      wordsStat.classList.add('stat-editable');
      wordsStat.title = 'Click to set a word target';
      wordsStat.addEventListener('click', () => {
        const raw = prompt('Word target for this novel:', target || 75000);
        if (raw == null) return;
        const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
        state.wordTarget = Number.isFinite(n) ? n : 0;
        scheduleSave();
        buildStats();
      });
    }
    wrap.appendChild(wordsStat);
    const delta = todayWordDelta();
    wrap.appendChild(stat('Today', (delta >= 0 ? '+' : '') + delta.toLocaleString()));
    return;
  }
  const songs = state.cards.filter((c) => c.type === 'song').length;
  const beats = state.cards.length - songs;
  const total = state.cards.reduce((s, c) => s + (c.min || 0), 0);
  wrap.appendChild(stat('Songs', songs));
  wrap.appendChild(stat('Beats', beats));
  wrap.appendChild(stat('Runtime', '~' + Math.round(total) + 'm'));
  wrap.appendChild(stat('Words', totalShowWords().toLocaleString()));
  const delta = todayWordDelta();
  wrap.appendChild(stat('Today', (delta >= 0 ? '+' : '') + delta.toLocaleString()));
}

// ---- render ----
function syncControls() {
  const songsBtn = document.querySelector('#view-seg button[data-view="songs"]');
  if (songsBtn) songsBtn.textContent = state.format === 'prose' ? 'Chapters only' : 'Songs only';
  document.querySelectorAll('#view-seg button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
}
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  // Reference shows announce what they teach — turns a song list into a study object.
  const refShow = state.readonly && state.showKey && (SHOWS[state.showKey] || NOVELS[state.showKey]);
  if (refShow && refShow.teaches) {
    const banner = el('div', { class: 'ref-teach' });
    banner.appendChild(el('span', { class: 'ref-teach-tag', text: 'Reference' }));
    banner.appendChild(el('span', { class: 'ref-teach-text', text: 'Studying ' + refShow.title + (refShow.year ? ' (' + refShow.year + ')' : '') + ' — ' + refShow.teaches }));
    board.appendChild(banner);
  }
  board.appendChild(buildBoard());

  buildStats();
  syncControls();
  renderShowBtn();
  updateWaffleLabel();
  applyAppTheme();
  scheduleSave();
}

// ---- controls ----
function initControls() {
  document.querySelectorAll('#view-seg button').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; render(); }));

  // Inline notes: clicking a highlighted note phrase outside an active editor
  // (static manuscript render, print view) shows a read-only popover. Clicks
  // while that card IS being edited are handled inside buildRichEditor instead.
  document.addEventListener('click', (e) => {
    const mark = e.target.closest && e.target.closest('mark.note-mark');
    if (!mark || mark.closest('.ms-line-editor')) return;
    e.stopPropagation();
    showReadOnlyNotePopover(mark);
  });
  document.getElementById('lyricwin').addEventListener('click', (e) => { if (e.target.id === 'lyricwin') closeLyricWindow(); });
  document.querySelectorAll('.tn-tab[data-page]').forEach((b) => {
    b.addEventListener('click', () => { if (!b.classList.contains('sb-disabled')) navigateTo(b.dataset.page); });
  });

  // show switcher popover
  document.getElementById('sb-show-btn').addEventListener('click', (e) => { e.stopPropagation(); showShowPopover(); });
  document.getElementById('tn-waffle-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleWaffleMenu(); });
  document.getElementById('sb-snapshots').addEventListener('click', (e) => { e.stopPropagation(); openSnapshotsDrawer(); });
  const exBtn = document.getElementById('sb-export');
  if (exBtn) exBtn.addEventListener('click', (e) => { e.stopPropagation(); openExportDrawer(null); }); // topnav = no view context, nothing seeded

  // Find & Replace modal
  document.getElementById('sb-find').addEventListener('click', (e) => { e.stopPropagation(); openFindModal(); });
  document.getElementById('find-cancel').addEventListener('click', closeFindModal);
  document.getElementById('find-replace').addEventListener('click', doReplaceAll);
  document.getElementById('find-modal').addEventListener('click', (e) => { if (e.target.id === 'find-modal') closeFindModal(); });
  document.querySelectorAll('#find-mode-seg button').forEach((b) => {
    b.addEventListener('click', () => setFindMode(b.dataset.mode));
  });
  document.getElementById('find-prev').addEventListener('click', () => stepFindMatch(-1));
  document.getElementById('find-next').addEventListener('click', () => stepFindMatch(1));
  ['find-case', 'find-whole'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => { _findIdx = -1; updateFindStatus(); });
  });
  document.getElementById('find-q').addEventListener('input', () => { _findIdx = -1; updateFindStatus(); });
  document.getElementById('find-q').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (findMode === 'find') stepFindMatch(e.shiftKey ? -1 : 1);
    else doReplaceAll();
  });
  document.getElementById('find-r').addEventListener('keydown', (e) => { if (e.key === 'Enter') doReplaceAll(); });

  // show settings modal
  document.getElementById('ssm-cancel').addEventListener('click', closeShowSettingsModal);
  document.getElementById('ssm-save').addEventListener('click', saveShowSettings);
  document.getElementById('ssm-title').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveShowSettings(); });
  document.querySelectorAll('#ssm-mode-seg button').forEach((b) => {
    b.addEventListener('click', () => { document.querySelectorAll('#ssm-mode-seg button').forEach((x) => x.classList.toggle('active', x === b)); });
  });
  document.querySelectorAll('#ssm-status-seg button').forEach((b) => {
    b.addEventListener('click', () => { document.querySelectorAll('#ssm-status-seg button').forEach((x) => x.classList.toggle('active', x === b)); });
  });
  document.getElementById('ssm-share').addEventListener('click', () => { if (state.projectId) { closeShowSettingsModal(); openShareModal(state.projectId); } });
  document.getElementById('show-settings-modal').addEventListener('click', (e) => { if (e.target.id === 'show-settings-modal') closeShowSettingsModal(); });

  // Library page controls
  document.getElementById('lib-new').addEventListener('click', () => openNewShowModal());
  document.getElementById('lib-show-archived').addEventListener('change', () => buildLibraryPage());

  // Folder picker modal
  document.getElementById('folder-cancel').addEventListener('click', closeFolderModal);
  document.getElementById('folder-create').addEventListener('click', createFolderAndMove);
  document.getElementById('folder-new').addEventListener('keydown', (e) => { if (e.key === 'Enter') createFolderAndMove(); });
  document.getElementById('folder-modal').addEventListener('click', (e) => { if (e.target.id === 'folder-modal') closeFolderModal(); });

  // Share modal
  document.getElementById('share-cancel').addEventListener('click', closeShareModal);
  document.getElementById('share-save').addEventListener('click', saveSharing);
  document.getElementById('share-modal').addEventListener('click', (e) => { if (e.target.id === 'share-modal') closeShareModal(); });

  // new show modal
  document.querySelectorAll('#nsm-mode-seg button').forEach((b) => {
    b.addEventListener('click', () => { _nsmMode = b.dataset.mode; document.querySelectorAll('#nsm-mode-seg button').forEach((x) => x.classList.toggle('active', x === b)); });
  });
  document.getElementById('nsm-cancel').addEventListener('click', closeNewShowModal);
  document.getElementById('nsm-create').addEventListener('click', () => {
    const title = document.getElementById('nsm-title').value.trim() || 'Untitled show';
    closeNewShowModal();
    createProject(title, _nsmMode);
  });
  document.getElementById('nsm-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const title = document.getElementById('nsm-title').value.trim() || 'Untitled show'; closeNewShowModal(); createProject(title, _nsmMode); }
  });
  document.getElementById('new-show-modal').addEventListener('click', (e) => { if (e.target.id === 'new-show-modal') closeNewShowModal(); });

  const sbToggle = document.getElementById('sb-toggle');
  if (sbToggle) sbToggle.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    document.body.classList.toggle('sb-open', state.sidebarOpen);
    try { localStorage.setItem('md-sidebar', state.sidebarOpen ? 'open' : 'closed'); } catch (_) {}
  });
  const dmBtn = document.getElementById('sb-darkmode');
  if (dmBtn) {
    const applyDark = (dark) => {
      document.body.classList.toggle('dark', dark);
      dmBtn.querySelector('.sb-dm-icon').textContent = dark ? '☾' : '☀';
      dmBtn.querySelector('.sb-label').textContent = dark ? 'Dark mode' : 'Light mode';
    };
    let dark = (() => { try { const v = localStorage.getItem('md-dark'); return v === null ? true : v === '1'; } catch (_) { return true; } })();
    applyDark(dark);
    dmBtn.addEventListener('click', () => { dark = !dark; applyDark(dark); try { localStorage.setItem('md-dark', dark ? '1' : '0'); } catch (_) {} });
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'f' || e.key === 'F') && !state.readonly) {
      e.preventDefault();
      openFindModal();
      return;
    }
    if (e.key === 'Escape') {
      if (msFocusExit) { msFocusExit(); return; }
      const exd = document.getElementById('exp-drawer');
      if (exd) { closeExportDrawer(); return; }
      const fnd = document.getElementById('find-modal');
      if (fnd && fnd.style.display !== 'none') { closeFindModal(); return; }
      const fm = document.getElementById('folder-modal');
      if (fm && fm.style.display !== 'none') { closeFolderModal(); return; }
      const shm = document.getElementById('share-modal');
      if (shm && shm.style.display !== 'none') { closeShareModal(); return; }
      closeCardMenu();
      closeWaffleMenu();
      const ssm = document.getElementById('show-settings-modal');
      if (ssm && ssm.style.display !== 'none') { closeShowSettingsModal(); return; }
      const modal = document.getElementById('new-show-modal');
      if (modal && modal.style.display !== 'none') { closeNewShowModal(); return; }
      if (state.lyricWinId) closeLyricWindow();
    }
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('lib-card-menu');
    if (menu && !menu.contains(e.target)) closeCardMenu();
    const pop = document.getElementById('show-popover');
    if (pop && !pop.contains(e.target) && !document.getElementById('sb-show-btn').contains(e.target)) {
      closeShowPopover();
    }
    const wm = document.getElementById('waffle-menu');
    if (wm && !wm.contains(e.target) && !document.getElementById('tn-waffle-btn').contains(e.target)) {
      closeWaffleMenu();
    }
    const mp = document.getElementById('mini-pop');
    if (mp && !mp.contains(e.target)) closeMiniPopover();
    if (state.openAct !== null) { state.openAct = null; render(); }
  });
}

initControls();
// Identify the signed-in user (server gates the page, so this should succeed).
fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((u) => {
  state.me = u || null;
  const nameEl = document.getElementById('sb-username');
  if (nameEl && u && u.name) nameEl.textContent = u.name;
}).catch(() => {});
fetch('/api/users').then((r) => (r.ok ? r.json() : [])).then((list) => { state.users = list || []; }).catch(() => {});
document.body.classList.toggle('sb-open', state.sidebarOpen);
navigateTo('board');
loadProjects().then(() => {
  // Never auto-open a show belonging to the other app — on the split
  // subdomains especially, that would silently pull you from Prose Plot's
  // Library into a Song Plot show (or vice versa).
  const ownApp = (p) => (p.format || 'song') === state.currentApp;
  try {
    const last = JSON.parse(localStorage.getItem('md-last') || 'null');
    if (last && last.type === 'project') {
      const exists = state.projects.find((p) => p.id === last.val && ownApp(p));
      if (exists) { openProject(last.val); return; }
    }
  } catch (_) {}
  // No restorable last project — open the most recently edited one for this
  // app, and only fall back to a reference example if there are none.
  const ownProjects = state.projects.filter(ownApp);
  if (ownProjects.length) {
    const recent = ownProjects.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    openProject(recent.id);
    return;
  }
  if (state.currentApp === 'prose') { buildLibraryPage(); navigateTo('library'); return; }
  openReference('fiddler');
});

// Load the pronouncing dictionary; refresh an open song editor once ready.
fetch('cmudict.txt').then((r) => r.text()).then((t) => {
  LYRIC.load(t);
  if (state.lyricWinId) refreshLyricWindow();
}).catch(() => {});

// The thesaurus (9MB) is only relevant to Prose Plot, so unlike cmudict it's
// fetched on demand the first time a Prose Plot lyric window opens rather
// than unconditionally at boot.
let _thesLoading = false;
function ensureThesaurusLoaded() {
  if (THES.ready() || _thesLoading) return;
  _thesLoading = true;
  fetch('thesaurus.txt').then((r) => r.text()).then((t) => {
    THES.load(t);
    if (state.lyricWinId) refreshLyricWindow();
  }).catch(() => { _thesLoading = false; });
}

// Definitions (7MB) are likewise fetched on demand the first time a lyric
// window opens rather than at boot, so the app still starts on a cold cache.
let _defsLoading = false;
function ensureDefsLoaded() {
  if (DEFS.ready() || _defsLoading) return;
  _defsLoading = true;
  fetch('defs.txt').then((r) => r.text()).then((t) => {
    DEFS.load(t);
    if (state.lyricWinId) refreshLyricWindow();
  }).catch(() => { _defsLoading = false; });
}
