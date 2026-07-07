# Unified Manuscript — Execution Plan

The north-star: **one document, one editor, tools that come to you.** The Manuscript becomes
the only place text is edited; the Board becomes a pure planning lens over it; the lyric
window's bench (rhymes, syllables, thesaurus, verse checks, card details) folds into the
Manuscript as caret-following tools; typing flows Highland-style with no element switching.
The Board and Manuscript stop needing to be "connected" because there's only one place
writing happens.

Written to be executed one phase per session by any model — each phase is self-contained,
lists what to read first, and ends with verification. This is a sibling of
`BOOK-FORMATTING-PLAN.md` (Prose Plot book output); this plan is mostly Song Plot-facing
but touches shared surfaces — gating rules below.

**Status legend:** ⬜ not started · 🔶 in progress · ✅ done. Update this table as phases land.

| Phase | What ships | Status |
|---|---|---|
| A1 | Board ↔ Manuscript jumps (both directions) | ⬜ |
| A2 | Navigator enrichment — function pills + beatlines | ⬜ |
| A3 | Board progress badges (draft heatmap) | ⬜ |
| A4 | Beatline round-trip editing | ⬜ |
| B1 | Rail skeleton + card details inspector | ⬜ |
| B2 | Caret word tools — rhymes + thesaurus in rail | ⬜ |
| B3 | Verse checks, section map, stats in rail | ⬜ |
| C1 | Margin gutter — syllables + rhyme letters in Manuscript | ⬜ |
| D1 | Flow-typing — live element inference while typing | ⬜ |
| D2 | Demote explicit element controls to overrides | ⬜ |
| E1 | Board cards open Manuscript-in-Focus (lyric window optional) | ⬜ |
| E2 | Retire the lyric window | ⬜ |

**Dependency shape:** A-track phases are independent quick wins — do them in any order,
first. B1 gates B2/B3. C1 is independent but hard — schedule it after B proves the rail.
D1 gates D2. E1 needs B2+B3 (bench parity) and ideally C1; E2 needs E1 to have been lived
with. Never start E without explicit user go-ahead.

---

## Ground rules (read before EVERY phase)

1. **Print output is sacred.** Manuscript Print View and PDF export must stay
   byte-identical. Everything in this plan is Edit-mode / Board / chrome work. If a change
   would alter Print View or `exportPDF` output, stop and restructure.
