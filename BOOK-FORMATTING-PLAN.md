# Prose Plot Book Formatting — Execution Plan

A multi-phase build plan for turning Prose Plot's output side into a real book-formatting
tool (print-ready PDF + EPUB + Atticus-style themes) while keeping the existing Manuscript
format untouched for agent submission. Written to be executed one phase per session by any
model — each phase is self-contained, lists exactly what to read first, and ends with
verification steps. Concept-level rationale lives in SPEC.md §16 ("Book export — EPUB +
print-ready PDF"); this document is the how.

**Status legend:** ⬜ not started · 🔶 in progress · ✅ done. Update this file as phases land.

| Phase | What ships | Status |
|---|---|---|
| 0 | `state.book` data model + Book setup drawer skeleton | ✅ |
| 1a | Front/back matter — data + editors | ✅ |
| 1b | Front/back matter — rendered into Book view + PDF | ✅ |
| 2a | Ship serif fonts (OFL, self-hosted) | ✅ |
| 2b | Theme presets + chapter-opener styles | ✅ |
| 2c | Scene-break ornaments + drop caps | ✅ (one deferral — see note) |
| 3a | Trim sizes + book margins | ✅ |
| 3b | Recto/verso, running heads, book page numbering | ✅ |
| 4a | EPUB — ZIP writer + chapter XHTML | ✅ |
| 4b | EPUB — metadata, cover, nav/TOC, download | ✅ (epubcheck run deferred — no local JRE) |
| 5 | Custom themes (Atticus-style theme editor) | ⬜ |

---

## Ground rules (read before EVERY phase)

These are non-negotiable across all phases:

1. **Manuscript mode is sacred.** The existing Print View (Courier, double-spaced,
   `LASTNAME / TITLE / #` headers) is the agent-submission format and must keep producing
   byte-identical output. All book styling is a *separate* render path. If a change would
   alter Manuscript output in any way, stop and restructure.
2. **Prose Plot only.** Everything in this plan is gated on `state.format === 'prose'`.
   Song Plot's UI and output must be completely unaffected. Grep your diff for ungated
   changes before committing.
3. **No dependencies, no build step.** Vanilla JS + CSS custom properties only. The EPUB
   ZIP is hand-written (stored entries — see Phase 4a). Fonts are self-hosted woff2 files.
4. **Bump `app/sw.js`'s `CACHE` constant** on every change to app.js/styles.css/index.html.
   Current value is around `songplot-v161`; increment whatever you find.
5. **Verify before claiming done.** Minimum: `node --check app.js` passes; then load the
   app in the preview browser, clear the service worker
   (`navigator.serviceWorker.getRegistrations()` → unregister, `caches.keys()` → delete,
   reload), and exercise the feature. Never leave test cards/shows behind — if you inject
   test data, back up `state.cards` first and restore it after.
6. **Data safety while testing:** `doSave()` does NOT check `state.loading` — don't trigger
   saves while a show is mid-load, and never test against a real show's data destructively.
   Prefer creating a throwaway novel in the Library and deleting it when done.
7. **Persistence pattern:** show-level state round-trips through `serialize()` (~line 280,
   builds the save payload) and the two load paths (`loadShow`-style assignments ~line 190
   and ~line 242). `state.titlePage` is the model to copy — defaults object at ~line 80,
   deep-merged with saved data on load, included in `serialize()`. Anything you add to
   `state.book` must be threaded through all three places or it silently won't save.
   Also thread it through `exportShow()`/`importShow()` (~line 3865) so `.pshow` backups
   round-trip it, and the duplicate-show payload (~line 328 and ~line 700).
8. **Deploy** (only when the user says to push): commit with
   `Co-Authored-By:` trailer per house style, push to origin/main, then
   `ssh -i ~/Downloads/musical-designer-key.pem ubuntu@208.113.134.238 "cd ~/musical-designer && git pull && pm2 restart musical-designer"`,
   then curl both `https://musicaldesigner.colincreates.com/` and
   `https://proseplot.colincreates.com/` expecting 302.
9. **Update this file's status table** and add a short "what actually shipped" note under
   the phase when you finish it. Update SPEC.md §16's status table row too.

**Key code map** (line numbers approximate — grep the names, don't trust the numbers):
- `buildManuscriptPage(sceneId)` ~4388 — the whole Manuscript page: toolbar, mode switcher
  (`msMode` = `'edit' | 'layout' | 'title'`), `applyMode()`, `rebuildEdit()`,
  `rebuildSheets()` (Print View), `rebuildTitle()`.
- `buildContentTokens(sceneId)` ~2740 — flattens cards into a token stream
  (scene-header / song-num / action / lyric / note / blank …).
- `cardBodyTokens(c)` ~1637 — canonical per-card line classifier. ALL renderers (Edit,
  Print, PDF, Fountain export) consume this. Book rendering must too.
- `paginateTokens(toks, lock)` / `paginateBlocks(blocks, lock)` ~2900 — measurement-based
  pagination into fixed-height pages.
- `renderPageToken(tok, content)` — token → DOM for Print View sheets.
- `exportPDF(includeTitlePages, revisedOnly)` ~4016 — builds `#pdf-print-root`, prints
  in-page via `window.print()`; print CSS lives in styles.css under `@media print`.
- `buildTitlePages()` ~4139 + `state.titlePage` defaults ~line 80 — the toggleable-block
  pattern front matter extends.
- `buildHeaderDrawer(onUpdate)` ~4280 — the Page-setup drawer; `drawerInner` is where
  per-format controls get appended (see the `state.format === 'prose'` block ~4804).
- `emphToHtml` / `emphFromNode` — emphasis markup (`**` `*` `_` `~~` `==`, inline notes)
  ↔ HTML. EPUB XHTML generation reuses `emphToHtml`.
- `state.msOptions` — localStorage-persisted per-device view options (`md-ms-opts`).
  Note the split: msOptions is per-device; `state.book` (new) is per-show, saved to server.

---

## Phase 0 — `state.book` data model + Book setup entry point

**Goal:** the container everything else hangs off. No visible formatting change yet.

**Read first:** `state.titlePage` defaults (~line 80), `serialize()` (~280), both load
paths (~190, ~242), `exportShow`/`importShow` (~3865), the Page-setup drawer's prose block
inside `buildManuscriptPage` (~4771–4840).

**Build:**
1. Add `state.book` defaults near `state.titlePage`:
   ```js
   book: {
     meta: { authorName: '', isbn: '', publisher: '', description: '', coverImage: null },
     theme: { id: 'classic', font: 'ebgaramond', chapterLabel: 'word', // 'word'|'numeral'|'roman'|'bare'|'custom'
              chapterLabelCustom: '', showChapterTitle: true, opener: 'plain', // 'plain'|'dropcap'|'raisedcap'|'smallcaps'
              sceneBreak: 'asterisks' }, // 'asterisks'|'ornament'|'space'
     trim: { size: '6x9', mirrored: true, gutterIn: 0.75, outsideIn: 0.5, topIn: 0.75, bottomIn: 0.75 },
     matter: { front: [], back: [] },   // filled in Phase 1a
   }
   ```
   `coverImage` is a data-URL string or null (the data model's first binary — keep it
   simple; server storage is already arbitrary JSON).
2. Thread `state.book` through serialize/load/export/import/duplicate exactly like
   `state.titlePage` (deep-merge defaults on load so old shows and future new keys are safe).
3. In the Page-setup drawer, prose-only: add a "Book" section header with a placeholder
   line ("Book formatting — coming in stages") so the entry point exists. Real controls
   arrive with their phases.

**Acceptance:** create a novel, confirm `state.book` appears in the saved JSON
(Network tab, PUT body), survives reload, survives `.pshow` export → import. Song Plot
shows are untouched (no `book` UI, though the field may serialize — that's fine).

**What shipped (2026-07-09):** added `bookDefaults()` / `migrateBook(d)` (app.js, right
after `migrateDna`, same pattern as Story DNA's defaults/migrate pair). `state.book` is
initialized with `bookDefaults()` at the top-level state object (mirrors `storyDna`'s
`dnaDefaults()` call — function declarations are hoisted, so this works despite
`bookDefaults` being defined later in the file). Threaded through all the places ground
rule 7 lists: `serialize()`, both load paths (`openReference` resets it to
`bookDefaults()` since reference shows are Song Plot-only; `applyShowData` deep-merges
via `migrateBook(d.book)`), `duplicateShowById`, and `exportShow`/`importShow`. Server-side
`serve.js` needed no changes — its PUT/POST handlers `JSON.parse` the body with no field
whitelist, so a new top-level key round-trips for free (confirmed by reading `serve.js`,
not just assuming). Drawer skeleton: in the Page-setup drawer's prose-only branch (the
`state.format === 'prose'` block that already holds the paragraph-style control), added a
"Book" section head + a placeholder line reusing the existing `.ms-rev-none` muted-text
class (same class the Revisions section uses for its own "not tracking yet" placeholder —
no new CSS). Verified live: a real Prose Plot show (`tide-keeper`) shows `state.book`
populated with defaults; Song Plot shows also get `state.book` (data-model consistency)
but no "Book" section renders in their drawer; edited `state.book.meta.authorName`,
confirmed it round-trips through an actual `PUT`/`GET` cycle against the running server
and through a full `openProject` reload; restored the test value afterward. sw bumped to
v169.

---

## Phase 1a — Front/back matter: data + editors

**Goal:** the user can create and edit front/back-matter blocks. Rendering comes in 1b.

**Read first:** `buildTitlePages()` and its contenteditable save wiring (~4100–4260),
`rebuildTitle()` inside `buildManuscriptPage` (~4485), the include-checkbox pattern
(~4520).

**Design (decided — don't re-litigate):**
- `state.book.matter.front` / `.back` are ordered arrays of blocks:
  `{ id, kind, include: true, title: '', text: '' }`.
- Front kinds: `halftitle`, `titlepage`, `copyright`, `dedication`, `epigraph`, `toc`,
  `foreword`, `preface`, `prologue`. Back kinds: `acknowledgments`, `abouttheauthor`,
  `alsoby`, `newsletter`.
- Three block classes by behavior:
  - **Generated** (`halftitle`, `titlepage`, `toc`): no text editor; content derives from
    show title + `book.meta` + chapter list. `toc` regenerates at render time, never stored.
  - **Free text** (`dedication`, `epigraph`, `foreword`, `preface`, `prologue`,
    `acknowledgments`, `abouttheauthor`, `alsoby`, `newsletter`): one rich-ish text field
    (plain text + emphasis markup, reuse the emphasis helpers — NOT the full card editor).
  - **Templated** (`copyright`): a small form — © line, ISBN, edition, publisher, rights
    disclaimer, each its own field, rendered into the standard copyright-page layout.
- New shows get a sensible default set (titlepage + copyright on; others present but
  `include: false`) so the list isn't empty.

**Build:**
1. Extend the drawer's Book section: "Edit book matter…" button → follows the Title-pages
   pattern: sets a new `msMode = 'book-matter'` (or reuse a modal if the mode plumbing
   fights you — modal is acceptable), with a Done button returning to `lastDocMode`.
   If adding a mode: mirror every place `msMode === 'title'` is special-cased
   (mode-switcher hiding, settings-button hiding, boot guard, Done button).
2. The matter editor: two columns (Front matter / Back matter), each block a row with
   include-checkbox, kind label, and — per its class — either nothing (generated), a text
   area (free text), or the copyright form. Reorder via simple ↑/↓ buttons (skip
   drag-and-drop).
3. `book.meta` fields (author name, ISBN, publisher, description) edit here too — they
   feed titlepage/copyright generation.

**Acceptance:** edit dedication + copyright fields, reload, values persist. Include
toggles persist. Order changes persist. `node --check` + preview pass per ground rules.

**What shipped (2026-07-09):** `BOOK_MATTER_KINDS` + `bid()` (block-id helper) declared
**above the top-level `state` object** — this is load-bearing, not stylistic:
`bookDefaults()` runs inside the state initializer, and consts declared later in the
file are in the temporal dead zone at that moment. (The first cut declared them down by
`migrateBook` and the whole script died on load with `Cannot access 'BOOK_MATTER_KINDS'
before initialization`, leaving the static HTML shell and a "—" title — if the app ever
boots like that again, check for this class of bug first.) `defaultMatterBlocks(section)`
builds the default block arrays (only `titlepage` + `copyright` start `include: true`);
`bookDefaults()`/`migrateBook()` now populate `matter.front`/`back`, with migrate
trusting saved arrays only when non-empty so Phase-0-era `{front:[],back:[]}` saves
still get real defaults. New `msMode === 'book-matter'` side mode mirrors `'title'`
exactly (shared `isSideMode` handling: mode switcher + settings button hidden, single
"✓ Done with book matter" button returning to `lastDocMode`, never persisted as a doc
mode). `rebuildBookMatter()` renders Book details (`book.meta` fields) + two-column
Front/Back matter lists: include checkbox, ↑/↓ reorder buttons, and per block class a
freetext textarea, the copyright form, or a "generated automatically" hint. All inputs
`scheduleSave()`; readonly guards throughout. `.bm-*` styles in styles.css using
existing CSS vars. Drawer's Book section placeholder replaced with the "Edit book
matter…" button (prose only — verified Song Plot drawer unchanged). Verified live
against tide-keeper: edit dedication text, toggle include, reorder via ↓, `PUT`
round-trip + reload persistence via `migrateBook`, Done returns to prior mode; test
edits reverted afterward. sw bumped to v173.

---

## Phase 1b — Front/back matter rendered: the Book view exists

**Goal:** a third output mode for prose — **Book** — rendering front matter + chapters +
back matter as book-styled pages. This is the render skeleton every later phase styles.

**Read first:** `rebuildSheets()` (~4459), `paginateTokens`/`paginateBlocks` (~2900),
`renderPageToken`, `exportPDF` (~4016), the `.ms-sheet` CSS in styles.css.

**Design (decided):**
- Prose Plot's mode switcher becomes three segments: **Edit | Manuscript | Book**
  (rename "Print View" → "Manuscript" for prose only — it IS the manuscript format, and
  the rename makes the two outputs' roles obvious). Song Plot keeps Edit | Print View.
  Internally: `msMode` gains `'book'`; `'layout'` keeps meaning manuscript.
- Book view is **read-only** in this phase (like Print View). It renders:
  front matter pages → chapters → back matter pages.
- Reuse the pagination engine with book-ish CSS: a new sheet class `.book-sheet` beside
  `.ms-sheet`, serif body (system serif for now — real fonts in 2a), single-spaced,
  justified, indented paragraphs, centered chapter openers with a ~⅓-page sink, each
  chapter starting a fresh page. Content still flows from `buildContentTokens` +
  `cardBodyTokens` — write a `renderBookToken(tok, content)` sibling to `renderPageToken`
  rather than forking the token stream.
- Front/back matter render as their own unpaginated single sheets (dedication page,
  copyright page, etc. are each one page by convention). TOC lists chapters with page
  numbers — page numbers only become real after pagination runs, so build TOC from the
  paginated result (chapter → first page index).
- "Export PDF" while in Book view prints the book render (an `exportBookPDF()` sibling of
  `exportPDF` sharing the same in-page `#pdf-print-root` + `window.print()` mechanism and
  `@media print` approach). US Letter for now — trim sizes are Phase 3a.

**Acceptance:** switch to Book view, see front matter → styled chapters → back matter;
toggling a block's include in 1a's editor updates the render; Export PDF from Book view
prints book pages; **Manuscript view output is pixel-identical to before** (spot-check a
page against production).

**What shipped (2026-07-09):** Book got a **fully separate** render + pagination path
from Manuscript, on purpose — `paginateBlocks`/`renderPageToken` are tuned for script
content (dual columns, cue/CONT'D handling, stanza-aware `splitFill`) and the acceptance
bar is that Manuscript stays pixel-identical, so the safest way to guarantee that is to
never touch the shared engine at all. New pieces, all top-level (not inside
`buildManuscriptPage`, so `exportBookPDF` can reach them too):
- `bookChapters()` — a chapter is a `state.cards` entry with `type === 'scene'`, walked
  in `displayOrder()`; its body tokens are exactly `cardBodyTokens(c)` (no new parsing).
- `buildBookBlocks(chapters)` → `paginateBookBlocks(blocks)` — one atomic block per
  paragraph/scene-break/chapter-title; a chapter title forces a fresh page. Simpler than
  the Manuscript engine on purpose: no mid-paragraph splitting yet (a block taller than
  the page just moves whole to the next one) — acceptable for a "render skeleton every
  later phase styles," per this phase's own goal statement.
- `renderBookToken(tok, container)` — sibling of `renderPageToken`, emits `.book-para`/
  `.book-chapter-title`/`.book-scenebreak` instead of `.lw-*` manuscript classes.
- `buildBookSheets()` — assembles the full sheet list (front matter → paginated chapters
  → back matter) as an array of `.book-sheet` DOM nodes; shared verbatim by on-screen
  Book mode (`rebuildBook`, inside `buildManuscriptPage`) and `exportBookPDF()`
  (top-level), so the two literally cannot drift apart.
- Generated blocks: `halftitle`/`titlepage` center the show title (+ author from
  `book.meta`); `copyright` builds a boilerplate line from `copyrightYear`/
  `copyrightHolder`/`edition`/`rightsText`; `toc` lists chapters with page numbers taken
  from each chapter-title block's first paginated page index (real book-wide page
  numbering, including front matter, is Phase 3b — this is a stable reference into the
  chapters flow only). Freetext blocks (dedication, epigraph, foreword, preface,
  prologue, and all back-matter kinds) print the block's own text; dedication/epigraph
  print with no heading (convention), the rest show their label or a custom `b.title`.
- Mode switcher: Prose Plot gets a third **Book** segment and "Print View" is relabeled
  **"Manuscript"** (Song Plot keeps "Edit | Print View" unchanged — verified live, no
  Book tab appears on a Song Plot show). `msMode` gains `'book'`; boot guard extended
  (never boots into Book on a Song Plot show even from a stale `localStorage` value);
  `applyMode()` branches to `rebuildBook()`; the toolbar's Print button branches to
  `exportBookPDF()` when `msMode === 'book'`.
- CSS: `.book-sheet`/`.book-sheet-content` (system serif, justified/indented paragraphs
  — real self-hosted serif faces are Phase 2a) plus generated/freetext/TOC/copyright
  sub-styles, and a `#pdf-print-root .book-sheet` print rule paralleling `.ms-sheet`'s.
  sw bumped to v174.
- Verified live against tide-keeper (5 real chapters): Book view renders title page →
  copyright → styled chapters with justified/indented paragraphs and a centered `***`
  scene break; toggled on half-title/TOC/dedication/foreword to confirm every block
  class renders (TOC showed real chapter titles + correct page numbers; dedication
  printed with no heading; foreword printed with its heading + two paragraphs); switching
  Edit → Manuscript → Book preserves scroll position via the shared `sc:<id>` anchor key;
  Export PDF from Book view built 11 `.book-sheet` pages into `#pdf-print-root` and called
  `window.print()`; Manuscript view re-checked after all of this — unchanged Courier
  layout, header, chapter title. Confirmed via a direct `GET` that none of the toggle/text
  test edits were saved to the server (never called `scheduleSave`/`doSave`) — tide-keeper
  is back to its Phase-1a-verified state.

---

## Phase 2a — Serif fonts, self-hosted

**Goal:** OFL-licensed serif faces available to the theme layer and embeddable later in
EPUB/PDF.

**Design (decided):** ship exactly three: **EB Garamond**, **Literata**, **Crimson Pro**.
Regular + Italic + Bold + BoldItalic each, woff2 only, subset to Latin. Download from
Google Fonts (github source repos have the OFL files); keep the OFL.txt licenses in the
fonts dir.

**Build:**
1. `app/fonts/` with the 12 woff2 files + licenses.
2. `@font-face` rules in styles.css (or a small `fonts.css`), family names
   `'EB Garamond'`, `'Literata'`, `'Crimson Pro'`, with `font-display: swap`.
3. sw.js: do NOT precache fonts in `SHELL` (they're several hundred KB); the runtime
   cache-first branch already caches them lazily on first fetch — verify that happens.
4. `serve.js`: confirm it serves `.woff2` with a sensible MIME type; add if missing.
5. Book view body font switches to the theme's font (`state.book.theme.font`), with a
   `--book-font` CSS variable so 2b's theme picker just sets the variable.

**Acceptance:** Book view renders in EB Garamond (check `getComputedStyle` fontFamily,
not just eyeballs); Network tab shows woff2 loading then served from SW cache on reload;
Manuscript view still Courier.

**What shipped (2026-07-09):** `app/fonts/` gained 12 woff2 files (EB Garamond, Literata,
Crimson Pro × Regular/Italic/Bold/BoldItalic), pulled from Google Fonts' `css2` API
filtered to the `/* latin */` subset block (avoids shipping cyrillic/greek glyph data),
plus each family's `OFL.txt` saved as `EB-GARAMOND-LICENSE.md` / `LITERATA-LICENSE.md` /
`CRIMSON-PRO-LICENSE.md`. `@font-face` rules added to styles.css alongside the existing
Courier Prime Sans / iA Writer Duo block. `.book-sheet-content`'s `font-family` now reads
`var(--book-font, Georgia, 'Times New Roman', serif)` — the fallback keeps Book view
readable even before the variable is set. New `BOOK_FONT_FAMILIES` map + `bookFontFamily(id)`
helper in app.js (top-level, beside `buildBookSheets`) resolves `state.book.theme.font`
(`'ebgaramond'|'literata'|'crimsonpro'`) to its CSS font stack; unrecognized ids fall back
to EB Garamond. `buildBookSheets()`'s `addSheet()` and the chapter-body sheet loop both set
`--book-font` as an inline style on each `.book-sheet` (not on a single shared ancestor,
since `exportBookPDF`'s `#pdf-print-root` and the on-screen Book viewport are different
containers). `paginateBookBlocks()` now takes a `bookFont` param and sets the same variable
on its offscreen measurement rig — pagination must measure text in the font it will
actually render in, since line-wrapping differs by typeface. `serve.js` already served
`.woff2` as `font/woff2` and sw.js's runtime cache-first fetch handler already covers any
static asset not in `SHELL` — neither needed changes; per the ground rules, fonts stay out
of `SHELL` precache (lazy-cached on first fetch instead). sw bumped to v176. Verified live
against `tide-keeper` (real Prose Plot show, `theme.font: 'ebgaramond'`): Book view's
`.book-sheet-content` computed `font-family` resolved to `"EB Garamond", Georgia, "Times
New Roman", serif`; Network tab showed `EBGaramond-Regular/Italic/Bold.woff2` loading with
200s from the local server; switching to Manuscript view showed `.ms-sheet` still computing
`"Courier Prime", "Courier New", Courier, monospace` — unaffected, confirming the two
render paths stay isolated as the ground rules require.

**Add-on (2026-07-09, user-requested, outside the phase plan):** a writing-font picker
for Prose Plot's Manuscript **Edit** mode, reusing the fonts this phase shipped. A
per-device preference (`state.msOptions.editFont`, localStorage — never touches show
data or Manuscript/Book output), with a `<select class="ms-font-sel">` in the Edit-mode
format bar, positioned immediately before the existing element picker (`ms-style-sel`,
"Body"/"Scene break") in both its active (`buildRichEditor`'s `styleBar`) and idle
(`rebuildEdit`'s `idleBar`) forms. Options: Courier (Manuscript) — the default, matching
current/legacy behavior exactly — EB Garamond, Literata, Crimson Pro, and iA Writer Duo
(already self-hosted for the old plaintext lyric editor). New `EDIT_FONT_LABELS` /
`EDIT_FONT_FAMILIES` maps + `editFontFamily(id)` / `applyEditFont()` helpers sit beside
`bookFontFamily()`. `applyEditFont()` sets `--edit-font` on `.ms-edit-doc`; CSS scopes the
variable with `.ms-edit-doc .ms-sheet-content { font-family: var(--edit-font, ...) }` —
`.ms-edit-doc` is Edit-mode's own wrapper (never used by Print/Manuscript's `.ms-sheet` or
Book's `.book-sheet`), so this cannot leak into either output despite all three sharing
the `.ms-sheet-content` class for layout. Verified live against `tide-keeper`: switched
the picker to Literata mid-edit — the active line editor AND the static (non-focused)
card content both picked up Literata immediately (both are `.ms-edit-doc` descendants);
switched to Manuscript view and confirmed `.ms-sheet-content` there still computed
Courier Prime; reset the local preference back to `courier` afterward (this is a
localStorage-only setting, so there was no show data to revert).

Follow-up (same day): reorganized the prose format ribbon to word-processor convention
after the font picker made the old layout lopsided. Both the active (`styleBar`) and idle
(`idleBar`) forms now run **history (↶ ↷) | selectors (Font, Element) | emphasis
(B I U S H)** left→right — the two selects grouped, all five character-formatting controls
contiguous (previously B/I/U sat ahead of the selects with S/H stranded after them, so the
emphasis cluster was split). Also dropped the idle bar's "Click any line to edit" hint —
the dimmed/disabled controls already read as inactive, so it just stated the obvious; the
active bar keeps its genuinely-useful keyboard-shortcut hint (`Enter · next line   Tab ·
cycle   ⌘1–2 · jump`). Pure JS append-order change (no CSS), verified live that idle and
active bars share an identical shape so the bar never shifts when a line is focused.

---

## Phase 2b — Theme presets + chapter-opener styles

**Goal:** the Vellum-style "pick one bundle" experience.

**Design (decided):**
- 4 built-in presets (id, name, font, chapter label style, opener, scene break, small
  design accents): **Classic** (EB Garamond, "Chapter One", plain opener, asterisk breaks),
  **Modern** (Literata, bare numeral "1" oversized, first-line small caps, blank-space
  breaks), **Elegant** (Crimson Pro, roman numeral + rule, drop cap, ornament breaks),
  **Plain** (Literata, "Chapter 1", plain, asterisks — the safe default).
- Picking a preset copies its values into `state.book.theme` (it does NOT stay a live
  reference) — so Phase 5's custom tweaking naturally works by editing the copied values.
- Chapter label rendering: number-to-words helper for 'word' style ("Chapter One" up to
  at least forty), roman-numeral helper for 'roman'. Chapter title beneath the label when
  `showChapterTitle` and the card has a title.
- UI: in the Page-setup drawer's Book section, a theme strip — four preset cards
  (name + mini preview of the chapter-opener look) + the font/label/opener/scene-break
  dropdowns beneath, reflecting current values (so presets and knobs coexist).

**Acceptance:** switching presets visibly restyles Book view chapter openers + font;
values persist per-show; two shows can hold different themes; Manuscript unaffected.

**What shipped (2026-07-20):** Built together with 2c in one pass — the approved
mock spanned both phases and they share the exact render path (`renderBookToken`) and
CSS, so splitting them would have meant touching the same functions twice.
- `BOOK_THEME_PRESETS` (4 bundles: Classic/Modern/Elegant/Plain) + `applyThemePreset(id)`
  (beside `bookFontFamily`), which **copies** preset values into `state.book.theme` — never a
  live reference — so changing any single knob afterward diverges `theme.id` to `'custom'`.
  No `bookDefaults()` change needed: the seven theme fields already existed (Phase 0) and
  `migrateBook`'s shallow `Object.assign(base.theme, d.theme)` backfills for old saves.
- Chapter-label rendering: new `chapterLabelText(theme, num)` + `numberToWords(n)` (0–99,
  "Twenty-one" style, numeral fallback beyond) + `romanNumeral(n)` (none existed). `'word'`/
  `'numeral'` keep the "Chapter" prefix; `'roman'`/`'bare'` are the numeral alone (minimal
  opener); `'custom'` uses the author string with `#` as the number placeholder. The card's
  own title renders beneath the label as `.book-ch-name` when `showChapterTitle` and it isn't
  a restatement of the label.
- `renderBookToken` now reads `state.book.theme` and emits `.book-chapter-title.bk-label-{style}`
  (label + optional name), theme-classed scene breaks, and — on the chapter's first paragraph
  only (stamped `firstPara` in `buildBookBlocks` on a **copied** token, never mutating the
  shared `cardBodyTokens` output) — the opener flourish via `applyChapterOpener(p, opener)`.
- Theme picker UI in the Book-setup drawer (replaced the "arrives in stages" placeholder):
  a 2×2 preset strip (each card previews its face with "Aa") + Font / Chapter-label / Opener /
  Scene-break selects + a custom-label text field (shown only for `'custom'`) + a "Show chapter
  titles" toggle. All changes `scheduleSave()` and live-`rebuildBook()` when in Book mode.
  `.bk-*` CSS uses app chrome vars (`--line`/`--panel`/`--ink`/`--hover`/`--energy`); the
  on-sheet book styles stay ink-on-paper.
- Verified live (Carol, injected original test prose, readonly guards, nothing saved): all four
  presets render distinct font + label + opener + scene break (checked computed
  `font-family`/`font-size`, the drop-cap/small-caps/raised-cap spans, and the roman `::after`
  rule); `theme` round-trips through `serialize()`; Manuscript view stays Courier with zero
  `.book-*` classes; picker shows the active preset highlighted. sw bumped v192→**v193**.

**Deferred from 2c:** the "scene break falling at the top of a page renders as an asterisk
fallback in `space` mode" edge rule is NOT implemented — current book pagination never splits a
paragraph, so a break rarely lands exactly at a page top, and the fallback can be added when
recto/verso pagination (3b) makes page position meaningful. Everything else in 2c (all three
scene-break styles; drop / raised / small-caps openers, measured in the pagination probe exactly
as rendered) shipped here.

---

## Phase 2c — Scene-break ornaments + drop caps

**Goal:** finish the theme layer's typographic details.

**Build:**
1. Scene-break token rendering in Book view honors `theme.sceneBreak`:
   `asterisks` → centered `* * *`; `ornament` → centered `⁂` (or an inline SVG fleuron —
   pick one, keep it single-color `currentColor`); `space` → an empty vertical gap
   (~2 blank lines). Edge rule: a scene break falling at the top of a page renders as
   nothing visible except in `space` mode where readers lose the signal — in `space`
   mode at a page top, fall back to the asterisks glyph (standard book practice).
2. Drop cap (`opener: 'dropcap'`): CSS `initial-letter` where supported with a
   float-based fallback (`float:left; font-size:~3.2em; line-height:.8; padding-right`).
   Applies to the first paragraph after a chapter opener only. Raised cap: first letter
   ~2em, baseline-aligned. Small caps: `font-variant: small-caps` on the first ~4 words
   (wrap them in a span at render time).
3. Both must survive pagination (the measurement pass must see the same styles the render
   pass uses — test a chapter whose first paragraph falls near a page boundary).

**Acceptance:** all three scene-break styles + all four opener styles render correctly in
Book view and in the printed PDF; pagination doesn't overlap or clip drop caps.

---

## Phase 3a — Trim sizes + book margins

**Goal:** Book view/PDF pages at real book dimensions.

**Read first:** how `.ms-sheet` fixes page dimensions in styles.css, how
`paginateBlocks` measures available height, `@media print` rules + `@page` if present.

**Design (decided):**
- Supported trims: 5×8, 5.25×8, 5.5×8.5, 6×9 (inches). Stored as `trim.size` string.
- Page CSS driven by variables: `--book-page-w`, `--book-page-h`, margins from
  `trim.gutterIn`/`outsideIn`/`topIn`/`bottomIn`. Until 3b, apply gutter as a uniform
  inside≈outside average (mirroring is 3b).
- Print: `@page { size: var(...)  }` doesn't take variables — generate a small
  `<style>` tag at export time with the literal `@page { size: 6in 9in; margin: 0 }` and
  let the sheet divs carry the margins. Chrome respects `@page size` for PDF output.
- Pagination lock: changing trim re-paginates; make sure the measurement container gets
  the same width as the render container (this is the classic engine bug to watch).

**Acceptance:** each trim produces correctly-sized pages in the print preview (measure the
generated PDF page size); text re-flows correctly between trims; TOC page numbers update.

**What shipped (2026-07-20):** `BOOK_TRIM_SIZES` (5×8, 5.25×8, 5.5×8.5, 6×9) + `BOOK_DPI`
(96) + `bookTrimDims()` (resolves the active `state.book.trim` to page W/H and margins in
inches — left/right is the uniform inside≈outside **average** for now, `(gutterIn+outsideIn)/2`;
true mirrored gutters are 3b) + `applyBookDims(node, dims)` which stamps `--book-page-w`,
`--book-page-h`, `--book-pad-top/-bottom/-side` on a sheet. `.book-sheet` width/min-height and
`.book-sheet-content` padding now read those vars (fallbacks = the old Letter/1in values for
any un-stamped sheet). Threaded through `buildBookSheets` (computes `dims` once, stamps every
sheet — front matter, body, back matter) and `paginateBookBlocks(blocks, bookFont, dims)`,
which sets the same vars **and a fixed measurement height** on its offscreen rig so the probe
wraps text at the identical content width the render uses — the classic engine bug is avoided
by construction (same code path stamps both). PDF: `exportBookPDF()` injects a one-off
`<style id="book-trim-print">` with the literal `@page{size:<W>in <H>in;margin:0}` and a matching
`#pdf-print-root .book-sheet{width:<W>in;height:<H-0.4>in}` (the 0.4in shave is the same WebKit
double-break guard as the Letter `.ms-sheet` rule — ink never reaches there since bottom margin
≥ 0.4in), removed in the afterprint cleanup alongside the print root. UI: a **Page** section in
the Book-setup drawer with a single **Trim size** select (margins stay at sensible defaults —
not exposed as knobs yet, keeping the drawer uncluttered; add later if asked). Verified live
(Carol, injected original prose, readonly): all four trims computed exact px dimensions
(5×8→480×768, 5.25×8→504×768, 5.5×8.5→528×816, 6×9→576×864) with 72px/60px margins; a 40-paragraph
chapter re-paginated 17 sheets at 5×8 vs 14 at 6×9 (smaller page → more pages); `trim` round-trips
`serialize()`; Manuscript view stayed 816px Letter/Courier; PDF injected
`@page{size:5.5in 8.5in}` + 8.1in sheet. sw v193→**v194**.

**Deferred to 3b (as planned):** mirrored recto/verso gutters (this phase uses the uniform
average), and the four per-margin controls are not user-editable yet (defaults only).

---

## Phase 3b — Recto/verso, running heads, book page numbering

**Goal:** the pagination engine learns page *sides*. The genuinely new engine concept.

**Design (decided):**
- After pagination, assign sides: page 1 of chapter one is a **recto** (odd). Walk the
  final page list assigning odd=recto / even=verso.
- Front matter: lowercase roman numerals (i, ii, iii…), restarting arabic 1 at the first
  chapter page. Folio (page number) suppressed on: chapter-opening pages, all front-matter
  pages before the TOC, and inserted blanks.
- Running heads: author name centered on verso, book title centered on recto (both from
  `book.meta` / show title), suppressed on chapter openers and blanks. Folio in the head's
  outside corner (or centered footer — pick head-outside, it's the more common trade
  layout).
- Mirrored margins: recto pages get gutter on the left, verso on the right — a
  `.book-sheet.recto` / `.verso` class pair flipping padding.
- `chapterStartRecto` option (add to `trim`): when on, insert a fully blank verso before
  any chapter that would start on a verso. Blank pages get no head/folio.
- The PDF export must emit pages in strict sequence including blanks so duplex printing
  lines up.

**Acceptance:** print a test book PDF: front matter numbered i/ii/iii, chapter 1 starts on
arabic 1 on a recto, running heads alternate author/title and vanish on openers, mirrored
gutters visibly alternate, chapterStartRecto inserts blanks correctly.

**What shipped (2026-07-20):** `buildBookSheets()` was refactored from a flat sheet-emitter
into a three-pass **page-descriptor** model (still returns `.book-sheet` DOM nodes, so
`rebuildBook` and `exportBookPDF` are untouched). Pass 1 builds descriptors for front
matter → paginated body pages → back matter (each tagged `zone` = `front`/`body`/`back`,
plus `isChapterOpener`/`chapterKey` for body pages, `frontIndex` for front). Pass 2 inserts
`chapterStartRecto` blanks: before any body chapter-opener that would land on a verso, push
a blank leaf — the blank before the **first** chapter is a *front* leaf (roman) so arabic
starts clean at chapter one; later inter-chapter blanks are *body* leaves (they consume an
arabic page). Pass 3 assigns, over the final sequence: `side` (odd index → recto, even →
verso), `folioNum` (two counters — roman for `zone==='front'`, arabic for everything else,
so the count restarts at the first body page), `folioText` (front folios print **only from
the TOC page onward** via `tocFrontIndex`; arabic folios print except on chapter openers;
blanks never print), and `headText` (body non-opener pages only — **author on verso, title
on recto**; matter/openers/blanks stay head-free). The TOC is built with deferred rows and
filled *after* assignment so it shows each chapter's real **arabic book folio**
(`chapterFolio` map) rather than the old body-flow ordinal.
- **Mirrored margins:** `bookTrimDims()` now returns `innerIn`/`outerIn` (gutter vs
  fore-edge; collapse to their average when `trim.mirrored === false`) alongside the legacy
  `sideIn`. `applyBookDims` stamps `--book-pad-inner`/`--book-pad-outer`; `.book-sheet-content`
  uses inner-left/outer-right, and `.book-sheet.verso .book-sheet-content` flips them.
  inner+outer is constant, so content width — and thus the pagination probe's line-wrapping,
  which renders on an un-classed `.book-sheet` using the same vars — is side-independent.
- **Running head + folio DOM:** `.book-sheet` is now `position: relative`; the head is an
  absolutely-positioned element centred in the top margin, the folio sits in the bottom
  margin's **outside** corner (recto → right, verso → left, both flipping with the mirrored
  pad vars). Both are `position: absolute`, so they add nothing to flow height — the WebKit
  double-break shave in the print CSS stays valid (comment updated).
- **New knob:** `trim.chapterStartRecto` (default `true`), threaded via `bookDefaults`
  (migrate backfills through the existing `Object.assign(base.trim, d.trim)`), with a single
  "Start each chapter on a right-hand page" toggle in the Book drawer's **Page** section.
- **PDF:** unchanged mechanism — the injected `@page{size:WxH}` + literal sheet box already
  carry recto/verso classes and head/folio nodes through to `#pdf-print-root`, so mirrored
  gutters, heads, folios, and blanks all export in strict page sequence for duplex.
- Verified live (Carol reference, injected original prose, `state.loading`/`readonly` guards,
  nothing saved): front matter numbered (title/copyright suppressed, TOC = roman `iii`); a
  blank verso inserts so Chapter 1 opens recto on **arabic 1**; a 5-page Chapter 1 shows the
  **title** running head on its recto body pages and **author** on versos, folios continuous;
  a second blank correctly inserts mid-book before Chapter 2; toggling `chapterStartRecto`
  off drops all blanks and lets chapters fall naturally; `mirrored:false` collapses margins to
  the 0.625″ average; computed content padding confirmed mirrored (verso 48/72, recto 72/48);
  TOC shows real arabic folios (1, 3, 5, 7, 9); Manuscript view re-checked — still Courier,
  zero `.book-*` classes. sw bumped v194→**v195**.

**Deferred (unchanged from 3a):** the four per-margin values (gutter/outside/top/bottom) are
still defaults-only, not user-editable knobs — kept out of the drawer to avoid clutter; add
if the user asks. Mirrored-vs-uniform is driven by `trim.mirrored` (default on) with no UI
toggle yet for the same reason.

---

## Phase 4a — EPUB: ZIP writer + chapter XHTML

**Goal:** the packaging machinery, dependency-free.

**Design (decided):**
- **Stored-only ZIP writer** (~100 lines): local file headers + central directory + EOCD,
  all entries method 0 (stored). Needs a CRC-32 implementation (small table-based
  function — write it, don't import it). The `mimetype` entry (`application/epub+zip`)
  must be the FIRST entry and stored — with a store-only writer this is just "add it
  first". Output a `Blob` (`application/epub+zip`).
- Chapter XHTML: one file per chapter card. Serialize via `cardBodyTokens(c)` →
  paragraphs, reusing `emphToHtml` for emphasis, then wrap in a strict XHTML5 shell
  (`<?xml version="1.0"?>`, `xmlns`, `<!DOCTYPE html>`). Strip app-only markup exactly
  like the Fountain exporter does (chords/notes/highlight have no book meaning — notes and
  highlights especially must NOT leak; crib the strip logic from `stripToFountainText`).
  Scene breaks → `<p class="scene-break">* * *</p>` (or ornament per theme).
- A shared `book.css` inside the EPUB carrying the theme's opener/scene-break styles and
  `@font-face` for the theme font (embed the woff2 bytes of the ONE selected family).
- Keep this phase headless: a `buildEpub()` function returning the Blob + a temporary
  dev-only trigger (console call is fine). User-facing export button is 4b.

**Acceptance:** `buildEpub()` produces a file that (1) `unzip -l` lists with `mimetype`
first, (2) opens in Apple Books / Calibre with chapters intact, emphasis rendered, no
leaked markup. (Automate what you can: in Node, re-parse the ZIP structure and assert
entry order + CRC correctness.)

**What shipped (2026-07-20):** dependency-free EPUB 3 packaging, all top-level beside
`exportBookPDF`:
- `crc32()` (256-entry reflected IEEE table, built once) + `zipStore(entries)` — a
  **stored-only** (method 0) ZIP writer: local file headers → central directory → EOCD,
  fixed 1980-01-01 DOS date (deterministic + dodges the invalid-zero-date some validators
  flag). Returns a `Blob('application/epub+zip')`. Because nothing is compressed, the EPUB
  `mimetype`-first-and-stored rule is satisfied just by making it the caller's first entry.
- `emphToXhtml(text)` — the book-side sibling of `emphToHtml`: strips app-only markup
  (notes/chords/editorial-highlight/strikethrough) via `stripToFountainText` first — none
  belong in a finished book — then escapes and applies only book emphasis
  (`<strong>/<em>/<u>`). Element-content escaping only (quotes stay literal, fine outside
  attributes).
- `epubChapterXhtml(chapter, num)` — one XHTML5 doc per chapter card. Chapter opener
  (label via `chapterLabelText` + optional card title) and paragraphs come from the same
  theme + `cardBodyTokens()` the print book uses, so the ebook matches the PDF. Openers and
  small-caps are **reflow-safe CSS**, not per-word markup: `<body class="opener-…">` + a
  `first-para` class drive `::first-letter` (drop/raised cap) and `::first-line` (small
  caps) in book.css — no spans for ereaders to mangle. Scene breaks honour the theme glyph
  (`* * *` / `⁂` / empty for space).
- `epubBookCss(fontMeta, haveFonts)` — the in-book stylesheet: embedded-face `@font-face`
  (only when the fonts were actually fetched), justified indented body, chapter-title
  layout, scene-break + opener rules.
- `buildEpub()` (async) — fetches the theme font's four woff2 files to embed them
  (all-or-nothing per family; degrades to a system-serif fallback if any fetch fails),
  generates chapters + a minimal-but-valid `container.xml`, EPUB 3 OPF (`dc:title`,
  `dc:creator`, `urn:uuid` identifier via `crypto.randomUUID`, `dcterms:modified`, manifest,
  spine) and `nav.xhtml` (toc). Returns `{ blob, entries, haveFonts, chapters }`.
- `downloadEpub()` — the Phase-4a dev trigger (no UI button until 4b): call from the console.
- **Scope note:** front/back matter XHTML, cover image, ISBN-based identifier, and the
  Export-drawer button are Phase 4b; 4a intentionally emits chapters only, but a complete,
  openable book (minimal OPF/nav/container so a reader mounts it).
- Verified live (Carol reference, injected original prose carrying **/*/_/~~/==/[[note]]**
  and a `***` scene break, readonly — nothing saved): parsed the output bytes back —
  mimetype first + stored + exact bytes; 14 entries, every one stored with a CRC that
  re-computes correctly; local-header count == central-directory count == EOCD count (14),
  EOCD's CD offset matches the real central-directory start. Every XHTML/OPF/nav/container
  doc parses as **well-formed XML** via `DOMParser`. Chapter 1: bold/italic/underline
  preserved; strike/highlight/note markup gone but their text kept; `first-para` only on the
  true first paragraph; scene break = `<p class="scene-break">* * *</p>`; body class
  `opener-plain`; label "Chapter One" + name "The Harbour". OPF carries title/creator/uuid/
  modified; nav lists 5 chapters; book.css has the `@font-face` block + EB Garamond body;
  the four EBGaramond woff2 embedded. All three scene-break themes emit the right glyph.
  (A real Apple Books/Calibre open + epubcheck run is Phase 4b's acceptance gate — deferred
  to when the download button exists.) sw bumped v195→**v196**.

---

## Phase 4b — EPUB: metadata, cover, nav/TOC, user-facing export

**Goal:** a complete, valid EPUB 3 the user can download from the Export drawer.

**Build:**
1. **OPF package document**: dc:title, dc:creator (authorName), dc:language,
   dc:identifier (ISBN if set, else a generated `urn:uuid:`), dc:description, modified
   timestamp; manifest of all files; spine in reading order (front matter → chapters →
   back matter).
2. **Nav document** (EPUB 3 `nav epub:type="toc"`): generated from chapter list + included
   front/back matter blocks. This satisfies the TOC requirement — the visual TOC page from
   1b is separate and optional in ebooks (include it only if its block is toggled on).
3. **Front/back matter as XHTML**: reuse 1b's generation logic, output XHTML instead of
   DOM. Copyright page, dedication, About the Author, etc.
4. **Cover**: `book.meta.coverImage` (data URL from a file input in the Book drawer
   section — add the upload control here; downscale/re-encode to JPEG ≤ ~1.5MB on a canvas
   before storing). In the EPUB: cover image entry + `properties="cover-image"` in the
   manifest + a cover XHTML page first in the spine.
5. **Export drawer**: prose-only "Download EPUB" button → `title.epub`.
6. Validate against **epubcheck** (`brew install epubcheck` or the jar) on at least one
   real export; fix every error, note remaining warnings here.

**Acceptance:** epubcheck passes with zero errors; the book opens with cover, TOC
navigation, themed chapters in Apple Books; sideloads to Kindle via Send-to-Kindle
without rejection.

**What shipped (2026-07-20):** `buildEpub()` expanded from chapters-only to a complete
EPUB 3, all still dependency-free:
- **Reading order** cover → front matter → chapters → back matter. A page-descriptor list
  (`docs`) is assembled in that order and drives the manifest, spine, and nav together, so
  they cannot drift. `epubXhtmlDoc(title, bodyClass, inner)` is the shared XHTML5 shell
  (chapter + matter + cover all use it); `epubMatterDoc(b, ctx)` renders each front/back
  block to `{docTitle, bodyClass, inner, nav}` — mirroring buildBookSheets' generated
  (halftitle/titlepage/copyright/toc) and freetext logic, but as XHTML strings. `nav` is the
  TOC label or null (headless dedication/epigraph and the generated title/copyright/toc
  pages stay out of the reading-order nav). The visual Contents page links chapters (no
  folios — meaningless in reflow); the machine `nav.xhtml` is separate.
- **Metadata**: identifier is `urn:isbn:<digits>` when an ISBN is set, else `urn:uuid:`;
  `dc:publisher` and `dc:description` emit when present; `dcterms:modified` always. Front/back
  matter XHTML reuses `emphToXhtml` (same markup-stripping as 4a).
- **Cover**: `book.meta.coverImage` (a downscaled JPEG data URL) → `cover.jpg` entry +
  `properties="cover-image"` manifest item + legacy `<meta name="cover">` (Kindle/EPUB2) + a
  `cover.xhtml` first in the spine. `dataUrlToBytes()` decodes the data URL;
  `downscaleImageToJpeg(file, 1600, 0.82)` (canvas) normalizes any upload to a compact,
  metadata-free JPEG at import time.
- **UI (Prose Plot only)**: a **cover-image control** in the Book-matter editor's Book
  details (thumbnail + Choose/Remove, stores into `book.meta.coverImage`), and a **Download
  EPUB** button in the Manuscript toolbar that shows only in Book view (shares the Print
  button's slot styling; disables + shows "Building…" while `downloadEpub()` runs). ISBN,
  publisher, description already had editors from Phase 1a — the OPF just reads them.
- Verified live (Carol reference, injected original prose + cover canvas + a dedication/
  foreword/acknowledgments toggled on, nothing saved): built the EPUB and parsed the bytes —
  spine cover → fm(title/copyright/dedication/toc/foreword) → 5 chapters → acknowledgments;
  every XHTML/OPF/nav doc **well-formed XML**; OPF carries the ISBN identifier + publisher +
  description + cover-image item + cover meta; **manifest↔zip integrity clean** (no dangling
  hrefs, every spine idref in the manifest, no undeclared OEBPS files, all required EPUB 3
  metadata present, exactly one `epub:type="toc"`, valid JPEG SOI/EOI, mimetype
  first/stored/no-extra/exact); nav lists Foreword + 5 chapters + Acknowledgments (dedication
  correctly omitted); dedication centered/headless, foreword headed w/ 2 paras, TOC = 5
  chapter links, copyright "Copyright © 2026 E. M. Hollis". UI: EPUB button visible in Book
  view + hidden in Manuscript/Edit, cover thumbnail renders in the matter editor, Manuscript
  view still Courier with zero `.book-*` classes. sw bumped v196→**v197**.
- **Deferred (one acceptance item):** a formal `epubcheck` pass could not run — this machine
  has no working JRE and installing a JDK unprompted was out of scope. The structural
  cross-check above covers the substance of what epubcheck enforces; run `epubcheck` on a
  real export (and an Apple Books / Send-to-Kindle sideload) when a JRE is available, and note
  any findings here.

---

## Phase 5 — Custom themes (Atticus-style)

**Goal:** user-adjustable theme editing beyond the four presets. Scope this LAST and
lightly — do not start without explicit user go-ahead on scope.

**Direction (to refine with the user when reached):**
- The 2b decision (presets copy values into `state.book.theme`) means "custom" already
  half-exists — any knob change diverges from the preset. Phase 5 adds: more knobs
  (opener font size/spacing, paragraph indent vs block, line-height, ornament choice,
  running-head styling), a live mini-preview pane, and **saved named themes** reusable
  across the user's shows (needs a small server-side or localStorage store —
  decide with user; per-account server storage fits the shared-backend model better).
- Possible later: theme import/export as JSON, per-matter-block style overrides.

---

## Suggested execution cadence

Each phase is one focused session. Order is strict within a track but tracks 2 and the
tail of 1 can interleave. Rough sizing: 0, 2a are small (well under an hour of model
work); 1a, 2b, 2c, 3a, 4b are medium; 1b, 3b, 4a are the big ones — don't stack two big
ones in one session. After every phase: verify per ground rules, update the status tables
(here + SPEC.md §16), and only deploy when the user says push.
