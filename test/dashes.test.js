'use strict';
// A script dash belongs to the word before it: "word --" must never wrap with
// the dashes alone at the start of the next line (emphToHtml / glueDashes).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');

const app = loadApp();
const NB = ' ';

test('the space before -- becomes a no-break space', () => {
  assert.equal(app.emphToHtml('If you would just let me --'), 'If you would just let me' + NB + '--');
  assert.equal(app.emphToHtml('I told you -- twice.'), 'I told you' + NB + '-- twice.');
  assert.equal(app.emphToHtml('*Stop* --'), '<i>Stop</i>' + NB + '--');
});

test('em dashes get the same glue, other text is untouched', () => {
  assert.equal(app.emphToHtml('wait — no'), 'wait' + NB + '— no');
  assert.equal(app.emphToHtml('-- finish a sentence.'), '-- finish a sentence.');
  assert.equal(app.emphToHtml('word--word and a - hyphen'), 'word--word and a - hyphen');
});
