# Tests

Two kinds, because two kinds of thing break.

## Unit tests — `node --test 'test/**/*.test.js'`

```
node --test 'test/**/*.test.js'
```

**Pass a glob, not a directory.** `node --test test/` used to work and no longer
does: from Node 22 the runner treats its arguments as glob patterns, so a bare
directory matches nothing, gets handed to the module loader instead, and the run
dies with `Cannot find module '.../test'` before a single test executes. Quote
the glob so Node expands it rather than the shell (`node --test test/*.test.js`
works too, but only where the shell globs for you).

`*.test.js`, run on Node's built-in runner. `load-app.js` evaluates
`app/data.js`, then `app/atlas-data.js`, then `app/app.js` in one sandboxed
script — the same order `index.html` loads them in — against a stub
`document`/`window`, and hands back the pure functions. So these cover parsing,
serialization, line identity and emphasis: anything that's a value in, value
out.

They cannot cover layout: there's no layout engine behind the stub, so every
measurement comes back zero.

### Smoke-testing a page builder

`atlas-data.js` is loaded so corpus-driven UI can be run against the **real**
1,809-song arrays rather than guarding out on a missing global and silently
testing nothing. `score-field.test.js` uses this: it calls the actual
`buildScoreFieldPage()` across all twelve sort × filter combinations, which
says nothing about how the page *looks* but does catch the reference errors and
bad assumptions that take a whole page down — the failure mode that page is
most exposed to, being ~120 lines of data preparation.

For this to work, view state must be reachable from outside `app.js`. The Score
Field keeps its sort and filter on `state` (`state.sfSort`, `state.sfForm`) for
exactly that reason; a module-local `let` cannot be driven by a test, and the
first version of this test set a key that touched nothing, so twelve iterations
silently re-ran the default.

### If the whole file goes red but every assertion passed

That is the signature of a **boot-time** failure, not a broken app. `app.js` ends
with unguarded top-level calls, including a `loadProjects().then(...)` chain that
falls through to `openReference('fiddler')`. It resolves long after `loadApp()`
returns, so a throw inside it lands after the test file has finished and the
runner reports it as `A resource generated asynchronous activity after the test
ended`.

It nearly always means the sandbox is missing something `app.js` has started
using. Add it to `makeSandbox()` in `load-app.js`. There is no allowlist
swallowing these any more — one used to exist, and it hid exactly this for long
enough that four red files became the normal state of the suite.

`harness.test.js` is the guard: it asserts the real `SHOWS`/`NOVELS`/`TEMPLATES`
are in scope, and that the boot chain actually reaches its end
(`state.showKey === 'fiddler'`) rather than dying partway.

## Layout fixture — `test/layout-click-in.html`

Open it in a browser (double-click is enough — it only needs `../app/styles.css`
and the fonts beside it, no server).

Clicking a card in the manuscript swaps its static render for the rich editor.
The two are built by different code paths — `renderCardSection()` and
`enterCardEditRich()` in `app/app.js` — and must come out geometrically
identical, or the text moves out from under the caret at the moment you click.
This page builds both states of the same card side by side and diffs three
numbers per card: where the Beatline sits, where the first body line sits, and
the card's total height. The first two catch a shift at the top of the card; the
third catches one that moves everything *below* it instead.

Toggle Focus / Dark / Prose in the panel — each re-runs the check. It should
read PASS in all six combinations. `window.checkClickInGeometry()` returns a
boolean if you want to drive it from a console or a headless run.

### The asymmetry it exists to catch

A Beatline lives **inside** the content box when static and in its **own box**
when editing. Every click-in shift found so far has come from padding or a
margin landing on one but not the other, and none of them were visible by
reading the rule on its own:

- `.ms-edit-logline .lw-note-ms { margin-top: 0 }` tied on specificity with
  `.ms-sheet-content .lw-note-ms { margin-top: 12pt }` further down the file and
  lost on order — the reset had never applied.
- A `> :first-child { margin-top: 0 }` matched the Beatline in one render and
  the first body line in the other.
- The static content box let its first line's margin collapse out; the editor's
  is a flex item, so it trapped it. Fixed with `flow-root`.

So: after touching anything in the `.ms-sheet-content` / `.ms-card-content` /
`.ms-line-editor` / `.ms-edit-logline` family, open this page.
