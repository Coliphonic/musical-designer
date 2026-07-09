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
| 1a | Front/back matter — data + editors | ⬜ |
| 1b | Front/back matter — rendered into Book view + PDF | ⬜ |
| 2a | Ship serif fonts (OFL, self-hosted) | ⬜ |
| 2b | Theme presets + chapter-opener styles | ⬜ |
| 2c | Scene-break ornaments + drop caps | ⬜ |
| 3a | Trim sizes + book margins | ⬜ |
| 3b | Recto/verso, running heads, book page numbering | ⬜ |
| 4a | EPUB — ZIP writer + chapter XHTML | ⬜ |
| 4b | EPUB — metadata, cover, nav/TOC, download | ⬜ |
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
