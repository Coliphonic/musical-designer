# Design System

How Musical Designer / Plot Suite looks, and why. Written 2026-07-22 after the
board-and-cohesion redesign (commits `53f1ed7`…`7aa8985`).

The goal that drove all of it, in Colin's words: away from "vibecoded software
app," toward "artistic writing app" — but *opinionated*, not bland. Office 365
and Material are the reference points, not a flat minimal template.

---

## 1. The two layers

The single most important idea. Every surface belongs to exactly one layer.

**The shell** — top bar, ribbons, toolbars, the menus that drop out of them.
Confidently coloured. Violet in Song Plot, terracotta in Prose Plot. This is the
*binding of the book*: it frames the work and signals "app." Colour here does
real work, and fills are legitimate.

**The paper** — cards, manuscript pages, note sheets, lyric sheets, dialogs.
Quiet. Colour inside this layer is reserved for *meaning* (function families,
zone accents, the save dot), never decoration.

What ties the layers together is **typography and material logic**, not shared
colour. A colourful shell makes the paper read as paper — that contrast is the
point. A failed experiment early in this work flattened the shell into the desk;
it looked clean and lost all character. Don't repeat it.

## 2. Material vocabulary

> **Paper carries content. Ink carries metadata. Hairlines carry structure.**

- **Paper** = a surface with `background: var(--card)` and a shadow, *no border*.
  Board cards, manuscript pages, note sheets, dialogs, menus, Story DNA beats,
  character cards, lyric-bench tool zones.
- **Ink** = bare text. Letterspaced small caps for classification, plain numerals
  for figures. No chips, capsules, or filled backgrounds.
- **Hairlines** = 1px `var(--line)` rules and spines. Scene spines, list
  separators, section-head underlines, the Notes rail selection marker.

The insight that unlocked the whole redesign: spine treatments looked broken
while cards were bordered boxes, because "object = filled box with a border."
Once cards became borderless paper, a hairline reads as *structure* instead of a
broken card.

### Elevation scale

Three steps, all theme-aware variables. Never hand-write a shadow.

| Token | Use |
| --- | --- |
| `--card-shadow` | paper resting on the desk — cards, pages, sheets, zones |
| `--shadow-pop` | paper lifted — menus, popovers, pickers |
| `--shadow-modal` | paper floating — dialogs, the lyric window |
| `--scrim` | the dim behind modals (warm in light, black in dark) |

Light values are warm (`rgba(60,50,30,…)`) so shadows belong to the cream
palette; dark values are neutral black.

## 3. Typography

> **Small caps mark taxonomy and structure — never controls.**

Small caps derive their meaning from scarcity. When the board's function pills
were the only letterspaced caps on screen, they read as *classification*. Putting
caps on toggles and tabs diluted them into "generic UI text." This rule was
learned by getting it wrong and reverting.

**Gets small caps** (9.5–11px, weight 650, letter-spacing 0.14em):
- Song function + beat pills (`.pill`)
- Scene titles on ghost spines
- Story DNA beat names (SET UP WANT, MIDPOINT) and section titles
- Lyric-bench zone headers (RHYMES, DICTIONARY, DETAILS)
- Character card metadata (`23 SONGS`) and appearance acts
- Pre-existing quiet field labels (`.fl`, `.ch-label`)

**Stays mixed case:**
- Nav tab names (Board, Manuscript, Notes…)
- Every control: `Full story / Songs only`, mode segments, buttons
- Dialog titles ("Show settings") — a title is a name
- Phrase-like labels ("What if…") — caps would read strangely

Corollary: **names are mixed case, labels are small caps.**

### Fonts

| Where | Font |
| --- | --- |
| UI, titles, chrome | Bricolage Grotesque (`var(--ui-font)`) |
| Board card body text | Atkinson Hyperlegible, 12.5px / 1.23 |
| Notes body | iA Writer Duo, 13.5px / 1.6 |
| Manuscript + lyric sheets | Courier Prime (typewriter script) |
| Book export | the OFL book faces |

