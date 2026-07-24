# Default Template Revision — Working Plan

*Draft for review — nothing in `data.js` changes until this doc is approved.*

The default template (the blank song cards every new musical project starts
with) was written before the reference shelf existed. This plan checks it
against an **81-show corpus spanning 1943–2026** and proposes a revision.
Corpus data + analyzers live in `corpus/` (plain .mjs, runnable with node).

---

## 1 · The corpus

**81 shows · 69 two-act · 11 one-act · 1 film · 1,484 classified songs —
including a 5-show flop control group** (see MUSICAL-BEAT-MAP.md §6).
37 Best Musical Tony winners, plus Olivier winners, the foundational Golden
Age canon, the West End mega-musicals, and two continental landmarks.

- **Fully carded shelf (15):** Fiddler · Gypsy · Newsies · DEH · Hamilton ·
  Wicked · Chicago · Legally Blonde · Little Mermaid · Hunchback · Frozen ·
  Spelling Bee · Kimberly Akimbo · Maybe Happy Ending · Hercules
- **Winners 2018–26 + picks (12):** Band's Visit · Hadestown · Moulin Rouge! ·
  A Strange Loop · The Outsiders · Schmigadoon! · Phantom · School of Rock ·
  Book of Mormon · In the Heights · The Notebook · Encanto *(film)*
- **Classic winners (15):** My Fair Lady · Sound of Music · Hello, Dolly! ·
  Cabaret · Company · A Chorus Line · Annie · Sweeney Todd · Les Mis · Rent ·
  The Producers · Hairspray · Avenue Q · Spring Awakening · Fun Home
- **Definitive round (20):** *Golden Age* — Oklahoma! · Carousel · Guys and
  Dolls · West Side Story · Music Man · South Pacific; *West End* — Evita ·
  JC Superstar · Miss Saigon · Blood Brothers · Matilda · Billy Elliot · Six ·
  Mamma Mia!; *Sondheim/one-acts* — Into the Woods · A Little Night Music ·
  Man of La Mancha · Come From Away; *Europe* — Elisabeth (Vienna) ·
  Notre-Dame de Paris
