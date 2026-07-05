'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

// A representative show: mix of card types (song/beat/scene), notes, emphasis
// markup, a chord, and non-default storyDna/titlePage content — the fields
// most likely to silently drop something on a save/reload cycle.
function seedRepresentativeShow() {
  const s = app.state;
  s.title = 'Circuits & Sycamores';
  s.mode = 'full';
  s.status = 'active';
  s.folder = 'drafts';
  s.format = 'song';
  s.wordTarget = 75000;
  s.wordCountBaseline = 120;
  s.wordCountBaselineDate = '2026-07-01';
  s.cards = [
    { id: 'c1', type: 'song', act: '1', title: 'A Rather Fine Morning', fn: 'Opening', voicing: 'Duet', min: 3.5, lyrics: '@WIDGET\n[Cmaj7]A **rather** fine morning' },
    { id: 'c2', type: 'beat', act: '1', title: 'The tea ritual', note: 'Copperton prepares the tea ~~slowly~~ with ceremony.', min: 1.5 },
    { id: 'c3', type: 'scene', act: '2A', title: 'THE FOREST — THE GOOD LOG', note: 'A scene-level note.' },
  ];
  s.revisions = [{ id: 'r1', name: 'Blue', color: '#2b6cb0', date: '2026-07-01' }];
  s.currentRev = 'r1';
  s.pageLock = null;
  s.characters = { Widget: { web: { i: 'truth', p: 'flaw' } } };
  s.notes = [{ id: 'n1', text: 'a research note', ts: 1 }];
  s.storyDna = app.migrateDna({ whatIf: 'What if two robots outlived humanity?', beats: { midpoint: 'The letter arrives.' }, stakes: { external: { truth: 'Preserve the forest', flaw: 'Isolation' } } });
  s.titlePage.authors = 'Colin Carter';
  s.titlePage.include.subtitle = true;
  s.scriptHeader.revisionDate = '2026-07-01';
}

test('serialize -> applyShowData -> serialize is a fixpoint', () => {
  seedRepresentativeShow();
  // `updated` is Date.now() at serialize time and legitimately advances
  // between the two calls below — exclude it, it's not part of the
  // round-trip contract for the rest of the payload.
  const omitUpdated = (s) => { const o = JSON.parse(s); delete o.updated; return o; };

  const first = omitUpdated(app.serialize());
  app.applyShowData(JSON.parse(app.serialize()));
  const second = omitUpdated(app.serialize());

  assert.deepEqual(second, first, 'reloading a saved show must reserialize identically');
});

test('serialize drops card ids (server assigns/regenerates them, not the client)', () => {
  seedRepresentativeShow();
  const parsed = JSON.parse(app.serialize());
  for (const c of parsed.cards) assert.equal('id' in c, false);
});

test('applyShowData fills in defaults for a minimal/legacy payload without throwing', () => {
  const minimal = { title: 'Old Show', cards: [] };
  assert.doesNotThrow(() => app.applyShowData(minimal));
  assert.equal(app.state.title, 'Old Show');
  assert.equal(app.state.format, 'song');
  assert.deepEqual(app.state.cards, []);
});
