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
  titlePage: { subtitle: 'A musical', authors: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true } },
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
  const [act, title, fn, voicing, min, energy, tension] = t;
  return { id: uid(), type: 'song', act, title, fn, voicing, min, energy, tension };
}
function cardFromObj(o) {
  const act = o.lane || o.act;
  if (o.type === 'beat') return { id: uid(), type: 'beat', act, title: o.title, note: o.note || '', min: o.min || 1.5 };
  if (o.type === 'scene') return { id: uid(), type: 'scene', act, title: o.title };
  return { id: uid(), type: 'song', act, title: o.title, fn: o.fn, voicing: o.voicing, min: o.min, energy: o.energy, tension: o.tension };
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
  saveLastOpened('reference', key);
  state.loading = true;
  state.showKey = key;
  const show = SHOWS[key];
  if (show.cards) state.cards = show.cards.map(cardFromObj);
  else { const lanes = assignLanes(show.numbers); state.cards = show.numbers.map((t, i) => { const c = cardFromTuple(t); c.act = lanes[i]; return c; }); }
  state.characters = {};
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

function openProject(id, afterOpen) {
  saveLastOpened('project', id);
  fetch('/api/shows/' + id).then((r) => r.json()).then((d) => {
    state.loading = true;
    state.cards = (d.cards || []).map(cardFromStored);
    state.characters = d.characters || {};
    const tpDefaults = { subtitle: 'A musical', authors: '', contactName: '', contactAddress: '', contactPhone: '', contactEmail: '', representedBy: '', settings: [], productionNotes: '', acknowledgements: '', include: { contact: true, cast: true, settings: true, songs: true, productionNotes: true, acknowledgements: true } };
    state.titlePage = Object.assign({}, tpDefaults, d.titlePage || {});
    state.titlePage.include = Object.assign({}, tpDefaults.include, (d.titlePage || {}).include || {});
    const shDefaults = { enabled: true, format: '{title} – {date} – {page}.', revisionDate: '', alignment: 'right', firstPage: false };
    state.scriptHeader = Object.assign({}, shDefaults, d.scriptHeader || {});
    state.title = d.title || 'Untitled show';
    state.mode = d.mode || 'full';
    state.status = d.status || 'active';
    state.folder = d.folder || '';
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
  e.textContent = s === 'saving' ? 'Saving…' : s === 'saved' ? 'Saved ✓' : s === 'ref' ? 'Reference · read-only' : s === 'error' ? 'Save failed' : '';
  e.className = 'saveind sb-saveind' + (s === 'ref' ? ' ref' : '') + (s === 'error' ? ' err' : '');
}
function renderShowBtn() {
  const nameEl = document.getElementById('sb-show-name');
  if (nameEl) nameEl.textContent = state.title || (state.showKey && SHOWS[state.showKey] ? SHOWS[state.showKey].title : '—');
}

function closeShowPopover() {
  const pop = document.getElementById('show-popover');
  if (pop) pop.remove();
}

function showShowPopover() {
  if (document.getElementById('show-popover')) { closeShowPopover(); return; }
  const btn = document.getElementById('sb-show-btn');
  if (!btn) return;

  const pop = el('div', { class: 'show-popover', id: 'show-popover' });

  const closeRow = el('div', { class: 'sp-close-row' });
  closeRow.appendChild(el('span', { class: 'sp-close-label', text: 'Shows' }));
  const closeBtn = el('button', { class: 'sp-close-btn', title: 'Close' });
  closeBtn.innerHTML = '<svg viewBox="0 0 10 6" width="10" height="6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); });
  closeRow.appendChild(closeBtn);
  pop.appendChild(closeRow);

  const libLink = el('button', { class: 'sp-item sp-liblink', text: '▤  Library' });
  libLink.addEventListener('click', (e) => { e.stopPropagation(); closeShowPopover(); navigateTo('library'); });
  pop.appendChild(libLink);

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

  document.body.appendChild(pop);
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
function buildCard(c, trueIdx, pct) {
  const top = el('div', { class: 'top' });
  if (c.type === 'song') {
    const meta = FN[c.fn] || FN.ballad;
    top.appendChild(el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label }));
    top.appendChild(el('span', { class: 'pct', text: pct + '%' }));
  } else if (c.type === 'beat') {
    top.appendChild(el('span', { class: 'pill beat-pill', text: 'Beat' }));
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
function verseCheck(text) {
  // treat section headers, cues, directions, and dialogue as separators or skip them
  const normalized = (text || '').replace(/^\[.+\]$/gm, '').replace(/^@.+$/gm, '').replace(/^\(.+\)$/gm, '');
  const sections = normalized.split(/\n\s*\n/).map((s) => s.split('\n').filter((l) => isSungLine(l))).filter((s) => s.length >= 2);
  if (sections.length < 2) return '';
  const base = sections[0].map((l) => LYRIC.lineSyll(l));
  for (let v = 1; v < sections.length; v++) {
    for (let i = 0; i < Math.min(base.length, sections[v].length); i++) {
      const s = LYRIC.lineSyll(sections[v][i]);
      if (s !== base[i]) return `Section ${v + 1}, line ${i + 1}: ${s} syllables vs ${base[i]} in section 1 — may not sit on the same tune.`;
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
function parseLyricLines(text) {
  let inCharBlock = false;
  return (text || '').split('\n').map((ln) => {
    const t = ln.trim();
    if (!t) { inCharBlock = false; return { type: 'blank', text: '' }; }
    if (/^\[.+\]$/.test(t)) {
      inCharBlock = false;
      const inner = t.slice(1, -1);
      let subtype = 'section';
      if (/^act[\s\d]/i.test(inner)) subtype = 'act';
      else if (/^scene[\s\d]/i.test(inner)) subtype = 'scene';
      else if (/^#\d+[\s\-]/i.test(inner)) subtype = 'song-num';
      return { type: 'section', subtype, text: inner };
    }
    if (/^@.+/.test(t)) { inCharBlock = true; return { type: 'cue', text: t.slice(1).trim() }; }
    if (/^~/.test(t)) { inCharBlock = true; return { type: 'sung', text: t.slice(1).trim() }; }
    if (/^\(.*\)$/.test(t)) return { type: 'paren', text: t };
    if (inCharBlock) return { type: 'dialogue', text: ln };
    return { type: 'action', text: ln };
  });
}

function renderLyricTokens(tokens, container) {
  for (const tok of tokens) {
    if (tok.type === 'section') {
      if (tok.subtype === 'act') {
        container.appendChild(el('div', { class: 'lw-act-header', text: tok.text.toUpperCase() }));
      } else if (tok.subtype === 'scene') {
        container.appendChild(el('div', { class: 'lw-scene-header', text: tok.text.toUpperCase() }));
      } else if (tok.subtype === 'song-num') {
        const m = tok.text.match(/^#(\d+)[\s\-](.*)/i);
        container.appendChild(el('div', { class: 'lw-song-header', text: m ? `(#${m[1]}) ${m[2].toUpperCase()}` : tok.text }));
      } else {
        container.appendChild(el('div', { class: 'lw-section-row' }, [el('span', { class: 'lw-section-tag', text: tok.text })]));
      }
    } else if (tok.type === 'cue') {
      container.appendChild(el('div', { class: 'lw-char', text: tok.text.toUpperCase() }));
    } else if (tok.type === 'sung') {
      container.appendChild(el('div', { class: 'lw-sung', text: tok.text }));
    } else if (tok.type === 'paren') {
      container.appendChild(el('div', { class: 'lw-paren', text: tok.text }));
    } else if (tok.type === 'dialogue') {
      container.appendChild(el('div', { class: 'lw-dialogue', text: tok.text }));
    } else if (tok.type === 'action') {
      container.appendChild(el('div', { class: 'lw-action', text: tok.text }));
    } else {
      container.appendChild(el('div', { class: 'lw-blank' }));
    }
  }
}

function buildLyricPreview(c) {
  const tokens = parseLyricLines(c.lyrics || '');
  const wrap = el('div', { class: 'lw-preview ms-sheet-content' });
  if (!tokens.some((t) => t.type !== 'blank')) {
    wrap.appendChild(el('div', { class: 'lw-preview-hint', text: 'No content yet — switch to Edit to start writing.' }));
    return wrap;
  }
  tokens.forEach((tok) => renderPageToken(tok, wrap));
  return wrap;
}

// ---- manuscript view (paginated) ----
const MS_LINES = 56;
const MS_HDR_LINES = 4;

function tokenCost(tok) {
  if (!tok || tok.type === 'blank') return 1;
  if (tok.type === 'act-header') return 3;
  if (tok.type === 'scene-header') return 2;
  if (tok.type === 'song-num') return 2;
  if (tok.type === 'ms-divider') return 3;
  if (tok.type === 'section') return tok.subtype === 'act' ? 3 : tok.subtype === 'scene' || tok.subtype === 'song-num' ? 2 : 1;
  if (tok.type === 'cue') return 2;    // lw-char has margin-top: 12pt = 1 extra line
  if (tok.type === 'action') return 2; // lw-action has margin-top: 12pt = 1 extra line
  return 1;
}

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
      if (c.lyrics && c.lyrics.trim()) { parseLyricLines(c.lyrics).forEach(pushLyric); toks.push({ type: 'blank' }); }
    } else if (c.type === 'song') {
      songNum++;
      toks.push({ type: 'song-num', num: songNum, title: c.title || 'Untitled' });
      toks.push({ type: 'blank' });
      if (c.lyrics && c.lyrics.trim()) parseLyricLines(c.lyrics).forEach(pushLyric);
      else toks.push({ type: 'action', text: '(no lyrics yet)' });
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

function paginateTokens(toks) {
  const pages = [];
  let page = [], lines = MS_HDR_LINES;
  const flush = () => { pages.push(page); page = []; lines = MS_HDR_LINES; };

  let i = 0;
  while (i < toks.length) {
    const tok = toks[i];

    // Collect character block: cue + content until paragraph break or major element
    if (tok.type === 'cue') {
      const block = [tok];
      let j = i + 1;
      while (j < toks.length) {
        const nxt = toks[j];
        const isMajor = ['act-header', 'song-num', 'scene-header', 'ms-divider', 'ms-title', 'action', 'section'].includes(nxt.type);
        const isNewCue = nxt.type === 'cue' && block.some((t) => !['cue', 'blank'].includes(t.type));
        if (isMajor || isNewCue) break;
        block.push(nxt);
        j++;
      }
      i = j;
      const cost = block.reduce((s, t) => s + tokenCost(t), 0);
      const lastBlank = block[block.length - 1]?.type === 'blank' ? tokenCost(block[block.length - 1]) : 0;
      if (lines + cost - lastBlank > MS_LINES && cost <= MS_LINES - MS_HDR_LINES) flush();
      block.forEach((t) => { page.push(t); lines += tokenCost(t); });
      continue;
    }

    if (tok.type === 'act-header' && lines > MS_HDR_LINES + 3) flush();
    if (tok.type === 'scene-header' && lines > MS_HDR_LINES + 5) flush();
    const cost = tokenCost(tok);
    if (tok.type === 'song-num' && lines > MS_LINES - 6) flush();
    else if (lines + cost > MS_LINES && tok.type !== 'blank') flush();
    page.push(tok);
    lines += cost;
    i++;
  }
  if (page.length) pages.push(page);

  // Mark CONT'D: if same character's cue is both last on page N and first on page N+1
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
    const lines = c.lyrics.split('\n');
    const seen = new Set();
    lines.forEach((ln) => {
      const m = ln.trim().match(/^@(.+)/);
      if (!m) return;
      const name = m[1].trim().toUpperCase();
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

function buildCharactersPage() {
  const host = document.getElementById('page-characters');
  host.innerHTML = '';

  const { merged, appearances } = extractCharacters();
  const names = Object.keys(merged).sort();

  const toolbar = el('div', { class: 'ch-toolbar' });
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
  toolbar.appendChild(syncBtn);
  if (!state.readonly) toolbar.appendChild(addBtn);
  host.appendChild(toolbar);

  if (!names.length) {
    const empty = el('div', { class: 'ch-empty' });
    empty.appendChild(el('div', { class: 'ch-empty-icon', text: '◎' }));
    empty.appendChild(el('p', { text: 'No characters yet. Add @NAME cues in your lyrics, then click Sync.' }));
    host.appendChild(empty);
    return;
  }

  const grid = el('div', { class: 'ch-grid' });
  names.forEach((name) => {
    const data = merged[name];
    const apps = appearances[name] || [];
    const card = el('div', { class: 'ch-card' + (data.manual && !apps.length ? ' ch-manual' : '') });

    const cardHead = el('div', { class: 'ch-card-head' });
    cardHead.appendChild(el('span', { class: 'ch-name', text: name }));
    if (data.manual && !apps.length) cardHead.appendChild(el('span', { class: 'ch-tag ch-tag-manual', text: 'manual' }));
    else cardHead.appendChild(el('span', { class: 'ch-count', text: apps.length + ' song' + (apps.length !== 1 ? 's' : '') }));
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
  document.querySelectorAll('.sb-item').forEach((b) => {
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
  fetch('/styles.css').then((r) => r.text()).then((cssText) => {
    const allSheets = [];

    if (includeTitlePages) {
      const tp = buildTitlePages();
      tp.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
      Array.from(tp.children).forEach((sheet) => allSheets.push(sheet.outerHTML));
    }

    const toks = buildContentTokens(null);
    const pages = paginateTokens(toks);
    pages.forEach((pageToks, pi) => {
      const sheet = document.createElement('div');
      sheet.className = 'ms-sheet';
      sheet.appendChild(renderSheetHeader(pi + 1, pages.length));
      const content = document.createElement('div');
      content.className = 'ms-sheet-content';
      pageToks.forEach((tok) => renderPageToken(tok, content));
      sheet.appendChild(content);
      allSheets.push(sheet.outerHTML);
    });

    const title = (state.title || 'Untitled').replace(/</g, '&lt;');
    const sheetsHTML = allSheets.join('\n');

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Print Preview — ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>${cssText}</style>
<style>
  body { margin: 0; background: #666; display: block; }
  .pdf-toolbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; gap: 10px; padding: 10px 20px; background: #2c2c2c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; box-sizing: border-box; }
  .pdf-toolbar-title { flex: 1; font-weight: 600; opacity: 0.9; }
  .pdf-btn { padding: 7px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .pdf-btn-print { background: #0077ff; color: #fff; }
  .pdf-btn-close { background: rgba(255,255,255,0.12); color: #fff; }
  .pdf-btn:hover { opacity: 0.82; }
  .pdf-content { padding: 28px 0; display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .ms-sheet { flex-shrink: 0; }
  @media print {
    @page { size: letter; margin: 0; }
    body { background: white; }
    .pdf-toolbar { display: none !important; }
    .pdf-content { padding: 0; gap: 0; }
    .ms-sheet { border-radius: 0 !important; box-shadow: none !important; margin: 0 !important; break-after: page; }
    .ms-sheet:last-child { break-after: avoid; }
  }
</style>
</head><body>
<div class="pdf-toolbar">
  <span class="pdf-toolbar-title">Print Preview — ${title}</span>
  <button class="pdf-btn pdf-btn-close" onclick="window.close()">✕  Close</button>
  <button class="pdf-btn pdf-btn-print" onclick="window.print()">⎙  Print / Save as PDF</button>
</div>
<div class="pdf-content">
${sheetsHTML}
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=960,height=860');
    if (!win) {
      URL.revokeObjectURL(url);
      alert('Pop-up blocked — please allow pop-ups for this page.');
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
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

  // PDF export section
  const pdfSection = el('div', { class: 'exp-section' });
  pdfSection.appendChild(el('h2', { class: 'exp-heading', text: 'Print / Export PDF' }));
  pdfSection.appendChild(el('p', { class: 'exp-desc', text: 'Opens the manuscript in a print-ready window. Use your browser\'s Save as PDF to export.' }));
  const tpToggleWrap = el('label', { class: 'exp-toggle' });
  const tpCb = el('input', { type: 'checkbox' });
  tpCb.checked = true;
  tpToggleWrap.appendChild(tpCb);
  tpToggleWrap.appendChild(el('span', { text: 'Include title pages' }));
  pdfSection.appendChild(tpToggleWrap);
  const pdfBtn = el('button', { class: 'pbtn exp-btn', text: '⎙  Print / Save as PDF…' });
  pdfBtn.addEventListener('click', () => exportPDF(tpCb.checked));
  pdfSection.appendChild(pdfBtn);
  wrap.appendChild(pdfSection);

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

  // Page include checkboxes
  const checks = el('div', { class: 'tp-checks' });
  const pages = [
    { key: 'contact',         label: 'Contact info' },
    { key: 'cast',            label: 'Cast of Characters' },
    { key: 'settings',        label: 'Settings' },
    { key: 'songs',           label: 'Songs' },
    { key: 'productionNotes', label: 'Production Notes' },
    { key: 'acknowledgements',label: 'Acknowledgements' },
  ];
  checks.appendChild(el('span', { class: 'tp-checks-label', text: 'Include pages:' }));
  pages.forEach(({ key, label }) => {
    const lbl = el('label', { class: 'tp-check-item' });
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state.titlePage.include[key];
    if (state.readonly) cb.disabled = true;
    cb.addEventListener('change', () => {
      state.titlePage.include[key] = cb.checked;
      scheduleSave();
      renderViewport();
    });
    lbl.appendChild(cb);
    lbl.appendChild(el('span', { text: label }));
    checks.appendChild(lbl);
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

  p1c.appendChild(el('div', { class: 'tp-spacer-large' }));
  p1c.appendChild(tpEditable('div', 'tp-show-title', (state.title || 'UNTITLED').toUpperCase(), '_title_readonly'));
  p1c.appendChild(el('div', { class: 'tp-rule' }));
  p1c.appendChild(el('div', { class: 'tp-spacer' }));
  p1c.appendChild(tpEditable('div', 'tp-subtitle', tp.subtitle || 'A musical', 'subtitle'));
  p1c.appendChild(el('div', { class: 'tp-spacer' }));
  p1c.appendChild(tpEditable('div', 'tp-authors', tp.authors || 'By Your Name', 'authors'));

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

  // Title bar
  const titleBar = el('div', { class: 'ms-hd-titlebar' });
  titleBar.appendChild(el('span', { class: 'ms-hd-title', text: 'Header settings' }));
  const closeBtn = el('button', { class: 'ms-hd-close', text: '✕', title: 'Close' });
  closeBtn.addEventListener('click', () => { drawer.classList.remove('open'); });
  titleBar.appendChild(closeBtn);
  inner.appendChild(titleBar);

  const row = (label, control) => {
    const r = el('div', { class: 'ms-hd-row' });
    r.appendChild(el('label', { class: 'ms-hd-label', text: label }));
    r.appendChild(control);
    return r;
  };

  // Enable toggle
  const enabledCb = el('input', { type: 'checkbox' });
  enabledCb.checked = sh.enabled;
  enabledCb.addEventListener('change', () => { sh.enabled = enabledCb.checked; scheduleSave(); onUpdate(); });
  inner.appendChild(row('Show header', enabledCb));

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
  inner.appendChild(row('Format', fmtWrap));

  // Revision date
  const dateIn = el('input', { class: 'fi', type: 'text', value: sh.revisionDate || '' });
  dateIn.placeholder = '3/30/18, DRAFT, Workshop…';
  dateIn.addEventListener('input', () => { sh.revisionDate = dateIn.value; scheduleSave(); onUpdate(); });
  inner.appendChild(row('Revision / date', dateIn));

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
  inner.appendChild(row('Alignment', alignSeg));

  // First page toggle
  const fpCb = el('input', { type: 'checkbox' });
  fpCb.checked = sh.firstPage;
  fpCb.addEventListener('change', () => { sh.firstPage = fpCb.checked; scheduleSave(); onUpdate(); });
  inner.appendChild(row('Show on page 1', fpCb));

  // Preview
  const preview = el('div', { class: 'ms-hd-preview' });
  const updatePreview = () => {
    const text = (sh.format || '')
      .replace('{title}', (state.title || 'Untitled Show').toUpperCase())
      .replace('{date}', sh.revisionDate || '')
      .replace('{page}', '8');
    preview.textContent = sh.enabled ? text : '(disabled)';
    preview.style.textAlign = sh.alignment || 'right';
    preview.style.opacity = sh.enabled ? '1' : '0.4';
  };
  updatePreview();
  // patch onUpdate to also refresh preview
  const origOnUpdate = onUpdate;
  onUpdate = () => { origOnUpdate(); updatePreview(); };
  // re-wire listeners to use new onUpdate — simpler: just refresh preview on all events too
  [enabledCb, fmtIn, dateIn, fpCb].forEach((el_) => el_.addEventListener('input', updatePreview));
  [enabledCb, fpCb].forEach((el_) => el_.addEventListener('change', updatePreview));
  alignSeg.querySelectorAll('button').forEach((b) => b.addEventListener('click', updatePreview));
  inner.appendChild(el('div', { class: 'ms-hd-preview-label', text: 'Preview' }));
  inner.appendChild(preview);

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

  const backBtn = el('button', { class: 'ms-back-btn', title: 'Back to Board' });
  backBtn.textContent = '← Board';
  backBtn.addEventListener('click', () => navigateTo('board'));

  const modeBtn = el('button', { class: 'ms-mode-btn' });
  const settingsBtn = el('button', { class: 'ms-settings-btn', title: 'Page settings', text: '⚙' });

  const saveMsOpts = () => { try { localStorage.setItem('md-ms-opts', JSON.stringify(state.msOptions)); } catch (_) {} };

  toolbar.appendChild(backBtn);
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  toolbar.appendChild(zoomWrap);
  toolbar.appendChild(el('span', { style: 'flex:1' }));
  toolbar.appendChild(modeBtn);
  toolbar.appendChild(settingsBtn);

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
  const renderCardSection = (sec, c) => {
    sec.innerHTML = '';
    const isEmpty = !(c.lyrics || '').trim() && !(c.note || '').trim();
    const inner = el('div', { class: 'ms-card-content ms-sheet-content' + (isEmpty ? ' ms-card-section-empty' : '') });
    if (isEmpty) {
      const phText = c.type === 'scene' ? '(scene heading — click to write)' : c.type === 'beat' ? '(new beat — click to write)' : '(no lyrics yet — click to write)';
      inner.appendChild(el('div', { class: 'ms-card-placeholder', text: phText }));
    } else {
      parseLyricLines(c.lyrics || c.note || '').forEach((tok) => renderPageToken(tok, inner));
    }
    sec.appendChild(inner);
  };

  // ── Rich line editor ─────────────────────────────────────────────
  const EL_LABELS = { cue: 'Character', sung: 'Lyrics', dialogue: 'Dialogue', paren: 'Parenthetical', action: 'Action', section: 'Section' };
  const EL_CLASS  = { cue: 'lw-char', sung: 'lw-sung', dialogue: 'lw-dialogue', paren: 'lw-paren', action: 'lw-action', section: 'lw-section-row' };
  const EL_CYCLE  = ['cue', 'dialogue', 'sung', 'paren', 'action', 'section'];
  const smartNext = (type, isSong) => (type === 'cue' || type === 'paren') ? (isSong ? 'sung' : 'dialogue') : type;
  const tabNext   = (type) => { const i = EL_CYCLE.indexOf(type); return EL_CYCLE[(i + 1) % EL_CYCLE.length]; };

  const mkLine = (type, text) => {
    const div = el('div', { class: 'ms-el ' + (EL_CLASS[type] || 'ms-el-blank'), 'data-type': type });
    div.contentEditable = 'true';
    let display = (text || '');
    if (type === 'paren')   display = display.replace(/^\(/, '').replace(/\)$/, '');
    if (type === 'section') display = display.replace(/^\[/, '').replace(/\]$/, '');
    div.textContent = display;
    return div;
  };
  const setLineType = (div, type) => {
    div.dataset.type = type;
    div.className = 'ms-el ' + (EL_CLASS[type] || 'ms-el-blank');
  };
  const serializeLines = (lineEd) => {
    const parts = [];
    lineEd.querySelectorAll('.ms-el').forEach((div) => {
      const type = div.dataset.type;
      const text = (div.textContent || '').trim();
      if (!text) { parts.push(''); return; }
      if (type === 'cue')      parts.push('@' + text);
      else if (type === 'sung')     parts.push('~' + text);
      else if (type === 'paren')    parts.push('(' + text + ')');
      else if (type === 'section')  parts.push('[' + text + ']');
      else parts.push(text);
    });
    return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };
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

  const enterCardEditRich = (sec, c) => {
    if (sec.querySelector('.ms-card-rich-editor')) return;
    sec.innerHTML = '';
    const isSong = c.type === 'song';

    // Style bar
    const styleBar = el('div', { class: 'ms-style-bar' });
    const styleSel = el('select', { class: 'ms-style-sel' });
    Object.entries(EL_LABELS).forEach(([val, label]) => styleSel.appendChild(el('option', { value: val, text: label })));
    styleBar.appendChild(styleSel);
    styleBar.appendChild(el('span', { class: 'ms-style-hint', text: 'Tab · change style   Enter · new line' }));

    // Line editor (inherits font/padding from ms-sheet-content)
    const lineEd = el('div', { class: 'ms-line-editor ms-sheet-content' });

    // Build lines from tokens
    const toks = parseLyricLines(c.lyrics || c.note || '');
    const hasContent = toks.some((t) => t.type !== 'blank');
    if (!hasContent) {
      lineEd.appendChild(mkLine('cue', ''));
    } else {
      toks.forEach((tok) => lineEd.appendChild(mkLine(tok.type, tok.text)));
    }

    // Sync style picker to focused line
    const syncPicker = () => {
      const line = getFocusedLine(lineEd);
      if (line) styleSel.value = line.dataset.type;
    };
    lineEd.addEventListener('keyup', syncPicker);
    lineEd.addEventListener('click', syncPicker);

    // Style picker: capture focused line on mousedown (before contenteditable blurs)
    styleSel.addEventListener('mousedown', () => { styleSel._activeLine = getFocusedLine(lineEd); });
    styleSel.addEventListener('change', () => {
      const line = styleSel._activeLine || getFocusedLine(lineEd);
      if (line) { setLineType(line, styleSel.value); placeCursorAt(line, true); }
    });

    // Keyboard handling
    lineEd.addEventListener('keydown', (e) => {
      const line = getFocusedLine(lineEd);
      if (!line) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newType = smartNext(line.dataset.type, isSong);
        const newLine = mkLine(newType, '');
        line.after(newLine);
        placeCursorAt(newLine, false);
        styleSel.value = newType;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const newType = tabNext(line.dataset.type);
        setLineType(line, newType);
        styleSel.value = newType;
      } else if (e.key === 'Backspace' && !line.textContent.trim()) {
        e.preventDefault();
        const target = line.previousElementSibling || line.nextElementSibling;
        line.remove();
        if (target) placeCursorAt(target, true);
      }
    });

    // Save on blur leaving the entire rich editor
    const richWrap = el('div', { class: 'ms-card-rich-editor' });
    richWrap.addEventListener('focusout', (e) => {
      if (richWrap.contains(e.relatedTarget)) return;
      const val = serializeLines(lineEd);
      if (c.type === 'beat') c.note = val; else c.lyrics = val;
      autoSave();
      renderCardSection(sec, c);
    });

    richWrap.appendChild(styleBar);
    richWrap.appendChild(lineEd);
    sec.appendChild(richWrap);

    const firstLine = lineEd.querySelector('.ms-el');
    if (firstLine) { placeCursorAt(firstLine, false); styleSel.value = firstLine.dataset.type || 'cue'; }
  };

  const rebuildEdit = () => {
    const oldBody = msWrap.querySelector('.ms-body');
    const scrollTop = oldBody ? oldBody.scrollTop : 0;
    if (oldBody) oldBody.remove();
    const newBody = el('div', { class: 'ms-body' });
    const doc = el('div', { class: 'ms-edit-doc' });
    const order = displayOrder();
    order.forEach((idx) => {
      const c = state.cards[idx];
      if (!c) return;
      const isEmpty = !(c.lyrics || '').trim() && !(c.note || '').trim();
      const div = el('div', { class: 'ms-card-divider' + (isEmpty ? ' ms-card-divider-empty' : '') });
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
  };

  // ── Mode switching ───────────────────────────────────────────────
  const applyMode = () => {
    const isEdit = msMode === 'edit';
    modeBtn.textContent = isEdit ? '⊞ Print View' : '✎ Edit';
    modeBtn.classList.toggle('active', isEdit);
    try { localStorage.setItem('md-ms-mode', msMode); } catch (_) {}
    if (isEdit) { rebuildEdit(); applyZoom(); }
    else { rebuildSheets(); applyZoom(); }
  };
  modeBtn.addEventListener('click', () => { msMode = msMode === 'edit' ? 'layout' : 'edit'; applyMode(); });

  // ── Settings drawer ──────────────────────────────────────────────
  const drawer = buildHeaderDrawer(() => { if (msMode === 'layout') rebuildSheets(); else rebuildEdit(); });
  const drawerInner = drawer.querySelector('.ms-hd-inner');
  drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));
  const mkDrawerToggle = (label, key, defaultVal) => {
    if (state.msOptions[key] === undefined) state.msOptions[key] = defaultVal !== false;
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state.msOptions[key];
    cb.addEventListener('change', () => {
      state.msOptions[key] = cb.checked;
      saveMsOpts();
      if (msMode === 'layout') rebuildSheets(); else rebuildEdit();
    });
    const r = el('div', { class: 'ms-hd-row' });
    r.appendChild(el('label', { class: 'ms-hd-label', text: label }));
    r.appendChild(cb);
    return r;
  };
  drawerInner.appendChild(mkDrawerToggle('Show title', 'showTitle', false));
  drawerInner.appendChild(mkDrawerToggle('Act headers', 'showActHeaders', true));
  drawerInner.appendChild(mkDrawerToggle('Section tags', 'showSectionTags', true));
  drawerInner.appendChild(el('div', { class: 'ms-hd-divider' }));

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

  msWrap.appendChild(drawer);
  settingsBtn.addEventListener('click', () => drawer.classList.toggle('open'));

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
  const lines = (c.lyrics || '').split('\n');
  const letters = LYRIC.scheme(lines);
  lines.forEach((ln, i) => {
    if (isSectionHeader(ln) || isCueLine(ln)) {
      gutter.appendChild(el('div', { class: 'lwg-row lwg-section' }));
      return;
    }
    const sung = isSungLine(ln);
    const sungText = sung ? ln.trim().slice(1).trim() : '';
    gutter.appendChild(el('div', { class: 'lwg-row' }, [
      el('span', { class: 'g-letter', text: sung ? letters[i] : '' }),
      el('span', { class: 'g-syl', text: sung ? LYRIC.lineSyll(sungText) : '' }),
    ]));
  });
}
function updateSummary(c, node) {
  const lines = (c.lyrics || '').split('\n');
  const sungLines = lines.filter(isSungLine);
  const syl = sungLines.reduce((s, l) => s + LYRIC.lineSyll(l), 0);
  const scheme = LYRIC.scheme(lines).filter(Boolean).join('');
  node.textContent = `${sungLines.length} sung lines · ${syl} syllables` + (scheme ? ` · ${scheme.length > 20 ? scheme.slice(0, 20) + '…' : scheme}` : '');
}
function updateVerseNote(c, node) {
  const n = verseCheck(c.lyrics || '');
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

  const editBtn = el('button', { class: 'lwtoggle active', text: 'Edit' });
  const prevBtn = el('button', { class: 'lwtoggle', text: 'Preview' });
  const toggleWrap = el('div', { class: 'lwtoggle-wrap' }, [editBtn, prevBtn]);

  const sungBtn = el('button', { class: 'lwsungbtn', title: 'Toggle ~ sung prefix on selected lines (makes them rhyme-tracked)' });
  sungBtn.innerHTML = '<span class="sung-tilde">~</span> Sung';

  const pillEl = c.type === 'song'
    ? (() => { const meta = FN[c.fn] || FN.ballad; return el('span', { class: 'pill', 'data-fam': meta.fam, text: meta.label }); })()
    : el('span', { class: 'pill beat-pill', text: 'Beat' });

  const head = el('div', { class: 'lwhead' }, [
    pillEl,
    el('span', { class: 'lwtitle', text: c.title }),
    summary,
    el('span', { style: 'flex:1' }),
    sungBtn,
    toggleWrap,
    closeBtn,
  ]);

  // ---- editor ----
  const gutter = el('div', { class: 'lwgutter' });
  const editorPlaceholder = c.type === 'beat'
    ? 'Write the scene here…\n\n@CHARACTER — who speaks\nDialogue — plain text\n(Parenthetical) — tone / action mid-line\nAction — italicised stage direction\n~Sung line — prefix with ~ for rhyme tracking\n[Scene] — section heading'
    : 'Write here…\n\n@CHARACTER — who sings\n~Sung line — prefix with ~ for rhyme tracking\n(Parenthetical) — inline note\nPlain text — action / stage description\n[Chorus] — section chip (resets rhyme)\n[Scene 1: Title] — scene heading\n[#01 Title] — song number header';
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
  const previewPane = el('div', { class: 'lwpreview-wrap', style: 'display:none' });

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

  sungBtn.addEventListener('click', () => {
    const text = editor.value;
    const selStart = editor.selectionStart, selEnd = editor.selectionEnd;
    const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
    const rawLineEnd = selEnd === selStart ? text.indexOf('\n', selStart) : text.indexOf('\n', selEnd - 1);
    const lineEnd = rawLineEnd === -1 ? text.length : rawLineEnd;
    const chunk = text.slice(lineStart, lineEnd);
    const lines = chunk.split('\n');
    const allSung = lines.every((l) => !l.trim() || /^~/.test(l.trim()));
    const transformed = lines.map((l) => {
      if (!l.trim()) return l;
      if (allSung) return l.replace(/^~\s*/, '');
      return /^~/.test(l.trim()) ? l : '~' + l;
    }).join('\n');
    editor.value = text.slice(0, lineStart) + transformed + text.slice(lineEnd);
    editor.selectionStart = lineStart;
    editor.selectionEnd = lineStart + transformed.length;
    editor.focus();
    refresh();
  });

  const showEdit = () => {
    editPane.style.display = '';
    previewPane.style.display = 'none';
    sungBtn.style.display = '';
    editBtn.classList.add('active');
    prevBtn.classList.remove('active');
    setTimeout(() => editor.focus(), 0);
  };
  const LZOOM_KEY = 'md-lw-zoom';
  const LZOOM_STEP = 0.1, LZOOM_MIN = 0.5, LZOOM_MAX = 2.0;
  let lzoom = (() => { try { return parseFloat(localStorage.getItem(LZOOM_KEY)) || 1.0; } catch (_) { return 1.0; } })();

  const showPreview = () => {
    previewPane.innerHTML = '';

    const zoomBar = el('div', { class: 'lwzoom-bar' });
    const zOut = el('button', { class: 'ms-zoom-btn', text: '−' });
    const zLbl = el('span',  { class: 'ms-zoom-lbl' });
    const zIn  = el('button', { class: 'ms-zoom-btn', text: '+' });
    zoomBar.appendChild(zOut); zoomBar.appendChild(zLbl); zoomBar.appendChild(zIn);
    previewPane.appendChild(zoomBar);

    const preview = buildLyricPreview(c);
    previewPane.appendChild(preview);

    const applyLZoom = () => {
      preview.style.zoom = lzoom;
      zLbl.textContent = Math.round(lzoom * 100) + '%';
      zOut.disabled = lzoom <= LZOOM_MIN;
      zIn.disabled  = lzoom >= LZOOM_MAX;
      try { localStorage.setItem(LZOOM_KEY, lzoom); } catch (_) {}
    };
    zOut.addEventListener('click', () => { lzoom = Math.max(LZOOM_MIN, +(lzoom - LZOOM_STEP).toFixed(2)); applyLZoom(); });
    zIn.addEventListener('click',  () => { lzoom = Math.min(LZOOM_MAX, +(lzoom + LZOOM_STEP).toFixed(2)); applyLZoom(); });
    applyLZoom();

    editPane.style.display = 'none';
    previewPane.style.display = '';
    sungBtn.style.display = 'none';
    editBtn.classList.remove('active');
    prevBtn.classList.add('active');
  };
  editBtn.addEventListener('click', showEdit);
  prevBtn.addEventListener('click', showPreview);

  win.appendChild(head);
  win.appendChild(editPane);
  win.appendChild(previewPane);

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
      : el('span', { class: 'pill beat-pill', text: 'Beat' }),
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
  document.querySelectorAll('.sb-item[data-page]').forEach((b) => {
    b.addEventListener('click', () => { if (!b.classList.contains('sb-disabled')) navigateTo(b.dataset.page); });
  });

  // show switcher popover
  document.getElementById('sb-show-btn').addEventListener('click', (e) => { e.stopPropagation(); showShowPopover(); });

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

  const logoutBtn = document.getElementById('sb-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => { window.location.href = '/login.html'; }).catch(() => { window.location.href = '/login.html'; });
  });

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
navigateTo('library');
loadProjects().then(() => {
  try {
    const last = JSON.parse(localStorage.getItem('md-last') || 'null');
    if (last && last.type === 'project') {
      const exists = state.projects.find((p) => p.id === last.val);
      if (exists) { openProject(last.val); return; }
    }
    if (last && last.type === 'reference' && SHOWS[last.val]) { openReference(last.val); return; }
  } catch (_) {}
  openReference('fiddler');
});

// Load the pronouncing dictionary; refresh an open song editor once ready.
fetch('cmudict.txt').then((r) => r.text()).then((t) => {
  LYRIC.load(t);
  if (state.lyricWinId) refreshLyricWindow();
  else if (state.selectedId) buildDetail();
}).catch(() => {});
