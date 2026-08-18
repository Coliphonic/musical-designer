// Build the real per-song dataset for the interactive Astrolabe:
// ATLAS_DATA = [{show, t(itle), fn, pos, v(oice)}] from the shelf (data.js) +
// all corpus batches (tuples + their trailing // title comments).
// ATLAS_SHOWS = [{show, a1share}] — each show's Act-1 fraction of song minutes,
// used by the Story DNA Atlas panel's "Structural Neighbors" similarity.
// Output is a non-module global (like data.js): `const ATLAS_DATA=[...];`.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
// Reprise -> source resolution. Emits `of: [pos, ...]` on reprise rows, so the
// Atlas can draw a real motif edge instead of inferring one from proximity.
import { linkReprises, unresolved, normTitle } from './reprise-links.mjs';

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
  oncethisisland:'Once on This Island',titleofshow:'[title of show]',
  ordinarydays:'Ordinary Days',ridethecyclone:'Ride the Cyclone',
  rockyhorror:'The Rocky Horror Show',
  // batch9 — the Disney wing. ' (film)' suffixes are LOAD-BEARING: they keep
  // these rows clear of the shelf-title veto (stage Little Mermaid, Frozen,
  // Newsies, Hunchback and Hercules are carded shelf shows).
  beautybeast:'Beauty and the Beast',lionking:'The Lion King',aida:'Aida',
  marypoppins:'Mary Poppins',tarzan:'Tarzan',aladdin:'Aladdin',anastasia:'Anastasia',
  marypoppinsfilm:'Mary Poppins (film)',littlemermaidfilm:'The Little Mermaid (film)',
  beautybeastfilm:'Beauty and the Beast (film)',aladdinfilm:'Aladdin (film)',
  newsiesfilm:'Newsies (film)',lionkingfilm:'The Lion King (film)',
  hunchbackfilm:'The Hunchback of Notre Dame (film)',herculesfilm:'Hercules (film)',
  anastasiafilm:'Anastasia (film)',tarzanfilm:'Tarzan (film)',frozenfilm:'Frozen (film)',
};

// The Atlas form filter's three cohorts. 'film' is named explicitly rather than
// folded into 'other' so the filter can label it honestly: 'other' still exists
// as the escape hatch for a form that is none of the three (a revue, a song
// cycle), and anything landing there drops out of ALL the filter's sides rather
// than padding one. Until 2026-08-17 films WERE 'other', because there was one
// (Encanto); the batch-9 wing made them a cohort of twelve worth filtering to.
const formKind = (f) => !f ? null
  : /^one-act/.test(f) ? 'one'
  : f === 'two-act' ? 'full'
  : f === 'film' ? 'film'
  : 'other';
const out = [];

// Shelf shows are read FIRST, before the corpus batches, only so their titles can
// veto a duplicate corpus row below. Shelf and corpus are meant to be disjoint —
// but a show gets promoted from data-only to carded from time to time (Hadestown,
// 2026-07-29), and both sets key on the same resolved title, so a leftover corpus
// row would silently double every one of that show's songs and blend its a1share.
// Shelf wins: the carded pass is the richer one and its positions come off a full
// card timeline rather than song minutes alone.
const shelfSrc = readFileSync(DIR + '/app/data.js', 'utf8');
const { SHOWS } = new Function(shelfSrc + '\n;return { SHOWS };')();
const SHELF_TITLES = new Set(Object.values(SHOWS).map((s) => s.title));

// per-show Act-1 song-minute accumulator → ATLAS_SHOWS
const shareMap = new Map(); // name -> {a1, tot}
const yearMap = new Map();  // name -> year from an explicit `year:` field (authoritative)
const yearComment = new Map(); // name -> year from the show's `// YYYY` header comment (fallback)
const formMap = new Map();  // name -> raw `form:` string ('two-act' | 'one-act-NN' | 'film')
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
    if (SHELF_TITLES.has(NAMES[show] || show)) {
      console.log('skip corpus row (already on the shelf):', NAMES[show] || show);
      songs = []; return;
    }
    const total = songs.reduce((s, x) => s + x.min, 0);
    const a1 = songs.reduce((s, x) => s + (x.act === 'A1' ? x.min : 0), 0);
    addShare(NAMES[show] || show, a1, total);
    // Resolve each reprise to the song(s) it reprises BEFORE positions are
    // computed, then translate those titles into positions — what the Atlas
    // needs to draw an edge is a pair of angles, not a pair of names.
    const linked = linkReprises(show, songs.map((s) => ({ ...s, title: s.t })));
    let cum = 0;
    const posOf = new Map();
    const rowsFor = [];
    for (let i = 0; i < songs.length; i++) {
      const s = songs[i];
      const pos = +((cum + s.min / 2) / total).toFixed(3); cum += s.min;
      // Keyed by NORMALIZED title: carded titles carry annotations the resolver
      // never sees ("Don't Cry for Me Argentina (opens A2)"), so an exact-string
      // lookup silently drops every hand-written override. But normalizing makes
      // "Your Song" and "Your Song (Rep)" collide — so only a SOURCE may claim a
      // key, first occurrence wins, or a reprise resolves to itself and the edge
      // points forward.
      const nk = normTitle(s.t);
      if (s.fn !== 'reprise' && !posOf.has(nk)) posOf.set(nk, pos);
      rowsFor.push({ show: NAMES[show] || show, t: s.t, fn: s.fn, pos, v: s.v, _of: linked[i].of });
    }
    for (const r of rowsFor) {
      const src = (r._of || []).map((t) => posOf.get(normTitle(t))).filter((p) => p != null);
      delete r._of;
      if (src.length) r.of = src;
      out.push(r);
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
      const ff = ln.match(/\bform:\s*'([^']+)'/); if (ff) formMap.set(nm, ff[1]);
      continue;
    }
    if (show) {
      const nm2 = NAMES[show] || show;
      const yf = ln.match(/\byear:\s*(\d{4})/); if (yf) yearMap.set(nm2, +yf[1]);
      // `form:` sits inline on the show-open line (batch4) or on its own line
      // just after it (winners, batch8) — check both, same as year.
      const ff = ln.match(/\bform:\s*'([^']+)'/); if (ff) formMap.set(nm2, ff[1]);
    }
    const m = ln.trim().match(tupleRe);
    if (m && show) {
      let t = (m[5] || '').trim()
        .replace(/\s*\(~[^)]*\)/g, '').replace(/\s+—.*$/, '').replace(/\s*·.*$/, '').trim();
      songs.push({ act: m[1], fn: m[2], v: m[3], min: +m[4], t: t || '(untitled)' });
    }
  }
  flush();
}

