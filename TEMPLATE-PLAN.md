# Default Template Revision — Working Plan

*Draft for review — nothing in `data.js` changes until this doc is approved.*

The default template (the blank song cards every new musical project starts
with) was written before the reference shelf existed. This plan checks it
against a corpus spanning 1943–2026 (81 shows when this plan was written; **104
now** — see §1) and proposes a revision.
Corpus data + analyzers live in `corpus/` (plain .mjs, runnable with node).

---

## 1 · The corpus

**104 shows · 77 two-act · 15 one-act · 12 film · 1,809 classified songs —
including a 5-show flop control group** (see MUSICAL-BEAT-MAP.md §6).
37 Best Musical Tony winners, plus Olivier winners, the foundational Golden
Age canon, the West End mega-musicals, and two continental landmarks.
Batch 9 (2026-08-17) added the Disney wing: seven stage shows (Beauty and
the Beast, The Lion King, Aida, Mary Poppins, Tarzan, Aladdin, Anastasia)
and eleven film musicals carded with a ' (film)' title suffix, so stage and
screen versions of one title can be read side by side in the Atlas picker
(e.g. The Little Mermaid vs The Little Mermaid (film)). Films take
form 'film' → kind 'film', which since 2026-08-17 is its own **Film** segment
in the Atlas form filter beside One-act and Full-length (it was folded into
'other' while there was only one film, Encanto). Films are never tagged
'finale' — no interval, the same reasoning as the one-act rule. The four cohort basis lines in data.js (mean, pre-1990,
1990+, West End) were refreshed to the post-batch-9 analyzer output
(77 two-act · ratio 1.32 · A1 57%).

`form` is now carried through to `ATLAS_SHOWS.kind`
('one' | 'full' | 'film' | 'other') so the Atlas can filter the three cohorts
against each other; 'other' remains the escape hatch for a form that is none of
them (a revue, a song cycle) and drops out of every side rather than padding
one. Three findings fell straight out of it: one-acts split their score
**50/50** where full-lengths front-load to **57/43** and films front-load
hardest at **63/37**; and the **act finale simply does not exist** in either a
one-act (0 of 223 songs) or a film (0 of 101) — the only function in the
taxonomy that is structurally unavailable to a form, and unavailable for the
same reason both times: no interval to hang a cliff on.

Shelf and corpus are **disjoint by design** — every consumer reads both sets,
so a show may appear in exactly one. Promoting a show from data-only to carded
means deleting its corpus row; `build-atlas-data.mjs` enforces this by refusing
any corpus row whose title is already on the shelf.

- **Fully carded shelf (16 in the corpus):** Fiddler · Gypsy · Newsies · DEH ·
  Hamilton · Wicked · Chicago · Legally Blonde · Little Mermaid · Hunchback ·
  Frozen · Spelling Bee · Kimberly Akimbo · Maybe Happy Ending · Hercules ·
  Hadestown
  *(A 17th carded show, 21 Chump Street, sits on the shelf but is deliberately
  excluded from the corpus — see §8f.)*
- **Winners 2018–26 + picks (11):** Band's Visit · Moulin Rouge! ·
  A Strange Loop · The Outsiders · Schmigadoon! · Phantom · School of Rock ·
  Book of Mormon · In the Heights · The Notebook · Encanto *(film)*
  *(Hadestown was promoted to the carded shelf on 2026-07-29.)*
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
- **One-act wing (batch 8, 5):** Once on This Island · [title of show] ·
  Ordinary Days · Ride the Cyclone — *plus* The Rocky Horror Show, which was
  requested alongside them but is **two-act** as licensed today (the 1973 Royal
  Court original ran with no interval; see the note in `corpus-batch8.mjs`).
  Added 2026-07-29 because 11 one-acts of 81 shows was too thin to filter on.

Data-only shows = song list, act, function, voicing class, ballpark minutes.
Function tags are editorial; positions on the song-minute timeline (shelf
shows: full card timeline).

