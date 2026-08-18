// Resolve every `reprise`-tagged song to the song(s) it reprises.
//
// WHY THIS IS A RESOLVER AND NOT A DATA FIELD: 78% of reprises already name
// their source in the title ("Gaston (Reprise)", "Your Song (Rep)"). Adding an
// explicit link to all 113 tuples would mean editing 113 lines to restate
// something the titles already say, and every future reprise row would have to
// remember to do it. Instead the link is DERIVED at build time, and only the
// cases the derivation cannot reach are recorded by hand in OVERRIDES below.
//
// A reprise can have MORE THAN ONE source — compound numbers are common
// ("Still / The Neva Flows (Rep)", "A Man Has Dreams / A Spoonful of Sugar
// (Rep)"), so `of` is always an array.
//
// The resolver only ever matches WITHIN one show. A reprise whose source is not
// carded (the source was folded into a neighbour, or is underscore/dialogue) is
// left unresolved rather than guessed at — `of: []` is an honest answer and
// `unresolved()` reports them so the gap stays visible.

// Titles the resolver cannot reach: the reprise is not named after its source.
// Each is the published relationship, not an inference from the data.
// Keyed `show :: reprise title` -> array of source titles AS CARDED.
//
// "As carded" is the contract, and it bites: the corpus writes Beetlejuice's
// opener with double quotes (The Whole "Being Dead" Thing) and truncates
// Annie's with an ellipsis (You're Never Fully Dressed…). A value that does not
// normalize to the carded title resolves to nothing and the reprise silently
// loses its edge, so check the `// title` comment in the corpus file rather
// than typing the title from memory.
export const OVERRIDES = {
  // The reprise carries a different title from its source
  'evita :: Eva\'s Final Broadcast':        ["Don't Cry for Me Argentina"],
  'lionking :: He Lives in You':            ['They Live in You'],
  'bloodbrothers :: Marilyn Monroe 2':      ['Marilyn Monroe'],
  'spamalot :: Twice in Every Show':        ['The Song That Goes Like This'],
  // Multi-part numbers: parts 2+ are reprises of part 1
  'beetlejuice :: TWBDT Pt. 2':             ['The Whole "Being Dead" Thing'],
  'beetlejuice :: TWBDT Pt. 3':             ['The Whole "Being Dead" Thing'],
  'beetlejuice :: TWBDT Pt. 4':             ['The Whole "Being Dead" Thing'],
  'beetlejuice :: TBS (Rep)':               ['That Beautiful Sound'],
  'maybehappyending :: Hitting the Road, Part 2': ['Hitting the Road'],
  'maybehappyending :: Hitting the Road, Part 3': ['Hitting the Road'],
  // Abbreviated or partial titles
  'annie :: Fully Dressed (Kids Rep)':      ["You're Never Fully Dressed"],  // carded truncated, with an ellipsis
  'soundofmusic :: Sixteen (Rep)':          ['Sixteen Going on Seventeen'],
  'oklahoma :: People Will Say (Rep)':      ["People Will Say We're in Love"],
  'bonnieclyde :: Picture Show (Rep':       ['Picture Show'],
};

// Reprises whose source is genuinely NOT carded in this corpus — recorded so
// they are not mistaken for resolver failures. Value is the known source, kept
// for documentation; it resolves to [] because there is no card to point at.
export const SOURCE_NOT_CARDED = {
  'schoolofrock :: Mount Rock (Reprise)': 'Mount Rock (cut from the carded list)',
  'beetlejuice :: Ready, Set (Rep)': 'Ready Set Not Yet (not carded)',
  'intothewoods :: So Happy': 'Act 1 finale material, not a single carded song',
  'schmigadoon :: You Done Tamed Me': 'reprises dialogue-underscore material',
  'frozen :: I Can\'t Lose You': 'reprises For the First Time in Forever material, not a carded card',
};

// Strip reprise markers and decoration so two titles can be compared.
export function normTitle(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    // "(Rep)", "(Reprise)", "(Rep II)", "(Reprise 2)", "(Kids Rep)"…
    .replace(/\((?:[a-z]+\s+)?(?:rep|reprise)(?:\s*(?:\d+|i{1,3}|v?i{0,3}))?\)/gi, ' ')
    .replace(/\((?:instr\.?|instrumental|playoff|waltz|part\s*\d+|pt\.?\s*\d+)\)/gi, ' ')
    .replace(/\s*\((?:[^)]*)\)\s*/g, ' ')       // any remaining parenthetical
    .replace(/\bpart\s*\d+\b|\bpt\.?\s*\d+\b/gi, ' ')
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A compound title ("Still / The Neva Flows (Rep)") names several sources.
function candidates(title) {
  const parts = String(title || '').split('/').map((s) => s.trim()).filter(Boolean);
  return (parts.length > 1 ? parts : [title]).map(normTitle).filter(Boolean);
}

const _unresolved = [];
export function unresolved() { return _unresolved.slice(); }
export function resetUnresolved() { _unresolved.length = 0; }

// songs: [{ title, fn }] in running order for ONE show.
// Returns the same array with `of: [titles]` added to every reprise.
export function linkReprises(showKey, songs) {
  const pool = songs.map((s) => ({ ...s, _n: normTitle(s.title) }));
  return songs.map((s, i) => {
    if (s.fn !== 'reprise') return s;
    const key = showKey + ' :: ' + s.title;
    if (OVERRIDES[key]) return { ...s, of: OVERRIDES[key].slice() };
    if (SOURCE_NOT_CARDED[key]) return { ...s, of: [] };

    const found = [];
    for (const cand of candidates(s.title)) {
      if (!cand) continue;
      // exact normalized match first, then prefix (a reprise often shortens the
      // title: "People Will Say" for "People Will Say We're in Love")
      let hit = pool.find((p, j) => j !== i && p.fn !== 'reprise' && p._n === cand)
        || pool.find((p, j) => j !== i && p.fn !== 'reprise' && p._n.startsWith(cand) && cand.length >= 6)
        || pool.find((p, j) => j !== i && p.fn !== 'reprise' && cand.startsWith(p._n) && p._n.length >= 6);
      // Titles that decorate their source ("Prologue: Invisible" reprised as
      // "Invisible (Rep)"): accept a whole-word containment, but ONLY when
      // exactly one song matches — an ambiguous containment is worse than no
      // link, because a wrong edge is invisible once it is drawn.
      if (!hit && cand.length >= 6) {
        const inside = pool.filter((p, j) => j !== i && p.fn !== 'reprise'
          && new RegExp('(^|\\s)' + cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|\\s)').test(p._n));
        if (inside.length === 1) hit = inside[0];
      }
      // last resort: an earlier reprise of the same tune points at the same source
      if (!hit) hit = pool.find((p, j) => j < i && p.fn === 'reprise' && p._n === cand);
      if (hit && !found.includes(hit.title)) found.push(hit.title);
    }
    if (!found.length) _unresolved.push(key);
    return { ...s, of: found };
  });
}
