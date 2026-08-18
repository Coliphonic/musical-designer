'use strict';
// Smoke tests for the Library's Atlas page (buildAtlasPage → buildDnaAtlas with
// {corpusOnly:true}). Same pattern as score-field/ridgeline: no layout engine
// behind the stub, so this says nothing about how the dial LOOKS — what it
// covers is that the corpus-only branch of a 490-line function that normally
// reads the open board still runs when there is no board worth reading.
//
// That is the specific risk here. buildDnaAtlas was written assuming a project
// is open, and corpusOnly makes `mine` empty and skips the board read; every
// own-show block is guarded on mine.length, and this test is what keeps a
// future edit from adding an unguarded one.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

test('the Library Atlas builds corpus-only, with and without a project open', () => {
  assert.equal(typeof app.buildAtlasPage, 'function', 'page builder should be exported');
  assert.equal(typeof app.buildDnaAtlas, 'function', 'dial builder should be exported');
  assert.doesNotThrow(() => app.buildAtlasPage(), 'page build threw');

  // No project, no cards — the state the page must survive, since it is reached
  // from the Library where nothing need be open.
  const cards = app.state.cards;
  const title = app.state.title;
  app.state.cards = [];
  app.state.title = '';
  assert.doesNotThrow(() => app.buildAtlasPage(), 'build threw with an empty board');
  app.state.cards = cards;
  app.state.title = title;
});

test('corpusOnly survives a prose project, where the show-level Atlas bails', () => {
  // The Story DNA dial returns early for prose (it is a musical instrument, and
  // a novel has no songs). The Library page must NOT inherit that: the corpus
  // is musicals regardless of which project happens to be open, and Prose Plot
  // users reach this page from a shelf that has no board behind it.
  const format = app.state.format;
  app.state.format = 'prose';
  assert.doesNotThrow(() => app.buildAtlasPage(), 'corpus-only build threw for a prose project');
  app.state.format = format;
});

test('the corpus median act break is a real number in the dial-clock range', () => {
  // corpusOnly puts the intermission tick at the staged corpus's median a1share
  // rather than reading the board. If that ever returns undefined or drifts out
  // of range, the dial silently divides the night in the wrong place.
  const staged = app.ATLAS_SHOWS.filter((s) => s.kind !== 'film');
  assert.ok(staged.length > 50, 'expected the staged corpus, got ' + staged.length);
  const shares = staged.map((s) => s.a1share).sort((a, b) => a - b);
  const median = shares[Math.floor(shares.length / 2)];
  assert.ok(typeof median === 'number' && median > 0.4 && median < 0.8,
    'corpus median act break out of range: ' + median);
});
