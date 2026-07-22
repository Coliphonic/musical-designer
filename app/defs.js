// Dictionary engine. Loads a packed word -> definitions list (derived from
// Princeton WordNet 3.1, single-word lemmas only, usage examples stripped and
// senses capped) and looks up definitions for a word. Mirrors lyric.js and
// thesaurus.js's load/ready/lookup shape.
//
// Packed line format:  word \t pos:gloss|pos:gloss[|=pos:base…]
// where pos is one of n / v / adj / adv, and a trailing `=pos:base` record is
// an irregular-inflection redirect (men -> man, went -> go) from WordNet's
// per-POS exception lists — the pos says which of the base's senses the
// inflection actually is ("is" wants be-the-verb, not Be-the-element).

const DEFS = (function () {
  let DICT = null;   // word -> [{ pos, label, gloss }]
  let ALIAS = null;  // irregular form -> [{ pos, base }]
  let ready = false;

  const POS_LABEL = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' };

  function load(text) {
    DICT = new Map();
    ALIAS = new Map();
    const lines = text.split('\n');
    for (const ln of lines) {
      const t = ln.indexOf('\t');
      if (t < 0) continue;
      const word = ln.slice(0, t);
      const senses = [];
      for (const rec of ln.slice(t + 1).split('|')) {
        const c = rec.indexOf(':');
        if (c < 0) continue;
        if (rec.startsWith('=')) {
          let arr = ALIAS.get(word);
          if (!arr) { arr = []; ALIAS.set(word, arr); }
          arr.push({ pos: rec.slice(1, c), base: rec.slice(c + 1) });
          continue;
        }
        const pos = rec.slice(0, c), gloss = rec.slice(c + 1);
        if (gloss) senses.push({ pos, label: POS_LABEL[pos] || pos, gloss });
      }
      if (senses.length) DICT.set(word, senses);
    }
    ready = true;
  }

  // Regular inflections, WordNet-morphy style: the candidate base forms of a
  // word, most likely first. Lyric writers select inflected words constantly
  // ("chairs", "sings", "running"), so an exact-match-only dictionary reads as
  // broken. Irregulars are handled separately by ALIAS.
  const RULES = [
    ['ies', 'y'], ['ses', 's'], ['xes', 'x'], ['zes', 'z'], ['ches', 'ch'], ['shes', 'sh'],
    ['s', ''], ['es', ''], ['ed', 'e'], ['ed', ''], ['ing', 'e'], ['ing', ''],
    ['er', ''], ['er', 'e'], ['est', ''], ['est', 'e'], ['ly', ''],
  ];

  function baseForms(word) {
    word = (word || '').toLowerCase().replace(/[^a-z'-]/g, '');
    if (!word) return [];
    const out = [word];
    const push = (w) => { if (w.length >= 2 && !out.includes(w)) out.push(w); };
    for (const a of (ALIAS && ALIAS.get(word)) || []) push(a.base);
    for (const [suf, rep] of RULES) {
      if (word.length > suf.length + 1 && word.endsWith(suf)) {
        const stem = word.slice(0, -suf.length) + rep;
        push(stem);
        // undo consonant doubling: "running" -> "runn" -> "run"
        if (!rep && /([bdfglmnprt])\1$/.test(stem)) push(stem.slice(0, -1));
      }
    }
    return out;
  }

  // Own senses first, then irregular redirects (matching part of speech ahead
  // of the rest — "is" leads with be-the-verb), then regular suffix-stripped
  // forms. "men" shows its own reading and "man" too, rather than hiding the
  // obvious one.
  function lookup(word) {
    if (!DICT) return [];
    const norm = (word || '').toLowerCase().replace(/[^a-z'-]/g, '');
    if (!norm) return [];
    const out = [];
    const seen = new Set();
    const add = (s) => { if (!seen.has(s.gloss)) { seen.add(s.gloss); out.push(s); } };
    for (const s of DICT.get(norm) || []) add(s);
    for (const a of ALIAS.get(norm) || []) {
      const senses = DICT.get(a.base) || [];
      for (const s of senses) { if (s.pos === a.pos) add(s); }
      for (const s of senses) { if (s.pos !== a.pos) add(s); }
    }
    if (out.length < 4) {
      for (const f of baseForms(norm)) {
        if (f === norm) continue;
        for (const s of DICT.get(f) || []) add(s);
        if (out.length >= 4) break;
      }
    }
    return out.slice(0, 4);
  }

  return {
    load,
    ready: () => ready,
    lookup,
    baseForms,
    inDict: (w) => !!(DICT && lookup(w).length),
  };
})();
