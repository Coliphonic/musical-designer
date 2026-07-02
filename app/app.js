// Phase 2 board. 3-act spine (Act 1 / 2A / 2B / 3) with intermission|midpoint marker.
// Click a card to open the detail drawer and edit every field, incl. "why does this sing?".
// Drag sideways to reorder or into another lane to change act. + per lane adds a song/beat.

const CCOL = 92, CH = 132, PAD_T = 14, PAD_B = 14;
const SVGNS = 'http://www.w3.org/2000/svg';
let _uid = 0;
const uid = () => 'c' + (++_uid);

const LANES = [
  { key: '1', label: 'Act 1' },
  { key: '2A', label: 'Act 2A' },
  { key: '2B', label: 'Act 2B' },
  { key: '3', label: 'Act 3' },
];
const LANE_KEYS = LANES.map((l) => l.key);
const PRE_INT = ['1', '2A'];
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

const state = {
  showKey: 'fiddler',
  title: '',
  projectId: null,
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
  storyDna: dnaDefaults(),
  titlePage: { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } },
  scriptHeader: { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false },
  msOptions: (() => { try { return JSON.parse(localStorage.getItem('md-ms-opts') || '{}'); } catch (_) { return {}; } })(),
  dragFrom: null,
  openAct: null,
  lyricWinId: null,
};

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
  if (o.type === 'beat') return { id: uid(), type: 'beat', act, title: o.title, note: o.note || '', min: o.min || 1.5 };
  if (o.type === 'scene') return { id: uid(), type: 'scene', act, title: o.title };
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
// read). Songs write lyrics; scenes write note; a beat may carry both a board
// synopsis (note) and written lines (lyrics) — lyrics wins when present. This is
// also the field the structured `card.lines` identity sidecar mirrors.
function cardBodyField(c) {
  if ((c.lyrics || '').trim()) return 'lyrics';
  if ((c.note || '').trim()) return 'note';
  return c.type === 'scene' ? 'note' : 'lyrics';
}

function saveLastOpened(type, val) {
  try { localStorage.setItem('md-last', JSON.stringify({ type, val })); } catch (_) {}
}

function openReference(key) {
  // References are read-only examples — don't let them overwrite the last
  // opened *project*, so reopening the app returns to the user's own work.
  state.loading = true;
  state.showKey = key;
  const show = SHOWS[key];
  if (show.cards) state.cards = show.cards.map(cardFromObj);
  else { const lanes = assignLanes(show.numbers); state.cards = show.numbers.map((t, i) => { const c = cardFromTuple(t); c.act = lanes[i]; return c; }); }
  // Enriched references may carry a character registry and a title page (no lyrics).
  // Plain references have neither — fall back to empty so stale project data never leaks in.
  state.revisions = []; state.currentRev = null; state.pageLock = null; // references aren't revised
  state.characters = show.characters ? JSON.parse(JSON.stringify(show.characters)) : {};
  state.storyDna = migrateDna(show.storyDna);
  const tpDefaults = { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } };
  state.titlePage = Object.assign({}, tpDefaults, show.titlePage || {});
  state.titlePage.include = Object.assign({}, tpDefaults.include, (show.titlePage || {}).include || {});
  state.scriptHeader = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
  state.title = show.title;
  state.projectId = null;
  state.readonly = true;
  state.folder = '';
  state.mode = show.form === 'one-act-90' ? 'oneact' : 'full';
  state.loading = false;
  render();
  setSaveInd('ref');
}

// Load a show payload (from the server, or a restored snapshot) into state.
// Does not touch projectId/showKey/readonly or render — the caller owns those.
function applyShowData(d) {
  state.cards = (d.cards || []).map(cardFromStored);
  state.revisions = d.revisions || [];
  state.currentRev = d.currentRev || null;
  state.pageLock = d.pageLock || null;
  state.characters = d.characters || {};
  state.storyDna = migrateDna(d.storyDna);
  const tpDefaults = { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } };
  state.titlePage = Object.assign({}, tpDefaults, d.titlePage || {});
  state.titlePage.include = Object.assign({}, tpDefaults.include, (d.titlePage || {}).include || {});
  const shDefaults = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
  state.scriptHeader = Object.assign({}, shDefaults, d.scriptHeader || {});
  state.title = d.title || 'Untitled show';
  state.mode = d.mode || 'full';
  state.status = d.status || 'active';
  state.folder = d.folder || '';
}

function openProject(id, afterOpen) {
  saveLastOpened('project', id);
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    state.loading = true;
    applyShowData(d);
    state.projectId = id;
    state.showKey = null;
    state.readonly = false;
    state.loading = false;
    render();
    setSaveInd('saved');
    if (afterOpen) afterOpen();
  }).catch(() => setSaveInd('error'));
}

function serialize() {
  return JSON.stringify({
    title: state.title, mode: state.mode, status: state.status || 'active', folder: state.folder || '', updated: Date.now(),
    cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }),
    revisions: state.revisions,
    currentRev: state.currentRev,
    pageLock: state.pageLock,
    characters: state.characters,
    storyDna: state.storyDna,
    titlePage: state.titlePage,
    scriptHeader: state.scriptHeader,
  });
}
let _saveTimer = null;
function scheduleSave() {
  if (state.readonly || !state.projectId || state.loading) return;
  setSaveInd('saving');
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(doSave, 700);
}
function doSave() {
  if (!state.projectId) return;
  fetch('/api/shows/' + state.projectId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: serialize() })
    .then(() => { setSaveInd('saved'); loadProjects(); }).catch(() => setSaveInd('error'));
}
function loadProjects() {
  return fetch('/api/shows').then((r) => r.json()).then((list) => { state.projects = list || []; renderShowBtn(); if (state.page === 'library') buildLibraryPage(); }).catch(() => {});
}
function newProject() { openNewShowModal(); }
function duplicateProject() {
  const body = JSON.stringify({ title: state.title + ' (copy)', mode: state.mode, updated: Date.now(), cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }) });
  fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).then((r) => r.json()).then((d) => loadProjects().then(() => openProject(d.id)));
}
function renameProject() {
  if (state.readonly || !state.projectId) return;
  const t = prompt('Rename show:', state.title);
  if (t == null) return;
  state.title = t.trim() || 'Untitled show';
  doSave(); render();
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
  const archChk = document.getElementById('lib-show-archived');
  const showArchived = archChk && archChk.checked;
  host.innerHTML = '';
  let items = (state.projects || []).slice();
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

  // Reference shows — read-only examples, always in their own folder.
  const refKeys = Object.keys(SHOWS);
  if (refKeys.length) host.appendChild(libSection('Reference', refKeys.map((k) => () => libRefCard(k))));
}

function libRefCard(key) {
  const r = SHOWS[key];
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
  meta.appendChild(el('span', { class: 'lib-fmt', text: p.mode === 'oneact' ? 'One-act' : 'Full length' }));
  meta.appendChild(el('span', { class: 'lib-dot', text: '·' }));
  meta.appendChild(el('span', { class: 'lib-updated', text: relTime(p.updated) }));
  card.appendChild(meta);

  const tags = el('div', { class: 'lib-card-tags' });
  const status = p.status || 'active';
  tags.appendChild(el('span', { class: 'lib-badge lib-status-' + status, text: status.charAt(0).toUpperCase() + status.slice(1) }));
  if (p.shared) tags.appendChild(el('span', { class: 'lib-badge lib-shared', text: 'Shared by ' + userName(p.owner) }));
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

function duplicateShowById(id) {
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    const body = JSON.stringify({ title: (d.title || 'Untitled') + ' (copy)', mode: d.mode, status: 'draft', updated: Date.now(), cards: d.cards || [], characters: d.characters || {}, titlePage: d.titlePage, scriptHeader: d.scriptHeader });
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
    list.appendChild(el('div', { class: 'share-empty', text: 'No other accounts yet. Create one on the server with: node users.js add <name> <password>' }));
  } else {
    others.forEach((u) => {
      const row = el('label', { class: 'share-row' });
      const cb = el('input'); cb.type = 'checkbox'; cb.value = u.id; cb.checked = collab.indexOf(u.id) >= 0;
      row.appendChild(cb);
      row.appendChild(el('span', { class: 'share-name', text: u.name }));
      list.appendChild(row);
    });
  }
  document.getElementById('share-modal').style.display = '';
}
function closeShareModal() { document.getElementById('share-modal').style.display = 'none'; _shareId = null; }
function saveSharing() {
  if (!_shareId) { closeShareModal(); return; }
  const ids = Array.from(document.querySelectorAll('#share-list input:checked')).map((c) => c.value);
  const id = _shareId;
  fetch('/api/shows/' + id + '/share', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborators: ids }) })
    .then((r) => r.json()).then(() => { closeShareModal(); loadProjects().then(() => { if (state.page === 'library') buildLibraryPage(); }); })
    .catch(() => { closeShareModal(); });
}