2. **The lyric window keeps working until Phase E2.** Every phase before E2 must leave
   `buildLyricWindow` fully functional — the bench tools are being *copied* into the
   Manuscript, not moved. Shared helpers (e.g. `updateGutter`'s logic, rhyme suggestion)
   should be factored so both surfaces call them, not duplicated.
3. **Both apps share this code.** Song-craft tools (rhymes, syllables, verse checks,
   gutter) are Song Plot-only — gate on card type / `state.format !== 'prose'` exactly the
   way `buildLyricWindow` already does (see its `noGutter`/`isProse` handling ~5265–5400).
   Prose Plot still benefits from A-track, B1 (card details), and D (flow-typing matters
   less there but must not break). Grep your diff for ungated changes.
4. **No dependencies, no build step.** Vanilla JS + CSS custom properties.
5. **Bump `app/sw.js`'s `CACHE`** on every app.js/styles.css/index.html change.
6. **Verify before claiming done:** `node --check app.js`; then in the preview browser,
   clear the service worker (unregister via `navigator.serviceWorker.getRegistrations()`,
   delete caches, reload) and exercise the feature. Never leave test data behind — back up
   `state.cards` before injecting test cards, restore after. Prefer a throwaway show.
7. **Persistence:** per-device view options go in `state.msOptions` (localStorage
   `md-ms-opts`, see `saveMsOpts` ~4430). Show-level data changes must thread through
   `serialize()` (~280), both load paths (~190, ~242), and `exportShow`/`importShow`
   (~3865). A-track and B-track need almost no new persisted data (they *derive* from
   existing fields) — treat any urge to add new stored fields with suspicion.
8. **Deploy** only when the user says push: commit with the `Co-Authored-By:` trailer,
   push to origin/main, then
   `ssh -i ~/Downloads/musical-designer-key.pem ubuntu@208.113.134.238 "cd ~/musical-designer && git pull && pm2 restart musical-designer"`,
   then curl both subdomains expecting 302.
9. **Update this status table** + add a "what shipped" note under the phase when done.
   Keep SPEC.md's relevant sections in sync (§5 Manuscript chrome, §4 Board).

**Key code map** (line numbers approximate — grep the names):
- `buildManuscriptPage(sceneId)` ~4388 — Manuscript page: toolbar, `msMode`,
  `applyMode()`, `rebuildEdit()`, Focus mode block (`focusMode`, `applyFocus`,
  `exitFocus`, `msFocusExit` module hook), outline navigator (`refreshNav` ~5000,
  `navRows` map, IntersectionObserver active-row tracking ~5063). **Caution:** the
  `sceneId` param scopes the manuscript to one scene (per-scene export path) — the jump
  features below must instead render the FULL manuscript and scroll to the card's divider
  (`.ms-card-divider[data-card-id]`), like navigator rows already do.
- `buildBoard()` ~1389 / `buildCard(c, trueIdx, pct)` ~1277 — board lanes and cards.
  Card click opens the detail flow; card menus via `openCardMenu` ~466.
- `buildLyricWindow(c)` ~5240 / `openLyricWindow(id)` ~5474 — the full-screen editor
  being folded in. Contains: syllable gutter (`updateGutter` ~5107, `.lwgutter`,
  scroll-sync ~5422), rhyme tabs Perfect/Near (~5324), thesaurus pane (~5173, `THES`,
  lazy 9MB fetch ~5770), summary (`updateSummary` ~5123), verse note
  (`updateVerseNote` ~5137 wrapping `verseCheck` ~1466), and card details (formerly the
  board's right-side drawer, folded in at ~5389 — title/function/act/beatline editing).
- `buildRichEditor({...})` ~1907 — the SHARED line editor (lyric window Rich tab +
  Manuscript Edit). Character autocomplete on cue lines already lives here.
- `parseLyricLines(text, defaultSung)` ~1525 — single source of truth for line
  classification (seamless format: ALL-CAPS = cue, card-type default sung/spoken,
  `(sings)`/`(spoken)` overrides). Flow-typing (D) exposes this live; it does not
  replace it.
- `cardBodyTokens(c)` ~1637 — classified tokens for rendering; `countWords` strips markup.
- `lyric.js` — CMUdict rhyme machinery; `suggest(word)` ~66 powers the rhyme suggester.
  `RHYME`/cmudict loads at boot (~5764); thesaurus is lazy.
- `navigateTo(page, sceneId)` ~3836; `openManuscript(sceneId)` ~5095.
- Function pills / song taxonomy: see `buildCard` and SPEC §4's taxonomy table.

---

## Track A — Connection quick wins (independent; do these first)

### A1 — Board ↔ Manuscript jumps

**Goal:** the card becomes visibly one object seen from two pages.

**Build:**
1. **Board → Manuscript:** add "Open in Manuscript" to the card's ⋯ menu (and make
   double-click on the card body do the same). Implementation: `navigateTo('manuscript')`
   (NO sceneId — full document), then after `rebuildEdit()` completes, find
   `.ms-card-divider[data-card-id="<id>"]` and `scrollIntoView({block:'start'})`, then
   briefly pulse-highlight the divider (a CSS animation class, removed on animationend).
   You'll need a "scroll to card once built" handoff — a module-level `msPendingScrollId`
   consumed by `buildManuscriptPage` after first render is the simple pattern (mirror how
   `msFocusExit` is module-level).
2. **Variant:** "Open in Focus" menu item — same, then trigger the Focus-mode entry the
   toolbar button uses (factor its handler so both can call it).
3. **Manuscript → Board:** right-click (contextmenu) or a small ⋯ on navigator rows →
   "Show on Board": `navigateTo('board')`, scroll the card's `.bcard` into view,
   pulse-highlight it (same animation class; board cards need a `data-card-id` if they
   don't have one).

**Acceptance:** round-trip both directions on a card in Act 2B (deep in the document);
pulse fires once; Focus variant lands focused with the right card lit; Prose Plot chapters
jump the same way; no scroll jank on a long show.

### A2 — Navigator enrichment: function pills + beatlines

**Goal:** the Board's vocabulary rides along into the writing room.

**Build:** in `refreshNav` (~5000), song rows gain a small function pill (the card's
`func` — reuse the board pill's color coding via a shared CSS class, but sized for the
nav) and beat rows gain a one-line truncated beatline subtitle (`c.note`, plain text,
`title` attr for full text). Respect existing nav row layout — these are additions to
the row, not a redesign. Add a Page-setup drawer toggle "Outline details" (msOptions key,
default on) for writers who want the sparse nav back.

**Acceptance:** pills match board colors in light + dark; long beatlines truncate with
ellipsis; toggle hides both; nav active-row tracking and note sub-rows still work.

### A3 — Board progress badges (the draft heatmap)

**Goal:** the Board reflects the draft's actual state — scan lanes and see where the work is.

**Design (decided):** all badges are DERIVED at render time from existing fields — no new
stored data. Per card in `buildCard`:
- **Stub indicator:** song/beat with empty `lyrics` (or scene/chapter with empty `note`)
  gets a subtle "stub" treatment — e.g. dashed border or a hollow dot. Content = normal.
- **Length chip:** small word-count (use `countWords` on the body field — it already
  strips markup). For Prose Plot chapters this complements the existing per-card
  word-target display (~1284) — don't double-print; merge with that display.
- **Revision heat:** if any `card.lines[].lastRev === state.currentRev`, show the
  revision asterisk mark on the card (only when a revision is active).
- **Note count:** count inline note marks in the body (`NOTE_RE`-style match) — badge
  like "2 ✎" when > 0.
Keep it quiet: one small badge row, muted colors, nothing that fights the function pill.

**Acceptance:** a show with stubs + drafted cards reads as a visible heatmap at arm's
length; badges update after editing in Manuscript and returning to Board; dark mode ok;
board drag/drop unaffected; reference-library boards unaffected (read-only path).

### A4 — Beatline round-trip editing

**Goal:** the beat's logline is editable from either surface — the hinge made tangible.

**Read first:** how the beatline renders in Manuscript Edit (`note` token from
`buildContentTokens` ~2769, sage styling) and where the card stores it (`c.note`).

**Build:** in Edit mode only, make the rendered beatline note contenteditable (or
click-to-edit swapping in a textarea styled identically). On blur/Enter: write to
`c.note`, `scheduleSave()`, refresh nav (A2 shows it) and board on next build. Undo
integration: route through the same snapshot history the editor uses if simple; if not,
document that beatline edits sit outside undo (acceptable for v1 — note it in the code).

**Acceptance:** edit a beatline in Manuscript → Board card + navigator subtitle show it;
edit on Board → Manuscript sage note shows it after rebuild; Print View output unchanged
(beatline visibility toggle still respected); no stray saves while a show is loading.

---

## Track B — The rail (caret-following inspector)

### B1 — Rail skeleton + card details

**Goal:** a right-side panel in Manuscript Edit that always describes the card your caret
is in. The navigator's mirror: left = where you are in the show, right = what you're
working on.

**Design (decided):**
- Collapsible right panel, same pattern as `.ms-nav` (34px handle, state in
  localStorage `md-ms-rail`). Edit-mode only (hide in Print/title, like navBtn ~4953).
  Hidden in Focus mode's CSS *unless* Focus is where it's most useful — decision:
  **visible in Focus** (Focus dims the document, the rail is the workshop) but it fades
  like the format bar does (reuse that opacity pattern).
- Caret tracking: delegate `focusin` on the edit body (the Focus-mode dimming already
  tracks the focused `.ms-card-section` — factor that "which card owns the caret" logic
  into one shared helper both consume).
- Content v1 (card details header): card title (editable input), type icon, act, function
  pill (dropdown, songs only), status, beatline (editable textarea — reuses A4's save
  path if built; build the shared save helper here if not), word count. This is the lyric
  window's card-details block (~5389) reappearing beside the text — factor, don't fork:
  extract the lyric window's details form into a `buildCardDetails(c, opts)` component
  both surfaces render.
- On mobile-narrow widths, rail and navigator shouldn't both be open — collapse whichever
  wasn't touched last (simple width media check at toggle time).

**Acceptance:** caret moves between cards → rail follows within a beat; edits in the rail
save and reflect on Board/nav; collapse state persists; Print View untouched; lyric
window's details form still works (it's the same component now).

### B2 — Caret word tools: rhymes + thesaurus in the rail

**Goal:** the suggester comes to the word you're stuck on — no tab, no window.

**Design (decided):**
- In a song card, when the caret parks in a word (selectionchange debounce ~300ms) that
  ends a lyric line, the rail's "Rhymes" section fills with Perfect/Near suggestions for
  it (reuse `lyric.js`'s `suggest` + the Perfect/Near grouping the lyric window's tabs use
  ~5324 — factor the suggestion-list rendering into a shared function).
- Any word (double-click or caret-park) → "Synonyms" section via the thesaurus pane logic
  (~5173). Thesaurus stays lazy-loaded; the rail shows "loading thesaurus…" the same way.
- Clicking a suggestion inserts/replaces: replace the caret word (word-boundary replace in
  the line editor, preserving emphasis markup around it). If replace proves fiddly, v1 =
  click copies to clipboard + flashes "copied" — note which was shipped.
- Song cards only for rhymes; synonyms work in beats/scenes too (and in Prose Plot — this
  is the one bench tool prose wants; keep it ungated there).

**Acceptance:** park caret at a line-ending word in a song → rhymes appear grouped
Perfect/Near, matching the lyric window's suggestions for the same word; synonyms work in
a prose chapter; no suggestion churn while typing mid-line (debounce holds); CMUdict
missing-word case degrades gracefully (empty state, not error).

### B3 — Verse checks, section map, stats

**Goal:** the rest of the bench, song-scoped, live in the rail.

**Build:**
1. **Verse check list:** run `verseCheck` (~1466) on the caret card; render each finding
   as a clickable row that scrolls to + briefly highlights the offending line (findings
   reference section/line indexes — map through `parseLyricLines` to the line editor's
   DOM rows).
2. **Section map:** the song's verse/chorus structure (section tokens from
   `cardBodyTokens`) as a mini-list; click scrolls to that section within the card.
