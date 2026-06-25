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
  characters: {},
  titlePage: { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } },
  scriptHeader: { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false },
  msOptions: (() => { try { return JSON.parse(localStorage.getItem('md-ms-opts') || '{}'); } catch (_) { return {}; } })(),
  dragFrom: null,
  openAct: null,
  selectedId: null,
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
  state.characters = show.characters ? JSON.parse(JSON.stringify(show.characters)) : {};
  const tpDefaults = { subtitle: 'A musical', authors: '', draftLine1: '', draftLine2: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true, rule: false, subtitle: false, draft: false } };
  state.titlePage = Object.assign({}, tpDefaults, show.titlePage || {});
  state.titlePage.include = Object.assign({}, tpDefaults.include, (show.titlePage || {}).include || {});
  state.scriptHeader = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
  state.title = show.title;
  state.projectId = null;
  state.readonly = true;
  state.folder = '';
  state.mode = show.form === 'one-act-90' ? 'oneact' : 'full';
  closeDetail();
  state.loading = false;
  render();
  setSaveInd('ref');
}

// Load a show payload (from the server, or a restored snapshot) into state.
// Does not touch projectId/showKey/readonly or render — the caller owns those.
function applyShowData(d) {
  state.cards = (d.cards || []).map(cardFromStored);
  state.characters = d.characters || {};
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
    closeDetail();
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
    characters: state.characters,
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
      closeDetail();
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
  openDetail(card.id);
  const t = document.querySelector('#detail input[data-field="title"]');
  if (t) { t.focus(); t.select(); }
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
  pill.addEventListener('mousedown', (e) => e.stopPropagation());
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

function buildCard(c, trueIdx, pct) {
  const top = el('div', { class: 'top' });
  if (c.type === 'song') {
    const meta = FN[c.fn] || FN.ballad;
    top.appendChild(el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label }));
    top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
  } else if (c.type === 'beat') {
    top.appendChild(makeBeatFnPill(c));
    top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
  }

  const kids = c.type === 'scene' ? [] : [top];
  const statusDot = c.status && STATUS[c.status] ? `<span class="statusdot" style="background:${STATUS[c.status].c}" title="${STATUS[c.status].label}"></span>` : '';
  if (c.type === 'song') {
    kids.push(el('div', { class: 'title', text: c.title }));
    kids.push(el('div', { class: 'sub', text: c.voicing || '—' }));
    const lyricBtn = el('button', { class: 'card-lyric-btn', text: '✎  Lyrics' });
    lyricBtn.addEventListener('click', (e) => { e.stopPropagation(); openLyricWindow(c.id); });
    kids.push(el('div', { class: 'card-lyric-row' }, [lyricBtn]));
    const changeBadge = c.change === 'positive' ? '<span class="change-badge pos">+</span>'
      : c.change === 'negative' ? '<span class="change-badge neg">−</span>' : '';
    kids.push(el('div', { class: 'foot', html: statusDot + changeBadge + '<span style="margin-left:auto">~' + c.min + 'm</span>' }));
  } else if (c.type === 'scene') {
    kids.push(el('div', { class: 'title scene-title', text: c.title }));
    const readBtn = el('button', { class: 'scene-read-btn', title: 'Read this scene' }, [el('span', { text: '▶' })]);
    readBtn.addEventListener('click', (e) => { e.stopPropagation(); openManuscript(c.id); });
    kids.push(readBtn);
  } else {
    kids.push(el('div', { class: 'title', text: c.title }));
    kids.push(el('div', { class: 'sub note', text: c.note || 'add a note…' }));
    const editBtn = el('button', { class: 'card-lyric-btn', text: '✎  Edit' });
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); openLyricWindow(c.id); });
    kids.push(el('div', { class: 'card-lyric-row' }, [editBtn]));
    const changeBadge = c.change === 'positive' ? '<span class="change-badge pos">+</span>'
      : c.change === 'negative' ? '<span class="change-badge neg">−</span>' : '';
    kids.push(el('div', { class: 'foot', html: changeBadge + '<span style="margin-left:auto">~' + c.min + 'm</span>' }));
  }

  const card = el('div', { class: 'bcard' + (c.type === 'beat' ? ' beat' : '') + (c.type === 'scene' ? ' scene' : '') + (c.id === state.selectedId ? ' selected' : ''), draggable: 'true', 'data-pos': trueIdx }, kids);
  card.addEventListener('click', (e) => { if (!card.classList.contains('justdragged')) openDetail(c.id); });
  wireCardDrag(card);
  return card;
}

