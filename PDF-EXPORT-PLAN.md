# PDF Export — plan & status

Goal: make PDF a first-rate, one-tap export in both Song Plot and Prose Plot —
not a by-product of the browser Print dialog. Real files, real metadata, clean
filenames, works offline, costs the server nothing.

## Approach — transcription, not re-layout

The browser already lays out every sheet (we paginate by measuring the real
DOM). So the exporter's job is **transcription**, not layout:

1. Build the sheets offscreen (same render path as Print), inside `#pdf-print-root`
   forced visible (`display:block`) so they get real geometry and paper colors.
2. Walk every text node; for each word, read its `Range.getClientRects()` and the
   parent's computed font / weight / style / colour / decoration.
3. Emit each word as a positioned PDF text run at the same coordinates.

The browser stays the single source of layout truth, so page breaks, wrapping,
centering and (later) justification can never drift from what the user sees.

Key measured facts (Courier, 16px screen = 12pt PDF):
- baseline_y = word rect top + canvas `fontBoundingBoxAscent` (exact).
- CSS px → PDF pt = 72/96 = 0.75. Letter page 816×1056px → 612×792pt.
- **Ligatures must be disabled on the transcription source** (`font-variant-ligatures:none`).
  The screen webfont (Courier Prime) ligates "fi"/"fl", laying a word out ~1 char
  narrower than base-14 Courier draws it, which would swallow the following space.
  Disabling makes it true-monospace and an exact width match for PDF Courier.

## Engine (all in app.js, dependency-free — like buildEpub)

- `createPdf(meta)` → `{ addPage(wPt,hPt) → {text, rect}, toBlob() }`. PDF 1.7,
  content streams FlateDecode-compressed via the platform `CompressionStream`,
  WinAnsi text strings, Info dict (Title/Author), xref + trailer.
- Base-14 fonts only in Phase 1 — manuscript is monospace **Courier**, one of the
  14 standard PDF fonts, so **no font embedding is needed**. `pdfBase14()` maps a
  run to Courier / Times / Helvetica + Bold/Oblique.
- `pdfTranscribeSheet(pdf, sheetEl)` — the transcriber above. Underline/strike are
  drawn as thin filled rects spanning each line box.
- `exportManuscriptPDF(includeTitlePages, revisedOnly)` — builds ms-sheets offscreen,
  transcribes each, downloads `<Title>.pdf`.

Verification loop (no PDF CLI tools installed): generate in Node (`CompressionStream`/
`Blob`/`TextEncoder` are global in Node 18+) or pull the browser blob out as base64,
then `qlmanage -t` rasterises to PNG to eye the result. Word x-positions checked by
inflating the content stream and reading the `Tm` coordinates.

## Phases

| Phase | Scope | Status |
|------|-------|--------|
| 1 | Core writer + transcriber + **Manuscript PDF** (Song + Prose), base-14 Courier, metadata, filename, toolbar **PDF** button | ✅ built + verified locally (cache v199) — **not yet pushed** |
| 2 | **Book PDF** (Prose) — TrueType embedding (CIDFontType2/Identity-H + ToUnicode) for Garamond/Literata/Crimson, justified text, drop/raised/small caps, ornaments, front matter, trim sizes; Book-view PDF button | ✅ built + verified locally (cache v200) — **not yet pushed** |
| 3 | Professional layer — bookmarks/outline, clickable internal TOC (link annotations), richer metadata, UTF-16 text strings | ✅ built + verified locally (cache v201) — **not yet pushed** |

## What shipped in Phase 1 (2026-07-20)

- Manuscript PDF for **both** Song Plot (Print View) and Prose Plot (Manuscript),
  same shared `ms-sheet` render path.
- Verified faithful: centered + underlined + bold headers, indentation, em-dashes /
  curly quotes / ellipsis (WinAnsi), italic + coloured synopsis notes, right-aligned
  running header + folio, title pages (centered title, wrapping byline, contact block).
- Real selectable-text vector PDF, `%PDF-1.7`, FlateDecode-compressed (a 9-page
  Fiddler ≈ 14 KB; a novel manuscript ≈ 80 KB). Title/Author metadata, readable
  filename (`A Christmas Carol.pdf`).
- UI: kept **Print** (system dialog → paper) and added a **PDF** button beside it
  (one-tap download). Shows in manuscript modes only; Book view keeps Print + EPUB
  until Phase 2. Cleans up its offscreen root; no console errors.

### Not built (deferred to Phase 2/3)
- Book-view PDF via the engine (still uses `window.print`/`exportBookPDF` for now).
- Font embedding, justified/drop-cap book typography, bookmarks/outline, clickable TOC.

