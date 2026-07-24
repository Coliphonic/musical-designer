// Build the real per-song dataset for the interactive Astrolabe:
// ATLAS_DATA = [{show, t(itle), fn, pos, v(oice)}] from the shelf (data.js) +
// all corpus batches (tuples + their trailing // title comments).
// ATLAS_SHOWS = [{show, a1share}] — each show's Act-1 fraction of song minutes,
// used by the Story DNA Atlas panel's "Structural Neighbors" similarity.
// Output is a non-module global (like data.js): `const ATLAS_DATA=[...];`.
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const DIR = '/Users/colin/Documents/Claude/Musical Designer';
const NAMES = {
  bandsvisit:"The Band's Visit",hadestown:'Hadestown',moulinrouge:'Moulin Rouge!',
  strangeloop:'A Strange Loop',outsiders:'The Outsiders',schmigadoon:'Schmigadoon!',
  phantom:'The Phantom of the Opera',schoolofrock:'School of Rock',bookofmormon:'The Book of Mormon',
  intheheights:'In the Heights',encanto:'Encanto (film)',notebook:'The Notebook',
  myfairlady:'My Fair Lady',soundofmusic:'The Sound of Music',hellodolly:'Hello, Dolly!',
  cabaret:'Cabaret',company:'Company',achorusline:'A Chorus Line',annie:'Annie',
  sweeneytodd:'Sweeney Todd',lesmis:'Les Misérables',rent:'Rent',producers:'The Producers',
  hairspray:'Hairspray',avenueq:'Avenue Q',springawakening:'Spring Awakening',funhome:'Fun Home',
  oklahoma:'Oklahoma!',carousel:'Carousel',guysanddolls:'Guys and Dolls',
  westsidestory:'West Side Story',musicman:'The Music Man',southpacific:'South Pacific',
  evita:'Evita',jcsuperstar:'Jesus Christ Superstar',misssaigon:'Miss Saigon',
  bloodbrothers:'Blood Brothers',matilda:'Matilda',billyelliot:'Billy Elliot',six:'SIX',
  mammamia:'Mamma Mia!',intothewoods:'Into the Woods',nightmusic:'A Little Night Music',
  manoflamancha:'Man of La Mancha',comefromaway:'Come From Away',elisabeth:'Elisabeth',
  notredame:'Notre-Dame de Paris',mrsdoubtfire:'Mrs. Doubtfire',paddington:'Paddington',
  shrek:'Shrek',somethingrotten:'Something Rotten!',shucked:'Shucked',beetlejuice:'Beetlejuice',
  spamalot:'Spamalot',drowsychaperone:'The Drowsy Chaperone',sweetsmell:'Sweet Smell of Success',
  merrily:'Merrily We Roll Along',chess:'Chess',carrie:'Carrie',big:'Big',
  bonnieclyde:'Bonnie & Clyde',nexttonormal:'Next to Normal',littleshop:'Little Shop of Horrors',
  lastfiveyears:'The Last Five Years',falsettos:'Falsettos',once:'Once',
};
const out = [];
// per-show Act-1 song-minute accumulator → ATLAS_SHOWS
const shareMap = new Map(); // name -> {a1, tot}
const yearMap = new Map();  // name -> year from an explicit `year:` field (authoritative)
const yearComment = new Map(); // name -> year from the show's `// YYYY` header comment (fallback)
const addShare = (name, a1, tot) => {
  const r = shareMap.get(name) || { a1: 0, tot: 0 };
  r.a1 += a1; r.tot += tot; shareMap.set(name, r);
};

