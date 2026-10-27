'use strict';
// The ⌘/ shortcuts list (helpSections in app.js). It is only useful if it
// matches the editor it sits beside, so pin which sections each one gets.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();
const heads = (prose, where) => Array.from(app.helpSections(prose, where)).map((s) => s.head);
const text = (prose, where) => JSON.stringify(app.helpSections(prose, where));

test('the Manuscript list covers writing, new cards and keys', () => {
  assert.deepEqual(heads(false, 'ms'), ['Write it', 'New card, typed on its own line', 'Keys']);
  assert.match(text(false, 'ms'), /Character, Dialogue, Lyrics, Parenthetical, Action, Section/);
  assert.deepEqual(heads(true, 'ms'), ['Write it', 'Text messages', 'New card, typed on its own line', 'Keys']);
});

test('the card editor list leaves out what only the Manuscript can do', () => {
  assert.deepEqual(heads(false, 'card'), ['Write it', 'Keys']);
  assert.doesNotMatch(text(false, 'card'), /Character, Dialogue/);
  assert.doesNotMatch(text(false, 'card'), /Enter<\/kbd>/);
  assert.deepEqual(heads(true, 'card'), ['Write it', 'Text messages', 'Keys']);
});

test('Prose Plot never lists Song Plot markers', () => {
  assert.doesNotMatch(text(true, 'ms'), /stage direction|\[Chorus\]|NAME \^/);
});