3. **Stats:** the `updateSummary` line (~5123 — sung lines · syllables · rhyme scheme)
   rendered as a small stat block. Factor `updateSummary`'s computation from its DOM so
   both surfaces share it.
All three refresh on the editor's save/commit events, not per keystroke.

**Acceptance:** a deliberately broken verse (9 syllables vs 8) shows the finding; clicking
it lands on the right line; section map matches the song's pills; stats match the lyric
window's summary for the same card; beats/scenes/prose show none of this (gated).

---

## Track C — The margin gutter (hardest single phase)

### C1 — Syllables + rhyme letters beside the active song

**Goal:** the lyric window's gutter data, rendered in the Manuscript margin for the card
your caret is in. Everything else stays clean.

**Read first:** `updateGutter` (~5107) for what's computed (per-line syllable counts,
rhyme letters, section rows); the Manuscript line editor's per-line DOM (each line is a
real element — this is what makes in-place annotation possible, unlike the old
scroll-synced twin column); Focus mode CSS.

**Design (decided):**
- Annotations attach per-line: absolutely-positioned chips in the card section's left
  margin (or right — pick left, mirroring the lyric window), one per lyric line, showing
  syllable count + rhyme letter, colored like the lyric window's scheme.
- **Active song only** (caret card, songs only, Song Plot only), and only when a new
  msOptions toggle "Craft margin" is on (default: on in Focus mode, off otherwise —
  i.e. the toggle has three states or simply: always show in Focus, toggle governs
  non-Focus Edit).
