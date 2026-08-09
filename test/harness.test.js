'use strict';
// Tests for the harness itself, not for app.js.
//
// These exist because of a specific failure mode: for a while `load-app.js`
// faked `SHOWS` with a two-key stub and swallowed any boot-time rejection whose
// message matched /SHOWS|LYRIC/. When openReference() grew a `NOVELS` lookup,
// the boot tail's async fallback threw past the synchronous try/catch, and all
// four test files reported FAIL on teardown while every assertion inside them
// passed — which reads, at a glance, exactly like a broken app. The harness now
// loads app/data.js for real and treats any boot rejection as a failure, and
// these two tests are what keep it that way.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

test('the harness evaluates app/data.js for real, not a stub', () => {
  assert.ok(app.SHOWS, 'SHOWS should be defined');
  assert.equal(app.SHOWS.fiddler.title, 'Fiddler on the Roof',
    'a stubbed SHOWS would not carry the real reference titles');
  assert.ok(app.SHOWS.fiddler.cards.length > 0, 'the real entry is fully carded');

  // The exact global whose absence broke every test file: openReference() reads
  // NOVELS on the boot path, so a sandbox that defines SHOWS but not NOVELS
  // fails asynchronously, after the assertions have already passed.
  assert.ok(app.NOVELS, 'NOVELS should be defined — openReference() reads it on the boot path');
  assert.ok(Object.keys(app.NOVELS).length > 0, 'NOVELS should carry the real Prose Plot shelf');

  assert.ok(Array.isArray(app.TEMPLATES), 'TEMPLATES should be the real registry');
  assert.ok(app.TEMPLATES.some((t) => t.id === 'full-mean'), 'the two-act mean should be present');
});

test('app.js boots to completion — its async tail resolves instead of rejecting', async () => {
  // The boot tail is fetch().then() chains that finish long after loadApp()
  // returns. Let the microtask/timer queues drain, then check the end state:
  // with the fake fetch reporting no projects, boot falls through to
  // openReference('fiddler'). If any step throws, either state.showKey never
  // arrives (caught here) or the unhandledRejection guard fails the file.
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(app.state.showKey, 'fiddler',
    'boot should have fallen through to openReference("fiddler") — if this is null, '
    + 'a step in the boot chain threw and the sandbox is missing something');
  assert.ok(app.state.cards.length > 0, 'the opened reference should have rendered its cards');
});
