// Merged corpus analysis: 15 shelf shows (data.js cards) + 12 data-only shows.
// Normalizes both to [half, fn, voice, min, posPct] and recomputes the stats
// behind TEMPLATE-PLAN.md.
import { readFileSync } from 'fs';
import { WINNERS } from './corpus-winners.mjs';
import { EXTRAS } from './corpus-extras.mjs';
import { CLASSICS } from './corpus-classics.mjs';
import { BATCH4 } from './corpus-batch4.mjs';
import { BATCH5 } from './corpus-batch5.mjs';
import { BATCH6 } from './corpus-batch6.mjs';
import { BATCH7 } from './corpus-batch7.mjs';

// Regional tradition for cross-culture comparison. Everything unlisted = bway.
const REGIONS = { phantom: 'westend', lesmis: 'westend' };

// Opening year for era splits (shelf shows carry `year` in data.js; the
// winners/extras batches predate the field, so map them here).
const YEARS = {
  bandsvisit: 2017, hadestown: 2019, moulinrouge: 2019, strangeloop: 2019,
  outsiders: 2024, schmigadoon: 2026, phantom: 1986, schoolofrock: 2015,
  bookofmormon: 2011, intheheights: 2008, encanto: 2021, notebook: 2024,
};

const src = readFileSync('/Users/colin/Documents/Claude/Musical Designer/app/data.js', 'utf8');
const { SHOWS } = new Function(src + '\n;return { SHOWS };')();

const LANES = ['1', '2A', '2B', '3'];
const laneOf = (c) => c.lane || c.act;
const voiceClass = (v) => {
  if (!v) return null;
  const t = v.trim();
  if (/company|ensemble|co\.|men|women|chorus|all|full|kids|daughters|boys|girls|townsfolk|crowd/i.test(t)) return 'group';
  const parts = t.split(/\s*(?:,|\+|&|and)\s*/i).filter(Boolean);
  return parts.length >= 3 ? 'group' : parts.length === 2 ? 'duet' : 'solo';
};

// ---- normalize shelf shows (position from full card timeline incl. beats) ----
const norm = []; // {show, source, form, songs:[{half, fn, voice, min, pos}]}
for (const [key, show] of Object.entries(SHOWS)) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  let cum = 0; const songs = [];
  for (const c of cards) {
    if (c.type === 'song' && c.fn) {
      const l = laneOf(c);
      songs.push({
        half: (l === '1' || l === '2A') ? 'A1' : 'A2',
        fn: c.fn, voice: voiceClass(c.voicing),
        min: c.min || 0, pos: total ? (cum + (c.min || 0) / 2) / total : 0,
      });
    }
    cum += c.min || 0;
  }
  norm.push({ show: key, source: 'shelf', form: show.form, year: show.year, songs });
}

// ---- normalize data-only shows (position from song-minute timeline — caveat) ----
for (const [name, data] of Object.entries({ ...WINNERS, ...EXTRAS, ...CLASSICS, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7 })) {
  const total = data.songs.reduce((s, t) => s + t[3], 0);
  let cum = 0;
  const songs = data.songs.map(([half, fn, voice, min]) => {
    const pos = (cum + min / 2) / total; cum += min;
    return { half, fn, voice, min, pos };
  });
  norm.push({ show: name, source: 'new', form: data.form, year: data.year ?? YEARS[name],
    region: data.region ?? REGIONS[name] ?? 'bway', songs });
}
norm.forEach(r => { if (!r.region) r.region = REGIONS[r.show] ?? 'bway'; });

const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const pct = (x) => Math.round(x * 100) + '%';

// ---- per-show act balance ----
console.log('== ACT BALANCE (all 27) ==');
console.log('show             src    form        A1/A2 songs   A1 min-share');
const ratios = [], shares = [];
for (const r of norm) {
  const a1 = r.songs.filter(s => s.half === 'A1');
  const a2 = r.songs.filter(s => s.half === 'A2');
  const m1 = a1.reduce((s, x) => s + x.min, 0), m2 = a2.reduce((s, x) => s + x.min, 0);
  const share = m1 / (m1 + m2);
  if (r.form === 'two-act') { ratios.push(a1.length / Math.max(1, a2.length)); shares.push(share); }
  console.log(
    r.show.padEnd(16), r.source.padEnd(6), (r.form || '').padEnd(11),
    `${a1.length}/${a2.length}`.padEnd(13), pct(share)
  );
}
console.log('\ntwo-act (n=' + ratios.length + '): avg A1:A2 song ratio', avg(ratios).toFixed(2),
  '| avg A1 song-minute share', pct(avg(shares)));

// ---- era split (two-act only): pre-1990 vs 1990+ ----
for (const [label, test] of [['pre-1990', (y) => y < 1990], ['1990+', (y) => y >= 1990]]) {
  const era = norm.filter(r => r.form === 'two-act' && r.year && test(r.year));
  const er = [], es = [];
  for (const r of era) {
    const a1 = r.songs.filter(s => s.half === 'A1'), a2 = r.songs.filter(s => s.half === 'A2');
    const m1 = a1.reduce((s, x) => s + x.min, 0), m2 = a2.reduce((s, x) => s + x.min, 0);
    er.push(a1.length / Math.max(1, a2.length)); es.push(m1 / (m1 + m2));
  }
  console.log(`  ${label} (n=${era.length}): ratio ${avg(er).toFixed(2)} | A1 share ${pct(avg(es))}`);
}