// ── shelf shows from data.js (SHOWS already parsed above for the overlap guard) ──
const LANES = ['1', '2A', '2B', '3'];
const voiceClass = (v) => {
  if (!v) return null; const t = v.trim();
  if (/company|ensemble|co\.|men|women|chorus|all|full|kids|daughters|boys|girls|townsfolk|crowd|fates|workers/i.test(t)) return 'group';
  const parts = t.split(/\s*(?:,|\+|&|and)\s*/i).filter(Boolean);
  return parts.length >= 3 ? 'group' : parts.length === 2 ? 'duet' : 'solo';
};
// entries, not values: linkReprises keys its overrides by the show's data.js key
for (const [key, show] of Object.entries(SHOWS)) {
  // A ten-minute piece is a different form, not a short musical. Its handful of
  // numbers would join the all-corpus census — the same census whose function
  // positions and act ratios the long-form templates cite — alongside two-hour
  // shows, and shift every mean it touched. The shelf carries it as a study
  // model; the Atlas leaves it out entirely (this is stricter than `kind:
  // 'other'`, which still counts toward the totals). See TEMPLATE-PLAN §8.
  if (/^ten-minute/.test(show.form || '')) continue;
  const cards = (show.cards || []).filter(c => LANES.includes(c.lane || c.act));
  if (!cards.some(c => c.type === 'song')) continue;
  const total = cards.reduce((s, c) => s + (c.min || 0), 0);
  // Act-1 share is measured on SONG minutes only (lanes 1 + 2A).
  const songCards = cards.filter(c => c.type === 'song' && c.fn);
  const songTot = songCards.reduce((s, c) => s + (c.min || 0), 0);
  const a1song = songCards.reduce((s, c) => s + (['1', '2A'].includes(c.lane || c.act) ? (c.min || 0) : 0), 0);
  addShare(show.title, a1song, songTot);
  if (show.year) yearMap.set(show.title, show.year);
  if (show.form) formMap.set(show.title, show.form);
  // Same two-pass reprise linking as the corpus branch above: link on titles,
  // emit positions. Shelf cards carry scenes and beats too, so the song list is
  // extracted first — a reprise never points at a scene.
  const linkedShelf = linkReprises(key, songCards.map((c) => ({ title: c.title || '(untitled)', fn: c.fn })));
  const ofByTitle = new Map();
  linkedShelf.forEach((s, i) => { if (s.of && s.of.length) ofByTitle.set(songCards[i], s.of); });
  let cum = 0;
  const posOfShelf = new Map();
  const shelfRows = [];
  for (const c of cards) {
    if (c.type === 'song' && c.fn) {
      const pos = +((cum + (c.min || 0) / 2) / total).toFixed(3);
      const nk = normTitle(c.title || '(untitled)');   // sources only — see the corpus branch
      if (c.fn !== 'reprise' && !posOfShelf.has(nk)) posOfShelf.set(nk, pos);
      shelfRows.push({ row: { show: show.title, t: c.title || '(untitled)', fn: c.fn === 'iwant' ? 'i want' :
        c.fn === 'finaleultimo' ? 'finale ultimo' : c.fn === 'finale' ? 'act finale' : c.fn,
        pos, v: voiceClass(c.voicing) || 'group' }, card: c });
    }
    cum += c.min || 0;
  }
  for (const { row, card } of shelfRows) {
    const src = (ofByTitle.get(card) || []).map((t) => posOfShelf.get(normTitle(t))).filter((p) => p != null);
    if (src.length) row.of = src;
    out.push(row);
  }
}

const cnt = {};
out.forEach((s) => { cnt[s.show] = (cnt[s.show] || 0) + 1; });
const shows = [...shareMap.entries()].map(([show, r]) =>
  ({ show, a1share: +(r.a1 / r.tot).toFixed(3),
     year: yearMap.get(show) ?? yearComment.get(show) ?? null, n: cnt[show] || 0,
     kind: formKind(formMap.get(show)) }));

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
const noKind = shows.filter(s => !s.kind).map(s => s.show);
console.log('shows missing form:', noKind.length ? noKind.join(', ') : 'none');
const kindTally = shows.reduce((a, s) => { a[s.kind] = (a[s.kind] || 0) + 1; return a; }, {});
const songKind = out.reduce((a, s) => {
  const k = (shows.find(x => x.show === s.show) || {}).kind || 'unknown';
  a[k] = (a[k] || 0) + 1; return a;
}, {});
console.log('shows by form:', JSON.stringify(kindTally), '| songs by form:', JSON.stringify(songKind));