- **Modern family pair (2):** Mrs. Doubtfire (Broadway '21) · Paddington
  (West End '25)
- **Comedy batch + a noir (7):** Shrek · Something Rotten! · Shucked ·
  Beetlejuice · The Drowsy Chaperone · Spamalot ('05 winner) ·
  Sweet Smell of Success (Hamlisch '02)
- **Flop control group (5):** Merrily '81 · Chess · Carrie · Big ·
  Bonnie & Clyde — *plus* **intimate wing (5):** Next to Normal · Little Shop ·
  The Last Five Years · Falsettos · Once ('12 winner)

Data-only shows = song list, act, function, voicing class, ballpark minutes.
Function tags are editorial; positions on the song-minute timeline (shelf
shows: full card timeline).

---

## 2 · Findings

### ⭐ Act balance: era and region both matter

| Slice | n | A1:A2 ratio | A1 share |
|---|---|---|---|
| All two-act | 69 | 1.33 | **58%** |
| Pre-1990 | 28 | **1.44** | **60%** |
| 1990+ | 40 | 1.25 | 56% |
| Broadway tradition | 56 | **1.36** | **58%** |
| **West End tradition** | 10 | **1.16** | **54%** |
| Continental Europe | 2 | 1.22 | 54% |

The corpus's newest pair (both encoded from album/stage number lists):
**Mrs. Doubtfire (Broadway '21) runs 52%** (9/8 — a thoroughly modern flat
comedy whose act break, *Rockin' Now*, sits right on the midpoint cliff) and
**Paddington (West End '25) runs 56%** (12/10) — both on the modern flat
profile, evidence the 21st-century floor holds across traditions.

Two independent axes: **older shows frontload harder** (the classic 60%+
interval), and **the British tradition runs flat** — sung-through pop-opera
(Evita 50%, JCS 49%, Blood Brothers 51%) has no book to frontload, and even
British book shows sit level (Matilda is actually A2-heavy at 45%). The
frontloaded Act One is specifically an **American book-musical** trait; the
modern era's flattening is partly British influence on the form. **The
template's 58% break = the all-corpus mean exactly.**

### Function placement (avg position, 1,126 songs)

```
opening 4% · iwant 18% · charm 37% · villain 44% · comedy 46% ·
love 49% · production 49% · anthem 51% · act finale 54% · ballad 58% ·
drive 58% · soliloquy 60% · reprise 64% · eleven 88% · finale ultimo 97%
```

- **Absolutes at full scale:** opening 56/56 A1 · act finale 50/50 A1 ·
  eleven 44/44 A2 · finale ultimo 59/59 A2 · I Want 47/48 A1.
- **Comedy at 46%, leads only the Break-Into-Two window** — the fun begins in
  the new world. (Golden Age patter is the early exception.)
- **Love at the midpoint** (49%), late 2A near the break.
- **Soliloquy softened to 2:1 A2** (21 vs 11): the classics added A1
  **character-engine soliloquies** (*Soliloquy*, *Epiphany*, *Lonely Room*,
  *Heaven on Their Minds*). A2 soliloquies remain the dark-night reckonings.
- Charm skews A1 (85/27); ballad (50/72), drive (33/50), reprise (13/42) skew
  A2 — cost, reckoning, callbacks.

### Song length (corpus avg vs template v2)

| Function | Corpus | v2 | | Function | Corpus | v2 |
|---|---|---|---|---|---|---|
| Opening | 4.1 | 4 | | Reprise | **1.7** | 1.5 |
| Comedy | 3.0 | 3 | | Drive | 2.9 | 2.5 |
| Villain | 2.8 | 2.5 | | Eleven | 4.1 | 4 |
| I Want | 3.4 | 3.5 | | Ballad | 3.2 | 3 / 3.5 |
| Love | 3.3 | 3.5 | | Finale ultimo | 3.0 | 3 |

Every slot within 0.4 of the corpus average.

### Voicing — the determinism at n=1,126

| Function | Corpus pattern | Prefill |
|---|---|---|
| Soliloquy | **32 of 32 solo** — still perfect | `Solo` |
| Finale Ultimo | **56 of 59 company** (the exceptions in §5) | `Company` |
| Opening | 47 group; the 4 solos are all *narrator* openings (§5) | `Company` |
| Love | 10 solos in 80 — 59 duets (solo rule in §5) | `Duet` |
| Eleven | 29 of 44 solo | `Solo` |
| I Want | 39 of 48 solo | `Solo` |
| Production | **121 of 133 group** | `Company` |
| Act Finale | 36 of 50 group (solo minority in §5) | `Company` |
| Charm · Ballad · Comedy · Villain · Drive · Reprise | genuinely mixed | blank |

### Book scaffold

Every carded reference show interleaves **scene cards (5–16)** and **beat
cards (10–40)**; max consecutive-song runs are 1–2 for book musicals. The
Prose template seeds chapters + beats; the musical template drops naked songs
on the board with no book at all.

---

## 3 · Proposed template (v2)

16 songs · 9/7 act split · intermission at ~58% (the corpus mean; classic
norm 61%, modern 55%, West End 54%) · lane shape 3/6/4/3. Comedy opens 2A.

```
── Act 1 · lane 1 — establish world, voice, first hook ──────────
  opening   4     Company
  charm     3
  iwant     3.5   Solo

── Act 2A — the new world: fun → threat → the act-break drive ───
  comedy    3                    (the fun-and-games opener)
  villain   2.5
  production 4    Company        (the To Life / 96,000 slot)
  love      3.5   Duet           (late 2A, near the break)
  ballad    3
  finale    4.5   Company

════ INTERMISSION at ~58% (31 of 53 min) ════════════════════════

── Act 2B — regroup → cost mounts → late-act drive ──────────────
  reprise   1.5
  drive     2.5                  (Plot — the Act-2 workhorse)
  ballad    3.5
  production 4.5  Company

── Act 3 — reckoning → climax → resolution ──────────────────────
  soliloquy 3     Solo
  eleven    4     Solo
  finaleultimo 3  Company
```

### As code (drop-in `DEFAULT_TEMPLATE`)

```js
const DEFAULT_TEMPLATE = [
  // ── Act 1: establish world, voice, first hook ───────────────────
  { act: '1',  type: 'song', title: '', fn: 'opening',   voicing: 'Company', min: 4   },
  { act: '1',  type: 'song', title: '', fn: 'charm',     voicing: '',        min: 3   },
  { act: '1',  type: 'song', title: '', fn: 'iwant',     voicing: 'Solo',    min: 3.5 },
  // ── Act 2A: the new world — fun → threat → act-break drive ──────
  { act: '2A', type: 'song', title: '', fn: 'comedy',     voicing: '',        min: 3   },
  { act: '2A', type: 'song', title: '', fn: 'villain',    voicing: '',        min: 2.5 },
  { act: '2A', type: 'song', title: '', fn: 'production', voicing: 'Company', min: 4   },
  { act: '2A', type: 'song', title: '', fn: 'love',       voicing: 'Duet',    min: 3.5 },
  { act: '2A', type: 'song', title: '', fn: 'ballad',     voicing: '',        min: 3   },
  { act: '2A', type: 'song', title: '', fn: 'finale',     voicing: 'Company', min: 4.5 },
  // ── Act 2B: regroup → cost mounts → late-act drive ──────────────
  { act: '2B', type: 'song', title: '', fn: 'reprise',    voicing: '',        min: 1.5 },
  { act: '2B', type: 'song', title: '', fn: 'drive',      voicing: '',        min: 2.5 },
  { act: '2B', type: 'song', title: '', fn: 'ballad',     voicing: '',        min: 3.5 },
  { act: '2B', type: 'song', title: '', fn: 'production', voicing: 'Company', min: 4.5 },
  // ── Act 3: reckoning → climax → resolution ──────────────────────
  { act: '3',  type: 'song', title: '', fn: 'soliloquy',    voicing: 'Solo',    min: 3   },
  { act: '3',  type: 'song', title: '', fn: 'eleven',       voicing: 'Solo',    min: 4   },
  { act: '3',  type: 'song', title: '', fn: 'finaleultimo', voicing: 'Company', min: 3   },
];
```

---

## 4 · Optional add-on: scene-card scaffold

Seed ~2 blank scene cards per lane (7–8 total, the corpus median for book
musicals) so a new project opens with the song/book alternation visible —
mirroring how the Prose template seeds chapters.

```
lane 1:  SCENE → opening → charm → SCENE → iwant
lane 2A: SCENE → comedy → villain → production → SCENE → love → ballad → finale
lane 2B: SCENE → reprise → drive → SCENE → ballad → production
lane 3:  SCENE → soliloquy → eleven → finaleultimo
```

Open questions:
- [ ] Scenes only, or scene + one blank beat each (Prose-style)?
- [ ] Blank titles, or light prompts? (MUSICAL-BEAT-MAP.md §7 proposes
      beat-name prompts at their measured positions: "Ordinary world,"
      "Catalyst," "Break into two," "All is lost," "Dark night.")
- [ ] Or skip the scaffold entirely and keep the template songs-only?

---

## 5 · Variations the corpus surfaced (notes, not template slots)

- **The solo love song means love not yet (or never) secured.** All 10 solos
  in 80 are yearning, courtship, or idealization — *Maria*, *Music of the
  Night*, *Dulcinea*, *I Don't Know How to Love Him*, *I'm Not Saying a
  Word*, *Some Enchanted Evening*, *On the Street Where You Live*. No settled
  mutual love is ever sung solo; mutuality gets a duet.
- **The solo opening is the narrator opening.** All 4 solo openings in 56 are
  narrator/thesis figures: *Why Can't the English?* (Higgins), *Oh, What a
  Beautiful Mornin'* (Curly), *Marilyn Monroe* (Mrs Johnstone), *Le temps des
  cathédrales* (Gringoire). Company sets a world; a soloist sets a *frame*.
- **The solo act finale is the intimate curtain** (10 of 50): *Climb Ev'ry
  Mountain*, *Marry Me a Little*, *There's a Fine, Fine Line*, *I'd Give My
  Life for You*, the *Some Enchanted Evening* reprise.
- **Carousel's act finale IS a soliloquy** — the mirror moment sung alone at
  the curtain (*Soliloquy*, 7.5 min). One show, but a landmark shape.
- **Into the Woods' *Ever After* is the fake finale ultimo** — an act finale
  masquerading as an ending. The deconstruction shape.
- **Evita's *Lament* is the corpus's only solo finale ultimo** — the tragic-
  diva exception to 56-of-59 company endings (Saigon and Elisabeth end on
  duets, the other two exceptions).
- **Dual I Want: 8 shows** — Newsies, Hamilton, BoM, ITH, The Notebook,
  Avenue Q, Music Man, Mamma Mia!. Two-lead shows give each lead their own.
- **The anthem is the "resolve" number** (19 in 62, avg 51%): *The Impossible
  Dream*, *Don't Cry for Me Argentina*, *You'll Never Walk Alone*, *Tomorrow*,
  *Do You Hear the People Sing?*, *Seasons of Love*, *I Believe*. A known
  swap for a drive slot in conviction-driven shows.
- **Cold-open on the I Want** — Annie, Spring Awakening, Mamma Mia!. The want
  before the world.
- **One-acts have no consistent shape** (n=11, A1 share 39–59%).
- **The inverted I Want** — *Show Off* ("I don't wanna show off no more") and
  Big's *I Want to Go Home*: the want stated as a refusal, still sitting in
  the I Want slot. The position is the function; the polarity is free.
- **The Last Five Years is the chiasmus made literal** — fourteen alternating
  solos and exactly ONE duet, at the crossing point of the two timelines
  (*The Next Ten Minutes*, the wedding, dead center). The nucleus as a form.
- **Next to Normal's villain is a ghost** — *I'm Alive* is a villain number
  sung by grief itself. The function taxonomy holds even when the antagonist
  isn't a person.
- **Structure doesn't predict success** — the flop control group conforms to
  the corpus map as well as the hits do (MUSICAL-BEAT-MAP.md §6). This
  template is a grammar, not a guarantee; deviation should be a choice, not
  an accident. That's all it promises.
- **Writing British?** Flatten the split toward 54% and consider the
  sung-through's even act balance; the 9/7 template split is the American
  book-musical shape.

---

## 6 · Decisions

- [x] **§3 template v2** — **SHIPPED** (2026-07-23). `DEFAULT_TEMPLATE` in
      `app/data.js` is the 16-song v2: 9/7 split, lane shape 3/6/4/3, break at
      58.5% (31 of 53 min). Seeds new projects only — no migration.
- [x] **Voicing prefills** — **SHIPPED**. Company/Solo/Duet prefills kept exactly
      as §3 (opening/production/finale/finaleultimo = Company, iwant/soliloquy/
      eleven = Solo, love = Duet; the mixed functions stay blank).
- [ ] **§4 scene scaffold** — **DEFERRED**. Template stays songs-only for now;
      the scene/beat scaffold is not seeded (open questions in §4 unresolved).
- [ ] Anything the corpus missed?

*Scope note: `DEFAULT_TEMPLATE` only seeds newly created projects — existing
projects don't move. No migration needed.*