- Rhyme-letter click → highlight all lines sharing that rhyme (temporary class).
- Recompute on the editor's commit/save events and on card focus change — never per
  keystroke (syllable counting a whole song per keystroke is the perf trap; the lyric
  window recomputes on save too, ~5445).
- Layout: the manuscript column must not shift when annotations appear — margin space
  must come from existing page margins (the sheet's left margin is wide enough at
  desktop widths; at narrow widths, hide the gutter entirely rather than squeeze).

**Acceptance:** caret into a song → chips fade in beside its lines, matching the lyric
window's gutter numbers/letters exactly for the same card (write a quick console
comparison during verification); caret out → gone; zero horizontal reflow (compare
`getBoundingClientRect` of a line before/after); typing latency unchanged (no
per-keystroke recompute); Print View pixel-identical.

---

## Track D — Flow-typing (Highland-style input)

### D1 — Live element inference while typing

**Goal:** typing declares the element; classification snaps in live. The seamless format
(`parseLyricLines`) already IS this model in the data layer — D1 makes the editor show it
in real time instead of at save/re-render.

**Read first:** `buildRichEditor` (~1907) — how lines get their type on Enter, the
existing Tab/Enter behavior, character autocomplete (it already pops on cue lines);
`parseLyricLines` (~1525) including the guard that a caps line needs a preceding
blank/cue/section boundary to count as a cue (line ~1557 comment) — this guard is the
model for every inference rule.

