// Story-beat research (2026-09-24): parses the 20 Save-the-Cat beat sheets in
// ./sheets (written by two research agents from published synopses; own-words
// summaries, no lyrics) and places every unit on two clocks: the corpus song-
// minute clock and a card clock (every song and book beat = one card). Feeds
// MUSICAL-BEAT-BOARD.md. Run: node corpus/story-beats/board.mjs (or checks.mjs).

// Exploratory: what the corpus says about the BOOK — the edges between songs.
// Reads the same sources as analyze-merged + build-atlas-data. Scratch only.
import { readFileSync } from 'fs';
const DIR = '/Users/colin/Documents/Claude/Musical Designer';
const C = `${DIR}/corpus/`;
const BATCHES = ['winners', 'extras', 'classics', 'batch4', 'batch5', 'batch6', 'batch7', 'batch8', 'batch9', 'batch10'];
const mods = await Promise.all(BATCHES.map(n => import(`${C}corpus-${n}.mjs`)));
const corpus = Object.assign({}, ...mods.map(m => Object.values(m)[0]));

const dsrc = readFileSync(`${DIR}/app/data.js`, 'utf8');
const { SHOWS, FN } = new Function(dsrc + '\n;return { SHOWS, FN };')();
const asrc = readFileSync(`${DIR}/app/atlas-data.js`, 'utf8');
const { ATLAS_DATA, ATLAS_SHOWS } = new Function(asrc + '\n;return { ATLAS_DATA, ATLAS_SHOWS };')();
const bsrc = readFileSync(`${C}build-atlas-data.mjs`, 'utf8');
const NAMES = new Function('return ' + bsrc.match(/const NAMES = (\{[\s\S]*?\n\});/)[1])();

const FNKEY = { 'i want': 'iwant', 'act finale': 'finale', 'finale ultimo': 'finaleultimo' };
const atlasBy = new Map();
for (const r of ATLAS_DATA) {
  if (!atlasBy.has(r.show)) atlasBy.set(r.show, []);
  atlasBy.get(r.show).push({ ...r, fn: FNKEY[r.fn] || r.fn });
}
const meta = new Map(ATLAS_SHOWS.map(s => [s.show, s]));
const kindOf = (form) => form === 'two-act' ? 'full' : /^one-act/.test(form || '') ? 'one' : form === 'film' ? 'film' : null;

const voiceClass = (v) => {
  if (!v) return null;
  const t = v.trim();
  if (/company|ensemble|co\.|men|women|chorus|all|full|kids|daughters|boys|girls|townsfolk|crowd|fates|workers/i.test(t)) return 'group';
  const parts = t.split(/\s*(?:,|\+|&|and)\s*/i).filter(Boolean);
  return parts.length >= 3 ? 'group' : parts.length === 2 ? 'duet' : 'solo';
};

const shows = [];
for (const [key, d] of Object.entries(corpus)) {
  const title = NAMES[key] || key;
  const at = atlasBy.get(title) || [];
  if (at.length !== d.songs.length) console.warn('title join mismatch', key, at.length, d.songs.length);
  const songs = d.songs.map(([half, fn, voice, min], i) => ({ half, fn, voice, min, t: at[i]?.t, pos: at[i]?.pos, of: at[i]?.of }));
  shows.push({ key, title, src: 'corpus', kind: kindOf(d.form), year: meta.get(title)?.year ?? d.year, region: d.region || 'bway', songs });
}
const LANES = ['1', '2A', '2B', '3'];
for (const [key, s] of Object.entries(SHOWS)) {
  const k = kindOf(s.form);
  if (!k) continue; // ten-minute
  const cards = (s.cards || []).filter(c => LANES.includes(c.lane || c.act));
  const at = atlasBy.get(s.title) || [];
  const songs = [];
  cards.forEach((c) => {
    if (c.type !== 'song' || !c.fn) return;
    const l = c.lane || c.act, a = at[songs.length];
    songs.push({ half: (l === '1' || l === '2A') ? 'A1' : 'A2', fn: c.fn, voice: voiceClass(c.voicing) || 'group', min: c.min || 0, t: c.title, pos: a?.pos, of: a?.of, lane: l });
  });
  shows.push({ key, title: s.title, src: 'shelf', kind: k, year: s.year, region: 'bway', songs, cards });
}
console.log('shows', shows.length, 'songs', shows.reduce((a, s) => a + s.songs.length, 0),
  'kinds', JSON.stringify(shows.reduce((a, s) => (a[s.kind] = (a[s.kind] || 0) + 1, a), {})));

