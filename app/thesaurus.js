// Thesaurus engine for Prose Plot. Loads a packed word -> synonym list (derived
// from the public-domain Moby Thesaurus, filtered/ranked for common usage) and
// looks up synonyms for a word. Mirrors lyric.js's load/ready/lookup shape.

const THES = (function () {
  let DICT = null;  // word -> [synonyms]
  let ready = false;

  function load(text) {
    DICT = new Map();
    const lines = text.split('\n');
    for (const ln of lines) {
      const t = ln.indexOf('\t');
      if (t < 0) continue;
      const word = ln.slice(0, t);
      const syns = ln.slice(t + 1).split(',').filter(Boolean);
      DICT.set(word, syns);
    }
    ready = true;
  }

  function lookup(word) {
    word = (word || '').toLowerCase();
    const list = DICT && DICT.get(word);
    return list || [];
  }

  return {
    load,
    ready: () => ready,
    lookup,
    inDict: (w) => !!(DICT && DICT.get((w || '').toLowerCase())),
  };
})();
