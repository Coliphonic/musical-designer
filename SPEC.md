# Musical Designer — Spec

A **word processor for musicals**. You write the book and lyrics in a real, paginated
libretto editor, and you plan the score on a card board that knows a musical's songs *are*
its structure. One tool takes you from "where does this show sing, and why?" to a printable,
Final Draft-formatted script.

> **What this document is.** A from-scratch rewrite (2026-06-25) describing the app as it now
> exists, working toward its **first full working version**. Earlier drafts framed the writing
> environment as an add-on to a diagnostic "song-plot board"; that's backwards. The **manuscript
> editor is the primary surface** — the board is the planning companion to it. Deprecated ideas
> (the dual energy/tension contour, ghost-contour overlays, scaffold-as-pillar) have been removed,
> not archived. What remains is what the app does.

---

## 1. What the app is

Three things, in priority order:

1. **A libretto word processor.** Write book scenes, dialogue, and lyrics in a continuous editor
   and read them back as paginated, Final Draft-formatted pages — character cues, dialogue and
   lyric margins, 12pt Courier Prime, scene headings on fresh pages, dual (simultaneous) dialogue
   in columns. Print or export to PDF. This is where the writing happens.
2. **A song-plot board.** A drag-to-arrange running order of the show's scenes, songs, and beats,
   with each number tagged by its dramatic **function** (Opening, I Want, Act Finale, 11 O'Clock…)
   and placed on a fixed three-act spine. The board decides *where the show sings*; its content
   flows straight into the manuscript.
3. **A study library.** Ten canonical shows, digitized as read-only boards + manuscripts, plus
   your own projects — so you can read how *Gypsy* stages its Act 1 finale right next to your draft.

A lyric-craft bench (rhyme + syllable tools, CMU dictionary) lives inside song cards, and an
Export surface produces backups, Fountain, and PDF.

### Guiding principle

> A character speaks until speech can't hold the emotion anymore, then they sing; and sings until
> singing can't hold it, then they dance.

The app helps a writer decide where the show sings and why, then actually write it — keeping the
score balanced in pace, voice, and function along the way.

---

## 2. Architecture — the card is the hinge between board and page

Everything hangs off one object, the **Card**. On the board it's a tile in the running order;
its body (`note` for scenes/beats, `lyrics` for songs) is the libretto content that flows into the
**Manuscript**. The same card, two zoom levels — plan it on the board, write it on the page.

```
        ┌─────────────────────── LIBRARY ───────────────────────┐
        │  your projects  ·  10 read-only reference shows        │
        └───────────────────────────┬───────────────────────────┘
                                     │  open a show
                                     ▼
   ╔═══════════════════════════ THE CARD ═══════════════════════════╗
   ║   scene · song · beat   —   title, act-lane, function,         ║
   ║   voicing, runtime, status   +   body (dialogue / lyrics)      ║
   ╚════════════╤═══════════════════════════════════╤══════════════╝
                │ plan                               │ write
                ▼                                    ▼
   ┌──── BOARD (plan) ────┐            ┌──────── MANUSCRIPT (write) ────────┐
   │ 3-act spine, 4 lanes │            │ Edit: continuous libretto editor   │
   │ drag to re-spot      │  ──────▶   │ Print View: paginated FD pages      │
   │ function pills       │   flows    │ scene-per-page · dual dialogue      │
   │ % through the story  │   into     │ outline nav · print / PDF           │
   └──────────────────────┘            └─────────────────────────────────────┘
        │                                         │
        ▼                                         ▼
   Characters registry              Title pages · Export · Snapshots
   (auto from cues)                 (front matter, backup, Fountain, PDF, history)
```

Two load-bearing decisions:

- **The libretto lives *inside* the card.** A song card's `lyrics` and a scene card's `note` are
  the same text the Manuscript paginates. Writing on the page and planning on the board never
  diverge because they read the same field.
- **Reference shows are just shows with a `readonly` flag.** Digitizing a canonical musical uses
  the identical schema as your own draft, so studying *Hamilton* on the same board + manuscript
  surfaces is free.

---

## 3. The page model

The app is organized as a top brand bar (deep-purple identity band, centered pill nav, "saved"
indicator) over a per-page contextual ribbon. The pages:

| Page | What it is |
|---|---|
| **Library** | Card grid of your projects (draft / active / archived, folders) + a Reference section of 10 study shows. Open-book icon in the nav. |
| **Board** | The song-plot running order — the planning surface (§4). |
| **Title pages** | Generated front matter (title, authors, contact, cast list, song list, settings), rendered on the same print sheets as the Manuscript, with per-block include toggles. |
| **Manuscript** | The libretto word processor — Edit + Print View (§5). The primary surface. |
| **Characters** | A registry card per character (voice type, description, notes, auto "appears in"), synced from lyric cues (§6). |
| **Export** | Backup (.pshow JSON), Fountain (.fountain), PDF (via Print View), and import (§7). |

---

## 4. The board — planning the song plot

The board is a **Save the Cat-style act-lane layout**: each act is a horizontal lane with a
vertical act label; cards tile left-to-right and wrap within the lane.

- **Three card types.**
  - **Scene** — a book scene heading; its `note` is the scene's prose/action and book dialogue.
  - **Song** — a number, tagged with a **function pill** (see taxonomy below), voicing, runtime,
    key/style fields; its `lyrics` hold the sung text.
  - **Beat** — a smaller dramatic beat between numbers, carrying a freeform, typable
    **story-function label** ("Inciting Incident", "Dark Night of the Soul", "Set up the Want").
  All three interleave freely in the running order and flow into the manuscript in order.
- **Fixed 3-act spine, always 4 lanes:** Act 1 · Act 2A · Act 2B · Act 3. The marker between 2A
  and 2B is the **Intermission** in *Full length* mode or the **Midpoint** in *One-act (90)* mode
  (a `Length` toggle mapping to `Show.form`). `card.act` holds the lane key (`'1' | '2A' | '2B' | '3'`).
- **Two-axis drag.** Sideways = reorder within an act; into another lane = change the card's act.
  Running order and percentages recompute live.
- **% through the story** on every card — weighted by cumulative runtime, so a number halfway
  through the show's minutes reads ~50%. Recomputes on every add / move / reorder.
- **Add affordances.** A `+` in the gap between any two cards, or a per-lane add tile, inserts a
  scene / song / beat there.
- **View filter:** *Full story* (scenes + songs + beats) vs *Songs only* (just the numbers).
  Percentages stay full-story-relative in both.
- **Reference banner.** When a read-only reference show is open, a banner names what that show
  *teaches* (e.g. Fiddler → "Opening number establishes world + rules"), and the same hook appears
  on the Library card, so you know what to study.

### The song-function taxonomy (the board's vocabulary)

Each song card carries one function (`FN` in `data.js`), color-coded by family:

| Function | Job |
|---|---|
| Opening | Sets tone, world, the "rules" of the show |
| I Want | Protagonist's yearning; the engine of the show |
| Charm | Light; makes us fall for a character |
| Love | Circling / declaring love |
| Production | Big ensemble spectacle, mid-act lift |
| Soliloquy | Internal decision in real time |
| Ballad | The slow, sustained emotional number |
| Act Finale | Raise stakes, cliffhanger into intermission |
| 11 O'Clock | Late-show showstopper; emotional peak |
| Reprise | A melody returns, recontextualized |
| Finale | Resolution; weaves themes back (finale ultimo) |
| Villain · Comedy · Anthem · Diegetic · Establishing · Plot · Motif | Modifiers / supporting roles |

Card statuses (shown as a dot): `idea → lyric draft → music draft → demo → locked`.

---

## 5. The Manuscript — the libretto word processor (primary surface)

The board says *where* the show sings; the Manuscript is where the book and lyrics are **written
and read as a script**. Every card's body flows into one continuous, paginated document.

### Two modes

- **Edit** (default) — a dark-friendly continuous editor. Each card is a section under a divider
  (◆ scene · ♪ song · ● beat). Clicking into a section opens the **rich line editor** in place.
- **Print View** — paginated 8.5×11" white sheets laid out to **Final Draft conventions**:
  character cue at 3.0", dialogue and lyric margins, 12pt Courier Prime, running headers, CONT'D
  marking when a character's speech crosses a page.

### The rich line editor

A `buildRichEditor()` factory, used exclusively by Manuscript Edit mode (its only other caller,
the lyric window's Rich tab, was removed 2026-07-09 — see "The Workshop" below). Each line is a
typed **element** — Character, Lyrics, Dialogue, Parenthetical, Action, Section.

- **Live inference, not a mode-switcher (2026-07-11).** As you write, a committed line's element
  type is inferred from its own text and the block context above it — the same read Highland/
  Fountain give plain text. An ALL-CAPS line after a blank/section becomes a Character cue; a
  parenthesized line becomes a Parenthetical; lines inside a character block default to sung
  (songs) or spoken (scenes/beats); `[Bracket]` becomes a Section. Feedback is **styling only** —
  no labels, chips, or popovers — so a blank page stays a blank page. Classification happens once
  per line, at the moment it's left (Enter, caret leaving the row, or editor blur), never
  retroactively above the caret.
- **Tab / Ctrl/⌘ + 1–6 / the element dropdown still work** as a silent, permanent override: retyping
  a line by hand locks it out of inference for the rest of the session (`dataset.man`), so the two
  models never fight over the same line. **Enter** still starts the next logical Final Draft-style
  element after the line commits.
- **Character-name autocomplete** on cue lines, fed by the Characters registry.
- **Seamless input format**, unchanged underneath. `classifyLyricLine` — the exact per-line
  classifier `parseLyricLines(text, defaultSung)` loops over — is now shared between the editor's
  live inference and the print parser, so the two can never drift. It also still drives rendering,
  the syllable gutter, rhyme tools, and the pages. A trailing `(sings)` / `(spoken)` overrides a
  block's default mode; legacy `@cue` / `~sung` still parse. Pasting multi-line text classifies
  each pasted line the same way, in document order, with empty lines becoming stanza breaks.

### Pagination engine

A deterministic, **measurement-based** engine — not a line-count heuristic. It renders blocks into
an off-screen sheet sized exactly like the page, measures their true height, and places them:

- **Blocks** (`buildBlocks`) are atomic layout units — a character cue stays welded to its first
  line; headers stand alone with orphan control; blank spacers are deferred so they never overflow
  or lead a page.
- **Placement** (`paginateBlocks`) fills a page, finds the real overflow point, breaks, repeats.
  An over-tall block (rare) splits token-by-token so nothing ever clips.
- **Scene-per-page.** Each scene heading starts a fresh page (libretto convention) — except the
  first scene under an act header, which rides on the act header's page.
- **Dual dialogue.** A character cue marked with a trailing `^` (Fountain convention) sings or
  speaks **simultaneously** with the cue before it. `buildBlocks` pairs them into one non-splittable
  **two-column** block, the placer measures it as `max(column heights)`, and Print View renders the
  parts side by side. An editor **Dual ⇄** button (Ctrl/⌘ + D) toggles it without typing markup;
  the pairing round-trips losslessly through the seamless format.

### Inline chords (song lyrics)

Chord symbols type directly into the lyric text, ChordPro-style — no separate chord-line or
column alignment to keep in sync as text reflows: `[C]`, `[Gm7]`, `[Bb/D]`. Typing the closing `]`
auto-converts a chord-shaped bracket into an atomic, zero-width `<mark class="chord-tag">` anchored
at that exact character; the chord name renders as a small sage-green label floating above the
lyric line via CSS (`::after { content: attr(data-chord) }`), so the underlying text never shifts
and flats/sharps stay in their typed case (not swept up by the manuscript's uppercase lyric style).
A strict token grammar (root A–G, optional `#`/`b`, optional quality — `maj7`, `m7b5`, `sus4`,
`add9`, `dim7`, slash-bass, etc.) keeps it from firing on non-chord brackets like `[Bridge]` or
`[laughs]`. Chords round-trip through `emphToHtml`/`emphFromNode` exactly like bold/italic/notes, so
they persist in the seamless text and print. A **Chords** toggle in the Page setup drawer ("Show in
document") hides the labels non-destructively (CSS only, markup stays intact), matching the
Section-tags pattern.

### Inline notes (highlight-as-note)

A lightweight, shipped v1 of an editorial-annotation layer (distinct from the richer §13 model
below, which remains a future upgrade path): select any text in the rich editor and click **+ Note**
(or use the floating selection toolbar) to wrap it in a `<mark class="note-mark">` carrying a
base64-encoded comment (`data-note-text`), rendered as a sage-green highlight. Clicking a note-mark
reopens an editable popup (in the live editor) or a read-only popover (in static Print/Manuscript
views) showing the comment. Notes round-trip through the same `emphToHtml`/`emphFromNode` markup
pipeline (`[[note:id:b64]]...[[/note]]`) as chords and other inline emphasis, so they persist and
print. The **Outline navigator** lists every note as a sub-row (✎ icon) under its parent card —
clicking one scrolls to the card, flashes the anchored highlight, and opens its popover.

### Supporting chrome

- **Outline navigator** (Edit) — a left panel listing every card grouped by act lane; click a row
  to smooth-scroll to it; the card nearest the viewport top highlights via an `IntersectionObserver`.
  Toggled from a **Navigation** button. Inline notes appear as sub-rows beneath their card (see above).
- **Contextual ribbon** — Navigation · word count · centered zoom · Edit/Print toggle · Focus ·
  Print · Settings. The Page setup drawer ("Show in document") toggles document elements: show
  title, act headers, **section tags**, and **chords** — all hide/show in both Print View and the
  Edit editor without stripping the underlying markup.
- **Focus mode** (Edit only, 2026-07-05; blank-page pass 2026-07-11) — a `body.ms-focus` class
  hides the topbar, ribbon, outline navigator, **and now the sticky format bar entirely** (it used
  to recede to 20% opacity; with live inference doing the typing work, it's no longer needed at
  all), and dims every card section to 35% opacity except the one the caret is currently in
  (tracked by a delegated `focusin` listener, so it follows click, keyboard nav, or Tab equally).
  **Typewriter scrolling** keeps the caret pinned at ~45% of the viewport — the page moves under a
  still cursor instead of the cursor drifting down the screen — rAF-coalesced so a burst of
  keystrokes scrolls once per frame. Goal stated by the designer: "a blank page with a cursor and
  nothing more." A floating **✕ Exit focus** pill fades in on mouse movement and fades back out
  after ~1.8s idle. Exits via the pill, `Esc` (module-level `msFocusExit` hook so the global key
  handler can reach whichever Manuscript instance is live), switching to Print View, or navigating
  to another page — never persisted, since re-entering the app into a chromeless screen would be
  disorienting. Deliberately scoped to Manuscript, not the Workshop (the lyric window), since the
  Workshop's rhyme/gutter tools are a different, tool-heavy activity, not sustained drafting.

### The Workshop — the lyric window, kept as a permanent second room

Decided 2026-07-05, then reconsidered 2026-07-09: the original "unified manuscript" direction —
fold every tool into the Manuscript as caret-following rails, a per-line craft margin, and
Highland-style flow-typing, eventually retiring the lyric window entirely — was built through
three phases (board badges, jump menus, navigator pills + a settings toggle) and rejected on
sight each time. Every addition read as clutter on a surface meant to stay pristine. The design
settled instead on **two rooms, one gesture apart**:

- **Manuscript** stays pristine — no rails, no margin chips, no badges, no hover menus, no new
  settings toggles. Its only addition is **beatline editing** (2026-07-09): a beat's sage
  outline note (`c.note`) is click-to-edit directly from its rendering in Edit mode
  (`makeBeatlineEditable`), round-tripping with the Board's own editable note field.
- **The Workshop** (the lyric window, `buildLyricWindow`, opened from a Board card) is the
  drafting room with the instruments out: syllable gutter, rhyme suggester, sections, verse
  notes, thesaurus (for prose cards), and card details. Simplified 2026-07-09 to **one form** —
  a Fountain textarea + gutter; the earlier Fountain/Rich toggle was removed because it
  duplicated the Manuscript's structured editor (`buildRichEditor`).
- **Travel, not merging, is the unifying move.** Both surfaces already edit the same card data
  live, so there's nothing to sync. A **"Manuscript →"** button in the Workshop's header jumps
  straight to the card's spot in the Manuscript (forcing Edit mode). Bare chevron arrows in the
  dimmed margin just outside the Workshop window (hidden below ~1100px viewport width) walk to
  the prev/next card in the show's document order (`displayOrder()`), so a full drafting pass
  never requires closing and reopening the window.

**`UNIFIED-MANUSCRIPT-PLAN.md`** (repo root) carries the full history — the rejected v1 tracks
(board badges, jump menus, navigator pills, an inspector rail, a margin gutter, flow-typing,
lyric-window retirement) and the v2 phases that shipped in their place (R1 revert · W1 one-form
Workshop · W2 push gesture · W3 prev/next arrows · A4 beatline editing) — all complete as of
2026-07-09. The binding lesson going forward: mock any user-visible chrome and get it approved
before building, and never add a settings toggle to make clutter optional.

---

## 6. Characters & Title pages

- **Characters page** — a registry card per character: voice type (Soprano … Speaking, Ensemble),
  a short description, notes, and an auto-computed "appears in" list of the songs/scenes they're
  cued in. **Sync from lyrics** scans every card via `parseLyricLines` to discover names from cues;
  these power the editor's name autocomplete and (future) vocal-load diagnostics.
- **Title pages** — generated front matter (title, authors, contact, cast list, song list, page
  settings) rendered on the same print sheets as the Manuscript, with per-block include toggles.
  Reached via **Edit title pages…** in the Page setup drawer (2026-07-05), not the Edit/Print
  toggle — title pages are set-up-once document furniture, not a document mode you work in, so
  they don't compete with the genuine Edit ⇄ Print View either/or. While open, the toolbar's mode
  switcher is replaced by a single **✓ Done with title pages** button that returns to whichever of
  Edit/Print View you came from; a reload never lands on title pages.

---

## 7. Export & backup

The Export page offers:

- **Save backup** — download a `.pshow` JSON of the whole show (renamed from `.songplot` 2026-07-05
  — the extension is app-neutral since Prose Plot uses the identical format; import still accepts
  old `.songplot`/`.json` backups for compatibility). Includes `state.format` so a re-imported
  backup keeps its song/prose identity instead of silently reverting to `'song'`.
- **Open backup** — import a `.pshow` as a new project.
- **Export as Fountain** — a `.fountain` plain-text screenplay file compatible with Final Draft,
  Highland, and Fade In; lyrics use standard Fountain character/dialogue blocks. **Rewritten
  2026-07-05** to route through `cardBodyTokens()` — the same classified-line source the
  Manuscript/PDF pipeline renders from — instead of a hand-rolled `@`/`~`-only line parser that
  predated seamless cues, inline chords, inline notes, and dual dialogue, and so silently leaked
  raw chord/note/highlight/strikethrough markup (including base64 note payloads) into exported
  files. Bold/italic/underline pass through unchanged (Fountain's own `**`/`*`/`_` syntax already
  matches ours); chords/notes/highlight/strikethrough have no Fountain equivalent and are stripped
  to plain text; a scene break exports as `> * * * <` (a bare `***` risked misparsing as an
  unterminated bold-italic run in strict parsers); a Beatline exports as a `= ` synopsis line
  (respecting the Beatlines visibility toggle) so it isn't mistaken for performed action.
- **PDF** — via Print View's print dialog (the FD-formatted pages).

Reference shows are read-only, so their export buttons are disabled.

---

## 8. The reference & study library

> **A bookshelf, not a template machine.** The library's value is **study, not prescription.** You
> read proven shows as study objects — running order, song titles, voicing, act breaks, function
> tags, and full scene/beat scaffolds, laid out exactly like your own board and manuscript. You
> browse a master's anatomy to learn from it, not to copy its slots. (Scaffold-load — dropping into
> pre-labeled empty slots — is deliberately **not** a feature; two shows can share the "opening
> number" slot and teach opposite lessons.)

Each reference show renders read-only with the same card + manuscript surfaces as a draft, and
carries a **`teaches`** hook surfaced on its Library card and as a board banner.

### Digitized shows (10, enriched)

Each is a full scaffold: `characters` (voice type + description), `titlePage`, and ordered
`cards` (scenes / songs / beats with function, voicing, runtime ballpark, and per-card notes).
**No lyrics are reproduced** — these are structural study objects. Keys / tempo / exact runtimes
are left unset ("needs score") rather than fabricated.

| Show | Year | Teaches |
|---|---|---|
| Fiddler on the Roof | 1964 | Opening number ("Tradition") establishes world + rules |
| Gypsy | 1959 | The 11 o'clock number + Act 1 finale |
| Chicago | 1975 | Diegetic vaudeville structure |
| The Little Mermaid | 2008 | Textbook "I Want" + a wall-to-wall villain |
| Legally Blonde | 2007 | Contemporary comedy; a driving I-Want |
| Newsies | 2011 | Anthem + ensemble production numbers |
| Wicked | 2003 | Contemporary Act 1 finale; friendship as the spine |
| Dear Evan Hansen | 2015 | Contemporary intimate pop; the Act 1 finale as engine |
| Hamilton | 2015 | Through-composition + motif density; delayed payoff |
| The Hunchback of Notre Dame | 2015 | Choral storytelling + a true villain soliloquy |

The shipped **demo project** (a fully-worked original with scenes, songs, lyrics, and book
dialogue) is **Circuits & Sycamores**, seeded from `app/seed-shows/circuits.json` into a new
user's data dir on first boot, never overwriting live edits.

*Future study adds:* a pure **soliloquy** exemplar (Carousel / Sweeney Todd), and the **one-act /
90-minute** form (Spelling Bee, Urinetown, tick…tick…BOOM!) once that form earns distinct
diagnostics.

---

## 9. The lyric bench (inside song cards)

Rhyme and meter tools live **inside** the song card — the lyric and the card are the same object at
two zoom levels.

- **Persona: loose pop / contemporary**, not Sondheim-strict. Rhyme is the headline; everything is
  severity-ranked and dismissible. The tool advises; the writer decides.
- **Engine:** the **CMU Pronouncing Dictionary** (`app/cmudict.txt`, ~135k words, packed to a rhyme
  key + syllable count; loaded client-side by `app/lyric.js`). One resource does syllabification,
  stress, and rhyme.
- **Shipped today:** live per-line **syllable counts**, an **A/B/C rhyme scheme** by true
  perfect-rhyme grouping (love ≠ move), a **perfect-rhyme suggester**, and a **verse-to-verse
  syllable-mismatch** flag (later verses sing to verse 1's tune, so a line that's a syllable off
  won't fit).
- **Deferred (quiet by design):** prosody / wrenched-stress hints and slant-rhyme notes — present
  in the design, held back so the bench never nags this persona.
- **The reframe:** in a musical the melody *is* the meter — the real question is "does the word's
  natural stress land on the melody's strong beat?" Beat-grid alignment and MusicXML import are
  power features for much later.

---

## 10. Snapshots (version history)

Whole-show **snapshots**: named, timestamped checkpoints with **non-destructive restore** (restoring
auto-checkpoints the current state first, so nothing is lost). Stored via a sibling-file
sub-resource API (`/api/shows/:id/snapshots`), kept out of the show-list scan. A **History** icon in
the top bar opens the drawer. Snapshots are the safety net for trying alternate takes on a scene,
and the baseline primitive that Final Draft-style revisions will later reuse.

---

## 11. Platform — accounts, storage, deployment

A deployed, multi-user PWA (scale target: the author + 1–2 trusted collaborators — file-based, no
database).

- **Accounts & auth.** `users.js` CLI manages `users.json` (scrypt salt:hash). Stateless
  signed-cookie sessions (`md_session` = `userId.HMAC`). The server gates `/` → `login.html` when
  unauthenticated; `/api/shows*` returns 401.
- **Library & files.** Per-show status (draft / active / archived), folders, duplicate / archive /
  delete, relative last-edited. Shows carry an `owner` and `collaborators[]`.
- **Sharing.** Owner-only share modal writes collaborators via `PUT /api/shows/:id/share`; access is
  enforced owner-or-collaborator. Roadmap: simple document-locking before any real-time model.
- **Data storage.** Shows are user *data*, not code — not git-tracked. `serve.js` reads `SHOWS_DIR`
  from env (an external dir on the server) so `git pull` never collides with live data; demo seeds
  copy in only if absent. An optional `USE_REMOTE_DATA` proxy lets local dev read prod data.
- **Deployment.** Live at `https://musicaldesigner.colincreates.com` **and**
  `https://proseplot.colincreates.com` (2026-07-04: split onto sibling subdomains — see below), on
  a DreamCompute VPS (Ubuntu 24.04, **458MB RAM / 2.9GB disk — small, watch usage**; Node 20, pm2;
  Caddy reverse-proxies both hostnames' :443→:8090 with auto Let's Encrypt). PWA: manifest + service
  worker (`sw.js`, `CACHE` bumped each deploy) + icons; installable, with iPad safe-area handling.
- **Stack.** Vanilla JS SPA, no build step. `app/app.js` (client), `app/data.js` (reference shows +
  taxonomy), `app/lyric.js` (rhyme engine), `app/serve.js` (Node HTTP server), `app/styles.css`.
  Deploy: `git pull && pm2 restart musical-designer`.
- **Subdomain split (2026-07-04).** Song Plot and Prose Plot are one Node process/one `SHOWS_DIR`
  behind two hostnames, not two deployments. `serve.js` branches purely on the `Host` header
  (`brandFor()`) to serve a per-app `manifest.webmanifest` and to patch `index.html`'s
  `<title>`/theme-color/apple-web-app-title on the way out — no per-app build. Session cookie
  (`md_session`) is widened via `COOKIE_DOMAIN=.colincreates.com` (set in pm2's saved env, see
  `pm2 env 0`) so logging into one subdomain logs you into both. Client-side, `app.js`'s
  `appFromHost()` maps `{musicaldesigner.colincreates.com: 'song', proseplot.colincreates.com:
  'prose'}`: it sets the default `state.currentApp` on load, makes the waffle "switch app" button
  navigate cross-domain (`location.href`) instead of flipping in-page state, and — important
  fix — filters the boot-time "auto-open most recent show" logic to the current app, so visiting
  one subdomain never silently opens the other app's most-recently-edited show. Caddy config lives
  server-side only (`/etc/caddy/Caddyfile`, not in this repo): one block per hostname, same
  `reverse_proxy localhost:8090` target.
- **Backups & monitoring (2026-07-04).** Triggered by a full-disk outage (2.9GB disk hit 92% →
  OOM-killed processes → box unresponsive to SSH/HTTPS/ping; fixed by clearing a 604MB
  `~/.vscode-server` cache + apt cache + old journal logs, then a soft reboot). Two cron jobs now
  run on the VPS (not in this repo — server-side only, see `crontab -l`):
  - `~/backup-musical-designer.sh`, nightly at 3am: tars `SHOWS_DIR`, `snapshots/`, and
    `users.json`, pushes to Dropbox via `rclone` (`dropbox:MusicalDesignerBackups/`), prunes
    anything older than 30 days both locally and in Dropbox. rclone's Dropbox token lives only in
    `~/.config/rclone/rclone.conf` on the server.
  - `~/disk-alert.sh`, daily at 9am: pushes an [ntfy.sh](https://ntfy.sh) notification (topic
    `md-disk-3e91d232bd3a`, private/unlisted — subscribe via the ntfy app or that URL) if `/` usage
    is ≥85%, so a filling disk gives warning instead of another silent outage.

---

## 12. Status — toward the first full version

What's built and working:

| Area | Status |
|---|---|
| Board — 3-act spine, drag, scene/song/beat, function pills, % through story | ✅ |
| Lyric bench — CMUdict rhyme scheme + suggester + syllable / verse checks | ✅ |
| Manuscript — Edit + Print View, rich line editor, seamless format | ✅ |
| Pagination engine — measurement-based, blocks, orphan/CONT'D control | ✅ |
| Scene-per-page (act-header exception) + spacing fidelity | ✅ |
| Dual dialogue — `^` markup, two-column layout, editor toggle, round-trip | ✅ |
| Characters registry + sync-from-lyrics | ✅ |
| Title pages | ✅ |
| Export — backup / import / Fountain / PDF | ✅ |
| Snapshots — version history with non-destructive restore | ✅ |
| Reference library — 10 enriched study shows, read-only board + manuscript | ✅ |
| Structured line model — persisted `card.lines` with stable ids (lazy migration) | ✅ |
| Revisions — margin asterisks, named revision sets, Lock Pages, revised-pages-only PDF | ✅ |
| Inline chords — typed `[C]` shorthand, sage floating labels, Page setup toggle | ✅ |
| Inline notes (v1) — highlight-as-note, popup/popover, Navigator sub-rows | ✅ |
| The Workshop (§5) — one-form lyric window, push-to-Manuscript, prev/next arrows, beatline editing | ✅ |
| Platform — accounts, Library, sharing, PWA, deploy | ✅ |

What's next (in dependency order — Revisions, inline chords, and inline notes v1 all shipped, see
the table above):

1. **Variants.** Per-scene alternate takes on the line model, with "only the active variant counts
   toward board / runtime / manuscript / export" as the guardrail. No full branch/merge model.
2. **Diagnostics engine ("lint for musicals").** Once cards carry richer data, flag craft problems:
   no I Want in Act 1, protagonist silent for N minutes, three ballads in a row, antagonist with no
   number, Act 2 song-starved, orphaned reprise, act runtime imbalance. **Form-aware** (a one-act-90
   show suppresses the Act 1 finale / intermission checks). The reference library can then offer
   *comparison, not fill-in*: "your show has no Act 1 finale — here's how three reference shows
   handle that beat." A prompt to think, never a slot to fill.

### Professional-libretto formatting gaps (future, small)

Audited 2026-07-05. Song Plot's **Libretto look is already the default** — sung lyrics render
ALL-CAPS in the Manuscript (`.lw-sung` uppercase, with chord names exempted so `Bb`/`B#` survive),
the "SONGS" title page auto-lists every song card in order, songs auto-number 1, 2, 3… (with inline
`#7`-style header markup supported), and characters carry a **voice type** that surfaces on the Cast
title page. So most of what a submission packet needs exists. The genuine remaining gaps, all small
relative to the existing engine:

- **Musical-number *types* beyond songs.** Numbering counts song cards only. Real scripts number the
  *whole* musical spine — overture, entr'acte, playoffs, scene-change music, bows — and use
  **letter suffixes for reprises/incidental music** (`#7A — Tango Playoff`, `#7B — Scene Change`).
  Needs a "number type" on song cards (song / reprise / instrumental) that ripples into the song
  list and the manuscript song headers. This is the one real structural gap.
- **Structured book/music/lyrics credits.** The title page's author line is a single freetext field.
  Pros credit *Book by / Music by / Lyrics by* as separate lines, plus underlying-rights ("Based
  on…") and occasionally separate © for book vs. score. A small structured upgrade to the title-page
  data model.
- **French-scenes grid.** The who's-onstage-when matrix (characters × scenes) that SMs/directors
  build by hand. Fully derivable from existing cue data — a generated read-only artifact, not new
  authored data.
- **Revision *colors*.** Revision marks and revised-pages-only export already exist; the pro
  convention adds the goldenrod/salmon/blue colored-page sequence. Mostly a label-and-tint on the
  revision machinery already built.
- **Sides generation.** Per-scene export already exists and is close; a "pull one scene + one song
  for auditions" packet would finish it.

If Song Plot ever wants a Prose-Plot-style *theme* switcher it's only two or three modes —
**Submission manuscript** (today's default), **Libretto style** (already 90% the default), and maybe
a normal-case **Reading draft** — far lighter than the book-formatting effort, since it's one engine
with different toggles rather than a new render path.

## 13. Editorial notes — the review punch-list

**Status: a v1 has shipped** as the highlight-as-note feature (§5, "Inline notes"): select text →
`==mark==`-style highlight with a comment, popup/popover, Navigator sub-rows. What follows below is
the originally-envisioned **richer model** — `card.notes` as a first-class object array with author,
status, tags, and orphan handling — which the shipped v1 does not yet implement (today's note is
just an inline highlight + freeform text, anchored by being embedded in the markup itself rather
than by a stable `lineId`, so it has no author/status/tag fields and no orphan tracking). Treat this
section as the upgrade path for v1, not a from-scratch description of unbuilt work.

A third annotation layer in Manuscript mode, distinct from the two that exist today:

| Layer | What it is | Whose voice |
|---|---|---|
| Sage loglines | Your outline reference ("what this beat is about") | You, planning |
| Revision marks (asterisks / `lastRev`) | What *changed* between drafts | The document, mechanically |
| **Editorial notes** | "Cut this song?", "Needs lyric work" | You reviewing, or someone giving you notes |

Notes are **action items / questions**, not content and not outline — they get their own color, their
own visibility toggle, and a roll-up in the Navigator. The payoff is *at-a-glance*: scan the outline and
see where the work is, or work a flat punch-list of what needs fixing (including notes someone else gave you).

**Data model** — a note rides alongside `card.lines` as `card.notes`, so it serializes with the card and
travels when the card moves act. Anchored by **stable id, never text offset** — this is exactly what the
line-identity model was built to enable:

```
note = { id, cardId, anchor: { lineId } | null,   // null = whole-card note
         text, author,                            // "Me" | "Sarah (director)" — drives color
         status: 'open' | 'resolved',
         tag?: 'cut'|'lyric'|'music'|'structure'|'question'|'praise',
         createdAt, rev? }                         // revision set it was made against
```

**Anchoring + orphans.** Anchor to `line.id`. Because `mergeLineIds` keeps a line's id when type+text is
unchanged and mints a fresh one when rewritten, a note stays attached when you edit *around* it and goes
**orphaned** when its line is deleted or rewritten past recognition. Orphans don't vanish — they surface in
the Navigator under an "Orphaned / unanchored" group with a snapshot of the last-known line text, so "fix
this rhyme" survives you rewriting the rhyme.

**Three surfaces.**
1. *Create* — Edit mode: select a line (or click a card) → a margin "＋ note" affordance or shortcut
   (e.g. ⌘⇧M); card-level notes from a button in the card's section header. Reuse the editor's right gutter.
2. *In the manuscript* — a colored **margin pin** by the anchored line (distinct from sage green and from
   revision asterisks; amber = open, faded = resolved), expanding on hover/click. Gated by a **"Notes"
   toggle**, mirroring the Section-tags round-trip pattern (build-time gate for Print, `.hide-notes` CSS
   for Edit). Notes **don't print** by default; optional "Print with notes" → margin notes or an endnote list.
3. *The Navigator* — two additions to `refreshNav` (the `navRows` map of card-id → row is the hook):
   **badges** (count pill + colored dot per `.ms-nav-row` with open notes), and a **notes-inbox mode**
   that flips the outline panel to a flat list grouped by card, filterable by status / author / tag, each
   clickable to jump to its anchor.

**Workflow.** Open → Resolved (resolved hide from the manuscript, stay in the inbox's history). `author`
is a label you set per note (color-coded) — covers "someone gave me notes" by transcription, without needing
real multi-user; collaborative authoring is a later phase on the identical model.

**Phasing (UI-first).** (1) Card-level notes + Navigator badges + inbox panel — biggest payoff, no anchoring
complexity. (2) Line-level anchoring + margin pins + orphan handling. (3) Author colors, resolve workflow,
tags, notes-report export. (4) Real-time multi-collaborator authoring.

**Open decisions.** Anchor depth for v1 (card-only ships fastest); whether notes auto-flag as "stale?" when
the anchored line's `lastRev` changes between drafts (nice nudge vs. noise); fixed tag palette vs. freeform
(fixed keeps the Navigator dots meaningful); collaboration reach (labels now, true multi-user later).

## 14. Research notes — the writer's notebook

A third top-level destination alongside **Board** and **Manuscript**: a place for the thinking that
isn't a card yet — theme work, character and relationship notes, setting, pasted research, quotes,
sources. The model is the one the writer already runs by hand: **Apple Notes open next to the writing
window**, with distinct notes for "Characters," "Setting," "Theme," "Sources." This ports that setup
inside the app so it travels with the show instead of living in a separate silo.

**Why a page, not a Manuscript drawer.** The friction being solved is *referencing back and forth
without clicking into cards*. Notes get cross-referenced against **both** the board and the manuscript,
so a panel bolted onto one mode would serve only half the flow. It's a sibling page. The Scrivener
feel — flip to Research, flip back, don't lose your place — comes not from co-visibility but from
**per-mode position memory** (below).

**Structure — a list of named freeform notes** (Apple Notes' sidebar / Scrivener's binder), *not* one
long chunked document. This is the cleaner shape and it maps directly onto the existing Navigator:

- **Navigator rail = the note index.** Click a title, its page fills the pane. The Navigator *is* the
  list of notes — no heading-anchor gymnastics; each note is its own anchor.
- **Pane = the selected note** — freeform paste-and-write.

**Data model** — notes live in the show file so they sync and travel with everything else:

```
show.notes = [ { id, title, body, createdAt, updatedAt } ]   // ordered; freeform body
```

Ship a couple of starter notes (Characters, Theme, Sources) but the categories are **not** hardcoded —
add / rename / delete / reorder freely, since every show needs different buckets.

**The editor is deliberately simpler than the Manuscript's.** Headings, paragraphs, block quotes,
links — explicitly **not** cue/dialogue/lyric elements. Paste lands as plain text with line breaks
preserved (predictable over pretty), with a manual block-quote style for quotes and sources.

**Position memory is the one hard requirement, and it's per-mode.** "Keeps my position in both modes"
means each destination independently remembers where you were:

- **Notes** remembers *which note is open + its scroll position*.
- **Board** remembers *scroll / zoom*.
- **Manuscript** remembers *its scroll spot* (the Edit/Print anchor system already built — now also
  "don't reset when I leave and come back").

Get this right and flipping Notes ↔ Board ↔ Manuscript never loses your place. That's the whole
"doesn't interrupt my flow" property.

**Distinct from §13 (Editorial notes).** Opposite direction of flow. Editorial notes are *commentary
on material that already exists* ("cut this song?", anchored to a line). Research notes are *generative
capture flowing toward the board* — ideas with no home yet. Same neighborhood, different jobs; keep
them separate systems even if they share visual vocabulary.

**Phasing (UI-first).** (1) The page + note list + simple editor + show-file storage — the core port
of the Apple Notes habit. (2) Per-mode position memory across all three destinations. (3) Paste
handling / block-quote style / links. (4) *Optional, later:* "link this note to a card or scene" — skip
for v1; the stated value is fast reference, not wiring.

**Open decisions.** Whether the pane can expand to full width for pure dumping vs. always list-plus-pane;
whether to keep the future note→card "promote" affordance in reserve (the Option-B idea we set aside)
or commit to notes-as-reference-only; rich-paste fidelity (plain-plus-quotes now, more later).

## 15. Story DNA — the broad-strokes analysis tab

A singleton **Story DNA** page (a sibling top-level tab, like Characters or Research Notes) for working
out the *shape* of the show before it's cards: the structural spine, the theme it argues, and the cast
plotted on that theme. Lineage: a distillation of the separate **Story Symmetry** app (Wells/Baugh
7-point chiasmus, Chamberlain's catch, Bell's mirror moment), narrowed to the broad strokes and
re-drawn in *this* app's design language, plus **Arndt**'s three levels of stakes and **Truby**'s
character web.

**Deliberately decoupled in v1.** It's an *analysis* surface, not a generator — editing the DNA does
**not** touch the board, and the board doesn't feed it. The writer fills it out, then goes and makes
songs/cards by hand from what they learned. This is the whole complexity-saving decision: no structural
model kept in sync with the card model, no orphans, no bidirectional edits. (A "create a card from this
beat" bridge is a later phase, not v1.) One singleton per show, stored in the show file; inherits the
same per-mode scroll/position memory as the other tabs (see §14).

**The unifying idea — stakes are the shared spine.** The theme *is* a set of value oppositions; the
beats trace the protagonist across them; the characters each stake out a position on them. One small
set of oppositions, expressed at three levels. That's what earns the name.

**Four panels, top to bottom, all free text:**

1. **The "what if" line** — the logline / premise, one field.

2. **The mirrored 7-beat diagram** — the chiasmus, flattened into this app's calmer language (no
   sliders, no polarity/comedy-tragedy fork — those stay in Story Symmetry). Truth line down the left
   (rising), want line down the right (falling), each horizontal **pair** linked by its relationship
   (`inverts` / `escalates`), the **midpoint** dropped to the center as the nucleus.

   | Left (truth line) | ↔ | Right (want line) |
   |---|---|---|
   | Resolution · beat 7 | inverts | Set up want · beat 1 |
   | A-ha · beat 6 | inverts | Threshold · beat 2 |
   | Pinch · beat 3 | escalates | Crisis · beat 5 |
   | | Midpoint · beat 4 (nucleus) | |

   **A beat is usually one text field — except the Threshold, which carries two:** the beat *and* a
   broken-out **catch** (Chamberlain's "you get the want, but…"). The catch gets its own labeled line
   because it's the specific thing the A-ha inverts, and burying it in prose hides the mirror. (Wicked:
   catch = "the special treatment makes her visible" ↔ A-ha = "she chooses to become invisible.") So the
   data shape is a beat with role, text, and an optional `catch` on the Threshold — mirroring Story
   Symmetry's model without importing its numeric machinery.

3. **The theme — three levels of stakes (Arndt).** Each level is one opposition, two free-text poles
   (the truth pole and the flaw pole):

   | Level | Truth pole | Flaw pole |
   |---|---|---|
   | External (the plot's stake) | Justice for all | Tyranny |
   | Internal (the relational self) | Solidarity | Isolation |
   | Philosophical (the worldview) | Be yourself | Keep appearances |

   This is the step past Story Symmetry, which had only two axes (internal, philosophical) — **External
   is the new third strand.**

4. **The character web (Truby)** — inline on this page (not the Characters tab), a 2×2 grid crossing
   **Internal × Philosophical** *only* — the two *character-facing* axes. External is the plot's stake,
   not a way to sort a cast. Row/column labels are **read live from the theme block above** (one-
   directional read from the same show file — no sync, no orphans; blank axes just show placeholders).
   Cells are multi-occupant, and an **empty cell is a diagnostic** — a stance no character embodies,
   i.e. a possibly-missing voice. (Wicked: "be yourself · isolation" = Elphaba, Fiyero; "keep
   appearances · isolation" = the Wizard, Morrible, Nessa.)

**What we're leaving in Story Symmetry (not porting):** the numeric stakes sliders and transformation
curve, the 2-D plane, the mirror desk, the lenses, the comedy/tragedy variant fork, the 40-card
expansion (this app's **board** already *is* the expansion), and the polarity-aware **validator**. The
validator is the most tempting to bring back — it's the real "analysis engine" — but it's a later phase.

**Phasing (UI-first).** (1) The tab: what-if + 7-beat chiasmus (with the Threshold catch) + three-level
stakes + inline character web — all free text, zero board coupling. (2) The validator / mirror-integrity
checks and hole-finding (pair inversions, resolution ↔ set-up-want, empty web cells). (3) The External
axis participating in a web view; a "create card/song from this beat" bridge to the board; optional
comedy/tragedy fork.

**Open decisions.** Whether v1 seeds a new project *onto* this page (discovery-first) or leaves it as an
optional side tool — lean optional, never a forced gate; whether character placement is free-text cells
or stored on real character records so the grid is a projection (leaning the latter — B-lite — once the
Characters model is touched); how far the validator goes before it becomes noise.

## 16. Plot Suite — Song Plot + Prose Plot

The platform is no longer one app; it's a **suite of format-specific writing apps sharing one
backend** — the Microsoft 365 model (Word vs Excel: distinct branded apps over one account, one
file store, one OneDrive). **Song Plot** is this app under its original name. **Prose Plot** is a
sibling app for long-form prose (novels), living in the same codebase and deploy. The umbrella
brand is unnamed for now — "Plot Suite" is the working label.

A novelist must never feel like they're "in the musical app, in prose mode." That constraint is
why this is a skin-per-app model, not a format dropdown.

### Two-layer architecture

- **Shared substrate** (built once, identical across apps): accounts/auth, sessions, storage,
  per-app-partitioned Library, folders, sharing, Snapshots, the Navigator/outline engine, inline
  notes, and the **Story DNA** planning framework (§15 — already format-agnostic by design).
- **Per-app skin** (name, palette, chrome, editor, vocabulary): Song Plot = purple, song/beat/scene,
  the libretto Manuscript, the lyric bench. Prose Plot = coral, chapter/beat, and (not yet built) a
  prose-native editor — see below.

### What's shared vs. partitioned

- **`Show.format`** (`'song' | 'prose'`) is first-class on every show, set at creation and never
  changed. It drives which skin renders and which Library a show appears in.
- **Library is fully partitioned per app**, not a filtered view of one list — Song Plot's reference
  shelf (§8) must never appear next to novels, and a novelist's Library should never show musical
  scaffolding. `state.currentApp` tracks which app's Library is open; opening a show sets
  `state.format` from the file and the whole UI (theme, vocabulary, template) follows it.
- **The waffle launcher** — top-left, replacing the show-name slot, but **only on the Library
  page** (`#tn-waffle-btn` vs `#sb-show-btn`, toggled by `applyTopbarSlot()`). A dropdown lists
  Song Plot / Prose Plot; picking one re-renders the Library for that app. Inside an open show, the
  slot reverts to the show name — the waffle is a Library-level "which filing cabinet" switch, not
  a persistent chrome element.
- **Theme.** `applyAppTheme()` toggles `body.app-prose`, which overrides `--energy` (purple → coral,
  `#dd6349` light / `#f0937a` dark) and cascades through every themed control. Because a long tail
  of Song Plot surfaces hardcode purple hex rather than reading `--energy`, a second, explicit
  `body.app-prose` / `body.dark.app-prose` override block in `styles.css` re-points those specific
  rules (toolbars, ribbon, primary buttons, chapter cards, active-state pills) — scoped so Song Plot
  is structurally guaranteed to be unaffected.
- **Vocabulary swap, not a new data model.** A "scene" card *is* a "chapter" in Prose Plot — same
  `type: 'scene'` field, recolored coral and rendered as a thin vertical-text rectangle. Copy is
  swapped conditionally on `state.format === 'prose'` throughout (button labels, empty states,
  placeholders, the Characters page, Find & Replace status line) without changing the underlying
  type strings, so shows round-trip identically regardless of which app opens them.
- **Default template.** A new novel seeds **30 chapters** (`Chapter 1`…`Chapter 30`, one
  `type: 'scene'` card each) with **two beats following each chapter**, distributed across the same
  four-lane spine as Song Plot's acts. No `Length` choice — novels default to the one-act spine
  since intermissions have no prose analog; the modal skips straight from Title to Create.
- **Ribbon stats.** Song Plot's ribbon shows Songs / Beats / Runtime / Words. Prose Plot's shows
  **Chapters / Beats / Words**, where Words is `current / target` (default 75,000, click-to-edit)
  instead of a runtime clock — word count, not runtime, is the metric a novelist tracks. (Both
  ribbons dropped their "Pre / post mid" stat 2026-07-03 — not useful to either app.)

### Status

| Area | Status |
|---|---|
| `format` field, per-app Library partition, waffle launcher | ✅ |
| Coral theme (`body.app-prose`), incl. toolbars/ribbon/buttons/chapter cards | ✅ |
| Chapter/beat vocabulary, 30-chapter default template | ✅ |
| Word-target ribbon stat (click-to-edit) | ✅ |
| Prose-ified copy — Board, Characters, Find, New-novel modal, Manuscript placeholders | ✅ |
| Separate subdomains (`musicaldesigner.` / `proseplot.colincreates.com`), shared login, per-app PWA branding | ✅ (2026-07-04) |
| **Prose-native Manuscript editor** (see below) | 🔶 phases 1–4 + focus done (narrowed elements, live inference, smart typography, per-novel indent/block, per-chapter word counts, blank-page focus); metadata/craft/export remain |
| Prose-tuned Story DNA labels | ⬜ |
| Book export — EPUB + print PDF, front/back matter, themes, trim sizes (see below; Manuscript-format PDF for agent submission stays as-is) | 🔶 Phases 0–3a done (data model, front/back-matter editors, Book view render + PDF, self-hosted serif fonts, four theme presets + chapter-label styles + drop/raised/small-caps openers + scene-break ornaments, and 2026-07-20: real book trim sizes 5×8–6×9) — recto/verso + running heads, EPUB remain; see `BOOK-FORMATTING-PLAN.md` |

### The prose-native editor — what's needed (not yet built)

Prose Plot currently reuses the libretto Manuscript verbatim as a stand-in. That's the right call
for standing the app up fast, but it's a screenplay tool wearing coral, not a prose editor. A real
novel-writing surface needs a genuinely different model, not a reskin, because **screenplay
formatting is element-typed and rule-driven** (every line has a type — cue, action, lyric — and
the type dictates layout) while **prose is one flowing stream of paragraphs**, with formatting left
to the author's discretion. Concretely, in priority order:

1. **Collapse the Element dropdown.** Cue / Dialogue / Parenthetical / Action / Lyric has no prose
   analog. Prose's paragraph-style choices are just **Body · Chapter heading · Scene break**
   (a centered `* * *` / `⁂` divider) — most text never needs to leave "Body." *Partly addressed by
   the 2026-07-11 inference pass above:* Prose already narrows the editor's cycle to `action` /
   `scenebreak` only, and `***` now infers to a scene break live as you type (no Tab needed) — the
   dropdown mostly just sits unused already.
2. **Promote inline character styling — italics above all.** Screenplay text barely uses inline
   emphasis; prose leans on *italics* constantly (internal thought, emphasis, titles, foreign
   words), occasional **bold**, and rarely small caps. ⌘I needs to be as central as Tab-cycle-element
   is in the libretto editor. (Bold/italic/notes already round-trip through `emphToHtml` /
   `emphFromNode` — the plumbing exists; it just needs to be the star instead of a footnote.)
3. **Smart typography, applied live.** Curly quotes, em-dash for interruption, en-dash for ranges,
   a real ellipsis character — auto-substituted as you type (iA Writer / Ulysses convention), not
   left to the author to type correctly. Screenplay convention doesn't care about this; prose readers
   notice straight quotes immediately.
4. **Paragraph convention — shipped.** A per-novel **Indent / Block** segmented control in the
   Page-setup drawer (`state.paraStyle`, serialized with the novel like `wordTarget`, defaulting to
   Indent). Indent = first-line indent, paragraphs flowing tight with no gap (print-novel); Block =
   no indent, a gap between paragraphs (manuscript / web-serial). Rendered by a `body.ms-para-block`
   class in both Edit and Print View, so no reflow/reparse. In Indent mode the first paragraph of
   every chapter/scene stays flush-left (adjacent-sibling rule: only a paragraph that follows
   another is indented) — standard book typography. *(Persistence moved per-device → per-novel and
   first-paragraph flush added 2026-07-20; the segmented control itself shipped with the original
   Prose Plot build.)* Still deferred: dialogue-as-new-paragraph-per-speaker has no special
   handling beyond the author starting a new line.
5. **Word count is the primary metric** — threaded into the ribbon (§ above), the Navigator footer
   (active-chapter + book total), and, as of 2026-07-20, a **per-chapter count on every Navigator
   row** (`chapterWordCount` per `scene` card, faint right-aligned tabular figure, prose-only). The
   outline now reads as a weight map at a glance instead of only showing the chapter you're scrolled
   into. Reference novels (no typed body) fall back to each chapter's published `words` ballpark, so
   the per-row numbers still sum to the book total on a study object.
6. **Long-form writing affordances — shipped for free, 2026-07-11.** Prose Plot's Manuscript already
   reuses `buildRichEditor`, so the same Focus mode upgrade landed here too: format bar fully
   hidden, current card dimmed-out from the rest, and typewriter scrolling holding the caret at 45%
   of the viewport. Novels are drafted in long sessions, unlike a song's short lyric bursts, so this
   was worth pulling forward ahead of the rest of the prose-native editor.
7. **Deferred, no analog needed yet:** POV/tense/location scene metadata (an inspector panel, à la
   Scrivener); prose-craft feedback — filter words, adverbs, repeated-word/echo detection, passive
   voice, sentence-length variance — as the prose equivalent of the lyric bench's rhyme tools
   (§9); and a prose **Export** branch (EPUB/DOCX compile, title/dedication/epigraph front matter)
   distinct from Fountain/PDF, since a novel's deliverable format has nothing in common with a
   script's.

**Phasing (UI-first, mirroring how every other Plot Suite piece shipped):** (1) Collapse the
Element dropdown to Body/Chapter/Scene-break + promote italic/bold — **shipped** (prose narrows to
`RICH_EL_CYCLE_PROSE`, live inference retypes as you write, 2026-07-11). (2) Smart-typography
auto-substitution — **shipped** (`trySmartTypography`, prose-gated). (3) Paragraph-convention
toggle (indent vs. block) — **shipped** (per-novel `state.paraStyle`, first-para flush, 2026-07-20).
(4) Per-chapter word counts in the Navigator — **shipped 2026-07-20** (per-row faint count on chapter
rows, prose-gated, reference-novel `words` fallback). (5) Focus mode — **shipped
2026-07-11** (blank-page pass: format bar hidden + typewriter scrolling), on the shared
libretto-based Manuscript Prose Plot reuses. (6) Metadata inspector, prose-craft feedback, and
EPUB/DOCX export — each a later, independent phase.

### Book export — EPUB + print-ready PDF (future, not yet built)

> **Execution plan exists:** `BOOK-FORMATTING-PLAN.md` (repo root) breaks this into 11
> phases with per-phase file anchors, decided designs, and acceptance criteria, written to
> be executed one phase per session. This section stays as the concept-level rationale;
> the plan file is the how and carries the live status table.

Prose Plot's eventual biggest gap versus Atticus/Vellum: today it can only export the screenplay-
style Fountain/PDF Song Plot already has. A novelist needs two genuinely different deliverables,
generated from the same card data, and **both must coexist as separate output modes** — this is
not a replacement for the existing Manuscript look:

- **Manuscript format (keep, unchanged)** — Courier/Times, double-spaced, 1" margins, header
  `LASTNAME / TITLE / #`, scene breaks as `#` — the standard format for submitting to agents and
  editors. This is what Prose Plot's Print View already produces and must keep producing.
  Chapter-opener/theme styling below applies to the **book** output only, never to this one.
- **Book output (new)** — a self-publishing-ready PDF (print) and EPUB (ebook), styled and paginated
  completely differently from the submission manuscript.

**Front matter / back matter** (shared structure, both book outputs) — a toggleable, templated
block system extending the pattern Song Plot's title pages already use (per-block include
checkboxes): half title, title page, copyright page (©, ISBN, edition, disclaimer), dedication,
epigraph, table of contents (auto-generated; in EPUB this is the machine-readable nav document
required by spec), foreword/preface/prologue. Back matter: acknowledgments, About the Author, Also
By (with store links in EPUB), newsletter signup. Some blocks are pure generation (TOC), some are
short free text (dedication), one is a real small formatted document (copyright page) — plan the
data model for that range, not just checkboxes.

**Print-only layout** (the pagination engine gains real book-printing concepts, not just a new
page size):
- **Trim sizes** — 5×8, 5.25×8, 5.5×8.5, 6×9 (the last two cover most fiction) as a
  `{width, height, margins}` parameter on the existing measurement-based engine.
- **Mirrored margins with a gutter** — recto/verso pages, inside margin wider than outside. The
  engine currently has no concept of page side; this is the first genuinely new idea it needs.
- **Front-matter page numbering** — lowercase roman numerals (or none), resetting to arabic 1 at
  chapter one; no folio on chapter-opening or blank pages; running heads (author on verso, title on
  recto) that vanish on chapter openers.
- **Chapter-start rules** — new chapter always starts on a fresh page with a deep sink (~⅓ down);
  optionally forced to always land on a recto page (inserting a blank verso when needed).

**Chapter heading design + fonts — a "theme" layer** (Vellum's actual product, worth copying as a
concept): one bundle of choices applied everywhere rather than dozens of independent knobs.
- **Chapter number/title style** — "Chapter One" / "Chapter 1" / bare "1" / roman numeral / custom
  label, optional title beneath, optional ornament or rule.
- **Chapter openers** — drop cap, raised cap, first-line small caps, or plain.
- **Scene breaks** — the existing `***`/`⁂` convention, themeable as asterisks, an ornament, or
  blank space.
- **Serif fonts, OFL-licensed** (free to embed in both PDF and EPUB) — EB Garamond, Crimson Pro,
  Literata (Google's ebook-commissioned face), Alegreya, Libre Baskerville, Source Serif, Spectral.
  Ship two or three good ones rather than many mediocre ones. Note: most e-readers let the reader
  override the publisher font regardless, so embedded EPUB fonts are a default, not a guarantee —
  the print PDF is where font choice fully pays off.

**EPUB packaging** — a ZIP of XHTML chapter files + CSS + an OPF manifest (title, author, language,
ISBN/identifier, description) + the nav/TOC document + cover image, targeting EPUB 3 (validate
against EPUBCheck; KDP now ingests EPUB directly, so one artifact covers Kindle + Apple Books +
Kobo). Two things that make this fit the existing no-dependencies, vanilla-JS house rule: card
bodies already round-trip through `emphToHtml`, so chapter-XHTML generation is half-written; and a
ZIP with **stored (uncompressed) entries** is valid and simple to hand-write (the one spec quirk —
the `mimetype` file must be first and uncompressed — falls out naturally from store-only). New
show-level metadata this requires: author display name, ISBN, publisher line, description, a cover
image (the data model's first real binary asset — flag early), and per-book theme + trim settings.

**Phasing** (front/back matter first since it also improves the existing PDF path immediately):
(1) Front/back-matter blocks. (2) Theme layer + serif fonts + chapter-opener styles (Print View
visibly becomes "book," not "manuscript" — still no new pagination-engine concepts). (3) Trim
sizes + recto/verso + book page-numbering (the pagination-engine work). (4) EPUB export last — the
least coupled piece since it skips pagination entirely; it just needs (1) and (2) done to have real
content and metadata to package.

### Design lessons we're keeping

- **The substrate earns the feature.** Two foundations — the **pagination/measurement engine** and
  the **line-identity model** — unlock pixel-perfect layout, dual dialogue, revisions, and variants.
  Build the foundation first; don't ship the fancy layer before the substrate earns it.
- **The dual energy/tension contour was cut** (the divergence-band curve, the ghost-overlay). In
  real use the **cards** were what mattered, not the curve; the `energy`/`tension` fields are
  removed from the data model. The reasoning that survived: the interesting signal is *relational*
  (e.g. high tension + low energy = the quiet devastating number) — it may feed a future diagnostics
  view, but as analysis of real cards, not a curve to draw.
- **Study, not prescription.** The library teaches by anatomy, never by paint-by-numbers slots.
