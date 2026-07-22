# Reference Novels — Prose Plot study shelf

> **Status:** BUILT and wired for the first shelf entry — *A Christmas Carol*
> lives in `app/data.js` as `NOVELS.carol` (64 cards) and renders on Prose
> Plot's Library Reference shelf. The other 9 novels in §3 are not yet carded.
> This doc is the design record for adding them without re-deriving the format.
>
> **Scope:** Prose Plot only (`state.format === 'prose'`). The Song Plot
> reference library (the 10 musicals in `data.js` `SHOWS`) is untouched; per
> SPEC §"Library is fully partitioned per app," this is a separate `NOVELS`
> shelf on Prose Plot's Library page, not a filtered view of the same list.

---

## 1. The idea

Reference Novels are to Prose Plot what Reference Shows are to Song Plot: a
**bookshelf, not a template machine.** You read a proven novel as a study
object — its chapters, POV strategy, structural spine, and beat scaffold laid
out on the same board + manuscript surfaces as your own draft — to learn a
master's anatomy, not to copy its slots. Scaffold-load (dropping into
pre-labeled empty slots) stays deliberately **not** a feature.

Each reference novel is read-only (`readonly` flag) and carries a **`teaches`**
hook surfaced on its Library card and as a board banner, exactly like the
musicals.

### Why novels card well

The musicals worked because each had a natural card unit (the song/scene) and
one clear structural lesson. Novels need the same two things, and have them:

- **Natural card grain = the chapter** (staves for Dickens, diary entries for
  Stoker, etc.). A chapter *is* a `scene` card in Prose Plot already.
- **One `teaches` hook per book**, no two teaching the same lesson — the same
  "two shows can share a slot and teach opposite lessons" principle.

---

## 2. Format: how a novel card differs from a musical card

The reference-novel entry reuses the `data.js` `SHOWS` shape but adapts four
fields for prose. These are the **design decisions to ratify** when building:

| Field | Musical (Song Plot) | Novel (Prose Plot) |
|---|---|---|
| `scene` card | Scene heading | **Chapter** (already true in live Prose Plot) |
| beat function | `fn` — fixed taxonomy pill (`opening`, `iwant`, …) | **`beatFn`** — freeform typed label (already how Prose Plot beats work: `makeBeatFnPill`) |
| `min` | Runtime in **minutes** (drives board %) | **Word count in thousands** — so board % markers land where the beat sits in the book |
| runtime ballpark | `min` on song cards | **`words`** on chapter scene cards — the prose analogue of a song's runtime |
| `characters[].voiceType` | Soprano / Baritone / … | **omitted** — no prose meaning; `desc` only |

### Public domain changes the "no lyrics" rule

The musicals reproduce **no lyrics** — structure only. But a pre-1929 novel is
public domain, so **beat notes may quote the actual text.** For some books the
quotes are *load-bearing*: e.g. *A Christmas Carol*'s whole mirror-moment
machinery is Scrooge's own Stave One lines quoted back at him. Post-1929 books
(Christie, Tolkien, Sachar, Flynn) stay structure-only, same as the "no lyrics"
rule.

### Five staves onto the 4-lane spine

Prose Plot uses the same 4-lane act spine as Song Plot (`1`, `2A`, `2B`, `3` —
bookends thin, middle fat). A five-part book maps cleanly by doubling up the
last lane; see the *Carol* mapping in §4.

---

## 3. The proposed shelf (10 novels)

Deliberately spread across genre, era, POV strategy, and structure type —
comedy of manners, novella, gothic, epistolary horror, bildungsroman, literary,
mystery, fantasy quest, middle grade, thriller. Ten books, ten distinct
structural lessons.