// ── corpus batches: parse tuples + trailing comments ──
const tupleRe = /\['(A[12])',\s*'([a-z ]+)',\s*'(solo|duet|group)',\s*([\d.]+)\s*\],?\s*(?:\/\/\s*(.*))?$/;
const showRe = /^  ([a-z0-9]+): \{/;
for (const f of readdirSync(DIR + '/corpus').filter(f => f.startsWith('corpus-'))) {
  const lines = readFileSync(`${DIR}/corpus/${f}`, 'utf8').split('\n');
  let show = null, songs = [];
  const flush = () => {
    if (!show || !songs.length) return;
    const total = songs.reduce((s, x) => s + x.min, 0);
    const a1 = songs.reduce((s, x) => s + (x.act === 'A1' ? x.min : 0), 0);
    addShare(NAMES[show] || show, a1, total);
    let cum = 0;
    for (const s of songs) {
      const pos = (cum + s.min / 2) / total; cum += s.min;
      out.push({ show: NAMES[show] || show, t: s.t, fn: s.fn, pos: +pos.toFixed(3), v: s.v });
    }
    songs = [];
  };
  for (const ln of lines) {
    const m0 = ln.match(showRe);
    if (m0) {
      flush(); show = m0[1];
      const nm = NAMES[show] || show;
      // year lives inconsistently: inline `year:` (batch4), on the `form:` line
      // (classics), or only in the `// YYYY` header comment (winners/extras).
      const yf = ln.match(/\byear:\s*(\d{4})/); if (yf) yearMap.set(nm, +yf[1]);
      const yc = ln.match(/\/\/\s*(\d{4})/);    if (yc) yearComment.set(nm, +yc[1]);
      continue;
    }
    if (show) { const yf = ln.match(/\byear:\s*(\d{4})/); if (yf) yearMap.set(NAMES[show] || show, +yf[1]); }
    const m = ln.trim().match(tupleRe);
    if (m && show) {
      let t = (m[5] || '').trim()
        .replace(/\s*\(~[^)]*\)/g, '').replace(/\s+—.*$/, '').replace(/\s*·.*$/, '').trim();
      songs.push({ act: m[1], fn: m[2], v: m[3], min: +m[4], t: t || '(untitled)' });
    }
  }
  flush();
}

// ── shelf shows from data.js ──
const src = readFileSync(DIR + '/app/data.js', 'utf8');
const { SHOWS } = new Function(src + '\n;return { SHOWS };')();
const LANES = ['1', '2A', '2B', '3'];
const voiceClass = (v) => {
  if (!v) return null; const t = v.trim();
  if (/company|ensemble|co\.|men|women|chorus|all|full|kids|daughters|boys|girls|townsfolk|crowd/i.test(t)) return 'group';
  const parts = t.split(/\s*(?:,|\+|&|and)\s*/i).filter(Boolean);
  return parts.length >= 3 ? 'group' : parts.length === 2 ? 'duet' : 'solo';
};
for (const show of Object.values(SHOWS)) {
  const cards = (show.cards || []).filter(c => LANES.includes(c.lane || c.act));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  // Act-1 share is measured on SONG minutes only (lanes 1 + 2A).
  const songCards = cards.filter(c => c.type === 'song' && c.fn);
  const songTot = songCards.reduce((s, c) => s + (c.min || 0), 0);
  const a1song = songCards.reduce((s, c) => s + (['1', '2A'].includes(c.lane || c.act) ? (c.min || 0) : 0), 0);
  addShare(show.title, a1song, songTot);
  if (show.year) yearMap.set(show.title, show.year);
  let cum = 0;
  for (const c of cards) {
    if (c.type === 'song' && c.fn) {
      const pos = (cum + (c.min || 0) / 2) / total;
      out.push({ show: show.title, t: c.title || '(untitled)', fn: c.fn === 'iwant' ? 'i want' :
        c.fn === 'finaleultimo' ? 'finale ultimo' : c.fn === 'finale' ? 'act finale' : c.fn,
        pos: +pos.toFixed(3), v: voiceClass(c.voicing) || 'group' });
    }
    cum += c.min || 0;
  }
}

const cnt = {};
out.forEach((s) => { cnt[s.show] = (cnt[s.show] || 0) + 1; });
const shows = [...shareMap.entries()].map(([show, r]) =>
  ({ show, a1share: +(r.a1 / r.tot).toFixed(3),
     year: yearMap.get(show) ?? yearComment.get(show) ?? null, n: cnt[show] || 0 }));

writeFileSync(
  DIR + '/app/atlas-data.js',
  'const ATLAS_DATA=' + JSON.stringify(out) + ';\n' +
  'const ATLAS_SHOWS=' + JSON.stringify(shows) + ';\n'
);
console.log(out.length, 'songs from', new Set(out.map(s => s.show)).size, 'shows;', shows.length, 'ATLAS_SHOWS');
console.log('sample:', JSON.stringify(out.find(s => s.fn === 'villain' && Math.abs(s.pos - .38) < .04)));
console.log('share sample:', JSON.stringify(shows.find(s => s.show === 'Fiddler on the Roof')), JSON.stringify(shows.find(s => s.show === 'Gypsy')));
const noYear = shows.filter(s => !s.year).map(s => s.show);
console.log('shows missing year:', noYear.length ? noYear.join(', ') : 'none');
