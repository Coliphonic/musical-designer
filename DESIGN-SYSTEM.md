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
| UI, titles, chrome | system sans |
| Board card body text | iA Writer Duo, 11.5px / 1.32 |
| Notes body | iA Writer Duo, 13.5px / 1.6 |
| Manuscript + lyric sheets | Courier Prime (typewriter script) |
| Book export | the OFL book faces |

iA Writer Duo is the "typed notecard" voice. Line-height 1.32 on cards was tuned
deliberately — tighter reads more like a notecard, and 1.48 felt airy.

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
- Per-character hues (`--ch-hue`) colour the count metadata and focus ring.
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