function wireCardDrag(card) {
  card.addEventListener('dragstart', (e) => {
    if (e.target.isContentEditable) { e.preventDefault(); return; } // editing the beat-fn pill, not dragging
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

function openDetail(id) {
  state.selectedId = id;
  buildDetail();
  document.getElementById('backdrop').style.display = '';
  document.getElementById('detail').style.display = '';
  render();
}
function closeDetail() {
  state.selectedId = null;
  const d = document.getElementById('detail'), b = document.getElementById('backdrop');
  if (d) d.style.display = 'none';
  if (b) b.style.display = 'none';
}
function commit() { render(); updateDetailMeta(); }
function updateDetailMeta() {
  const c = cardById(state.selectedId); if (!c) return;
  const pct = percentages();
  const idx = state.cards.indexOf(c);
  const out = document.querySelector('#detail .dhead .pct');
  if (out) out.textContent = pct[idx] + '%';
}

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
function renderLyricAnalysis(c, container) {
  container.innerHTML = '';
  const text = c.lyrics || '';
  if (!text.trim()) { container.appendChild(el('div', { class: 'lyhint', text: 'Syllable counts and rhyme scheme appear here as you write.' })); return; }
  const lines = text.split('\n');
  const letters = LYRIC.scheme(lines);
  lines.forEach((ln, i) => {
    if (!ln.trim()) { container.appendChild(el('div', { class: 'lyrow blank' })); return; }
    container.appendChild(el('div', { class: 'lyrow' }, [
      el('span', { class: 'lysyl', text: LYRIC.lineSyll(ln) }),
      el('span', { class: 'lyltr', text: letters[i] }),
      el('span', { class: 'lytext', text: ln }),
    ]));
  });
  const note = verseCheck(text);
  if (note) container.appendChild(el('div', { class: 'lynote', text: note }));
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
    if (/^@.+/.test(t)) {
      const { name, sung } = splitCueMode(t.slice(1).trim(), defaultSung);
      inCharBlock = true; blockSung = sung;
      out.push({ type: 'cue', text: name }); continue;
    }
    if (/^~/.test(t)) { inCharBlock = true; out.push({ type: 'sung', text: t.slice(1).trim() }); continue; } // ~ forces this line only
    if (/^\(.*\)$/.test(t)) { out.push({ type: 'paren', text: t }); continue; }
    // Implicit cue: an ALL-CAPS line that opens a block (Fountain convention —
    // a blank line or section/cue must precede it, so caps lyrics aren't eaten).
    if (!inCharBlock && looksLikeCue(t)) {
      const { name, sung } = splitCueMode(t, defaultSung);
      inCharBlock = true; blockSung = sung;
      out.push({ type: 'cue', text: name }); continue;
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
    id: lid(), type: tok.type, text: tok.text || '', subtype: tok.subtype,
  }));
}
function linesToSeamless(lines, isSong) { return serializeRows(lines || [], isSong); }

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
const RICH_EL_LABELS = { cue: 'Character', sung: 'Lyrics', dialogue: 'Dialogue', paren: 'Parenthetical', action: 'Action', section: 'Section' };
const RICH_EL_CLASS  = { cue: 'lw-char', sung: 'lw-sung', dialogue: 'lw-dialogue', paren: 'lw-paren', action: 'lw-action', section: 'lw-section-row' };
const RICH_EL_CYCLE  = ['cue', 'dialogue', 'sung', 'paren', 'action', 'section'];

function buildRichEditor({ text, isSong, onSave, autofocus }) {
  const smartNext = (type) => (type === 'cue' || type === 'paren') ? (isSong ? 'sung' : 'dialogue') : type;
  const tabNext   = (type) => { const i = RICH_EL_CYCLE.indexOf(type); return RICH_EL_CYCLE[(i + 1) % RICH_EL_CYCLE.length]; };
  const mkLine = (type, t) => {
    const div = el('div', { class: 'ms-el ' + (RICH_EL_CLASS[type] || 'ms-el-blank'), 'data-type': type });
    div.contentEditable = 'true';
    let display = (t || '');
    if (type === 'paren')   display = display.replace(/^\(/, '').replace(/\)$/, '');
    if (type === 'section') display = display.replace(/^\[/, '').replace(/\]$/, '');
    div.textContent = display;
    return div;
  };
  const setLineType = (div, type) => { div.dataset.type = type; div.className = 'ms-el ' + (RICH_EL_CLASS[type] || 'ms-el-blank'); };
  const serializeLines = (lineEd) => serializeRows(
    [...lineEd.querySelectorAll('.ms-el')].map((div) => ({ type: div.dataset.type, text: (div.textContent || '').trim() })),
    isSong,
  );
  const getFocusedLine = (lineEd) => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    let n = sel.anchorNode;
    while (n && n !== lineEd) {
      if (n.nodeType === 1 && n.classList && n.classList.contains('ms-el')) return n;
      n = n.parentNode;
    }
    return null;
  };
  const placeCursorAt = (div, atEnd) => {
    div.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    if (atEnd) { r.selectNodeContents(div); r.collapse(false); }
    else { r.setStart(div, 0); r.collapse(true); }
    sel.removeAllRanges();
    sel.addRange(r);
  };

  const styleBar = el('div', { class: 'ms-style-bar' });
  const styleSel = el('select', { class: 'ms-style-sel' });
  const modKey = navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl+';
  Object.entries(RICH_EL_LABELS).forEach(([val, label]) => {
    const n = RICH_EL_CYCLE.indexOf(val) + 1;
    styleSel.appendChild(el('option', { value: val, text: n ? label + '  (' + modKey + n + ')' : label }));
  });
  styleBar.appendChild(styleSel);
  styleBar.appendChild(el('span', { class: 'ms-style-hint', text: 'Tab · cycle   Enter · new line   ' + modKey + '1–6 · jump' }));

  const lineEd = el('div', { class: 'ms-line-editor ms-sheet-content' });
  const toks = parseLyricLines(text || '', isSong);
  if (!toks.some((t) => t.type !== 'blank')) lineEd.appendChild(mkLine('cue', ''));
  else toks.forEach((tok) => lineEd.appendChild(mkLine(tok.type, tok.text)));

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
    if (line !== ac.lastFocus) { ac.lastFocus = line; ac.dismissed = false; ac.index = 0; }
    refreshAc(line);
  };
  lineEd.addEventListener('keyup', syncPicker);
  lineEd.addEventListener('click', syncPicker);
  lineEd.addEventListener('input', () => refreshAc(getFocusedLine(lineEd)));
  styleSel.addEventListener('mousedown', () => { styleSel._activeLine = getFocusedLine(lineEd); });
  styleSel.addEventListener('change', () => {
    const line = styleSel._activeLine || getFocusedLine(lineEd);
    if (line) { setLineType(line, styleSel.value); placeCursorAt(line, true); }
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
    // Final Draft-style direct jumps: Ctrl/⌘ + 1–6 set the current line's
    // element type outright, no Tab-cycling. Order matches RICH_EL_CYCLE so the
    // numbers line up with the style-bar labels (1 Character … 6 Section).
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      const newType = RICH_EL_CYCLE[parseInt(e.key, 10) - 1];
      setLineType(line, newType);
      styleSel.value = newType;
      placeCursorAt(line, true);
      refreshAc(line);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newType = smartNext(line.dataset.type);
      const newLine = mkLine(newType, '');
      line.after(newLine);
      placeCursorAt(newLine, false);
      styleSel.value = newType;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newType = tabNext(line.dataset.type);
      setLineType(line, newType);
      styleSel.value = newType;
      refreshAc(line);
    } else if (e.key === 'Backspace' && !line.textContent.trim()) {
      e.preventDefault();
      const target = line.previousElementSibling || line.nextElementSibling;
      line.remove();
      if (target) placeCursorAt(target, true);
    }
  });

  const richWrap = el('div', { class: 'ms-card-rich-editor' });
  richWrap.addEventListener('focusout', (e) => {
    if (richWrap.contains(e.relatedTarget)) return;
    closeAc();
    if (onSave) onSave(serializeLines(lineEd));
  });
  richWrap.appendChild(styleBar);
  richWrap.appendChild(lineEd);
  richWrap.appendChild(acBox);
  richWrap._focusFirst = () => {
    const first = lineEd.querySelector('.ms-el');
    if (first) { placeCursorAt(first, false); styleSel.value = first.dataset.type || 'cue'; }
  };
  if (autofocus) richWrap._focusFirst();
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

  const emitCard = (c) => {
    if (c.type === 'scene') {
      toks.push({ type: 'scene-header', text: c.title || 'Scene' });
      if (c.note && c.note.trim()) { toks.push({ type: 'blank' }); toks.push({ type: 'action', text: c.note }); toks.push({ type: 'blank' }); }
    } else if (c.type === 'beat') {
      if (c.note && c.note.trim()) { toks.push({ type: 'action', text: c.note }); toks.push({ type: 'blank' }); }
      if (c.lyrics && c.lyrics.trim()) { parseLyricLines(c.lyrics, c.type === 'song').forEach(pushLyric); toks.push({ type: 'blank' }); }
    } else if (c.type === 'song') {
      songNum++;
      toks.push({ type: 'song-num', num: songNum, title: c.title || 'Untitled' });
      toks.push({ type: 'blank' });
      if (c.lyrics && c.lyrics.trim()) parseLyricLines(c.lyrics, c.type === 'song').forEach(pushLyric);
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
      if (sc.note) { toks.push({ type: 'action', text: sc.note }); toks.push({ type: 'blank' }); }
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
    toks.push({ type: 'ms-title', text: (state.title || 'Untitled Show').toUpperCase() });
    toks.push({ type: 'blank' });
    toks.push({ type: 'blank' });
  }

  order.forEach((i) => {
    const c = state.cards[i];
    if ((c.act === '1' || c.act === '2A') && !actDone.one) {
      actDone.one = true;
      if (state.mode !== 'oneact' && msOpts.showActHeaders !== false) { toks.push({ type: 'act-header', text: 'ACT ONE' }); toks.push({ type: 'blank' }); }
    }
    if ((c.act === '2B' || c.act === '3') && !actDone.two) {
      actDone.two = true;
      if (state.mode === 'full') {
        toks.push({ type: 'ms-divider', text: 'INTERMISSION' });
        toks.push({ type: 'blank' });
        if (msOpts.showActHeaders !== false) { toks.push({ type: 'act-header', text: 'ACT TWO' }); toks.push({ type: 'blank' }); }
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
function buildBlocks(toks) {
  const blocks = [];
  let i = 0;
  while (i < toks.length) {
    const tok = toks[i];
    if (tok.type === 'cue') {
      const tokens = [tok];
      let j = i + 1;
      while (j < toks.length) {
        const nxt = toks[j];
        const isMajor = ['act-header', 'song-num', 'scene-header', 'ms-divider', 'ms-title', 'action', 'section'].includes(nxt.type);
        const isNewCue = nxt.type === 'cue' && tokens.some((t) => !['cue', 'blank'].includes(t.type));
        if (isMajor || isNewCue) break;
        tokens.push(nxt);
        j++;
      }
      i = j;
      blocks.push({ tokens, header: false, splittable: true, columns: null });
      continue;
    }
    if (tok.type === 'blank') { blocks.push({ tokens: [tok], blank: true, columns: null }); i++; continue; }
    const header = tok.type === 'act-header' || tok.type === 'scene-header' || tok.type === 'song-num';
    blocks.push({ tokens: [tok], header, splittable: false, columns: null });
    i++;
  }
  return blocks;
}

function paginateTokens(toks) { return paginateBlocks(buildBlocks(toks)); }

function paginateBlocks(blocks) {
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

  // Place one block's tokens. `header` units get orphan control. A block taller
  // than a whole page (rare) is split token-by-token so nothing ever clips.
  const placeUnit = (unit, header) => {
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
    placeUnit(b.tokens, !!b.header);
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

  return pages;
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
  } else if (tok.type === 'cue')      { container.appendChild(el('div', { class: 'lw-char', text: tok.text.toUpperCase() + (tok.contd ? " (CONT'D)" : '') }));
  } else if (tok.type === 'sung')     { container.appendChild(el('div', { class: 'lw-sung', text: tok.text }));
  } else if (tok.type === 'paren')    { container.appendChild(el('div', { class: 'lw-paren', text: tok.text }));
  } else if (tok.type === 'dialogue') { container.appendChild(el('div', { class: 'lw-dialogue', text: tok.text }));
  } else if (tok.type === 'action')   { container.appendChild(el('div', { class: 'lw-action', text: tok.text }));
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

  const grid = el('div', { class: 'ch-grid' });
  names.forEach((name) => {
    const data = merged[name];
    const apps = appearances[name] || [];
    const hue = charHue(name);
    const card = el('div', { class: 'ch-card' + (data.manual && !apps.length ? ' ch-manual' : '') });
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

    grid.appendChild(card);
  });
  host.appendChild(grid);
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
  if (page === 'titlepage') buildTitlePagesFull();
  if (page === 'manuscript') buildManuscriptPage(sceneId);
  if (page === 'characters') buildCharactersPage();
  if (page === 'export') buildExportPage();
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

function exportPDF(includeTitlePages) {
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
  const pages = paginateTokens(toks);
  pages.forEach((pageToks, pi) => {
    const sheet = el('div', { class: 'ms-sheet' });
    sheet.appendChild(renderSheetHeader(pi + 1, pages.length));
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

function buildExportPage() {
  const host = document.getElementById('page-export');
  host.innerHTML = '';

  const wrap = el('div', { class: 'exp-wrap' });

  // Export section
  const exportSection = el('div', { class: 'exp-section' });
  exportSection.appendChild(el('h2', { class: 'exp-heading', text: 'Save backup' }));
  exportSection.appendChild(el('p', { class: 'exp-desc', text: 'Download a .songplot file you can keep locally or move to another computer.' }));
  const expBtn = el('button', { class: 'pbtn exp-btn', text: '↓  Download ' + (state.title || 'show') + '.songplot' });
  expBtn.addEventListener('click', exportShow);
  if (state.readonly) {
    expBtn.disabled = true;
    exportSection.appendChild(el('p', { class: 'exp-note', text: 'Switch to a project (not a reference show) to export.' }));
  }
  exportSection.appendChild(expBtn);
  wrap.appendChild(exportSection);

  wrap.appendChild(el('div', { class: 'exp-divider' }));

  // Fountain export section
  const fountainSection = el('div', { class: 'exp-section' });
  fountainSection.appendChild(el('h2', { class: 'exp-heading', text: 'Export as Fountain' }));
  fountainSection.appendChild(el('p', { class: 'exp-desc', text: 'Download a .fountain file — plain text screenplay format compatible with Final Draft, Highland, and Fade In. Lyrics use standard Fountain character/dialogue blocks.' }));
  const ftnBtn = el('button', { class: 'pbtn exp-btn', text: '↓  Download ' + (state.title || 'show') + '.fountain' });
  ftnBtn.addEventListener('click', exportFountain);
  if (state.readonly) ftnBtn.disabled = true;
  fountainSection.appendChild(ftnBtn);
  wrap.appendChild(fountainSection);

  wrap.appendChild(el('div', { class: 'exp-divider' }));

  // Import section
  const importSection = el('div', { class: 'exp-section' });
  importSection.appendChild(el('h2', { class: 'exp-heading', text: 'Open backup' }));
  importSection.appendChild(el('p', { class: 'exp-desc', text: 'Load a .songplot file. It will be added as a new project and you can rename it.' }));
  const fileInput = el('input', { type: 'file', accept: '.songplot,.json', class: 'exp-file-input', id: 'exp-file-input' });
  const impLabel = el('label', { class: 'pbtn exp-btn', for: 'exp-file-input', text: '↑  Choose .songplot file…' });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) importShow(e.target.files[0]); });
  importSection.appendChild(impLabel);
  importSection.appendChild(fileInput);
  wrap.appendChild(importSection);

  host.appendChild(wrap);
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

function buildTitlePagesFull() {
  const host = document.getElementById('page-titlepage');
  host.innerHTML = '';

  const ZOOM_STEP = 0.15, ZOOM_MIN = 0.4, ZOOM_MAX = 2.0;
  let zoom = (() => { try { return parseFloat(localStorage.getItem('md-ms-zoom')) || 0.75; } catch (_) { return 0.75; } })();

  // Toolbar
  const toolbar = el('div', { class: 'ms-toolbar' });
  const zoomOut = el('button', { class: 'ms-zoom-btn', text: '−', title: 'Zoom out' });
  const zoomIn  = el('button', { class: 'ms-zoom-btn', text: '+', title: 'Zoom in' });
  const zoomLbl = el('span', { class: 'ms-zoom-lbl' });
  toolbar.appendChild(el('span', { class: 'ms-toolbar-title', text: 'Title Pages' }));
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  toolbar.appendChild(el('div', { class: 'ms-zoom-wrap' }, [zoomOut, zoomLbl, zoomIn]));
  host.appendChild(toolbar);

  // Page include checkboxes, grouped by what they affect.
  const checks = el('div', { class: 'tp-checks' });
  const groups = [
    { label: 'Title page', items: [
      { key: 'subtitle',        label: 'Subtitle',   defOff: true },
      { key: 'rule',            label: 'Title line', defOff: true },
      { key: 'draft',           label: 'Draft / date', defOff: true },
      { key: 'contact',         label: 'Contact info' },
    ] },
    { label: 'Additional pages', items: [
      { key: 'cast',            label: 'Cast of Characters' },
      { key: 'settings',        label: 'Settings' },
      { key: 'songs',           label: 'Songs' },
      { key: 'productionNotes', label: 'Production Notes' },
      { key: 'acknowledgements',label: 'Acknowledgements' },
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
      cb.addEventListener('change', () => {
        state.titlePage.include[key] = cb.checked;
        scheduleSave();
        renderViewport();
      });
      lbl.appendChild(cb);
      lbl.appendChild(el('span', { text: label }));
      group.appendChild(lbl);
    });
    checks.appendChild(group);
  });
  host.appendChild(checks);

  // Scrollable body
  const body = el('div', { class: 'ms-body' });
  host.appendChild(body);

  let viewport = null;
  const renderViewport = () => {
    body.innerHTML = '';
    viewport = buildTitlePages();
    viewport.style.zoom = zoom;
    body.appendChild(viewport);
  };

  const applyZoom = () => {
    if (viewport) viewport.style.zoom = zoom;
    zoomLbl.textContent = Math.round(zoom * 100) + '%';
    zoomOut.disabled = zoom <= ZOOM_MIN;
    zoomIn.disabled  = zoom >= ZOOM_MAX;
    try { localStorage.setItem('md-ms-zoom', zoom); } catch (_) {}
  };
  zoomOut.addEventListener('click', () => { zoom = Math.max(ZOOM_MIN, +(zoom - ZOOM_STEP).toFixed(2)); applyZoom(); });
  zoomIn.addEventListener('click',  () => { zoom = Math.min(ZOOM_MAX, +(zoom + ZOOM_STEP).toFixed(2)); applyZoom(); });

  renderViewport();
  applyZoom();
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
    const charNames = Object.keys(state.characters).sort();
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

function renderSheetHeader(pageNum, totalPages) {
  const sh = state.scriptHeader;
  const hdr = el('div', { class: 'ms-sheet-header' });
  if (!sh.enabled || (pageNum === 1 && !sh.firstPage)) {
    hdr.style.visibility = 'hidden';
    return hdr;
  }
  const text = (sh.format || '')
    .replace('{title}', (state.title || 'Untitled Show').toUpperCase())
    .replace('{date}', sh.revisionDate || '')
    .replace('{page}', pageNum);
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
  modeSeg.appendChild(editTab);
  modeSeg.appendChild(layoutTab);
  const printBtn = el('button', { class: 'ms-print-btn', title: 'Print / Save as PDF', text: '⎙ Print' });
  printBtn.addEventListener('click', () => exportPDF(true));
  const settingsBtn = el('button', { class: 'ms-settings-btn', title: 'Page settings', text: '⚙' });
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
    const pages = paginateTokens(toks);
    const viewport = el('div', { class: 'ms-viewport' });
    viewport.style.zoom = zoom;
    pages.forEach((pageToks, pi) => {
      const sheet = el('div', { class: 'ms-sheet' });
      sheet.appendChild(renderSheetHeader(pi + 1, pages.length));
      const content = el('div', { class: 'ms-sheet-content' });
      pageToks.forEach((tok) => renderPageToken(tok, content));
      sheet.appendChild(content);
      viewport.appendChild(sheet);
    });
    newBody.appendChild(viewport);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
  };

  // ── Edit mode (per-card sections) ───────────────────────────────
  // Which field holds a card's manuscript body. A card may carry both a board
  // synopsis (`note`) and written lines (`lyrics`) — e.g. a beat with a one-line
  // summary plus full dialogue. Edit the field that already has content (lyrics
  // wins, matching the Print view's preference); when empty, default by type.
  // The read source and write target MUST be the same field, or editing a card
  // that shows one field will silently overwrite the other.
  const cardField = (c) => {
    if ((c.lyrics || '').trim()) return 'lyrics';
    if ((c.note || '').trim()) return 'note';
    return c.type === 'scene' ? 'note' : 'lyrics';
  };

  const renderCardSection = (sec, c) => {
    sec.innerHTML = '';
    const text = (c[cardField(c)] || '').trim();
    const isEmpty = !text;
    const inner = el('div', { class: 'ms-card-content ms-sheet-content' + (isEmpty ? ' ms-card-section-empty' : '') });
    if (isEmpty) {
      const phText = state.readonly
        ? (c.type === 'scene' ? '(scene heading)' : c.type === 'beat' ? '' : '(lyrics not reproduced)')
        : (c.type === 'scene' ? '(scene heading — click to write)' : c.type === 'beat' ? '(new beat — click to write)' : '(no lyrics yet — click to write)');
      inner.appendChild(el('div', { class: 'ms-card-placeholder', text: phText }));
    } else {
      parseLyricLines(text, c.type === 'song').forEach((tok) => renderPageToken(tok, inner));
    }
    sec.appendChild(inner);
  };

  const enterCardEditRich = (sec, c) => {
    if (state.readonly) return; // references are read-only study objects
    if (sec.querySelector('.ms-card-rich-editor')) return;
    sec.innerHTML = '';
    sec.appendChild(buildRichEditor({
      text: c[cardField(c)] || '',
      isSong: c.type === 'song',
      autofocus: true,
      onSave: (val) => {
        c[cardField(c)] = val;
        doSave(); // persist immediately — blur may be followed by navigating away
        renderCardSection(sec, c);
      },
    }));
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

  const rebuildEdit = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });
    const doc = el('div', { class: 'ms-edit-doc' });

    editOrder().forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      const isEmpty = !(c[cardField(c)] || '').trim();
      const div = el('div', { class: 'ms-card-divider' + (isEmpty ? ' ms-card-divider-empty' : ''), 'data-card-id': c.id });
      const icon = c.type === 'song' ? '♪' : c.type === 'scene' ? '◆' : '●';
      div.appendChild(el('span', { class: 'ms-card-divider-label', text: icon + ' ' + (c.title || 'Untitled') }));
      doc.appendChild(div);
      const sec = el('div', { class: 'ms-card-section', 'data-card-id': c.id });
      renderCardSection(sec, c);
      sec.addEventListener('click', () => enterCardEditRich(sec, c));
      doc.appendChild(sec);
    });
    newBody.appendChild(doc);
    msWrap.insertBefore(newBody, msWrap.querySelector('.ms-hd-drawer'));
    newBody.scrollTop = scrollTop;
    if (refreshNav) refreshNav();
  };

  // ── Mode switching ───────────────────────────────────────────────
  const applyMode = () => {
    const isEdit = msMode === 'edit';
    editTab.classList.toggle('active', isEdit);
    layoutTab.classList.toggle('active', !isEdit);
    try { localStorage.setItem('md-ms-mode', msMode); } catch (_) {}
    applyNav(); // outline panel + Navigation button reflect Edit/Print state
    if (isEdit) { rebuildEdit(); applyZoom(); }
    else { rebuildSheets(); applyZoom(); }
  };
  editTab.addEventListener('click', () => { if (msMode !== 'edit') { msMode = 'edit'; applyMode(); } });
  layoutTab.addEventListener('click', () => { if (msMode !== 'layout') { msMode = 'layout'; applyMode(); } });

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

  const head = el('div', { class: 'lwhead' }, [
    pillEl,
    el('span', { class: 'lwtitle', text: c.title }),
    summary,
    el('span', { style: 'flex:1' }),
    toggleWrap,
    closeBtn,
  ]);

  // ---- editor ----
  const gutter = el('div', { class: 'lwgutter' });
  const editorPlaceholder = c.type === 'beat'
    ? 'Write the scene here…\n\nCHARACTER — a CAPS line is who speaks\nDialogue — plain text below the name\n(Parenthetical) — tone / action mid-line\nAction — plain line outside a character\nCHARACTER (sings) — mark a sung outburst\n[Scene] — section heading'
    : 'Write here…\n\nCHARACTER — a CAPS line is who sings\nLyrics — just type below the name (rhyme-tracked)\nCHARACTER (spoken) — mark a spoken aside\n(Parenthetical) — inline note\n[Chorus] — section chip (resets rhyme)\n[Scene 1: Title] — scene heading\n[#01 Title] — song number header';
  const editor = el('textarea', { class: 'lweditor', wrap: 'off', spellcheck: 'true', placeholder: editorPlaceholder });
  editor.value = c.lyrics || '';

  // ---- sidebar ----
  const side = el('div', { class: 'lwside' });
  const rin = el('input', { class: 'fi', type: 'text', placeholder: 'word to rhyme' });
  const res = el('div', { class: 'rhymeresults' });
  const vnote = el('div', { class: 'lwnote' });

  side.appendChild(el('span', { class: 'fl', text: 'Sections' }));
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
  side.appendChild(secBtns);
  // Rhyme tabs
  let rhymeMode = 'perfect';
  const rhymeTabWrap = el('div', { class: 'rhyme-tab-wrap', style: 'margin-top:6px' });
  const tabPerfect = el('button', { class: 'rhyme-tab active', text: 'Perfect' });
  const tabNear    = el('button', { class: 'rhyme-tab', text: 'Near' });
  rhymeTabWrap.appendChild(tabPerfect);
  rhymeTabWrap.appendChild(tabNear);
  side.appendChild(rhymeTabWrap);

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

  side.appendChild(rin);
  side.appendChild(res);
  side.appendChild(el('span', { class: 'fl muted', text: 'Notes', style: 'margin-top:6px' }));
  side.appendChild(vnote);

  // ---- panes ----
  const editPane = el('div', { class: 'lwbody' }, [gutter, editor, side]);
  const richPane = el('div', { class: 'lwrich-wrap', style: 'display:none' });

  const refresh = () => {
    c.lyrics = editor.value;
    updateGutter(c, gutter);
    updateSummary(c, summary);
    updateVerseNote(c, vnote);
    if (!rin._touched) { rin.value = LYRIC.lastWord(lastNonEmptyLine(editor.value)); showRhymes(rin.value); }
    scheduleSave();
  };

  editor.addEventListener('input', refresh);
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });
  rin.addEventListener('input', () => { rin._touched = true; showRhymes(rin.value); });

  const showEdit = () => {
    editor.value = c.lyrics || '';            // reflect any edits made in the Rich tab
    editPane.style.display = '';
    richPane.style.display = 'none';
    editBtn.classList.add('active');
    richBtn.classList.remove('active');
    updateGutter(c, gutter); updateSummary(c, summary); updateVerseNote(c, vnote);
    setTimeout(() => editor.focus(), 0);
  };

  const showRich = () => {
    richPane.innerHTML = '';
    richPane.appendChild(buildRichEditor({
      text: c.lyrics || '',
      isSong: c.type === 'song',
      autofocus: true,
      onSave: (val) => {
        if (val === (c.lyrics || '')) return;  // nothing changed (e.g. just viewing)
        c.lyrics = val;                        // keep the Fountain source in sync
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

  updateGutter(c, gutter); updateSummary(c, summary); updateVerseNote(c, vnote);
  rin.value = LYRIC.lastWord(lastNonEmptyLine(c.lyrics || ''));
  renderRhymesInsertable(rin.value, res, editor, refresh);
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
  if (state.selectedId) buildDetail();
}
function refreshLyricWindow() { if (state.lyricWinId) openLyricWindow(state.lyricWinId); }
function buildLyricLauncher(c) {
  const isBeat = c.type === 'beat';
  const wrap = el('div', { class: 'lyrics' });
  wrap.appendChild(el('span', { class: 'fl', text: isBeat ? 'Script' : 'Lyrics' }));
  const btn = el('button', { class: 'pbtn lyricopen', text: isBeat ? '✎  Open scene editor' : '✎  Open lyric editor' });
  btn.addEventListener('click', () => openLyricWindow(c.id));
  wrap.appendChild(btn);
  const lines = (c.lyrics || '').split('\n').filter((l) => l.trim());
  if (lines.length) {
    const syl = lines.reduce((s, l) => s + LYRIC.lineSyll(l), 0);
    const preview = isBeat
      ? `${lines.length} lines · "${lines[0].slice(0, 48)}${lines[0].length > 48 ? '…' : ''}"`
      : `${lines.length} lines · ${syl} syllables · "${lines[0].slice(0, 38)}${lines[0].length > 38 ? '…' : ''}"`;
    wrap.appendChild(el('div', { class: 'lyrprev', text: preview }));
  } else {
    wrap.appendChild(el('div', { class: 'lyrprev', text: isBeat ? 'No dialogue yet.' : 'No lyrics yet.' }));
  }
  return wrap;
}

function buildDetail() {
  const host = document.getElementById('detail');
  host.innerHTML = '';
  const c = cardById(state.selectedId);
  if (!c) { closeDetail(); return; }
  const pct = percentages()[state.cards.indexOf(c)];

  const head = el('div', { class: 'dhead' }, [
    c.type === 'song'
      ? el('span', { class: 'pill', 'data-fam': (FN[c.fn] || FN.ballad).fam, text: (FN[c.fn] || FN.ballad).label })
      : el('span', { class: 'pill beat-pill', text: (c.beatFn || '').trim() || 'Beat' }),
    el('span', { class: 'pct', text: pct + '%' }),
    el('span', { class: 'spacer' }),
    (() => { const b = el('button', { class: 'dclose', text: '✕', title: 'Close' }); b.addEventListener('click', closeDetail); return b; })(),
  ]);

  const body = el('div', { class: 'dbody' });
  body.appendChild(field('Title', textInput('title', c.title, (v) => { c.title = v; commit(); })));

  const laneOpts = LANES.map((l) => [l.key, l.label]);
  if (c.type === 'song') {
    const fnOpts = Object.entries(FN).map(([k, v]) => [k, v.label]);
    const statusOpts = Object.entries(STATUS).map(([k, v]) => [k, v.label]);
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Act', selectInput(laneOpts, c.act, (v) => { c.act = v; commit(); })),
      field('Function', selectInput(fnOpts, c.fn, (v) => { c.fn = v; commit(); })),
    ]));
    body.appendChild(field('Voicing / who sings', textInput('voicing', c.voicing, (v) => { c.voicing = v; commit(); })));
    const changeOpts = [['', '—'], ['positive', '+ Positive'], ['negative', '− Negative']];
    body.appendChild(field('Scene change', selectInput(changeOpts, c.change || '', (v) => { c.change = v || null; commit(); })));
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Duration (min)', numInput(c.min, (v) => { c.min = v; commit(); })),
      field('Status', selectInput(statusOpts, c.status || 'idea', (v) => { c.status = v; commit(); })),
    ]));
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Key', textInput('key', c.key, (v) => { c.key = v; }), 'blank = needs score'),
      field('Style', textInput('style', c.style, (v) => { c.style = v; })),
    ]));
    body.appendChild(field('', checkInput(c.diegetic, (v) => { c.diegetic = v; }, 'Diegetic — performed in-world (not inner-life)')));

    const singEmpty = !(c.purpose && c.purpose.trim());
    const sing = el('div', { class: 'sing' + (singEmpty ? ' empty' : '') }, [
      el('span', { class: 'fl', text: 'Why does this sing?' }),
      textareaInput(c.purpose, (v) => { c.purpose = v; const wrap = document.querySelector('#detail .sing'); if (wrap) wrap.classList.toggle('empty', !v.trim()); }, 'What does this number do that speech can\'t? What is different when it ends?'),
    ]);
    body.appendChild(sing);
    body.appendChild(buildLyricLauncher(c));
  } else if (c.type === 'scene') {
    body.appendChild(field('Act', selectInput(laneOpts, c.act, (v) => { c.act = v; commit(); })));
    body.appendChild(field('Note', textareaInput(c.note, (v) => { c.note = v; commit(); }, 'What happens in this scene?')));
  } else {
    body.appendChild(el('div', { class: 'fld row2' }, [
      field('Act', selectInput(laneOpts, c.act, (v) => { c.act = v; commit(); })),
      field('Duration (min)', numInput(c.min, (v) => { c.min = v; commit(); })),
    ]));
    body.appendChild(field('Note / what happens', textareaInput(c.note, (v) => { c.note = v; commit(); }, 'The book scene — what happens here?')));
    const changeOpts = [['', '—'], ['positive', '+ Positive'], ['negative', '− Negative']];
    body.appendChild(field('Scene change', selectInput(changeOpts, c.change || '', (v) => { c.change = v || null; commit(); })));
    body.appendChild(buildLyricLauncher(c));
  }

  const del = el('button', { class: 'dclose', text: 'Delete card', style: 'align-self:flex-start;color:#a32d2d;font-size:13px;padding:6px 0' });
  del.addEventListener('click', () => { const i = state.cards.indexOf(c); if (i >= 0) state.cards.splice(i, 1); closeDetail(); render(); });
  body.appendChild(del);

  host.appendChild(head);
  host.appendChild(body);
}

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
  document.getElementById('backdrop').addEventListener('click', closeDetail);
  document.getElementById('lyricwin').addEventListener('click', (e) => { if (e.target.id === 'lyricwin') closeLyricWindow(); });
  document.querySelectorAll('.tn-tab[data-page]').forEach((b) => {
    b.addEventListener('click', () => { if (!b.classList.contains('sb-disabled')) navigateTo(b.dataset.page); });
  });

  // show switcher popover
  document.getElementById('sb-show-btn').addEventListener('click', (e) => { e.stopPropagation(); showShowPopover(); });
  document.getElementById('sb-snapshots').addEventListener('click', (e) => { e.stopPropagation(); openSnapshotsDrawer(); });

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
      const fm = document.getElementById('folder-modal');
      if (fm && fm.style.display !== 'none') { closeFolderModal(); return; }
      const shm = document.getElementById('share-modal');
      if (shm && shm.style.display !== 'none') { closeShareModal(); return; }
      closeCardMenu();
      const ssm = document.getElementById('show-settings-modal');
      if (ssm && ssm.style.display !== 'none') { closeShowSettingsModal(); return; }
      const modal = document.getElementById('new-show-modal');
      if (modal && modal.style.display !== 'none') { closeNewShowModal(); return; }
      if (state.lyricWinId) closeLyricWindow(); else closeDetail();
    }
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('lib-card-menu');
    if (menu && !menu.contains(e.target)) closeCardMenu();
    const pop = document.getElementById('show-popover');
    if (pop && !pop.contains(e.target) && !document.getElementById('sb-show-btn').contains(e.target)) {
      closeShowPopover();
    }
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
  else if (state.selectedId) buildDetail();
}).catch(() => {});
