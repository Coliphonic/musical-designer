// Wider survey of the reference shelf: song lengths by function, position-in-show
// percentiles, voicing classes, reprise ratios, song density, dialogue spacing.
import { readFileSync } from 'fs';

const src = readFileSync('/Users/colin/Documents/Claude/Musical Designer/app/data.js', 'utf8');
const { SHOWS } = new Function(src + '\n;return { SHOWS };')();

const LANES = ['1', '2A', '2B', '3'];
const laneOf = (c) => c.lane || c.act;
const isMusical = ([, s]) => (s.cards || []).some(c => c.type === 'song');
const shows = Object.entries(SHOWS).filter(isMusical);

// ---- classify voicing into solo / duet / group ----
const voiceClass = (v) => {
  if (!v) return null;
  const t = v.trim();
  if (/company|ensemble|co\.|men|women|chorus|all|full|kids|daughters|boys|girls|townsfolk|crowd/i.test(t)) return 'group';
  const parts = t.split(/\s*(?:,|\+|&|and)\s*/i).filter(Boolean);
  if (parts.length >= 3) return 'group';
  if (parts.length === 2) return 'duet';
  return 'solo';
};

// ---- accumulate ----
const byFn = {}; // fn -> {mins:[], pcts:[], voices:{solo,duet,group}}
const laneVoice = {}; for (const l of LANES) laneVoice[l] = { solo: 0, duet: 0, group: 0 };
const perShow = [];

for (const [key, show] of shows) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  const totalMin = cards.reduce((s, c) => s + (c.min || 0), 0);
  let cum = 0;
  let songMin = 0, songCount = 0, repriseCount = 0;
  let a2Songs = 0, a2Reprise = 0;
  let run = 0, maxRun = 0; // consecutive songs with no beat/scene between
  let firstSongAt = null;
  const positions = []; // per-song % position

  for (const c of cards) {
    const mid = cum + (c.min || 0) / 2;
    if (c.type === 'song') {
      songCount++; songMin += c.min || 0;
      const pct = totalMin ? mid / totalMin : 0;
      positions.push(pct);
      if (firstSongAt === null) firstSongAt = totalMin ? cum / totalMin : 0;
      const isA2 = laneOf(c) === '2B' || laneOf(c) === '3';
      if (isA2) a2Songs++;
      const isRep = c.fn === 'reprise' || /reprise/i.test(c.title || '');
      if (isRep) { repriseCount++; if (isA2) a2Reprise++; }
      if (c.fn) {
        const b = byFn[c.fn] = byFn[c.fn] || { mins: [], pcts: [], voices: { solo: 0, duet: 0, group: 0 } };
        b.mins.push(c.min || 0);
        b.pcts.push(pct);
        const vc = voiceClass(c.voicing);
        if (vc) { b.voices[vc]++; laneVoice[laneOf(c)][vc]++; }
      }
      run++; maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
    cum += c.min || 0;
  }
  perShow.push({
    key, form: show.form, totalMin: Math.round(totalMin), songCount,
    density: songMin / totalMin, repriseCount, a2Songs, a2Reprise,
    firstSongAt, maxRun,
  });
}

const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (x) => Math.round(x * 100) + '%';

console.log('== SONG LENGTH + POSITION BY FUNCTION (all musicals) ==');
console.log('fn            n   avgMin  medMin  avgPos  posRange(10-90th)     voicing s/d/g');
const fnRows = Object.entries(byFn).sort((a, b) => avg(a[1].pcts) - avg(b[1].pcts));
for (const [f, b] of fnRows) {
  const sorted = [...b.pcts].sort((x, y) => x - y);
  const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] ?? 0;
  console.log(
    f.padEnd(13), String(b.mins.length).padStart(2), ' ',
    avg(b.mins).toFixed(1).padStart(5), med(b.mins).toFixed(1).padStart(6), '  ',
    pct(avg(b.pcts)).padStart(4), ' ',
    (pct(p10) + '–' + pct(p90)).padEnd(20),
    `${b.voices.solo}/${b.voices.duet}/${b.voices.group}`
  );
}

console.log('\n== VOICING BY LANE (solo/duet/group) ==');
for (const l of LANES) {
  const v = laneVoice[l]; const t = v.solo + v.duet + v.group;
  console.log(` lane ${l.padEnd(2)}: ${v.solo}/${v.duet}/${v.group}   (${t ? Math.round(100 * v.solo / t) : 0}% solo, ${t ? Math.round(100 * v.group / t) : 0}% group)`);
}

console.log('\n== PER-SHOW: density, reprises, spacing ==');
console.log('show            form       min  songs  song-density  reprises  A2rep/A2songs  firstSong@  maxSongRun');
for (const r of perShow) {
  console.log(
    r.key.padEnd(15), (r.form || '').padEnd(10),
    String(r.totalMin).padStart(3), String(r.songCount).padStart(4), '  ',
    pct(r.density).padStart(4), '       ',
    String(r.repriseCount).padStart(2), '      ',
    `${r.a2Reprise}/${r.a2Songs}`.padEnd(10),
    pct(r.firstSongAt ?? 0).padStart(5), '     ',
    r.maxRun
  );
}
const two = perShow.filter(r => r.form === 'two-act');
console.log('\ntwo-act avgs: density', pct(avg(two.map(r => r.density))),
  '| reprises/show', avg(two.map(r => r.repriseCount)).toFixed(1),
  '| A2 reprise share', pct(avg(two.map(r => r.a2Songs ? r.a2Reprise / r.a2Songs : 0))),
  '| first song @', pct(avg(two.map(r => r.firstSongAt ?? 0))));

// ---- structure of cards around songs: beats per song, scenes per act ----
console.log('\n== CARD SCAFFOLD (scenes/beats vs songs) ==');
for (const [key, show] of shows) {
  const cards = (show.cards || []).filter(c => LANES.includes(laneOf(c)));
  const n = (t) => cards.filter(c => c.type === t).length;
  console.log(' ', key.padEnd(15), `scenes ${String(n('scene')).padStart(2)}  songs ${String(n('song')).padStart(2)}  beats ${String(n('beat')).padStart(2)}`);
}
