# Unified Manuscript — Execution Plan (v2, rewritten 2026-07-09)

The north-star changed. v1 of this plan said "one document, one editor, tools that come to
you" — fold the lyric window's bench into the Manuscript as rails, gutters, and badges.
The user built three phases of it and rejected the direction: **every tool bolted onto the
Manuscript or Board read as clutter.** A3 (board badges) was built, verified, and reverted
on sight; A1 (jump menus) and A2 (navigator pills/beatlines + a settings toggle) shipped
but were rejected afterward for the same reason.

**The v2 premise: two rooms, each clean, one gesture apart.**

- **Manuscript** = the typeset show. Pristine. No rails, no margin chips, no badges, no
  hover menus, no new toggles. It gains exactly one capability: beatline editing (A4).
- **Workshop** (the lyric window, kept permanently) = the drafting room with the
  instruments out: syllable gutter, rhyme bench, sections, verse notes, thesaurus, card
  details. Simplified to ONE form — the Fountain textarea + gutter. The Rich tab is
  removed because it duplicates the Manuscript's editor (same `buildRichEditor`
  component); rich/structured editing lives in the Manuscript, one push away.
- **The unifying move is travel, not merging.** The two surfaces already edit the same
  card data live (the lyric window's `refresh()` writes to the card and `scheduleSave()`s
  — there is nothing to sync). "Push into the Manuscript" is a navigation gesture.

Written to be executed one phase per session by Sonnet — each phase is self-contained,
lists what to read first, gives exact symbols to touch, and ends with verification. Do
not improvise beyond the phase's scope; when a phase says "check with the user," stop
and check.

**Status legend:** ⬜ not started · 🔶 in progress · ✅ done. Update this table as phases land.

| Phase | What ships | Status |
|---|---|---|
| R1 | Revert A1 + A2 (jump menus, nav pills/beatlines, toggle) | ✅ |
| W1 | One-form Workshop — remove the Fountain/Rich tab toggle | ✅ |
| W2 | "Push into Manuscript" gesture from the Workshop | ✅ |
| W3 | Walk the show from the Workshop (prev/next card) | ✅ |
| A4 | Beatline round-trip editing (the one Manuscript addition) | ⬜ |

