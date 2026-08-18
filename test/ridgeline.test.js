'use strict';
// Smoke tests for the Function Ridgeline page (buildRidgelinePage in app.js),
// on the score-field.test.js pattern: no layout engine behind the DOM stub, so
// nothing here says how the range LOOKS — but the builder is ~150 lines of
// data preparation (canonicalizing fn keys, cohort filtering, KDE, quartiles)
// and a reference error anywhere in there takes the whole page down. Running
// the real builder against the real corpus catches that in milliseconds.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

test('buildRidgelinePage runs against the real corpus in every form', () => {
  assert.equal(typeof app.buildRidgelinePage, 'function', 'builder should be exported');
  assert.doesNotThrow(() => app.buildRidgelinePage(), 'default build threw');
  // The Form segments write state.rgForm and rebuild; driving state here runs
  // the real branches instead of re-running the default four times.
  for (const form of [null, 'one', 'full', 'film']) {
    app.state.rgForm = form;
    assert.doesNotThrow(() => app.buildRidgelinePage(), 'build threw for form=' + form);
  }
  // An unknown stored value must fall back rather than render an empty range.
  app.state.rgForm = 'nonsense';
  assert.doesNotThrow(() => app.buildRidgelinePage(), 'build threw on unrecognized state');
  app.state.rgForm = null;
});

test('every corpus function key resolves to an FN entry with a family and label', () => {
  // The ridgeline colours and labels every ridge from FN via atlasCanon. A new
  // corpus batch that introduces an unmapped fn key would silently render a
  // grey ridge labelled with the raw key — catch it here instead.
  const CANON = { 'i want': 'iwant', 'act finale': 'finale', 'finale ultimo': 'finaleultimo' };
  const seen = new Set();
  for (const r of app.ATLAS_DATA) seen.add(CANON[r.fn] || r.fn);
  for (const fn of seen) {
    const meta = app.FN[fn];
    assert.ok(meta, 'corpus fn key "' + fn + '" has no FN entry');
    assert.ok(meta.fam && meta.label, 'FN entry for "' + fn + '" is missing fam or label');
  }
  // The full corpus draws all eighteen ridges; if this number moves, a batch
  // added or retired a function and the beat map docs should say so.
  assert.equal(seen.size, 18, 'expected 18 distinct canonical functions, got ' + seen.size);
});
