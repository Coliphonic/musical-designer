'use strict';
// Text-message threads in Prose Plot (parseMsgLine / threadTokens in app.js).
// A thread is only plain text in the chapter, found again at render time, so
// what needs pinning is the detection: real threads are found, ordinary prose
// is left alone, and the sides and status lines land where a reader expects.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();
const chapter = (note, extra) => Object.assign({ type: 'scene', act: '1', title: 'Ch', note }, extra);
const tokens = (c) => Array.from(app.threadTokens(app.cardBodyTokens(c), c));

const THREAD = [
  'Her phone lit up on the sill.',
  'Theo: heard about the lamp. you ok?',
  'Mara: ~~no~~',
  'Mara: fine',
  '(Read 11:52 pm)',
  '(no reply · 40 minutes)',
  'Theo: liar',
  'She almost laughed.',
].join('\n');

test('a message line names its sender; a struck-through one is unsent', () => {
  assert.deepEqual({ ...app.parseMsgLine('Theo: liar') }, { who: 'Theo', text: 'liar', unsent: false });
  assert.deepEqual({ ...app.parseMsgLine('Mara: ~~no~~') }, { who: 'Mara', text: 'no', unsent: true });
  assert.equal(app.parseMsgLine('Aunt May: call me')?.who, 'Aunt May');
});

test('ordinary prose is not a message', () => {
  for (const line of ['Note: the lamp was out.', 'She said: nothing.', 'He had one rule: never ask.', 'Theo:no space', '“Theo: come here,” she said.']) {
    assert.equal(app.parseMsgLine(line), null, line);
  }
});

test('a thread is found between paragraphs, with sides, receipts and gaps', () => {
  const t = tokens(chapter(THREAD));
  assert.equal(t[0].type, 'action');
  assert.equal(t[t.length - 1].type, 'action');
  const run = t.slice(1, -1);
  assert.deepEqual(run.map((x) => x.type), ['msg', 'msg', 'msg', 'msg-status', 'msg-status', 'msg']);
  assert.ok(run[0].first && run[run.length - 1].last);
  // The one who replies is the narrator by default, so Mara is on the right.
  assert.deepEqual(run.filter((x) => x.type === 'msg').map((x) => x.side), ['them', 'me', 'me', 'them']);
  assert.equal(run[1].unsent, true);
  assert.equal(run[3].align, 'me');      // the receipt sits under Mara's message
  assert.equal(run[4].align, 'center');  // the silence is centred
  assert.equal(run[0].showWho, true);
  assert.equal(run[5].showWho, true);    // Theo again, after Mara spoke
});

test('swap puts the other sender on the right; "Me" is always the narrator', () => {
  const swapped = tokens(chapter(THREAD, { msgThreads: [{ swap: true }] })).filter((x) => x.type === 'msg');
  assert.deepEqual(swapped.map((x) => x.side), ['me', 'them', 'them', 'me']);
  const me = tokens(chapter('Me: you up?\nJo: no')).filter((x) => x.type === 'msg');
  assert.deepEqual(me.map((x) => x.side), ['me', 'them']);
});

test('a status line alone is just a parenthesis, and each thread is numbered', () => {
  assert.deepEqual(tokens(chapter('She waited.\n(It rained.)\nNothing.')).map((x) => x.type), ['action', 'paren', 'action']);
  const t = tokens(chapter('Jo: hi\nAl: hey\nA paragraph between.\nJo: still there?'));
  assert.deepEqual(t.filter((x) => x.thread !== undefined).map((x) => x.thread), [0, 0, 1]);
});
