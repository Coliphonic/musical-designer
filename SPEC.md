# Musical Designer — Spec

An app for **writing musicals** — not plays or screenplays. A musical's songs *are* its
structure, so the tool is built around **song spotting** (deciding where a song happens and
why) rather than around scenes and dialogue.

Chosen direction: **The Song Plot** — an interactive number list / running order with a
diagnostic engine, a reference/template library, and an embedded lyric-craft bench.

> **Vision update (2026-06-23).** The original spec scoped a single-user *song-plot board* —
> a diagnostic surface for spotting numbers. In use it grew into a full **writing
> environment**: the board is still the hinge, but it now feeds a paginated **Manuscript** view
> that produces real Final-Draft-formatted libretto pages, a **Characters** registry, and
> **Title pages** — so a writer can go from spotting a number to a printable script in one tool.
> It also became a **deployed, multi-user web app** (accounts, a Library of shows with folders &
> archiving, async sharing). The song-plot vision is intact and load-bearing; what changed is
> that the app no longer stops at the board. The page model is now **Board · Title pages ·
> Manuscript · Characters · Export**, plus a **Library**. See §6b (Manuscript), §6c (Characters /
> Title pages), and §12 (Platform) for the surfaces the original spec didn't anticipate.

---

## 1. Core principle

> A character speaks until speech can't hold the emotion anymore, then they sing; and sings
> until singing can't hold it, then they dance.

The app exists to help a writer decide *where the show sings* and *why*, then keep the whole
score balanced in pace, voice, and key.

---

## 2. Architecture — three layers off one hinge

Everything hangs off a single object, the **Song Card**. At the macro scale it's a tile on the
plot board; opened up, it's a lyric workspace. The reference library feeds both scales; the
diagnostics engine reads across all of them.

```
            ┌─────────────────── Reference & template library ───────────────────┐
            │   scaffolds · digitized song plots · contour overlays · taxonomy    │
            └───────────────┬─────────────────┬─────────────────┬─────────────────┘
                            ▼                 ▼                 ▼
        ┌── Macro · plot board ──┐   ┌─ The song card ─┐   ┌─ Micro · lyric bench ─┐
        │ running order + cards  │←→ │  (the hinge)    │ ←→│ scansion + meter       │
        │ energy ⇄ tension toggle│   │ function·key·   │   │ rhyme-scheme map       │
        │ drag to re-spot        │   │ purpose·motifs  │   │ prosody warnings       │
        │ character threads      │   │ status·runtime  │   │ singability flags      │
        └────────────────────────┘   └─────────────────┘   └────────────────────────┘
                            └──────── Diagnostics engine ───────┘
                            └──── Export: number list / report ──┘
```

Two load-bearing design decisions:

- **The Lyric lives *inside* the Card, not beside it.** `energy`/`tempo` on the card front and
  the scanned lyric lines inside are the same object at two zoom levels. A prosody fix in the
  bench updates the card's singability flag, which the diagnostics engine then reads.
- **ReferenceShows are just Shows with a `readonly` flag.** Digitizing a canonical musical uses
  the same schema as the user's own draft, so "overlay a reference contour" is free once the
  board exists, and templates are just Shows with empty cards.

---

## 3. The dual contour (REMOVED — kept here as a design learning)

> **Phase 1 learning (2026-06-16), confirmed removed (2026-06-23):** in real use the contour
> didn't earn its prominence for the writing task — the **cards are what matters**. It was first
> demoted to an optional toggle, then **removed entirely** from the live app: there is no curve,
> divergence band, or toggle. The `energy` / `tension` *fields* have been **deprecated and removed** from the data model
> (2026-06-23): stripped from templates, reference data, the seed show, and the model functions.
> Legacy show files on the server that still carry these keys will have them silently dropped on
> next save. If a contour view returns in future it will need fresh data entry. The cards-first board with per-card **% through the story** is the primary
> surface. See §6a. The original idea is preserved below because the *reasoning* (the gap between
> the curves is the real signal) is still sound and may feed a future diagnostics view.

The original concept: the plot board draws a curve across the show. A toggle switches the axis:

- **Energy / tempo** — ballad vs. barn-burner.
- **Dramatic tension** — stakes rising.

The insight is **the gap between the two curves**:

