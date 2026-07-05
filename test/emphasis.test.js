'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app');
const { htmlToFakeNode } = require('./html-fixture');

const app = loadApp();

test('emphToHtml: bold/italic/underline/strike/highlight', () => {
  assert.equal(app.emphToHtml('**bold**'), '<b>bold</b>');
  assert.equal(app.emphToHtml('*italic*'), '<i>italic</i>');
  assert.equal(app.emphToHtml('_underline_'), '<u>underline</u>');
  assert.equal(app.emphToHtml('~~strike~~'), '<s>strike</s>');
  assert.equal(app.emphToHtml('==highlight=='), '<mark>highlight</mark>');
  assert.equal(app.emphToHtml('***both***'), '<b><i>both</i></b>');
});

test('emphToHtml escapes HTML before applying markup (no injection via a card body)', () => {
  const html = app.emphToHtml('<script>alert(1)</script> **bold**');
  assert.ok(!html.includes('<script>'), 'raw <script> tag must be escaped');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<b>bold</b>'));
});

test('emphToHtml: inline chord marker', () => {
  const html = app.emphToHtml('[Cmaj7]Hello');
  assert.match(html, /<mark class="chord-tag" data-chord="Cmaj7" contenteditable="false"><\/mark>Hello/);
});

test('round trip: emphToHtml -> (parse) -> emphFromNode restores the original markup', () => {
  const samples = [
    'plain text, nothing special',
    '**bold** and *italic* and _underline_ and ~~strike~~',
    '***bold italic*** mixed with plain',
    '==highlighted phrase== stays == marked ==',
    'a **nested? no—markup here is flat** line',
  ];
  for (const text of samples) {
    const html = app.emphToHtml(text);
    const node = htmlToFakeNode(html);
    const restored = app.emphFromNode(node);
    assert.equal(restored, text, `round trip failed for: ${text}`);
  }
});

test('round trip: inline note marker survives emphToHtml -> emphFromNode', () => {
  const enc = app.b64encode('a comment about this phrase');
  const text = `before [[note:n1:${enc}]]highlighted bit[[/note]] after`;
  const html = app.emphToHtml(text);
  const node = htmlToFakeNode(html);
  const restored = app.emphFromNode(node);
  assert.equal(restored, text);
});

test('b64encode/b64decode round trip (unicode-safe)', () => {
  const samples = ['plain', 'emoji 🎭 test', 'quotes "and" \'apostrophes\'', 'newline\nin\ntext'];
  for (const s of samples) {
    assert.equal(app.b64decode(app.b64encode(s)), s);
  }
});