The UI face is **Bricolage Grotesque** — a grotesque with deliberate
irregularity, chosen over five quieter candidates (Instrument Sans, Schibsted
Grotesk, Familjen Grotesk, Space Grotesk, Epilogue) because the app should not
read as one more word processor. Self-hosted, variable 200–800 in one file per
subset, so every UI weight costs a single download. `font-optical-sizing: auto`
is on: the opsz axis gives 10px caps labels a sturdier cut than 17px numerals,
which is most of why one family covers the whole 10–17px range.

Always reference it as `var(--ui-font)`, never by name. Surfaces that sit
*inside* a typewriter or book context (manuscript divider labels, autocomplete
rows, style hints) opt back out to chrome with that variable — hard-coding the
stack is how it drifted before.

iA Writer Duo is the "typed notecard" voice, still used for the Notes page.

Board cards moved off it: Atkinson Hyperlegible (Braille Institute, OFL) is
drawn for letter distinction at small sizes, which is the working condition on
a card, and losing the monospace rhythm lets notes recede so titles and
function tags carry the scan.

**Set leading on cards as an absolute gap, not a ratio.** Atkinson has a much
larger x-height than Duo at the same nominal size, so a multiplier that suited
one opens visible gaps in the other. 12.5/1.23 leaves 2.88px between lines —
matched by eye against 13/1.22, and close to the 15.18px line box Duo gave at
11.5/1.32. That gap, not the ratio, is the thing to preserve if the size ever
changes again.

### Board type roles

The board had ten private type specs that differed by half-points nobody chose
on purpose. They collapse into five **roles** — pick the role, not the numbers:

| Role | Spec | Where |
| --- | --- | --- |
| Reading | Atkinson Hyperlegible 12.5 / 1.23 | card notes |
| Name | UI 13 / 650 / 0.015em | card titles |
| Rail | UI 11 / 650 / 0.09em caps | act labels, scene spines |
| Numeral | UI 10.5 / 600 tabular | % badges, card foot |
| Caps label | UI 10 / 650 / 0.12em | function markers, MIDPOINT and
INTERMISSION, stat keys |

Three rules keep it that way:

- **One caps voice.** Anything uppercase-and-small is the same species of thing
  — a label — so it takes one size, one weight, one tracking.
- **The two rails match.** An act label and a scene spine are both wayfinding
  down the left edge; they were 12/600 and 10.5/700, and now meet in the middle.
- **Numerals are data, not labels.** The % badge dropped from 11/650 so it stops
  outshouting the title it shares a card with.

Sizes step monotonically — 13 name, 12.5 reading, 11 rail, 10.5 numeral, 10
label — so no two roles share a size. Card titles carry 650 and a whisper of
tracking to borrow the rails' confidence, which is what lets a mixed-case title
and the small-caps marker above it read as one system. Titles stay in the UI
face: putting them in Atkinson was tried and its true-700 (there is no 600 cut)
read louder than the board wants.

### Board scaling

Cards are a fixed 218px, so more screen meant more tiny cards rather than a
more readable board. `#board` zooms in two tiers — 1.1× past 1700px, 1.2× past
2300px — so card, title, note, tag and gap all scale together. `zoom` and not
`transform`, so wrapping, drag hit-testing and scroll extents stay honest.

1.2× is a deliberate ceiling: 1.6× and 1.3× were both tried and read as a
kids' app at 1440p. Chrome (nav, ribbon, card editor) stays at UI scale — the
content wall grows, the furniture doesn't.

### CSS `zoom` and iOS text (the --msz mechanism)

