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
| **Export** | Backup (.songplot JSON), Fountain (.fountain), PDF (via Print View), and import (§7). |

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

A shared `buildRichEditor()` factory (used by both Manuscript Edit and the lyric window's Rich
tab, so book and lyric editing feel identical). Each line is a typed **element** — Character,
Lyrics, Dialogue, Parenthetical, Action, Section.

- **Tab** cycles element type; **Enter** starts the next logical line; **Ctrl/⌘ + 1–6** jump
  straight to an element type (Final Draft-style).
- **Character-name autocomplete** on cue lines, fed by the Characters registry.
- **Seamless input format.** No markup required: an ALL-CAPS line is a character cue; lines default
  to **sung** in songs / **spoken** in scenes & beats; a trailing `(sings)` / `(spoken)` overrides
  the block. `parseLyricLines(text, defaultSung)` is the single source of truth — it classifies
  each line 1:1 and drives rendering, the syllable gutter, rhyme tools, and the pages. Legacy
  `@cue` / `~sung` still parse.

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

### Supporting chrome

- **Outline navigator** (Edit) — a left panel listing every card grouped by act lane; click a row
  to smooth-scroll to it; the card nearest the viewport top highlights via an `IntersectionObserver`.
  Toggled from a **☰ Navigation** button.
- **Contextual ribbon** — Navigation · Edit/Print toggle · centered zoom · Print · Settings. The
  settings drawer (right) toggles document elements: show title, act headers, and **section tags**
  (which now hide/show in both Print View and the Edit editor).

---

## 6. Characters & Title pages

- **Characters page** — a registry card per character: voice type (Soprano … Speaking, Ensemble),
  a short description, notes, and an auto-computed "appears in" list of the songs/scenes they're
  cued in. **Sync from lyrics** scans every card via `parseLyricLines` to discover names from cues;
  these power the editor's name autocomplete and (future) vocal-load diagnostics.
- **Title pages** — generated front matter (title, authors, contact, cast list, song list, page
  settings) rendered on the same print sheets as the Manuscript, with per-block include toggles.

---

## 7. Export & backup

The Export page offers:

- **Save backup** — download a `.songplot` JSON of the whole show.
- **Open backup** — import a `.songplot` as a new project.
- **Export as Fountain** — a `.fountain` plain-text screenplay file compatible with Final Draft,
  Highland, and Fade In; lyrics use standard Fountain character/dialogue blocks.
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
- **Deployment.** Live at `https://musicaldesigner.colincreates.com` (DreamCompute VPS, Ubuntu +
  Node 20, pm2; Caddy reverse-proxies :443→:8090 with auto Let's Encrypt). PWA: manifest + service
  worker (`sw.js`, `CACHE` bumped each deploy) + icons; installable, with iPad safe-area handling.
- **Stack.** Vanilla JS SPA, no build step. `app/app.js` (client), `app/data.js` (reference shows +
  taxonomy), `app/lyric.js` (rhyme engine), `app/serve.js` (Node HTTP server), `app/styles.css`.
  Deploy: `git pull && pm2 restart musical-designer`.

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
| Platform — accounts, Library, sharing, PWA, deploy | ✅ |

What's next (in dependency order):

1. **Structured line model (persist).** Today a card's libretto is a single text blob; the
   round-trip core (`seamlessToLines` / `linesToSeamless` / `serializeRows` / `mergeLineIds`) is in
   and verified lossless, but lines aren't yet *persisted* with stable ids. Persisting `card.lines`
   (lazy-migrating old cards, editor seeded from ids) is the gating refactor for revisions and
   variants. Held until revision marks need it — no point changing the saved shape early.
2. **Revisions (Final Draft-style).** *Half A:* margin asterisks + named revision sets, reusing
   snapshots as the baseline and the line model for accurate marks. *Half B:* page-stable production
   revisions (locked pages, A-pages, "print revised pages only") on the pagination engine.
3. **Variants.** Per-scene alternate takes on the line model, with "only the active variant counts
   toward board / runtime / manuscript / export" as the guardrail. No full branch/merge model.
4. **Diagnostics engine ("lint for musicals").** Once cards carry richer data, flag craft problems:
   no I Want in Act 1, protagonist silent for N minutes, three ballads in a row, antagonist with no
   number, Act 2 song-starved, orphaned reprise, act runtime imbalance. **Form-aware** (a one-act-90
   show suppresses the Act 1 finale / intermission checks). The reference library can then offer
   *comparison, not fill-in*: "your show has no Act 1 finale — here's how three reference shows
   handle that beat." A prompt to think, never a slot to fill.

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