---

## 2 · Findings

> **Note (2026-08-17).** The tables in this section are the analysis *as it was
> run*, at n=1,126 songs / 69 two-act shows — they are kept as the record of
> what the template revision was actually decided on. The corpus has since grown
> to 1,809 songs / 77 two-act shows (§1). The findings held: act balance moved
> 1.33 → 1.32 and the A1 share 58% → 57%, and every function's position is
> unchanged to within a couple of points. Current figures live in the `basis:`
> line of each template in `data.js`, which is regenerated from the analyzers.

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

---

## 7 · The Template Library (approved 2026-07-29)

Colin's ask: a browsable **folder of templates, like the Reference shelf** —
looked through, previewed, and built from. The single `DEFAULT_TEMPLATE`
becomes a registry of nine, each one a *measured cut* of the corpus, not a
mood. Every template cites its cohort. The existing v2 mean stays untouched as
the default.

**Bug this fixes on the way:** the new-show modal already asks Full length /
One-act, but `createProject()` ignores the answer — a new one-act currently
seeds with an act-finale card, the one function measured at **0/223 songs** in
one-acts.

### 7a · Registry

```
const TEMPLATES = [ { id, label, sub, mode: 'full'|'oneact', basis, cards } ]
```

- `label` mixed case (it's a name); `sub` = one-line blurb in the `teaches`
  voice; `basis` = the measured numbers it encodes (shown in preview banner).
- `cards` use the existing template card shape (`act`, `type:'song'`,
  `title:''`, `fn`, `voicing` prefill, `min`). Songs-only — §4 scaffold stays
  deferred.
- `DEFAULT_TEMPLATE` remains as an alias for the mean's cards (back-compat).
- Prose Plot untouched (`PROSE_TEMPLATE` as-is; templates shelf is Song Plot
  only).

### 7b · The nine (eleven since 2026-08-17 — Contemporary is 3½, Family Spectacle 7½)

Seat lists are the deliverable; minutes may shift ±0.5 at build time to hit
each cohort's measured A1 share (noted per template).

**1 · Book Musical — the mean** (`full-mean`, = shipped v2, unchanged)
16 songs · 3/6/4/3 · break 58% · the 70-two-act mean.

**2 · Golden Age** (`full-goldenage`) — pre-1990 cohort: ratio 1.42, A1 ~61%.
Frontloaded; love lands *before* the break; the curtain is a company blowout.
- 1: opening Company 4.5 · charm 3 · iwant Solo 3.5 · production Company 3.5 · charm 2.5
- 2A: comedy 3 · love Duet 3.5 · drive 2.5 · production Company 4 · finale Company 4.5
- 2B: reprise 1.5 · comedy 3.5 · ballad Solo 4 · drive 2.5
- 3: soliloquy Solo 2.5 · eleven Solo 4.5 · finaleultimo Company 3
(17 songs, 10/7, A1 share target ~61%)

**3 · Modern Pop** (`full-modern`) — 1990+ cohort: ratio 1.25, A1 ~56%.
Two I Wants (dual protagonists — Hamilton, DEH-era pattern), anthem replaces
villain, and the act ends on a **solo transformation** (Defying Gravity /
Let It Go side of the act-ender fork).
- 1: opening Company 4 · iwant Solo 3.5 · charm 3 · comedy 3
- 2A: iwant Solo 3 (the counter-want) · anthem Company 3.5 · love Duet 3.5 · drive 2.5 · finale Solo 4.5
- 2B: reprise 1.5 · comedy 3 · ballad Solo 3.5 · production Company 4
- 3: soliloquy Solo 3 · eleven Solo 4 · finaleultimo Company 3.5
(16 songs, 9/7, A1 share target ~57%)

**4 · Sung-Through** (`full-sungthrough`) — West End profile: ratio 1.16,
A1 ~54%, high reprise share. The motif system is the spine: plant → develop →
eleven as payoff (the Epic I/II/III shape); finale ultimo is a bookend reprise
of the opening (beat-map §2h).
- 1: opening Company 4 · motif Solo 1.5 (plant) · iwant Solo 3 · love Duet 3 · production Company 4
- 2A: drive Company 3.5 · villain 3 · motif Solo 1.5 (develop) · ballad 2.5 · anthem Company 4 · finale Company 4
- 2B: diegetic Company 4 (A2 opener) · reprise 1.5 · ballad Duet 3 · drive Company 3.5 · reprise 2
- 3: eleven Solo 4.5 (motif paid off) · soliloquy 3 · reprise 2 (falling mirror) · finaleultimo Company 3 (bookend)
(20 songs, 11/9, A1 share target ~54%)

**5 · Comedy** (`full-comedy`) — comedy batch cohort. Comedy leads the
break-into-two (measured, §2); the villain is comic; ONE sincere ballad;
the eleven is a **group showstopper** (the Sit Down / Rockin' the Boat
minority the Atlas field-notes call out).
- 1: opening Company 4 · iwant Solo 3.5 · charm 3 · comedy 3
- 2A: comedy Company 3.5 (the break) · villain 3 (comic) · love Duet 3 · production Company 4 · finale Company 4.5
- 2B: comedy 3 · reprise 1.5 · ballad Solo 3 (the sincere one) · drive 2.5
- 3: eleven Company 4 (showstopper) · comedy 2 (button) · finaleultimo Company 3
(16 songs, 9/7, A1 share target ~58%)

**6 · Chamber** (`full-chamber`) — intimate wing cohort (N2N, Falsettos,
Once, Little Shop): small cast, solo/duet-dominant, **no production function
at all** (its absence is the signature), ensemble-knot act ender rather than
a blowout.
- 1: opening 3 · establishing 2.5 · iwant Solo 3.5 · charm Duet 2.5 · ballad 3
- 2A: drive Duet 3 · comedy 2.5 · love Duet 3.5 · ballad Solo 3 · finale 3.5
- 2B: reprise 1.5 · drive 3 · ballad Duet 3 · comedy 2.5
- 3: soliloquy Solo 3.5 · eleven Solo 4 · finaleultimo Company 3
(17 songs, 10/7, A1 share target ~56%)

**7 · Concept / Frame** (`full-frame`) — Kander & Ebb shape (Chicago: "every
number staged as a performed act"; Cabaret). Diegetic numbers carry the frame;
the sincere numbers live *outside* it; the frame cracks in 2B and closes as a
dark bookend.
- 1: opening Company 4 (the emcee's welcome) · diegetic 3 · iwant Solo 3 · charm 3
- 2A: diegetic Company 3.5 · comedy 3 · villain 3 · love Duet 3 (outside the frame) · finale Company 4
- 2B: diegetic 3 (A2 opener) · reprise 1.5 · ballad Solo 3.5 (the frame cracks) · drive 3
- 3: eleven Solo 4 (the title number as reckoning) · reprise 2 (dark reprise of the welcome) · finaleultimo Company 2.5
(16 songs, 9/7, A1 share target ~57%)

**3½ · Contemporary Book Musical** (`full-contemporary`, added 2026-08-17) —
cut from Colin's *Book Musical — Structure Card Grid (v3)*, which encodes the
Viertel sequence (the noise, the tent pole, the candy dish, the Main Event)
over a Snyder causal chain. Every song card in that grid was tested against the
77 two-act shows; this template keeps what the corpus backs and drops what it
doesn't.

**Confirmed, and what the template is anchored on:**
- Act One finale at **54%** — the grid's card 32 hits the corpus median exactly.
  Show by show: Wicked 56%, Dear Evan Hansen 52%, Book of Mormon 50%, Hairspray
  52%, Legally Blonde 56%, In the Heights 53%, Rent 52%, Next to Normal 60%,
  Shucked 62%, The Outsiders 46%. Ten for ten inside 46–62%.
- Eleven o'clock at **~88%**, inside the measured 83–95% band.
- Dark-night soliloquy ~72% against a measured 68%.
- Act One carrying ~56% of the song minutes (1990+ cohort).

**Refuted, and therefore not claimed:** the grid presents the Act-Two "false
peak" love duet as *the big contemporary move*. It is a real shape but not a
new one — shows deferring their love song entirely to Act Two run **35%
pre-1990 against 31% from 1990 on**, slightly *down*, and four of the eleven
post-1990 cases are the Disney titles added the same day (strip them and it is
23%). Individual love songs did drift later (34% → 46% in Act Two, median 43% →
49%), but the per-show pattern the grid describes is perennial, not
generational. The love seat still sits late here because it is a good option
about a third of writers take in every era; move it into 2A for the Golden Age
placement without leaving the norm.

**Contradicted outright:** the grid's early antagonist number (card 8, ~13%)
against a villain median of 42% and a 18–78% band. The seat is kept at the top
of lane 1 because the grid's *reason* is sound — establish the opposing pole
before the threshold — and one `villain` tag may be averaging a real early
subtype away. It is the seat to distrust first.
- 1: opening Company 4 · iwant Solo 3.5 · villain 2.5 · drive 2.5
- 2A: production Company 4.5 (the noise) · charm Duet 2.5 (meet-spark) · comedy 3 (second couple) · production Company 3 (tent pole) · villain 3 (dark turn) · finale Company 4.5
- 2B: comedy Company 2.5 (candy dish) · comedy 3 · love Duet 3.5 (false peak) · soliloquy Solo 3.5 (dark night)
- 3: anthem Company 3.5 (rally) · eleven Solo 4.5 · reprise 2 · finaleultimo Company 3
(18 songs · 4/6/4/4 · 10/8 ratio 1.25 — the grid's own figure, measured 1990+
is 1.22 · 58.5 min · A1 share 56.4%, target 56%. The three-pillar density
signature is in the minutes: noise 4.5 → tent pole 3, which must not outgun the
curtain → act finale 4.5.)

**7½ · Family Spectacle** (`full-family`, added 2026-08-17 with batch 9) — the
twelve-show family-spectacle cohort: the seven batch-9 stage titles (Beauty and
the Beast, The Lion King, Aida, Mary Poppins, Tarzan, Aladdin, Anastasia) plus
the five already carded on the shelf (The Little Mermaid, Hunchback, Frozen,
Newsies, Hercules). 19.9 songs and 58.9 song-minutes per show, ratio 1.33, A1
share 58%, voicing 51% group.

Seats are the cohort's own function shares × 18 by **largest remainder**, not
hand-picked — reprise/ballad/charm/production take two each, thirteen functions
take one, and the eighteenth seat goes to `establishing` (0.38) over a second
villain (0.36). The villain keeps a guaranteed single seat: 18 of 239 songs
(7.5%) is roughly four times the all-corpus rate, but two seats would read 11%
and overshoot by more than one seat undershoots.

**No eleven o'clock seat** — 4 of 239 songs (1.7%), under a tenth of a seat.
This is the shape's signature the way zero production numbers are the chamber
template's: the late heat goes into the lane-3 reprise and production number,
not a showstopper. Every other full-length template carries an eleven.
- 1: opening Company 4 · establishing Company 2.5 · iwant Solo 3.5 · charm 2.5 · villain 3
- 2A: charm 2.5 · ballad Solo 3.5 · love Duet 3.5 · production Company 4 · finale Company 4.5
- 2B: comedy 3 · reprise 2 · drive 3 · soliloquy Solo 3.5 (the reprise lane — 2.6/show peaks here)
- 3: ballad 3.5 · production Company 4 · reprise 2 · finaleultimo Company 3.5
(18 songs — the largest in the library · 10/8 · 58 min · A1 share 57.8%,
target 58%. Lane minute-shares 27/31/20/22 against a measured 27/30/19/24;
lane 3 runs ~2 points light because the cohort's transformation sequences are
longer than a template should presume.)

**8 · One-Act — the mean** (`oneact-mean`) — the 15-one-act census (§ Atlas
2026-07-29): 14.9 songs/show, **50/50 split**, no act finale (0/223), no
villain (1/223), reprises rare (5/15 shows), charm/comedy/ballad all ~2 per
show. The 54% ballad IS the midpoint — a breath where the full-length hangs
a cliff.
- 1: opening Company 4 · charm 3 · iwant Solo 3.5 · comedy 3
- 2A: charm 3 · comedy 3 · production Company 4 · ballad Solo 3.5 (the midpoint)
- 2B: drive 3 · love Duet 3.5 · ballad 3
- 3: soliloquy Solo 3 · eleven Solo 4 · finaleultimo Company 3
(14 songs, A1 share target ~50%)

**9 · One-Act Chamber Cycle** (`oneact-cycle`) — the sung-through small-cast
one-act (The Last Five Years, Ordinary Days, A Strange Loop): 2–4 voices,
solo/duet only, "company" means everyone-you've-met. Two I Wants because the
form braids two lines; the eleven is the emotional payoff at I'll-Be-Here
scale.
- 1: opening 3 · iwant Solo 2.5 · establishing Solo 3 · iwant Solo 3 (second voice) · comedy Solo 2
- 2A: charm Solo 3 · drive Duet 3 · comedy Duet 2.5 · production 3.5 (all voices) · ballad Solo 3 (midpoint)
- 2B: charm Duet 3 · comedy Duet 3 · ballad Solo 3 · drive Solo 2
- 3: soliloquy Solo 3.5 · eleven Solo 4.5 · finaleultimo Duet 3.5
(17 songs, A1 share target ~50%)

### 7c · Surfaces

1. **New-show modal** — the length segment stays as the first choice; below
   it, a compact template select filtered by mode (Full length → the six full
   templates, mean preselected; One-act → the two one-act templates, mean
   preselected). `createProject(title, mode, templateId)`.
2. **Library shelf** — a **Templates** section between the writer's shows and
   Reference (Song Plot library only). Cards in the `libRefCard` voice: label,
   One-act/Two-act badge, song count + total song minutes, `sub` blurb.
3. **Preview** — clicking a template opens it **read-only on the board**, the
   same posture as a reference show: pseudo-show from the template's cards,
   banner shows `label · basis`, plus one CTA — **"Use this template"** — which
   opens the new-show modal with mode + template preselected. Nothing is
   created server-side until the modal's Create. In preview only, untitled
   seats display their function label (via `FN[fn].label` + voicing) so the
   board reads as a shape, not a wall of blanks; created shows still get
   `title: ''`.

### 7d · Decisions

- [x] Nine templates, seat lists above — approved 2026-07-29. **SHIPPED**
      same day (v261): `TEMPLATES` registry in data.js (full-mean aliases
      DEFAULT_TEMPLATE by reference), Templates shelf section, read-only board
      preview with seat-label pseudo-titles + "Use this template" CTA, modal
      template select filtered by length. Minutes nudged ±0.5/card to land each
      cohort's A1 share (all within 0.6 pts — table in the build record).
      Verified end-to-end: created show seeds blank titles (labels don't leak),
      one-act seeding contains no finale/villain.
- [x] Songs-only (scaffold still deferred, §4 unresolved).
- [x] Modal default remains Full length → mean; One-act pick auto-selects the
      one-act mean.
- [ ] Preview strips (mini distribution strip per template card, Atlas
      language) — phase-2 polish, not in the first build.

---

## 8 · The ten-minute wing (shipped 2026-08-09, v262)

Colin asked for a third **length**, seeded from *The 10-Minute Musical: A
Structural Field Guide (v2)* — his own craft doc, not a corpus cut. That
distinction is the governing constraint for this section: every other template
in the library cites measured numbers, and these two must not borrow that
authority. Their `basis` lines say "Field guide §2", never "n=".

### 8a · Why a mode and not just a template

`state.mode` was a two-value flag ('full' | 'oneact') that decides three things:
the board's lane divider, whether the manuscript and Fountain exports emit
`ACT ONE` / `INTERMISSION`, and the Library card's length badge. A ten-minute
piece answers all three differently from a one-act, so a template alone would
have produced a show that called its first three minutes "Act 1" and printed an
act header over a piece with no acts. Hence `MODES = ['full','oneact','ten']`
plus `normMode()`, which is now the single place an unrecognized stored mode
resolves (to 'full').

### 8b · The lane mapping

The four lanes are untouched — same keys, same drag targets, so a show can be
switched between lengths without moving a card. Only the **labels** change,
and only at this length:

| Lane | Two-act / one-act | Ten-minute | The guide's clock |
|---|---|---|---|
| `1`  | Act 1   | **Setup**      | 0:00–3:15 — cold open, Song 1, Dialogue A |
| `2A` | Act 2A  | **Collision**  | 3:15–6:00 — Song 2, Dialogue B |
| `2B` | Act 2B  | **Decision**   | 6:00–8:30 — Song 3, Dialogue C |
| `3`  | Act 3   | **Button**     | 8:30–10:00 — Song 4 |

The 2A|2B divider reads **"The turn"**, not "Midpoint": it lands at 60% of the
clock, immediately after the screw-turn and immediately before the decision
number. That is where a ten actually hinges, and calling it a midpoint would be
a lie about the form. `Intermission` (two-act) and `Midpoint` (one-act) are
unchanged.

### 8c · The two shapes

Both ship **beat cards**, the first templates in the library to do so. At this
length the spoken beats are named slots with jobs — the guide devotes a numbered
section to each — so each beat carries its slot name as the title, a one-word
`beatFn` pill, and the guide's instruction in its Beatline note.

**`ten-mean` — "Ten-Minute Musical"** · 4 songs + 4 beats · 10:00 exactly ·
7:45 sung / 2:15 spoken (the guide's "roughly 8:00 sung, 2:00 spoken"):

- Setup: `Cold open` (Image, 0:30) · **iwant Solo 2:00** · `Dialogue A` (Hook, 0:45)
- Collision: **drive Duet 2:15** · `Dialogue B` (Turn, 0:30)
- Decision: **eleven Solo 2:00** · `Dialogue C` (Consequence, 0:30)
- Button: **reprise Duet 1:30**

Function choices worth defending: Song 1 is `iwant`, not `opening` — the guide's
pass test and every one of its failure modes are about the want, and the opening's
tone job is folded into the same 90 seconds. Song 3 is `eleven`, not `soliloquy` —
it is the decision number, and the guide's cardinal rule is that the choice is
sung as an action at its climax. Song 4 is `reprise`, not `finaleultimo`, because
the reversed-meaning reprise *is* the ending in this form.

**`ten-five` — "Five-Song Short (13–15 min)"** · 5 songs + 4 beats · ~14:15.
The extra minutes buy the guide's first-listed spend and nothing else: the
second character's own want, an `iwant Solo` placed in the crisis gap between
the screw-turn and the decision. It is an I Want precisely because the form's
commonest disease is a second character who knows things instead of wanting them.

### 8d · Blank

A twelfth entry, `id: 'blank'`, `cards: []`, and — uniquely — `mode: null`.
A null mode means "every length": the new-show modal keeps Blank in the select
whichever segment is lit, and `createProject` skips its usual
"the template's mode wins" override so the **chosen length survives**
(`if (chosen && chosen.mode)`). Blank is deliberately kept **off** the Library
shelf: an empty board is nothing to browse and nothing to teach.

### 8e · Decisions

- [x] Third mode rather than a template-only shape — shipped v262.
- [x] Lane labels and the "The turn" divider are ten-minute only; `full` and
      `oneact` render exactly as before.
- [x] Beats ship in these two templates only; §4's scene scaffold for the
      long-form templates stays deferred.
- [x] Duration stepper drops to 0.25 (15 seconds) at this length — 0.5 is the
      right grain for a two-act and far too coarse for a ten.
- [x] The show-settings field above the segment is now labelled **Length**
      (was "Format", which now reads as Song Plot vs Prose Plot).
- [x] **21 Chump Street carded as the first ten-minute reference** (2026-08-09).
      The guide's other §10 models — *Trial by Jury*, *The Telephone*,
      *A Hand of Bridge*, the *Into the Woods* prologue — are still uncarded.

### 8f · Why the ten-minute shelf show is not in the corpus

`form: 'ten-minute'` is the first shelf form that `build-atlas-data.mjs`
**skips outright**. This is stricter than any `kind` — films (`kind: 'film'`)
and the unclassifiable (`kind: 'other'`) both still count toward the
all-corpus totals; a ten-minute show does not enter the census at all. The reason is arithmetic: the
Atlas census is what the long-form templates cite for function positions and
act ratios, and a fourteen-minute piece with five numbers is not a short
musical but a different form. Verified by running the builder with the guard
disabled — 87 shows / 1,581 songs, with the entry present — against 86 / 1,576
with it in place.

The consequence to remember: **a ten-minute reference teaches on the shelf and
measures nowhere.** If a ten-minute cohort is ever wanted in the Atlas, it needs
its own scope (a third value beside `one` and `full`), not a relaxation of this
guard.

### 8g · The reference entry

Five numbers, no beat cards. The narration lives inside the numbers — Miranda's
narrator is credited on all five — so there is no spoken connective tissue to
card, and inventing some would both fabricate structure and double-count the
running time against the EP's own clock. Minutes are the cast EP's track times
(13:48 total), which is why this is the only entry on the shelf carrying
two-decimal minutes: at this length a quarter minute is nearly 2% of the show,
and rounding to the shelf's usual half-minutes would visibly move the badges.

Measured positions, which are the entry's teaching value: the want at **13%**,
the counter-want at **36%**, the comic scramble at **55%**, the transaction at
**70%**, the reckoning at **89%**. Compare the ten-minute template's seats —
the shapes agree except in one place, and that place is the point: the piece has
**no decision number**. The reported story contained no deliberation, and the
show declines to invent one, so the transaction simply happens. That is the
template's decision seat left empty on purpose, and the clearest argument on the
shelf that a seat is a default, not a law.

### 8h · The worked example (`nothing-to-declare.json`)

A third seed show, beside `circuits.json` and `tide-keeper.json` — an original
five-song short (*Nothing to Declare*, an airport customs officer's last shift)
laid out on the **Five-Song Short template's clock exactly**: 14:15, four spoken
beats totalling 2:15, five numbers totalling 12:00, lanes 3.5 / 3.25 / 5.5 / 2.0,
turn at 47%. Opening it next to the template is the point — it shows what the
seats look like once a story is in them.

It is a sandbox, not a reference: it lives in `app/seed-shows/` (copied into the
data dir on first server start, never overwriting a live edit), it is fully
editable, and its song statuses are deliberately spread across idea / lyric /
music / demo so the board has something to look like.

Two departures from the form are written into its production notes rather than
hidden, because an example that quietly breaks its own rules teaches the wrong
thing: the sincerity budget is spent in **two** windows rather than one late
one, and the antagonist is a **rule that is genuinely right** for the whole
piece — which is either the strongest thing in it or the thing that will make
it feel like a technicality, depending on the draft.