function setSaveInd(s) {
  const e = document.getElementById('save-ind'); if (!e) return;
  const cls = s === 'saving' ? 'saving' : s === 'saved' ? 'saved' : s === 'ref' ? 'ref' : s === 'error' ? 'err' : 'unsaved';
  e.className = 'sb-save-dot ' + cls;
  e.title = s === 'saving' ? 'Saving…' : s === 'saved' ? 'Saved' : s === 'ref' ? 'Reference · read-only' : s === 'error' ? 'Save failed' : 'Unsaved changes';
}
function renderShowBtn() {
  const nameEl = document.getElementById('sb-show-name');
  if (nameEl) nameEl.textContent = state.title || (state.showKey && SHOWS[state.showKey] ? SHOWS[state.showKey].title : '—');
  // Snapshots apply to the user's own editable shows, not read-only references.
  const snap = document.getElementById('sb-snapshots');
  if (snap) snap.hidden = !(state.projectId && !state.readonly);
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
  delBtn.disabled = state.readonly;
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
  snapApi('POST', '', { label: label || '', data: JSON.parse(serialize()) }).then((m) => cb && cb(m)).catch(() => {});
}
function restoreSnapshot(snapId) {
  if (state.readonly || !state.projectId) return;
  // Non-destructive: checkpoint the current state first, then load the chosen one.
  snapApi('POST', '', { label: 'Before restore', data: JSON.parse(serialize()) })
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
  const saveBtn = el('button', { class: 'snap-save-btn', text: '＋ Save snapshot' });
  saveBtn.addEventListener('click', () => {
    const label = prompt('Name this snapshot:', snapDefaultLabel());
    if (label === null) return;
    saveSnapshot(label.trim() || snapDefaultLabel(), renderSnapList);
  });
  head.appendChild(saveBtn);
  const xBtn = el('button', { class: 'snap-close', text: '✕', title: 'Close' });
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
    const row = el('div', { class: 'snap-row' });
    const top = el('div', { class: 'snap-row-top' });
    top.appendChild(el('span', { class: 'snap-label', text: s.label || snapDefaultLabel() }));
    top.appendChild(el('span', { class: 'snap-time', text: snapRelTime(s.ts) }));
    row.appendChild(top);
    const actions = el('div', { class: 'snap-actions' });
    const restore = el('button', { class: 'snap-restore', text: '⟲ Restore' });
    restore.addEventListener('click', () => {
      if (confirm('Restore "' + (s.label || 'this snapshot') + '"?\n\nYour current version will be snapshotted first, so this is safe.')) restoreSnapshot(s.id);
    });
    const rename = el('button', { class: 'snap-act', text: 'Rename' });
    rename.addEventListener('click', () => {
      const nl = prompt('Rename snapshot:', s.label || '');
      if (nl === null) return;
      snapApi('PUT', '/' + s.id, { label: nl.trim() }).then(renderSnapList).catch(() => {});
    });
    const del = el('button', { class: 'snap-act danger', text: 'Delete' });
    del.addEventListener('click', () => {
      if (confirm('Delete this snapshot? This can’t be undone.')) snapApi('DELETE', '/' + s.id).then(renderSnapList).catch(() => {});
    });
    [restore, rename, del].forEach((b) => actions.appendChild(b));
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
  _nsmMode = 'full';
  document.getElementById('nsm-title').value = '';
  document.querySelectorAll('#nsm-mode-seg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'full'));
  document.getElementById('new-show-modal').style.display = '';
  setTimeout(() => document.getElementById('nsm-title').focus(), 50);
}
function closeNewShowModal() {
  document.getElementById('new-show-modal').style.display = 'none';
}
function createProject(title, mode) {
  const body = JSON.stringify({ title, mode, cards: DEFAULT_TEMPLATE.map((c) => Object.assign({}, c)), updated: Date.now() });
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
function insertCard(act, type) {
  const card = type === 'song'
    ? { id: uid(), type: 'song', act, title: 'New song', fn: 'ballad', voicing: '', min: 3, status: 'idea', purpose: '', change: null }
    : type === 'scene'
    ? { id: uid(), type: 'scene', act, title: 'Scene 1', note: '', min: 0 }
    : { id: uid(), type: 'beat', act, title: 'New beat', note: '', lyrics: '', min: 1.5, change: null };
  state.cards.splice(lastIndexOfAct(act) + 1, 0, card);
  state.openAct = null;
  if (type === 'beat' && state.view === 'songs') state.view = 'full';
  render();
  // Seamless: a new card lands with its title focused for typing right on the board.
  // Scenes have no inline title (vertical), so they open the editor instead.
  if (!focusCardTitle(card.id)) openLyricWindow(card.id);
}
function moveCard(from, to, newAct) {
  const moved = state.cards.splice(from, 1)[0];
  moved.act = newAct;
  let t = to;
  if (from < to) t -= 1;
  state.cards.splice(t, 0, moved);
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
  const t = document.querySelector('.bcard[data-id="' + id + '"] .title[contenteditable="true"]');
  if (!t) return false;
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
    top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
  }

  const kids = c.type === 'scene' ? [] : [top];
  if (c.type === 'song') {
    kids.push(makeCardEditable(el('div', { class: 'title', text: c.title }), () => c.title, (v) => { c.title = v; }, 'Untitled'));
    kids.push(makeCardEditable(el('div', { class: 'sub', text: c.purpose || '' }), () => c.purpose, (v) => { c.purpose = v; }, 'why does this sing…'));
    kids.push(el('div', { class: 'foot' }, [changeControl(c), makeCardEditable(el('span', { class: 'conflict', text: c.conflict || '' }), () => c.conflict, (v) => { c.conflict = v; }, '+ Conflict'), statusControl(c)]));
  } else if (c.type === 'scene') {
    kids.push(el('div', { class: 'title scene-title', text: c.title }));
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
  const menu = el('div', { class: 'addmenu' + (state.openAct === act ? ' open' : '') }, [
    el('button', { text: '♪  Song' }),
    el('button', { text: '▸  Beat' }),
    el('button', { text: '≡  Scene' }),
  ]);
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
      if (state.view === 'songs' && c.type !== 'song') return;
      lane.appendChild(buildCard(c, i, pct[i]));
    });
    lane.appendChild(addTile(L.key));
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
function sliderInput(val, on) {
  const r = el('input', { type: 'range', min: '1', max: '10', step: '1' });
  r.value = val;
  const out = el('span', { class: 'sv', text: val });
  r.addEventListener('input', () => { out.textContent = r.value; on(parseInt(r.value, 10)); });
  return el('div', { class: 'slider-row' }, [r, out]);
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
function verseCheck(text, defaultSung) {
  // Group runs of sung lines into verses (broken by blanks, cues, or sections)
  // and compare their per-line syllable counts.
  const tokens = parseLyricLines(text || '', defaultSung);
  const verses = [];
  let cur = [];
  const flush = () => { if (cur.length) verses.push(cur); cur = []; };
  tokens.forEach((tok) => {
    if (tok.type === 'sung') cur.push(LYRIC.lineSyll(tok.text));
    else if (tok.type === 'blank' || tok.type === 'cue' || tok.type === 'section') flush();
  });
  flush();
  const sections = verses.filter((s) => s.length >= 2);
  if (sections.length < 2) return '';
  const base = sections[0];
  for (let v = 1; v < sections.length; v++) {
    for (let i = 0; i < Math.min(base.length, sections[v].length); i++) {
      if (sections[v][i] !== base[i]) return `Section ${v + 1}, line ${i + 1}: ${sections[v][i]} syllables vs ${base[i]} in section 1 — may not sit on the same tune.`;
    }
  }
  return '';
}
function renderRhymes(word, container) {
  container.innerHTML = '';
  word = (word || '').toLowerCase().replace(/[^a-z']/g, '');
  if (!word) { container.appendChild(el('span', { class: 'rhint', text: 'Type a word to find perfect rhymes.' })); return; }
  if (!LYRIC.ready()) { container.appendChild(el('span', { class: 'rhint', text: 'loading dictionary…' })); return; }
  if (!LYRIC.inDict(word)) { container.appendChild(el('span', { class: 'rhint', text: '"' + word + '" isn\'t in the dictionary' })); return; }
  const r = LYRIC.suggest(word);
  if (!r.perfect.length) { container.appendChild(el('span', { class: 'rhint', text: 'no perfect rhymes found for "' + word + '"' })); return; }
  r.perfect.forEach((w) => container.appendChild(el('span', { class: 'rchip', text: w })));
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

// Classify each text line into exactly one token (1:1 with input lines, so the
// result can drive the syllable gutter and rhyme tools as well as rendering).
// `defaultSung` decides whether unmarked lines in a character block are sung
// (songs) or spoken dialogue (beats/scenes). Legacy @cue / ~sung markers still
// parse, so older shows are unaffected.
function parseLyricLines(text, defaultSung) {
  const out = [];
  let inCharBlock = false, blockSung = !!defaultSung;
  for (const ln of (text || '').split('\n')) {
    const t = ln.trim();
    if (!t) { inCharBlock = false; out.push({ type: 'blank', text: '' }); continue; }
    if (/^\[.+\]$/.test(t)) {
      inCharBlock = false;
      const inner = t.slice(1, -1);
      let subtype = 'section';
      if (/^act[\s\d]/i.test(inner)) subtype = 'act';
      else if (/^scene[\s\d]/i.test(inner)) subtype = 'scene';
      else if (/^#\d+[\s\-]/i.test(inner)) subtype = 'song-num';
      out.push({ type: 'section', subtype, text: inner }); continue;
    }
    // Fountain dual-dialogue marker: a trailing ^ means "simultaneous with the
    // previous cue" — the two render side by side. Strip it before classifying.
    let dual = false, body = t;
    if (/\s*\^$/.test(t)) { dual = true; body = t.replace(/\s*\^\s*$/, '').trim(); }
    if (/^@.+/.test(body)) {
      const { name, sung } = splitCueMode(body.slice(1).trim(), defaultSung);
      inCharBlock = true; blockSung = sung;
      out.push({ type: 'cue', text: name, dual }); continue;
    }
    if (/^~/.test(t)) { inCharBlock = true; out.push({ type: 'sung', text: t.slice(1).trim() }); continue; } // ~ forces this line only
    if (/^\(.*\)$/.test(t)) { out.push({ type: 'paren', text: t }); continue; }
    // Implicit cue: an ALL-CAPS line that opens a block (Fountain convention —
    // a blank line or section/cue must precede it, so caps lyrics aren't eaten).
    if (!inCharBlock && looksLikeCue(body)) {
      const { name, sung } = splitCueMode(body, defaultSung);
      inCharBlock = true; blockSung = sung;
      out.push({ type: 'cue', text: name, dual }); continue;
    }
    if (inCharBlock) { out.push(blockSung ? { type: 'sung', text: t } : { type: 'dialogue', text: ln }); continue; }
    out.push({ type: 'action', text: ln });
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
  rows.forEach((row, i) => {
    const type = row.type, text = (row.text || '').trim();
    if (!text) { parts.push(''); blockSung = !!isSong; return; }
    if (type === 'cue') {
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
function collectCharacterNames() {
  const set = new Set();
  (state.cards || []).forEach((c) => {
    if (!c || !c.lyrics) return;
    parseLyricLines(c.lyrics, c.type === 'song').forEach((tok) => {
      if (tok.type === 'cue') { const n = (tok.text || '').trim().toUpperCase(); if (n) set.add(n); }
    });
  });
  Object.keys(state.characters || {}).forEach((n) => { const u = (n || '').trim().toUpperCase(); if (u) set.add(u); });
  return [...set].sort();
}

// Reusable rich (Tab/Enter) line editor. Builds a contenteditable element list
// from `text`, lets the user cycle element types with Tab / advance with Enter,
// and on blur serializes back to the seamless lyric format via onSave(value).
// Used by both the Manuscript Edit mode and the lyric window's Rich tab.
const RICH_EL_LABELS = { cue: 'Character', sung: 'Lyrics', dialogue: 'Dialogue', paren: 'Parenthetical', action: 'Action', section: 'Section', blank: 'Blank line' };
const RICH_EL_CLASS  = { cue: 'lw-char', sung: 'lw-sung', dialogue: 'lw-dialogue', paren: 'lw-paren', action: 'lw-action', section: 'lw-section-row' };
const RICH_EL_CYCLE  = ['cue', 'dialogue', 'sung', 'paren', 'action', 'section'];

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
    const inner = emphFromNode(n);
    if (!inner) return;
    if (tag === 'b' || tag === 'strong') out += '**' + inner + '**';
    else if (tag === 'i' || tag === 'em') out += '*' + inner + '*';
    else if (tag === 'u') out += '_' + inner + '_';
    else if (tag === 's' || tag === 'strike' || tag === 'del') out += '~~' + inner + '~~';
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
function buildRichEditor({ text, lines, isSong, onSave, autofocus, detachBar, onClose }) {
  // Final Draft "ReturnKey" map: hitting Enter advances to the element that
  // usually follows. Character/Parenthetical → the dialogue element (Lyrics in a
  // song, Dialogue otherwise); Dialogue/Lyrics → Character; Action stays Action.
  const smartNext = (type) => {
    if (type === 'cue' || type === 'paren') return isSong ? 'sung' : 'dialogue';
    if (type === 'dialogue' || type === 'sung') return 'cue';
    if (type === 'section') return isSong ? 'cue' : 'action';
    return type; // action → action
  };
  const tabNext   = (type) => { const i = RICH_EL_CYCLE.indexOf(type); return RICH_EL_CYCLE[(i + 1) % RICH_EL_CYCLE.length]; };
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
    div.innerHTML = emphToHtml(display); // render **bold** / *italic* / _underline_
    return div;
  };
  const setLineType = (div, type) => {
    div.dataset.type = type;
    div.className = 'ms-el ' + (RICH_EL_CLASS[type] || 'lw-blank ms-el-blank');
    if (type !== 'cue') delete div.dataset.dual; // dual only applies to cues
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
        if (!node.dataset.type) setLineType(node, prev ? prev.dataset.type : (isSong ? 'sung' : 'action'));
        if (!node.dataset.id) node.dataset.id = lid();
        if (node.dataset.type === 'blank' && (node.textContent || '').trim()) setLineType(node, isSong ? 'sung' : 'action');
        prev = node;
      } else {
        const txt = node.textContent || '';
        if (prev && txt.trim()) { prev.appendChild(document.createTextNode(txt)); node.remove(); } // append (don't reset prev's textContent — that would drop its emphasis)
        else if (txt.trim()) { const nl = mkLine(isSong ? 'sung' : 'action', txt.trim()); lineEd.insertBefore(nl, node); node.remove(); prev = nl; }
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

  const styleBar = el('div', { class: 'ms-style-bar' });
  const styleSel = el('select', { class: 'ms-style-sel' });
  const modKey = navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl+';
  Object.entries(RICH_EL_LABELS).forEach(([val, label]) => {
    const n = val === 'blank' ? 7 : RICH_EL_CYCLE.indexOf(val) + 1;
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
  styleBar.appendChild(undoBtn);
  styleBar.appendChild(redoBtn);
  styleBar.appendChild(el('span', { class: 'ms-fmt-divider' }));
  styleBar.appendChild(styleSel);
  // Dual-dialogue toggle: marks the focused character cue as simultaneous with
  // the cue before it (renders side by side in Print View).
  const dualBtn = el('button', { class: 'ms-dual-btn', type: 'button', text: 'Dual ⇄', title: 'Mark this character as speaking with the one above (' + modKey + 'D)' });
  const toggleDual = (line) => {
    if (!line || line.dataset.type !== 'cue') return false;
    if (line.dataset.dual === '1') delete line.dataset.dual; else line.dataset.dual = '1';
    dualBtn.classList.toggle('active', line.dataset.dual === '1');
    pushHistory();
    return true;
  };
  dualBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleDual(getFocusedLine(lineEd)); });
  styleBar.appendChild(dualBtn);

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
  styleBar.appendChild(el('span', { class: 'ms-fmt-divider' }));
  styleBar.appendChild(boldBtn);
  styleBar.appendChild(italicBtn);
  styleBar.appendChild(underlineBtn);
  styleBar.appendChild(strikeBtn);
  styleBar.appendChild(highlightBtn);
  styleBar.appendChild(el('span', { class: 'ms-style-hint', text: 'Enter · next element   ⇧Enter · same   Tab · cycle   ' + modKey + '1–7 · jump' }));

  const lineEd = el('div', { class: 'ms-line-editor ms-sheet-content' });
  lineEd.contentEditable = 'true'; // single editable host for the whole document
  // Seed from persisted identified lines when available (ids survive the edit);
  // otherwise parse the text blob (and mint ids — lazy migration on first edit).
  const seed = (lines && lines.length)
    ? lines.map((l) => ({ type: l.type, text: l.text, dual: l.dual, id: l.id, subtype: l.subtype }))
    : parseLyricLines(text || '', isSong).map((tok) => ({ type: tok.type, text: tok.text, dual: tok.dual, id: null, subtype: tok.subtype }));
  if (!seed.some((t) => t.type !== 'blank')) lineEd.appendChild(mkLine('cue', ''));
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
    closeAc();
    if (advance) {
      const newType = smartNext(line.dataset.type);
      const newLine = mkLine(newType, '');
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

  const syncPicker = () => {
    const line = getFocusedLine(lineEd);
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
  lineEd.addEventListener('input', () => { if (needsNormalize()) normalize(true); refreshAc(getFocusedLine(lineEd)); queueHistory(); });
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
    let anchor = line;
    for (let i = 1; i < segs.length; i++) {
      const nl = mkLine(line.dataset.type, segs[i] + (i === segs.length - 1 ? after : ''));
      anchor.after(nl); anchor = nl;
    }
    placeCaretAtOffset(anchor, segs[segs.length - 1].length);
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
      line.after(nl);
      placeCursorAt(nl, false);
    } else {
      setLineType(line, type);
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
      e.preventDefault();
      const newType = e.key === '7' ? 'blank' : RICH_EL_CYCLE[parseInt(e.key, 10) - 1];
      setOrInsertType(line, newType);
      refreshAc(getFocusedLine(lineEd) || line);
      pushHistory();
      return;
    }
    if (e.key === 'Enter') {
      // Enter → the element that usually follows (FD ReturnKey); Shift+Enter →
      // another line of the SAME element (e.g. the next lyric line). A caret in
      // mid-line splits it; the text after the caret carries into the new row.
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) sel.deleteFromDocument();
      const cur = getFocusedLine(lineEd) || line;
      const curType = cur.dataset.type;
      const off = caretOffsetIn(cur);
      const whole = cur.textContent || '';
      cur.textContent = whole.slice(0, off);
      const newType = e.shiftKey ? curType : smartNext(curType);
      const newLine = mkLine(newType, whole.slice(off));
      cur.after(newLine);
      placeCursorAt(newLine, false);
      styleSel.value = newType;
      syncPicker();
      pushHistory();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newType = tabNext(line.dataset.type);
      setLineType(line, newType);
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
    closeAc();
    if (onSave) onSave(serializeLines(lineEd), serializeToLines(lineEd));
    if (onClose) onClose();
  };
  richWrap._commit = commit;
  richWrap.addEventListener('focusout', (e) => {
    // The style bar may live outside richWrap (detachBar) — focusing it (the
    // element-type select, dual toggle) must not count as leaving the editor.
    if (richWrap.contains(e.relatedTarget) || styleBar.contains(e.relatedTarget)) return;
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
      if (c.note && c.note.trim()) { toks.push({ type: 'blank' }); toks.push({ type: 'action', text: c.note, lastRev: noteRev(c), key: 'note:' + c.id }); toks.push({ type: 'blank' }); }
    } else if (c.type === 'beat') {
      // The beat logline ("what it's about") is an outline reference, not script —
      // render it as a distinct note (sage) and tie its visibility to Section tags.
      if (c.note && c.note.trim() && state.msOptions.showSectionTags !== false) { toks.push({ type: 'note', text: c.note, lastRev: noteRev(c), key: 'note:' + c.id }); toks.push({ type: 'blank' }); }
      if (c.lyrics && c.lyrics.trim()) { cardBodyTokens(c).forEach(pushLyric); toks.push({ type: 'blank' }); }
    } else if (c.type === 'song') {
      songNum++;
      toks.push({ type: 'song-num', num: songNum, title: c.title || 'Untitled', key: 'sg:' + c.id });
      toks.push({ type: 'blank' });
      if (c.lyrics && c.lyrics.trim()) cardBodyTokens(c).forEach(pushLyric);
      else toks.push({ type: 'action', text: state.readonly ? '(lyrics not reproduced)' : '(no lyrics yet)' });
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
  while (i < toks.length) {
    const tok = toks[i];
    if (tok.type === 'cue') {
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
    else container.appendChild(el('div', { class: 'lw-section-row' }, [el('span', { class: 'lw-section-tag', text: tok.text })]));
  } else if (tok.type === 'cue')      { container.appendChild(el('div', { class: 'lw-char', html: emphToHtml(tok.text.toUpperCase()) + (tok.contd ? " (CONT'D)" : '') }));
  } else if (tok.type === 'sung')     { container.appendChild(el('div', { class: 'lw-sung', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'paren')    { container.appendChild(el('div', { class: 'lw-paren', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'dialogue') { container.appendChild(el('div', { class: 'lw-dialogue', html: emphToHtml(tok.text) }));
  } else if (tok.type === 'action')   { container.appendChild(el('div', { class: 'lw-action', html: emphToHtml(tok.text) }));
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

  const toolbar = el('div', { class: 'ch-toolbar ribbon' });
  const syncBtn = el('button', { class: 'pbtn', text: '⟳ Sync from lyrics' });
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
    empty.appendChild(el('p', { text: 'No characters yet. Add character cues — any ALL-CAPS line in your lyrics or dialogue — then click Sync.' }));
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
    else headText.appendChild(el('span', { class: 'ch-count', text: apps.length + ' song' + (apps.length !== 1 ? 's' : '') }));
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
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  toolbar.appendChild(el('span', { class: 'dna-note', text: 'Broad strokes — analysis only, kept separate from the board.' }));
  host.appendChild(toolbar);

  const wrap = el('div', { class: 'dna-wrap' });
  host.appendChild(wrap);

  // 1 — the "what if"
  const wi = el('div', { class: 'dna-field' });
  wi.appendChild(el('label', { class: 'dna-field-lbl', text: 'What if…' }));
  const wiTA = el('textarea', { class: 'dna-field-in', rows: '2', placeholder: 'The premise in a sentence — the “what if” at the heart of the show.' });
  wi.appendChild(bindArea(wiTA, () => dna.whatIf, (v) => { dna.whatIf = v; }));
  wrap.appendChild(wi);

  // 2 — the mirrored 7-beat chiasmus. Placeholders after Jill Chamberlain's
  // Nutshell Technique turning points (A-ha here = her Climactic Choice).
  const BEAT_PH = {
    setUpWant: 'What she wants, and why she can’t have it yet',
    threshold: 'The event that pulls her into the story',
    pinch: 'A setback that raises the cost of pursuing the want',
    crisis: 'Want vs. flaw comes to a head — an impossible choice',
    aha: 'The decisive action that resolves the crisis (Climactic Choice)',
    resolution: 'The new equilibrium her choice creates',
  };
  const beatCard = (side, role, name, key) => {
    const card = el('div', { class: 'dna-beat dna-' + side });
    card.appendChild(el('div', { class: 'dna-role', text: role }));
    card.appendChild(el('div', { class: 'dna-beat-name', text: name }));
    const ta = el('textarea', { class: 'dna-in', rows: '2', placeholder: BEAT_PH[key] || 'the beat, in a line' });
    card.appendChild(bindArea(ta, () => dna.beats[key], (v) => { dna.beats[key] = v; }));
    if (key === 'threshold') {
      const cw = el('div', { class: 'dna-catch' });
      cw.appendChild(el('div', { class: 'dna-catch-lbl', text: 'the catch' }));
      const cta = el('textarea', { class: 'dna-in dna-catch-in', rows: '2', placeholder: '…but getting the want exposes the flaw' });
      cw.appendChild(bindArea(cta, () => dna.beats.catch, (v) => { dna.beats.catch = v; }));
      card.appendChild(cw);
    }
    return card;
  };
  const conn = (rel) => {
    const c = el('div', { class: 'dna-conn' });
    c.appendChild(el('span', { class: 'dna-conn-arrow', text: '↔' }));
    c.appendChild(el('span', { class: 'dna-rel dna-rel-' + rel, text: rel }));
    return c;
  };
  const gridRow = (...cells) => { const r = el('div', { class: 'dna-grid-row' }); cells.forEach((c) => r.appendChild(c)); return r; };
  const grid = el('div', { class: 'dna-grid dna-ledger' });
  grid.appendChild(gridRow(beatCard('truth', 'truth line · beat 7', 'Resolution', 'resolution'), conn('inverts'), beatCard('want', 'want line · beat 1', 'Set up want', 'setUpWant')));
  grid.appendChild(gridRow(beatCard('truth', 'truth line · beat 6', 'A-ha', 'aha'), conn('inverts'), beatCard('want', 'want line · beat 2', 'Threshold', 'threshold')));
  grid.appendChild(gridRow(beatCard('truth', 'truth line · beat 3', 'Pinch', 'pinch'), conn('escalates'), beatCard('want', 'want line · beat 5', 'Crisis', 'crisis')));

  // Midpoint is the nucleus everything else mirrors around — an attached
  // row in the same ledger, not a separate box floating below it.
  const midRow = el('div', { class: 'dna-grid-row dna-mid-row' });
  const mid = el('div', { class: 'dna-beat dna-mid' });
  mid.appendChild(el('div', { class: 'dna-role', text: 'nucleus · beat 4' }));
  mid.appendChild(el('div', { class: 'dna-beat-name', text: 'Midpoint' }));
  const mta = el('textarea', { class: 'dna-in', rows: '2', placeholder: 'the point of no return — often discovered last' });
  mid.appendChild(bindArea(mta, () => dna.beats.midpoint, (v) => { dna.beats.midpoint = v; }));
  midRow.appendChild(mid);
  grid.appendChild(midRow);
  wrap.appendChild(grid);

  // 3 — the theme, three levels of stakes
  wrap.appendChild(el('div', { class: 'dna-divider' }));
  const stHead = el('div', { class: 'dna-sec-head' });
  stHead.appendChild(el('h3', { class: 'dna-sec-title', text: 'Theme' }));
  wrap.appendChild(stHead);
  const stakes = el('div', { class: 'dna-stakes dna-ledger' });
  [['external', 'External', 'the plot’s stake'], ['internal', 'Internal', 'the relational self'], ['philosophical', 'Philosophical', 'the worldview']].forEach(([k, label, hint]) => {
    const row = el('div', { class: 'dna-stake-row' });
    const lab = el('div', { class: 'dna-stake-lbl' });
    lab.appendChild(el('span', { class: 'dna-stake-name', text: label }));
    lab.appendChild(el('span', { class: 'dna-stake-hint', text: hint }));
    row.appendChild(lab);
    const tIn = el('input', { class: 'dna-pole dna-pole-truth', type: 'text', placeholder: 'truth pole' });
    row.appendChild(bindInput(tIn, () => dna.stakes[k].truth, (v) => { dna.stakes[k].truth = v; }));
    row.appendChild(el('span', { class: 'dna-vs', text: '↔' }));
    const fIn = el('input', { class: 'dna-pole dna-pole-flaw', type: 'text', placeholder: 'flaw pole' });
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
  web.appendChild(el('div', { class: 'dna-web-corner', text: 'philos. ↓ · internal →' }));
  web.appendChild(head(iT, 'internal truth', 'dna-web-colhead dna-truth-ink'));
  web.appendChild(head(iF, 'internal flaw', 'dna-web-colhead dna-flaw-ink'));
  web.appendChild(head(pT, 'philosophical truth', 'dna-web-rowhead dna-truth-ink'));
  web.appendChild(cell('truth', 'truth'));
  web.appendChild(cell('truth', 'flaw'));
  web.appendChild(head(pF, 'philosophical flaw', 'dna-web-rowhead dna-flaw-ink'));
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
    row.appendChild(field('internal', poleSelect(name, 'i', iT, iF)));
    row.appendChild(field('philosophical', poleSelect(name, 'p', pT, pF)));
    tray.appendChild(row);
  });
  wrap.appendChild(tray);
}

function navigateTo(page, sceneId) {
  state.page = page;
  document.querySelectorAll('.page').forEach((p) => { p.style.display = 'none'; });
  const target = document.getElementById('page-' + page);
  if (target) target.style.display = '';
  document.querySelectorAll('.tn-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  if (page === 'library') buildLibraryPage();
  if (page === 'manuscript') buildManuscriptPage(sceneId);
  if (page === 'characters') buildCharactersPage();
  if (page === 'storydna') buildStoryDnaPage();
}

function exportShow() {
  const data = {
    version: 1,
    title: state.title,
    mode: state.mode,
    cards: state.cards.map((c) => { const o = Object.assign({}, c); delete o.id; return o; }),
    characters: state.characters,
    exported: Date.now(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.title || 'untitled').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.songplot';
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
        cards: data.cards,
        characters: data.characters || {},
        updated: Date.now(),
      });
      fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        .then((r) => r.json()).then((d) => loadProjects().then(() => { openProject(d.id); navigateTo('board'); }));
    } catch (_) {
      alert('Could not read file. Make sure it\'s a valid .songplot file.');
    }
  };
  reader.readAsText(file);
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

  const emitLyricLines = (text) => {
    (text || '').split('\n').forEach((ln) => {
      const t = ln.trim();
      if (!t) { lines.push(''); return; }
      if (/^\[.+\]$/.test(t)) { lines.push('= ' + t.slice(1, -1)); return; }
      if (/^@/.test(t))       { lines.push(t.slice(1).trim().toUpperCase()); return; }
      if (/^~/.test(t))       { lines.push(t.slice(1).trim()); return; }
      lines.push(t);
    });
  };

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
      if (c.note && c.note.trim()) { lines.push(c.note); lines.push(''); }

    } else if (c.type === 'beat') {
      if (c.note && c.note.trim()) { lines.push(c.note); lines.push(''); }
      if (c.lyrics && c.lyrics.trim()) { emitLyricLines(c.lyrics); lines.push(''); }

    } else if (c.type === 'song') {
      songNum++;
      const num = String(songNum).padStart(2, '0');
      lines.push('> #' + num + ' ' + (c.title || 'UNTITLED SONG').toUpperCase() + ' <');
      lines.push('');
      if (c.lyrics && c.lyrics.trim()) { emitLyricLines(c.lyrics); }
      else { lines.push('(no lyrics yet)'); }
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
function openExportDrawer() {
  closeShowPopover();
  if (document.getElementById('exp-drawer')) { closeExportDrawer(); return; }

  const overlay = el('div', { class: 'snap-overlay', id: 'exp-overlay' });
  overlay.addEventListener('click', closeExportDrawer);
  document.body.appendChild(overlay);

  const drawer = el('div', { class: 'snap-drawer', id: 'exp-drawer' });
  const head = el('div', { class: 'snap-head' });
  head.appendChild(el('span', { class: 'snap-title', text: 'Export & backup' }));
  const xBtn = el('button', { class: 'snap-close', text: '✕', title: 'Close' });
  xBtn.addEventListener('click', closeExportDrawer);
  head.appendChild(xBtn);
  drawer.appendChild(head);

  const body = el('div', { class: 'exp-drawer-body' });

  // Save backup
  const s1 = el('div', { class: 'exp-section' });
  s1.appendChild(el('h2', { class: 'exp-heading', text: 'Save backup' }));
  s1.appendChild(el('p', { class: 'exp-desc', text: 'Download a .songplot file you can keep locally or move to another computer.' }));
  const expBtn = el('button', { class: 'pbtn exp-btn', text: '↓  Download ' + (state.title || 'show') + '.songplot' });
  expBtn.addEventListener('click', exportShow);
  if (state.readonly) {
    expBtn.disabled = true;
    s1.appendChild(el('p', { class: 'exp-note', text: 'Switch to a project (not a reference show) to export.' }));
  }
  s1.appendChild(expBtn);
  body.appendChild(s1);

  body.appendChild(el('div', { class: 'exp-divider' }));

  // Fountain export
  const s2 = el('div', { class: 'exp-section' });
  s2.appendChild(el('h2', { class: 'exp-heading', text: 'Export as Fountain' }));
  s2.appendChild(el('p', { class: 'exp-desc', text: 'Download a .fountain file — plain-text screenplay format compatible with Final Draft, Highland, and Fade In. Lyrics use standard Fountain character/dialogue blocks.' }));
  const ftnBtn = el('button', { class: 'pbtn exp-btn', text: '↓  Download ' + (state.title || 'show') + '.fountain' });
  ftnBtn.addEventListener('click', exportFountain);
  if (state.readonly) ftnBtn.disabled = true;
  s2.appendChild(ftnBtn);
  body.appendChild(s2);

  body.appendChild(el('div', { class: 'exp-divider' }));

  // Import
  const s3 = el('div', { class: 'exp-section' });
  s3.appendChild(el('h2', { class: 'exp-heading', text: 'Open backup' }));
  s3.appendChild(el('p', { class: 'exp-desc', text: 'Load a .songplot file. It will be added as a new project and you can rename it.' }));
  const fileInput = el('input', { type: 'file', accept: '.songplot,.json', class: 'exp-file-input', id: 'exp-file-input' });
  const impLabel = el('label', { class: 'pbtn exp-btn', for: 'exp-file-input', text: '↑  Choose .songplot file…' });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) { closeExportDrawer(); importShow(e.target.files[0]); } });
  s3.appendChild(impLabel);
  s3.appendChild(fileInput);
  body.appendChild(s3);

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
  const closeBtn = el('button', { class: 'ms-hd-close', text: '✕', title: 'Close' });
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

  // ── Running header ───────────────────────────────────────────────
  inner.appendChild(sectionHead('Running header'));

  // Subgroup holds the detail options; it dims when the header is turned off.
  const sub = el('div', { class: 'ms-hd-subgroup' });
  const syncDim = () => sub.classList.toggle('dimmed', !sh.enabled);

  const enabled = toggle('Show header on pages', sh.enabled, (v) => { sh.enabled = v; syncDim(); scheduleSave(); onUpdate(); updatePreview(); });
  inner.appendChild(enabled.row);

  // Format template
  const fmtWrap = el('div', { class: 'ms-hd-fmt-wrap' });
  const fmtIn = el('input', { class: 'fi ms-hd-fmt-input', type: 'text', value: sh.format || '' });
  fmtIn.placeholder = '{title} – {date} – {page}.';
  fmtIn.addEventListener('input', () => { sh.format = fmtIn.value; scheduleSave(); onUpdate(); updatePreview(); });
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
      scheduleSave(); onUpdate(); updatePreview();
    });
    tokens.appendChild(chip);
  });
  fmtWrap.appendChild(tokens);
  sub.appendChild(stacked('Format', fmtWrap));

  // Revision date
  const dateIn = el('input', { class: 'fi', type: 'text', value: sh.revisionDate || '' });
  dateIn.placeholder = '3/30/18, DRAFT, Workshop…';
  dateIn.addEventListener('input', () => { sh.revisionDate = dateIn.value; scheduleSave(); onUpdate(); updatePreview(); });
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
      scheduleSave(); onUpdate(); updatePreview();
    });
    alignSeg.appendChild(b);
  });
  sub.appendChild(stacked('Alignment', alignSeg));

  // First page toggle
  const fp = toggle('Show on first page', sh.firstPage, (v) => { sh.firstPage = v; scheduleSave(); onUpdate(); });
  sub.appendChild(fp.row);

  // Preview
  const preview = el('div', { class: 'ms-hd-preview' });
  function updatePreview() {
    const text = (sh.format || '')
      .replace('{title}', (state.title || 'Untitled Show').toUpperCase())
      .replace('{date}', sh.revisionDate || '')
      .replace('{page}', '8');
    preview.textContent = text || ' ';
    preview.style.textAlign = sh.alignment || 'right';
  }
  updatePreview();
  sub.appendChild(stacked('Preview', preview));

  inner.appendChild(sub);
  syncDim();

  drawer.appendChild(inner);
  return drawer;
}

function buildManuscriptPage(sceneId) {
  const toolbar = document.getElementById('ms-toolbar');
  const body = document.getElementById('ms-body');
  toolbar.innerHTML = '';
  body.innerHTML = '';

  const ZOOM_STEP = 0.15, ZOOM_MIN = 0.4, ZOOM_MAX = 2.0;
  let zoom = (() => { try { return parseFloat(localStorage.getItem('md-ms-zoom')) || 0.75; } catch (_) { return 0.75; } })();
  let msMode = (() => { try { return localStorage.getItem('md-ms-mode') || 'edit'; } catch (_) { return 'edit'; } })();

  const zoomOut = el('button', { class: 'ms-zoom-btn', text: '−', title: 'Zoom out' });
  const zoomIn  = el('button', { class: 'ms-zoom-btn', text: '+', title: 'Zoom in' });
  const zoomLbl = el('span', { class: 'ms-zoom-lbl' });
  const zoomWrap = el('div', { class: 'ms-zoom-wrap' }, [zoomOut, zoomLbl, zoomIn]);

  // View-mode toggle as a segmented control (matches the Board's view switcher),
  // so it reads as a state toggle rather than an action button.
  const modeSeg = el('div', { class: 'seg ms-mode-seg', title: 'Switch view' });
  const editTab = el('button', { text: 'Edit' });
  const layoutTab = el('button', { text: 'Print View' });
  const titleTab = el('button', { text: 'Title pages' });
  modeSeg.appendChild(editTab);
  modeSeg.appendChild(layoutTab);
  modeSeg.appendChild(titleTab);
  const printBtn = el('button', { class: 'ms-print-btn', title: 'Print / Save as PDF' });
  printBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg><span>Print</span>';
  printBtn.addEventListener('click', () => exportPDF(true));
  const settingsBtn = el('button', { class: 'ms-settings-btn', title: 'Page settings' });
  settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const navBtn = el('button', { class: 'ms-nav-btn', title: 'Show/hide the outline navigation', text: '☰ Navigation' });

  const saveMsOpts = () => { try { localStorage.setItem('md-ms-opts', JSON.stringify(state.msOptions)); } catch (_) {} };

  toolbar.appendChild(navBtn); // leftmost — the outline opens on the left
  toolbar.appendChild(zoomWrap); // absolutely centered via CSS
  // Mode toggle lives on the right beside Print so it stays anchored when the
  // Edit-only Navigation button disappears in Print View.
  const tbRight = el('div', { class: 'ms-tb-right' });
  tbRight.appendChild(modeSeg);
  tbRight.appendChild(el('span', { class: 'ms-tb-divider' }));
  tbRight.appendChild(printBtn);
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

  // ── Edit mode (per-card sections) ───────────────────────────────
  // The manuscript body field — shared with the rest of the app (and the
  // `card.lines` identity sidecar) via the top-level cardBodyField.
  const cardField = cardBodyField;

  const renderCardSection = (sec, c) => {
    sec.innerHTML = '';
    const text = (c[cardField(c)] || '').trim();
    const isEmpty = !text;
    // Beat logline shown as a sage outline reference — consistent with Print view.
    // Read-only here (edited via the card / Details); hidden with the Section-tags
    // toggle (CSS, under .hide-sections) so it round-trips like section pills.
    const hasLogline = c.type === 'beat' && (c.note || '').trim();
    const inner = el('div', { class: 'ms-card-content ms-sheet-content' + (isEmpty && !hasLogline ? ' ms-card-section-empty' : '') });
    if (hasLogline) inner.appendChild(el('div', { class: 'lw-note-ms', text: c.note }));
    if (isEmpty) {
      const phText = state.readonly
        ? (c.type === 'scene' ? '(scene heading)' : c.type === 'beat' ? '' : '(lyrics not reproduced)')
        : (c.type === 'scene' ? '(scene heading — click to write)' : c.type === 'beat' ? '(new beat — click to write)' : '(no lyrics yet — click to write)');
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
    // Keep the sage logline pinned above the editor while editing (it's edited via
    // the card/Details, not here) so it doesn't vanish when you click in. Wrapped in
    // .ms-sheet-content so it inherits the script column width and wraps like static.
    const hasLogline = c.type === 'beat' && (c.note || '').trim();
    sec.classList.toggle('ms-has-logline', !!hasLogline);
    if (hasLogline) {
      sec.appendChild(el('div', { class: 'ms-sheet-content ms-edit-logline' }, [el('div', { class: 'lw-note-ms', text: c.note })]));
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
      },
      onClose: () => { if (setActiveFormatBar) setActiveFormatBar(null); }, // release the shared bar
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
    if (rich._syncBar) rich._syncBar();
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
  // persistent bar (or restores the idle hint when nothing is being edited).
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
      const bar = el('div', { class: 'ms-style-bar ms-style-bar-idle' });
      ['↶', '↷'].forEach((h) => bar.appendChild(el('button', { class: 'ms-fmt-btn', type: 'button', disabled: 'disabled', html: h })));
      bar.appendChild(el('span', { class: 'ms-fmt-divider' }));
      bar.appendChild(el('select', { class: 'ms-style-sel', disabled: 'disabled' }, [el('option', { text: 'Element' })]));
      bar.appendChild(el('button', { class: 'ms-dual-btn', type: 'button', disabled: 'disabled', text: 'Dual ⇄' }));
      bar.appendChild(el('span', { class: 'ms-fmt-divider' }));
      ['<b>B</b>', '<i>I</i>', '<u>U</u>', '<s>S</s>'].forEach((h) => bar.appendChild(el('button', { class: 'ms-fmt-btn', type: 'button', disabled: 'disabled', html: h })));
      bar.appendChild(el('button', { class: 'ms-fmt-btn ms-fmt-hl', type: 'button', disabled: 'disabled', html: '<mark>H</mark>' }));
      bar.appendChild(el('span', { class: 'ms-style-hint', text: 'Click any line to edit' }));
      return bar;
    })();
    setActiveFormatBar = (styleBarEl) => {
      formatBar.innerHTML = '';
      formatBar.classList.toggle('active', !!styleBarEl);
      formatBar.appendChild(styleBarEl || idleBar);
    };
    if (!state.readonly) { setActiveFormatBar(null); newBody.appendChild(formatBar); }
    // Mirror the Print view's "Section tags" toggle here: hide section pills in
    // both the static render and the rich editor when the option is off. CSS
    // hides them (lines stay in the DOM, so they round-trip and reappear on).
    const doc = el('div', { class: 'ms-edit-doc' + (state.msOptions.showSectionTags === false ? ' hide-sections' : '') });

    editOrder().forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      const isEmpty = !(c[cardField(c)] || '').trim();
      const div = el('div', { class: 'ms-card-divider' + (isEmpty ? ' ms-card-divider-empty' : ''), 'data-card-id': c.id, 'data-anchor': 'card:' + c.id });
      const icon = c.type === 'song' ? '♪' : c.type === 'scene' ? '◆' : '●';
      div.appendChild(el('span', { class: 'ms-card-divider-label', text: icon + ' ' + (c.title || 'Untitled') }));
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
    titleTab.classList.toggle('active', msMode === 'title');
    try { localStorage.setItem('md-ms-mode', msMode); } catch (_) {}
    applyNav(); // outline panel + Navigation button reflect Edit/Print state
    // Title mode has its own inline include-checkboxes, so the settings gear
    // (script options: title/act headers/section tags) is hidden there.
    settingsBtn.style.display = msMode === 'title' ? 'none' : '';
    if (msMode === 'edit') rebuildEdit();
    else if (msMode === 'title') rebuildTitle();
    else rebuildSheets();
    applyZoom();
    restoreAnchor(anchor);
  };
  editTab.addEventListener('click', () => { if (msMode !== 'edit') { msMode = 'edit'; applyMode(); } });
  layoutTab.addEventListener('click', () => { if (msMode !== 'layout') { msMode = 'layout'; applyMode(); } });
  titleTab.addEventListener('click', () => { if (msMode !== 'title') { msMode = 'title'; applyMode(); } });

  // ── Settings drawer ──────────────────────────────────────────────
  const drawer = buildHeaderDrawer(() => { if (msMode === 'layout') rebuildSheets(); else rebuildEdit(); });
  const drawerInner = drawer.querySelector('.ms-hd-inner');
  drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));
  drawerInner.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Show in document' }));
  const mkDrawerToggle = (label, key, defaultVal) => {
    if (state.msOptions[key] === undefined) state.msOptions[key] = defaultVal !== false;
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state.msOptions[key];
    cb.addEventListener('change', () => {
      state.msOptions[key] = cb.checked;
      saveMsOpts();
      if (msMode === 'layout') rebuildSheets(); else rebuildEdit();
    });
    const r = el('label', { class: 'ms-hd-toggle' });
    r.appendChild(el('span', { class: 'ms-hd-toggle-label', text: label }));
    r.appendChild(cb);
    return r;
  };
  drawerInner.appendChild(mkDrawerToggle('Show title', 'showTitle', false));
  drawerInner.appendChild(mkDrawerToggle('Act headers', 'showActHeaders', true));
  drawerInner.appendChild(mkDrawerToggle('Section tags', 'showSectionTags', false));

  // ── Revisions (Final Draft-style) ─────────────────────────────────
  if (!state.readonly) {
    const rerenderMs = () => { if (msMode === 'layout') rebuildSheets(); else rebuildEdit(); };
    drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));
    const revSection = el('div', { class: 'ms-rev-section' });
    drawerInner.appendChild(revSection);
    const renderRevSection = () => {
      revSection.innerHTML = '';
      revSection.appendChild(el('div', { class: 'ms-hd-section-head', text: 'Revisions' }));
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
        state.revisions = (state.revisions || []).concat([{ id: uid(), name: color.name, hex: color.hex, date: Date.now() }]);
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
  const msNav = el('div', { class: 'ms-nav' });
  const navHead = el('div', { class: 'ms-nav-head' }, [
    el('span', { class: 'ms-nav-title', text: 'Navigation' }),
  ]);
  const navList = el('div', { class: 'ms-nav-list' });
  msNav.appendChild(navHead);
  msNav.appendChild(navList);

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

  let navObserver = null;
  const navRows = new Map(); // card id -> row element
  refreshNav = () => {
    navList.innerHTML = '';
    navRows.clear();
    if (navObserver) { navObserver.disconnect(); navObserver = null; }
    const bodyEl = msWrap.querySelector('.ms-body');
    if (!bodyEl) return;
    const order = editOrder();
    let curAct = null;
    order.forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      if (c.act !== curAct) {
        curAct = c.act;
        navList.appendChild(el('div', { class: 'ms-nav-act', text: LANE_LABELS[c.act] || c.act }));
      }
      const icon = c.type === 'song' ? '♪' : c.type === 'scene' ? '◆' : '●';
      const row = el('button', { class: 'ms-nav-row ms-nav-' + c.type }, [
        el('span', { class: 'ms-nav-icon', text: icon }),
        el('span', { class: 'ms-nav-label', text: c.title || 'Untitled' }),
      ]);
      row.addEventListener('click', () => {
        const target = bodyEl.querySelector('.ms-card-divider[data-card-id="' + c.id + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      navList.appendChild(row);
      navRows.set(c.id, row);
    });
    // Highlight the card currently near the top of the viewport.
    const visible = new Set();
    navObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const id = e.target.getAttribute('data-card-id');
        if (e.isIntersecting) visible.add(id); else visible.delete(id);
      });
      let activeId = null;
      for (const idx of order) { const c = state.cards[idx]; if (c && visible.has(c.id)) { activeId = c.id; break; } }
      navRows.forEach((r, id) => r.classList.toggle('active', id === activeId));
    }, { root: bodyEl, rootMargin: '0px 0px -70% 0px', threshold: 0 });
    bodyEl.querySelectorAll('.ms-card-divider[data-card-id]').forEach((d) => navObserver.observe(d));
  };

  msWrap.appendChild(msNav);
  msWrap.appendChild(drawer);
  settingsBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    settingsBtn.classList.toggle('active', drawer.classList.contains('open'));
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
function isSectionHeader(ln) { return /^\[.+\]$/.test(ln.trim()); }
function isCueLine(ln) { return /^@/.test(ln.trim()); }
function isSungLine(ln) { return /^~/.test(ln.trim()) && !!ln.trim(); }
function updateGutter(c, gutter) {
  gutter.innerHTML = '';
  const tokens = parseLyricLines(c.lyrics || '', c.type === 'song');
  const letters = rhymeLetters(tokens);
  tokens.forEach((tok, i) => {
    if (tok.type === 'cue' || tok.type === 'section') {
      gutter.appendChild(el('div', { class: 'lwg-row lwg-section' }));
      return;
    }
    const sung = tok.type === 'sung';
    gutter.appendChild(el('div', { class: 'lwg-row' }, [
      el('span', { class: 'g-letter', text: sung ? letters[i] : '' }),
      el('span', { class: 'g-syl', text: sung ? LYRIC.lineSyll(tok.text) : '' }),
    ]));
  });
}
function updateSummary(c, node) {
  const tokens = parseLyricLines(c.lyrics || '', c.type === 'song');
  const sung = tokens.filter((t) => t.type === 'sung');
  const syl = sung.reduce((s, t) => s + LYRIC.lineSyll(t.text), 0);
  const scheme = rhymeLetters(tokens).filter(Boolean).join('');
  node.textContent = `${sung.length} sung lines · ${syl} syllables` + (scheme ? ` · ${scheme.length > 20 ? scheme.slice(0, 20) + '…' : scheme}` : '');
}
function updateVerseNote(c, node) {
  const n = verseCheck(c.lyrics || '', c.type === 'song');
  node.textContent = n || 'No verse-length mismatches.';
  node.className = 'lwnote' + (n ? ' warn' : '');
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
    body.appendChild(field('Duration (min)', numInput(c.min, (v) => { c.min = v; commit(); })));
    body.appendChild(field('Logline / what happens', textareaInput(c.note, (v) => { setCardBody(c, 'note', v); commit(); }, 'The book scene — what happens here?')));
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

function buildLyricWindow(c) {
  const win = el('div', { class: 'lyricwin' });
  const summary = el('span', { class: 'lwsummary' });
  const closeBtn = el('button', { class: 'dclose', text: '✕', title: 'Close (Esc)' });
  closeBtn.addEventListener('click', closeLyricWindow);

  const editBtn = el('button', { class: 'lwtoggle active', text: 'Fountain' });
  const richBtn = el('button', { class: 'lwtoggle', text: 'Rich' });
  const toggleWrap = el('div', { class: 'lwtoggle-wrap' }, [editBtn, richBtn]);

  const pillEl = c.type === 'song'
    ? (() => { const meta = FN[c.fn] || FN.ballad; return el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label }); })()
    : el('span', { class: 'pill beat-pill', text: (c.beatFn || '').trim() || 'Beat' });

  const lwtitleEl = el('span', { class: 'lwtitle', text: c.title || 'Untitled' });
  const head = el('div', { class: 'lwhead' }, [
    pillEl,
    lwtitleEl,
    summary,
    el('span', { style: 'flex:1' }),
    toggleWrap,
    closeBtn,
  ]);

  // The editor is the single workspace for a card. Songs/beats edit the lyric/script
  // body; scenes edit their prose note (no syllable gutter or rhyme tools — "plain").
  const bodyField = c.type === 'scene' ? 'note' : 'lyrics';
  const plain = c.type === 'scene';
  if (plain) toggleWrap.style.display = 'none';

  // Keep the editor header in sync when a basic is changed in the Details panel.
  const syncHead = () => {
    lwtitleEl.textContent = c.title || 'Untitled';
    if (c.type === 'song') { const m = FN[c.fn] || FN.ballad; pillEl.textContent = m.label; pillEl.setAttribute('data-fam', m.fam); }
    else if (c.type === 'beat') { pillEl.textContent = (c.beatFn || '').trim() || 'Beat'; }
  };

  // ---- editor ----
  const gutter = el('div', { class: 'lwgutter' });
  const editorPlaceholder = c.type === 'beat'
    ? 'Write the scene here…\n\nCHARACTER — a CAPS line is who speaks\nDialogue — plain text below the name\n(Parenthetical) — tone / action mid-line\nAction — plain line outside a character\nCHARACTER (sings) — mark a sung outburst\n[Scene] — section heading'
    : 'Write here…\n\nCHARACTER — a CAPS line is who sings\nLyrics — just type below the name (rhyme-tracked)\nCHARACTER (spoken) — mark a spoken aside\n(Parenthetical) — inline note\n[Chorus] — section chip (resets rhyme)\n[Scene 1: Title] — scene heading\n[#01 Title] — song number header';
  const editor = el('textarea', { class: 'lweditor', wrap: plain ? 'soft' : 'off', spellcheck: 'true', placeholder: plain ? 'Write the scene here — the book prose for this moment.' : editorPlaceholder });
  editor.value = c[bodyField] || '';

  // ---- sidebar ----
  const side = el('div', { class: 'lwside' });
  const rin = el('input', { class: 'fi', type: 'text', placeholder: 'word to rhyme' });
  const res = el('div', { class: 'rhymeresults' });
  const vnote = el('div', { class: 'lwnote' });

  const secBtns = el('div', { class: 'lwsection-btns' });
  ['Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Intro', 'Outro'].forEach((name) => {
    const btn = el('span', { class: 'rchip click', text: name, title: 'Insert section header' });
    btn.addEventListener('click', () => {
      const alwaysNum = name === 'Verse' || name === 'Bridge';
      const re = new RegExp('\\[' + name + '(?:\\s+\\d+)?\\]', 'gi');
      const count = (editor.value.match(re) || []).length;
      const label = (count === 0 && !alwaysNum) ? '[' + name + ']' : '[' + name + ' ' + (count + 1) + ']';
      const s = editor.selectionStart != null ? editor.selectionStart : editor.value.length;
      const before = editor.value.slice(0, s), after = editor.value.slice(s);
      const pre = before.length && !before.endsWith('\n') ? '\n' : '';
      const post = after.length && !after.startsWith('\n') ? '\n' : '';
      insertAtCursor(editor, pre + label + post);
      refresh();
    });
    secBtns.appendChild(btn);
  });
  // Rhyme tabs
  let rhymeMode = 'perfect';
  const rhymeTabWrap = el('div', { class: 'rhyme-tab-wrap' });
  const tabPerfect = el('button', { class: 'rhyme-tab active', text: 'Perfect' });
  const tabNear    = el('button', { class: 'rhyme-tab', text: 'Near' });
  rhymeTabWrap.appendChild(tabPerfect);
  rhymeTabWrap.appendChild(tabNear);

  const showRhymes = (word) => {
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

  // Group the lyric-writing tools into accented zones so each function reads
  // distinctly: Sections (sage, matches loglines) and Rhymes (rose).
  if (!plain) {
    side.appendChild(el('div', { class: 'lwzone lwzone-sections' }, [
      el('span', { class: 'fl', text: 'Sections' }),
      secBtns,
    ]));
    side.appendChild(el('div', { class: 'lwzone lwzone-rhymes' }, [
      el('span', { class: 'fl', text: 'Rhymes' }),
      rhymeTabWrap, rin, res,
    ]));
    side.appendChild(el('span', { class: 'fl muted', text: 'Notes', style: 'margin-top:2px' }));
    side.appendChild(vnote);
  }

  // The card's metadata — formerly the right-side detail drawer — now lives here so
  // one window covers everything: write the content, tune the basics, all in place.
  side.appendChild(buildDetailsPanel(c, syncHead));

  // ---- panes ----
  const editPane = el('div', { class: 'lwbody' + (plain ? ' lwbody-plain' : '') }, plain ? [editor, side] : [gutter, editor, side]);
  const richPane = el('div', { class: 'lwrich-wrap', style: 'display:none' });

  const refresh = () => {
    setCardBody(c, bodyField, editor.value); // keep the lines identity sidecar aligned
    if (!plain) {
      updateGutter(c, gutter);
      updateSummary(c, summary);
      updateVerseNote(c, vnote);
      if (!rin._touched) { rin.value = LYRIC.lastWord(lastNonEmptyLine(editor.value)); showRhymes(rin.value); }
    }
    scheduleSave();
  };

  editor.addEventListener('input', refresh);
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });
  rin.addEventListener('input', () => { rin._touched = true; showRhymes(rin.value); });

  const showEdit = () => {
    editor.value = c[bodyField] || '';        // reflect any edits made in the Rich tab
    editPane.style.display = '';
    richPane.style.display = 'none';
    editBtn.classList.add('active');
    richBtn.classList.remove('active');
    if (!plain) { updateGutter(c, gutter); updateSummary(c, summary); updateVerseNote(c, vnote); }
    setTimeout(() => editor.focus(), 0);
  };

  const showRich = () => {
    richPane.innerHTML = '';
    richPane.appendChild(buildRichEditor({
      text: c[bodyField] || '',
      lines: c.lines,
      isSong: c.type === 'song',
      autofocus: true,
      onSave: (val, lines) => {
        if (val === (c[bodyField] || '')) return;  // nothing changed (e.g. just viewing)
        setCardLines(c, lines);                // lines canonical; keeps the Fountain source in sync
        updateGutter(c, gutter); updateSummary(c, summary); updateVerseNote(c, vnote);
        scheduleSave();
      },
    }));
    editPane.style.display = 'none';
    richPane.style.display = '';
    editBtn.classList.remove('active');
    richBtn.classList.add('active');
  };
  editBtn.addEventListener('click', showEdit);
  richBtn.addEventListener('click', showRich);

  win.appendChild(head);
  win.appendChild(editPane);
  win.appendChild(richPane);

  if (!plain) {
    updateGutter(c, gutter); updateSummary(c, summary); updateVerseNote(c, vnote);
    rin.value = LYRIC.lastWord(lastNonEmptyLine(c[bodyField] || ''));
    renderRhymesInsertable(rin.value, res, editor, refresh);
  }
  setTimeout(() => editor.focus(), 0);
  return win;
}
function openLyricWindow(id) {
  state.lyricWinId = id;
  const host = document.getElementById('lyricwin');
  host.innerHTML = '';
  host.appendChild(buildLyricWindow(cardById(id)));
  host.style.display = '';
}
function closeLyricWindow() {
  // Flush any pending edit (the Rich tab saves on blur) before tearing down.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  state.lyricWinId = null;
  const host = document.getElementById('lyricwin');
  host.style.display = 'none';
  host.innerHTML = '';
  render();
}
function refreshLyricWindow() { if (state.lyricWinId) openLyricWindow(state.lyricWinId); }

// ---- stats ----
function buildStats() {
  const wrap = document.getElementById('stats');
  wrap.innerHTML = '';
  const songs = state.cards.filter((c) => c.type === 'song').length;
  const beats = state.cards.length - songs;
  const total = state.cards.reduce((s, c) => s + (c.min || 0), 0);
  const pre = state.cards.filter((c) => PRE_INT.includes(c.act)).reduce((s, c) => s + (c.min || 0), 0);
  const stat = (k, v) => el('div', { class: 'stat' }, [el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v })]);
  wrap.appendChild(stat('Songs', songs));
  wrap.appendChild(stat('Beats', beats));
  wrap.appendChild(stat('Runtime', '~' + Math.round(total) + 'm'));
  wrap.appendChild(stat(state.mode === 'full' ? 'Pre / post int' : 'Pre / post mid', `${Math.round(pre)} / ${Math.round(total - pre)}`));
}

