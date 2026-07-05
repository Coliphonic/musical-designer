'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();

// Strip the parser-assigned id (random per call) — identity isn't part of the
// round-trip contract, type/text/subtype/dual is.
function stripIds(lines) {
  return lines.map(({ id, ...rest }) => rest);
}

// The real invariant: parse text once, reserialize, reparse — the SECOND
// parse must match the FIRST at the line level. (Not text===text: the
// serializer is allowed to normalize formatting, e.g. inserting a blank line
// before a cue per Fountain convention — what must never happen is losing or
// reclassifying a line on a second pass.)
function assertLinesFixpoint(text, isSong) {
  const firstParse = stripIds(app.seamlessToLines(text, isSong));
  const reserialized = app.linesToSeamless(app.seamlessToLines(text, isSong), isSong);
  const secondParse = stripIds(app.seamlessToLines(reserialized, isSong));
  assert.deepEqual(secondParse, firstParse, `not a fixpoint for:\n${text}`);
}

test('song lines: cue/sung/paren/dual round-trip to a fixpoint', () => {
  assertLinesFixpoint(
    '@WIDGET\nA rather fine morning\nthe tea is getting cold\n\n(beat)\n\n@COPPERTON\nQuite so.',
    true
  );
  assertLinesFixpoint('@WIDGET ^\nHello\n\n@COPPERTON ^\nHi there', true); // dual dialogue
});

test('prose lines: action/scenebreak round-trip to a fixpoint', () => {
  assertLinesFixpoint(
    'The forest was quiet.\nSoot had never seen tea before.\n\n***\n\nThree days later, the letter arrived.',
    false
  );
});

test('section headers ([Act 1], [Scene 2]) round-trip to a fixpoint', () => {
  assertLinesFixpoint('[Act 1]\n\nSomething happens.\n\n[Scene 2]\n\nSomething else happens.', false);
});

test('mergeLineIds keeps ids for unchanged lines, mints fresh ones for new/changed lines', () => {
  const oldLines = [
    { id: 'l1', type: 'cue', text: 'WIDGET' },
    { id: 'l2', type: 'sung', text: 'A rather fine morning' },
    { id: 'l3', type: 'dialogue', text: 'old line' },
  ];
  const newLines = app.seamlessToLines('@WIDGET (sings)\nA rather fine morning\na brand new line', true);
  const merged = app.mergeLineIds(oldLines, newLines);

  assert.equal(merged[0].id, 'l1', 'unchanged cue keeps its id');
  assert.equal(merged[1].id, 'l2', 'unchanged sung line keeps its id');
  assert.notEqual(merged[2].id, 'l3', 'a genuinely new line must not inherit an unrelated old id');
});
