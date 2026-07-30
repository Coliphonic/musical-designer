// Data-only corpus, batch 8: the ONE-ACT wing (2026-07-29, Colin's request —
// the one-act population was only 11 of 81 shows, too thin to filter on).
// Tuples: [half, fn, voice, estMin].
//
// SOURCING: running orders verified against published musical-numbers lists
// rather than recalled — see the per-show notes. Minutes are interpretive
// ballparks, as everywhere in this corpus.
//
// ONE-ACT HALVES: despite corpus-winners.mjs's header comment offering '1H',
// no row has ever used it — every existing one-act (six, funhome, comefromaway,
// achorusline, lastfiveyears, drowsychaperone, bandsvisit, strangeloop,
// manoflamancha) splits A1/A2 at a natural midpoint so the act-balance math
// still resolves. These follow that practice. The split point is named in each
// show's comment, because for a one-act it is an editorial call, not a curtain.
export const BATCH8 = {
  // ═══ ONE-ACTS ═══
  oncethisisland: { // 1990 · one-act ~90 min · storyteller-ensemble folk tale
    // Numbers per the published list. Sung-through; the tiniest connective
    // fragments ("Gossip"/"Pray (Reprise)", "Wedding Sequence") are folded into
    // their neighbours rather than carded as songs.
    // Midpoint split after "Mama Will Provide" — Ti Moune leaves for the other
    // side of the island, which is the story's threshold.
    form: 'one-act-90', year: 1990, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 4],   // We Dance
      ['A1', 'establishing', 'group', 3],   // One Small Girl
      ['A1', 'iwant',        'solo',  3.5], // Waiting for Life
      ['A1', 'drive',        'group', 2],   // And the Gods Heard Her Prayer
      ['A1', 'production',   'group', 3],   // Rain
      ['A1', 'charm',        'solo',  1.5], // Discovering Daniel
      ['A1', 'drive',        'group', 3],   // Pray
      ['A1', 'drive',        'group', 3],   // Forever Yours
      ['A1', 'establishing', 'group', 3.5], // The Sad Tale of the Beauxhommes
      ['A1', 'ballad',       'group', 2.5], // Ti Moune
      ['A1', 'production',   'group', 4],   // Mama Will Provide
      ['A2', 'reprise',      'solo',  1],   // Waiting for Life (Rep)
      ['A2', 'drive',        'group', 2],   // Some Say
      ['A2', 'ballad',       'group', 3.5], // The Human Heart
      ['A2', 'love',         'solo',  3],   // Some Girls
      ['A2', 'production',   'group', 3.5], // The Ball
      ['A2', 'production',   'group', 2.5], // Ti Moune's Dance
      ['A2', 'drive',        'group', 2],   // When We Are Wed
      ['A2', 'villain',      'group', 3],   // Promises
      ['A2', 'reprise',      'group', 3],   // Forever Yours (Rep)
      ['A2', 'ballad',       'group', 3],   // A Part of Us
      ['A2', 'finaleultimo', 'group', 4],   // Why We Tell the Story
    ] },
  titleofshow: { // 2006 off-Bway (2008 Bway) · one-act ~90 min · meta 4-hander
    // The show about writing the show. Midpoint split after "What Kind of Girl
    // Is She?" — the friendship strain that the back half resolves.
    form: 'one-act-90', year: 2006, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // Untitled Opening Number
      ['A1', 'iwant',        'duet',  4],   // Two Nobodies in New York
      ['A1', 'charm',        'solo',  2.5], // An Original Musical
      ['A1', 'comedy',       'group', 3],   // Monkeys and Playbills
      ['A1', 'comedy',       'duet',  1.5], // The Tony Award Song
      ['A1', 'charm',        'duet',  3],   // Part of It All
      ['A1', 'ballad',       'solo',  3],   // I Am Playing Me
      ['A1', 'comedy',       'duet',  3],   // What Kind of Girl Is She?
      ['A2', 'anthem',       'group', 4.5], // Die, Vampire, Die!
      ['A2', 'comedy',       'group', 2],   // Filling Out the Form
      ['A2', 'drive',        'group', 2],   // Montage 1: September Song
      ['A2', 'comedy',       'duet',  3],   // Montage 2: Secondary Characters
      ['A2', 'drive',        'group', 2.5], // Montage 3: Development Medley
      ['A2', 'drive',        'group', 3.5], // Change It, Don't Change It
      ['A2', 'eleven',       'solo',  4],   // A Way Back to Then
      ['A2', 'anthem',       'group', 3.5], // Nine People's Favorite Thing
      ['A2', 'finaleultimo', 'group', 2],   // Finale
    ] },
  ordinarydays: { // 2008 (2009 off-Bway) · one-act ~80 min · sung-through 4-hander
    // Fully sung-through, no spoken dialogue — so song minutes are most of the
    // running time. Midpoint split after "Favorite Places", at the Met, which is
    // where the two unconnected pairs' stories cross.
    form: 'one-act-80', year: 2009, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // One by One by One
      ['A1', 'iwant',        'solo',  2.5], // Don't Wanna Be Here
      ['A1', 'establishing', 'solo',  3],   // The Space Between
      ['A1', 'iwant',        'solo',  3],   // Let Things Go
      ['A1', 'comedy',       'solo',  1.5], // Dear Professor Thompson, Pt. 1
      ['A1', 'charm',        'solo',  3.5], // Life Story
      ['A1', 'comedy',       'solo',  1.5], // Dear Professor Thompson, Pt. 2
      ['A1', 'drive',        'duet',  3.5], // I'm Trying
      ['A1', 'production',   'group', 4],   // Saturday at the Met
      ['A1', 'love',         'solo',  3],   // Favorite Places
      ['A2', 'charm',        'duet',  3.5], // Sort-Of Fairy Tale
      ['A2', 'drive',        'duet',  3],   // Fine
      ['A2', 'comedy',       'duet',  4],   // Big Picture
      ['A2', 'anthem',       'group', 4],   // Hundred-Story City
      ['A2', 'drive',        'solo',  1.5], // Party Interlude
      ['A2', 'ballad',       'solo',  3],   // Calm
      ['A2', 'reprise',      'solo',  1.5], // Life Story (Rep)
      ['A2', 'soliloquy',    'solo',  3.5], // Gotta Get Out
      ['A2', 'love',         'group', 4],   // Rooftop Duet / Falling
      ['A2', 'eleven',       'solo',  5],   // I'll Be Here
      ['A2', 'finaleultimo', 'duet',  4],   // Beautiful
    ] },
  ridethecyclone: { // 2008 Victoria BC (2016 off-Bway) · one-act ~90 min
    // Karnak's spoken "bumpers" between numbers are the framing device, not
    // songs, so they are not carded — which is why song minutes fall well short
    // of the running time. Midpoint split after "This Song Is Awesome", halfway
    // through the five dead choristers' showcase solos.
    form: 'one-act-90', year: 2016, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // Karnak's Dream of Life
      ['A1', 'establishing', 'group', 3],   // Uranium Suite
      ['A1', 'motif',        'solo',  1.5], // Jane Doe's Entrance
      ['A1', 'iwant',        'group', 4],   // What the World Needs
      ['A1', 'charm',        'group', 2.5], // I Love You Guys
      ['A1', 'ballad',       'group', 3.5], // Noel's Lament
      ['A1', 'drive',        'group', 3],   // Every Story's Got a Lesson
      ['A1', 'comedy',       'group', 3],   // This Song Is Awesome
      ['A2', 'ballad',       'group', 3.5], // Talia
      ['A2', 'production',   'group', 3.5], // Space Age Bachelor Man
      ['A2', 'ballad',       'group', 4],   // The Ballad of Jane Doe
      ['A2', 'production',   'group', 2],   // The New Birthday Song
      ['A2', 'comedy',       'solo',  3],   // Jawbreaker
      ['A2', 'eleven',       'group', 4],   // Sugar Cloud
      ['A2', 'finaleultimo', 'group', 4.5], // It's Not a Game / It's Just a Ride
    ] },
  // ═══ TWO-ACT (requested alongside the one-acts, but not one) ═══
  rockyhorror: { // 1973 Royal Court · TWO-act as licensed today
    // JUDGEMENT CALL worth knowing: the original 1973 Theatre Upstairs staging
    // ran with NO interval, and was only broken into two acts for the 1979
    // Comedy Theatre transfer. Carded here as two-act because that is the form
    // performed and licensed now — flip `form` to 'one-act-80' and relabel the
    // halves if you'd rather the corpus hold the 1973 original.
    // Act break placed after "I Can Make You a Man" (the creation), with Act 2
    // opening on Eddie's eruption — the standard split, but a split, not a fact.
    // Stage order, NOT film order: the Time Warp follows Sweet Transvestite here.
    form: 'two-act', year: 1973, region: 'westend',
    songs: [
      ['A1', 'opening',      'solo',  3],   // Science Fiction/Double Feature (narrator opening)
      ['A1', 'charm',        'duet',  2.5], // Dammit, Janet!
      ['A1', 'ballad',       'group', 3],   // Over at the Frankenstein Place
      ['A1', 'villain',      'group', 3.5], // Sweet Transvestite
      ['A1', 'production',   'group', 4.5], // The Time Warp
      ['A1', 'comedy',       'group', 2],   // The Sword of Damocles
      ['A1', 'production',   'group', 3.5], // I Can Make You a Man
      ['A2', 'production',   'group', 3],   // What Ever Happened to Saturday Night?
      ['A2', 'love',         'group', 3],   // Touch-a, Touch-a, Touch-a, Touch Me
      ['A2', 'ballad',       'solo',  3],   // Once in a While
      ['A2', 'comedy',       'group', 3],   // Eddie's Teddy
      ['A2', 'villain',      'group', 2.5], // Planet, Schmanet, Janet
      ['A2', 'production',   'group', 6],   // Rose Tint My World / Don't Dream It, Be It
      ['A2', 'eleven',       'solo',  3.5], // I'm Going Home
      ['A2', 'ballad',       'group', 3],   // Superheroes
      ['A2', 'finaleultimo', 'solo',  2],   // Science Fiction/Double Feature (Rep)
    ] },
};
