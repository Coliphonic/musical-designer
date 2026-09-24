'use strict';
// The Story Board template (full-board): Save the Cat's board for a two-act
// book musical, built from 20 beat sheets (corpus/story-beats/). These tests
// pin what makes it different from every corpus-cut shape: its lanes follow
// Snyder's act boundaries, its song seats ship working titles that carry into
// a created show, and its beats land where the research measured them.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();
const board = () => app.TEMPLATES.find((t) => t.id === 'full-board');
const LANES = ['1', '2A', '2B', '3'];

test('the Story Board is registered as a full-length shape: 19 songs, 40 beats', () => {
  const t = board();
  assert.ok(t, 'full-board should be in TEMPLATES');
  assert.equal(t.mode, 'full');
  assert.equal(t.cards.filter((c) => c.type === 'song').length, 19);
  assert.equal(t.cards.filter((c) => c.type === 'beat').length, 40);
  for (const c of t.cards) assert.ok(LANES.includes(c.act), `card on an unknown lane: ${c.act}`);
  // Cards must run lane by lane, or the board scatters them.
  const order = Array.from(t.cards, (c) => LANES.indexOf(c.act)); // copy out of the sandbox realm
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'cards should be grouped in lane order');
});

test('lanes follow the act boundaries: Break into Two opens 2A, Break into Three opens 3', () => {
  const lane = (a) => board().cards.filter((c) => c.act === a);
  assert.equal(lane('2A')[0].beatFn, 'Break into Two');
  assert.equal(lane('3')[0].beatFn, 'Break into Three');
  assert.equal(lane('2A').at(-1).fn, 'finale', 'Act One ends on its finale, just before the interval');
  assert.ok(lane('1').every((c) => c.beatFn !== 'Break into Two'), 'Break into Two must not sit in lane 1');
  assert.ok(lane('2B').every((c) => c.beatFn !== 'Break into Three'), 'Break into Three must not sit in lane 2B');
});

test('every seat is complete: songs carry a working title and a known function, beats a prompt', () => {
  for (const c of board().cards) {
    if (c.type === 'song') {
      assert.ok(c.title, 'song seat without a working title');
      assert.ok(app.FN[c.fn], `unknown function key: ${c.fn}`);
    } else {
      assert.ok(c.beatFn && c.title && c.note, `incomplete beat card: ${c.title}`);
      // Colin's copy rule for user-facing text.
      assert.ok(!c.note.includes('—'), `em dash in the Beatline of "${c.title}"`);
    }
    assert.ok(c.min > 0, 'every card needs minutes so the board clock works');
  }
});

test('the key beats land where the 20 shows put them (minute clock)', () => {
  const cards = board().cards;
  const total = cards.reduce((s, c) => s + c.min, 0);
  let cum = 0; const at = {};
  for (const c of cards) { const k = c.beatFn; if (k && !(k in at)) at[k] = (cum + c.min / 2) / total; cum += c.min; }
  const within = (k, lo, hi) => assert.ok(at[k] >= lo && at[k] <= hi, `${k} at ${(100 * at[k]).toFixed(0)}%, expected ${lo * 100}–${hi * 100}%`);
  within('Catalyst', 0.08, 0.15);
  within('Break into Two', 0.19, 0.27);
  within('Midpoint', 0.42, 0.55);
  within('All Is Lost', 0.70, 0.80);
  within('Break into Three', 0.80, 0.90);
});

test('working titles lead the preview label, and seed a created show unchanged', () => {
  // Corpus-cut shapes ship title: '' and keep their old label exactly.
  assert.equal(app.templateSeatLabel({ fn: 'opening', voicing: 'Company', title: '' }), 'Opening — Company');
  assert.equal(app.templateSeatLabel({ fn: 'production', voicing: 'Company', title: 'Candy dish' }), 'Candy dish · Production — Company');
  // createProject copies templateCardsFor() verbatim into the new show's body.
  const seeded = app.templateCardsFor('full', 'full-board').filter((c) => c.type === 'song').map((c) => c.title);
  assert.ok(seeded.includes('Candy dish') && seeded.includes('Tent pole'), 'working titles should reach a created show');
  assert.ok(app.templateCardsFor('full', 'full-mean').every((c) => c.type !== 'song' || c.title === ''), 'corpus shapes stay untitled');
});

test('the read-only preview opens with 59 cards and labelled seats', () => {
  app.openTemplatePreview('full-board');
  assert.equal(app.state.templateKey, 'full-board');
  assert.equal(app.state.readonly, true);
  assert.equal(app.state.cards.length, 59);
  assert.ok(app.state.cards.some((c) => c.title === 'Candy dish · Production — Company'));
});