- High tension + low energy = the quiet devastating number (whole house holds its breath).
- High energy + low tension = pure entertainment / release valve.
- All-convergence = mechanical; no-convergence = the audience never rests.

A third view shades the **divergence band** between the curves and labels what kind of moment
each song is.

---

## 4. The song-function taxonomy (the app's vocabulary)

Shipped as an editable library so writers can add their own. Starter set:

| Function | Job | Example |
|---|---|---|
| Opening Number | Sets tone, world, "rules" of the show | *Tradition* |
| I Want | Protagonist's yearning; engine of the show | *Part of Your World* |
| Charm Song | Light; makes us fall for a character | *My Favorite Things* |
| Conditional Love ("If") | Circling falling in love without admitting it | *If I Loved You* |
| Production Number | Big ensemble spectacle, mid-act lift | *Hello, Dolly!* |
| Soliloquy | Internal decision in real time | *Soliloquy* (Carousel) |
| Act 1 Finale | Raise stakes, cliffhanger into intermission | *One Day More* |
| 11 O'Clock Number | Late-show showstopper; emotional peak | *Rose's Turn* |
| Reprise | A melody returns, recontextualized | — |
| Finale Ultimo | Resolution; weaves themes back | — |

Modifiers: patter, anthem, want-vs-need, musical scene (number carrying dialogue/action).

---

## 5. Data model

| Entity | Holds | Powers |
|---|---|---|
| **Show** | `form` (two-act \| one-act-90), acts, runtime target, intermission point | act-balance + clock diagnostics (form-aware) |
| **Card** | `type` (song \| beat), act, title, runtime, derived `pct` | unifies songs + beats in the running order |
| **Song Card** | (a Card) + function, characters[], voicing, tempo, key/mode, style, diegetic?, dramatic purpose, status, `energy`, `tension`, `reprise_of`, button type | the hinge — everything |
| **Beat Card** | (a Card) + note | non-song book scene / dramatic beat between numbers |
| **Character** | vocal range, want, need, musical style | threads, vocal-load, want/need arc |
| **Motif** | name, meaning-states[], appearances[] | reprise arcs, counterpoint |
| **Lyric** *(inside a Card)* | sections, lines w/ syllable + stress data, rhyme scheme | the lyric bench |
| **Beat** *(book outline)* | scene, tension, song-flag | spotting mode |
| **ReferenceShow / Template** | digitized song plot / ordered function slots | reference library |

Card statuses: `idea → lyric draft → music draft → demo → locked`.

---

## 6a. Cards-first board (primary surface, from Phase 1 use)

- **Two card types**: **song** cards (function pill, voicing, energy/tension, runtime) and
  **beat** cards (non-song book scenes / dramatic beats — dashed, neutral, with a note). Beats
  interleave freely with songs in the running order.
- **% through the story** on every card — weighted by cumulative runtime (a card halfway through
  the show's minutes reads ~50%; one dropped between the 20% and 30% cards lands ~25%). Beat
  cards carry a short default duration so they participate. Recomputes live on add/move/reorder.
  (Open question: runtime-weighted vs. pure even-spacing-by-count — went with runtime-weighted.)
- **Add affordances** — a `+` in the gap between any two cards inserts a song or beat there.
- **Double-click to rename**; drag to reorder. Deeper field editing is Phase 2.
- **Act-lane board** (Save the Cat-style) — each act is a horizontal lane with a vertical act
  label; cards tile left-to-right and wrap within the lane. **Two-axis drag**: sideways = reorder
  within an act; into another lane = change the card's act (running order + % recompute). Add tile
  per lane inserts a song/beat into that act. (Superseded the horizontal rail + vertical-list.)
- **Fixed 3-act spine, always 4 lanes**: Act 1 · Act 2A · Act 2B · Act 3. The marker between 2A
  and 2B is the **Intermission** in *Full length* mode or the **Midpoint** in *One-act (90)* mode
  (a `Length` toggle; maps to `Show.form` two-act vs one-act-90). Seed shows auto-map their
  musical acts onto the spine so the **2A│2B divide lands on the show's real intermission**, with
  Break-into-2 (~first 30% of Act 1) and Break-into-3 (~last 20% of Act 2) as the sub-cuts.
  `card.act` now holds a lane key (`'1' | '2A' | '2B' | '3'`).
- **View filter**: *Full story* (songs + beats) vs *Songs only* (just the numbers, e.g. 16 for
  Newsies). Percentages stay full-story-relative in both views; inserting a beat auto-switches to
  Full story so it's visible.

## 6b. Manuscript — the libretto view (added Phase 2, not in original spec)

The board says *where* the show sings; the **Manuscript** is where the book and lyrics are
actually written and read as a script. Every Card's content (dialogue for beats, lyrics for
songs) flows into one continuous, paginated document.