| Novel | Author | Year | PD (US)? | Teaches |
|---|---|---|:---:|---|
| Pride and Prejudice | Austen | 1813 | ✅ | Textbook **mirror moment** — Darcy's failed proposal at dead center; the back half systematically reverses the front (Bell + Wells chiasmus in one book) |
| A Christmas Carol | Dickens | 1843 | ✅ | Five-stave novella architecture; each ghost an act; full transformation charted beat by beat in ~28.5k words |
| Frankenstein | Shelley | 1818 | ✅ | Nested frame narratives — Walton wraps Victor wraps the Creature; a ring structure |
| Dracula | Stoker | 1897 | ✅ | Epistolary multi-POV — tension built from documents, no omniscient narrator to reassure you |
| Jane Eyre | Brontë | 1847 | ✅ | Setting-as-act-structure — five locations, each a distinct movement |
| The Great Gatsby | Fitzgerald | 1925 | ✅ | Nine chapters, reunion at ch. 5 = the mathematically centered midpoint; the observer-narrator |
| And Then There Were None | Christie | 1939 | ❌ | Mystery clockwork — ten setups, ten payoffs, escalating elimination rhythm |
| The Hobbit | Tolkien | 1937 | ❌ | "There and back again" — the quest chiasmus in the subtitle; episodic chapters that still escalate |
| Holes | Sachar | 1998 | ❌ | Braided timelines converging; the tightest setup/payoff economy in modern fiction |
| Gone Girl | Flynn | 2012 | ❌ | Alternating dual-POV + the mid-book reversal — the modern thriller's mirror moment as a detonation |

**Alternates / bench:** *Rebecca* (unnamed narrator, suspense-by-withholding),
*Slaughterhouse-Five* (nonlinear time as structure), *The Old Man and the Sea*
(single continuous action, no chapters — stress-tests the card model), *Beloved*
(fragmented reveal).

**Future second shelf** (once the forms earn distinct diagnostics): a
short-story exemplar, and a serialized/installment novel (*Great Expectations*).

### Extra prose-card fields worth surfacing

The musicals carried `voicing` and runtime. Novel cards could additionally
carry, per beat or chapter:

- **POV** (whose head / narrator stance) — the load-bearing novel variable
- **Timeline position** (for braided/nonlinear books like *Holes*, *Gone Girl*)
- **word-count ballpark** (`words` / `min`-as-thousands, above)

Same function tags apply (hook, pinch, midpoint, dark night, climax) via the
freeform `beatFn`.

---

## 4. Worked example — *A Christmas Carol*

Fully carded and **wired into `app/data.js` as `NOVELS.carol`** (the standalone
`reference-novels-poc.js` draft is superseded and deleted). 64 cards: 5 stave
scene cards + 59 beats. ~28,500 words total.

### Density rule (ratified 2026-07-10)

Reference novels card at the **discrete-dramatic-unit** level — every vision,
every named encounter its own beat. For full-length novels this lands near the
~90-card density of a writer's own starting board (`PROSE_TEMPLATE` = 30
chapters × 3 cards = 90; *Pride and Prejudice*'s 61 chapters exceed it
naturally). Shorter forms card proportionally — forcing a novella to 90 would
turn beats into paragraphs. Carol's honest maximum is 64 (~480 words/beat).
Per-stave beat counts: 13 / 11 / 14 / 12 / 9 — Stave Five's nine beats pay off
the Stave One setups one-to-one, in planted order.

### Stave → lane mapping

| Lane | Stave | ~Words | Why |
|---|---|---|---|
| `1` | One — Marley's Ghost | 5,800 | Setup + inciting incident |
| `2A` | Two — The First of the Three Spirits (Past) | 5,900 | The wound |
| `2B` | Three — The Second of the Three Spirits (Present) | 8,300 | The mirror moment (longest stave = fattest lane) |
| `3` | Four — The Last of the Spirits + Five — The End of It | 5,300 + 2,900 | Dark night → climax → denouement |

Dickens even matched the "bookends thin, middle fat" proportions on his own —
Stave Three is the longest by a wide margin.

### Structural lessons the card-out surfaces

- **The mirror moment is literal and quotable.** Scrooge's Stave One lines are
  thrown back at him *verbatim*, twice: "decrease the surplus population" at the
  Cratchit table, and "Are there no prisons? Are there no workhouses?" over
  Ignorance and Want. The book *shows* Bell's mirror-moment machinery in plain
  text — the strongest argument for the quote-the-PD-text rule.
- **Transformation is metered, not saved for the end.** First tear lands in
  Stave Two (the lonely schoolboy), barely a fifth of the way in. The change is
  paid out continuously, not detonated at the climax.
- **Setups pay off in planted order.** Stave Five redeems the Stave One
  refusals *in the sequence they were planted* — the caroler, the charity
  gentlemen, Fred, and finally Bob's raise (back in the counting-house where it
  began). A clean setup/payoff-ledger teaching object.
