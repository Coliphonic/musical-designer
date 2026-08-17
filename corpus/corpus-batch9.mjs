// Data-only corpus, batch 9: the DISNEY wing + stage/film pairs (2026-08-17,
// Colin's request — "add Beauty and the Beast and Anastasia and any other
// Disney musicals we might have forgotten", plus film musicals so stage and
// screen versions of the same title can be read side by side).
// Tuples: [half, fn, voice, estMin].
//
// SOURCING: running orders verified against published musical-numbers lists
// (Wikipedia) and, for every film and for Beauty and the Beast onstage, the
// cast/soundtrack album track lists — album beats guide when they disagree
// (Colin's standing rule). Minutes are interpretive ballparks rounded to the
// half-minute, trimmed where an album track carries dialogue or dance breaks.
// Anastasia is NOT Disney (Fox/Don Bluth film; Stage Entertainment on
// Broadway) — it rides in this wing because Colin asked for it by name and it
// completes a stage/film pair.
//
// FILM CONVENTIONS (Encanto in corpus-extras.mjs is the precedent):
// - form: 'film', and the NAMES title carries a ' (film)' suffix — which also
//   keeps these clear of build-atlas-data's shelf-title veto, since the stage
//   Little Mermaid / Frozen / Newsies / Hunchback / Hercules are carded shelf
//   shows. formKind() maps 'film' → 'other', so films drop out of BOTH sides
//   of the Atlas one-act/full-length filter but still count in totals and in
//   the show picker, which is where the stage-vs-film comparison happens.
// - A1/A2 split at an editorial threshold, named per show (same practice as
//   one-acts). NO 'finale' tags in films — no interval exists, same logic as
//   the one-act rule (act finale 0/223 in one-acts).
// - End-credits pop versions (Celine Dion/Peabo Bryson, Michael Bolton,
//   Aaliyah, Demi Lovato, All-4-One...) are excluded: they are not sung in
//   the story. Score cues, narrated prologues, and sub-minute fragments are
//   folded into neighbours or omitted, noted per show.
export const BATCH9 = {
  // ═══ STAGE ═══
  beautybeast: { // 1994 · two-act · Menken/Ashman/Rice
    // OBC album order (72:09). Act One ends on "If I Can't Love Her" — the
    // solo-ballad act ender (cf. Hadestown note on act-ender options); "Be Our
    // Guest" is IN Act One, contra a common mislisting. Narrated Prologue
    // (The Enchantress) and the instrumental Battle omitted.
    form: 'two-act', year: 1994, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 5],   // Belle
      ['A1', 'charm',        'duet',  3],   // No Matter What
      ['A1', 'reprise',      'solo',  1.5], // No Matter What (Rep) / Wolf Chase
      ['A1', 'comedy',       'duet',  3],   // Me
      ['A1', 'iwant',        'solo',  1],   // Belle (Reprise)
      ['A1', 'ballad',       'solo',  4],   // Home
      ['A1', 'reprise',      'solo',  1],   // Home (Reprise)
      ['A1', 'production',   'group', 5],   // Gaston
      ['A1', 'reprise',      'duet',  1.5], // Gaston (Reprise)
      ['A1', 'soliloquy',    'solo',  1],   // How Long Must This Go On?
      ['A1', 'production',   'group', 6.5], // Be Our Guest
      ['A1', 'finale',       'solo',  4],   // If I Can't Love Her
      ['A2', 'love',         'group', 3],   // Something There
      ['A2', 'production',   'group', 4.5], // Human Again
      ['A2', 'villain',      'group', 2.5], // Maison des Lunes
      ['A2', 'ballad',       'solo',  3.5], // Beauty and the Beast
      ['A2', 'reprise',      'solo',  1.5], // If I Can't Love Her (Rep)
      ['A2', 'drive',        'group', 3],   // The Mob Song
      ['A2', 'finaleultimo', 'group', 3.5], // Transformation / Finale
    ],
  },
  lionking: { // 1997 · two-act · John/Rice + Lebo M
    // Numbers per the published list; The Stampede and Simba Confronts Scar
    // are instrumental and omitted. "Hakuna Matata" closes Act One.
    form: 'two-act', year: 1997, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 5],   // Circle of Life
      ['A1', 'establishing', 'group', 1.5], // Grasslands Chant
      ['A1', 'comedy',       'group', 2.5], // The Morning Report
      ['A1', 'production',   'group', 2],   // The Lioness Hunt
      ['A1', 'iwant',        'group', 3],   // I Just Can't Wait to Be King
      ['A1', 'villain',      'group', 2],   // Chow Down
      ['A1', 'ballad',       'solo',  3],   // They Live in You
      ['A1', 'villain',      'group', 4],   // Be Prepared
      ['A1', 'ballad',       'group', 1.5], // Rafiki Mourns
      ['A1', 'finale',       'group', 4],   // Hakuna Matata
      ['A2', 'production',   'group', 3],   // One by One
      ['A2', 'villain',      'group', 3],   // The Madness of King Scar
      ['A2', 'anthem',       'group', 4],   // Shadowland
      ['A2', 'soliloquy',    'solo',  4],   // Endless Night
      ['A2', 'love',         'group', 4],   // Can You Feel the Love Tonight
      ['A2', 'reprise',      'group', 3.5], // He Lives in You
      ['A2', 'finaleultimo', 'group', 3.5], // King of Pride Rock / Circle of Life (Rep)
    ],
  },
  aida: { // 2000 · two-act · Elton John/Tim Rice — the forgotten Disney Broadway show
    form: 'two-act', year: 2000, region: 'bway',
    songs: [
      ['A1', 'opening',      'solo',  2.5], // Every Story Is a Love Story
      ['A1', 'establishing', 'group', 3],   // Fortune Favors the Brave
      ['A1', 'iwant',        'solo',  3],   // The Past Is Another Land
      ['A1', 'villain',      'group', 3],   // Another Pyramid
      ['A1', 'charm',        'duet',  2.5], // How I Know You
      ['A1', 'comedy',       'group', 4.5], // My Strongest Suit
      ['A1', 'reprise',      'solo',  1],   // Fortune Favors the Brave (Rep)
      ['A1', 'love',         'duet',  3],   // Enchantment Passing Through
      ['A1', 'reprise',      'duet',  1.5], // My Strongest Suit (Rep)
      ['A1', 'anthem',       'group', 4],   // Dance of the Robe
      ['A1', 'drive',        'group', 3],   // Not Me
      ['A1', 'love',         'duet',  4.5], // Elaborate Lives
      ['A1', 'finale',       'group', 4.5], // The Gods Love Nubia
      ['A2', 'drive',        'group', 3.5], // A Step Too Far
      ['A2', 'soliloquy',    'solo',  4.5], // Easy as Life
      ['A2', 'villain',      'group', 3.5], // Like Father, Like Son
      ['A2', 'ballad',       'solo',  2],   // Radames' Letter
      ['A2', 'reprise',      'solo',  1.5], // How I Know You (Rep)
      ['A2', 'eleven',       'duet',  4],   // Written in the Stars
      ['A2', 'ballad',       'solo',  3],   // I Know the Truth
      ['A2', 'reprise',      'duet',  1.5], // Elaborate Lives (Rep)
      ['A2', 'reprise',      'duet',  2],   // Enchantment Passing Through (Rep)
      ['A2', 'finaleultimo', 'group', 2],   // Every Story Is a Love Story (Rep)
    ],
  },
  marypoppins: { // 2004 · two-act · Sherman/Sherman + Stiles/Drewe · premiered West End
    // The published list runs to ~40 fragments; Cherry Tree Lane parts and the
    // Chim Chim Cher-ee interstitials are folded into single cards. Act One
    // ends on the Bert+Mary Chim Chim Cher-ee reprise after Temper, Temper.
    form: 'two-act', year: 2004, region: 'westend',
    songs: [
      ['A1', 'opening',      'solo',  1.5], // Chim Chim Cher-ee
      ['A1', 'establishing', 'group', 4],   // Cherry Tree Lane
      ['A1', 'charm',        'duet',  1.5], // The Perfect Nanny
      ['A1', 'charm',        'group', 3.5], // Practically Perfect
      ['A1', 'production',   'group', 5],   // Jolly Holiday
      ['A1', 'ballad',       'solo',  2.5], // Being Mrs. Banks
      ['A1', 'charm',        'group', 4],   // A Spoonful of Sugar
      ['A1', 'drive',        'group', 2.5], // Precision and Order
      ['A1', 'soliloquy',    'solo',  2.5], // A Man Has Dreams
      ['A1', 'ballad',       'duet',  3.5], // Feed the Birds
      ['A1', 'production',   'group', 5],   // Supercalifragilisticexpialidocious
      ['A1', 'villain',      'group', 3],   // Temper, Temper
      ['A1', 'finale',       'duet',  1.5], // Chim Chim Cher-ee (Rep)
      ['A2', 'villain',      'solo',  2.5], // Brimstone and Treacle
      ['A2', 'charm',        'group', 3],   // Let's Go Fly a Kite
      ['A2', 'ballad',       'solo',  2],   // Good for Nothing
      ['A2', 'reprise',      'duet',  1.5], // Brimstone and Treacle (Part 2)
      ['A2', 'reprise',      'group', 1.5], // Practically Perfect (Rep)
      ['A2', 'production',   'group', 6],   // Step in Time
      ['A2', 'reprise',      'duet',  3],   // A Man Has Dreams / A Spoonful of Sugar (Rep)
      ['A2', 'finaleultimo', 'group', 4.5], // Anything Can Happen
    ],
  },
  tarzan: { // 2006 · two-act · Phil Collins
    // "Jungle Funk" is instrumental and omitted. Act One ends on "Different".
    form: 'two-act', year: 2006, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 4],   // Two Worlds
      ['A1', 'ballad',       'solo',  4],   // You'll Be in My Heart
      ['A1', 'charm',        'duet',  2.5], // Who Better Than Me?
      ['A1', 'drive',        'solo',  3],   // No Other Way
      ['A1', 'iwant',        'solo',  2.5], // I Need to Know
      ['A1', 'production',   'group', 3.5], // Son of Man
      ['A1', 'reprise',      'group', 1],   // Son of Man (Rep)
      ['A1', 'ballad',       'duet',  3],   // Sure as Sun Turns to Moon
      ['A1', 'iwant',        'solo',  3.5], // Waiting for This Moment
      ['A1', 'finale',       'duet',  4],   // Different
      ['A2', 'comedy',       'group', 2.5], // Trashin' the Camp
      ['A2', 'charm',        'duet',  2.5], // Like No Man I've Ever Seen
      ['A2', 'drive',        'group', 3.5], // Strangers Like Me
      ['A2', 'love',         'duet',  3.5], // For the First Time
      ['A2', 'reprise',      'duet',  1.5], // Who Better Than Me? (Rep)
      ['A2', 'soliloquy',    'solo',  3.5], // Everything That I Am
      ['A2', 'reprise',      'duet',  1.5], // You'll Be in My Heart (Rep)
      ['A2', 'reprise',      'duet',  1.5], // Sure as Sun Turns to Moon (Rep)
      ['A2', 'finaleultimo', 'group', 2.5], // Two Worlds (Finale)
    ],
  },
  aladdin: { // 2014 · two-act · Menken/Ashman/Rice/Beguelin
    // Dual I Wants (Proud of Your Boy / These Palace Walls) — the 1990+ trait.
    form: 'two-act', year: 2014, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 4],   // Arabian Nights
      ['A1', 'establishing', 'group', 3],   // One Jump Ahead
      ['A1', 'reprise',      'solo',  1],   // One Jump Ahead (Rep)
      ['A1', 'iwant',        'solo',  2.5], // Proud of Your Boy
      ['A1', 'iwant',        'group', 3],   // These Palace Walls
      ['A1', 'comedy',       'group', 3.5], // Babkak, Omar, Aladdin, Kassim
      ['A1', 'love',         'duet',  3],   // A Million Miles Away
      ['A1', 'villain',      'group', 2],   // Diamond in the Rough
      ['A1', 'production',   'group', 5],   // Friend Like Me
      ['A1', 'finale',       'duet',  2],   // Act One Finale
      ['A2', 'production',   'group', 4],   // Prince Ali
      ['A2', 'love',         'duet',  4],   // A Whole New World
      ['A2', 'comedy',       'group', 3.5], // High Adventure
      ['A2', 'charm',        'group', 3],   // Somebody's Got Your Back
      ['A2', 'reprise',      'solo',  1.5], // Proud of Your Boy (Rep II)
      ['A2', 'reprise',      'group', 1],   // Prince Ali (Sultan Rep)
      ['A2', 'reprise',      'solo',  1],   // Prince Ali (Jafar Rep)
      ['A2', 'finaleultimo', 'group', 2.5], // Finale Ultimo
    ],
  },
  anastasia: { // 2017 · two-act · Flaherty/Ahrens · NOT Disney (Fox film, Stage Entertainment)
    // Connective fragments (Last Dance of the Romanovs, Rumors Never End,
    // A Secret She Kept, Traveling Sequence, A Nightmare, Meant to Be,
    // Everything to Win (Rep)) folded into neighbours. Act One ends on
    // "Journey to the Past" — another solo-ballad act ender.
    form: 'two-act', year: 2017, region: 'bway',
    songs: [
      ['A1', 'opening',      'duet',  2.5], // Prologue: Once Upon a December
      ['A1', 'establishing', 'group', 4.5], // A Rumor in St. Petersburg
      ['A1', 'iwant',        'solo',  3.5], // In My Dreams
      ['A1', 'charm',        'group', 3.5], // Learn to Do It
      ['A1', 'villain',      'solo',  3],   // The Neva Flows
      ['A1', 'charm',        'duet',  3],   // My Petersburg
      ['A1', 'ballad',       'group', 3.5], // Once Upon a December
      ['A1', 'ballad',       'group', 3],   // Stay, I Pray You
      ['A1', 'drive',        'group', 3],   // We'll Go From There
      ['A1', 'soliloquy',    'solo',  3],   // Still
      ['A1', 'finale',       'solo',  4],   // Journey to the Past
      ['A2', 'production',   'group', 4],   // Paris Holds the Key (To Your Heart)
      ['A2', 'ballad',       'solo',  2.5], // Crossing a Bridge
      ['A2', 'ballad',       'solo',  2],   // Close the Door
      ['A2', 'comedy',       'group', 3],   // Land of Yesterday
      ['A2', 'comedy',       'duet',  2.5], // The Countess and the Common Man
      ['A2', 'love',         'duet',  4],   // In a Crowd of Thousands
      ['A2', 'drive',        'group', 3.5], // Quartet at the Ballet
      ['A2', 'soliloquy',    'solo',  2.5], // Everything to Win
      ['A2', 'reprise',      'duet',  2],   // Once Upon a December (Rep)
      ['A2', 'drive',        'group', 2],   // The Press Conference
      ['A2', 'reprise',      'group', 2],   // Still / The Neva Flows (Rep)
      ['A2', 'finaleultimo', 'group', 2],   // Finale
    ],
  },

  // ═══ FILM ═══
  marypoppinsfilm: { // 1964 FILM (139 min) · Sherman/Sherman
    // Split after "I Love to Laugh" — the outings half gives way to the
    // bank-and-consequences half. "Pavement Artist" (a Chim Chim Cher-ee
    // variant) folded out as a motif fragment; Step in Time trimmed from its
    // 8:42 album track (mostly dance).
    form: 'film', year: 1964,
    songs: [
      ['A1', 'comedy',       'solo',  1.5], // Sister Suffragette
      ['A1', 'establishing', 'solo',  2],   // The Life I Lead
      ['A1', 'charm',        'duet',  1.5], // The Perfect Nanny
      ['A1', 'charm',        'solo',  4],   // A Spoonful of Sugar
      ['A1', 'production',   'duet',  5.5], // Jolly Holiday
      ['A1', 'production',   'group', 2],   // Supercalifragilisticexpialidocious
      ['A1', 'ballad',       'solo',  1.5], // Stay Awake
      ['A1', 'comedy',       'group', 2.5], // I Love to Laugh
      ['A2', 'drive',        'duet',  2],   // A British Bank (The Life I Lead)
      ['A2', 'ballad',       'solo',  4],   // Feed the Birds
      ['A2', 'villain',      'group', 3.5], // Fidelity Fiduciary Bank
      ['A2', 'charm',        'group', 2.5], // Chim Chim Cher-ee
      ['A2', 'production',   'group', 5.5], // Step in Time
      ['A2', 'ballad',       'duet',  4.5], // A Man Has Dreams
      ['A2', 'finaleultimo', 'group', 2],   // Let's Go Fly a Kite
    ],
  },
  littlemermaidfilm: { // 1989 FILM (83 min) · Menken/Ashman
    // Split after "Poor Unfortunate Souls" — the deal is the threshold. The
    // songs frontload hard (A1 ~71% of sung minutes): compare the 2008 stage
    // version on the shelf, which spreads them.
    form: 'film', year: 1989,
    songs: [
      ['A1', 'opening',      'group', 1.5], // Fathoms Below
      ['A1', 'diegetic',     'group', 0.5], // Daughters of Triton
      ['A1', 'iwant',        'solo',  3],   // Part of Your World
      ['A1', 'production',   'group', 3],   // Under the Sea
      ['A1', 'reprise',      'solo',  2],   // Part of Your World (Rep)
      ['A1', 'villain',      'solo',  5],   // Poor Unfortunate Souls
      ['A2', 'comedy',       'solo',  1.5], // Les Poissons
      ['A2', 'love',         'group', 2.5], // Kiss the Girl
      ['A2', 'finaleultimo', 'group', 2],   // Finale (Happy Ending)
    ],
  },
  beautybeastfilm: { // 1991 FILM (84 min) · Menken/Ashman
    // FILM order — the title ballad plays BEFORE the Mob Song; the album
    // sequences them the other way. Split after "Be Our Guest" (the castle
    // opens to her). "Human Again" was cut from the 1991 release — it lives
    // in the 1994 stage row above.
    form: 'film', year: 1991,
    songs: [
      ['A1', 'opening',      'group', 5],   // Belle
      ['A1', 'iwant',        'solo',  1],   // Belle (Reprise)
      ['A1', 'comedy',       'group', 3.5], // Gaston
      ['A1', 'reprise',      'group', 2],   // Gaston (Reprise)
      ['A1', 'production',   'group', 3.5], // Be Our Guest
      ['A2', 'love',         'group', 2.5], // Something There
      ['A2', 'ballad',       'solo',  3],   // Beauty and the Beast
      ['A2', 'drive',        'group', 3.5], // The Mob Song
      ['A2', 'finaleultimo', 'group', 1.5], // Transformation / Finale
    ],
  },
  aladdinfilm: { // 1992 FILM (90 min) · Menken/Ashman/Rice
    // Split after "Friend Like Me" — the wish; the 2014 stage version puts
    // its act break at the same seam. End-credits Bryson/Belle duet excluded.
    form: 'film', year: 1992,
    songs: [
      ['A1', 'opening',      'solo',  1.5], // Arabian Nights
      ['A1', 'establishing', 'solo',  2.5], // One Jump Ahead
      ['A1', 'iwant',        'solo',  1],   // One Jump Ahead (Rep)
      ['A1', 'production',   'group', 2.5], // Friend Like Me
      ['A2', 'production',   'group', 3],   // Prince Ali
      ['A2', 'love',         'duet',  2.5], // A Whole New World
      ['A2', 'reprise',      'solo',  1],   // Prince Ali (Jafar Rep)
    ],
  },
  newsiesfilm: { // 1992 FILM (121 min) · Menken/Feldman · famous flop, later reborn onstage
    // Split after "Seize the Day" — the strike commits. Credits reprise of
    // Carrying the Banner excluded; 0:48 prologue folded. Compare shelf
    // Newsies (2012), which rebuilt this score around Katherine and moved
    // Santa Fe's reprise to the act break.
    form: 'film', year: 1992,
    songs: [
      ['A1', 'opening',      'group', 5],   // Carrying the Banner
      ['A1', 'iwant',        'solo',  4.5], // Santa Fe
      ['A1', 'diegetic',     'solo',  1.5], // My Lovey-Dovey Baby
      ['A1', 'drive',        'group', 3.5], // The World Will Know
      ['A1', 'anthem',       'group', 2],   // Seize the Day
      ['A2', 'production',   'group', 2.5], // King of New York
      ['A2', 'diegetic',     'group', 3],   // High Times, Hard Times
      ['A2', 'drive',        'group', 2.5], // Once and for All
      ['A2', 'finaleultimo', 'group', 1.5], // The World Will Know (Finale)
    ],
  },
  lionkingfilm: { // 1994 FILM (88 min) · John/Rice
    // Split after "Hakuna Matata" — exile becomes a new life; the 1997 stage
    // version drops its interval at the same seam. A1 carries ~76% of the
    // sung minutes: nearly every number precedes the timeskip. Elton John
    // credits versions excluded.
    form: 'film', year: 1994,
    songs: [
      ['A1', 'opening',      'group', 4],   // Circle of Life
      ['A1', 'iwant',        'group', 3],   // I Just Can't Wait to Be King
      ['A1', 'villain',      'group', 3.5], // Be Prepared
      ['A1', 'production',   'group', 3.5], // Hakuna Matata
      ['A2', 'love',         'group', 3],   // Can You Feel the Love Tonight
      ['A2', 'finaleultimo', 'group', 1.5], // Circle of Life (Finale)
    ],
  },
  hunchbackfilm: { // 1996 FILM (91 min) · Menken/Schwartz
    // Split after "Hellfire" — Frollo commits. The Heaven's Light/Hellfire
    // album track is carded as its two halves. A1 carries ~81% of sung
    // minutes — the steepest frontload in the corpus; compare the 2015 stage
    // version on the shelf. "Someday" is credits-only and excluded.
    form: 'film', year: 1996,
    songs: [
      ['A1', 'opening',      'group', 6],   // The Bells of Notre Dame
      ['A1', 'iwant',        'solo',  4],   // Out There
      ['A1', 'production',   'group', 5],   // Topsy Turvy
      ['A1', 'ballad',       'solo',  3.5], // God Help the Outcasts
      ['A1', 'love',         'solo',  1.5], // Heaven's Light
      ['A1', 'villain',      'solo',  3.5], // Hellfire
      ['A2', 'comedy',       'group', 3],   // A Guy Like You
      ['A2', 'comedy',       'group', 1.5], // The Court of Miracles
      ['A2', 'finaleultimo', 'group', 1],   // The Bells of Notre Dame (Rep)
    ],
  },
  herculesfilm: { // 1997 FILM (93 min) · Menken/Zippel
    // Split after "Zero to Hero" — famous, but not yet a hero. The three
    // Gospel Truth fragments are folded into one card. Michael Bolton
    // credits version excluded. Compare shelf Hercules (2025).
    form: 'film', year: 1997,
    songs: [
      ['A1', 'opening',      'group', 4],   // The Gospel Truth
      ['A1', 'iwant',        'solo',  3],   // Go the Distance
      ['A1', 'reprise',      'solo',  1],   // Go the Distance (Rep)
      ['A1', 'comedy',       'solo',  3],   // One Last Hope
      ['A1', 'production',   'group', 2.5], // Zero to Hero
      ['A2', 'love',         'group', 2.5], // I Won't Say (I'm in Love)
      ['A2', 'finaleultimo', 'group', 2],   // A Star Is Born
    ],
  },
  anastasiafilm: { // 1997 FILM (94 min) · Flaherty/Ahrens · Fox, not Disney
    // Split after "Once Upon a December" — Anya commits to the con and the
    // journey west. Narrated prologue and the Kidnap and Reunion vocal
    // fragments folded out; At the Beginning + Aaliyah/Carter versions are
    // credits-only and excluded. Compare the 2017 stage row above — the
    // stage version demotes Rasputin for Gleb and moves Journey to the Past
    // to the act break.
    form: 'film', year: 1997,
    songs: [
      ['A1', 'opening',      'group', 3.5], // A Rumor in St. Petersburg
      ['A1', 'iwant',        'solo',  3],   // Journey to the Past
      ['A1', 'ballad',       'solo',  3],   // Once Upon a December
      ['A2', 'villain',      'solo',  3.5], // In the Dark of the Night
      ['A2', 'charm',        'group', 2.5], // Learn to Do It
      ['A2', 'reprise',      'solo',  1.5], // Learn to Do It (Waltz Rep)
      ['A2', 'production',   'group', 3],   // Paris Holds the Key (To Your Heart)
    ],
  },
  tarzanfilm: { // 1999 FILM (88 min) · Phil Collins
    // Narrator-sung: Collins performs everything offscreen except Trashin'
    // the Camp — the voicings below are the heard voices, not characters.
    // Split after "Son of Man" — Tarzan grown. Compare the 2006 stage row,
    // which hands the songs to the characters.
    form: 'film', year: 1999,
    songs: [
      ['A1', 'opening',      'solo',  3.5], // Two Worlds
      ['A1', 'ballad',       'duet',  1.5], // You'll Be in My Heart
      ['A1', 'production',   'solo',  2.5], // Son of Man
      ['A2', 'comedy',       'group', 2],   // Trashin' the Camp
      ['A2', 'iwant',        'solo',  3],   // Strangers Like Me
      ['A2', 'finaleultimo', 'solo',  1],   // Two Worlds (Rep)
    ],
  },
  frozenfilm: { // 2013 FILM (102 min) · Lopez/Anderson-Lopez
    // Split after "Let It Go" — tagged soliloquy (alone, deciding who she
    // is), not 'finale': films take no finale tags, but the 2018 stage
    // version (on the shelf) ends its Act One on this same number. The film
    // ends scored, without a sung finale — the only such entry in this wing.
    // Demi Lovato credits version excluded.
    form: 'film', year: 2013,
    songs: [
      ['A1', 'opening',      'group', 1.5], // Frozen Heart
      ['A1', 'charm',        'solo',  3.5], // Do You Want to Build a Snowman?
      ['A1', 'iwant',        'duet',  3.5], // For the First Time in Forever
      ['A1', 'love',         'duet',  2],   // Love Is an Open Door
      ['A1', 'soliloquy',    'solo',  3.5], // Let It Go
      ['A2', 'charm',        'solo',  1],   // Reindeer(s) Are Better Than People
      ['A2', 'comedy',       'solo',  2],   // In Summer
      ['A2', 'reprise',      'duet',  2.5], // For the First Time in Forever (Rep)
      ['A2', 'comedy',       'group', 3],   // Fixer Upper
    ],
  },
};