- **Two modes.** *Edit* (default) — a dark-friendly continuous editor where each card is a
  section under a divider (◆ scene · ♪ song · ● beat). *Print View* — paginated 8.5×11" white
  sheets laid out to **Final Draft conventions** (character cue at 3.0", dialogue/lyric margins,
  12pt Courier Prime, 6 lines/inch), ready to print or export to PDF.
- **Outline navigator** (Edit only) — a left panel listing every card grouped by act lane; click
  a row to smooth-scroll to that card; the card nearest the top of the viewport highlights via an
  `IntersectionObserver`. Toggled from a **☰ Navigation** button in the ribbon. Hidden in Print
  View (print tokens aren't card-id-tagged — a known limitation).
- **Contextual ribbon** — a per-page toolbar directly under the top nav, shared as one `.ribbon`
  system across Board / Manuscript / Characters. Manuscript's holds Navigation · Edit/Print
  toggle · centered zoom · Print · Settings (the settings drawer opens on the right; print/settings
  sit far-right to mirror that).
- **Rich line editor** — the Tab/Enter element editor (character / dialogue / lyric / parenthetical
  / action / section) is a shared `buildRichEditor()` factory used by both the Manuscript Edit
  mode and the lyric window's Rich tab, so book and lyric editing feel identical.

## 6c. Characters & Title pages (added Phase 2)

- **Characters page** — a registry card per character (voice type, brief description, notes, and
  an auto-computed "appears in" list of the songs/scenes they're cued in). **Sync from lyrics**
  scans every card via `parseLyricLines` to discover names from cues. Powers the FD-style
  character-name autocomplete in the editor and (future) vocal-load diagnostics.
- **Title pages** — generated front matter (title, authors, contact, cast list, song list,
  settings) rendered on the same print sheets as the Manuscript, with per-block include toggles.

## 6. Views

1. **Running Order** — horizontal timeline of numbers (primary view).
2. **Energy / Tension Contour** — dual curve with divergence band (toggle).
3. **Character Threads** — swim lanes per character; reveals "the mother vanishes in Act 2."
4. **Key / Tempo Heat Strip** — catch tonal clustering.
5. **Act Balance Bars** — runtime + song count per act.

---

## 7. Reference & template library (pillar)

- **Scaffolds** — load the skeleton of a known structure (Golden Age book musical, modern
  sung-through, Disney-animated form) as a starting frame of empty function slots.
- **Comparative overlay** — ghost a famous show's contour behind your own.
- Doubles as onboarding: explore a known show's anatomy before writing a note.

### Seed set (11 shows, each teaches a distinct lesson)

Digitized files live in `reference-library/`. **High confidence** on running order, song titles,
voicing, act breaks, and function tags. Energy/tension contour values and **per-number runtime
estimates** are **interpretive** starting reads (the runtime estimate is fine to ballpark; it
feeds act-balance math). Keys / tempo (BPM) / *exact* runtimes are left **`null` ("needs
score")** — never fabricated.

| Show | Era | Teaches |
|---|---|---|
| Fiddler on the Roof | 1964 | Opening number ("Tradition") |
| Gypsy | 1959 | 11 o'clock + Act 1 finale |
| Guys and Dolls | 1950 | Classic book-musical balance |
| Chicago | 1975 | Diegetic vaudeville structure |
| The Little Mermaid | 2008 | Textbook I Want |
| Into the Woods | 1987 | Two-act contrast |
| Les Misérables | 1985 | Sung-through + counterpoint finale |
| Newsies | 2011 | Anthem + ensemble production numbers |
| Wicked | 2003 | Contemporary Act 1 finale |
| Dear Evan Hansen | 2015 | Contemporary pop, intimate scale |
| Hamilton | 2015 | Through-composed + motif density |

First digitizing batch (highest contrast, proves the format): **Fiddler** (opening) ·
**Gypsy** (11 o'clock + finale) · **Hamilton** (sung-through + motif) — ✅ done, plus **Newsies**
(contemporary anthem). Remaining 7 to digitize: Guys and Dolls, Chicago, The Little Mermaid,
Into the Woods, Les Misérables, Wicked, Dear Evan Hansen.

The reference shows render read-only in a "Reference" section of the Library. The **shipped demo
show** (a fully-worked original example with songs, beats, lyrics, and book dialogue) is
**Circuits & Sycamores** — seeded from `app/seed-shows/circuits.json` into a new user's data dir
on first boot, never overwriting live edits. It replaced Fiddler as the default landing example.

Format columns (per number): `# · Title · Function · Voicing · ~Min · Energy · Tension · Note`.
Hamilton additionally carries a **motif map** table — the template for any motif-dense show.

Known gap: no pure **soliloquy** exemplar after swapping out Carousel (Gypsy/Fiddler cover it
partially). Candidate future add: Carousel or Sweeney Todd ("Epiphany").

Later batch — **one-act / 90-minute** form (see `Show.form`): Spelling Bee, Urinetown,
tick…tick…BOOM!. Held back only because the form needs distinct diagnostics, not because of data.

---

## 8. Lyric bench (pillar)

Lives **inside** the Song Card (the lyric and the card's `energy`/`tempo` are the same object at
two zoom levels). A fix in the bench can flip the card's singability flag, which the diagnostics
engine then reads.

### Persona & priorities

Target writer = **loose pop / contemporary**, not a Sondheim-strict craftsperson. That sets the
defaults:

- **Rhyme is the headline feature**, and the bar is **perfect rhyme.** Slant/near rhyme is
  *allowed* (it's idiomatic in pop) but surfaced as a gentle, dismissible note — never an error.
- **Scansion / prosody is secondary** — present but **low-severity, quiet hints.** It must never
  nag. The wrenched-stress check stays, but as a soft suggestion, not a red flag.
- Everything is **severity-ranked and dismissible.** The tool advises; the writer decides.

### The reframe

In a musical the **melody is the meter** — the question is never "is this iambic?" but "does the
word's natural stress land on the melody's strong beat?" So the bench is an *alignment checker*
between two stress patterns (word-stress vs. beat-grid), with two modes: **no melody** (analyze
inherent rhythm; check later verses against verse 1) and **melody present** (check stress vs.
the beat grid).

### Input format (seamless, evolved from the original `@`/`~` syntax)

`parseLyricLines(text, defaultSung)` is the single source of truth — it classifies each line 1:1
and drives rendering, the syllable gutter, rhyme scheme, and the Manuscript pages. **No markup
required:** an ALL-CAPS line is a character cue; lines default to **sung** in songs / **spoken**
in beats; a trailing `(sings)` / `(spoken)` overrides the block. Legacy `@cue` / `~sung` still
parse (backward compatible). The editor surfaces this two ways: a **Fountain** tab (plain-text
main view) and a **Rich** tab (Tab/Enter element editor with section pills and parenthetical
formatting), both round-tripping the same clean format.

### The engine

Workhorse = the **CMU Pronouncing Dictionary (CMUdict)** — ~134k words in ARPAbet phonemes with
stress digits (`MUSICAL → M Y UW1 Z IH0 K AH0 L`). Ships client-side (~4MB). Vowel phonemes =
syllable count; digits = stress; the rhyme tail powers rhyme classification. One resource does
syllabification, stress, *and* rhyme.

Pipeline per line: **tokenize → dictionary lookup → syllabify + stress → (align to beat grid) →
run checks → annotate.**

### Rhyme (the priority)

Extract each line's **rhyme tail** — from the last stressed vowel to the end — and compare
phonemes:

- **Perfect** — tails match, preceding consonant differs (re·GRET / for·GET). The target.
- **Near / slant** — close but not identical. Allowed; flagged as a soft note with a one-tap
  "find a perfect rhyme instead" affordance.
- **Identity** — same sound (eye / I). Not a rhyme; flag it (even loose writers usually want to
  know).
- Track **masculine vs. feminine** (motion / devotion) and **internal** rhyme.

Plus: auto-detect the **scheme** (ABAB…) and map it; a **perfect-rhyme suggester** that, given a
target word, returns true perfect rhymes ranked ahead of slant options. The tool **reports type,
it doesn't moralize** — a streetwise character *should* rhyme loosely.

### Scansion / prosody (secondary, quiet)

- **Syllable / meter fit** — line syllable count + stress shape vs. the established pattern.
- **Prosody mismatch** — unstressed syllable of a content word on a strong beat ("FOR-ev-er").
  Kept, but as a low-severity hint for this persona.
- **Singability** — open vowels (AH, AA) sustain; closed vowels (IY, UW) and diphthongs
  (AY, OW) are hard on held/high notes; sibilants hiss when sustained. Flag a long/high note on
  a closed vowel or diphthong.

### Verse-to-verse consistency (build first — no melody needed)

Derive verse 1's syllable-and-stress template; **diff every later verse against it** (they all
sing to the same tune): "v2 line 3 is 9 syllables, v1 was 8 — won't fit." Pure string comparison
once the stress engine exists; highest value-to-effort ratio in the whole bench.

### Data model (inside a Card)

```
Lyric   sections: [ {type: verse|chorus|bridge|prechorus, lines: [Line] } ]
Line    raw text · tokens: [Word] · rhymeTail (computed) · meterTemplate: [S|w] (optional)
Word    text · pos (homograph disambiguation) · oov: bool · syllables: [Syllable]
Syllable  phonemes · lexicalStress 0|1|2 · nucleusVowel · beatStrength (when aligned) · flags[]
```

### Honest hard problems

- **Out-of-vocabulary words** (names, slang, invented) — g2p fallback, mark low-confidence, let
  the user correct, then **cache** the correction.
- **Homographs** (REcord / reCORD) — need light POS tagging to pick the right stress.
- **Monosyllable stress is contextual** — needs a function-word list + basic POS or it's noisy.
- **Don't be a scold** — every rule is breakable for effect; rank severity, allow dismiss.

### Melody input — the shaping decision

| Approach | Effort | When |
|---|---|---|
| Infer from verse 1 (no melody) | Low | Ship first |
| Tap / mark the beat grid by hand (S/w) | Low | Unlocks prosody check |
| Import MIDI / MusicXML (auto grid) | High | Much later, power feature |

### Build order within the bench

1. Stress engine (CMUdict + OOV fallback + homograph POS).
2. **Rhyme suite** — classification, scheme map, perfect-rhyme suggester (the headline).
3. Verse-to-verse consistency (no melody).
4. Manual beat-grid tap → quiet prosody + singability hints.
5. (Later) MusicXML import.

---

## 9. Diagnostics engine ("lint for musicals")

Reads structured cards and flags craft problems:

- ⚠️ No I Want song in Act 1
- ⚠️ Protagonist hasn't sung in N minutes
- ⚠️ Three ballads in a row
- ⚠️ Antagonist has no number
- ⚠️ Act 2 song-starved (the classic second-act problem)
- ⚠️ N consecutive numbers in the same key
- ⚠️ Reprise of a song that doesn't exist (orphaned reprise)
- ⚠️ Act runtime imbalance
- ✅ Each principal has at least one solo moment

**Form-aware:** diagnostics key off `Show.form`. A `one-act-90` show suppresses the Act 1 finale
and intermission-balance checks and relocates the "11 o'clock"-equivalent expectation toward the
~70-minute mark; a `two-act` show runs the full set above.

---

## 10. Backlog ideas (post-MVP)

- **Clock awareness** — real minutes axis; reason about the 11 o'clock slot, intermission math.
- **Diegetic vs. book songs** — flag tonal-convention whiplash.
- **Want/Need spine** — pin songs to the protagonist's want→need arc.
- **Counterpoint / quodlibet** — combined numbers that braid earlier motifs (act-finale weaving).
- **Key & modulation planning** — circle-of-fifths map; final-key-vs-opening relationship.
- **Transitions & buttons** — track how numbers end/hand off; flag stop-start shows.
- **Vocal load & casting** — tally vocal demand per performer; bridge to a production tool.
- **Density / form detection** — dialogue-to-song ratio; name sung-through drift.
- **Missing-song suggester** — highest-tension unsung beat → "most shows would sing here."
- **Earworm budget** — track reprise-ability of the show's big tune.
- **Audience-knowledge layer** — engineer dramatic irony per number.

---

## 11. Build phases (UI-first)

1. **Board shell** — ✅ DONE. Static cards in running order, drag-to-reorder. The make-or-break
   demo. (Originally shipped with the dual contour + divergence band; the contour was later
   **removed** once the cards proved to be what matters — see §3/§6a.)
2. **Card opens** — ✅ DONE (v6). Right-side detail drawer: edit act/function/voicing/energy/
   tension/duration/status/key/style/diegetic + the "why does this sing?" field (highlighted while
   empty; new songs open straight into it = the creation gate). Status shows as a card dot; live re-render.
3. **Lyric bench** *(pillar)* — ✅ DONE (v7). Real CMU pronouncing dictionary (135k words →
   `app/cmudict.txt`, compact rhyme-key + syllable count) powers `app/lyric.js`. In the song editor:
   live per-line syllable counts, A/B/C rhyme scheme by true perfect-rhyme grouping (love≠move),
   the **perfect-rhyme suggester** (headline; orange→none), and a verse-to-verse syllable mismatch
   flag. Quiet prosody/stress + slant-rhyme hints deferred (pop/contemporary persona). See §8.
4. **Manuscript + book** *(added; see §6b)* — ✅ DONE. Paginated FD-format libretto (Edit + Print
   View), seamless CAPS-cue input, Fountain/Rich editors, outline navigator. The vision expansion
   that turned the board into a writing environment.
5. **Characters & Title pages** *(added; see §6c)* — ✅ DONE. Character registry + sync-from-lyrics;
   generated title/front-matter pages.
6. **Reference library** *(pillar)* — 🟡 PARTIAL. 4 of 11 seed shows digitized + read-only in
   Library; scaffold-load + ghost overlay still to come.
7. **Diagnostics engine** — ⬜ TODO. Turn on the lint once cards carry real data (§9).
8. **Export** — 🟡 PARTIAL. Print/PDF via Print View done; MD running order + production report TODO.

**Protect Phases 1–2.** The original bet was "if dragging a card and watching the divergence band
breathe doesn't feel good, no amount of lint or reference data saves it." The contour lost that
bet and was cut — but the principle held: **the tactile cards-first board is the thing that has to
feel good first.** It does; everything else (Manuscript, library, diagnostics) builds on it.

---

## 12. Platform — accounts, storage, deployment (added; not in original spec)

The spec assumed a single-user local tool. It's now a deployed multi-user web app.

- **Accounts & auth.** `users.js` CLI manages `users.json` (scrypt salt:hash). Stateless
  signed-cookie sessions (`md_session` = `userId.HMAC`). Server gates `/` → `login.html` when
  unauthenticated; `/api/shows*` returns 401. Scale target: just the author + 1–2 trusted
  collaborators — file-based, no database.
- **Library & file management.** A Library page (card grid) with per-show status (draft / active /
  archived), folders, duplicate / archive / delete, and relative last-edited. Shows carry an
  `owner` userId and `collaborators[]`.
- **Sharing.** Owner-only share modal writes collaborators via `PUT /api/shows/:id/share`;
  list/get/put/delete enforce owner-or-collaborator access. Roadmap: **document-locking** ("X is
  editing") before any real-time CRDT — only 2–3 trusted editors, so locking suffices.
- **Data storage.** Shows are user *data*, not code — not git-tracked. `serve.js` reads
  `SHOWS_DIR` from env (external dir on the server) so `git pull` never collides with live data;
  demo seeds copy in only if absent. An optional `USE_REMOTE_DATA` proxy lets local dev read prod
  data through a stored prod session token (default off → sandbox data).
- **Deployment.** Live at `https://musicaldesigner.colincreates.com` (DreamCompute VPS, Ubuntu +
  Node 20, pm2). Caddy reverse-proxies :443→:8090 with auto Let's Encrypt. **PWA**: manifest +
  service worker + icons; installable, with iPad safe-area handling.
- **Chrome.** Navigation is a **top brand bar** (deep-purple identity band, centered pill nav,
  green "saved" indicator) over a per-page contextual ribbon — replacing the original left
  sidebar. See §6b for the ribbon system.