iOS WebKit's `zoom` scales boxes but **not text** — glyphs render at the
author-specified size and computed font-size comes back divided by the zoom
factor (confirmed on iPadOS 26.5 with a bare test page; `-webkit-text-size-adjust`
in any value does not change it). Every zoomable document surface (manuscript
viewports, edit doc, notes doc) therefore goes through `applyDocZoom()` in
app.js: it sets `zoom` and a `--msz` custom property — 1 where the engine
scales text itself (detected once at runtime), the zoom factor where it
doesn't. The absolute font-sizes inside those subtrees are written as
`calc(Npx * var(--msz, 1))` in styles.css, so on iOS the type carries its own
scaling. Adding a new font-size inside a zoomed subtree? Wrap it in that calc.
(The board's 1.1×/1.2× tiers don't need it — they trigger at ≥1700px, wider
than any iPad viewport.)

Related iPad fix, same incident: the Edit-mode format bar used to live inside
the `.ms-body` scroller as `position: sticky` — sticky pins vertically only,
so horizontally scrolling a zoomed-in doc dragged the bar sideways. It now
sits in `.ms-edit-col`, a column above the scroller, and can't pan.

### Focus mode: the seamless Fountain feed

Focus mode (Manuscript → Edit, the ribbon's Focus toggle) hides the topbar,
manuscript toolbar, and outline via one `body.ms-focus` class. The first version
dimmed every card section to 0.35 opacity except the one the caret was in; that
tested as "reading through fog" and is gone for good — nothing in Focus dims,
ever, ever again.

In its place: the whole manuscript becomes **one continuous sheet**.
`.ms-edit-doc` itself becomes the 816px page (background, shadow); each
`.ms-card-section` goes transparent and borderless inside it, so card
boundaries dissolve instead of stacking as separate pages. The only seams left
are the dividers between cards, and in Focus they stop looking like chrome
(icon + hairline rule) and start reading as **typed Fountain markup** — the
shorthand a screenwriter would type inline: `.` scene heading, `~` song,
`=` beat, `#` act, `//` beat/logline note. Every one of these is a CSS
`::before` glyph painted over the real title text (`dv-scene`/`dv-song`/
`dv-beat` classes on the divider, an `.ms-act-marker` chrome div at act
boundaries) — never parsed text, so click-to-rename on a card's title still
works exactly as it did before.

**Typed card creation (phase 2, built):** the same three markers can also
*birth* a card. On a **blank line** in the editor, typing `.Title`, `~Title`
or `=Title` and pressing Enter spawns a scene / song / beat right after the
current card (the trigger line is removed, the current card commits, the caret
drops into the new one) — it rides the pre-existing `onSpawnCard` path that the
hidden `/song`·`/beat`·`/scene`·`/chapter` slash commands already used (those
still work, anywhere). The **blank-line guard** is load-bearing: it is the only
thing that keeps `~` meaning "sung line" mid-song — a marker only creates a card
at a block boundary, never inside content. Doubled markers are excluded by a
`(?![.~=])` lookahead so the `==highlight==` and `~~strike~~` inline markup
never misfire, and `~` is a no-op in Prose Plot (no songs). See the Enter
handler in `buildRichEditor` (search `Typed card creation`).

**Typed planning notes (`//`, same pass):** typing `//text` + Enter on any
line sets the *current* card's planning note rather than spawning anything — a
beat's Beatline (`c.note`) or a song's "why does this sing" purpose
(`c.purpose`),
routed by `planningNoteField(c)`. Both now render as an editable green logline
above the body in the manuscript (extended from the old beat-only Beatline);
scenes return `null` there (a scene's `.note` *is* its body), so `//` stays
plain text in a scene. It rides an `onNote` callback parallel to `onSpawnCard`.
Song purposes surface in the editor/Focus view only — they are **not** added to
the printed script or EPUB (that path still emits beat Beatlines alone).

**Neutral start.** Every unwritten line renders flush-left plain, whatever
element the engine *predicts* it will be — the empty-card seed, every Enter-born
row, saved empty rows, and a row backspaced empty again. The mechanism is a
`data-neutral="1"` stamp (editor-only, never persisted) with one CSS override
that outranks all the per-element indents. The caret therefore always starts at
the left margin — the typewriter feel — and a line justifies **once**, to
wherever its content actually lands: plain text jumps to the Action indent on
its 2nd character (the 1st could still be a name), a 2nd caps letter jumps to
the centered Character cue, and marker-prefixed lines (`//` `.` `=` `~` `/cmd`
`(` `[` etc., including the card-creation markers, which the live pass now also
leaves alone) *stay* left until Enter resolves them — so a typed `//note` or
`.Scene` never sits at half-page and snaps back. Inference itself is untouched;
the stamp is dropped by the same live/commit passes the moment the text
identifies (`liveInferRow` / `setLineType` / `inferRow`).

The element picker names this state **General** (Highland's term for the
unclassified line) rather than the element it's *predicted* to be — so hitting
Enter shows "General," not "Action," until the text picks a lane. It's the
first option in the dropdown; selecting it is the inverse gesture — it *un-forces*
a line you'd manually Tab/dropdown-locked, dropping the `data-man` lock and
handing the line back to inference (empty → stays General; has text → re-resolves
at once). Musical-only: Prose's element set has no such state (its **Body** is
already the flush-left catch-all), so neutral is never stamped there and the
picker keeps showing "Body."

**Enter vs. Shift+Enter — continue, gap, exit.** Three gestures, from the
Fountain fact that a plain blank line *closes* a character block:

- **Enter** on a filled line → the next line, same element (verse continues,
  dialogue continues). Enter on an *empty* line → **exit**: the empty row is a
  plain block-closing blank, so the fresh line below it lands on **General** and
  the next thing typed is Action (or a CAPS name → new Character). "Enter, Enter"
  = end the song, start what follows.
- **Shift+Enter** → an **in-block gap** (stanza / speech break): a spacer that
  keeps the block *open*, then a fresh line of the same element — so verse 2
  stays Lyrics (and a spoken block's next beat stays Dialogue) instead of falling
  to Action. Outside a character block (Action) there's no block to hold, so it's
  just a paragraph blank.

The gap is a blank row carrying `stanza` (`data-stanza="1"` in the editor). Three
places know it: `blockCtxBefore` does **not** close the block on it (so live
inference keeps verse 2 in-mode); `serializeRows` emits it as `~` — an empty
Fountain lyric marker that `classifyLyricLine` reads back as an in-block gap
keeping the current mode (not forced sung) — so it round-trips through the text
blob, not just canonical `c.lines`; and `buildBlocks` never collapses it, while
the paginator (which already prefers to split at a `blank`) uses it as the
stanza boundary. A plain blank (no `stanza`) still serializes to `""` and closes
the block, so the two blanks never get confused. Note the asymmetry: a bare `~`
is a mode-neutral gap; `~text` is still the legacy forced-sung line.

Two Focus-only interactions besides the toggle itself: the exit pill now wakes
on `touchstart` as well as `mousemove` (no hover on iPad), and pinch-to-zoom
works inside Focus — WebKit's `gesturestart`/`gesturechange`/`gestureend`
events on iPad, `ctrl`+`wheel` for a trackpad — both driving the *exact same*
`zoom` variable, clamp, `localStorage` persistence, and `applyZoom()` the
toolbar's zoom buttons use, so pinch and the buttons never disagree.

## 4. Fields and controls

> **On the desk a surface rises; on paper a field sinks.**

- **Fields** (`.fi`, `textarea.ft`, `.ch-select`, `.ch-note`) are recessed wells:
  `background: var(--bg)` with `box-shadow: inset 0 0 0 1px var(--line)` and no
  border. Focus tightens the ring to the accent (`--energy`, or the zone accent
  where one applies — rose in Rhymes, azure in Details, the character's own hue
  on Characters).
- **Buttons carry fills, never outlines.** `.pbtn.primary` takes `--energy`
  (a fill means commitment); everything else takes a tonal `--hover` ground.
  Use `--hover`, not `--btn` — `--btn` is too close in value to the tinted
  ribbons and the button disappears.
- **Chips are highlighter swatches**: a soft tint of the owning accent, 4px
  radius, no border. Hover deepens via `color-mix`.
- **Segmented controls split by layer.** On chrome, selection is a *fill*
  (board ribbon, Manuscript mode segs — untouched, still violet). On paper,
  selection is *accent ink*: hairline box, no filled thumb, small-caps label in
  the accent. A filled thumb reads as one half being raised rather than chosen.

Exception worth keeping: the lyric-window header controls (Edit | Sheet |
Manuscript →) run compact at 11px/600 mixed case as a set.

## 5. Colour

- `--energy` is the accent: violet in Song Plot, coral/terracotta in Prose Plot.
  Prose re-points the accent derivatives in one place.
- **Zone accents** in the lyric bench encode *tool kind*: rose = sound (Rhymes),
  sage = sense (Dictionary, Sections), azure = facts (Details). Chips, tabs and
  focus rings in a zone inherit its accent so the two chip clouds read as
  different tools at a glance.
- **Function families** keep their nine colours, now as *text colour only*.
- Per-character hues (`--ch-hue`) colour the count metadata and focus ring —
  as `oklch(0.52 0.11 h)` light / `oklch(0.72 0.10 h)` dark, so every hue sits
  at the same perceived darkness (fountain-pen inks). Raw `hsl(h,55%,55%)` let
  green/yellow characters shout while blues behaved — the crayon-box look.
- The Manuscript page field is warm grey `#9a948a` in light mode — warm, not
  neutral, so Manuscript belongs to the same desk as everything else. Dark mode
  already uses the app desk tone.

### The `--tn-*` shell skin

The top bar's palette (`--tn-bg`, `--tn-ink`, `--tn-muted`, `--tn-hover`,
`--tn-border`, `--tn-pill-ink`, `--tn-brand`) is declared **on `body`**, not on
`.topnav`, because the switcher menus are portalled to `body` and must read the
same skin. Four variants exist: Song light/dark, Prose light/dark. Anything that
should feel like part of the bar just uses these tokens and follows every skin
for free.

---

## 6. Working practice

**Mock on the live app before building.** Inject a `<style>` element with
`!important` rules over the real UI, screenshot, iterate, *then* implement. For
empty states, build a fixed-position overlay with sample content rather than
typing into real editors.

**Mock `!important` hides specificity conflicts.** Twice a mock looked perfect
and the real implementation silently lost to a more specific existing rule
(`.sub.note` line-height; `.ribbon .seg button` size). After implementing, always
re-read computed styles rather than trusting the mock.

**Grep for dark-mode overrides after every light-mode edit.** Four times this
session a `body.dark …` rule existed *only* to re-specify what was just removed,
leaving dark mode visibly broken while light looked right. Cases: the lyric-window
border, `.ch-kind-btn.active` (twice — plus a Prose twin), and
`body.dark .seg button.active`, which out-specifies `.modal-box .seg button.active`
at (0,3,2) vs (0,3,1).

**Verify with computed styles, in both themes, after two reloads.** Screenshots in
this environment frequently return stale compositor frames for overlays and theme
changes; scrolling or a forced repaint clears them. Also: don't cache an element
across a theme toggle (it detaches and stops inheriting `body.dark`), and don't
read colours mid-transition — the `.12s` fades return interpolated values.

**Data safety.** Never dispatch input events at, focus, or type into real editors
or contenteditables. Cosmetic CSS injection is safe. Assert a known text length
after browser work (`state.cards.find(c => c.id === 'c2')` → 1756 chars in the
seed show).

---

## 7. Deliberately not done

- **The dual energy/tension contour** stays cut. `SPEC.md` §"Design lessons"
  records why: the cards were what mattered, not the curve, and the `energy` /
  `tension` fields are gone from the data model. The surviving idea is that the
  interesting signal is *relational* (high tension + low energy = the quiet
  devastating number), which may someday feed a diagnostics view built from real
  card analysis — not a drawn curve.
- **Character-web cast chips** (`.dna-web-chip`) are still bordered pills. They
  are the same species we replaced with highlighter swatches elsewhere, but the
  seed show's web is empty so they were never actually reviewed on screen.
