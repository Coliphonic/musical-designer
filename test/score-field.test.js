'use strict';
// Smoke tests for the Score Field page (buildScoreFieldPage in app.js).
//
// There is no layout engine behind the harness's DOM stub, so these cannot say
// anything about how the field LOOKS. What they do cover is the part that broke
// twice while it was being written: the page is ~120 lines of data preparation —
// grouping 1,809 songs by show, joining them to ATLAS_SHOWS, filtering by form,
// sorting three ways, and mapping titles back to shelf keys — and any reference
// error or bad assumption in there takes the whole page down with it. Running
// the real builder against the real corpus catches that in milliseconds.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

test('the harness has the real corpus arrays in scope', () => {
  assert.ok(Array.isArray(app.ATLAS_DATA), 'ATLAS_DATA should be the real array');
  assert.ok(app.ATLAS_DATA.length > 1500, 'expected the full song corpus, got ' + app.ATLAS_DATA.length);
  assert.ok(Array.isArray(app.ATLAS_SHOWS) && app.ATLAS_SHOWS.length > 90);
  // Every show row the field draws needs these three or it renders a blank strip.
  for (const s of app.ATLAS_SHOWS) {
    assert.ok(typeof s.show === 'string' && s.show, 'show title missing');
    assert.ok(typeof s.a1share === 'number' && s.a1share > 0 && s.a1share < 1,
      'a1share out of range for ' + s.show + ': ' + s.a1share);
    assert.ok(['one', 'full', 'film', 'other'].includes(s.kind), 'bad kind for ' + s.show + ': ' + s.kind);
  }
});

test('buildScoreFieldPage runs against the real corpus in every sort and filter', () => {
  assert.equal(typeof app.buildScoreFieldPage, 'function', 'builder should be exported');
  // Default state.
  assert.doesNotThrow(() => app.buildScoreFieldPage(), 'default build threw');
  // The segment controls write state.sfSort / state.sfForm and rebuild, so
  // setting them here drives the real branches rather than re-running the
  // default twelve times.
  for (const sort of ['share', 'year', 'title']) {
    for (const form of [null, 'one', 'full', 'film']) {
      app.state.sfSort = sort;
      app.state.sfForm = form;
      assert.doesNotThrow(() => app.buildScoreFieldPage(),
        'build threw for sort=' + sort + ' form=' + form);
    }
  }
  // An unknown stored value must fall back rather than render an empty field.
  app.state.sfSort = 'nonsense';
  app.state.sfForm = 'nonsense';
  assert.doesNotThrow(() => app.buildScoreFieldPage(), 'build threw on unrecognized state');
  app.state.sfSort = 'share';
  app.state.sfForm = null;
});

test('every reprise edge in the corpus points backwards to a real source', () => {
  // The motif web the Atlas draws is only honest if `of` holds positions that
  // exist in the same show and sit EARLIER. A forward or dangling edge would
  // draw a line claiming a song reprises something it precedes.
  const byShow = new Map();
  for (const r of app.ATLAS_DATA) {
    if (!byShow.has(r.show)) byShow.set(r.show, []);
    byShow.get(r.show).push(r);
  }
  let edges = 0;
  for (const r of app.ATLAS_DATA) {
    if (!r.of) continue;
    for (const p of r.of) {
      edges++;
      assert.ok(p < r.pos, `${r.show} :: ${r.t} reprises something at ${p} but sits at ${r.pos}`);
      assert.ok(byShow.get(r.show).some((x) => x.pos === p),
        `${r.show} :: ${r.t} points at ${p}, which is not a song in that show`);
    }
  }
  assert.ok(edges > 90, 'expected the corpus reprise links to be present, found ' + edges);
});
