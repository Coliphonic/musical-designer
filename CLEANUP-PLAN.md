# Cleanup & Hardening Plan

An execution plan for a future session (any model). Written 2026-07-05 after a code
audit. **Read this whole preamble before touching anything.**

## Verdict the plan is based on

The codebase is *not* a mess — it has one consistent idiom (vanilla JS, no build step,
`el()` helper, `build*Page()` per page, one `serialize()`/`applyShowData()` pair), a
small clean server, and a sound escaping story. The debt is concentrated, not diffuse:
a 5,651-line `app.js` with one shared mutable `state`, zero tests, and a handful of
data-safety gaps in the save path. **Do not rewrite anything. Do not introduce a
framework, a bundler, TypeScript, or npm dependencies.** The phases below are ordered
by (user value ÷ risk); each is independently shippable and independently skippable.

## House rules (apply to every phase)

- Repo: `~/Documents/Claude/Musical Designer` (git, pushes to
  https://github.com/Coliphonic/musical-designer.git). App code in `app/`.
- After any client-file change, bump `CACHE` in `app/sw.js` (one version per push).
- Verify in the browser preview before committing: clear stale service workers
  (`navigator.serviceWorker.getRegistrations()` → unregister; `caches.keys()` → delete;
  reload), then test. Never mutate the user's real show data — use throwaway edits and
  restore exact prior values.
- Song Plot and Prose Plot share this codebase. After any change, verify BOTH apps
  (waffle menu or `setCurrentApp('prose'|'song')`) — a fix for one must not disturb
  the other.
- The user deploys with `cd ~/musical-designer && git pull && pm2 restart
  musical-designer` (their action, not yours — relay the command). Production data
  lives outside the repo (`SHOWS_DIR=/home/ubuntu/musical-designer-data/shows`).
- Match the existing code style exactly: no semicolon-style changes, no reformat-only
  diffs, comments only where the code can't speak (see existing comments for tone).

---

## Phase 1 — Data safety (do first; small diffs, highest stakes)

The user's stated fear is losing work to corruption. These four fixes close the actual
holes. Each is a few lines.

### 1a. Atomic show writes (server)
`app/serve.js` writes show files with `fs.writeFileSync(fileFor(sid), ...)` directly
(three call sites: create/POST ~line 172, share/PUT ~line 195, save/PUT ~line 259 —
plus `saveSnaps`). A crash or full disk (which HAS happened on this 2.9GB-disk VPS,
2026-07-04) mid-write truncates the JSON and corrupts the show. Fix: write to a temp
file in the same directory, then `fs.renameSync` over the target (rename is atomic on
the same filesystem). One small helper, used by all write sites:

```js
function writeFileAtomic(fp, data) {
  const tmp = fp + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, fp);
}
```

### 1b. Honest save indicator (client)
`app/app.js` `doSave()` (~line 294): `.then(() => setSaveInd('saved'))` runs on ANY
response — a 401 (session expired), 403, or 500 still shows the green "saved" dot
while the write silently failed. Fetch only rejects on network errors. Fix:

```js
.then((r) => { if (!r.ok) throw new Error('save failed ' + r.status); ... })
```
so non-2xx lands in the existing `.catch(() => setSaveInd('error'))`. Consider making
the error state more visible than a dot color (e.g. the dot plus a title/tooltip is
fine; do NOT add a modal — the app's style is unobtrusive).

### 1c. doSave guard parity
`scheduleSave()` checks `state.readonly || !state.projectId || state.loading` but
`doSave()` only checks `!state.projectId` (a known trap — see memory note
"musical-designer-testing-data-safety"). Because doSave fires on a 700ms timer, a
show-switch can land between schedule and fire, and the save then writes the OLD
show's serialize() output... into the NEWLY opened project id, or a readonly
reference's state into a real project. Re-check all three conditions inside `doSave()`
itself. ALSO capture the project id at schedule time and abort if it changed by fire
time — that's the actual race.

### 1d. Request body cap (server)
`readBody()` in `app/serve.js` concatenates without limit; the VPS has 458MB RAM and
a history of OOM. Cap at ~10MB (shows are tens of KB; the largest conceivable with a
full novel is low MB): track `b.length`, and past the cap `req.destroy()` + respond
413. Apply to all readBody uses.

**Verify 1a–1d:** run the server locally (`node app/serve.js 8090` — but note the
preview launcher uses `.claude/launch.json`), save a show, kill -9 the server
mid-write-loop if ambitious (or just eyeball the rename logic), confirm a forced 500
(temporarily break the endpoint) turns the dot red, confirm an oversized PUT gets 413.

---

## Phase 2 — A test harness for the round-trip core (no deps)

Zero tests today. The code most likely to eat a manuscript is pure-ish logic living
inside `app.js`: `seamlessToLines`/`linesToSeamless` (the lyric↔lines round-trip),
`mergeLineIds`/`stampRevisions` (line identity across edits), `emphToHtml`/
`emphFromNode` (markup round-trip incl. notes/chords), `countWords`,
`paginateBlocks`, `serialize`/`applyShowData` (payload round-trip), `migrateDna`,
`migrateLegacyIds`.

Constraints: no npm, no build step. Use Node's built-in `node:test` runner.

The obstacle: these functions live in `app.js`, which is a browser script (touches
`document` at load). Two acceptable approaches — pick ONE, prefer the first:

- **Load-and-extract shim:** a test bootstrap that stubs the handful of globals
  `app.js` needs at parse/load time (`document`, `window`, `localStorage`,
  `location`, `fetch`, `navigator`) with minimal fakes, `require`s the file via
  `vm.runInNewContext` on the source text, and plucks the pure functions out of the
  sandbox. Zero changes to app.js. Brittle only if app.js's load-time side effects
  grow — acceptable.
- **Extraction (bigger, only if the shim proves unworkable):** move the pure functions
  into a new `app/core.js` loaded by a `<script>` tag before `app.js` (same pattern as
  `data.js`/`lyric.js`), with a CommonJS-compatible export footer like `lyric.js` may
  or may not have — check how `data.js` exposes globals first and copy that pattern.
  This touches index.html + sw.js SHELL list + cache bump.

What to actually test (in value order):
1. `serialize()` → `applyShowData(JSON.parse(...))` → `serialize()` is a fixpoint for
   a representative show (song + prose, cards of all three types, notes, chords,
   emphasis, storyDna, titlePage).
2. `seamlessToLines(linesToSeamless(lines))` preserves line text and types for
   cue/sung/spoken/action/scenebreak samples (both song and prose card bodies).
3. `emphToHtml`/`emphFromNode` round-trip for `**b** *i* _u_ ~~s~~ ==h==`, chords,
   and `[[note:id:b64]]...[[/note]]` markers; and `emphToHtml` escapes `<script>`.
4. `mergeLineIds` keeps ids stable for unchanged lines, assigns fresh ids for
   inserted ones.
5. `countWords` strips markup (a `**bold**` word counts once).
6. `migrateLegacyIds` re-mints colliding `c`-prefixed note/revision ids.

Put tests in `test/` at repo root, runnable as `node --test test/`. Add nothing to
package.json (there isn't one; don't create one).

---

## Phase 3 — Centralize the song/prose fork

Not urgent; do when the scattered branching next causes a bug or friction. Today: 21
inline `=== 'prose'` conditionals in app.js and 45 `.app-prose` rules in styles.css.

- **Vocabulary table:** one `VOCAB = { song: {...}, prose: {...} }` object (show/novel,
  song/chapter, Runtime/Words-target, modal titles, empty-state copy, placeholder
  text). Replace inline ternaries with `vocab().term`. Mechanical, testable by
  grepping that no user-visible string regressed — screenshot both apps before/after.
- **Finish the `var(--energy)` migration:** most `.app-prose` overrides exist because
  Song Plot's purple was hardcoded hex (`#3a3475` etc.) rather than the CSS variable.
  Migrate remaining hardcoded purples to variables, then delete the now-redundant
  override rules. Verify with screenshots of every page in BOTH apps, light and dark
  mode (`preview_resize` colorScheme) — this is pure refactor, zero visual change
  allowed.

---

## Phase 4 — Split app.js along page seams (only when it hurts)

Do NOT do this preemptively. The file works and the idiom is consistent. If/when a
session finds it genuinely impeding work, split by the existing seams into script-tag
modules (no bundler): `core.js` (state, el, card model, save pipeline),
`library.js`, `board.js`, `manuscript.js` (buildManuscriptPage + buildRichEditor +
pagination — the 1,500-line heart), `notes.js`, `characters.js`, `storydna.js`,
`titlepages.js`, `find.js`. Load order matters (state/el first); index.html gets the
script tags; sw.js SHELL list must include every new file. This is a multi-session
job — do it one page per session, verifying both apps after each, never all at once.

Smaller targeted extraction that IS worth doing sooner: `buildRichEditor` (833 lines)
has separable inner concerns (undo history, selection toolbar, note popup, chord
handling) that could become named top-level functions without moving files.

## Phase 5 — Deploy ergonomics (tiny, optional)

- The manual `sw.js` CACHE bump is easy to forget. Add `deploy-check.sh` (or a git
  pre-push hook) that fails if `app/*.{js,css,html}` changed since origin/main but
  sw.js didn't. Keep it advisory and simple.
- `serve.js` sync fs in request handlers: FINE at this scale. Leave it. (Noted so a
  future model doesn't "fix" it unprompted.)
- Login endpoint has no rate limiting: acceptable for a 1–3 user app behind honest
  URLs, but a 5-line in-memory attempt counter per IP would not hurt. Lowest priority.

## Explicit non-goals

- No framework, no bundler, no TypeScript, no npm dependencies, no database.
- No rewrite of buildRichEditor (it's the product's heart and it works).
- No visual changes under the refactor phases — pixel parity or don't ship.
- File-per-show JSON storage stays (it's the right shape for this scale, and the
  Dropbox backup + snapshots now cover the risk).
