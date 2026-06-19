// Lyric engine. Loads the packed CMU pronouncing dictionary (word -> rhyme key + syllables)
// and provides syllable counts, rhyme-scheme detection, and a perfect-rhyme suggester.
// Rhyme key = phonemes from the last stressed vowel to the end (each phoneme one char),
// so equal keys = a perfect rhyme (handles love/move, which spelling-matching gets wrong).

const LYRIC = (function () {
  let DICT = null;   // word -> { k: rhymeKey, s: syllables }
  let REV = null;    // rhymeKey -> [words]
  let ready = false;

  function load(text) {
    DICT = new Map();
    REV = new Map();
    const lines = text.split('\n');
    for (const ln of lines) {
      const a = ln.indexOf(' ');
      if (a < 0) continue;
      const b = ln.indexOf(' ', a + 1);
      if (b < 0) continue;
      const word = ln.slice(0, a);
      const key = ln.slice(a + 1, b);
      const syll = +ln.slice(b + 1);
      DICT.set(word, { k: key, s: syll });
      let arr = REV.get(key);
      if (!arr) { arr = []; REV.set(key, arr); }
      arr.push(word);
    }
    ready = true;
  }

  function words(line) { return (line.toLowerCase().match(/[a-z']+/g)) || []; }
  function lastWord(line) { const w = words(line); return w.length ? w[w.length - 1].replace(/^'+|'+$/g, '') : ''; }

  // heuristic fallback for out-of-vocabulary words
  function heurSyll(w) {
    w = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    let s = w.replace(/(?:[^laeiouy]e|es|ed)$/, '').replace(/^y/, '');
    const m = s.match(/[aeiouy]{1,2}/g);
    return m ? Math.max(1, m.length) : 1;
  }
  function syllOf(w) { const e = DICT && DICT.get(w); return e ? e.s : heurSyll(w); }
  function keyOf(w) { const e = DICT && DICT.get(w); return e ? e.k : null; }

  function lineSyll(line) { return words(line).reduce((s, w) => s + syllOf(w), 0); }

  // rhyme-scheme letters, one per line ('' = skipped line, '?' = word not in dict)
  // Only lines starting with ~ (Fountain sung syntax) get a rhyme letter.
  // [Section] and @Cue lines reset the scheme back to A.
  function scheme(lines) {
    const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let seen = {}, next = 0;
    return lines.map((ln) => {
      if (!ln.trim()) return '';
      if (/^\[.+\]$/.test(ln.trim()) || /^@/.test(ln.trim())) { seen = {}; next = 0; return ''; }
      if (!/^~/.test(ln.trim())) return '';   // only track ~ sung lines
      const stripped = ln.trim().slice(1).trim();
      const k = keyOf(lastWord(stripped));
      if (!k) return '?';
      if (seen[k] == null) { seen[k] = AL[next % 26]; next++; }
      return seen[k];
    });
  }

  function suggest(word) {
    word = (word || '').toLowerCase();
    const k = keyOf(word);
    if (!k || !REV) return { ok: !!k, perfect: [] };
    const q = syllOf(word);
    const qlen = word.length;
    let list = (REV.get(k) || []).filter((w) => w !== word && !w.includes("'") && !w.includes('.') && w.length >= 3);
    list.sort((a, b) => {
      const sd = Math.abs(DICT.get(a).s - q) - Math.abs(DICT.get(b).s - q);
      if (sd !== 0) return sd;
      return Math.abs(a.length - qlen) - Math.abs(b.length - qlen) || (a < b ? -1 : 1);
    });
    return { ok: true, perfect: list.slice(0, 28) };
  }

  // Near (slant) rhymes: same stressed vowel phoneme, different ending.
  // The rhyme key's first character encodes the stressed vowel, so words
  // sharing that character but with a different full key are slant rhymes.
  function nearSuggest(word) {
    word = (word || '').toLowerCase();
    const k = keyOf(word);
    if (!k || !REV) return { ok: !!k, near: [] };
    const vowel = k[0]; // first char = stressed vowel phoneme
    const q = syllOf(word);
    const qlen = word.length;
    const seen = new Set(REV.get(k) || []); // exclude perfect rhymes
    seen.add(word);
    const list = [];
    for (const [rk, words] of REV) {
      if (rk[0] !== vowel || rk === k) continue;
      for (const w of words) {
        if (!seen.has(w) && !w.includes("'") && !w.includes('.') && w.length >= 3) list.push(w);
      }
    }
    list.sort((a, b) => {
      const ea = DICT.get(a), eb = DICT.get(b);
      const sd = Math.abs(ea.s - q) - Math.abs(eb.s - q);
      if (sd !== 0) return sd;
      return Math.abs(a.length - qlen) - Math.abs(b.length - qlen) || (a < b ? -1 : 1);
    });
    return { ok: true, near: list.slice(0, 40) };
  }

  return {
    load,
    ready: () => ready,
    lineSyll, scheme, suggest, nearSuggest, lastWord, keyOf, syllOf,
    inDict: (w) => !!(DICT && DICT.get((w || '').toLowerCase())),
  };
})();
