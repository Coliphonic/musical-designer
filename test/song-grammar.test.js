'use strict';
// Song-lyric grammar 2: in a song, a plain line is a lyric whether or not a
// character name sits above it, so a solo (or the verse after a blank line)
// needs no ~. Stage directions are marked with !. Songs saved before that
// (no `grammar` stamp on the card) are converted once on load by giving ! to
// exactly the lines the old rules read as Action, so nothing written changes
// type. Beats and scenes are untouched: plain text there is still Action.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();
// Array.from: parseLyricLines runs in the app's vm realm, and deepEqual won't
// match an array from another realm against a literal.
const types = (text, sung = true) => Array.from(app.parseLyricLines(text, sung), (t) => t.type);

test('a solo song with no character name reads as lyrics, verse after verse', () => {
  assert.deepEqual(types('I never meant to stay\nthe lights went out\n\nand still I counted ships'),
    ['sung', 'sung', 'blank', 'sung']);
});

test('! marks a stage direction, and the next plain line is a lyric again', () => {
  const toks = app.parseLyricLines('first line\n!She crosses to the window\nsecond line', true);
  assert.deepEqual(Array.from(toks, (t) => t.type), ['sung', 'action', 'sung']);
  assert.equal(toks[1].text, 'She crosses to the window');
});

test('a CAPS line after a blank is a singer; straight under a lyric it is a shouted lyric', () => {
  assert.deepEqual(types('a lyric\n\nMARA\nher line'), ['sung', 'blank', 'cue', 'sung']);
  assert.deepEqual(types('a lyric\nHEY'), ['sung', 'sung']);
});

test('beats keep the old rule: plain text outside a character is Action', () => {
  assert.deepEqual(types('She waits.\n\nMARA\nWhere were you?', false), ['action', 'blank', 'cue', 'dialogue']);
});

test('a song action row is written with ! and survives the round trip', () => {
  const rows = [{ type: 'sung', text: 'a lyric' }, { type: 'action', text: 'She sits.' }, { type: 'sung', text: 'another' }];
  const text = app.linesToSeamless(rows, true);
  assert.equal(text, 'a lyric\n!She sits.\nanother');
  assert.deepEqual(types(text), ['sung', 'action', 'sung']);
});

test('an old song is converted once: its stage directions stay Action', () => {
  const old = { type: 'song', title: 'Old', lyrics: 'MARA\nverse one\n\nShe crosses.\n\nMARA\nverse two\n!Already forced.' };
  const c = app.migrateSongGrammar(Object.assign({}, old));
  assert.equal(c.lyrics, 'MARA\nverse one\n\n!She crosses.\n\nMARA\nverse two\n!Already forced.');
  assert.equal(c.grammar, 2);
  assert.deepEqual(types(c.lyrics), ['cue', 'sung', 'blank', 'action', 'blank', 'cue', 'sung', 'action']);
  // Stamped cards are never touched again, so a lyric written today stays one.
  const fresh = { type: 'song', grammar: 2, lyrics: 'a solo line' };
  assert.equal(app.migrateSongGrammar(fresh).lyrics, 'a solo line');
});

test('loading stamps and converts; saving writes the stamp on every card', () => {
  app.applyShowData({ title: 'G', mode: 'full', format: 'song', cards: [
    { type: 'song', act: '1', title: 'Old', lyrics: 'Lights up.\n\nMARA\nsing' },
    { type: 'beat', act: '1', title: 'Scene', lyrics: 'She waits.' },
  ], bin: [{ type: 'song', act: '1', title: 'Binned', lyrics: 'A pause.' }] });
  assert.equal(app.state.cards[0].lyrics, '!Lights up.\n\nMARA\nsing');
  assert.equal(app.state.cards[1].lyrics, 'She waits.', 'beats are never converted');
  assert.equal(app.state.bin[0].lyrics, '!A pause.');
  const out = app.serializeData();
  assert.ok(out.cards.every((c) => c.grammar === 2) && out.bin.every((c) => c.grammar === 2));
  // A card made this session has no stamp in memory; storedCard adds it.
  assert.equal(app.storedCard({ id: 'x', type: 'song', lyrics: 'new' }).grammar, 2);
  assert.equal(app.storedCard({ id: 'x', type: 'song' }).id, undefined);
});
