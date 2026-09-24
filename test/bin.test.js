'use strict';
// The Board's bin (binCard / putBackCard / unbinCard in app.js). A binned card
// leaves state.cards entirely, which is what keeps it out of the runtime, the
// percentages, the Manuscript and every export without any of them knowing the
// bin exists. So the things worth pinning are: it really leaves, it survives a
// save/load, and Put back returns it to the place it came from.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

const show = () => ({
  title: 'Bin test', mode: 'full', format: 'song',
  cards: [
    { type: 'song', act: '1', title: 'Opening', fn: 'opening', min: 4 },
    { type: 'beat', act: '1', title: 'Middle beat', note: 'a draft', min: 2 },
    { type: 'song', act: '1', title: 'I Want', fn: 'iwant', min: 3 },
    { type: 'song', act: '2A', title: 'Charm song', fn: 'charm', min: 3 },
  ],
});
const titles = () => app.state.cards.map((c) => c.title);

test('binning takes a card out of the story and keeps it in the bin', () => {
  app.applyShowData(show());
  app.binCard(1);
  assert.deepEqual(titles(), ['Opening', 'I Want', 'Charm song']);
  assert.equal(app.state.bin.length, 1);
  assert.equal(app.state.bin[0].title, 'Middle beat');
  assert.equal(app.state.bin[0].act, '1', 'keeps the act it came from');
  assert.equal(app.state.bin[0].binPos, 1, 'remembers its place within the act');
});

test('the bin survives a save and a reload', () => {
  app.applyShowData(show());
  app.binCard(1);
  const saved = JSON.parse(app.serialize());
  assert.equal(saved.cards.length, 3);
  assert.equal(saved.bin.length, 1);
  assert.equal(saved.bin[0].id, undefined, 'ids are session-only, never stored');
  app.applyShowData(saved);
  assert.equal(app.state.bin[0].title, 'Middle beat');
  assert.ok(app.state.bin[0].id, 'a reloaded bin card gets a fresh id');
});

test('an old show with no bin field loads with an empty bin', () => {
  app.applyShowData(show());
  // length, not deepEqual([]): the array was made inside the vm context, so
  // its prototype isn't this realm's Array and deepStrictEqual rejects it.
  assert.equal(app.state.bin.length, 0);
});

test('Put back returns a card to where it was, even after the act changed', () => {
  app.applyShowData(show());
  app.binCard(1);
  app.putBackCard(0);
  assert.deepEqual(titles(), ['Opening', 'Middle beat', 'I Want', 'Charm song']);
  assert.equal(app.state.bin.length, 0);
  assert.equal(app.state.cards[1].binPos, undefined, 'the bookkeeping is dropped on the way out');

  // Its act shrank while it was away: it lands at the end of the act instead.
  app.applyShowData(show());
  app.binCard(2); // I Want, place 2 in Act 1
  app.binCard(1); // Middle beat
  app.putBackCard(1); // I Want: Act 1 now holds only Opening
  assert.deepEqual(titles(), ['Opening', 'I Want', 'Charm song']);
});

test('Put back into an act that has since emptied still lands in that act', () => {
  app.applyShowData(show());
  app.binCard(3); // the only 2A card
  app.putBackCard(0);
  assert.deepEqual(titles(), ['Opening', 'Middle beat', 'I Want', 'Charm song']);
  assert.equal(app.state.cards[3].act, '2A');
});

test('dragging a binned card onto the board restores it to the drop target', () => {
  app.applyShowData(show());
  app.binCard(0); // Opening
  app.unbinCard(0, 3, '2A'); // dropped after Charm song
  assert.deepEqual(titles(), ['Middle beat', 'I Want', 'Charm song', 'Opening']);
  assert.equal(app.state.cards[3].act, '2A');
});

test('the drawer and pill build for an empty and a full bin', () => {
  app.applyShowData(show());
  app.state.readonly = false;
  assert.doesNotThrow(() => app.renderBin());
  app.binCard(1);
  assert.doesNotThrow(() => app.renderBin());
  app.state.readonly = true;
});

// Copy to another project: the copy is written into the other show's bin, so
// the pieces worth pinning are the payload (no session id, no stale binPos,
// a source label) and that a copied card is a normal bin card once it's there.
test('a copied card is a clean, stored snapshot that names its source', () => {
  app.applyShowData(show());
  const c = app.state.cards[1];
  const copy = app.copiedCard(c, 'Old draft');
  assert.equal(copy.id, undefined, 'no session id travels');
  assert.equal(copy.binFrom, 'Old draft');
  assert.equal(copy.title, 'Middle beat');
  assert.equal(copy.note, 'a draft');
  copy.title = 'changed';
  assert.equal(c.title, 'Middle beat', 'the original is untouched');
});

test('a copy lands on top of the other show\'s bin and survives its load', () => {
  app.applyShowData(show());
  app.binCard(0); // a card already binned: its binPos must not travel
  const copy = app.copiedCard(app.state.bin[0], 'Old draft');
  assert.equal(copy.binPos, undefined);
  const target = { title: 'New show', mode: 'full', format: 'song', role: 'editor', cards: [], bin: [{ type: 'beat', act: '1', title: 'Already here' }] };
  const out = app.addCopyToShow(target, copy);
  assert.equal(out.role, undefined, 'the GET-only role field is not written back');
  assert.deepEqual(Array.from(out.bin, (b) => b.title), ['Opening', 'Already here']);
  app.applyShowData(out);
  assert.equal(app.state.bin[0].binFrom, 'Old draft');
  app.putBackCard(0);
  assert.equal(app.state.cards[0].title, 'Opening');
  assert.equal(app.state.cards[0].binFrom, undefined, 'the source label goes once it is placed');
});

test('only same-format, editable, unarchived other projects are offered', () => {
  app.applyShowData(show());
  app.state.projectId = 'me';
  app.state.projects = [
    { id: 'me', title: 'This one', format: 'song' },
    { id: 'a', title: 'Song show', format: 'song', role: 'owner' },
    { id: 'b', title: 'Novel', format: 'prose' },
    { id: 'c', title: 'View only', format: 'song', role: 'viewer' },
    { id: 'd', title: 'Old', format: 'song', status: 'archived' },
    { id: 'e', title: 'Legacy, no format', role: 'editor' },
  ];
  assert.deepEqual(Array.from(app.copyTargets(), (p) => p.id), ['a', 'e']);
});