### Untouched (by design)
- `exportPDF` / `exportBookPDF` (the `window.print` paths) — Print button still uses them.
- Manuscript print output is byte/pixel-identical; the PDF engine is a separate path.

## What shipped in Phase 2 (2026-07-20)

Book PDF for Prose Plot, drawn with the real serif fonts embedded:

- **Font embedder** — hand-rolled TrueType parser (`pdfParseTTF`: table dir, head/hhea/maxp/hmtx/OS-2/post, cmap format 4/12), verified glyph-for-glyph against fontTools. `createPdf` gained `textEmbed()` and a Type0/Identity-H CIDFontType2 path: FontFile2 (whole TTF, FlateDecode, Length1), full `/W` widths, `/CIDToGIDMap /Identity`, and a ToUnicode CMap so copy/paste + search work. Metrics scaled by `1000/unitsPerEm` (Crimson Pro is 1024, not 1000). Only the styles actually used embed.
- **TTF fonts** — the woff2 the screen uses, converted to `.ttf` (identical metrics) via fontTools, added to `app/fonts` (EB Garamond / Literata / Crimson Pro × 4 styles, ~50 KB each, Latin-subset). Fetched only at Book-PDF export; runtime-cached by the SW, never precached.
- **Book transcriber** (`pdfTranscribeBookSheet`) — per-word placement (justification preserved), `text-transform` applied (uppercase running heads / chapter labels), hyphenated words that wrap across lines split per line + trailing hyphen, synthesized small caps (per-char, lowercase → 0.78× caps), and scene-break ornaments the serif lacks (fleuron ❦ / asterism ⁂ are not in these fonts) fall back to a centered "* * *". Runs at the book's real trim size. Drop/raised caps need no special code — they're just larger single-glyph runs.
- Verified by rendering pages with PyMuPDF: title page, drop-cap opener, small-caps opener, a continuation page (running head + folio), and the ornament fallback — all faithful to the on-screen Book. Text extracts cleanly; fonts report embedded; metadata + filename correct. Manuscript PDF (base-14 path) regression-checked after the `createPdf` upgrade.
- UI: the **PDF** button now also shows in Book view (was manuscript-only), routing to `exportBookPDFEngine()`; Print + EPUB unchanged.

## UI consolidation — "one room, two doors" (2026-07-20, cache v203)

The per-view EPUB/Print/PDF toolbar buttons and the topnav "Export & backup"
drawer merged into a single **Export** drawer (`openExportDrawer(ctx)`):

- One grouped row list — **Documents** (Manuscript PDF, Book PDF, EPUB, Print…),
  **Interchange** (Fountain), **Backup** (.pshow save / open). Fountain moved in
  with the documents where it belongs.
- **Two doors, one room**: the topnav tray icon opens it unseeded; a single
  toolbar **Export** button (same tray icon, layout/book modes only) opens it
  *context-seeded* — the current view's format sorts to the top, tinted, tagged
  "this view". Print… routes by context (book → `exportBookPDF`, else
  `exportPDF`).
- The rule: autosave/Snapshots stay with the show; anything that **leaves the
  app** lives in Export; Share (people/access) stays in the Library. The Song
  sheet-mode Print button is the deliberate exception — it exports one song
  object, so it stays with the object.
- Readonly references keep document exports enabled (they mutate nothing);
  backup/Fountain stay gated as before. Async rows show "Building…" while the
  engine runs.