- **Each ghost is a clean act break**, and Scrooge pressing the extinguisher-cap
  down on the Past's light is an act break rendered as a *physical gesture*.

`teaches` string:
> *Five-stave novella architecture — each ghost is an act; a complete
> transformation charted beat by beat in ~28,500 words*

---

## 5. Build record + path for the rest of the shelf

The plumbing shipped 2026-07-10 (with `NOVELS.carol` as the first entry):

1. **`app/data.js`** — `NOVELS` object, same shape as `SHOWS` with the §2 field
   adaptations, documented in a header comment above it.
2. **`app/app.js`** — `openReference` detects `NOVELS` vs `SHOWS` and sets
   `format`/`currentApp` to `'prose'`; the Library Reference shelf lists
   `NOVELS` when `state.currentApp === 'prose'`; `cardFromObj` passes through
   `beatFn` + `words`; reference chapter cards show a `~N words` subtitle;
   the board banner and show-name fallback check both maps.
3. **Verified**: board % math reads `min`-as-thousands correctly, reference
   banner + read-only apply, Manuscript/Navigator render staves + beats, Song
   Plot's shelf unaffected.

**Adding another novel is now data-only**: write the entry into `NOVELS`
following §2 and the §4 density rule, `node --check data.js`, bump `sw.js`
CACHE, verify in preview.

### Shelf progress

| Entry | Cards | Scene grain | Notes |
|---|---|---|---|
| `carol` (2026-07-10) | 64 = 5 + 59 | stave | ~28.5k words |
| `gatsby` | 90 = 9 + 81 | chapter | ~47k words |
| `pride` (2026-07-22) | 106 = 15 + 91 | **movement** | ~120.5k words |
| `holes` (2026-07-22) | 90 = 11 + 79 | **movement (timeline-labelled)** | ~47k words; post-1929, no quotes |

`holes` and `gatsby` are deliberately the same shape — 90 cards at ~47k words —
so the shelf carries a controlled comparison: one timeline versus three, same
length, same grain.

Two invariants worth keeping, both verified by script rather than eye:

- **Beat `min` values must sum to the book's word count in thousands**, and to
  the sum of the scene cards' `words`. That is what makes the board's %
  markers land where the beat actually sits in the book. Carol 28.2 = 28,200;
  Gatsby 47.0 = 47,000; P&P 120.5 = 120,500.
- **Grain scales with length, not the other way round.** Gatsby cards at ~580
  words/beat; P&P at ~1,350, because at Gatsby's density a 120k novel would
  need 210 beats. Forcing every book to one number would turn a novella's
  beats into paragraphs and a long novel's into summaries.

**Scene-card grain is per-book, and P&P set the precedent for long novels.**
Carol used staves and Gatsby used chapters because both have few, large units.
P&P's 61 chapters would mean 61 spine cards — crowding the board and pushing
beats below the discrete-unit grain — so its scene cards group by **movement**
with explicit chapter ranges (`Chapters 28–33 · Hunsford and Rosings`), which
is how the novel actually travels, house by house. Every beat names its own
chapter in the note. Expect the same for *Jane Eyre* (38 ch.), *Dracula* and
*Middlemarch*-scale books; keep chapter grain only where chapters are few.

*Holes* extends the idea: with 50 very short chapters and three interleaved
timelines, its scene cards name the **timeline** as well as the chapter range
(`Chapter 7 · Latvia, 150 Years Ago`), so reading the spine labels down the
board gives you the braid pattern at a glance. When a book's structure *is* the
lesson, put it in the scene titles.

**Rebalancing tool.** Hitting the min-sum invariant by hand is tedious and
error-prone (P&P took two correction passes). `scratchpad/rebalance.js` — kept
out of the repo — takes the entry key and a list of per-movement word targets,
scales each beat's `min` proportionally, rounds to 0.1 and pushes the residual
onto the largest beats, so relative beat weight survives and the sums land
exactly. Re-derive it if needed; the logic is six lines and the invariant is
what matters.

Keep to the standing ground rules: no build step / no deps, bump `sw.js` CACHE
on any `app.js`/`styles.css`/`index.html` change, never reproduce copyrighted
text (PD quotes only), and don't touch Song Plot's reference library.