**Design (decided — the rules):**
- Typing ALL-CAPS on an empty/action line → the line restyles as a cue *as you type*
  (once ≥2 caps chars and no lowercase), autocomplete pops as it already does on cue
  lines. Deleting back to empty reverts.
- Enter after a cue → next line is sung (song cards) / spoken (beats), as
  `parseLyricLines` would classify it. Enter on an empty line → back to action.
- **A quiet element indicator**: small muted label (e.g. "CUE · SUNG · ACTION") near the
  format bar or floating at the caret line's margin showing the current line's
  classification. Visibility ties to Edit mode; subtle, not a widget.
- **Never retroactive:** inference only classifies the line being typed. It never
  reclassifies earlier, already-committed lines as a side effect of typing elsewhere.
  A writer's explicit override (D2) always wins and sticks.
- Round-trip: whatever inference styles live must serialize to exactly what
  `parseLyricLines` reads back — the seamless format already defines the encoding; D1
  must introduce ZERO new markup.

**Acceptance:** type a cue + lyric + empty-line + action sequence with no Tab/dropdown
touches → classifications appear live and survive save/reload identically; the caps-line
guard still protects shouted lyrics mid-block; title-case names still need `@` (document
this in the indicator's tooltip); undo steps through cleanly; Prose Plot's editor
(no cues) is unaffected.

### D2 — Demote explicit element controls to overrides

**Goal:** Tab-cycling and the Element dropdown stop being the primary interface and
become the escape hatch.

**Build:** reorder/restyle the format bar so the element control reads as secondary
(smaller, end of bar). An override set via Tab/dropdown marks the line as explicitly
typed (the existing `@`/`~` forcing syntax IS the persistence for this — a forced line
serializes with its marker, exactly like Fountain's `@name`/`!action`). The element
indicator shows overridden lines distinctly (e.g. a filled vs hollow dot). Update any
onboarding/hint copy that taught Tab-first input.

**Acceptance:** an inference miss (title-case name) is correctable in one gesture and
survives re-parse; overridden lines round-trip with their forcing markers; a
mixed inferred/forced song serializes to clean seamless format with `@`/`~` only where
forced.

---

## Track E — Demote, then retire, the lyric window

**Do not start E without explicit user go-ahead.** E1 changes a core daily flow.

### E1 — Board cards open Manuscript-in-Focus

**Build:** the board card's "edit lyrics" affordance switches to: open Manuscript,
scroll to card (A1's machinery), enter Focus, open the rail. The lyric window remains
reachable (card ⋯ menu, "Open in lyric window") during the trial period. Add an
msOptions escape hatch ("Open cards in lyric window") so the user can flip back
per-device without a deploy.

**Acceptance:** the full write-a-song loop (cue, lyrics, rhyme lookup, verse check,
beatline tweak) is doable end-to-end without the lyric window; switching the option back
restores the old flow exactly.

### E2 — Retire the lyric window

Only after E1 has been the daily driver long enough that the user asks for it. Remove
`buildLyricWindow` + its CSS + the option; keep `lyric.js`, `verseCheck`, thesaurus
(they're the rail's engines now). Fountain raw-text editing survives somewhere — decide
with the user (likely a "view source" modal per the north-star). Big deletion — take a
snapshot/commit boundary seriously and update SPEC §9 (the lyric bench section) to
describe the rail instead.

---

## Suggested cadence

A1 → A2 → A3 are each small, independent, high-visibility — good first sessions (A4
medium). B1 medium, B2 medium (B2's replace-in-editor is the fiddly bit), B3 medium.
C1 is the hardest single phase — one full session, nothing else in it. D1 hard-medium,
D2 small. E1 medium, E2 small-but-scary. After every phase: verify per ground rules,
update both status tables (here + SPEC.md), deploy only on request.

North-star rationale (the "why" behind all of this) is recorded in SPEC.md §5's
unified-manuscript note and the session that produced this plan (2026-07-05): the Board
popup editor and Manuscript editor are one shared component (`buildRichEditor`) with two
rooms around it; this plan removes the second room by making the tools caret-following
instead of place-bound.
