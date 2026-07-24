// Survey the reference SHOWS in data.js: songs + minutes per lane,
// intermission placement %, function distribution.
import { readFileSync } from 'fs';

const src = readFileSync('/Users/colin/Documents/Claude/Musical Designer/app/data.js', 'utf8');
// data.js is a non-module script; eval it in a sandboxed function and grab consts.
const fn = new Function(src + '\n;return { SHOWS, DEFAULT_TEMPLATE };');
const { SHOWS, DEFAULT_TEMPLATE } = fn();

const LANES = ['1', '2A', '2B', '3'];
const rows = [];
for (const [key, show] of Object.entries(SHOWS)) {
  const cards = show.cards || [];
  const songs = cards.filter(c => c.type === 'song');
  if (!songs.length) continue; // prose novels
  const laneSongs = {}, laneMin = {}, laneAllMin = {};
  for (const l of LANES) { laneSongs[l] = 0; laneMin[l] = 0; laneAllMin[l] = 0; }
  for (const c of cards) {
    const l = c.lane || c.act;
    if (!LANES.includes(l)) continue;
    const m = c.min || 0;
    laneAllMin[l] += m;
    if (c.type === 'song') { laneSongs[l]++; laneMin[l] += m; }
  }
  const totalSongs = songs.length;
  const totalMin = LANES.reduce((s, l) => s + laneAllMin[l], 0);
  const act1Songs = laneSongs['1'] + laneSongs['2A'];
  const act2Songs = laneSongs['2B'] + laneSongs['3'];
  const act1Min = laneAllMin['1'] + laneAllMin['2A'];
  rows.push({
    key, form: show.form, totalSongs, act1Songs, act2Songs,
    laneSongs: LANES.map(l => laneSongs[l]).join('/'),
    interPct: totalMin ? Math.round(100 * act1Min / totalMin) : null,
    totalMin: Math.round(totalMin),
  });
}

console.log('show            form      songs  A1/A2   by lane(1/2A/2B/3)  interm%  ~min');
for (const r of rows) {
  console.log(
    r.key.padEnd(15), (r.form || '').padEnd(9),
    String(r.totalSongs).padEnd(6),
    `${r.act1Songs}/${r.act2Songs}`.padEnd(7),
    r.laneSongs.padEnd(19),
    String(r.interPct ?? '-').padEnd(8),
    r.totalMin
  );
}

const twoAct = rows.filter(r => r.form === 'two-act');
const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log('\nTWO-ACT AVERAGES (n=' + twoAct.length + ')');
console.log('  avg total songs :', avg(twoAct.map(r => r.totalSongs)).toFixed(1));
console.log('  avg A1 songs    :', avg(twoAct.map(r => r.act1Songs)).toFixed(1));
console.log('  avg A2 songs    :', avg(twoAct.map(r => r.act2Songs)).toFixed(1));
console.log('  avg interm %    :', avg(twoAct.filter(r => r.interPct).map(r => r.interPct)).toFixed(1));
console.log('  A1:A2 ratio     :', (avg(twoAct.map(r => r.act1Songs)) / avg(twoAct.map(r => r.act2Songs))).toFixed(2));

// Function distribution: which fns appear in which half, across two-act shows
const fnHalf = {};
for (const [key, show] of Object.entries(SHOWS)) {
  if (show.form !== 'two-act') continue;
  for (const c of (show.cards || [])) {
    if (c.type !== 'song' || !c.fn) continue;
    const l = c.lane || c.act;
    const half = (l === '1' || l === '2A') ? 'A1' : 'A2';
    fnHalf[c.fn] = fnHalf[c.fn] || { A1: 0, A2: 0 };
    fnHalf[c.fn][half]++;
  }
}
console.log('\nFN distribution across two-act shows (A1 / A2):');
for (const [f, v] of Object.entries(fnHalf).sort((a, b) => (b[1].A1 + b[1].A2) - (a[1].A1 + a[1].A2))) {
  console.log(' ', f.padEnd(13), String(v.A1).padStart(3), '/', String(v.A2).padStart(3));
}

// Current template for contrast
const t = { songs: {}, min: {} };
for (const l of LANES) { t.songs[l] = 0; t.min[l] = 0; }
for (const c of DEFAULT_TEMPLATE) { t.songs[c.act]++; t.min[c.act] += c.min || 0; }
const tTotal = LANES.reduce((s, l) => s + t.min[l], 0);
console.log('\nCURRENT DEFAULT_TEMPLATE:');
console.log('  songs by lane:', LANES.map(l => `${l}:${t.songs[l]}`).join('  '),
  '| A1', t.songs['1'] + t.songs['2A'], 'vs A2', t.songs['2B'] + t.songs['3']);
console.log('  min by lane  :', LANES.map(l => `${l}:${t.min[l]}`).join('  '),
  '| interm at', Math.round(100 * (t.min['1'] + t.min['2A']) / tTotal) + '%', 'of', tTotal, 'min');
console.log('  fns in order :', DEFAULT_TEMPLATE.map(c => c.act + ':' + c.fn).join(', '));
