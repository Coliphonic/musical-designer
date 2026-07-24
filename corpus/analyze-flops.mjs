// The survivorship test: do flops deviate from the measured beat map, or
// follow it? Compares the flop control group against the hit corpus on
// (a) act balance, (b) beat-conformity (mean |song position − corpus mean
// position for its function|), (c) presence of the four load-bearing beats.
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

const shows = []; // {name, flop, form, songs:[{fn,pos,half}]}
for (const [key, show] of Object.entries(SHOWS)) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  let cum = 0; const songs = [];
  for (const c of cards) {
    if (c.type === 'song' && c.fn) {
      const l = laneOf(c);
      songs.push({ fn: c.fn, pos: (cum + (c.min || 0) / 2) / total,
        half: (l === '1' || l === '2A') ? 'A1' : 'A2', min: c.min || 0 });
    }
    cum += c.min || 0;
  }
  shows.push({ name: key, flop: false, form: show.form, songs });
}
for (const [name, data] of Object.entries({ ...WINNERS, ...EXTRAS, ...CLASSICS, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7 })) {
  const total = data.songs.reduce((s, t) => s + t[3], 0);
  let cum = 0;
  const songs = data.songs.map(([half, fn, , min]) => {
    const pos = (cum + min / 2) / total; cum += min;
    return { fn, pos, half, min };
  });
  shows.push({ name, flop: !!data.flop, form: data.form, songs });
}

// corpus mean position per fn (hits only, so flops are scored against the hit map)
const fnPos = {};
for (const s of shows.filter(x => !x.flop)) for (const g of s.songs) {
  (fnPos[g.fn] = fnPos[g.fn] || []).push(g.pos);
}
const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const fnMean = Object.fromEntries(Object.entries(fnPos).map(([f, a]) => [f, avg(a)]));

const conformity = (s) => avg(s.songs.map(g => Math.abs(g.pos - fnMean[g.fn])));
const presence = (s) => ({
  iwant: s.songs.some(g => g.fn === 'iwant' && g.pos <= 0.32),
  finale: s.songs.some(g => g.fn === 'finale' && g.pos >= 0.42 && g.pos <= 0.65),
  eleven: s.songs.some(g => g.fn === 'eleven' && g.pos >= 0.78),
  fu: s.songs.some(g => g.fn === 'finaleultimo' && g.pos >= 0.93),
});

const twoAct = shows.filter(s => s.form === 'two-act');
const flops = twoAct.filter(s => s.flop);
const hits = twoAct.filter(s => !s.flop);

console.log('== SURVIVORSHIP TEST (two-act) ==\n');
console.log('show           flop  conformity(dev)  A1share  iwant finale eleven FU');
const row = (s) => {
  const m1 = s.songs.filter(g => g.half === 'A1').reduce((x, g) => x + g.min, 0);
  const mt = s.songs.reduce((x, g) => x + g.min, 0);
  const p = presence(s);
  console.log(
    s.name.padEnd(14), (s.flop ? 'FLOP' : '    '),
    (100 * conformity(s)).toFixed(1).padStart(8) + '%',
    String(Math.round(100 * m1 / mt)).padStart(10) + '%',
    ...['iwant', 'finale', 'eleven', 'fu'].map(k => (p[k] ? '  ✓' : '  ·').padStart(6))
  );
};
flops.forEach(row);
console.log('---');
console.log('FLOP avg conformity-dev:', (100 * avg(flops.map(conformity))).toFixed(1) + '%',
  '| HIT avg:', (100 * avg(hits.map(conformity))).toFixed(1) + '%');
const presRate = (grp, k) => Math.round(100 * grp.filter(s => presence(s)[k]).length / grp.length);
for (const k of ['iwant', 'finale', 'eleven', 'fu']) {
  console.log(`beat "${k}": flops ${presRate(flops, k)}%  hits ${presRate(hits, k)}%`);
}
// hit distribution of conformity for context (best/worst)
const ranked = twoAct.map(s => ({ n: s.name, d: conformity(s), f: s.flop })).sort((a, b) => a.d - b.d);
console.log('\nmost-conforming 5:', ranked.slice(0, 5).map(r => `${r.n}${r.f ? '(F)' : ''} ${(100 * r.d).toFixed(1)}%`).join(', '));
console.log('least-conforming 5:', ranked.slice(-5).map(r => `${r.n}${r.f ? '(F)' : ''} ${(100 * r.d).toFixed(1)}%`).join(', '));