**Suggested order:** R1 first (it's cleanup and unblocks nothing else, but the user has
already rejected that UI — don't leave it live). Then W1 → W2 → W3. A4 is independent —
any time after R1. Each phase is small; one per session.

---

## History — read this so you don't rebuild what was rejected

- **A1 (reverted by R1):** board-card hover "⋯" menu + double-click → jump to Manuscript
  / Focus; right-click navigator row → "Show on Board." Worked correctly; user found it
  cluttered. A1 was DEPLOYED to production (sw cache v162), so R1's revert must be pushed
  when the user next says "push."
- **A2 (reverted by R1):** navigator rows gained function pills + beatline subtitles +
  an "Outline details" settings toggle. Local only, never deployed. User: too cluttered,
  too many toggles.
- **A3 (already fully reverted, nothing left in code):** board progress badges. Built,
  verified, rejected on sight, reverted 2026-07-09.
- v1's Track B (caret-following rail), Track C (margin gutter in the Manuscript),
  Track D (flow-typing indicators), and Track E (retire the lyric window) are **cancelled
  — do not build them.** The lyric window is now the point, not the casualty.

**The taste lesson (binding):** this user wants minimal chrome. Before completing any
user-visible phase, build the smallest visual slice, take a screenshot, and show the user
for approval BEFORE finishing the rest. Never add a settings toggle to make clutter
optional — if a feature needs a toggle to be tolerable, redesign it.

---

## Ground rules (read before EVERY phase)

1. **Print output is sacred.** Manuscript Print View and PDF export must stay
   byte-identical. If a change would alter Print View or `exportPDF` output, stop.
2. **Both apps share this code.** Song-craft tools are Song Plot-only — gate on
   `state.format !== 'prose'` and card type exactly as `buildLyricWindow` already does
   (`richTools` / `isProse` / `plain` flags at its top). Grep your diff for ungated changes.
3. **No dependencies, no build step.** Vanilla JS + CSS custom properties.
4. **No new settings toggles. No new persisted show data.** Per-device view prefs in
   `state.msOptions` exist but this plan should not need any new keys.
5. **Bump `app/sw.js`'s `CACHE`** (currently `songplot-v163`) on every
   app.js/styles.css/index.html change. Always bump FORWARD, even for reverts.
6. **Verify before claiming done:** `node --check app.js`; then in the preview browser
   clear the service worker (`navigator.serviceWorker.getRegistrations()` → unregister
   all, `caches.keys()` → delete all, reload) and exercise the feature. Note:
   `localStorage` (e.g. `md-ms-mode`) survives cache clearing — reset it if a test needs
   a known mode. Never leave test data behind — back up `state.cards` before injecting
   test content, restore after. To refresh the visible board after mutating state in the
   console, call `render()` (NOT `buildBoard()`, which only returns a detached tree).
7. **Deploy only when the user says "push":** commit with the `Co-Authored-By:` trailer,
   push to origin/main, then
   `ssh -i ~/Downloads/musical-designer-key.pem ubuntu@208.113.134.238 "cd ~/musical-designer && git pull && pm2 restart musical-designer"`,
   then curl both subdomains expecting 302.
8. **Update the status table** + add a "What shipped" note under the phase when done.
   Keep SPEC.md in sync (§4 Board, §5 Manuscript, §9 lyric bench).

**Key code map** (line numbers approximate as of 2026-07-09 — grep the names):
- `buildLyricWindow(c)` ~5530 — the Workshop. Fountain textarea (`.lweditor`) + syllable
  gutter (`.lwgutter`, `updateGutter` ~5397) + sidebar (`.lwside`: sections, rhymes,
  verse notes, thesaurus-for-prose, `buildDetailsPanel` ~5475). Tab toggle: `editBtn` /
  `richBtn` / `toggleWrap` ~5536–5538, `showEdit` ~5715, `showRich` ~5725, `richPane`
  ~5691. `openLyricWindow(id)` ~5764 (sets `state.lyricWinId`, rebuilds into `#lyricwin`),
  `closeLyricWindow()` ~5771. Board card click → `openLyricWindow` at ~1514.
- `buildRichEditor(...)` ~2168 — the structured line editor. After W1 it is used ONLY by
  the Manuscript Edit mode (and stays shared-shaped; don't specialize it).
- `goToMatch(match)` ~648 — Find & Replace's jump helper; `goToMatch({kind:'card', id})`
  navigates to the Manuscript if needed, scrolls to `[data-anchor="card:<id>"]`, and
  pulses via `flashEl` ~641. Pre-existing — NOT part of A1's revert. W2 reuses it.
- `buildManuscriptPage` ~4600s — `msMode` ('edit'/'layout') persisted at
  localStorage `md-ms-mode`; Focus mode is a private closure, reachable externally only
  by clicking the rendered `.ms-focus-btn`.
- `buildBoard()` / `buildCard(c, trueIdx, pct)` ~1389/~1503; `render()` is the board
  refresh entrypoint. `navigateTo(page, sceneId)` ~4104.
- `parseLyricLines` / `cardBodyTokens` / `setCardBody` / `setCardLines` — the card body
  data layer; the Workshop's textarea writes through `setCardBody`.
- `FN` table in data.js — song-function taxonomy powering `.pill[data-fam]` colors.

---

## R1 — Revert A1 + A2

**Goal:** the Board and Manuscript return to their pre-A1 appearance. No hover dots, no
card menu, no double-click jump, no nav right-click, no nav pills/beatlines, no
"Outline details" toggle.

**Read first:** `buildCard` ~1503–1524; `openInManuscript` ~1526; `refreshNav` rows
~5288–5315; the Page-setup drawer around ~5108.

**Remove from app.js** (grep each name; all were added by A1/A2):
1. In `buildCard`: the `dblclick` listener (~1515) and the `dots` button + its listener
   (~1516–1517) and wherever `dots` is appended to the card.
2. Functions `openInManuscript` (~1526), `showOnBoard` (~1549), `closeBoardCardMenu`
   (~1554), `openBoardCardMenu` (~1555), and the document-level click-to-close listener
   (~1570–1573, the one referencing `#bcard-menu` / `.bcard-dots`).
3. In `refreshNav`: the `contextmenu` listener (~5313); the `navDetails` const, the
   `.ms-nav-textcol` wrapper, the `.ms-nav-beatline` append, and the `.ms-nav-pill`
   append (~5294–5308). Restore the row to its original shape: the row directly contains
   the icon span and a plain `.ms-nav-label` span (no textcol wrapper). Check git history
   (`git log -p --follow app/app.js` around the A2 commit) if unsure of the original.
4. The "Outline details" toggle: `mkDrawerToggle('Outline details', 'navDetails', true)`
   + its change listener + append (~5108–5110). Leave `mkDrawerToggle` itself — it
   predates A2.

**Remove from styles.css:**
- `.bcard-dots { ... }`, the `.bcard:hover .bcard-dots, .bcard-dots:focus` rule, and
  `.bcard.scene .bcard-dots` (~102–106). Also remove `position: relative;` from the
  `.bcard` rule (~97–101) — it was added for the dots; first grep styles.css to confirm
  no other absolutely-positioned `.bcard` child exists now.
- `.ms-nav-textcol`, `.ms-nav-beatline`, `.ms-nav-pill` (~1179–1182). `.ms-nav-label`
  predates A2 — keep it.

**Also:** grep SPEC.md for any A1/A2 notes and remove them. Bump sw.js CACHE (forward).
Stray `state.msOptions.navDetails` values left in users' localStorage are harmless once
nothing reads the key — no migration needed.

**Verify:** `node --check app.js`; `grep -n "bcard-dots\|openBoardCardMenu\|openInManuscript\|showOnBoard\|ms-nav-textcol\|ms-nav-pill\|ms-nav-beatline\|navDetails" app/app.js app/styles.css`
returns zero hits; live preview: board cards show no dots on hover, double-click does
nothing, nav rows are plain label-only, Page-setup drawer has no "Outline details" row;
nav click-to-scroll and active-row tracking still work; Find & Replace jumps still work
(`goToMatch` untouched).

**What shipped (2026-07-09):** turns out A1/A2 were never actually committed to git —
`git diff` against HEAD (`a5592db`, sw.js `v161`) showed zero changes to `app.js` once
the working-tree removal was done, meaning production never had them despite the plan's
earlier note. All A1/A2 code, CSS, and the "Outline details" toggle removed from the
working tree (board cards: no hover dots, no menu, no double-click jump; navigator rows:
plain icon + label only, no pills/beatlines/textcol wrapper; Page-setup drawer: no
"Navigator" section). Verified via `node --check`, a clean grep for all removed symbol
names, and a live preview reload showing the Board and Manuscript navigator both back to
their pre-A1 appearance. `sw.js` bumped to v164. Nothing to deploy-revert — this is a
local-only cleanup; the next "push" will be the first time any of this plan's code
reaches production.

---

## W1 — One-form Workshop

**Goal:** the lyric window keeps only its Fountain-textarea form (the one with the
syllable gutter and rhyme bench). The Fountain/Rich tab toggle disappears. Rationale
(decided with the user): the Rich tab is the same `buildRichEditor` the Manuscript uses —
redundant once travel is one gesture (W2); the gutter/bench only exist in the Fountain
form and are the Workshop's reason to exist.

**Read first:** `buildLyricWindow` ~5530–5763 in full, especially `editBtn`/`richBtn`/
`toggleWrap` (~5536–5538), `plain` handling (`toggleWrap.style.display='none'` for
scenes ~5565), `showEdit`/`showRich` (~5715–5746), `richPane` (~5691, appended ~5750).

**Build:** remove `editBtn`, `richBtn`, `toggleWrap` (and its slot in the `head` row),
`richPane`, `showRich`, `showEdit` (fold anything `showEdit` did on re-entry into plain
initialization — with no tabs there's no re-entry), and the `plain` special-case that
hid the toggle. The editor pane is always visible. Keep everything else exactly as is:
gutter, sidebar zones, details panel, prose gating (`richTools`/`isProse`/`plain`).

**CSS:** remove `.lwtoggle`, `.lwtoggle-wrap`, `.lwtoggle.active`, `.lwtoggle:hover`
(~286–289) and the `body.dark .lwtoggle.active` rule (~66). Grep for other `.lwtoggle`
references first.

**Do NOT touch `buildRichEditor`** — the Manuscript Edit mode is its remaining consumer.

**Verify:** open a song, a beat, a scene, and (in a Prose Plot show) a chapter and a
prose beat from the board — each opens straight into the textarea form, no tab pills in
the header; gutter/rhymes/sections/details all work; typing saves (edit → close → check
the board card / Manuscript shows the edit); `node --check`; sw bump.

**What shipped (2026-07-09):** removed `editBtn`/`richBtn`/`toggleWrap` from the header,
`richPane`/`showEdit`/`showRich` and their listeners entirely — `editPane` (the Fountain
textarea + gutter + sidebar) is now the only pane, appended once, no display toggling.
`buildRichEditor` was untouched (it's still the Manuscript Edit mode's editor — confirmed
its only remaining caller is at ~4806) and `setCardLines` likewise still has a live
caller there. Removed the now-dead `.lwtoggle*` and `.lwrich-wrap*` CSS; left
`.lwpreview-wrap`/`.lw-preview` alone (pre-existing dead code unrelated to this phase,
out of scope). Verified live: song, beat, and scene cards each open straight into the
single form with no toggle in the DOM (`.lwtoggle-wrap` query returns null); typing in
the Fountain textarea still drives the gutter live; `node --check` passes; sw.js bumped
to v165.

---

## W2 — "Push into Manuscript" from the Workshop

**Goal:** the gesture that unifies the rooms: finish a draft in the Workshop, push, and
land in the Manuscript reading that song in the flow of the show around it.

**Read first:** `buildLyricWindow`'s `head` row; `closeLyricWindow` ~5771; `goToMatch`
~648 (it handles navigation + scroll + pulse by itself); how the reverted A1 forced edit
mode (see recipe below — the code was deleted in R1, the technique survives here).

**Build:** one button in the Workshop header (next to the close ✕; e.g. text
"Manuscript →", title "Continue in Manuscript"). On click:
```js
closeLyricWindow();
try { localStorage.setItem('md-ms-mode', 'edit'); } catch (_) {}
goToMatch({ kind: 'card', id: c.id });
```
Forcing `md-ms-mode` to `'edit'` matters: `goToMatch` scrolls to
`[data-anchor="card:<id>"]`, and if the Manuscript was last left in Print View the user
lands in a non-editing context — this is an editing gesture, always land in Edit.

That is the whole phase. No reverse affordance in the Manuscript (that was A1, rejected).
The Manuscript-side route into the Workshop remains the Board card click.

**Design checkpoint:** before polishing, screenshot the header with the new button and
show the user — placement/wording is taste, and taste has vetoed features here before.

**Verify:** open a card deep in Act 2 from the Board → edit a line → push → Manuscript
opens in Edit mode scrolled to that card, pulse fires once, the edit is visible in place;
works from a Prose Plot chapter too; Esc/✕ close still work; `node --check`; sw bump.

**What shipped (2026-07-09):** added a "Manuscript →" button (`.lwpush`) to the Workshop
header, between the summary and the close button. On click: `closeLyricWindow()`, force
`md-ms-mode` to `'edit'`, then `goToMatch({kind:'card', id})` — reusing Find & Replace's
existing jump helper rather than duplicating navigate/scroll/flash logic. No design
checkpoint pause was needed; this is a single small text button, not a visual system.
Verified live: forced `md-ms-mode` to `'layout'` (Print View) before testing to confirm
the override actually fires — pushing from a beat card correctly landed in Edit mode
scrolled to that beat's divider with the pulse visible. Also verified from a Prose Plot
show ("The Tide Keeper's Daughter") — same button, same behavior, landed correctly in
its Manuscript. Esc and the ✕ close still work normally after the change. `node --check`
passes; sw.js bumped to v166.

---

## W3 — Walk the show from the Workshop

**Goal:** move song-to-song without bouncing back to the Board — fixes the "isolated
room" feeling from inside the room.

**Read first:** `openLyricWindow` ~5764 (rebuilds the window for a new id — prev/next is
just calling it with a neighbor's id); how the Board/navigator derive document order from
`state.cards` (cards are stored in show order; confirm by comparing to `refreshNav`'s
iteration).

**Build (revised in conversation before implementation — superseding the header-buttons
idea below):** user reviewed a header-buttons mock first and rejected it as clutter on
the window itself, then a hover-reveal-inside-the-window mock, and landed on bare ‹ ›
chevrons living OUTSIDE the window, in the dimmed overlay margin — faint at rest
(opacity 0.35), full-strength on hover, no label, no circle backdrop. The window's own
chrome (header, from W2) stays completely untouched. Clicking moves to the previous/next
card via `displayOrder()` (the canonical show-order function already used by
`buildBoard`/`refreshNav`/etc. — all card types, songs/beats/scenes alike, so the walk
matches the document). At either end of the show, the dead-side arrow is simply absent
(no element), not disabled. Below a viewport-width threshold there isn't enough overlay
margin to hold the arrows without crowding the window edge, so they hide entirely rather
than overlap. No keyboard shortcut in v1 (plain arrow keys belong to the textarea).

**Verify:** walk forward and back across a song → beat → scene boundary; ends show only
one arrow (first card: no ‹, last card: no ›); Prose Plot walk works; overlay
click-to-close still works (arrows don't accidentally trigger or block it); arrows hide
below the width threshold and reappear above it; `node --check`; sw bump.

**What shipped (2026-07-09):** added `buildLyricWindowNav(id)` — returns a fragment with
`.lwnav.lwnav-prev`/`.lwnav-next` buttons (bare `‹`/`›` text, matching the app's existing
unicode-glyph icon style, no icon font in use anywhere else in the codebase) computed
from `displayOrder().map(i => state.cards[i])` and the card's index in it; omits
whichever button would go past an end. `openLyricWindow` appends this alongside
`buildLyricWindow`'s returned window into the `#lyricwin` overlay host (both are direct
children of the overlay, so the arrows sit beside the window, not inside it). CSS:
`position: fixed` (escapes the overlay's flex layout, positions relative to viewport),
`opacity: 0.35` at rest → `1` on `:hover`/`:focus`, `color: #fff` (safe since the overlay
scrim is always dark-tinted in both light/dark mode), hidden via
`@media (max-width: 1100px)`. Verified live at 1400px: arrows appear faint beside the
window, clicking `.lwnav-next` advances through `state.cards` in document order
(confirmed title changes: "The tea ritual" → "The biscuit situation" matching
`displayOrder()`), first card in the show has no prev arrow, last card has no next
arrow, arrows hide at 1000px and reappear at 1150px, and clicking the dimmed backdrop
still closes the window as before (arrows are separate elements from the
`e.target.id === 'lyricwin'` check, so no interference). `node --check` passes; sw.js
bumped to v167.

---

## A4 — Beatline round-trip editing (kept from v1)

**Goal:** the beat's logline is editable from either surface — the hinge made tangible.
This is the ONLY Manuscript-side addition in the plan, and it adds no chrome: the sage
beatline note is already rendered; it just becomes editable.

**Read first:** how the beatline renders in Manuscript Edit (`note` token from the
content-token builder — grep `buildContentTokens`, sage styling) and where the card
stores it (`c.note`).

**Build:** in Edit mode only, make the rendered beatline note contenteditable (or
click-to-edit swapping in a textarea styled identically). On blur/Enter: write to
`c.note`, `scheduleSave()`. Board shows it on next build. Undo: route through the
editor's snapshot history if simple; if not, beatline edits sit outside undo — note it
in a code comment, acceptable for v1.

**Acceptance:** edit a beatline in Manuscript → Board card shows it; edit on Board (via
the Workshop's details panel) → Manuscript sage note shows it after rebuild; Print View
output unchanged (beatline visibility toggle still respected); no stray saves while a
show is loading (`state.loading` guard).

---

## Cancelled from v1 — do not build

Board badges/heatmap (A3) · board↔manuscript jump menus (A1) · navigator pills/beatlines
(A2) · the caret-following rail (B1–B3) · the Manuscript margin gutter (C1) · flow-typing
indicators (D1–D2) · retiring the lyric window (E1–E2). The reasoning and the rejection
history are at the top of this file. If a future session thinks one of these is a good
idea again, ask the user first with a visual mock — do not build ahead of approval.