// ===== parse the agents' beat sheets and place every unit on two clocks =====
import { readdirSync } from 'fs';
const BD = '/Users/colin/Documents/Claude/Musical Designer/corpus/story-beats/sheets/';
const BEATS = ['Opening Image','Theme Stated','Set-Up','Catalyst','Debate','Break into Two','B Story','Fun and Games','Midpoint','Bad Guys Close In','All Is Lost','Dark Night of the Soul','Break into Three','Finale','Final Image'];
const norm = (t) => (t || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9()]+/g, ' ').trim();
const strip = (t) => norm((t || '').replace(/\([^)]*\)/g, ''));
const canon = (l) => { const x = l.trim().toLowerCase(); return BEATS.find(b => x.startsWith(b.toLowerCase())) || null; };
const sheets = [];
for (const f of readdirSync(BD).filter(f => f.endsWith('.txt'))) {
  const slug = f.replace('.txt', '');
  const show = shows.find(s => s.key === slug);
  if (!show) { console.warn('no corpus show for', slug); continue; }
  const txt = readFileSync(BD + f, 'utf8');
  const head = (txt.match(/^###.*$/m) || [''])[0];
  const units = [];
  for (const ln of txt.split('\n')) {
    const m = ln.match(/^\s*(A[12])\s*\|\s*(S\*|S~|S|B|\/)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*)$/);
    if (!m) continue;
    const [, act, type, title, label, event] = m;
    units.push({ act, type, title, labels: label === '-' ? [] : label.split('+').map(canon).filter(Boolean), rawLabel: label, event });
  }
  // song-minute clock, recomputed the same way for shelf and corpus rows
  const tot = show.songs.reduce((a, x) => a + x.min, 0); let cum = 0;
  const clock = show.songs.map(x => { const p = (cum + x.min / 2) / tot; cum += x.min; return p; });
  const a1share = show.songs.filter(x => x.half === 'A1').reduce((a, x) => a + x.min, 0) / tot;
  // compound corpus rows ("Tonight (Quintet) / The Rumble") become one slot per part,
  // each at its share of the row's minutes; a unit may match the whole row or a part
  const slots = []; let cum2 = 0;
  show.songs.forEach((x, j) => {
    const parts = (x.t || '').split(' / ');
    parts.forEach((pt, k) => slots.push({ part: pt, j, pos: (cum2 + x.min * (k + 0.5) / parts.length) / tot }));
    cum2 += x.min;
  });
  const usedSlot = new Set(), usedSong = new Set();
  const take = (i) => { usedSlot.add(i); usedSong.add(slots[i].j); return slots[i]; };
  for (const u of units) if (u.type === 'S' || u.type === 'S~') {
    let hit = null;
    const whole = show.songs.findIndex((x, j) => !usedSong.has(j) && x.t.includes(' / ') && norm(x.t) === norm(u.title));
    if (whole >= 0) { slots.forEach((sl, i) => { if (sl.j === whole) usedSlot.add(i); }); usedSong.add(whole); hit = { j: whole, pos: clock[whole] }; }
    for (const test of [(a, b) => norm(a) === norm(b), (a, b) => strip(a) === strip(b), (a, b) => strip(a).startsWith(strip(b)) || strip(b).startsWith(strip(a))]) {
      if (hit) break;
      const i = slots.findIndex((sl, i) => !usedSlot.has(i) && test(sl.part, u.title));
      if (i >= 0) hit = take(i);
    }
    if (hit) { u.pos = hit.pos; u.fn = show.songs[hit.j].fn; u.voice = show.songs[hit.j].voice; } else u.unmatched = true;
  }
  const used = usedSong;
  // interpolate unanchored units (B, S*, unmatched S) between anchored neighbours
  const idx = units.map((u, i) => i).filter(i => units[i].type !== '/');
  for (let k = 0; k < idx.length; k++) {
    const u = units[idx[k]]; if (u.pos != null) continue;
    let a = k - 1; while (a >= 0 && units[idx[a]].pos == null) a--;
    let b = k + 1; while (b < idx.length && units[idx[b]].pos == null) b++;
    const pa = a >= 0 ? units[idx[a]].pos : 0, pb = b < idx.length ? units[idx[b]].pos : 1;
    u.pos = pa + (pb - pa) * (k - a) / (b - a); u.interp = true;
  }
  const cards = idx.map(i => units[i]);
  cards.forEach((u, i) => { u.card = (i + 0.5) / cards.length; });
  const a1cards = cards.filter(u => u.act === 'A1').length;
  sheets.push({ slug, title: show.title, year: show.year, head, units, cards, a1share, a1cardShare: a1cards / cards.length,
    scenes: { A1: units.filter(u => u.type === '/' && u.act === 'A1').length, A2: units.filter(u => u.type === '/' && u.act === 'A2').length },
    unmatched: units.filter(u => u.unmatched).map(u => u.title), missing: show.songs.filter((x, i) => !used.has(i)).map(x => x.t) });
}
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : NaN; };
const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : NaN; };
const P = (x) => isNaN(x) ? '  —' : String(Math.round(100 * x)).padStart(3) + '%';
console.log(`\n${sheets.length} sheets:`, sheets.map(s => s.slug).join(', '));
for (const s of sheets) {
  const nS = s.cards.filter(u => u.type[0] === 'S').length, nB = s.cards.filter(u => u.type === 'B').length;
  console.log(`  ${s.title.padEnd(26)} S ${String(nS).padStart(2)}  B ${String(nB).padStart(2)}  scenes ${s.scenes.A1}+${s.scenes.A2}  A1 song-min ${P(s.a1share)} A1 cards ${P(s.a1cardShare)}${s.unmatched.length ? '  UNMATCHED: ' + s.unmatched.join(' / ') : ''}${s.missing.length ? '  NOT IN SHEET: ' + s.missing.join(' / ') : ''}`);
}
// ---- per beat: where it lands (two clocks), sung vs spoken, which act, which song functions carry it
console.log('\n== BEATS: first occurrence per show ==');
console.log('beat'.padEnd(22), 'shows', ' songClock med [IQR]     cardClock med [IQR]   sung  A2   carried-by fn');
for (const b of BEATS) {
  const hits = sheets.map(s => ({ s, u: s.cards.find(u => u.labels.includes(b)) })).filter(x => x.u);
  if (!hits.length) { console.log(b.padEnd(22), '0'); continue; }
  const sc = hits.map(x => x.u.pos), cc = hits.map(x => x.u.card);
  const sung = hits.filter(x => x.u.type[0] === 'S').length, a2 = hits.filter(x => x.u.act === 'A2').length;
  const fns = {}; hits.filter(x => x.u.fn).forEach(x => fns[x.u.fn] = (fns[x.u.fn] || 0) + 1);
  console.log(b.padEnd(22), String(hits.length).padStart(3), '  ', P(med(sc)), `[${P(q(sc, .25))}–${P(q(sc, .75))}]`, '   ', P(med(cc)), `[${P(q(cc, .25))}–${P(q(cc, .75))}]`, '  ', `${sung}/${hits.length}`.padStart(5), String(a2).padStart(3), '  ', Object.entries(fns).sort((a, c) => c[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
}
// ---- zones: how many units each beat/zone occupies per show (for the 40-card allocation)
console.log('\n== ZONE SIZE (units labelled with the beat, per show; S/B split) ==');
let grand = 0; const zone = {};
for (const b of BEATS) {
  const per = sheets.map(s => s.cards.filter(u => u.labels.includes(b)));
  const n = per.map(p => p.length), sN = per.map(p => p.filter(u => u.type[0] === 'S').length), bN = per.map(p => p.filter(u => u.type === 'B').length);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  zone[b] = avg(n); grand += avg(n);
  console.log(b.padEnd(22), 'avg units', avg(n).toFixed(1).padStart(5), '  songs', avg(sN).toFixed(1).padStart(4), '  book', avg(bN).toFixed(1).padStart(4));
}
console.log('avg units per show', grand.toFixed(1), '→ 40-card allocation:', BEATS.map(b => `${b} ${(40 * zone[b] / grand).toFixed(1)}`).join(' · '));
// ---- midpoint vs intermission
console.log('\n== MIDPOINT ==');
for (const s of sheets) {
  const m = s.cards.find(u => u.labels.includes('Midpoint'));
  const a1last = [...s.cards].reverse().find(u => u.act === 'A1');
  console.log(`  ${s.title.padEnd(26)}`, m ? `${m.act} ${m.type} ${(m.title !== '-' ? m.title : '').slice(0, 28).padEnd(28)} ${m.rawLabel.padEnd(26)} ${m === a1last ? '= LAST A1 UNIT' : ''}` : 'none');
}
export { sheets, BEATS };