### Known limitations (polish)
- Fleuron ❦ / asterism ⁂ scene breaks render as "* * *" in the PDF (glyph absent from the serif fonts). Dot ·, asterisks, thin rule, and blank-space breaks are exact.
- Synthesized small caps copy/paste as ALL-CAPS (one glyph serves both real-cap and small-cap, so per-GID ToUnicode can't distinguish). Visual rendering is correct.
- Dev-only tools used for font conversion + verification (fontTools, brotli, PyMuPDF) are pip `--user` installs; the app itself stays dependency-free.

## Sheet PDF (2026-07-20, cache v205)

The Song Sheet (lyric window Sheet mode) gained a one-tap **PDF** button beside
Print — the per-object counterpart of the Export drawer's Manuscript PDF, via
the same engine:

- `exportSheetPDF(c)` — builds the identical paginated ms-sheets `printSheetCard`
  does, offscreen-visible, and transcribes them with `createPdf` +
  `pdfTranscribeSheet`. Metadata: Title = song title, Subject = "Song sheet —
  <show>", readable filename. Respects the Chords / Section tags toggles.
- **Chord materialization** (`pdfMaterializeChords`) — chord labels are `::after`
  pseudo-elements, invisible to the text-node walker. The exporter swaps each
  into a real absolutely-positioned span (same computed metrics, sage pinned
  dark for white paper) before transcribing; `.pdf-chords-real` suppresses the
  pseudo so nothing doubles. Zero reflow — lyric geometry untouched.
- **text-transform fix in `pdfTranscribeSheet`** — `node.nodeValue` is the
  untransformed source, but the sheet displays CSS-uppercased lyric lines; the
  transcriber now applies the computed transform to what it draws (Courier is
  monospace, so geometry is identical). This also corrects the Manuscript PDF,
  which had been exporting lyric lines in source case — regression-checked
  (46-page Circuits & Sycamores: outline, metadata, uppercase all correct).
- Verified via PyMuPDF page renders: chord lane grid, sage labels over exact
  syllables, cue/(CONT'D)/section tokens all faithful to the on-screen Sheet.
- **Button styling (cache v206)** — PDF + Print restyled from mismatched chips
  (Print wore a legacy solid-energy fill; PDF a plain grey pbtn) into the
  ribbon's bare icon+label language (`.lw-sheet-act`), wearing the Export
  drawer's own glyphs (download-into-tray / printer). The energy fill stays
  reserved for active toggles, per the app's color grammar.
- **Section-tag restyle (cache v208)** — the sage rounded pill read as UI
  chrome pasted onto the page, so section headers now use the manuscript's own
  typewriter face: bracketed sage caps (`[VERSE 1]`), the ChordPro / typed-
  lyric-sheet convention, at 0.8em with no fill. The brackets are **real text**
  in the read-only sheet render (`buildSheetTokens` render at app.js:3510 wraps
  `tok.text` in `[ ]`) so the word-walker captures them into the PDF with no
  materializer; the editable Rich view adds them via `::before`/`::after` so the
  stored source stays clean `Verse 1` (re-bracketed on serialize). Verified: PDF
  text layer carries `[CHORUS]`/`[BRIDGE]` intact and `[VERSE 1]` as adjacent
  positioned runs, all sage `#5f7d57` Courier 9.6pt; dark-mode edit view reads
  the bright sage. Sheet-toolbar "Section tags" toggle still hides them.

Still absent (pre-existing): chords in the whole-show Manuscript PDF (its
render path never calls the materializer) — deliberate until the Manuscript
chord-clearance question is settled.

## What shipped in Phase 3 (2026-07-20)

The navigation + metadata layer that makes the PDFs feel like real published files. All in the same dependency-free engine (`createPdf` gained `addOutline`/`addLink`; pages carry an `index`).

- **Bookmarks / outline** (`/Outlines`, `/PageMode /UseOutlines` so readers open the panel).
  - *Book:* a flat outline in reading order — Title Page, Copyright, Contents, each chapter (title-cased), and back matter — each `/Dest [page /Fit]`. Built by tagging `buildBookSheets` descriptors (`data-pdf-outline`, `data-pdf-chapter-key`); the exporter reads them per sheet.
  - *Manuscript (Song + Prose):* built from the heading tokens the sheet actually renders — `.lw-act-header` is top-level, `.lw-scene-header` / `.lw-song-header` nest one level under (or sit top-level when there are no acts). Two-level tree with correct `/First /Last /Next /Prev /Count`.
- **Clickable internal TOC** (Book) — every `.book-toc-row` becomes a `/Link` annotation over the row's box, `/Dest`-ing to that chapter's opening page. Rows are matched to chapter pages by `chapterKey`; resolved after all sheets are transcribed (the TOC precedes the chapters). Verified: Contents page → the five Stave openers.
- **Richer metadata** — `/Subject`, `/Creator`, format-aware `/Producer` ("Prose Plot" / "Song Plot"), and real `/CreationDate` + `/ModDate` (`pdfDateString`, `D:…±HH'mm'`).
- **UTF-16 text strings** (`pdfTextString`) — Info values and outline titles are now emitted as UTF-16BE-with-BOM whenever they contain non-ASCII. Fixes a latent bug: literal high bytes in document strings are read as **PDFDocEncoding**, not WinAnsi, so an em-dash in a title mojibaked (e.g. "Stave One Š Marley's Ghost"). Pure-ASCII strings stay literal.
- Verified with PyMuPDF on the real Carol book + manuscript: 8-item book outline with correct em-dashes and page targets; 5 clickable TOC links resolving to the right openers; 5-item manuscript outline landing on each Stave's page; metadata + dates correct. The `createPdf` object graph (2-level nesting, links, dates) was also unit-tested in Node against the live source.