// ---- regional split (two-act only) ----
console.log('\n== REGION SPLIT (two-act) ==');
for (const reg of ['bway', 'westend', 'europe']) {
  const rr = norm.filter(r => r.form === 'two-act' && r.region === reg);
  if (!rr.length) continue;
  const er = [], es = [], repShare = [], solShare = [];
  for (const r of rr) {
    const a1 = r.songs.filter(s => s.half === 'A1'), a2 = r.songs.filter(s => s.half === 'A2');
    const m1 = a1.reduce((s, x) => s + x.min, 0), m2 = a2.reduce((s, x) => s + x.min, 0);
    er.push(a1.length / Math.max(1, a2.length)); es.push(m1 / (m1 + m2));
    repShare.push(r.songs.filter(s => s.fn === 'reprise').length / r.songs.length);
    solShare.push(r.songs.filter(s => s.voice === 'solo').length / r.songs.length);
  }
  console.log(` ${reg.padEnd(8)} n=${String(rr.length).padStart(2)}  ratio ${avg(er).toFixed(2)}  A1 share ${pct(avg(es))}  reprise-share ${pct(avg(repShare))}  solo-share ${pct(avg(solShare))}`);
  console.log('   ', rr.map(r => r.show).join(', '));
}

// ---- merged fn table ----
const byFn = {};
for (const r of norm) for (const s of r.songs) {
  const b = byFn[s.fn] = byFn[s.fn] || { mins: [], pos: [], v: { solo: 0, duet: 0, group: 0 }, a1: 0, a2: 0 };
  b.mins.push(s.min); b.pos.push(s.pos);
  if (s.voice) b.v[s.voice]++;
  s.half === 'A1' ? b.a1++ : b.a2++;
}
console.log('\n== FUNCTION TABLE — merged 27-show corpus ==');
console.log('fn            n    A1/A2    avgMin  avgPos  10–90th        s/d/g');
for (const [f, b] of Object.entries(byFn).sort((a, c) => avg(a[1].pos) - avg(c[1].pos))) {
  const sorted = [...b.pos].sort((x, y) => x - y);
  const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] ?? 0;
  console.log(
    f.padEnd(13), String(b.mins.length).padStart(3), ' ',
    `${b.a1}/${b.a2}`.padEnd(8),
    avg(b.mins).toFixed(1).padStart(5), ' ',
    pct(avg(b.pos)).padStart(4), '  ',
    (pct(p10) + '–' + pct(p90)).padEnd(13),
    `${b.v.solo}/${b.v.duet}/${b.v.group}`
  );
}

// ---- specific checks ----
console.log('\n== SPECIFIC CHECKS ==');
// comedy placement: A1 vs A2, and avg pos among two-act shows only
const comedy = [];
for (const r of norm) if (r.form === 'two-act') for (const s of r.songs) if (s.fn === 'comedy') comedy.push(s);
console.log('comedy (two-act only): n=' + comedy.length,
  '| A1/A2', comedy.filter(s => s.half === 'A1').length + '/' + comedy.filter(s => s.half === 'A2').length,
  '| avg pos', pct(avg(comedy.map(s => s.pos))),
  '| earliest', pct(Math.min(...comedy.map(s => s.pos))));

// iwant count per show (dual-protagonist pattern)
const iwants = norm.map(r => ({ show: r.show, n: r.songs.filter(s => s.fn === 'iwant').length }))
  .filter(x => x.n >= 2);
console.log('shows with 2+ I Want songs:', iwants.map(x => `${x.show}(${x.n})`).join(', ') || 'none');

// anthem positions
const anth = [];
for (const r of norm) for (const s of r.songs) if (s.fn === 'anthem') anth.push({ show: r.show, pos: s.pos, v: s.voice });
console.log('anthems:', anth.map(a => `${a.show}@${pct(a.pos)}`).join(', '));

// soliloquy halves
const sol = [];
for (const r of norm) for (const s of r.songs) if (s.fn === 'soliloquy') sol.push({ show: r.show, half: s.half, pos: s.pos });
console.log('soliloquies:', sol.map(s => `${s.show}:${s.half}@${pct(s.pos)}`).join(', '));

// eleven voicing in merged corpus
const el = byFn.eleven;
if (el) console.log('eleven: n=' + el.mins.length, 'avgPos', pct(avg(el.pos)), 's/d/g', `${el.v.solo}/${el.v.duet}/${el.v.group}`, 'avgMin', avg(el.mins).toFixed(1));
// love voicing check
const lv = byFn.love;
if (lv) console.log('love: n=' + lv.mins.length, 'avgPos', pct(avg(lv.pos)), 's/d/g', `${lv.v.solo}/${lv.v.duet}/${lv.v.group}`);
// opening voicing check
const op = byFn.opening;
if (op) console.log('opening: n=' + op.mins.length, 's/d/g', `${op.v.solo}/${op.v.duet}/${op.v.group}`, 'avgMin', avg(op.mins).toFixed(1));
// reprise stats
const rp = byFn.reprise;
if (rp) console.log('reprise: n=' + rp.mins.length, 'avgMin', avg(rp.mins).toFixed(1), 'A1/A2', `${rp.a1}/${rp.a2}`);
