// Beat-structure analysis: map the 42-show corpus onto story-guide beat
// windows (Save the Cat / Field / Vogler / Harmon / Bell / chiasmus) and
// measure lane boundaries from the carded shelf.
import { readFileSync } from 'fs';
import { WINNERS } from './corpus-winners.mjs';
import { EXTRAS } from './corpus-extras.mjs';
import { CLASSICS } from './corpus-classics.mjs';
import { BATCH4 } from './corpus-batch4.mjs';
import { BATCH5 } from './corpus-batch5.mjs';
import { BATCH6 } from './corpus-batch6.mjs';
import { BATCH7 } from './corpus-batch7.mjs';

const src = readFileSync('/Users/colin/Documents/Claude/Musical Designer/app/data.js', 'utf8');
const { SHOWS } = new Function(src + '\n;return { SHOWS };')();

const LANES = ['1', '2A', '2B', '3'];
const laneOf = (c) => c.lane || c.act;
const all = []; // {fn, pos, form}

for (const [key, show] of Object.entries(SHOWS)) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  let cum = 0;
  for (const c of cards) {
    if (c.type === 'song' && c.fn) all.push({ fn: c.fn, pos: (cum + (c.min || 0) / 2) / total, form: show.form });
    cum += c.min || 0;
  }
}
for (const data of Object.values({ ...WINNERS, ...EXTRAS, ...CLASSICS, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7 })) {
  const total = data.songs.reduce((s, t) => s + t[3], 0);
  let cum = 0;
  for (const [, fn, , min] of data.songs) {
    all.push({ fn, pos: (cum + min / 2) / total, form: data.form });
    cum += min;
  }
}

// ---- Save the Cat beat windows (as % of story) ----
const WINDOWS = [
  ['Opening Image / Ordinary World', 0.00, 0.05],
  ['Theme Stated + Setup',           0.05, 0.10],
  ['Catalyst',                       0.10, 0.15],
  ['Debate',                         0.15, 0.22],
  ['Break Into Two',                 0.22, 0.28],
  ['Fun & Games / B Story',          0.28, 0.45],
  ['Midpoint approach',              0.45, 0.50],
  ['MIDPOINT (Bell mirror)',         0.50, 0.58],
  ['Bad Guys Close In',              0.58, 0.72],
  ['All Is Lost',                    0.72, 0.80],
  ['Dark Night of the Soul',         0.80, 0.86],
  ['Break Into Three / Resurrection',0.86, 0.94],
  ['Finale / Final Image',           0.94, 1.01],
];

console.log('== SONG FUNCTIONS BY BEAT WINDOW (n=' + all.length + ' songs, 42 shows) ==\n');
for (const [name, lo, hi] of WINDOWS) {
  const in_ = all.filter(s => s.pos >= lo && s.pos < hi);
  const byFn = {};
  in_.forEach(s => byFn[s.fn] = (byFn[s.fn] || 0) + 1);
  const top = Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([f, n]) => `${f} ${Math.round(100 * n / in_.length)}%`).join(' · ');
  console.log(`${(Math.round(lo * 100) + '–' + Math.round(hi * 100) + '%').padEnd(9)} ${name.padEnd(34)} n=${String(in_.length).padStart(3)}  ${top}`);
}

// ---- lane boundaries from the carded shelf ----
console.log('\n== LANE BOUNDARIES (carded shelf, cumulative % of card-minutes) ==');
const bounds = { '1': [], '2A': [], '2B': [] };
for (const [key, show] of Object.entries(SHOWS)) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  let cum = 0; const acc = {};
  for (const c of cards) { cum += c.min || 0; acc[laneOf(c)] = cum; }
  let run = 0;
  for (const l of ['1', '2A', '2B']) { run = acc[l] ?? run; bounds[l].push(run / total); }
}
const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log('lane 1 ends at', Math.round(100 * avg(bounds['1'])) + '%',
  '| 2A (interm) at', Math.round(100 * avg(bounds['2A'])) + '%',
  '| 2B ends at', Math.round(100 * avg(bounds['2B'])) + '%');

// ---- what's singing at Bell's mirror (50±4%)? ----
const mid = all.filter(s => s.pos >= 0.46 && s.pos <= 0.54);
const mc = {}; mid.forEach(s => mc[s.fn] = (mc[s.fn] || 0) + 1);
console.log('\n== AT THE MIRROR (46–54%) ==', 'n=' + mid.length);
console.log(Object.entries(mc).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f}:${n}`).join('  '));

// ---- A2 soliloquy cluster (Dark Night check) ----
const solA2 = all.filter(s => s.fn === 'soliloquy' && s.pos > 0.5);
console.log('\nA2 soliloquies: n=' + solA2.length, 'avg', Math.round(100 * avg(solA2.map(s => s.pos))) + '%',
  'positions:', solA2.map(s => Math.round(s.pos * 100) + '%').join(', '));
