'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

test('countWords ignores markup characters and inline notes/chords', () => {
  assert.equal(app.countWords('one two three'), 3);
  assert.equal(app.countWords('**bold** *italic* _u_ ~~s~~ ==h=='), 5);
  assert.equal(app.countWords('[Cmaj7]word [G]another'), 2);
  const enc = app.b64encode('a note');
  assert.equal(app.countWords(`before [[note:n1:${enc}]]highlighted bit[[/note]] after`), 4);
  assert.equal(app.countWords(''), 0);
  assert.equal(app.countWords(null), 0);
});

test('migrateLegacyIds re-mints colliding c-prefixed note/revision ids without touching modern ids', () => {
  app.state.notes = [{ id: 'c5', text: 'legacy note' }, { id: 'n_modern1', text: 'modern note' }];
  app.state.revisions = [{ id: 'c9', name: 'Blue' }];
  app.state.currentRev = 'c9';
  app.state.pageLock = { lockedAt: 'c9', date: 1, pages: [] };

  app.migrateLegacyIds();

  assert.notEqual(app.state.notes[0].id, 'c5', 'legacy c-prefixed note id must be re-minted');
  assert.match(app.state.notes[0].id, /^n/);
  assert.equal(app.state.notes[1].id, 'n_modern1', 'already-modern id must be left alone');

  assert.notEqual(app.state.revisions[0].id, 'c9');
  assert.equal(app.state.currentRev, app.state.revisions[0].id, 'currentRev pointer must follow the re-mint');
  assert.equal(app.state.pageLock.lockedAt, app.state.revisions[0].id, 'pageLock.lockedAt pointer must follow the re-mint too');
});

test('cardBodyField: beats always use lyrics, scenes default to note, songs default to lyrics', () => {
  assert.equal(app.cardBodyField({ type: 'beat', lyrics: '', note: 'has content' }), 'lyrics');
  assert.equal(app.cardBodyField({ type: 'scene', lyrics: '', note: '' }), 'note');
  assert.equal(app.cardBodyField({ type: 'song', lyrics: '', note: '' }), 'lyrics');
  assert.equal(app.cardBodyField({ type: 'scene', lyrics: 'has content', note: '' }), 'lyrics');
});