// ---- render ----
function syncControls() {
  document.querySelectorAll('#view-seg button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
}
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  // Reference shows announce what they teach — turns a song list into a study object.
  const refShow = state.readonly && state.showKey && SHOWS[state.showKey];
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
  scheduleSave();
}

// ---- controls ----
function initControls() {
  document.querySelectorAll('#view-seg button').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; render(); }));
  document.getElementById('lyricwin').addEventListener('click', (e) => { if (e.target.id === 'lyricwin') closeLyricWindow(); });
  document.querySelectorAll('.tn-tab[data-page]').forEach((b) => {
    b.addEventListener('click', () => { if (!b.classList.contains('sb-disabled')) navigateTo(b.dataset.page); });
  });

  // show switcher popover
  document.getElementById('sb-show-btn').addEventListener('click', (e) => { e.stopPropagation(); showShowPopover(); });
  document.getElementById('sb-snapshots').addEventListener('click', (e) => { e.stopPropagation(); openSnapshotsDrawer(); });
  const exBtn = document.getElementById('sb-export');
  if (exBtn) exBtn.addEventListener('click', (e) => { e.stopPropagation(); openExportDrawer(); });

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
    if (e.key === 'Escape') {
      const exd = document.getElementById('exp-drawer');
      if (exd) { closeExportDrawer(); return; }
      const fm = document.getElementById('folder-modal');
      if (fm && fm.style.display !== 'none') { closeFolderModal(); return; }
      const shm = document.getElementById('share-modal');
      if (shm && shm.style.display !== 'none') { closeShareModal(); return; }
      closeCardMenu();
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
  try {
    const last = JSON.parse(localStorage.getItem('md-last') || 'null');
    if (last && last.type === 'project') {
      const exists = state.projects.find((p) => p.id === last.val);
      if (exists) { openProject(last.val); return; }
    }
  } catch (_) {}
  // No restorable last project — open the most recently edited one, and only
  // fall back to a reference example if the user has no projects of their own.
  if (state.projects.length) {
    const recent = state.projects.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    openProject(recent.id);
    return;
  }
  openReference('fiddler');
});

// Load the pronouncing dictionary; refresh an open song editor once ready.
fetch('cmudict.txt').then((r) => r.text()).then((t) => {
  LYRIC.load(t);
  if (state.lyricWinId) refreshLyricWindow();
}).catch(() => {});
