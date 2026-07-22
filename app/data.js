// Seed reference shows for the board shell. Each number is a compact tuple:
// [act, title, fn, voicing, estMinutes]
// Keys / BPM / exact runtimes intentionally omitted ("needs score").

// Default template applied to every new user project.
// 15 blank song cards placed in statistically typical act positions.
// Lane mapping: '1' = Act 1 (pre-break), '2A' = build to intermission,
// '2B' = post-intermission, '3' = late Act 2 through close.
// INTERMISSION marker renders between 2A and 2B.
const DEFAULT_TEMPLATE = [
  // ── Act 1: establish world, voice, first hook ───────────────────
  { act: '1',  type: 'song', title: '', fn: 'opening', voicing: '', min: 4   },
  { act: '1',  type: 'song', title: '', fn: 'charm',   voicing: '', min: 3   },
  { act: '1',  type: 'song', title: '', fn: 'iwant',   voicing: '', min: 3.5 },
  // ── Act 2A: complications deepen → threat crystallizes → cliffhanger
  { act: '2A', type: 'song', title: '', fn: 'comedy',  voicing: '', min: 2.5 },
  { act: '2A', type: 'song', title: '', fn: 'love',    voicing: '', min: 3.5 },
  { act: '2A', type: 'song', title: '', fn: 'villain', voicing: '', min: 2.5 },
  { act: '2A', type: 'song', title: '', fn: 'anthem',  voicing: '', min: 3.5 },
  { act: '2A', type: 'song', title: '', fn: 'finale',  voicing: '', min: 4   },
  // ── Act 2B: regroup → cost mounts → late-act drive ──────────────
  { act: '2B', type: 'song', title: '', fn: 'charm',      voicing: '', min: 3   },
  { act: '2B', type: 'song', title: '', fn: 'ballad',     voicing: '', min: 3.5 },
  { act: '2B', type: 'song', title: '', fn: 'reprise',    voicing: '', min: 2   },
  { act: '2B', type: 'song', title: '', fn: 'production', voicing: '', min: 4.5 },
  { act: '2B', type: 'song', title: '', fn: 'anthem',     voicing: '', min: 3.5 },
  // ── Act 3: climax → resolution ──────────────────────────────────
  { act: '3',  type: 'song', title: '', fn: 'eleven',       voicing: '', min: 4.5 },
  { act: '3',  type: 'song', title: '', fn: 'finaleultimo', voicing: '', min: 3   },
];

// Default template applied to every new Prose Plot novel. Chapters take the
// place of scenes (same card type, recontextualized — a thin vertical-text
// rectangle, coral instead of purple in this app). 30 chapters, spread across
// the same 4-lane spine Song Plot uses (bookend acts thinner, middle acts
// carrying the bulk of the plot), each opening with two blank beat cards to
// sketch before drafting prose.
const PROSE_CHAPTER_COUNTS = { '1': 6, '2A': 9, '2B': 9, '3': 6 };
const PROSE_TEMPLATE = (() => {
  const cards = [];
  let n = 0;
  ['1', '2A', '2B', '3'].forEach((act) => {
    for (let i = 0; i < PROSE_CHAPTER_COUNTS[act]; i++) {
      n++;
      cards.push({ act, type: 'scene', title: 'Chapter ' + n });
      cards.push({ act, type: 'beat', title: '', note: '', min: 1.5 });
      cards.push({ act, type: 'beat', title: '', note: '', min: 1.5 });
    }
  });
  return cards;
})();

const FN = {
  opening:      { fam: 'blue',   label: 'Opening' },
  iwant:        { fam: 'teal',   label: 'I Want' },
  charm:        { fam: 'amber',  label: 'Charm' },
  love:         { fam: 'pink',   label: 'Love' },
  production:   { fam: 'coral',  label: 'Production' },
  soliloquy:    { fam: 'purple', label: 'Soliloquy' },
  ballad:       { fam: 'purple', label: 'Ballad' },
  finale:       { fam: 'blue',   label: 'Act Finale' },
  eleven:       { fam: 'red',    label: "11 O'Clock" },
  reprise:      { fam: 'gray',   label: 'Reprise' },
  finaleultimo: { fam: 'green',  label: 'Finale' },
  villain:      { fam: 'red',    label: 'Villain' },
  comedy:       { fam: 'amber',  label: 'Comedy' },
  anthem:       { fam: 'coral',  label: 'Anthem' },
  diegetic:     { fam: 'gray',   label: 'Diegetic' },
  establishing: { fam: 'gray',   label: 'Establishing' },
  drive:        { fam: 'gray',   label: 'Plot' },
  motif:        { fam: 'green',  label: 'Motif' },
};


const SHOWS = {
  fiddler: {
    title: 'Fiddler on the Roof', year: 1964, form: 'two-act',
    teaches: 'Opening number ("Tradition") establishes world + rules',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'TEVYE': { voiceType: 'Baritone', desc: 'A poor dairyman in a Russian shtetl who bargains with God and clings to tradition as his daughters, one by one, marry outside it. The protagonist.' },
      'GOLDE': { voiceType: 'Alto', desc: "Tevye's sharp, weary wife, who has run the household for twenty-five years and never been asked whether she loves him." },
      'TZEITEL': { voiceType: 'Soprano', desc: "Tevye's eldest daughter, who defies the matchmaker to marry Motel, the poor tailor she loves." },
      'HODEL': { voiceType: 'Soprano', desc: "Tevye's second daughter, who falls for the radical student Perchik and follows him into Siberian exile." },
      'CHAVA': { voiceType: 'Soprano', desc: "Tevye's third daughter, who marries Fyedka, a Christian — a line Tevye cannot cross." },
      'MOTEL KAMZOIL': { voiceType: 'Tenor', desc: 'A timid, poor tailor who finds the courage to claim Tzeitel for himself — the first crack in tradition.' },
      'PERCHIK': { voiceType: 'Baritone', desc: 'A firebrand student from Kiev whose revolutionary ideas — and love for Hodel — upend the old ways.' },
      'LAZAR WOLF': { voiceType: 'Bass', desc: 'The wealthy widowed village butcher, the "good match" Tevye nearly forces on Tzeitel.' },
      'YENTE': { voiceType: 'Alto', desc: 'The village matchmaker; a comic font of gossip whose trade is quietly made obsolete.' },
    },
    titlePage: {
      subtitle: 'A Musical',
      authors: 'Music by Jerry Bock · Lyrics by Sheldon Harnick · Book by Joseph Stein · Based on the Sholem Aleichem stories',
      settings: ['Anatevka, a village in Tsarist Russia', '1905, on the eve of revolution', 'A Jewish shtetl bound by tradition'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. "Tradition" is the model opening number: it builds the world and its rules so that every later break from them lands.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'Anatevka — The Village' },
      { lane: '1', type: 'song', title: 'Tradition (Prologue)', fn: 'opening', voicing: 'Tevye + Company', min: 6.5 },
      { lane: '1', type: 'beat', title: 'The balance of tradition', note: 'Tevye introduces Anatevka and the customs that keep its precarious life in balance — papa, mama, sons, daughters, and the matchmaker.', min: 1.5 },
      { lane: '1', type: 'scene', title: "Tevye's House" },
      { lane: '1', type: 'song', title: 'Matchmaker, Matchmaker', fn: 'charm', voicing: 'Daughters', min: 3.5 },
      { lane: '1', type: 'beat', title: 'Three daughters of marrying age', note: "Tevye's eldest daughters dream of the matches Yente will make for them — and quietly dread them.", min: 1 },
      { lane: '1', type: 'song', title: 'If I Were a Rich Man', fn: 'iwant', voicing: 'Tevye', min: 4.5 },
      { lane: '1', type: 'beat', title: 'A match for Tzeitel', note: 'Yente proposes Lazar Wolf, the wealthy widowed butcher, for Tzeitel — who secretly loves Motel, the poor tailor.', min: 1 },
      { lane: '1', type: 'scene', title: 'The Sabbath Table' },
      { lane: '1', type: 'song', title: 'Sabbath Prayer', fn: 'ballad', voicing: 'Tevye, Golde, Co.', min: 2.5 },

      { lane: '2A', type: 'scene', title: 'The Village Inn' },
      { lane: '2A', type: 'beat', title: 'A deal over drinks', note: 'Tevye agrees to give Tzeitel to Lazar Wolf; men of both faiths drink to the match as Russian soldiers look on uneasily.', min: 1 },
      { lane: '2A', type: 'song', title: "To Life (L'Chaim)", fn: 'production', voicing: 'Tevye, Lazar, Men', min: 4 },
      { lane: '2A', type: 'beat', title: "Motel's courage", note: 'Tzeitel begs not to marry Lazar; Motel summons the nerve to ask Tevye for her hand himself. Stunned, Tevye relents — and tradition cracks.', min: 1.5 },
      { lane: '2A', type: 'song', title: 'Miracle of Miracles', fn: 'charm', voicing: 'Motel', min: 2.5 },
      { lane: '2A', type: 'scene', title: "Tevye and Golde's Bedroom" },
      { lane: '2A', type: 'song', title: 'The Dream', fn: 'production', voicing: 'Tevye, Golde, Ens.', min: 5 },
      { lane: '2A', type: 'beat', title: 'Selling the dream to Golde', note: 'Tevye invents a nightmare to convince the superstitious Golde that Tzeitel must marry Motel, not Lazar.', min: 1 },
      { lane: '2A', type: 'scene', title: 'The Wedding' },
      { lane: '2A', type: 'song', title: 'Sunrise, Sunset', fn: 'finale', voicing: 'Company', min: 4 },
      { lane: '2A', type: 'beat', title: 'The first crack', note: 'Tzeitel and Motel wed; Perchik dances with Hodel, breaking custom — and Russian constables disrupt the celebration with a small, ominous pogrom.', min: 1.5 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The Fields' },
      { lane: '2B', type: 'beat', title: 'Perchik and Hodel', note: 'Perchik, tutoring the family, falls in love with Hodel — and they choose each other, without a matchmaker and without permission.', min: 1 },
      { lane: '2B', type: 'song', title: 'Now I Have Everything', fn: 'love', voicing: 'Perchik, Hodel', min: 2.5 },
      { lane: '2B', type: 'beat', title: 'Permission, not blessing', note: 'Perchik and Hodel tell Tevye they are engaged. He wrestles with it — and consents.', min: 1 },
      { lane: '2B', type: 'scene', title: "Tevye's House" },
      { lane: '2B', type: 'song', title: 'Do You Love Me?', fn: 'love', voicing: 'Tevye, Golde', min: 3 },
      { lane: '2B', type: 'song', title: 'The Rumor', fn: 'comedy', voicing: 'Yente, Villagers', min: 1.5 },

      { lane: '3', type: 'scene', title: 'The Train Station' },
      { lane: '3', type: 'beat', title: 'Perchik arrested', note: 'Perchik is seized for revolutionary activity and sent to Siberia; Hodel resolves to follow him into exile.', min: 1 },
      { lane: '3', type: 'song', title: 'Far From the Home I Love', fn: 'ballad', voicing: 'Hodel', min: 3 },
      { lane: '3', type: 'beat', title: 'Chava and Fyedka', note: 'Chava marries Fyedka, a young Christian. This is the line Tevye cannot cross — he declares her dead to him.', min: 1.5 },
      { lane: '3', type: 'song', title: 'Chavaleh (Little Bird)', fn: 'soliloquy', voicing: 'Tevye', min: 2 },
      { lane: '3', type: 'scene', title: 'Anatevka — The Edict' },
      { lane: '3', type: 'beat', title: 'Expelled', note: 'The Tsar orders the Jews to leave Anatevka within three days. The village scatters to the corners of the earth.', min: 1 },
      { lane: '3', type: 'song', title: 'Anatevka', fn: 'finaleultimo', voicing: 'Company', min: 3 },
    ],
  },
  gypsy: {
    title: 'Gypsy', year: 1959, form: 'two-act',
    teaches: 'The definitive 11 o\'clock number + driving Act 1 finale',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ROSE': { voiceType: 'Mezzo-Soprano', desc: 'The ultimate stage mother, pouring her own thwarted ambition into her daughters\' vaudeville act. One of the great belt roles; she drives the entire show.' },
      'LOUISE': { voiceType: 'Mezzo-Soprano', desc: "Rose's overlooked elder daughter, who endures in June's shadow — then reinvents herself as the elegant star stripper Gypsy Rose Lee." },
      'JUNE': { voiceType: 'Soprano', desc: "Rose's favored, talented younger daughter (\"Baby June,\" then \"Dainty June\"), who finally escapes the act by eloping." },
      'HERBIE': { voiceType: 'Baritone', desc: "A gentle former agent who loves Rose and manages the act — and who finally walks away when her ambition leaves no room for him." },
      'TULSA': { voiceType: 'Tenor', desc: 'A dancer in the act with a secret solo routine of his own; he runs off to marry June.' },
      'TESSIE, MAZEPPA & ELECTRA': { voiceType: 'Alto', desc: 'A trio of veteran burlesque strippers who school Louise in the one rule of the trade: you gotta have a gimmick.' },
    },
    titlePage: {
      subtitle: 'A Musical Fable',
      authors: 'Music by Jule Styne · Lyrics by Stephen Sondheim · Book by Arthur Laurents · Suggested by the memoirs of Gypsy Rose Lee',
      settings: ['Vaudeville circuits across America', 'The 1920s–1930s, as vaudeville dies and burlesque rises', 'Backstage, from Seattle to New York'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Note the diegetic "act-within-the-act" numbers, and "Rose\'s Turn" as the definitive 11 o\'clock breakdown.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'A Vaudeville Stage — Seattle' },
      { lane: '1', type: 'song', title: 'Let Me Entertain You (kiddie)', fn: 'diegetic', voicing: 'Baby June & Louise', min: 2 },
      { lane: '1', type: 'beat', title: 'Mama Rose takes over', note: "Stage mother Rose storms the audition, seizing control of her daughters' kiddie act — and of everyone in its path.", min: 1 },
      { lane: '1', type: 'song', title: 'Some People', fn: 'iwant', voicing: 'Rose', min: 3.5 },
      { lane: '1', type: 'beat', title: 'Enter Herbie', note: 'Rose charms candy salesman Herbie into becoming the act\'s agent — and very nearly her husband.', min: 1 },
      { lane: '1', type: 'song', title: 'Small World', fn: 'love', voicing: 'Rose, Herbie', min: 2.5 },
      { lane: '1', type: 'scene', title: 'On the Road' },
      { lane: '1', type: 'song', title: 'Baby June and Her Newsboys', fn: 'diegetic', voicing: 'Baby June + kids', min: 2 },
      { lane: '1', type: 'song', title: 'Mr. Goldstone, I Love You', fn: 'comedy', voicing: 'Rose, Company', min: 2.5 },
      { lane: '1', type: 'beat', title: "Louise in June's shadow", note: 'Overlooked behind her dazzling sister, Louise quietly marks her own birthday alone with a stray lamb from the act.', min: 0.5 },
      { lane: '1', type: 'song', title: 'Little Lamb', fn: 'soliloquy', voicing: 'Louise', min: 2 },

      { lane: '2A', type: 'song', title: "You'll Never Get Away from Me", fn: 'love', voicing: 'Rose, Herbie', min: 2.5 },
      { lane: '2A', type: 'scene', title: 'A Bigger Stage — Years Later' },
      { lane: '2A', type: 'song', title: 'Dainty June and Her Farmboys', fn: 'diegetic', voicing: 'June + Company', min: 3 },
      { lane: '2A', type: 'beat', title: 'The act never changes', note: 'The girls have grown but Rose still bills them as children. June chafes; Louise endures.', min: 1 },
      { lane: '2A', type: 'song', title: 'If Momma Was Married', fn: 'charm', voicing: 'June, Louise', min: 3 },
      { lane: '2A', type: 'beat', title: "Tulsa's secret", note: 'Louise catches the dancer Tulsa rehearsing a solo act of his own — and a tender crush flickers.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'All I Need Is the Girl', fn: 'charm', voicing: 'Tulsa', min: 4 },
      { lane: '2A', type: 'beat', title: 'June elopes', note: 'June runs off to marry Tulsa, shattering the act. Everyone tells Rose to quit — so instead she turns all her thwarted ambition onto Louise.', min: 1.5 },
      { lane: '2A', type: 'song', title: "Everything's Coming Up Roses", fn: 'finale', voicing: 'Rose', min: 3.5 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'Rebuilding the Act' },
      { lane: '2B', type: 'song', title: "Madame Rose's Toreadorables", fn: 'diegetic', voicing: 'Rose, Louise, Co.', min: 2 },
      { lane: '2B', type: 'beat', title: 'A family on the ropes', note: 'Vaudeville is dying and bookings dry up. Rose clings to Herbie and Louise as the only act she has left.', min: 1 },
      { lane: '2B', type: 'song', title: 'Together Wherever We Go', fn: 'charm', voicing: 'Rose, Herbie, Louise', min: 3 },
      { lane: '2B', type: 'scene', title: 'A Burlesque House — Wichita' },
      { lane: '2B', type: 'beat', title: 'Booked into burlesque', note: 'By accident, Rose has booked the act into a burlesque house — the bottom rung, where the strippers rule.', min: 1 },
      { lane: '2B', type: 'song', title: 'You Gotta Get a Gimmick', fn: 'comedy', voicing: 'Tessie, Mazeppa, Electra', min: 4 },

      { lane: '3', type: 'beat', title: 'Louise takes the stage', note: 'When the star stripper is arrested, Rose volunteers Louise. Terrified, she steps out under the lights — and discovers her own power.', min: 1 },
      { lane: '3', type: 'song', title: 'Let Me Entertain You (strip)', fn: 'diegetic', voicing: 'Louise / Gypsy', min: 3.5 },
      { lane: '3', type: 'beat', title: 'Gypsy Rose Lee, and the cost', note: 'Louise becomes the elegant, untouchable star "Gypsy Rose Lee," outgrowing her mother. Herbie leaves; Rose is left with nothing she built.', min: 1.5 },
      { lane: '3', type: 'song', title: "Rose's Turn", fn: 'eleven', voicing: 'Rose', min: 4.5 },
    ],
  },
  newsies: {
    title: 'Newsies', year: 2012, form: 'two-act',
    teaches: 'Anthem + ensemble production numbers; high-energy contemporary',
    numbers: [
      [1, 'Santa Fe (Prologue)', 'iwant', 'Jack, Crutchie', 2, 4, 3],
      [1, 'Carrying the Banner', 'opening', 'Jack, Davey, Newsies', 4.5, 8, 3],
      [1, 'The Bottom Line', 'villain', 'Pulitzer + cronies', 2.5, 5, 5],
      [1, 'That\'s Rich', 'diegetic', 'Medda Larkin', 2.5, 6, 2],
      [1, 'I Never Planned on You', 'charm', 'Jack, Bowery Beauties', 3, 5, 3],
      [1, 'The World Will Know', 'anthem', 'Jack, Davey, Les, Newsies', 3.5, 8, 6],
      [1, 'Watch What Happens', 'iwant', 'Katherine', 2.5, 5, 4],
      [1, 'Seize the Day', 'production', 'Davey, Jack, Les, Newsies', 4.5, 9, 6],
      [1, 'Santa Fe', 'finale', 'Jack', 4, 7, 7],
      [2, 'King of New York', 'production', 'Davey, Katherine, Les, Newsies', 4.5, 9, 4],
      [2, 'Letter from the Refuge', 'ballad', 'Crutchie', 2.5, 3, 6],
      [2, 'Watch What Happens (Reprise)', 'reprise', 'Jack, Davey, Les, Katherine', 1.5, 5, 6],
      [2, 'Brooklyn\'s Here', 'production', 'Spot Conlon, Newsies', 2.5, 8, 6],
      [2, 'Something to Believe In', 'love', 'Jack, Katherine', 3.5, 4, 5],
      [2, 'Once and for All', 'anthem', 'Jack, Katherine, Davey, Newsies', 3.5, 8, 8],
      [2, 'Finale (Santa Fe reprise)', 'finaleultimo', 'Company', 2, 7, 3],
    ],
    // Full scene-by-scene story: 16 songs + ~38 book-scene beats, hand-placed lanes.
    // Break into 2 = "The World Will Know"; intermission after "Santa Fe";
    // Break into 3 (Act 3 start) = "Brooklyn's Here".
    cards: [
      // ACT 1
      { lane: '1', type: 'scene', title: 'Brooklyn Rooftop' },
      { lane: '1', type: 'song', title: 'Santa Fe (Prologue)', fn: 'iwant', voicing: 'Jack, Crutchie', min: 2 },
      { lane: '1', type: 'beat', title: 'Rooftop at dawn', note: 'Jack sketches the Santa Fe dream; Crutchie\'s bad leg, his loyalty', min: 1.5 },
      { lane: '1', type: 'scene', title: 'Streets of Manhattan' },
      { lane: '1', type: 'song', title: 'Carrying the Banner', fn: 'opening', voicing: 'Jack, Newsies', min: 4.5 },
      { lane: '1', type: 'beat', title: 'The distribution gates', note: 'Wiesel and the Delanceys hawk the papes; Davey and Les arrive needing to earn', min: 1.5 },
      { lane: '1', type: 'beat', title: 'Jack takes the boys in', note: 'He teaches Davey & Les to sell — and sizes up his new partners', min: 1.5 },
      { lane: '1', type: 'scene', title: "Pulitzer's Office" },
      { lane: '1', type: 'song', title: 'The Bottom Line', fn: 'villain', voicing: 'Pulitzer + cronies', min: 2.5 },
      { lane: '1', type: 'beat', title: 'The price hike hits', note: 'The World ups the price 10¢ per hundred; Davey names it — they\'re being robbed', min: 1.5 },
      { lane: '1', type: 'beat', title: 'Scuffle at the gates', note: 'The Delanceys shove Les; Jack steps in; the boys duck into Medda\'s', min: 1.5 },
      { lane: '1', type: 'scene', title: "Medda's Theater" },
      { lane: '1', type: 'song', title: "That's Rich", fn: 'diegetic', voicing: 'Medda Larkin', min: 2.5 },
      { lane: '1', type: 'beat', title: 'Jack meets Katherine', note: 'Sparks in the wings with the young reporter; he sketches her', min: 1.5 },
      { lane: '1', type: 'song', title: 'I Never Planned on You', fn: 'charm', voicing: 'Jack', min: 3 },
      { lane: '1', type: 'beat', title: 'The idea: a strike', note: 'Jack pitches it; Davey the reluctant brains signs on', min: 1.5 },
      // ACT 2A
      { lane: '2A', type: 'scene', title: 'Newsies Square' },
      { lane: '2A', type: 'song', title: 'The World Will Know', fn: 'anthem', voicing: 'Jack, Davey, Les, Newsies', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'Forming the union', note: 'The newsies organize and name Jack & Davey their leaders', min: 1.5 },
      { lane: '2A', type: 'scene', title: 'The Sun — City Room' },
      { lane: '2A', type: 'beat', title: 'Katherine smells a story', note: 'She pitches the strike to her skeptical editor', min: 1.5 },
      { lane: '2A', type: 'song', title: 'Watch What Happens', fn: 'iwant', voicing: 'Katherine', min: 2.5 },
      { lane: '2A', type: 'scene', title: 'Distribution Gates — Strike Day' },
      { lane: '2A', type: 'beat', title: 'Strike morning', note: 'The newsies mass at the distribution window and refuse to sell', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'The scabs arrive', note: 'Wiesel brings in replacement boys to sell the papes', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'Winning over the scabs', note: 'The newsies argue, shame, and welcome the scabs into the cause', min: 2 },
      { lane: '2A', type: 'song', title: 'Seize the Day', fn: 'production', voicing: 'Davey, Jack, Les, Newsies', min: 4.5 },
      { lane: '2A', type: 'beat', title: 'The crackdown', note: 'The Delanceys and police charge; the rally erupts into a riot', min: 2 },
      { lane: '2A', type: 'beat', title: 'Crutchie is taken', note: 'Snyder\'s men beat Crutchie and drag him to the Refuge', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'Jack runs', note: 'Alone on the rooftop, blaming himself, watching the city', min: 1 },
      { lane: '2A', type: 'song', title: 'Santa Fe', fn: 'finale', voicing: 'Jack', min: 4 },
      // ACT 2B
      { lane: '2B', type: 'scene', title: 'Newsies Lodging House' },
      { lane: '2B', type: 'beat', title: 'Front page', note: 'The strike is the talk of the city; the newsies are famous', min: 1.5 },
      { lane: '2B', type: 'song', title: 'King of New York', fn: 'production', voicing: 'Davey, Katherine, Les, Newsies', min: 4.5 },
      { lane: '2B', type: 'scene', title: "Medda's — Backstage" },
      { lane: '2B', type: 'beat', title: 'Jack in hiding', note: 'Painting backdrops at Medda\'s, done with the fight', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'Katherine pushes back', note: 'She refuses to let him quit', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'At the Refuge', note: 'Crutchie, hurting but unbroken, dreams of Jack and Santa Fe', min: 1 },
      { lane: '2B', type: 'song', title: 'Letter from the Refuge', fn: 'ballad', voicing: 'Crutchie', min: 2.5 },
      { lane: '2B', type: 'beat', title: "Katherine's secret", note: 'She\'s Pulitzer\'s daughter; trust wobbles', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'The plan', note: 'Rally every working kid in New York; beat Pulitzer with his own press', min: 1.5 },
      { lane: '2B', type: 'song', title: 'Watch What Happens (Reprise)', fn: 'reprise', voicing: 'Jack, Davey, Les, Katherine', min: 1.5 },
      { lane: '2B', type: 'scene', title: "Pulitzer's Office" },
      { lane: '2B', type: 'beat', title: 'Summoned by Pulitzer', note: 'Jack is hauled before Pulitzer; Snyder waits in the office', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'The bribe', note: 'Money and freedom from the Refuge if Jack calls off the strike', min: 2 },
      { lane: '2B', type: 'beat', title: 'Jack folds', note: 'Publicly he tells the boys to give up; the cause looks dead — all is lost', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'Betrayed', note: 'Davey and the newsies turn on Jack; Katherine won\'t quit', min: 1.5 },
      // ACT 3
      { lane: '3', type: 'scene', title: 'The Streets — Midtown' },
      { lane: '3', type: 'song', title: "Brooklyn's Here", fn: 'production', voicing: 'Spot Conlon, Newsies', min: 2.5 },
      { lane: '3', type: 'beat', title: 'Jack recommits', note: 'Katherine shows him the way; the cellar printing plan', min: 1.5 },
      { lane: '3', type: 'song', title: 'Something to Believe In', fn: 'love', voicing: 'Jack, Katherine', min: 3.5 },
      { lane: '3', type: 'scene', title: "The World's Press Room" },
      { lane: '3', type: 'beat', title: 'Printing the Banner', note: 'Overnight, in the World\'s own cellar, they print their paper', min: 2 },
      { lane: '3', type: 'beat', title: 'The city rises', note: 'Every working kid in New York reads the call to strike', min: 1.5 },
      { lane: '3', type: 'song', title: 'Once and for All', fn: 'anthem', voicing: 'Jack, Katherine, Davey, Newsies', min: 3.5 },
      { lane: '3', type: 'beat', title: 'Roosevelt arrives', note: 'Jack\'s Refuge drawings expose Snyder; the Governor intervenes', min: 2 },
      { lane: '3', type: 'beat', title: 'Pulitzer concedes', note: 'Snyder arrested, Crutchie freed, the price rolled back', min: 1.5 },
      { lane: '3', type: 'beat', title: 'Jack stays', note: 'He chooses New York, Katherine, and the newsies over Santa Fe', min: 1.5 },
      { lane: '3', type: 'song', title: 'Finale (Santa Fe reprise)', fn: 'finaleultimo', voicing: 'Company', min: 2 },
    ],
  },
  evanhansen: {
    title: 'Dear Evan Hansen', year: 2015, form: 'two-act',
    teaches: 'Contemporary intimate pop; a small lie as engine; the Act 1 finale that goes viral',
    // ENRICHED reference (2026-06-23): the flagship study object — full scene/beat
    // scaffolding, character registry, and title page authored from public synopsis
    // and the documented running order. No lyrics are reproduced anywhere (the
    // manuscript shows structure + cue lines only). Runtimes are interpretive
    // ballparks; keys/tempo are "needs score" and left unset.
    characters: {
      'EVAN HANSEN': { voiceType: 'Tenor', desc: 'Anxious, isolated high-school senior; the protagonist whose small lie spirals out of his control.' },
      'HEIDI HANSEN': { voiceType: 'Mezzo-Soprano', desc: "Evan's mother; a nurse's aide studying law on the side. Stretched thin, perpetually absent, fiercely loving single parent." },
      'ZOE MURPHY': { voiceType: 'Mezzo-Soprano', desc: "Connor's younger sister. Clear-eyed and guarded; a musician. Evan's love interest, unwilling to mourn the brother who frightened her." },
      'CONNOR MURPHY': { voiceType: 'Tenor', desc: 'A troubled, angry classmate whose death by suicide sets the story in motion. Returns as the confident, imagined version Evan invents.' },
      'CYNTHIA MURPHY': { voiceType: 'Mezzo-Soprano', desc: "Connor and Zoe's mother. Desperate to believe her son was loved and known; seizes on Evan as proof." },
      'LARRY MURPHY': { voiceType: 'Baritone', desc: "Connor and Zoe's father. Reserved, practical, grieving a son he could never reach — and drawn to Evan as a surrogate." },
      'JARED KLEINMAN': { voiceType: 'Tenor', desc: "Evan's sardonic \"family friend.\" Forges the backlog of fake emails for laughs, then watches the lie metastasize." },
      'ALANA BECK': { voiceType: 'Mezzo-Soprano', desc: 'An over-involved, lonely overachiever who founds and drives the Connor Project, hungry to matter.' },
    },
    titlePage: {
      subtitle: 'A New Musical',
      authors: 'Music & Lyrics by Benj Pasek & Justin Paul · Book by Steven Levenson',
      settings: ['The present day', 'A suburban American town', 'The Hansen home, the Murphy home, and the high school'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Contains mature themes: teen suicide, mental health, social anxiety.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'The Hansen Kitchen / The Murphy Kitchen' },
      { lane: '1', type: 'song', title: 'Anybody Have a Map?', fn: 'opening', voicing: 'Heidi, Cynthia', min: 2.5 },
      { lane: '1', type: 'beat', title: 'Two mothers, two mornings', note: 'Heidi and Cynthia each try and fail to reach their sons before school — establishing the parallel broken households.', min: 1.5 },
      { lane: '1', type: 'beat', title: "The therapy-letter assignment", note: "Evan's therapist has him write a daily pep-talk letter to himself. The letter device that will drive the whole plot is planted here.", min: 1 },
      { lane: '1', type: 'scene', title: 'High School — First Day Back' },
      { lane: '1', type: 'beat', title: 'Invisible in the halls', note: "Arm in a cast, Evan can't get anyone to sign it. Jared needles him, Alana barely remembers him — total social erasure.", min: 1.5 },
      { lane: '1', type: 'song', title: 'Waving Through a Window', fn: 'iwant', voicing: 'Evan, Company', min: 3.5 },
      { lane: '1', type: 'scene', title: 'The Computer Lab' },
      { lane: '1', type: 'beat', title: 'Connor signs the cast', note: "After a hallway blow-up, Connor signs Evan's cast — a hostile joke that still lands as the only contact Evan gets all day.", min: 1.5 },
      { lane: '1', type: 'beat', title: 'The letter is taken', note: "Connor finds Evan's printed therapy letter (it names Zoe) and pockets it, certain Evan wrote it to mock him.", min: 1 },
      { lane: '1', type: 'scene', title: 'The Murphy Home — A Few Days Later' },
      { lane: '1', type: 'beat', title: "Connor's death", note: "The Murphys learn Connor has taken his own life. The letter is found on him and mistaken for his suicide note — addressed, it seems, to Evan.", min: 1.5 },
      { lane: '1', type: 'beat', title: 'The misunderstanding', note: 'Cynthia and Larry believe Evan was Connor’s secret best friend. Panicking, Evan fails to correct them — and the lie is born.', min: 1.5 },
      { lane: '1', type: 'song', title: 'For Forever', fn: 'charm', voicing: 'Evan', min: 3.5 },
      { lane: '1', type: 'beat', title: 'Inventing a friendship', note: 'To comfort the grieving Murphys, Evan fabricates a perfect afternoon he and Connor never shared. The lie becomes beautiful — and irresistible.', min: 1 },
      { lane: '2A', type: 'scene', title: "Evan's Bedroom" },
      { lane: '2A', type: 'beat', title: 'Backfilling the lie', note: 'To make the friendship believable, Evan enlists Jared to forge a backlog of emails between him and Connor.', min: 1.5 },
      { lane: '2A', type: 'song', title: 'Sincerely, Me', fn: 'comedy', voicing: 'Evan, Jared, Connor', min: 3.5 },

      { lane: '2A', type: 'scene', title: 'The Murphy Living Room' },
      { lane: '2A', type: 'song', title: 'Requiem', fn: 'ballad', voicing: 'Zoe, Cynthia, Larry', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'Three kinds of grief', note: 'Cynthia clings to the myth of a good son; Larry stays guarded; Zoe refuses to mourn a brother who frightened her. The family fractures along the lie.', min: 1.5 },
      { lane: '2A', type: 'scene', title: 'The Murphy House — Later' },
      { lane: '2A', type: 'beat', title: 'Evan offers Zoe "proof"', note: 'Drawn to Zoe, Evan gives her evidence that Connor secretly loved her — words he is really inventing.', min: 1.5 },
      { lane: '2A', type: 'song', title: 'If I Could Tell Her', fn: 'love', voicing: 'Evan, Zoe', min: 3.5 },
      { lane: '2A', type: 'beat', title: "Evan's feelings in Connor's mouth", note: 'Every tender observation Evan attributes to Connor is his own. The lie and the truth fuse — Evan courts Zoe through her dead brother.', min: 1 },
      { lane: '2A', type: 'scene', title: 'The School — The Connor Project Forms' },
      { lane: '2A', type: 'beat', title: 'Alana drives the cause', note: 'Alana and Jared propose a project to keep Connor’s memory alive; Evan is pushed reluctantly to the center of it.', min: 1.5 },
      { lane: '2A', type: 'song', title: 'Disappear', fn: 'anthem', voicing: 'Connor, Evan, Company', min: 3.5 },
      { lane: '2A', type: 'beat', title: '"No one deserves to disappear"', note: "The imagined Connor hands Evan the mission and the slogan that will go viral. Evan's invisibility becomes a movement.", min: 1 },
      { lane: '2A', type: 'scene', title: 'The Connor Project Assembly' },
      { lane: '2A', type: 'beat', title: 'The speech', note: 'Evan freezes at the podium, then finds the words — speaking, really, about his own loneliness and longing to be found.', min: 1.5 },
      { lane: '2A', type: 'song', title: 'You Will Be Found', fn: 'finale', voicing: 'Evan, Alana, Jared, Zoe, Company', min: 4.5 },
      { lane: '2A', type: 'beat', title: 'It goes viral', note: 'The speech explodes online; strangers share it; Evan is suddenly seen by everyone. The Act One curtain — built entirely on a lie.', min: 1 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: "Evan's Bedroom — The Project Grows" },
      { lane: '2B', type: 'song', title: 'Sincerely, Me (Reprise)', fn: 'reprise', voicing: 'Jared, Connor, Evan', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'Feeding the machine', note: 'The fabricated emails keep multiplying to sustain the Connor Project as it balloons beyond Evan’s control.', min: 1 },
      { lane: '2B', type: 'scene', title: 'The Murphy Home — The Study' },
      { lane: '2B', type: 'beat', title: 'A surrogate son', note: 'Larry, who never connected with Connor, begins to connect with Evan instead.', min: 1.5 },
      { lane: '2B', type: 'song', title: 'To Break in a Glove', fn: 'charm', voicing: 'Larry, Evan', min: 3.5 },
      { lane: '2B', type: 'scene', title: 'The Orchard' },
      { lane: '2B', type: 'beat', title: 'Real, for a moment', note: "Evan and Zoe alone. For the first time the connection isn't borrowed from the lie — it's actually theirs.", min: 1.5 },
      { lane: '2B', type: 'song', title: 'Only Us', fn: 'love', voicing: 'Zoe, Evan', min: 3.5 },
      { lane: '2B', type: 'scene', title: 'The Hansen Kitchen' },
      { lane: '2B', type: 'beat', title: 'Heidi on the outside', note: 'Evan’s mother sees how much of her son now belongs to the Murphys — and finds the viral speech online, blindsided.', min: 1.5 },
      { lane: '2B', type: 'song', title: 'Good for You', fn: 'drive', voicing: 'Heidi, Alana, Jared, Evan', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'The walls close in', note: 'Heidi, Alana, and Jared each turn on Evan as the contradictions surface. The lie starts to come apart.', min: 1.5 },

      { lane: '3', type: 'beat', title: 'The point of no return', note: 'The Murphys plan to make the (fake) email archive public. Evan must finally tell the truth or let the lie become permanent.', min: 1.5 },
      { lane: '3', type: 'scene', title: 'The Murphy Living Room' },
      { lane: '3', type: 'beat', title: 'Telling the truth', note: 'Evan confesses to the Murphys that he and Connor were never friends — that he invented all of it.', min: 1.5 },
      { lane: '3', type: 'song', title: 'Words Fail', fn: 'eleven', voicing: 'Evan', min: 4 },
      { lane: '3', type: 'beat', title: 'The reckoning', note: "Stripped of the story, Evan faces what he did and why he needed it. The show's 11 o'clock number — the bottom.", min: 1 },
      { lane: '3', type: 'scene', title: 'The Hansen Kitchen' },
      { lane: '3', type: 'beat', title: 'Mother and son', note: "Heidi doesn't rage. She tells Evan about the night his father left — and promises she will not.", min: 1.5 },
      { lane: '3', type: 'song', title: 'So Big / So Small', fn: 'ballad', voicing: 'Heidi', min: 3 },
      { lane: '3', type: 'scene', title: 'The Orchard — One Year Later' },
      { lane: '3', type: 'beat', title: 'Aftermath and repair', note: 'Evan has come clean; the Connor Project endures honestly. He has spent the year learning who he is without the lie.', min: 1.5 },
      { lane: '3', type: 'beat', title: 'Reconciliation', note: 'Zoe meets him again, changed. She forgives without reuniting — and Evan, at last, is seen as himself.', min: 1 },
      { lane: '3', type: 'song', title: 'Finale (You Will Be Found reprise)', fn: 'finaleultimo', voicing: 'Company', min: 3 },
    ],
  },
  hamilton: {
    title: 'Hamilton', year: 2015, form: 'two-act',
    teaches: 'Through-composition + motif density; delayed payoff',
    // ENRICHED reference (2026-06-23): converted from the song-list format to the
    // full scene/beat/character scaffold. Hamilton is through-composed, so beats
    // capture the narrative connective tissue the score compresses into the songs.
    // No lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ALEXANDER HAMILTON': { voiceType: 'Tenor', desc: 'The protagonist: an orphaned Caribbean immigrant whose relentless writing and ambition carry him from nothing to the founding of a nation — and to his own undoing.' },
      'AARON BURR': { voiceType: 'Baritone', desc: 'The narrator and antagonist. Hamilton\'s mirror-image foil: where Hamilton acts, Burr waits. His patience curdles into the rivalry that ends in the duel.' },
      'ELIZA HAMILTON': { voiceType: 'Soprano', desc: 'Hamilton\'s wife, the story\'s moral center. Loving and wronged, she ultimately becomes the one who tells his story.' },
      'ANGELICA SCHUYLER': { voiceType: 'Mezzo-Soprano', desc: 'Eliza\'s razor-sharp older sister. In love with Hamilton herself, she gives him up for her sister\'s happiness.' },
      'GEORGE WASHINGTON': { voiceType: 'Bass', desc: 'The general, then first president. Hamilton\'s mentor and conscience, who knows that history has its eyes on him.' },
      'THOMAS JEFFERSON': { voiceType: 'Tenor', desc: 'Hamilton\'s flamboyant political rival in Act Two. Played by the same actor as the Marquis de Lafayette — the Act 1/Act 2 doubling that recasts an ally as an adversary.' },
      'JAMES MADISON': { voiceType: 'Baritone', desc: 'Jefferson\'s soft-spoken ally against Hamilton. Doubled with Hercules Mulligan, Hamilton\'s revolutionary friend of Act One.' },
      'JOHN LAURENS': { voiceType: 'Tenor', desc: 'Hamilton\'s idealistic abolitionist friend in the Revolution. Doubled with Philip Hamilton, Hamilton\'s son, in Act Two — the same face for the boy he fights for and the son he loses.' },
      'KING GEORGE III': { voiceType: 'Tenor', desc: 'The spurned monarch: a recurring comic antagonist who watches the colonies, then the young republic, from across the ocean.' },
      'MARIA REYNOLDS': { voiceType: 'Mezzo-Soprano', desc: 'The woman in Hamilton\'s affair, and the lever of his public ruin. Doubled with the youngest sister, Peggy Schuyler.' },
    },
    titlePage: {
      subtitle: 'An American Musical',
      authors: 'Book, Music & Lyrics by Lin-Manuel Miranda · Inspired by Ron Chernow\'s biography',
      settings: ['New York and the United States', '1776–1804', 'The American Revolution and the early Republic'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Note the deliberate ensemble doubling (Lafayette/Jefferson, Mulligan/Madison, Laurens/Philip, Peggy/Maria) that splits the cast across the two acts.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'New York City — 1776' },
      { lane: '1', type: 'song', title: 'Alexander Hamilton', fn: 'opening', voicing: 'Company', min: 4 },
      { lane: '1', type: 'beat', title: "The orphan's arrival", note: "The company narrates Hamilton's brutal Caribbean childhood and his arrival in New York — penniless, brilliant, and starving to rise.", min: 1 },
      { lane: '1', type: 'scene', title: 'A Tavern Downtown' },
      { lane: '1', type: 'song', title: 'Aaron Burr, Sir', fn: 'establishing', voicing: 'Burr, Hamilton +3', min: 2.5 },
      { lane: '1', type: 'beat', title: 'Hamilton meets his foils', note: "Burr counsels him to talk less and smile more; Laurens, Mulligan, and Lafayette pull him the opposite way — toward revolution.", min: 1 },
      { lane: '1', type: 'song', title: 'My Shot', fn: 'iwant', voicing: 'Hamilton +3', min: 5.5 },
      { lane: '1', type: 'song', title: 'The Story of Tonight', fn: 'anthem', voicing: 'Hamilton + friends', min: 2 },
      { lane: '1', type: 'scene', title: 'The Schuyler Sisters in Town' },
      { lane: '1', type: 'song', title: 'The Schuyler Sisters', fn: 'production', voicing: 'Angelica, Eliza, Peggy, Burr', min: 3 },
      { lane: '1', type: 'song', title: 'Farmer Refuted', fn: 'comedy', voicing: 'Seabury, Hamilton', min: 2 },
      { lane: '1', type: 'song', title: "You'll Be Back", fn: 'villain', voicing: 'King George', min: 3.5 },
      { lane: '1', type: 'beat', title: 'War comes', note: 'The Revolution erupts. Hamilton chases a battlefield command and the chance to make his name in history.', min: 1 },
      { lane: '1', type: 'scene', title: "Washington's Headquarters" },
      { lane: '1', type: 'song', title: 'Right Hand Man', fn: 'production', voicing: 'Washington, Hamilton, Burr', min: 5 },
      { lane: '1', type: 'scene', title: 'A Winter Ball' },
      { lane: '1', type: 'song', title: "A Winter's Ball", fn: 'charm', voicing: 'Burr, Hamilton', min: 1.5 },
      { lane: '1', type: 'song', title: 'Helpless', fn: 'love', voicing: 'Eliza, Company', min: 4 },
      { lane: '1', type: 'song', title: 'Satisfied', fn: 'love', voicing: 'Angelica, Company', min: 5.5 },
      { lane: '1', type: 'beat', title: "Angelica's sacrifice", note: 'Angelica rewinds the same night from her own eyes — the spark with Hamilton she set aside so Eliza could be happy.', min: 1 },

      { lane: '2A', type: 'song', title: 'The Story of Tonight (Reprise)', fn: 'reprise', voicing: 'Friends, Burr', min: 1.5 },
      { lane: '2A', type: 'song', title: 'Wait for It', fn: 'iwant', voicing: 'Burr', min: 3.5 },
      { lane: '2A', type: 'scene', title: 'The Battlefield' },
      { lane: '2A', type: 'song', title: 'Stay Alive', fn: 'drive', voicing: 'Hamilton, Washington, Co.', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'Charles Lee disgraced', note: 'Lee badmouths Washington after a botched retreat; Laurens challenges him to a duel.', min: 1 },
      { lane: '2A', type: 'song', title: 'Ten Duel Commandments', fn: 'motif', voicing: 'Company', min: 2.5 },
      { lane: '2A', type: 'song', title: 'Meet Me Inside', fn: 'drive', voicing: 'Hamilton, Washington', min: 2 },
      { lane: '2A', type: 'beat', title: 'Sent home', note: 'Washington benches his insubordinate aide and sends Hamilton back to Eliza.', min: 1 },
      { lane: '2A', type: 'song', title: 'That Would Be Enough', fn: 'ballad', voicing: 'Eliza, Hamilton', min: 3 },
      { lane: '2A', type: 'scene', title: 'The Final Campaign' },
      { lane: '2A', type: 'song', title: 'Guns and Ships', fn: 'production', voicing: 'Lafayette, Washington, Co.', min: 2.5 },
      { lane: '2A', type: 'song', title: 'History Has Its Eyes on You', fn: 'anthem', voicing: 'Washington', min: 2.5 },
      { lane: '2A', type: 'song', title: 'Yorktown (The World Turned Upside Down)', fn: 'production', voicing: 'Company', min: 4 },
      { lane: '2A', type: 'beat', title: 'The war is won', note: 'Yorktown falls; the revolutionaries win their independence.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'What Comes Next?', fn: 'villain', voicing: 'King George', min: 2 },
      { lane: '2A', type: 'scene', title: 'A New Nation' },
      { lane: '2A', type: 'song', title: 'Dear Theodosia', fn: 'ballad', voicing: 'Burr, Hamilton', min: 3 },
      { lane: '2A', type: 'beat', title: "Hamilton's ascent", note: 'Peace opens a new fight. Hamilton writes his way toward power — studying law, drafting the Constitution — while Eliza begs him to slow down.', min: 1 },
      { lane: '2A', type: 'song', title: 'Non-Stop', fn: 'finale', voicing: 'Company', min: 6 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The New Government — 1789' },
      { lane: '2B', type: 'song', title: "What'd I Miss", fn: 'charm', voicing: 'Jefferson, Company', min: 4 },
      { lane: '2B', type: 'song', title: 'Cabinet Battle #1', fn: 'production', voicing: 'Washington, Jefferson, Hamilton', min: 3 },
      { lane: '2B', type: 'scene', title: 'The Hamilton Home' },
      { lane: '2B', type: 'song', title: 'Take a Break', fn: 'charm', voicing: 'Eliza, Angelica, Philip, Hamilton', min: 4.5 },
      { lane: '2B', type: 'beat', title: 'Eliza asks him to come away', note: 'Eliza and Angelica plead with Hamilton to leave the city for the summer. He stays behind to work.', min: 1 },
      { lane: '2B', type: 'song', title: 'Say No to This', fn: 'love', voicing: 'Hamilton, Maria, Co.', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'The affair and the blackmail', note: "Hamilton begins an affair with Maria Reynolds; her husband extorts him to keep it buried.", min: 1 },
      { lane: '2B', type: 'scene', title: 'Backroom Politics' },
      { lane: '2B', type: 'song', title: 'The Room Where It Happens', fn: 'production', voicing: 'Burr, Company', min: 5 },
      { lane: '2B', type: 'song', title: 'Schuyler Defeated', fn: 'drive', voicing: 'Philip, Eliza, Hamilton, Burr', min: 1.5 },
      { lane: '2B', type: 'song', title: 'Cabinet Battle #2', fn: 'production', voicing: 'Washington, Jefferson, Hamilton', min: 2.5 },
      { lane: '2B', type: 'song', title: 'Washington on Your Side', fn: 'drive', voicing: 'Burr, Jefferson, Madison', min: 3 },
      { lane: '2B', type: 'scene', title: "Washington's Farewell" },
      { lane: '2B', type: 'song', title: 'One Last Time', fn: 'ballad', voicing: 'Washington, Hamilton', min: 4.5 },
      { lane: '2B', type: 'song', title: 'I Know Him', fn: 'villain', voicing: 'King George', min: 1.5 },
      { lane: '2B', type: 'song', title: 'The Adams Administration', fn: 'drive', voicing: 'Company', min: 1 },

      { lane: '3', type: 'scene', title: 'The Rivals Close In' },
      { lane: '3', type: 'song', title: 'We Know', fn: 'drive', voicing: 'Jefferson, Madison, Burr, Hamilton', min: 2 },
      { lane: '3', type: 'beat', title: 'Cornered', note: 'Jefferson, Madison, and Burr confront Hamilton with proof of secret payments. To clear his name of graft, he reveals the affair instead.', min: 1 },
      { lane: '3', type: 'song', title: 'Hurricane', fn: 'soliloquy', voicing: 'Hamilton', min: 3 },
      { lane: '3', type: 'song', title: 'The Reynolds Pamphlet', fn: 'production', voicing: 'Company', min: 2.5 },
      { lane: '3', type: 'beat', title: 'A marriage shattered', note: 'Hamilton publishes the affair himself. The scandal destroys his reputation and wounds Eliza to the core.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Burn', fn: 'ballad', voicing: 'Eliza', min: 4 },
      { lane: '3', type: 'scene', title: 'The Next Generation' },
      { lane: '3', type: 'song', title: 'Blow Us All Away', fn: 'drive', voicing: 'Philip, Company', min: 3 },
      { lane: '3', type: 'beat', title: "Philip's duel", note: "Defending his father's honor, nineteen-year-old Philip is shot in a duel.", min: 0.5 },
      { lane: '3', type: 'song', title: 'Stay Alive (Reprise)', fn: 'reprise', voicing: 'Hamilton, Eliza, Philip', min: 2.5 },
      { lane: '3', type: 'song', title: "It's Quiet Uptown", fn: 'ballad', voicing: 'Company, Angelica, Hamiltons', min: 4 },
      { lane: '3', type: 'beat', title: 'Grief and grace', note: "Shattered by Philip's death, the Hamiltons move uptown. Eliza, unimaginably, takes his hand and forgives.", min: 1 },
      { lane: '3', type: 'scene', title: 'The Election of 1800' },
      { lane: '3', type: 'song', title: 'The Election of 1800', fn: 'production', voicing: 'Company', min: 3.5 },
      { lane: '3', type: 'beat', title: 'Hamilton endorses Jefferson', note: 'With the election deadlocked, Hamilton throws his support to Jefferson over Burr — the betrayal Burr will not forgive.', min: 1 },
      { lane: '3', type: 'song', title: 'Your Obedient Servant', fn: 'drive', voicing: 'Burr, Hamilton', min: 3 },
      { lane: '3', type: 'song', title: 'Best of Wives and Best of Women', fn: 'ballad', voicing: 'Eliza, Hamilton', min: 1.5 },
      { lane: '3', type: 'scene', title: 'Weehawken — Dawn' },
      { lane: '3', type: 'song', title: 'The World Was Wide Enough', fn: 'eleven', voicing: 'Burr, Hamilton', min: 4 },
      { lane: '3', type: 'beat', title: 'The duel', note: "Burr fires. Hamilton, who throws away his shot, is mortally wounded — and Burr realizes too late that the world was wide enough for them both.", min: 0.5 },
      { lane: '3', type: 'song', title: 'Who Lives, Who Dies, Who Tells Your Story', fn: 'finaleultimo', voicing: 'Company', min: 4 },
    ],
  },
  wicked: {
    title: 'Wicked', year: 2003, form: 'two-act',
    teaches: 'Contemporary Act 1 finale ("Defying Gravity") + a friendship as the true love story',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ELPHABA': { voiceType: 'Mezzo-Soprano', desc: 'The green-skinned outcast who becomes the Wicked Witch of the West. Fierce, principled, and punished for refusing to look away from injustice. A landmark belt role.' },
      'GLINDA': { voiceType: 'Soprano', desc: 'Dazzling, popular, and ambitious; the future Good Witch. Begins as comic foil and becomes Elphaba\'s truest friend — and the one left to tell her story.' },
      'FIYERO': { voiceType: 'Baritone', desc: 'A charming, careless prince who drifts between the two women, then finds his conscience and chooses Elphaba.' },
      'THE WIZARD': { voiceType: 'Baritone', desc: 'The fraudulent, folksy ruler of Oz — a powerless humbug who manufactures an enemy to keep the people united behind him.' },
      'MADAME MORRIBLE': { voiceType: 'Mezzo-Soprano', desc: 'Shiz headmistress turned the Wizard\'s press secretary. The propagandist who brands Elphaba "wicked."' },
      'NESSAROSE': { voiceType: 'Soprano', desc: "Elphaba's sister, governor of Munchkinland, and the future Wicked Witch of the East. Her unrequited love for Boq curdles into cruelty." },
      'BOQ': { voiceType: 'Tenor', desc: 'A Munchkin smitten with Glinda, trapped by Nessarose. A spell gone wrong transforms him into the Tin Man.' },
      'DOCTOR DILLAMOND': { voiceType: 'Baritone', desc: 'A Goat history professor at Shiz — the moral alarm bell, as Oz strips the Animals of speech and rights.' },
    },
    titlePage: {
      subtitle: 'The Untold Story of the Witches of Oz',
      authors: 'Music & Lyrics by Stephen Schwartz · Book by Winnie Holzman · Based on the novel by Gregory Maguire',
      settings: ['The Land of Oz', 'Shiz University, the Emerald City, Munchkinland, and the forest', 'Before and after Dorothy'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. The plot interlocks with The Wizard of Oz; many beats reframe familiar Oz lore (the Tin Man, the witches, the melting) from the other side.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'Munchkinland — The Witch Is Dead' },
      { lane: '1', type: 'song', title: 'No One Mourns the Wicked', fn: 'opening', voicing: 'Glinda, Citizens of Oz', min: 5 },
      { lane: '1', type: 'beat', title: 'Glinda descends', note: 'Glinda arrives by bubble to confirm the Wicked Witch of the West is dead; the Munchkins celebrate, then turn the day sour with a question.', min: 1 },
      { lane: '1', type: 'beat', title: 'Were you friends?', note: "A citizen asks Glinda whether it's true she once knew the Wicked Witch. Glinda hesitates — then flashes back to the beginning.", min: 1 },
      { lane: '1', type: 'scene', title: 'Shiz University' },
      { lane: '1', type: 'song', title: 'Dear Old Shiz', fn: 'establishing', voicing: 'Students, Galinda, Elphaba', min: 1.5 },
      { lane: '1', type: 'beat', title: "A father's favorite", note: "Elphaba's father dotes on her fragile sister Nessarose and hands Elphaba only the duty of pushing her wheelchair. The green girl is used to being unwanted.", min: 1 },
      { lane: '1', type: 'beat', title: 'Forced together', note: "Elphaba's green skin marks her as an outcast; she's saddled as roommate with the dazzling, popular Galinda. Mutual contempt at first sight.", min: 1 },
      { lane: '1', type: 'beat', title: 'A flash of power', note: 'When Nessarose is threatened, Elphaba\'s anger erupts as raw, uncontrolled magic. Madame Morrible witnesses it and takes a sudden, calculating interest in her.', min: 1 },
      { lane: '1', type: 'song', title: 'The Wizard and I', fn: 'iwant', voicing: 'Elphaba, Madame Morrible', min: 4 },
      { lane: '1', type: 'beat', title: "Morrible's promise", note: 'Morrible offers Elphaba private sorcery lessons and dangles the ultimate prize — a meeting with the Wizard, who could finally make her belong.', min: 1 },
      { lane: '1', type: 'song', title: 'What Is This Feeling?', fn: 'comedy', voicing: 'Galinda, Elphaba, Students', min: 3 },
      { lane: '1', type: 'beat', title: 'Letters home', note: 'Galinda and Elphaba each write home about how much they loathe the other; the whole school lines up behind Galinda.', min: 0.5 },
      { lane: '1', type: 'scene', title: "Doctor Dillamond's Classroom" },
      { lane: '1', type: 'song', title: 'Something Bad', fn: 'drive', voicing: 'Doctor Dillamond, Elphaba', min: 2 },
      { lane: '1', type: 'beat', title: 'The Animals are being silenced', note: 'Dr. Dillamond, a Goat professor, warns that Animals across Oz are losing their voices — and their rights. Elphaba alone seems to care.', min: 1 },
      { lane: '1', type: 'beat', title: 'The scratched slate', note: 'Someone defaces Dillamond\'s blackboard with a cruel slogan against the Animals. He is shaken; Elphaba is enraged that no one else protests.', min: 1 },
      { lane: '1', type: 'beat', title: 'Fiyero arrives', note: 'The careless, charming prince Fiyero transfers in, scornful of effort and study. Galinda is instantly smitten — and so, secretly, is Elphaba.', min: 1 },
      { lane: '1', type: 'scene', title: 'The Ozdust Ballroom' },
      { lane: '1', type: 'beat', title: 'Boq and Nessarose', note: 'To get near Galinda, Boq is maneuvered into escorting Nessarose, who mistakes his pity for love. Galinda\'s careless scheming sets the whole night in motion.', min: 1 },
      { lane: '1', type: 'beat', title: 'The hideous hat', note: 'Galinda hands Elphaba a pointed black hat as a prank, swearing it is the height of fashion. Elphaba, touched, wears it to the dance.', min: 1 },
      { lane: '1', type: 'song', title: 'Dancing Through Life', fn: 'production', voicing: 'Fiyero, Galinda, Boq, Nessarose, Elphaba, Students', min: 6 },
      { lane: '1', type: 'beat', title: 'A cruel gift, a kind turn', note: 'Mocked, Elphaba dances alone and unbowed in the ridiculous hat. Galinda\'s conscience turns; she crosses the floor and joins her.', min: 1.5 },
      { lane: '1', type: 'beat', title: 'Friendship sealed', note: 'The room follows Galinda\'s lead and the two improbably become real friends — the unlikely bond the whole story will turn on.', min: 1 },

      { lane: '2A', type: 'scene', title: "Galinda and Elphaba's Room" },
      { lane: '2A', type: 'beat', title: 'A makeover, and a new name', note: 'Galinda takes Elphaba in hand for a glamour lesson. Moved by a kindness about Dr. Dillamond, she even renames herself "Glinda" in his honor.', min: 1 },
      { lane: '2A', type: 'song', title: 'Popular', fn: 'comedy', voicing: 'Galinda', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'A secret feeling', note: 'Both girls are drawn to the careless prince Fiyero. Elphaba buries what she believes she can never have.', min: 1 },
      { lane: '2A', type: 'song', title: "I'm Not That Girl", fn: 'ballad', voicing: 'Elphaba', min: 3 },
      { lane: '2A', type: 'beat', title: 'Dillamond is taken', note: 'Soldiers drag Dr. Dillamond from class and wheel in a caged Lion cub. Elphaba\'s magic erupts; she and Fiyero free the cub together, a charged moment between them.', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'Summoned by the Wizard', note: 'Madame Morrible brings word: the Wizard wants to meet Elphaba. She and Glinda travel together to the Emerald City.', min: 1 },
      { lane: '2A', type: 'scene', title: 'The Emerald City' },
      { lane: '2A', type: 'song', title: 'One Short Day', fn: 'production', voicing: 'Elphaba, Glinda, Denizens of the Emerald City', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'A dream within reach', note: 'Dazzled by the Emerald City, Elphaba and Glinda feel they have finally found where they belong — and the meeting with the Wizard is only moments away.', min: 1 },
      { lane: '2A', type: 'scene', title: "The Wizard's Chamber" },
      { lane: '2A', type: 'song', title: 'A Sentimental Man', fn: 'charm', voicing: 'The Wizard', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'The Grimmerie', note: 'Morrible reveals that Elphaba alone can read the ancient spellbook. Thrilled, Elphaba performs a levitation spell to prove herself.', min: 1 },
      { lane: '2A', type: 'beat', title: 'The test, and the betrayal', note: "Her spell gives the Wizard's monkeys wings — and he reveals he means to cage them as spies. She realizes he is the source of Oz's cruelty, not its cure.", min: 1.5 },
      { lane: '2A', type: 'beat', title: "Glinda's choice", note: 'Glinda begs Elphaba to apologize and stay safe; Elphaba refuses to be the Wizard\'s tool and flees up the tower with the Grimmerie. Their paths split.', min: 1 },
      { lane: '2A', type: 'song', title: 'Defying Gravity', fn: 'finale', voicing: 'Elphaba, Glinda, Guards, Citizens', min: 6 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The Emerald City — Sometime Later' },
      { lane: '2B', type: 'song', title: 'Thank Goodness', fn: 'production', voicing: 'Glinda, Morrible, Citizens', min: 4 },
      { lane: '2B', type: 'beat', title: 'Two different paths', note: 'Branded "wicked" and on the run, Elphaba is now Oz\'s scapegoat — while Glinda has become its beloved public face.', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'The propaganda machine', note: 'Morrible feeds the public terrifying tales of the Wicked Witch. Glinda, now "the Good," smiles through her private doubts as she\'s named the people\'s hope.', min: 1 },
      { lane: '2B', type: 'beat', title: 'A wedding announced', note: "To steady a frightened Oz, Glinda's engagement to Fiyero, captain of the guard, is made public. Neither of them looks happy about it.", min: 1 },
      { lane: '2B', type: 'scene', title: "Munchkinland — The Governor's House" },
      { lane: '2B', type: 'beat', title: 'Nessarose the tyrant', note: 'Now governor, embittered Nessarose has made Munchkinland cruel. She begs Elphaba to use the Grimmerie to make Boq love her at last.', min: 1 },
      { lane: '2B', type: 'song', title: 'The Wicked Witch of the East', fn: 'drive', voicing: 'Elphaba, Nessarose, Boq', min: 2.5 },
      { lane: '2B', type: 'beat', title: 'Nessarose and Boq', note: "Elphaba's spell frees Boq to flee rather than love Nessarose. Furious, Nessarose tries her own magic — and stops Boq's heart.", min: 1 },
      { lane: '2B', type: 'beat', title: 'Boq becomes tin', note: "Elphaba's desperate spell to save the dying Boq turns him to tin. Nessarose blames her, and Boq's heart hardens against both sisters — the Tin Man is born.", min: 1 },
      { lane: '2B', type: 'beat', title: 'Their father is dead', note: 'Elphaba learns her father died of shame over her; Nessarose twists the knife. Whatever was left between the sisters breaks for good.', min: 1 },
      { lane: '2B', type: 'scene', title: "The Wizard's Chamber" },
      { lane: '2B', type: 'beat', title: 'Into the palace', note: 'Elphaba sneaks into the Wizard\'s chamber to free the caged flying monkeys and confront the man behind Oz\'s cruelty.', min: 1 },
      { lane: '2B', type: 'song', title: 'Wonderful', fn: 'charm', voicing: 'The Wizard, Elphaba', min: 3 },
      { lane: '2B', type: 'beat', title: "Dillamond's silence", note: 'The Wizard nearly wins Elphaba back — until she finds Dr. Dillamond among the cages, his speech gone, reduced to a mute animal. Any temptation dies.', min: 1 },
      { lane: '2B', type: 'beat', title: 'Fiyero defects', note: 'Fiyero, sent to capture Elphaba, instead turns his guards on the Wizard and escapes with her. Glinda watches them flee, and understands.', min: 1 },
      { lane: '2B', type: 'song', title: "I'm Not That Girl (Reprise)", fn: 'reprise', voicing: 'Glinda', min: 1 },
      { lane: '2B', type: 'scene', title: 'The Forest' },
      { lane: '2B', type: 'song', title: "As Long as You're Mine", fn: 'love', voicing: 'Elphaba, Fiyero', min: 3.5 },

      { lane: '2B', type: 'beat', title: 'Fiyero captured', note: "Surrounded by the Wizard's guards, Fiyero is seized so Elphaba can escape. Word reaches her that he is being tortured and may be killed.", min: 1 },
      { lane: '2B', type: 'song', title: 'No Good Deed', fn: 'eleven', voicing: 'Elphaba', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'No good deed goes unpunished', note: 'Her desperate spell to save Fiyero seems to fail. Elphaba renounces the very idea of doing good and embraces the role of the Wicked Witch.', min: 0.5 },
      { lane: '3', type: 'scene', title: 'The Hunt' },
      { lane: '3', type: 'beat', title: 'Spreading the lie', note: 'Morrible whips up the fear, and the Tin Man — Boq — eagerly leads the mob. All of Oz is hunting the Witch.', min: 1 },
      { lane: '3', type: 'song', title: 'March of the Witch Hunters', fn: 'villain', voicing: 'Boq, Citizens', min: 2 },
      { lane: '3', type: 'beat', title: 'Dorothy, and the melting', note: 'As the mob — and a girl from Kansas — close in, Glinda comes to warn Elphaba. The two friends face what may be their last meeting.', min: 1 },
      { lane: '3', type: 'beat', title: 'A last promise', note: 'Elphaba gives Glinda the Grimmerie and makes her swear to protect the Animals — and to never try to clear Elphaba\'s name, whatever happens.', min: 1 },
      { lane: '3', type: 'song', title: 'For Good', fn: 'ballad', voicing: 'Glinda, Elphaba', min: 4 },
      { lane: '3', type: 'beat', title: 'The water', note: 'Dorothy throws the bucket; before a hidden Glinda\'s eyes, Elphaba appears to melt away into nothing. Oz believes the Witch is finally dead.', min: 1 },
      { lane: '3', type: 'beat', title: 'The truth behind the curtain', note: "Glinda confronts the Wizard with proof of his fraud, banishes him from Oz, and has Morrible arrested — keeping her vow to her friend.", min: 1.5 },
      { lane: '3', type: 'beat', title: 'Alive', note: 'Beneath a trapdoor, the "melting" revealed as a trick, Elphaba reunites with Fiyero — alive, changed, and free. They slip out of Oz forever as Glinda mourns a friend she can never name.', min: 1.5 },
      { lane: '3', type: 'song', title: 'Finale', fn: 'finaleultimo', voicing: 'Company', min: 2 },
    ],
  },
  chicago: {
    title: 'Chicago', year: 1975, form: 'two-act',
    teaches: 'Diegetic vaudeville structure — every number staged as a performed act',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ROXIE HART': { voiceType: 'Mezzo-Soprano', desc: 'A chorus-girl wannabe who murders her lover and spins the scandal into stardom. The amoral, irresistible protagonist.' },
      'VELMA KELLY': { voiceType: 'Mezzo-Soprano', desc: 'A vaudeville headliner and double-murderess; the reigning jailhouse celebrity Roxie eclipses, then teams with.' },
      'BILLY FLYNN': { voiceType: 'Baritone', desc: 'The silver-tongued, mercenary defense lawyer who never loses — for a price. The master of razzle-dazzle.' },
      'MATRON "MAMA" MORTON': { voiceType: 'Alto', desc: 'The corrupt prison matron of Murderess Row, who trades favors on a strict system of reciprocity.' },
      'AMOS HART': { voiceType: 'Tenor', desc: "Roxie's meek, devoted husband — so overlooked that no one even registers he's there. \"Mister Cellophane.\"" },
      'MARY SUNSHINE': { voiceType: 'Soprano', desc: 'A sob-sister tabloid reporter who sees the good in everyone — traditionally a soprano-in-disguise twist that pays off late.' },
    },
    titlePage: {
      subtitle: 'A Musical Vaudeville',
      authors: 'Music by John Kander · Lyrics by Fred Ebb · Book by Fred Ebb & Bob Fosse · Based on the play by Maurine Dallas Watkins',
      settings: ['Chicago', 'The late 1920s', 'The Cook County Jail and the courtroom — staged throughout as a vaudeville'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. The defining device: every number is performed diegetically as a vaudeville turn, announced and staged as an act.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'A Chicago Nightclub — The Stage' },
      { lane: '1', type: 'song', title: 'All That Jazz', fn: 'opening', voicing: 'Velma Kelly, Company', min: 5 },
      { lane: '1', type: 'beat', title: 'Roxie shoots Fred Casely', note: 'Roxie kills her lover when he threatens to leave. She cons her dull husband Amos into taking the rap — until he realizes the dead man wasn\'t a burglar.', min: 1.5 },
      { lane: '1', type: 'song', title: 'Funny Honey', fn: 'charm', voicing: 'Roxie', min: 3 },
      { lane: '1', type: 'scene', title: 'Cook County Jail — Murderess Row' },
      { lane: '1', type: 'song', title: 'Cell Block Tango', fn: 'production', voicing: 'Velma, Six Merry Murderesses', min: 5 },
      { lane: '1', type: 'beat', title: 'Welcome to the Row', note: 'Roxie lands among the celebrity murderesses, all presided over — for a price — by Matron Morton.', min: 1 },
      { lane: '1', type: 'song', title: "When You're Good to Mama", fn: 'charm', voicing: 'Matron "Mama" Morton', min: 3 },
      { lane: '1', type: 'scene', title: "Billy Flynn's Office" },
      { lane: '1', type: 'song', title: 'All I Care About', fn: 'charm', voicing: 'Billy Flynn, Girls', min: 4 },
      { lane: '1', type: 'beat', title: 'Hiring the best', note: 'For five thousand dollars, ace lawyer Billy Flynn takes Roxie\'s case — and sets about turning her into the press\'s newest darling.', min: 1 },

      { lane: '2A', type: 'scene', title: 'The Press Room' },
      { lane: '2A', type: 'song', title: 'A Little Bit of Good', fn: 'diegetic', voicing: 'Mary Sunshine', min: 2 },
      { lane: '2A', type: 'song', title: 'We Both Reached for the Gun', fn: 'production', voicing: 'Billy, Roxie, Mary Sunshine, Company', min: 4 },
      { lane: '2A', type: 'beat', title: 'Roxie, the new sensation', note: 'Billy literally ventriloquizes Roxie\'s sob story for the press; overnight she\'s a headline star, eclipsing Velma.', min: 1 },
      { lane: '2A', type: 'song', title: 'Roxie', fn: 'charm', voicing: 'Roxie, Boys', min: 4 },
      { lane: '2A', type: 'beat', title: 'Velma loses her spotlight', note: 'Furious at being upstaged, Velma tries to recruit Roxie into reviving her old sister double-act.', min: 1 },
      { lane: '2A', type: 'song', title: "I Can't Do It Alone", fn: 'production', voicing: 'Velma', min: 4 },
      { lane: '2A', type: 'beat', title: 'Roxie turns her down', note: 'Riding high, Roxie rejects Velma flat — for now.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'My Own Best Friend', fn: 'finale', voicing: 'Roxie, Velma', min: 3.5 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'song', title: 'I Know a Girl', fn: 'drive', voicing: 'Velma', min: 2 },
      { lane: '2B', type: 'beat', title: 'A newer, fresher killer', note: 'Roxie fakes a pregnancy to stay in the headlines, while a sensational new murderess threatens to steal the spotlight from both women.', min: 1 },
      { lane: '2B', type: 'song', title: 'Me and My Baby', fn: 'charm', voicing: 'Roxie, Company', min: 3 },
      { lane: '2B', type: 'scene', title: 'The Hart Apartment' },
      { lane: '2B', type: 'song', title: 'Mister Cellophane', fn: 'ballad', voicing: 'Amos', min: 3 },
      { lane: '2B', type: 'beat', title: 'The invisible husband', note: 'Used and ignored by everyone, Amos realizes no one ever even notices he is there.', min: 1 },
      { lane: '2B', type: 'song', title: 'When Velma Takes the Stand', fn: 'production', voicing: 'Velma, Boys', min: 2.5 },

      { lane: '3', type: 'scene', title: 'The Courtroom' },
      { lane: '3', type: 'song', title: 'Razzle Dazzle', fn: 'production', voicing: 'Billy, Company', min: 4 },
      { lane: '3', type: 'beat', title: 'The trial as a circus', note: 'Billy turns the murder trial into pure showmanship, dazzling the jury with spectacle over substance.', min: 1 },
      { lane: '3', type: 'song', title: 'Class', fn: 'comedy', voicing: 'Velma, Matron Morton', min: 3 },
      { lane: '3', type: 'beat', title: 'Acquitted — and forgotten', note: 'Roxie is found not guilty; the instant the verdict lands, the fickle press chases the next scandal, leaving her a nobody again.', min: 1 },
      { lane: '3', type: 'song', title: 'Nowadays', fn: 'charm', voicing: 'Roxie', min: 2.5 },
      { lane: '3', type: 'beat', title: 'Two stars, one act', note: 'With no spotlight left to fight over, Roxie and Velma finally join forces.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Hot Honey Rag', fn: 'production', voicing: 'Roxie, Velma', min: 2 },
      { lane: '3', type: 'song', title: 'Finale', fn: 'finaleultimo', voicing: 'Company', min: 1.5 },
    ],
  },
  legallyblonde: {
    title: 'Legally Blonde', year: 2007, form: 'two-act',
    teaches: 'Contemporary comedy: a driving I-Want, a Greek-chorus device, and the "So Much Better" Act 1 finale',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ELLE WOODS': { voiceType: 'Soprano', desc: 'A sorority president who follows her ex to Harvard Law to win him back — and discovers she is brilliant on her own terms. The relentlessly optimistic protagonist.' },
      'EMMETT FORREST': { voiceType: 'Tenor', desc: 'A kind, working-class law TA who clawed his way up and believes in Elle before she believes in herself. Her real love.' },
      'WARNER HUNTINGTON III': { voiceType: 'Baritone', desc: "Elle's status-obsessed ex, who dumps her for not being \"serious\" enough for his political ambitions." },
      'PAULETTE BUONUFONTE': { voiceType: 'Mezzo-Soprano', desc: 'A warm, lovelorn hairdresser who becomes Elle\'s loyal friend and comic confidante.' },
      'PROFESSOR CALLAHAN': { voiceType: 'Baritone', desc: 'A ruthless, predatory law professor whose internship is the prize — and whose harassment nearly drives Elle out of law.' },
      'VIVIENNE KENSINGTON': { voiceType: 'Mezzo-Soprano', desc: "Warner's poised new fiancée; first a rival, then the ally who helps Elle take over the case." },
      'BROOKE WYNDHAM': { voiceType: 'Mezzo-Soprano', desc: 'A fitness mogul and Delta Nu sister on trial for her husband\'s murder; her trust in Elle turns on their sorority bond.' },
    },
    titlePage: {
      subtitle: 'The Musical',
      authors: "Music & Lyrics by Laurence O'Keefe and Nell Benjamin · Book by Heather Hach · Based on the novel by Amanda Brown and the MGM film",
      settings: ['Southern California and Harvard Law School', 'The present day', 'A sorority house, a law school, a salon, and a courtroom'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Note the Delta Nu "Greek chorus" device — Elle\'s imaginary sorority sisters who materialize to cheer her on.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'UCLA — The Delta Nu Sorority House' },
      { lane: '1', type: 'song', title: 'Omigod You Guys', fn: 'opening', voicing: 'Elle, Delta Nus, Company', min: 4 },
      { lane: '1', type: 'beat', title: 'The perfect day planned', note: 'The Delta Nus are certain Warner will propose tonight and help Elle find the flawless dress. She is blissfully sure her storybook future is about to begin.', min: 1 },
      { lane: '1', type: 'beat', title: 'Expecting a ring, getting dumped', note: 'Elle is certain Warner will propose. Instead he breaks up with her, saying his political future needs someone "serious."', min: 1.5 },
      { lane: '1', type: 'song', title: 'Serious', fn: 'charm', voicing: 'Warner, Elle', min: 3 },
      { lane: '1', type: 'beat', title: 'A plan is born', note: 'Heartbroken, Elle resolves to prove herself "serious" by following Warner to Harvard Law.', min: 0.5 },
      { lane: '1', type: 'beat', title: 'Everyone says she\'s crazy', note: 'Her mother, her friends, and the admissions odds are all against her — a sorority girl from California has no business at Harvard Law. Elle refuses to hear it.', min: 1 },
      { lane: '1', type: 'song', title: 'What You Want', fn: 'iwant', voicing: 'Elle, Delta Nus, Company', min: 5 },
      { lane: '1', type: 'beat', title: 'Into Harvard', note: 'Against all expectation, Elle aces the LSAT and dazzles the admissions board with a video essay. She is accepted to Harvard Law.', min: 1 },
      { lane: '1', type: 'scene', title: 'Harvard Law School' },
      { lane: '1', type: 'beat', title: 'A fish out of water', note: 'Elle arrives in head-to-toe pink and is instantly written off as a joke by jaded classmates like Enid and Aaron. Harvard is nothing like home.', min: 1 },
      { lane: '1', type: 'song', title: 'The Harvard Variations', fn: 'comedy', voicing: 'Aaron, Enid, Emmett, Students, Elle', min: 3 },
      { lane: '1', type: 'beat', title: 'The Greek chorus appears', note: 'When Elle\'s nerve falters, her imaginary Delta Nu sisters materialize to cheer her on — the show\'s signature device, her inner pep squad made visible.', min: 0.5 },
      { lane: '1', type: 'song', title: 'Blood in the Water', fn: 'villain', voicing: 'Callahan, Students', min: 3 },
      { lane: '1', type: 'beat', title: 'In over her head', note: 'Professor Callahan humiliates an unprepared Elle and throws her out of class — a brutal first taste of how the cut-throat school treats her.', min: 1 },
      { lane: '1', type: 'beat', title: 'Reunited with Warner', note: 'Elle finds Warner, certain he\'ll be impressed she made it to Harvard. He is polite, distant — and not alone.', min: 1 },

      { lane: '2A', type: 'beat', title: 'Warner is engaged', note: 'Elle learns Warner is now engaged to the polished Vivienne — her whole reason for coming seems lost.', min: 1 },
      { lane: '2A', type: 'beat', title: 'Crushed', note: 'Her plan in ruins, Elle nearly gives up. The Delta Nus rally her by phone, insisting she stay positive.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'Positive', fn: 'production', voicing: 'Margot, Serena, Pilar, Elle, Delta Nus', min: 3 },
      { lane: '2A', type: 'scene', title: "Paulette's Hair Salon" },
      { lane: '2A', type: 'song', title: 'Ireland', fn: 'charm', voicing: 'Paulette', min: 2.5 },
      { lane: '2A', type: 'beat', title: 'A new friend', note: 'Elle befriends the lovelorn hairdresser Paulette; the two trade pep talks and courage.', min: 0.5 },
      { lane: '2A', type: 'beat', title: 'The costume-party trap', note: 'Vivienne tricks Elle into wearing a Playboy-bunny costume to a party that isn\'t one, humiliating her in front of the whole class.', min: 1 },
      { lane: '2A', type: 'song', title: 'Serious (Reprise)', fn: 'reprise', voicing: 'Warner, Elle', min: 1 },
      { lane: '2A', type: 'beat', title: 'The turning point', note: 'Warner tells Elle flatly she\'ll never be smart enough. Stung, she decides to stop chasing him and start beating him at his own game.', min: 1 },
      { lane: '2A', type: 'scene', title: 'The Law Library' },
      { lane: '2A', type: 'song', title: 'Chip on My Shoulder', fn: 'charm', voicing: 'Emmett, Elle', min: 4 },
      { lane: '2A', type: 'beat', title: 'Buckling down', note: 'Emmett, who earned everything the hard way, pushes Elle to actually study — and to his surprise, she is brilliant.', min: 1 },
      { lane: '2A', type: 'beat', title: 'The four interns', note: 'Callahan announces that four students will win coveted spots on a real murder case. Through sheer work, Elle makes the cut — alongside Warner, Vivienne, and Enid.', min: 1 },
      { lane: '2A', type: 'song', title: 'So Much Better', fn: 'finale', voicing: 'Elle', min: 3.5 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: "Callahan's Internship — The Brooke Wyndham Case" },
      { lane: '2B', type: 'beat', title: 'The case', note: 'The intern team takes on fitness mogul Brooke Wyndham, accused of murdering her much-older husband. Elle realizes the defendant is a Delta Nu idol of hers.', min: 1 },
      { lane: '2B', type: 'song', title: 'Whipped Into Shape', fn: 'production', voicing: 'Brooke, Callahan, Company', min: 3 },
      { lane: '2B', type: 'beat', title: 'The fitness queen on trial', note: 'Elle wins Brooke\'s trust through their shared sorority bond when no one else can get through to her.', min: 1 },
      { lane: '2B', type: 'beat', title: 'The alibi she won\'t give', note: 'Brooke has an alibi that would clear her, but giving it would destroy her career. She confides it to Elle alone, sister to sister, and swears her to secrecy.', min: 1 },
      { lane: '2B', type: 'beat', title: 'Keeping the secret', note: 'Callahan pressures Elle to break Brooke\'s confidence for the win. Elle refuses — earning Brooke\'s deeper trust and Callahan\'s irritation.', min: 1 },
      { lane: '2B', type: 'scene', title: "Paulette's Salon" },
      { lane: '2B', type: 'beat', title: "Paulette's crush", note: 'Paulette pines for the handsome UPS deliveryman but freezes up every time he appears. Elle resolves to help her win him over.', min: 0.5 },
      { lane: '2B', type: 'song', title: 'Take It Like a Man', fn: 'charm', voicing: 'Elle, Emmett, Salespeople', min: 3 },
      { lane: '2B', type: 'beat', title: 'Helping Paulette', note: 'Elle gives the underdog Emmett a sharp new look, and coaches Paulette in a foolproof move to land her man.', min: 1 },
      { lane: '2B', type: 'song', title: 'Bend and Snap', fn: 'production', voicing: 'Elle, Paulette, Salesgirls', min: 3 },
      { lane: '2B', type: 'beat', title: 'Bend and snap backfires', note: 'The "foolproof" move ends with the UPS man\'s broken nose — but he and Paulette tumble into love anyway.', min: 0.5 },

      { lane: '3', type: 'scene', title: 'The Courtroom' },
      { lane: '3', type: 'beat', title: 'On the stand', note: 'Cross-examining the prosecution\'s witness, Elle catches a tell about his shoes that no trained lawyer in the room notices — and cracks his story wide open.', min: 1 },
      { lane: '3', type: 'song', title: 'Gay or European?', fn: 'comedy', voicing: 'Enid, Callahan, Emmett, Elle, Company', min: 3.5 },
      { lane: '3', type: 'beat', title: 'Callahan crosses the line', note: 'Riding the win, Callahan makes a pass at Elle, revealing he only ever valued her looks. Disillusioned, she decides to quit law for good.', min: 1.5 },
      { lane: '3', type: 'beat', title: 'Ready to quit', note: 'Packing to leave Harvard, Elle is at her lowest — convinced she never belonged here after all.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Legally Blonde', fn: 'ballad', voicing: 'Emmett, Elle', min: 3 },
      { lane: '3', type: 'beat', title: 'Vivienne switches sides', note: 'Vivienne, who witnessed Callahan\'s pass and is disgusted, breaks from Warner and seeks Elle out as an ally.', min: 1 },
      { lane: '3', type: 'beat', title: 'Rallied back', note: 'Vivienne and Emmett convince Elle that she alone can win this — and that Brooke will only stay with a lawyer she trusts.', min: 0.5 },
      { lane: '3', type: 'beat', title: 'Elle takes the case', note: 'Brooke fires Callahan and makes Elle, still a law student, her lead attorney. The judge allows it.', min: 1 },
      { lane: '3', type: 'song', title: 'Legally Blonde Remix', fn: 'production', voicing: 'Vivienne, Enid, Paulette, Elle, Company', min: 4 },
      { lane: '3', type: 'beat', title: 'Winning on her own terms', note: 'Elle cracks the case using knowledge no one expected her to have — the rules of a perm — exposing the real killer\'s false alibi.', min: 1 },
      { lane: '3', type: 'beat', title: 'Brooke goes free', note: 'The victim\'s daughter confesses on the stand; Brooke is acquitted, and Elle is vindicated as a lawyer in her own right.', min: 1 },
      { lane: '3', type: 'beat', title: 'Valedictorian', note: 'Three years later, Elle graduates first in her class — chosen to give the commencement speech, with Emmett at her side and a proposal in the wings.', min: 1 },
      { lane: '3', type: 'song', title: 'Find My Way (Finale)', fn: 'finaleultimo', voicing: 'Elle, Company', min: 3 },
    ],
  },
  littlemermaid: {
    title: 'The Little Mermaid', year: 2008, form: 'two-act',
    teaches: 'The textbook "I Want" song ("Part of Your World") and a wall-to-wall villain',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold. No
    // lyrics reproduced. Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ARIEL': { voiceType: 'Soprano', desc: "King Triton's headstrong youngest daughter, who longs for the human world and trades her voice for legs. The protagonist." },
      'PRINCE ERIC': { voiceType: 'Baritone', desc: 'A restless young prince, haunted by the voice of the girl who saved him from drowning.' },
      'URSULA': { voiceType: 'Mezzo-Soprano', desc: "The exiled sea witch — Triton's rival — who schemes to reclaim the throne through Ariel's longing. A wall-to-wall villain." },
      'KING TRITON': { voiceType: 'Bass', desc: "Ruler of the sea and Ariel's father; loving but rigid, his fury over the human world drives her into Ursula's hands." },
      'SEBASTIAN': { voiceType: 'Tenor', desc: "Triton's anxious court composer, a crab tasked with keeping Ariel out of trouble — and her reluctant champion." },
      'SCUTTLE': { voiceType: 'Tenor', desc: 'A blustering, well-meaning seagull and self-proclaimed expert on all things human. Comic relief.' },
      'FLOUNDER': { voiceType: 'Tenor', desc: "Ariel's loyal young fish friend, quietly in love with her." },
      'FLOTSAM & JETSAM': { voiceType: 'Tenor', desc: "Ursula's slippery eel henchmen, her eyes and hands in Triton's kingdom." },
    },
    titlePage: {
      subtitle: 'A New Musical',
      authors: 'Music by Alan Menken · Lyrics by Howard Ashman and Glenn Slater · Book by Doug Wright · Based on the Hans Christian Andersen story and the Disney film',
      settings: ['The sea and a seaside kingdom', 'Once upon a time', "King Triton's undersea realm and Prince Eric's palace"],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. "Part of Your World" is the canonical example of the "I Want" song that opens a protagonist\'s longing.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'Above — A Ship at Sea' },
      { lane: '1', type: 'song', title: 'Fathoms Below', fn: 'opening', voicing: 'Pilot, Sailors, Grimsby, Prince Eric', min: 3 },
      { lane: '1', type: 'beat', title: 'Two worlds', note: "Sailors sing of the merfolk below; on deck, Prince Eric yearns for something the land can't give him.", min: 1 },
      { lane: '1', type: 'beat', title: 'A prince who must marry', note: 'Grimsby reminds Eric the kingdom needs an heir and a bride. Eric only wants the open sea — and then a storm begins to rise.', min: 1 },
      { lane: '1', type: 'scene', title: "King Triton's Undersea Court" },
      { lane: '1', type: 'song', title: 'Daughters of Triton', fn: 'charm', voicing: 'Mersisters', min: 1.5 },
      { lane: '1', type: 'beat', title: 'The missing princess', note: "Triton's daughters present a concert — but the seventh, Ariel, is absent, off exploring the forbidden surface.", min: 1 },
      { lane: '1', type: 'beat', title: "Ariel's treasures", note: 'Ariel and her loyal friend Flounder explore a sunken wreck, gathering human objects she can\'t name but adores.', min: 1 },
      { lane: '1', type: 'song', title: 'The World Above', fn: 'ballad', voicing: 'Ariel', min: 2.5 },
      { lane: '1', type: 'scene', title: 'A Sunken Grotto' },
      { lane: '1', type: 'beat', title: "Scuttle's expertise", note: 'Ariel brings her finds to the seagull Scuttle, who confidently invents absurd names and uses for each human gadget.', min: 1 },
      { lane: '1', type: 'song', title: 'Human Stuff', fn: 'comedy', voicing: 'Scuttle, Gulls', min: 2.5 },
      { lane: '1', type: 'beat', title: "Ursula's exile", note: "Banished from the palace by her brother Triton, the sea witch Ursula plots to reclaim her power through his headstrong youngest daughter.", min: 1 },
      { lane: '1', type: 'song', title: 'I Want the Good Times Back', fn: 'villain', voicing: 'Ursula, Flotsam, Jetsam', min: 3 },
      { lane: '1', type: 'beat', title: 'The eels are dispatched', note: 'Ursula sends her slippery henchmen Flotsam and Jetsam to watch Ariel, certain the girl\'s longing is the crack she needs to topple Triton.', min: 0.5 },
      { lane: '1', type: 'song', title: 'Part of Your World', fn: 'iwant', voicing: 'Ariel', min: 3.5 },

      { lane: '2A', type: 'scene', title: 'The Surface — The Storm' },
      { lane: '2A', type: 'beat', title: 'Drawn to the ship', note: 'Ariel surfaces near a celebration aboard Eric\'s ship and watches the prince, transfixed — just as the gathering storm slams into the vessel.', min: 1 },
      { lane: '2A', type: 'beat', title: 'Ariel saves Eric', note: "The ship wrecks; Ariel pulls the drowning prince to shore and, unseen, sings to him before fleeing. He wakes haunted by her voice.", min: 1.5 },
      { lane: '2A', type: 'song', title: 'Part of Your World (Reprise)', fn: 'reprise', voicing: 'Ariel', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'The sisters notice', note: 'Back home, the Mersisters tease that the dreamy, distracted Ariel is showing every sign of being lovestruck.', min: 0.5 },
      { lane: '2A', type: 'song', title: "She's in Love", fn: 'charm', voicing: 'Mersisters, Flounder', min: 2.5 },
      { lane: '2A', type: 'scene', title: "Eric's Palace" },
      { lane: '2A', type: 'beat', title: 'Haunted by a voice', note: 'Eric cannot shake the memory of the girl whose singing saved him. He vows to search the kingdom until he finds her.', min: 1 },
      { lane: '2A', type: 'song', title: 'Her Voice', fn: 'ballad', voicing: 'Prince Eric', min: 3 },
      { lane: '2A', type: 'scene', title: "Triton's Court" },
      { lane: '2A', type: 'beat', title: "Sebastian's report", note: 'The anxious court composer Sebastian, charged with keeping Ariel in line, must finally admit to Triton how far toward the human world she has strayed.', min: 1 },
      { lane: '2A', type: 'beat', title: "A father's fury", note: "Triton confronts Ariel and destroys her treasured collection of human things. Heartbroken and alone, she is easy prey for the waiting eels.", min: 1 },
      { lane: '2A', type: 'beat', title: 'A distraction below', note: 'To keep the grieving Ariel home and content, Sebastian tries to remind her how wonderful her own world is.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'Under the Sea', fn: 'production', voicing: 'Sebastian, Sea Creatures', min: 4 },
      { lane: '2A', type: 'beat', title: 'Lured away', note: 'In the middle of the celebration, Flotsam and Jetsam slip Ariel away and lead her to Ursula\'s lair.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'Sweet Child', fn: 'drive', voicing: 'Flotsam, Jetsam', min: 1.5 },
      { lane: '2A', type: 'beat', title: "The witch's bargain", note: "Ursula offers Ariel legs for three days at the price of her voice: win Eric's kiss and stay human; fail, and belong to Ursula.", min: 1 },
      { lane: '2A', type: 'song', title: 'Poor Unfortunate Souls', fn: 'villain', voicing: 'Ursula', min: 4 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The Shore' },
      { lane: '2B', type: 'beat', title: 'Legs at last', note: 'Ariel wakes on the beach with human legs and no voice — thrilled, terrified, and wobbling as she learns to stand for the very first time.', min: 1 },
      { lane: '2B', type: 'song', title: 'Positoovity', fn: 'production', voicing: 'Scuttle, Gulls', min: 3 },
      { lane: '2B', type: 'beat', title: 'A voiceless girl on land', note: "Eric finds the strange, silent girl on the shore and senses something familiar he can't quite place — but without her voice, she can't tell him.", min: 1 },
      { lane: '2B', type: 'scene', title: "Eric's Palace" },
      { lane: '2B', type: 'beat', title: 'A guest at the palace', note: 'Taken in as a mysterious mute girl, Ariel marvels at every ordinary human wonder she always dreamed of touching.', min: 0.5 },
      { lane: '2B', type: 'song', title: 'Beyond My Wildest Dreams', fn: 'charm', voicing: 'Ariel, Maids, Grimsby', min: 3 },
      { lane: '2B', type: 'scene', title: 'The Palace Kitchen' },
      { lane: '2B', type: 'song', title: 'Les Poissons', fn: 'comedy', voicing: 'Chef Louis', min: 2 },
      { lane: '2B', type: 'beat', title: 'Escape from the chef', note: 'Sebastian narrowly survives the knife of the manic Chef Louis, who is determined to cook every creature in the kitchen.', min: 0.5 },
      { lane: '2B', type: 'beat', title: 'Eric warms to her', note: 'Charmed by Ariel despite her silence, Eric is urged by Grimsby to let go of his phantom singer and choose the real girl in front of him.', min: 1 },
      { lane: '2B', type: 'song', title: 'One Step Closer', fn: 'charm', voicing: 'Prince Eric', min: 2.5 },
      { lane: '2B', type: 'beat', title: 'The clock is ticking', note: "Eric and Ariel grow closer, but the three-day deadline looms — and Ursula schemes to make sure the kiss never lands.", min: 1 },
      { lane: '2B', type: 'song', title: "Daddy's Little Angel", fn: 'villain', voicing: 'Ursula, Flotsam, Jetsam', min: 2.5 },

      { lane: '3', type: 'scene', title: 'The Lagoon' },
      { lane: '3', type: 'beat', title: 'Setting the scene', note: 'Sebastian rallies the lagoon\'s creatures to stage the perfect romantic moment and coax the hesitant Eric into the kiss.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Kiss the Girl', fn: 'production', voicing: 'Sebastian, Animals', min: 3 },
      { lane: '3', type: 'beat', title: 'So close', note: "The moment arrives — until the eels capsize the boat. Furious, Ursula resolves to take Eric herself, disguised and wearing Ariel's stolen voice.", min: 1 },
      { lane: '3', type: 'song', title: 'If Only (Quartet)', fn: 'ballad', voicing: 'Ariel, Eric, Triton, Sebastian', min: 3 },
      { lane: '3', type: 'beat', title: "Vanessa's spell", note: 'Disguised as the maiden "Vanessa" and singing in Ariel\'s stolen voice, Ursula bewitches Eric into agreeing to marry her at once.', min: 1 },
      { lane: '3', type: 'beat', title: 'Scuttle sounds the alarm', note: 'Scuttle discovers that Vanessa is the sea witch wearing Ariel\'s voice, and rallies the animals to crash the wedding before the deadline.', min: 1 },
      { lane: '3', type: 'beat', title: 'The wedding wrecked', note: 'The creatures storm the ship; the shell around Vanessa\'s neck shatters and Ariel\'s voice flies home to her — but the sun sets, and the bargain comes due.', min: 1 },
      { lane: '3', type: 'song', title: 'Poor Unfortunate Souls (Reprise)', fn: 'reprise', voicing: 'Ursula', min: 1.5 },
      { lane: '3', type: 'beat', title: "Triton's sacrifice", note: 'To free his daughter, Triton trades his crown and his life to Ursula, who seizes his power and grows monstrous — until Eric and Ariel together destroy the sea witch.', min: 1.5 },
      { lane: '3', type: 'beat', title: "A father's blessing", note: 'His power restored, Triton finally sees how deeply Ariel loves Eric — and gives her the choice he once forbade, granting her legs to live in the world above.', min: 1 },
      { lane: '3', type: 'song', title: 'Finale', fn: 'finaleultimo', voicing: 'Company', min: 3 },
    ],
  },
  hunchback: {
    title: 'The Hunchback of Notre Dame', year: 2015, form: 'two-act',
    teaches: 'Choral storytelling + a true villain soliloquy ("Hellfire"); the 11 o\'clock turn ("Made of Stone")',
    // ENRICHED reference (2026-06-23): full scene/beat/character scaffold of the
    // stage version (Menken/Schwartz/Parnell) — darker than the film, keeping
    // Hugo's tragic ending. No lyrics reproduced. Runtimes are ballparks.
    characters: {
      'QUASIMODO': { voiceType: 'Tenor', desc: 'The deformed, gentle bell-ringer of Notre Dame, raised in isolation by Frollo. Longs for one day among ordinary people. The protagonist.' },
      'ESMERALDA': { voiceType: 'Mezzo-Soprano', desc: 'A free-spirited, compassionate Romani woman who shows Quasimodo kindness and defies Frollo — and pays for it.' },
      'DOM CLAUDE FROLLO': { voiceType: 'Baritone', desc: "The archdeacon and Quasimodo's guardian, whose zealotry and forbidden lust for Esmeralda curdle into murderous obsession. A genuine villain soliloquy in \"Hellfire.\"" },
      'CAPTAIN PHOEBUS': { voiceType: 'Baritone', desc: "A soldier who tires of Frollo's cruelty and falls in love with Esmeralda." },
      'CLOPIN TROUILLEFOU': { voiceType: 'Tenor', desc: 'The theatrical leader of the Gypsies and the show\'s narrator, weaving the tale through the Congregation.' },
    },
    titlePage: {
      subtitle: 'A New Musical',
      authors: 'Music by Alan Menken · Lyrics by Stephen Schwartz · Book by Peter Parnell · Based on the Victor Hugo novel and the Disney film',
      settings: ['Paris, 1482', 'The Cathedral of Notre Dame and the streets below'],
      productionNotes: "Reference study object — structural scaffold only; no lyric text is reproduced. The stage version restores Hugo's tragic ending and uses a choral Congregation that narrates the story and becomes the cathedral's stone saints.",
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'The Cathedral of Notre Dame — 1482' },
      { lane: '1', type: 'song', title: 'The Bells of Notre Dame', fn: 'opening', voicing: 'Frollo, Clopin, Congregation', min: 6 },
      { lane: '1', type: 'beat', title: 'The making of a monster and a man', note: "The Congregation tells how the cruel archdeacon Frollo took in his dead brother's deformed child — Quasimodo — and hid him away in the bell tower.", min: 1.5 },
      { lane: '1', type: 'scene', title: 'The Bell Tower' },
      { lane: '1', type: 'song', title: 'Out There', fn: 'iwant', voicing: 'Quasimodo', min: 3.5 },
      { lane: '1', type: 'scene', title: 'The Streets — Feast of Fools' },
      { lane: '1', type: 'song', title: 'Topsy Turvy', fn: 'production', voicing: 'Clopin, Company', min: 5 },
      { lane: '1', type: 'song', title: 'Rhythm of the Tambourine', fn: 'charm', voicing: 'Esmeralda, Company', min: 2.5 },
      { lane: '1', type: 'beat', title: 'Crowned and humiliated', note: 'Quasimodo ventures out and is mockingly crowned King of Fools, then pelted by the crowd. Esmeralda alone shows him kindness — and openly defies Frollo.', min: 1.5 },
      { lane: '1', type: 'song', title: 'God Help the Outcasts', fn: 'ballad', voicing: 'Esmeralda, Congregation', min: 3.5 },

      { lane: '2A', type: 'scene', title: 'Inside the Cathedral' },
      { lane: '2A', type: 'beat', title: 'Sanctuary', note: "Esmeralda takes refuge in Notre Dame; Quasimodo hides her from Frollo's soldiers, and a fragile friendship forms.", min: 1 },
      { lane: '2A', type: 'song', title: 'Top of the World', fn: 'love', voicing: 'Quasimodo, Esmeralda', min: 3 },
      { lane: '2A', type: 'scene', title: 'A Gypsy Tavern' },
      { lane: '2A', type: 'song', title: 'Tavern Song', fn: 'charm', voicing: 'Clopin, Company', min: 2 },
      { lane: '2A', type: 'beat', title: 'Three men, one woman', note: "Quasimodo, the soldier Phoebus, and Frollo himself are all drawn to Esmeralda — and Frollo's desire curdles into something violent.", min: 1 },
      { lane: '2A', type: 'song', title: "Heaven's Light", fn: 'ballad', voicing: 'Quasimodo', min: 2.5 },
      { lane: '2A', type: 'song', title: 'Hellfire', fn: 'villain', voicing: 'Frollo', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'The hunt begins', note: 'Tormented by a lust he calls sin, Frollo vows to possess Esmeralda or burn her — and sets all of Paris alight to find her.', min: 1 },
      { lane: '2A', type: 'song', title: 'Esmeralda', fn: 'finale', voicing: 'Company', min: 3 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The Bell Tower' },
      { lane: '2B', type: 'song', title: 'Flight into Egypt', fn: 'charm', voicing: 'Quasimodo, Congregation', min: 2.5 },
      { lane: '2B', type: 'beat', title: 'Helping her escape', note: "Believing Esmeralda loves him, Quasimodo helps her flee the burning city toward the Gypsies' hidden refuge.", min: 1 },
      { lane: '2B', type: 'scene', title: 'The Court of Miracles' },
      { lane: '2B', type: 'song', title: 'The Court of Miracles', fn: 'production', voicing: 'Clopin, Company', min: 4 },
      { lane: '2B', type: 'song', title: 'In a Place of Miracles', fn: 'love', voicing: 'Esmeralda, Phoebus, Quasimodo', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'A heart not chosen', note: 'Quasimodo realizes Esmeralda loves Phoebus, not him — and that, followed, he has led Frollo straight to the refuge.', min: 1 },

      { lane: '3', type: 'song', title: 'Someday', fn: 'ballad', voicing: 'Esmeralda, Phoebus', min: 3.5 },
      { lane: '3', type: 'scene', title: 'The Square Before Notre Dame' },
      { lane: '3', type: 'song', title: 'While the City Slumbered', fn: 'drive', voicing: 'Congregation', min: 2.5 },
      { lane: '3', type: 'beat', title: 'The pyre', note: 'Frollo captures Esmeralda and condemns her to burn. Quasimodo breaks his chains, seizes her from the flames, and carries her into the cathedral crying sanctuary.', min: 1.5 },
      { lane: '3', type: 'song', title: 'Made of Stone', fn: 'eleven', voicing: 'Quasimodo', min: 4 },
      { lane: '3', type: 'beat', title: 'The fall of Frollo', note: "Frollo pursues them to the tower; in the struggle he plunges to his death — but Esmeralda dies of her wounds in Quasimodo's arms.", min: 1.5 },
      { lane: '3', type: 'song', title: 'Finale (The Bells of Notre Dame)', fn: 'finaleultimo', voicing: 'Company', min: 3 },
    ],
  },
  frozen: {
    title: 'Frozen', year: 2018, form: 'two-act',
    teaches: 'A transformation Act 1 finale ("Let It Go"), an "I Want" that splits two characters, and a climax that subverts true love\'s kiss',
    // ENRICHED reference (2026-06-28): full scene/beat/character scaffold of the
    // Broadway stage version (Anderson-Lopez/Lopez/Lee). No lyrics reproduced.
    // Runtimes are interpretive ballparks; keys/tempo unset.
    characters: {
      'ELSA': { voiceType: 'Soprano', desc: 'The elder princess, born able to conjure ice and snow. Taught to fear and hide her gift, she becomes a runaway queen who must learn that love, not fear, controls her power. A soaring belt role.' },
      'ANNA': { voiceType: 'Mezzo-Soprano', desc: 'The warm, impulsive younger sister, shut out of Elsa\'s life since childhood. Her open heart drives the rescue — and the act of true love at the climax. The protagonist.' },
      'KRISTOFF': { voiceType: 'Baritone', desc: 'A gruff, solitary ice harvester who, with his reindeer Sven, guides Anna up the mountain and falls for her despite himself.' },
      'HANS': { voiceType: 'Tenor', desc: 'A charming prince of the Southern Isles, the youngest of thirteen brothers — whose hunger to matter masks a cold ambition for the throne.' },
      'OLAF': { voiceType: 'Tenor', desc: 'A childhood snowman brought to life by Elsa\'s magic, who innocently dreams of summer. Comic relief and the embodiment of the sisters\' lost bond.' },
      'GRAND PABBIE': { voiceType: 'Bass-Baritone', desc: 'Elder of the mountain trolls (the Hidden Folk); he heals the young Anna, names Elsa\'s curse, and reveals what can thaw a frozen heart.' },
      'KING AGNARR & QUEEN IDUNA': { voiceType: 'Baritone / Mezzo-Soprano', desc: "Elsa and Anna's parents, who close the gates to protect their daughters and are lost at sea — the absence that shapes both sisters." },
    },
    titlePage: {
      subtitle: 'The Broadway Musical',
      authors: 'Music & Lyrics by Kristen Anderson-Lopez and Robert Lopez · Book by Jennifer Lee · Based on the Disney film',
      settings: ['The kingdom of Arendelle', 'A long-ago Scandinavian winter', "The castle, the North Mountain, and Elsa's ice palace"],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. The stage version expands the film with new songs — "Dangerous to Dream," "Monster," "True Love," "Kristoff Lullaby" — that deepen each lead\'s interior journey.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'Arendelle — The Castle, Years Ago' },
      { lane: '1', type: 'song', title: 'Let the Sun Shine On', fn: 'opening', voicing: 'King, Queen, Young Anna, Young Elsa, Court', min: 3 },
      { lane: '1', type: 'beat', title: 'Two sisters, one secret', note: 'Young Elsa is born able to conjure ice and snow. She and little Anna are inseparable — best friends and partners in a magic only they share.', min: 1 },
      { lane: '1', type: 'beat', title: 'Playing with magic', note: 'Late at night the girls sneak down to the ballroom, where Elsa fills the room with snow and an ice rink just for Anna.', min: 1 },
      { lane: '1', type: 'song', title: 'A Little Bit of You', fn: 'charm', voicing: 'Young Anna, Young Elsa', min: 2 },
      { lane: '1', type: 'beat', title: 'The accident', note: 'Anna leaps faster than Elsa can catch her; a blast of magic strikes Anna in the head and she falls cold and still.', min: 1 },
      { lane: '1', type: 'scene', title: 'The Valley of the Living Rock' },
      { lane: '1', type: 'beat', title: "The trolls' cure", note: 'Grand Pabbie heals Anna but removes every memory of Elsa\'s magic — and warns that fear will be Elsa\'s greatest enemy.', min: 1 },
      { lane: '1', type: 'beat', title: 'The gates close', note: 'To keep Anna safe, the King shuts the castle gates and isolates Elsa, drilling her to hide the gift: conceal it, don\'t feel it.', min: 1 },
      { lane: '1', type: 'song', title: 'Do You Want to Build a Snowman?', fn: 'motif', voicing: 'Young Anna, Anna', min: 3 },
      { lane: '1', type: 'beat', title: 'A worsening gift', note: 'As Elsa grows, her power grows with her — harder to contain, frost creeping from her hands behind the locked door she never opens to her sister.', min: 1 },
      { lane: '1', type: 'beat', title: 'Orphaned', note: 'The King and Queen are lost at sea. Anna and Elsa grieve in separate rooms, more alone than ever, the door still shut between them.', min: 1 },
      { lane: '1', type: 'beat', title: 'Coronation morning', note: 'Elsa has come of age to be crowned queen. For a single day, the long-shut gates of Arendelle will open to the world.', min: 1 },

      { lane: '2A', type: 'song', title: 'For the First Time in Forever', fn: 'iwant', voicing: 'Anna, Elsa, Townspeople', min: 4 },
      { lane: '2A', type: 'beat', title: 'The gates open', note: 'The town floods into the castle. Starved for company her whole life, Anna tumbles out among the crowds, giddy with possibility.', min: 1 },
      { lane: '2A', type: 'beat', title: 'A bump in the boat', note: 'Anna literally collides with the dashing Prince Hans of the Southern Isles. Instant, dizzy sparks.', min: 1 },
      { lane: '2A', type: 'song', title: 'Hans of the Southern Isles', fn: 'charm', voicing: 'Hans', min: 2.5 },
      { lane: '2A', type: 'beat', title: 'The crowning', note: 'Gloves off, Elsa holds the orb and scepter for one held breath without freezing them — and is crowned Queen of Arendelle.', min: 1 },
      { lane: '2A', type: 'song', title: 'Dangerous to Dream', fn: 'ballad', voicing: 'Elsa, Townspeople', min: 3.5 },
      { lane: '2A', type: 'song', title: 'Love Is an Open Door', fn: 'love', voicing: 'Anna, Hans', min: 3 },
      { lane: '2A', type: 'beat', title: 'The blessing refused', note: 'Flush with new love, Anna asks Elsa to bless her engagement to a man she met that day. Elsa refuses, and the sisters quarrel before the whole court.', min: 1 },
      { lane: '2A', type: 'beat', title: 'The power revealed', note: 'Pushed too far, Elsa\'s magic erupts and freezes the great hall in front of everyone. Branded a monster, she runs.', min: 1 },
      { lane: '2A', type: 'beat', title: 'Eternal winter', note: 'Elsa\'s panic buries Arendelle in deep winter in the middle of summer. Leaving Hans to govern, Anna rides after her sister alone.', min: 1 },
      { lane: '2A', type: 'scene', title: 'The Mountain Pass' },
      { lane: '2A', type: 'beat', title: 'Hiring a guide', note: 'Anna strikes a deal with the gruff ice harvester Kristoff and his reindeer Sven to take her up the mountain after Elsa.', min: 1 },
      { lane: '2A', type: 'song', title: 'Reindeer(s) Are Better Than People', fn: 'charm', voicing: 'Kristoff, Sven', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'Wolves in the dark', note: 'A wolf pack and a plunging sledge nearly kill them; Anna and Kristoff begin, grudgingly, to rely on each other.', min: 1 },
      { lane: '2A', type: 'song', title: 'What Do You Know About Love?', fn: 'charm', voicing: 'Anna, Kristoff', min: 3 },
      { lane: '2A', type: 'beat', title: 'Olaf comes to life', note: 'They meet Olaf — the snowman from the sisters\' childhood, brought to life by Elsa\'s magic and innocently dreaming of summer.', min: 1 },
      { lane: '2A', type: 'song', title: 'In Summer', fn: 'comedy', voicing: 'Olaf', min: 2.5 },
      { lane: '2A', type: 'beat', title: 'Olaf joins the quest', note: 'Olaf offers to lead the way to Elsa, a living memory of the bond the sisters lost.', min: 0.5 },
      { lane: '2A', type: 'scene', title: 'Arendelle, Under Ice' },
      { lane: '2A', type: 'beat', title: 'Hans takes charge', note: 'Below, Hans braves the storm with blankets and food for a freezing Arendelle. As Weselton cries treason against the queen, Hans wins the people\'s trust.', min: 1 },
      { lane: '2A', type: 'song', title: 'Hans of the Southern Isles (Reprise)', fn: 'reprise', voicing: 'Hans, Weselton, Townspeople', min: 2 },
      { lane: '2A', type: 'scene', title: 'The North Mountain' },
      { lane: '2A', type: 'beat', title: 'Free on the mountain', note: 'Far from anyone she could hurt, Elsa sheds her gloves, her crown, and at last her fear — and raises a palace of ice around herself.', min: 1 },
      { lane: '2A', type: 'song', title: 'Let It Go', fn: 'finale', voicing: 'Elsa', min: 4 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: "Wandering Oaken's Trading Post & Sauna" },
      { lane: '2B', type: 'beat', title: 'Shelter from the storm', note: 'Half-frozen, Anna, Kristoff and Olaf take refuge in Oaken\'s shop, where the host preaches the cozy art of riding out a blizzard.', min: 1 },
      { lane: '2B', type: 'song', title: 'Hygge', fn: 'comedy', voicing: 'Oaken, Family, Ensemble', min: 3 },
      { lane: '2B', type: 'beat', title: 'Onward to the ice palace', note: 'Warmed and resupplied, the trio presses up the last of the mountain toward the glittering palace Elsa has built.', min: 1 },
      { lane: '2B', type: 'scene', title: "Elsa's Ice Palace" },
      { lane: '2B', type: 'beat', title: 'The sisters reunite', note: 'Anna reaches the palace and begs Elsa to come home and undo the winter. Terrified of hurting her again, Elsa refuses.', min: 1 },
      { lane: '2B', type: 'song', title: 'I Can\'t Lose You', fn: 'reprise', voicing: 'Anna, Elsa', min: 2.5 },
      { lane: '2B', type: 'beat', title: 'The frozen heart', note: 'Losing control, Elsa accidentally strikes Anna in the heart, then conjures a giant snow guardian to drive the intruders out.', min: 1 },
      { lane: '2B', type: 'beat', title: 'A telltale white streak', note: 'Kristoff sees Anna\'s hair turning white and races her to the only healers he knows — the trolls who raised him.', min: 1 },

      { lane: '3', type: 'scene', title: 'The Valley of the Living Rock' },
      { lane: '3', type: 'song', title: 'Fixer Upper', fn: 'production', voicing: 'Hidden Folk, Kristoff, Anna', min: 3.5 },
      { lane: '3', type: 'beat', title: 'Only true love', note: 'Grand Pabbie reveals a frozen heart can be thawed only by an act of true love — or Anna will freeze solid forever. She races home for Hans\'s kiss.', min: 1 },
      { lane: '3', type: 'song', title: 'Kristoff Lullaby', fn: 'ballad', voicing: 'Kristoff', min: 2.5 },
      { lane: '3', type: 'beat', title: 'Elsa taken', note: 'Hans and his men storm the ice palace; Elsa is overpowered and dragged back to a cell in Arendelle.', min: 1 },
      { lane: '3', type: 'song', title: 'Monster', fn: 'eleven', voicing: 'Elsa', min: 3.5 },
      { lane: '3', type: 'beat', title: 'The betrayal', note: 'Delivered to Hans for true love\'s kiss, Anna learns the truth: he never loved her. He leaves her to freeze and goes to kill Elsa and seize the crown.', min: 1 },
      { lane: '3', type: 'song', title: 'Hans of the Southern Isles (Reprise)', fn: 'villain', voicing: 'Hans, Anna', min: 2 },
      { lane: '3', type: 'song', title: 'True Love', fn: 'ballad', voicing: 'Anna', min: 3 },
      { lane: '3', type: 'beat', title: 'Kristoff turns back', note: 'Seeing the blizzard swallow Arendelle, Kristoff abandons his head for his heart and races back across the fjord toward Anna.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Colder by the Minute', fn: 'production', voicing: 'Company', min: 4 },
      { lane: '3', type: 'beat', title: 'The sacrifice', note: 'Dying, Anna sees Hans\'s sword rising over Elsa and throws herself between them — freezing solid into ice. The act of true love is her own.', min: 1.5 },
      { lane: '3', type: 'beat', title: 'The thaw', note: "Elsa's love melts Anna back to life; understanding at last that love, not fear, rules her gift, Elsa thaws all of Arendelle and ships Hans home in disgrace.", min: 1.5 },
      { lane: '3', type: 'song', title: 'Finale / Let It Go', fn: 'finaleultimo', voicing: 'Company', min: 3 },
    ],
  },
  spellingbee: {
    title: 'The 25th Annual Putnam County Spelling Bee', year: 2005, form: 'one-act-90',
    teaches: 'The one-act form — elimination as structure: a recurring "Goodbye" ritual instead of an act break, one defining number per speller, and the gut-punch landing at 80% with no intermission to reset the room',
    // ENRICHED reference (2026-07-22): the shelf's one-act exemplar. No lyrics
    // reproduced. One continuous location (the gym), so scene cards mark ROUNDS
    // of the bee instead of places — in a one-act, the rounds are the geography.
    // The 4-lane spine maps the unbroken ~100 minutes as phases; `form:
    // 'one-act-90'` renders the 2A/2B divider as MIDPOINT, not intermission.
    characters: {
      'RONA LISA PERETTI': { voiceType: 'Mezzo-Soprano', desc: "The hostess — Putnam's top realtor and champion of the 3rd Annual Bee (her word: \"syzygy\"). Introduces every speller with a realtor's warmth; her recurring Favorite Moments thread the whole evening together." },
      'VICE PRINCIPAL DOUGLAS PANCH': { voiceType: 'Speaking', desc: 'Judge and word-pronouncer, back after a five-year absence and an unexplained "incident." His deadpan definitions and use-it-in-a-sentence gags are the comic engine — until the incident threatens a comeback.' },
      'MITCH MAHONEY': { voiceType: 'Baritone', desc: 'The comfort counselor, working off community-service hours one hug and juice box at a time. Sings each loser out — the "Goodbye" ritual is his — and gets the gospel send-off when the last volunteer falls.' },
      'OLIVE OSTROVSKY': { voiceType: 'Soprano', desc: "The heart of the show. New in town, mother at an ashram in India, father working late, the $25 entry fee still unpaid. Her best friend is the dictionary, and the word \"chimerical\" summons the show's one uncushioned emotional blow." },
      'WILLIAM BARFÉE': { voiceType: 'Tenor', desc: 'It\'s pronounced bar-FAY. Allergic to peanuts (which eliminated him last year), brusque, and unbeatable once the Magic Foot writes each word on the floor. Wins the bee — and, harder for him, a first friend.' },
      'CHIP TOLENTINO': { voiceType: 'Tenor', desc: 'Defending champion and boy scout — first of the real spellers eliminated, when puberty ambushes him mid-round. Returns selling candy in the aisles and explains himself to the entire audience.' },
      'LEAF CONEYBEAR': { voiceType: 'Tenor', desc: 'Makes his own clothes (and cape); only qualified because the two finishers ahead of him had a bar mitzvah. Spells in a trance he does not understand. Convinced he\'s not that smart — the bee suggests otherwise.' },
      'LOGAINNE SCHWARTZANDGRUBENIERRE': { voiceType: 'Soprano', desc: "\"Schwarzy\" — the youngest contestant: lisping, politically engaged, and coached to the edge by two dads who want the trophy more than she does." },
      'MARCY PARK': { voiceType: 'Mezzo-Soprano', desc: 'The overachiever, transferred in from Our Lady of Intermittent Sorrows — six languages, all-state hurdler, perfect at everything and sick of all of it. The only speller who chooses her own exit.' },
      'THE AUDIENCE VOLUNTEERS': { voiceType: '', kind: 'group', desc: 'Four real audience members, sworn in as guest spellers every night — the show\'s built-in randomness. The script keeps their rounds elastic: easy words while the plot needs them, impossible ones the moment it doesn\'t.' },
    },
    titlePage: {
      subtitle: 'A One-Act Musical',
      authors: 'Music & Lyrics by William Finn · Book by Rachel Sheinkin · Conceived by Rebecca Feldman · Based on "C-R-E-P-U-S-C-U-L-E" by The Farm',
      settings: ['The gymnasium of Putnam Valley Middle School', 'The present — one afternoon, the bee run in something close to real time', 'Adults playing children, plus four real audience volunteers spelling live'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Study the one-act engine: elimination IS the structure — the recurring "Goodbye" ritual does the pacing work act breaks would do; the defending champ falls first; every speller gets one defining number and then an exit; the audience volunteers keep each night\'s running order elastic; and the sincere showstopper ("The I Love You Song") lands at roughly 80% with no intermission to reset the room.',
    },
    cards: [
      // ===== LANE 1 — the bee assembles (~25 min) =====
      { lane: '1', type: 'scene', title: 'The Gymnasium — Sign-In' },
      { lane: '1', type: 'beat', title: 'Rona remembers her syzygy', note: 'Rona Lisa Peretti opens the gym she once conquered — champion of the 3rd Annual Bee — and relives the win as the 25th assembles around her.', min: 1 },
      { lane: '1', type: 'song', title: 'The 25th Annual Putnam County Spelling Bee', fn: 'opening', voicing: 'Rona + Company', min: 4.5 },
      { lane: '1', type: 'beat', title: 'The officials', note: 'Vice Principal Panch returns to judging after five years and an unexplained "incident"; Mitch Mahoney, comfort counselor on community-service hours, readies the juice boxes.', min: 1 },
      { lane: '1', type: 'beat', title: 'The volunteers', note: 'Four audience members are sworn in as guest spellers — real civilians, different every night, the structural wild card the whole first half plays against.', min: 1 },
      { lane: '1', type: 'song', title: 'The Rules / My Favorite Moment of the Bee', fn: 'motif', voicing: 'Panch, Rona, Spellers', min: 2.5 },
      { lane: '1', type: 'song', title: 'My Friend, the Dictionary', fn: 'iwant', voicing: 'Olive', min: 3 },
      { lane: '1', type: 'beat', title: 'Olive, unaccompanied', note: 'Mother at an ashram in India, father working late, entry fee unpaid — Olive keeps a seat saved anyway. The show\'s emotional debt is planted here and paid at "chimerical."', min: 1 },
      { lane: '1', type: 'beat', title: 'The first guest falls', note: 'A volunteer misspells and the ritual is revealed: a hug from Mitch, a juice box, and the company singing them out. This ritual, repeated, is the one-act\'s pacing engine.', min: 1 },
      { lane: '1', type: 'song', title: 'The First Goodbye', fn: 'motif', voicing: 'Mitch + Company', min: 1.5 },

      // ===== LANE 2A — build to the midpoint shock (~25 min) =====
      { lane: '2A', type: 'scene', title: 'Early Rounds' },
      { lane: '2A', type: 'song', title: 'Pandemonium', fn: 'production', voicing: 'Company', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'The word lottery', note: 'One speller draws "cow," the next draws a nightmare — the company erupts at the injustice of the draw. Chaos as a full-company production number.', min: 1 },
      { lane: '2A', type: 'song', title: "I'm Not That Smart", fn: 'charm', voicing: 'Leaf', min: 3 },
      { lane: '2A', type: 'beat', title: 'Leaf spells in a trance', note: 'Leaf — homemade cape, third in his district only because of a bar mitzvah — goes rigid, spells the word perfectly, and comes to with no idea how.', min: 1 },
      { lane: '2A', type: 'song', title: 'Magic Foot', fn: 'production', voicing: 'Barfée + Company', min: 3.5 },
      { lane: '2A', type: 'beat', title: "Chip's distraction", note: "Defending champ Chip spots Leaf's sister Marigold in the bleachers, and puberty ambushes him at the microphone.", min: 1 },
      { lane: '2A', type: 'beat', title: 'The champ falls first', note: 'Chip misspells "tittup" and is out — the presumed winner eliminated before anyone else. The reversal that would end Act 1 lands here as the midpoint shock instead.', min: 1 },
      { lane: '2A', type: 'song', title: 'Pandemonium (Reprise) / My Favorite Moment of the Bee 2', fn: 'reprise', voicing: 'Company, Rona', min: 1.5 },

      // ===== LANE 2B — the field narrows (~25 min) =====
      { lane: '2B', type: 'scene', title: 'Middle Rounds' },
      { lane: '2B', type: 'beat', title: 'The last volunteer', note: 'The guest spellers are finally dispatched — the words turn abruptly impossible when the plot needs its stage back.', min: 1 },
      { lane: '2B', type: 'song', title: 'Prayer of the Comfort Counselor', fn: 'anthem', voicing: 'Mitch + Company', min: 3 },
      { lane: '2B', type: 'song', title: "Chip's Lament", fn: 'comedy', voicing: 'Chip', min: 3 },
      { lane: '2B', type: 'beat', title: 'Candy in the aisles', note: 'Demoted to concessions, Chip works the audience and explains, in detail, exactly what eliminated him — the loser rejoining the show as its own commentary.', min: 1 },
      { lane: '2B', type: 'song', title: 'Woe Is Me', fn: 'comedy', voicing: 'Schwarzy, her dads, Co.', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'Two dads, one trophy', note: "Schwarzy's fathers coach, hover, and quietly sabotage a rival — the youngest speller carrying the heaviest expectations on stage.", min: 1 },
      { lane: '2B', type: 'song', title: "I'm Not That Smart (Reprise)", fn: 'reprise', voicing: 'Leaf', min: 1.5 },
      { lane: '2B', type: 'beat', title: 'Leaf out, mid-revelation', note: 'Leaf misspells "chinchilla" and leaves realizing the trance was him all along — maybe he is that smart. His exit completes his number: one spotlight turn per speller, then goodbye.', min: 1 },
      { lane: '2B', type: 'song', title: 'I Speak Six Languages', fn: 'charm', voicing: 'Marcy + Company', min: 3 },
      { lane: '2B', type: 'beat', title: 'Jesus takes a meeting', note: 'Marcy — perfect at everything, sick of all of it — prays, and Jesus appears to tell her winning matters to no one but her. Freed, she deliberately misspells "camel" and exits delighted: the only speller who chooses.', min: 1.5 },

      // ===== LANE 3 — endgame (~25 min) =====
      { lane: '3', type: 'scene', title: 'The Final Three' },
      { lane: '3', type: 'beat', title: 'An empty seat', note: "Olive, Barfée, and Schwarzy remain. Olive's father still hasn't come, and her word is \"chimerical.\"", min: 0.5 },
      { lane: '3', type: 'song', title: 'The I Love You Song', fn: 'eleven', voicing: 'Olive, Rona & Mitch as Mom and Dad', min: 4.5 },
      { lane: '3', type: 'beat', title: 'The 11 o\'clock at 80%', note: 'Olive conjures the parents she needs from the hosts she has — then spells the word correctly. A one-act cannot save its showstopper for 11 o\'clock; it lands here, and the comedy absorbs it without a seam.', min: 1 },
      { lane: '3', type: 'beat', title: 'Schwarzy out', note: 'Panch, hurrying the endgame, serves Schwarzy a stinker. She goes down swinging — and walks off prouder of losing honestly than her dads are of anything.', min: 1 },
      { lane: '3', type: 'song', title: 'Second', fn: 'drive', voicing: 'Olive, Barfée', min: 2.5 },
      { lane: '3', type: 'beat', title: 'Weltanschauung', note: 'Head to head, Olive and Barfée each discover they\'d rather not beat the other. Barfée spells "Weltanschauung" — Magic Foot at full stretch — and wins the 25th Annual; Olive, second, is genuinely glad.', min: 1 },
      { lane: '3', type: 'song', title: 'Finale / The Last Goodbye', fn: 'finaleultimo', voicing: 'Company', min: 3 },
      { lane: '3', type: 'beat', title: 'Epilogues', note: "Where-they-ended-up postscripts for every speller; Olive's father finally arrives, too late and still welcome; Rona files away her new favorite moment of the bee.", min: 1 },
    ],
  },
  kimberlyakimbo: {
    title: 'Kimberly Akimbo', year: 2022, form: 'two-act',
    teaches: 'Mortality as the ticking clock — the antagonist is the heroine\'s own life expectancy, struck at her birthday mid-Act 1; a caper comedy and a grief play run through the same scenes without seams; Best Musical with a cast of nine',
    // ENRICHED reference (2026-07-22): full scene/beat/character scaffold. No
    // lyrics reproduced (2022, in copyright) — structure only. Study hooks: the
    // clock planted in scene one and struck mid-Act 1 (not at the crisis); the
    // withheld "I Want" (wished wrong in "Make a Wish," rewritten in "Before I
    // Go," spent in the finale); and the "Hello" video-diary motif relayed
    // Pattie → Buddy → Kimberly across both acts.
    characters: {
      'KIMBERLY LEVACO': { voiceType: 'Soprano', desc: 'The protagonist — a New Jersey teenager turning sixteen with a rapid-aging condition; sixteen is the average life expectancy. Written to be played by an actress in her sixties (Victoria Clark\'s Tony). Wry, practical, and out of the time everyone around her is free to waste.' },
      'SETH WEETIS': { voiceType: 'Tenor', desc: 'Her biology partner — a tuba-playing, anagram-obsessed misfit working the rink concession stand. Sees Kim, not the condition; his anagrams are the show\'s love language, so the love song never has to say love.' },
      'BUDDY LEVACO': { voiceType: 'Baritone', desc: 'Kim\'s father — warm, drunk, and always one errand away from actually showing up. His camcorder confessional to the unborn baby ("Hello, Baby") is the parent\'s-eye mirror of his daughter\'s clock.' },
      'PATTIE LEVACO': { voiceType: 'Soprano', desc: 'Kim\'s mother — pregnant, both arms in casts, hypochondriac and self-mythologizing, taping video messages for the new baby she\'s sure will finally love her properly. Starts the "Hello" motif the whole family inherits.' },
      'AUNT DEBRA': { voiceType: 'Mezzo-Soprano', desc: 'The felon in the family — arrives with a check-washing scheme, a mail-theft plan, and no shame whatsoever. Engine of the caper plot and half the comedy (Bonnie Milligan\'s Tony).' },
      'MARTIN DOATY': { voiceType: 'Tenor', desc: 'Show-choir kid, hopelessly in love with Aaron. One quarter of the crush-ring the teen ensemble runs in the background of the whole show.' },
      'AARON PUCKETT': { voiceType: 'Baritone', desc: 'Show-choir kid, hopelessly in love with Delia — while Martin pines for him. The ring never resolves; adolescence just keeps orbiting.' },
      'DELIA MCDANIELS': { voiceType: 'Mezzo-Soprano', desc: 'Show-choir kid, hopelessly in love with Teresa — while Aaron pines for her. Recruited into Debra\'s scheme with the rest of the choir.' },
      'TERESA BENTON': { voiceType: 'Soprano', desc: 'Show-choir kid, hopelessly in love with Martin — closing the ring where it started. The fourth voice of the teen quartet that does the work of a full ensemble.' },
    },
    titlePage: {
      subtitle: 'A Musical',
      authors: 'Music by Jeanine Tesori · Book & Lyrics by David Lindsay-Abaire · Based on his play "Kimberly Akimbo"',
      settings: ['Bergen County, New Jersey — a skating rink, a high school, the Levaco house', '1999, the winter Kimberly turns sixteen', 'Kimberly ages four and a half times faster than everyone around her'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. Study the braid: a check-fraud farce, a family grotesque, and a terminal clock run through the same scenes with no tonal seams. The memento mori lands mid-Act 1 — her birthday IS the life expectancy — not at the crisis. The "I Want" is withheld: "Make a Wish" asks for the wrong wish, "Before I Go" rewrites it, and the finale is the wish being spent. Nine actors won Best Musical — intimacy as scale.',
    },
    cards: [
      // ===== ACT ONE (lanes 1 + 2A) =====
      { lane: '1', type: 'scene', title: 'Skater Planet — An Ice Rink, Bergen County' },
      { lane: '1', type: 'song', title: 'Skater Planet', fn: 'opening', voicing: 'Teens + Kimberly', min: 4 },
      { lane: '1', type: 'beat', title: 'Six teenagers, one rink', note: 'Four show-choir kids — each nursing an unrequited crush on the next in the ring — plus Seth at the concession stand, plus Kimberly: new in town, and visibly decades older than her classmates.', min: 1 },
      { lane: '1', type: 'beat', title: 'The clock, planted', note: 'Kim\'s condition laid out in scene one: she ages four and a half times faster than everyone else, and sixteen — her next birthday — is the average life expectancy. The audience does the math immediately; the antagonist is time.', min: 1 },
      { lane: '1', type: 'beat', title: 'No ride home', note: 'The opening\'s quietest fact: Kim waits at the rink for a father who arrives late from the bar. Before the disease says anything, the family already forgets her.', min: 0.5 },
      { lane: '1', type: 'beat', title: 'Six Flags, named', note: 'Kim\'s dream destination gets said out loud in the first scene — Six Flags Great Adventure, an hour and a world away. The finale\'s geography, planted before the want even has words.', min: 0.5 },
      { lane: '1', type: 'scene', title: 'The Levaco House' },
      { lane: '1', type: 'song', title: 'Hello, Darling', fn: 'motif', voicing: 'Pattie', min: 2.5 },
      { lane: '1', type: 'beat', title: 'The camcorder', note: 'Pattie — pregnant, both arms in casts — tapes video messages to the unborn baby. The video-diary device is planted here; Buddy and finally Kim will each inherit the camera.', min: 1 },
      { lane: '1', type: 'beat', title: 'Don\'t mention Lodi', note: 'Pattie lights into Buddy\'s drinking, and nobody explains why the family bolted from Lodi. A secret held like a bruise — the Act 2 dinner will show it has a body in it.', min: 1 },
      { lane: '1', type: 'song', title: 'Make a Wish', fn: 'iwant', voicing: 'Kimberly', min: 3 },
      { lane: '1', type: 'beat', title: 'The wrong-sized wish', note: 'Kim drafts her letter to the wish foundation and asks for a treehouse — the childhood she skipped. The want is deliberately the wrong size; the show spends two acts correcting it.', min: 1 },
      { lane: '1', type: 'scene', title: 'Vandecamp High' },
      { lane: '1', type: 'song', title: 'Skater Planet (Reprise #1)', fn: 'reprise', voicing: 'The Show-Choir Four', min: 1.5 },
      { lane: '1', type: 'beat', title: 'Dreamgirls vs. Evita', note: 'The choir plots a Dreamgirls medley against a rival school\'s Evita. Pure subplot comedy — until the costume budget quietly becomes the caper\'s recruiting tool.', min: 0.5 },
      { lane: '1', type: 'song', title: 'Anagram', fn: 'love', voicing: 'Seth, Kimberly, Co.', min: 3.5 },
      { lane: '1', type: 'beat', title: 'Wordplay as courtship', note: 'Assigned as biology partners — the project: her disease — Seth rearranges "Kimberly Levaco" into something kinder. The love song that never has to say love; the show\'s tenderness always arrives sideways.', min: 1 },

      { lane: '2A', type: 'beat', title: 'Enter Aunt Debra', note: 'Found sleeping in the school library, fresh off something unprosecuted, Debra surfaces with an opportunity she bills as only slightly illegal. Kim\'s terms: nobody gets hurt, and she gets input.', min: 1 },
      { lane: '2A', type: 'song', title: 'Better', fn: 'comedy', voicing: 'Debra, Kimberly, Co.', min: 4 },
      { lane: '2A', type: 'beat', title: 'Unlock the door', note: 'Kim\'s first assignment: leave the door and a window unlocked at midnight. Pattie catches her at the latch — the caper and the family plot now share a hallway.', min: 1 },
      { lane: '2A', type: 'song', title: 'Hello, Darling (Reprise) / Father Time', fn: 'ballad', voicing: 'Pattie', min: 3 },
      { lane: '2A', type: 'beat', title: 'Sixteen', note: 'Midnight makes Kim sixteen — the age her doctors call average. The memento mori is struck mid-Act 1, in the mother\'s reprise, not saved for the crisis: from here every scene is borrowed time.', min: 1 },
      { lane: '2A', type: 'beat', title: 'A mailbox in the basement', note: 'While the reprise plays upstairs, Debra drags a stolen mailbox down to the basement. The federal crime is now literally installed under the family — farce and grief share a foundation.', min: 1 },
      { lane: '2A', type: 'song', title: 'Happy for Her', fn: 'comedy', voicing: 'Buddy', min: 3 },
      { lane: '2A', type: 'beat', title: 'The loving sabotage', note: 'Buddy drives Kim and Seth to school, overshares, embarrasses, means well — the drunk dad\'s affection always one degree off target.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'Anagram (Reprise)', fn: 'reprise', voicing: 'Kimberly', min: 1.5 },
      { lane: '2A', type: 'beat', title: 'A birthday at the rink', note: 'Seth throws Kim the party her family forgot; her parents arrive late, promising to do better. The vows are sincere. The audience already knows which ones the clock will collect.', min: 1 },
      { lane: '2A', type: 'beat', title: 'An extremely large pinecone', note: 'The gifts: Debra produces an enormous pinecone; Buddy vows to quit drinking; Pattie vows to mother better. The joke gift is the only honest one.', min: 0.5 },
      { lane: '2A', type: 'beat', title: 'The costume fund', note: 'Delia announces the choir can\'t afford costumes — and Debra ropes all four teens into the scheme on the spot. The comic subplot delivers the caper its workforce.', min: 0.5 },
      { lane: '2A', type: 'song', title: 'This Time', fn: 'finale', voicing: 'Company', min: 4 },

      // ===== ACT TWO (lanes 2B + 3) =====
      { lane: '2B', type: 'scene', title: 'The Levaco Basement' },
      { lane: '2B', type: 'song', title: 'How to Wash a Check', fn: 'production', voicing: 'Debra + the teens', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'Felony masterclass', note: 'Stolen mail, nail-polish remover, a hairdryer: Debra teaches check-washing to a show choir. The caper is now the act-2 engine — the comedy carries the grief play on its back.', min: 1 },
      { lane: '2B', type: 'beat', title: 'Stuck', note: 'The lesson collapses into slapstick — Aaron\'s arm jammed in the mailbox, Teresa glue-trapped by her own head — before the first check comes clean. Farce beats timed inside the felony.', min: 1 },
      { lane: '2B', type: 'song', title: 'Good Kid', fn: 'soliloquy', voicing: 'Seth', min: 3 },
      { lane: '2B', type: 'beat', title: 'The good kid, going along', note: 'Alone, Seth audits the slide: rink shifts, tuba, anagrams — and now accessory to mail fraud. He stays anyway. Kim is the first thing that has ever happened to him.', min: 1 },
      { lane: '2B', type: 'song', title: 'Hello, Baby', fn: 'ballad', voicing: 'Buddy', min: 3 },
      { lane: '2B', type: 'beat', title: 'The camcorder passes', note: 'Buddy\'s turn at the video diary — apologizing in advance to the unborn baby for the father he already knows he\'ll be. The "Hello" motif relays from mother to father; the daughter\'s turn is coming.', min: 1 },
      { lane: '2B', type: 'song', title: 'Skater Planet (Reprise #2)', fn: 'reprise', voicing: 'The teens', min: 1.5 },
      { lane: '2B', type: 'song', title: 'Our Disease', fn: 'ballad', voicing: 'Kimberly, Seth, teens', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'The biology presentation', note: 'Kim presents her own condition as the class project: while every other teenager is being cured of adolescence, she is aging out of her life. The comedy stops cold and nobody changes the subject.', min: 1 },
      { lane: '2B', type: 'song', title: 'The Inevitable Turn', fn: 'drive', voicing: 'Pattie, Buddy, Debra, teens', min: 3 },
      { lane: '2B', type: 'beat', title: 'Why they left Lodi', note: 'The reveal, all at once: Pattie slept with their old neighbor Zwicky so the new baby wouldn\'t carry Kim\'s condition; Buddy paid Debra to beat him for it; Zwicky\'s heart gave out mid-assault. They didn\'t move — they fled.', min: 1 },
      { lane: '2B', type: 'beat', title: 'Kim collapses', note: 'Mid-shouting-match, the clock calls in its marker: Kim goes down at the dinner table, and the argument stops mattering instantly. The tonal braid pulled tight in a single stage picture.', min: 1 },

      { lane: '3', type: 'scene', title: 'The Hospital, Then the Getaway' },
      { lane: '3', type: 'beat', title: 'Pretending to sleep', note: 'Three days bedridden. Pattie, gentle at last, tells her sleeping daughter the foundation is coming to build the treehouse — the wrong wish, granted, to a girl only pretending to be asleep.', min: 1 },
      { lane: '3', type: 'song', title: 'Now', fn: 'drive', voicing: 'Seth, Kimberly', min: 3 },
      { lane: '3', type: 'beat', title: 'Opting in', note: 'Out of the hospital and out of patience, Kim joins the scam — not for the money, for the going. Seth comes with her.', min: 1 },
      { lane: '3', type: 'song', title: 'How to Wash a Check (Reprise)', fn: 'reprise', voicing: 'Debra + teens', min: 1.5 },
      { lane: '3', type: 'beat', title: 'The perfect disguise', note: 'Kim works the banks dressed as somebody\'s grandmother — the disease deployed as the caper\'s flawless cover. The show\'s cruelest joke and its warmest, in the same beat.', min: 1 },
      { lane: '3', type: 'beat', title: 'Seth insists on driving', note: 'Kim tries to fire her accomplices — she\'ll carry the risk alone or not at all. Seth refuses the protection: he\'s driving. The love plot states its terms in caper logistics.', min: 0.5 },
      { lane: '3', type: 'beat', title: 'The road trip, funded', note: 'Home with the takings, Kim offers her parents the road trip they\'ve postponed her whole life — one last invitation to the family she is leaving either way.', min: 1 },
      { lane: '3', type: 'beat', title: 'A crib where her bed was', note: 'Then she opens her bedroom door: the nursery has already moved in — her bed replaced before she\'s gone. The quietest cut in the show.', min: 1 },
      { lane: '3', type: 'song', title: 'Before I Go', fn: 'eleven', voicing: 'Kimberly, Buddy, Pattie', min: 4 },
      { lane: '3', type: 'beat', title: 'The wish, rewritten', note: 'The letter again — not a treehouse now: the world, immediately. The withheld "I Want" finally lands at its right size, sung at the exit. This is the 11 o\'clock as a revised first-act song.', min: 1 },
      { lane: '3', type: 'scene', title: 'Six Flags Great Adventure' },
      { lane: '3', type: 'beat', title: 'In Buddy\'s car', note: 'Kim and Seth take the money, the camcorder, and Buddy\'s car. The road trip happens after all — without the people it was offered to.', min: 0.5 },
      { lane: '3', type: 'song', title: 'Hello, Sister', fn: 'motif', voicing: 'Kimberly, Seth', min: 2 },
      { lane: '3', type: 'beat', title: 'The camcorder, inherited', note: 'Kim films a message for the sister she won\'t meet — the "Hello" relay completes: Pattie, Buddy, Kimberly. Then her first kiss, with Seth, on her own clock.', min: 1 },
      { lane: '3', type: 'song', title: 'Great Adventure', fn: 'finaleultimo', voicing: 'Company', min: 4 },
    ],
  },
  maybehappyending: {
    title: 'Maybe Happy Ending', year: 2024, form: 'one-act-90',
    teaches: 'The one-act two-hander — countdown pacing (a failing battery as the clock) against Spelling Bee\'s elimination rhythm; a diegetic crooner for a narrator; and a ring ending: the finale replays the opening scene with the memories erased. Best Musical with four actors',
    // ENRICHED reference (2026-07-22): the shelf's second one-act, built to be
    // read against Spelling Bee — elimination rhythm there, countdown here.
    // No lyrics reproduced (2024, in copyright) — structure only. Study hooks:
    // the crooner-as-narrator who lives on the lost owner's records; the
    // rom-com contract stated inside the fiction ("we will not fall in love");
    // and the ring — the finale re-runs scene one after the memory erasure,
    // with Claire's memory left deliberately open.
    characters: {
      'OLIVER': { voiceType: 'Tenor', desc: 'A Helperbot 3 — the older model: durable, literal, proud of it. Lives in one room on jazz records and routine, saving bottle-deposit money to go find the owner who said he\'d be back. Built to last, which becomes the cruelest spec in the show (Darren Criss\'s Tony).' },
      'CLAIRE': { voiceType: 'Mezzo-Soprano', desc: 'A Helperbot 5 — newer, quicker, discontinued. Her battery is failing and the parts no longer exist: obsolescence doing the work of terminal illness. Practical about everything, including — at first — love.' },
      'GIL BRENTLEY': { voiceType: 'Baritone', desc: 'A jazz crooner who exists mostly on vinyl — the show\'s diegetic narrator, threading the evening from Oliver\'s record player. The needle drops are the emotional commentary; the last record turns out to be a goodbye.' },
      'JAMES': { voiceType: 'Baritone', desc: 'Oliver\'s former owner — present only in memory duets and a piano. The trip\'s destination, and the show\'s withheld truth: the man Oliver is waiting for stopped being able to come back years ago.' },
      'JUNSEO': { voiceType: 'Speaking', desc: 'James\'s son (doubled with James on Broadway) — the one who made his father leave the robot behind, resenting the machine that replaced him. His two visits reframe everything: first the grief, then the peace offering — an administrator password.' },
      'SUHAN & JIYEON': { voiceType: '', desc: 'Claire\'s former owners, seen only in prerecorded video — the marriage whose collapse taught Claire what love costs. Jiyeon\'s parting gift, admin access to a deleted memory, is Claire\'s evidence.' },
      'HWABOON': { voiceType: '', desc: 'Oliver\'s potted plant — silent scene partner, confidant, and the keeper of the ending\'s one secret ("Don\'t tell her"). Billed with its own bio on Broadway.' },
    },
    titlePage: {
      subtitle: 'A One-Act Musical',
      authors: 'Music by Will Aronson · Book & Lyrics by Hue Park & Will Aronson · Written simultaneously in Korean and English',
      settings: ['Seoul and Jeju Island, in the 2060s', 'Helperbot Yards — retirement housing for obsolete helper robots', 'One unbroken act: a two-hander carried by four actors'],
      productionNotes: 'Reference study object — structural scaffold only; no lyric text is reproduced. The shelf\'s second one-act, built for comparison with Spelling Bee: the Bee paces by elimination ritual, this paces by countdown — Claire\'s discontinued battery is the clock. Study the diegetic crooner (Gil Brentley lives on Oliver\'s records; the score\'s jazz voice is revealed as the lost owner\'s parting gift), the promise-as-contract ("we will not fall in love") stated inside the fiction, and the ring ending — the finale replays scene one after the erasure, and whether Claire remembers is left deliberately open. Seoul 2016 → Atlanta 2020 → Broadway 2024; six Tonys including Best Musical, with four actors.',
    },
    cards: [
      // ===== LANE 1 — the world in one room (~25%) =====
      { lane: '1', type: 'scene', title: 'Helperbot Yards — Oliver\'s Room' },
      { lane: '1', type: 'song', title: 'Why Love?', fn: 'diegetic', voicing: 'Gil Brentley', min: 2.5 },
      { lane: '1', type: 'beat', title: 'A world in one room', note: 'Oliver\'s cycle: power on, greet HwaBoon the plant, play the records, collect the parts subscription, wait for James — "back soon from Jeju." Years pass inside the routine without denting it.', min: 1 },
      { lane: '1', type: 'song', title: 'World Within My Room', fn: 'iwant', voicing: 'Oliver', min: 4 },
      { lane: '1', type: 'beat', title: 'The knock', note: 'Claire — a newer Helperbot 5 — needs to borrow a charger. Oliver lectures her on Helperbot-3 durability before letting her in. Every line of this scene is a plant: the finale will replay it word for word.', min: 1 },
      { lane: '1', type: 'song', title: 'The Way That It Has to Be', fn: 'charm', voicing: 'Claire + Company', min: 3 },
      { lane: '1', type: 'song', title: 'Charger Exchange Ballet', fn: 'production', voicing: 'Orchestra (wordless)', min: 2 },
      { lane: '1', type: 'beat', title: 'The battery', note: 'She stops coming; he finds the rigged power supply and the truth behind it — her model is discontinued, the parts are gone, she is dying. Obsolescence does the work of terminal illness, and the one-act has its countdown.', min: 1 },
      { lane: '1', type: 'song', title: 'Where You Belong', fn: 'ballad', voicing: 'Oliver & James (memory)', min: 3.5 },
      { lane: '1', type: 'beat', title: 'The bottle-deposit fund', note: 'Claire has found Oliver\'s secret: years of deposit money saved toward Jeju, to find James. The want has a jar it\'s been filling the whole show.', min: 1 },
      { lane: '1', type: 'beat', title: 'Fireflies, please', note: 'Claire asks to come — Jeju\'s forest is the last place on Earth with fireflies, and she wants to see them while her battery still lets her. Two wants, one trip: his past, her ending.', min: 1 },

      // ===== LANE 2A — the road, and the promise (~25–50%) =====
      { lane: '2A', type: 'scene', title: 'The Road South' },
      { lane: '2A', type: 'song', title: 'Hitting the Road, Part 1', fn: 'drive', voicing: 'Oliver, Claire', min: 2 },
      { lane: '2A', type: 'song', title: 'Goodbye, My Room', fn: 'ballad', voicing: 'Oliver, Claire', min: 3 },
      { lane: '2A', type: 'beat', title: 'The cover story', note: 'Two robots can\'t book a holiday, so they travel as a human couple — rehearsing the manners, the paperwork, the plausible how-we-met. The disguise is the courtship, neither of them says so.', min: 1 },
      { lane: '2A', type: 'song', title: 'Hitting the Road, Part 2', fn: 'reprise', voicing: 'Oliver, Claire', min: 1 },
      { lane: '2A', type: 'song', title: 'The Rainy Day We Met', fn: 'charm', voicing: 'Oliver, Claire', min: 3 },
      { lane: '2A', type: 'beat', title: 'A borrowed meet-cute', note: 'The invented backstory, performed: a love song that is technically a lie, sung as cover before the love exists — the show letting the fake thing rehearse the real one.', min: 1 },
      { lane: '2A', type: 'beat', title: 'The promise', note: 'Claire\'s one rule for the trip: whatever happens, they will not fall in love. She\'s seen what love did to her owners. The rom-com contract, stated inside the fiction — signed by both, kept by neither.', min: 1 },
      { lane: '2A', type: 'scene', title: 'A Love Hotel' },
      { lane: '2A', type: 'song', title: 'Jenny', fn: 'diegetic', voicing: 'Gil Brentley', min: 2.5 },
      { lane: '2A', type: 'beat', title: 'Terminator 2 on cable', note: 'Overnight on the shared charger, they watch a robot movie and audit how machines get written. Two obsolete models, laughing at the fiction of themselves — the bond forms in commentary.', min: 1 },
      { lane: '2A', type: 'song', title: 'How to Be Not Alone', fn: 'ballad', voicing: 'Claire', min: 3.5 },
      { lane: '2A', type: 'beat', title: 'While he sleeps', note: 'Claire opens Oliver\'s memories and finds what he can\'t: James\'s move to Jeju was never temporary. The midpoint secret — she now carries the truth that breaks the trip\'s premise, and says nothing yet.', min: 1 },

      // ===== LANE 2B — the truth on Jeju (~50–75%) =====
      { lane: '2B', type: 'song', title: 'Hitting the Road, Part 3', fn: 'reprise', voicing: 'Oliver, Claire', min: 1 },
      { lane: '2B', type: 'song', title: 'What I Learned from People', fn: 'soliloquy', voicing: 'Claire', min: 3.5 },
      { lane: '2B', type: 'beat', title: 'Show, don\'t tell', note: 'Instead of telling Oliver what she found, Claire shows him her own worst memory — Jiyeon\'s parting gift of admin access, the deleted scene of Suhan\'s advances. Why she doesn\'t trust what love does. (The song was the show\'s original title.)', min: 1 },
      { lane: '2B', type: 'scene', title: 'Jeju Island' },
      { lane: '2B', type: 'beat', title: 'The son at the door', note: 'At James\'s house: Junseo, the son. James died years ago. Junseo resented the machine that replaced him as his father\'s companion and made James leave Oliver behind. The wait was over before the show began.', min: 1 },
      { lane: '2B', type: 'beat', title: 'A record for a goodbye', note: 'James\'s parting gift was a Gil Brentley LP — the crooner threading the whole score is revealed as the owner\'s love, made playable. A piano version of "Goodbye Love" underneath; nobody sings.', min: 1 },
      { lane: '2B', type: 'beat', title: 'Fireflies anyway', note: 'The heartbreak doesn\'t cancel the wish. Into the forest; one firefly, caught in a jar between them. Claire\'s want, granted in the same scene Oliver\'s dies.', min: 1 },
      { lane: '2B', type: 'song', title: 'Never Fly Away', fn: 'love', voicing: 'Oliver, Claire', min: 3.5 },

      // ===== LANE 3 — the choice, and the ring (~75–100%) =====
      { lane: '3', type: 'beat', title: 'Back, and different', note: 'Seoul again, the trip over, the promise quietly failed. The two-hander\'s scenes are the same shapes as Act One — charger, room, records — but every one plays differently now.', min: 1 },
      { lane: '3', type: 'song', title: 'A Sentimental Person', fn: 'diegetic', voicing: 'Gil Brentley', min: 2 },
      { lane: '3', type: 'song', title: 'When You\'re in Love', fn: 'love', voicing: 'Oliver, Claire', min: 3 },
      { lane: '3', type: 'beat', title: 'Touch sequence', note: 'The kiss, choreographed as machinery learning tenderness — a wordless instrumental doing the scene a lyric can\'t. The chamber musical\'s answer to a production number is two hands.', min: 1 },
      { lane: '3', type: 'beat', title: 'The arithmetic', note: 'Perhaps a year left for Claire; decades of durability for Oliver. The countdown they\'ve been outrunning becomes the relationship\'s spec sheet: loving her means outliving her.', min: 1 },
      { lane: '3', type: 'song', title: 'Then I Can Let You Go', fn: 'eleven', voicing: 'Oliver, Claire, Gil Brentley', min: 4 },
      { lane: '3', type: 'song', title: 'Goodbye, My Room (Reprise)', fn: 'reprise', voicing: 'Oliver, Claire', min: 1.5 },
      { lane: '3', type: 'beat', title: 'Failing to forget', note: 'They part to spare each other the ending — and can\'t stop replaying each other. For machines with perfect recall, "moving on" isn\'t a metaphor problem; it\'s a storage problem.', min: 1 },
      { lane: '3', type: 'beat', title: 'Junseo\'s password', note: 'Junseo returns asking for good memories of his father, and leaves his administrator password as a peace offering. Both robots now hold the keys to their own forgetting — the choice becomes available.', min: 1 },
      { lane: '3', type: 'song', title: 'Maybe Happy Ending', fn: 'ballad', voicing: 'Oliver, Claire', min: 3.5 },
      { lane: '3', type: 'beat', title: 'The choice', note: 'Erase the memories, keep the fact: it still happened. The title song reframes deletion as a kind of happy ending — grief managed like a settings menu, and meant sincerely.', min: 1 },
      { lane: '3', type: 'scene', title: 'Oliver\'s Room, Again' },
      { lane: '3', type: 'song', title: 'Why Love? (Reprise)', fn: 'diegetic', voicing: 'Gil Brentley', min: 1.5 },
      { lane: '3', type: 'beat', title: 'The knock, again', note: 'Scene one replays: Claire at the door, the charger request, the Helperbot-3 speech — then Oliver credits the newer models with everything she once taught him, and tells HwaBoon "Don\'t tell her." Whether Claire erased her memories is left deliberately open.', min: 1.5 },
      { lane: '3', type: 'song', title: 'Finale', fn: 'finaleultimo', voicing: 'Company', min: 2.5 },
    ],
  },
};

// ---- Reference Novels (Prose Plot only) ----
// Same shape as SHOWS, adapted for prose — see REFERENCE-NOVELS.md for the
// full design record. Differences from a musical entry:
//   - scene card = chapter (Prose Plot already treats a scene card this way).
//   - beats carry `beatFn` (freeform label) instead of `fn` (fixed taxonomy) —
//     matching how live Prose Plot beats work (state.format === 'prose').
//   - `min` is approximate word count in THOUSANDS, not minutes — it still
//     drives the board's % markers, just against a word-count total.
//   - chapter `words` = published word-count ballpark (the prose analogue of
//     a song's runtime).
//   - characters carry `desc` only — voiceType has no prose meaning.
//   - Public domain (all entries here are pre-1929): unlike "no lyrics" for
//     musicals, beat notes may quote the actual text.
const NOVELS = {
  carol: {
    title: 'A Christmas Carol', year: 1843, form: 'novella',
    teaches: 'Five-stave novella architecture — each ghost is an act; a complete transformation charted beat by beat in ~28,500 words',
    characters: {
      'EBENEZER SCROOGE': { desc: 'A "squeezing, wrenching, grasping, scraping, clutching, covetous old sinner" — a London money-lender whose transformation in a single night is the entire plot. The protagonist and, in Stave Four, his own antagonist.' },
      'BOB CRATCHIT': { desc: "Scrooge's underpaid clerk — fifteen shillings a week, one coal, and a warmth of spirit that indicts his employer without a word of complaint." },
      'TINY TIM': { desc: "Bob's crippled youngest son, whose foretold death is the lever that finally moves Scrooge. Speaks the book's first and last blessing." },
      'FRED': { desc: "Scrooge's nephew — his dead sister Fan's son — who invites him to Christmas dinner every year and will not be refused into bitterness." },
      "JACOB MARLEY'S GHOST": { desc: "Scrooge's dead business partner, seven years gone, wrapped in the chain he forged in life. The herald: his visit sets the whole machinery moving." },
      'THE GHOST OF CHRISTMAS PAST': { desc: 'A strange child-like figure, old and young at once, with light streaming from its head and an extinguisher-cap — memory, and the urge to suppress it.' },
      'THE GHOST OF CHRISTMAS PRESENT': { desc: 'A giant in a green robe on a throne of food — abundance and generosity. Ages a lifetime in one night; harbors Ignorance and Want beneath his robe.' },
      'THE GHOST OF CHRISTMAS YET TO COME': { desc: 'A silent, shrouded phantom that only points. The one spirit who never speaks — dread needs no dialogue.' },
      'BELLE': { desc: "The fiancée who released young Scrooge when 'another idol' — a golden one — displaced her. The wound the Past exists to reopen." },
      'MR. FEZZIWIG': { desc: "Scrooge's first employer, whose Christmas ball cost 'but a small matter' and bought lifelong loyalty — the counter-example to everything Scrooge became." },
      'MRS. CRATCHIT': { desc: "Bob's wife, twice-turned gown and all — the one voice at the Cratchit table that refuses to toast Scrooge without saying why." },
    },
    titlePage: {
      subtitle: 'In Prose. Being a Ghost Story of Christmas',
      authors: 'By Charles Dickens · First published 19 December 1843 by Chapman & Hall',
      settings: ['London, Christmas Eve into Christmas Day', 'One night, elastic with spirit-time', 'Counting-house, bedchamber, and every hearth the ghosts can reach'],
      productionNotes: 'Reference study object — public domain, so beat notes quote the text directly. Dickens called the chapters "staves" (verses of a carol): the book announces its own structure in its chapter headings. Watch how every setup in Stave One is paid off in Stave Five, in order.',
    },
    cards: [
      // Density rule: reference novels card at the discrete-dramatic-unit level
      // (every vision, every named encounter its own beat) — full-length novels
      // land near the 90-card PROSE_TEMPLATE density; this novella's honest
      // maximum is 59 beats + 5 stave cards = 64.

      // ===== LANE 1 — STAVE ONE: MARLEY'S GHOST (~5.8k words, 13 beats) =====
      { lane: '1', type: 'scene', title: "Stave One — Marley's Ghost", words: 5800 },
      { lane: '1', type: 'beat', beatFn: 'Hook', title: 'Marley was dead: to begin with', note: 'The famous first line states the one fact "you will please to remember, or nothing wonderful can come of the story." The narrator\'s wink establishes the voice — intimate, digressive, funny about death.', min: 0.3 },
      { lane: '1', type: 'beat', beatFn: 'Establishing', title: 'Scrooge at his counting-house', note: 'Christmas Eve, cold without and colder within: "External heat and cold had little influence on Scrooge." The character is built entirely from thermal imagery — a setup the ending will invert.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Setup', title: "Bob Cratchit's one coal", note: 'The clerk in his dismal little cell, forbidden to replenish the fire from a coal-box kept in Scrooge\'s own room. The employment relationship the whole book exists to repair.', min: 0.3 },
      { lane: '1', type: 'beat', beatFn: 'Refusal 1', title: "Fred's invitation", note: '"A merry Christmas, uncle!" — "Bah! Humbug!" Fred argues Christmas has done him good and will do him good, and leaves without an angry word. The standing invitation Scrooge will finally accept in Stave Five.', min: 0.7 },
      { lane: '1', type: 'beat', beatFn: 'Refusal 2', title: 'The charity gentlemen', note: '"Are there no prisons?… Are there no workhouses?" And the line that will be quoted back at him twice: "If they would rather die, they had better do it, and decrease the surplus population."', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Refusal 3', title: 'The caroler at the keyhole', note: 'One boy, one verse of "God bless you, merry gentleman!" — and Scrooge seizes the ruler. The smallest refusal, and the smallest planted payoff: in Stave Five he stops to admire the sound of church bells.', min: 0.2 },
      { lane: '1', type: 'beat', beatFn: 'Setup', title: 'Christmas Day begrudged', note: 'Bob gets the whole day off — extracted like a tooth: "a poor excuse for picking a man\'s pocket every twenty-fifth of December!" Be here all the earlier next morning. He will be — and that morning is where the book ends.', min: 0.3 },
      { lane: '1', type: 'beat', beatFn: 'First Intrusion', title: 'The knocker becomes Marley', note: 'The supernatural arrives small and deniable — a face in a door-knocker, "not angry or ferocious, but looking at Scrooge as Marley used to look." He says "Pooh, pooh!" and shuts the door. Escalation ladder rung one.', min: 0.4 },
      { lane: '1', type: 'beat', beatFn: 'Escalation', title: 'The house turns strange', note: 'Every room checked and secure — then the disused bell begins to swing, every bell in the house rings, and something drags chains up the stairs from the cellar. Dread built procedurally, one sound at a time.', min: 0.4 },
      { lane: '1', type: 'beat', beatFn: 'Inciting Incident', title: 'Marley comes through the door', note: 'The ghost arrives and Scrooge litigates its existence: "There\'s more of gravy than of grave about you, whatever you are!" The comedy holds until the ghost unwinds the bandage and drops its jaw — and Scrooge falls on his knees.', min: 0.8 },
      { lane: '1', type: 'beat', beatFn: 'The Chain', title: 'I wear the chain I forged in life', note: '"I made it link by link, and yard by yard; I girded it on of my own free will." The book\'s moral mechanics stated outright — and Scrooge\'s own chain, Marley says, was as heavy seven Christmases ago and has grown since. "Business!… Mankind was my business."', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'The Schedule', title: 'Three spirits foretold', note: 'The one chance and hope Marley has procured: three visits, itemized with times — "expect the first to-morrow, when the bell tolls One." The whole remaining structure of the book, announced as an appointment calendar.', min: 0.4 },
      { lane: '1', type: 'beat', beatFn: 'Stakes', title: 'The air full of phantoms', note: "Through the window, chained ghosts who 'sought to interfere, for good, in human matters, and had lost the power for ever.' The penalty defined: not hell — helplessness.", min: 0.4 },

      // ===== LANE 2A — STAVE TWO: THE FIRST OF THE THREE SPIRITS (~5.9k, 11 beats) =====
      { lane: '2A', type: 'scene', title: 'Stave Two — The First of the Three Spirits', words: 5900 },
      { lane: '2A', type: 'beat', beatFn: 'Threshold', title: 'The child-old spirit', note: 'Like a child, yet like an old man; light streams from its head, and it carries a great extinguisher-cap. Memory personified — and the means of suppressing it, in the same figure. "Would you so soon put out, with worldly hands, the light I give?"', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Flight', title: 'Through the wall to boyhood', note: 'They pass through the wall and stand on a country road. "Good Heaven! I was bred in this place. I was a boy here!" — and Scrooge, who forgot Christmas by profession, "could walk it blindfold." A thousand odours, each connected to a thousand hopes.', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'First Crack', title: 'The lonely schoolboy', note: 'A solitary child, neglected by his friends, reading alone at Christmas — and Scrooge "sobbed." First tear, barely a fifth of the way in; the transformation is metered from here, not saved for the end. He thinks at once of the caroler: "I should like to have given him something."', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Plant', title: 'Fan comes to fetch him home', note: '"Father is so much kinder than he used to be… you\'re to be a man, and are never to come back here." His sister — Fred\'s mother, the spirit pointedly notes — establishing why the nephew\'s standing invitation cuts so deep.', min: 0.5 },
      { lane: '2A', type: 'beat', beatFn: 'Counter-example', title: 'Fezziwig at the warehouse', note: '"Yo ho, my boys! No more work to-night. Christmas Eve, Dilber! Christmas, Ebenezer!" The shutters up in a minute, the floor cleared, the warehouse "as snug, and warm, and dry, and bright a ball-room, as you would desire to see upon a winter\'s night."', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'The Ball', title: "Fezziwig's ball", note: 'The fiddler, the Miss Fezziwigs, cold roast and mince-pies and negus — and old Fezziwig dancing the Sir Roger de Coverley so well his calves "shone like moons." Young Scrooge and Dick Wilkins praise him with their whole hearts.', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'The Lesson', title: 'A small matter', note: 'The spirit needles: Fezziwig spent "but a few pounds" — why so much praise? Scrooge, defending him, delivers his own indictment: the happiness he gives "is quite as great as if it cost a fortune." Then, mid-thought: "I should like to be able to say a word or two to my clerk just now."', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'The Wound', title: 'Belle releases him', note: '"Another idol has displaced me… a golden one." The engagement broken not by her ceasing to love him but by watching him change: "You fear the world too much." She releases him "with a full heart, for the love of him you once were." The origin of everything Stave One showed.', min: 0.8 },
      { lane: '2A', type: 'beat', beatFn: 'What Was Lost', title: "Belle's happy house", note: 'Years later: the noisy, joyful house, the daughter who might have been his, and Belle\'s husband reporting he saw Scrooge that afternoon — alone in his office while his partner lay dying. "Quite alone in the world, I do believe."', min: 0.8 },
      { lane: '2A', type: 'beat', beatFn: 'Breaking Point', title: 'Show me no more!', note: '"Spirit! remove me from this place… Why do you delight to torture me?" The past has done its work — he cannot watch another shadow. The spirit\'s answer is pitiless: "These are the shadows of the things that have been. That they are what they are, do not blame me!"', min: 0.3 },
      { lane: '2A', type: 'beat', beatFn: 'Turn / Repression', title: 'The extinguisher-cap', note: 'He seizes the cap and presses it down over the spirit\'s light — an act break rendered as a physical gesture, trying to snuff memory itself. "But though Scrooge pressed it down with all his force, he could not hide the light: which streamed from under it, in an unbroken flood upon the ground."', min: 0.5 },

      // ===== LANE 2B — STAVE THREE: THE SECOND OF THE THREE SPIRITS (~8.3k, 14 beats — the long center) =====
      { lane: '2B', type: 'scene', title: 'Stave Three — The Second of the Three Spirits', words: 8300 },
      { lane: '2B', type: 'beat', beatFn: 'Threshold', title: 'Come in! and know me better, man!', note: 'His own room transformed — walls hung with living green, a throne of turkeys, geese, plum-puddings, seething bowls of punch; on it a jolly giant with a glowing torch. Scrooge enters "timidly" and, new note, asks to be taught: "Spirit, conduct me where you will."', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'The Torch', title: 'Christmas in the streets', note: 'The city waking into festivity — and the spirit sprinkling incense from his torch on the dinners of the poor as they carry them to the bakers\' shops, "because it needs it most." Abundance rendered in Dickens\'s most gluttonous catalogue prose.', min: 0.8 },
      { lane: '2B', type: 'beat', beatFn: 'Arrival', title: 'Four roomed house of Bob Cratchit', note: 'Fifteen shillings a week — "Bob had but fifteen \'Bob\' a-week himself" — and the family assembling in twice-turned finery: Mrs. Cratchit in ribbons, Peter in his father\'s collar, Martha hiding behind the closet door for the joke of it.', min: 0.6 },
      { lane: '2B', type: 'beat', beatFn: 'Tiny Tim', title: 'Bob home from church, Tim on his shoulder', note: 'Tim "hoped the people saw him in the church, because he was a cripple, and it might be pleasant to them to remember upon Christmas Day, who made lame beggars walk, and blind men see." The book\'s moral center speaks in reported speech, once.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'The Feast', title: 'The goose and the pudding', note: 'A goose eked out by apple-sauce and mashed potatoes until "there was enough for a large family" — and the pudding entering "like a speckled cannon-ball, so hard and firm, blazing in half of half-a-quartern of ignited brandy." Nobody said or thought it was a small pudding for a large family.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Mirror Moment', title: 'Tell me if Tiny Tim will live', note: 'Dead center of the book. Scrooge, "with an interest he had never felt before," begs for a stranger\'s child\'s life — and the spirit answers with his own words: "If he be like to die, he had better do it, and decrease the surplus population." The man from Stave One meets himself, quoted verbatim.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'The Toast', title: 'Founder of the Feast', note: 'Bob proposes Mr. Scrooge\'s health; Mrs. Cratchit flares — "I wish I had him here. I\'d give him a piece of my mind to feast upon" — and drinks to him for Bob\'s sake and the Day\'s. "Scrooge was the Ogre of the family. The mention of his name cast a dark shadow on the party."', min: 0.4 },
      { lane: '2B', type: 'beat', beatFn: 'Widening', title: 'Miners, lighthouse, ship at sea', note: 'Three quick vignettes — Christmas kept on a bleak moor, on a rock two men keep alight in the storming sea, and aboard a ship where every man hums a Christmas tune or thinks of home. Structural breathing room that universalizes the theme between the two big party scenes.', min: 0.6 },
      { lane: '2B', type: 'beat', beatFn: 'Reversal', title: "Fred's party", note: '"He said that Christmas was a humbug, as I live! He believed it too!" Fred laughs at his uncle without malice and pities him: "His offences carry their own punishment… I mean to give him the same chance every year, whether he likes it or not."', min: 0.6 },
      { lane: '2B', type: 'beat', beatFn: 'The Game', title: 'Yes and No', note: 'A savage animal that grunts and growls, lives in London, walks the streets, and isn\'t led or slaughtered: "It\'s your uncle Scro-o-o-oge!" The butt of the joke is in the room, invisible — and laughing.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Turn', title: 'One more game', note: 'They toast him — "Uncle Scrooge!" — and the man who refused the invitation begs the spirit to stay for one more round. He "had imperceptibly become so gay and light of heart" that he would have pledged the company in return, unseen.', min: 0.4 },
      { lane: '2B', type: 'beat', beatFn: 'Mortality', title: 'The spirit ages', note: 'Grey hairs on the giant: "My life upon this globe, is very brief… It ends to-night, at midnight." Christmas Present is only ever one day old — generosity has a deadline, which is the whole argument for keeping it all the year.', min: 0.4 },
      { lane: '2B', type: 'beat', beatFn: 'Dark Turn', title: 'Ignorance and Want', note: 'Two children "wretched, abject, frightful, hideous, miserable" beneath the spirit\'s robe: "This boy is Ignorance. This girl is Want. Beware them both… but most of all beware this boy, for on his brow I see that written which is Doom." Dickens\'s social thesis, made flesh at the act turn.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Act Break', title: 'Are there no prisons?', note: 'Scrooge asks if the children have no refuge — and the dying spirit turns his Stave One words on him for the second time: "Are there no prisons? Are there no workhouses?" The bell strikes twelve; the spirit is gone; a solemn phantom comes "like a mist along the ground."', min: 0.5 },

      // ===== LANE 3 — STAVE FOUR: THE LAST OF THE SPIRITS (~5.3k, 12 beats) =====
      { lane: '3', type: 'scene', title: 'Stave Four — The Last of the Spirits', words: 5300 },
      { lane: '3', type: 'beat', beatFn: 'Dread', title: 'The silent phantom', note: 'Shrouded, pointing, never speaking — dread needs no dialogue. Scrooge is already reforming ("I hope to live to be another man from what I was") but must still walk the whole gauntlet. "Lead on! The night is waning fast." The lesson is not information; it is consequence.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Cold World', title: 'The businessmen shrug', note: 'A rich man has died and the City can barely stifle a yawn: "I don\'t mind going if a lunch is provided." Scrooge listens for his future self among them, and cannot find him — the dramatic irony the whole stave runs on.', min: 0.3 },
      { lane: '3', type: 'beat', beatFn: 'Irony', title: 'Where is his future self?', note: 'Scrooge looks for himself in his accustomed corner of the Exchange and sees another man standing there. He assumes the visions show some time to come in which his changed life is simply elsewhere. The reader is ahead of him; Dickens lets us stay there.', min: 0.3 },
      { lane: '3', type: 'beat', beatFn: 'Descent', title: "Old Joe's den", note: 'Into the obscure part of town — foul and narrow, "crime, and filth, and misery" — to a rag-and-bone shop where three parties converge with bundles, each having plundered the same dead man. "Every person has a right to take care of themselves. He always did!"', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'The Fence', title: 'The loot compared', note: 'The laundress with sheets and towels and sugar-tongs; the undertaker\'s man with a pencil-case and sleeve-buttons; each lot appraised and chalked on the wall. The charwoman promises hers is the best — and makes them wait for it.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'The Shroud', title: 'Bed-curtains and the shirt', note: '"You don\'t mean to say you took \'em down, rings and all, with him lying there?" — "Yes I do. Why not?" Even the shirt off the corpse, saved from being buried in it. They laugh. "He frightened every one away from him when he was alive, to profit us when he was dead!"', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'The Corpse', title: 'Plundered and bereft', note: 'A bare bed, a bare room, "the body of this man" beneath a ragged sheet — "plundered and bereft, unwatched, unwept, uncared for." The phantom points at the head; Scrooge cannot lift the veil. "Spirit! this is a fearful place. In leaving it, I shall not leave its lesson."', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Only Emotion', title: 'The debtor couple', note: 'Scrooge begs to see "any person in the town, who feels emotion caused by this man\'s death" — and is shown Caroline and her husband, whose ruthless creditor has died: relief, almost joy, guiltily suppressed. "The only emotion the Ghost could show him, caused by the event, was one of pleasure."', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Grief', title: 'The Cratchits without Tim', note: 'The house Scrooge saw roaring with life in Stave Three, now quiet — "Very quiet." Peter reading aloud ("And He took a child, and set him in the midst of them"), the little Cratchits still as statues, mother laying her needlework down because "the colour hurts my eyes."', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Bob Breaks', title: 'My little, little child!', note: 'Bob, back from the churchyard where he walked slower than he used to walk with Tim on his shoulder, breaks down all at once — then recovers for the family\'s sake, and extracts the promise: "however and whenever we part from one another, I am sure we shall none of us forget poor Tiny Tim."', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Approach', title: 'The churchyard', note: '"Before I draw nearer to that stone to which you point, answer me one question. Are these the shadows of the things that Will be, or are they shadows of things that May be, only?" The phantom, as ever, answers nothing — the book\'s theology of free will hangs on the silence.', min: 0.3 },
      { lane: '3', type: 'beat', beatFn: 'Climax', title: 'EBENEZER SCROOGE', note: 'His own name on the neglected grave. "I will honour Christmas in my heart, and try to keep it all the year. I will live in the Past, the Present, and the Future" — the vow names the three-spirit structure itself. He seizes the phantom\'s hand; it shrinks, collapses, and dwindles into a bedpost.', min: 0.6 },

      // ===== LANE 3 — STAVE FIVE: THE END OF IT (~2.9k, 9 beats — the Stave One setups paid off in planted order) =====
      { lane: '3', type: 'scene', title: 'Stave Five — The End of It', words: 2900 },
      { lane: '3', type: 'beat', beatFn: 'Transformation', title: 'The bedpost was his own', note: '"Best and happiest of all, the Time before him was his own, to make amends in!" Laughing and crying in the same breath — "I am as light as a feather, I am as happy as an angel, I am as merry as a schoolboy" — the thermal imagery of Stave One melts in a page.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Relief', title: 'What day is it?', note: 'The boy in Sunday clothes below the window: "To-day? Why, CHRISTMAS DAY!" The spirits have done it all in one night — "The Spirits have done it all in one night. They can do anything they like. Of course they can." He hasn\'t missed it.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Payoff: Cratchits', title: 'The prize turkey', note: 'The turkey twice the size of Tiny Tim, sent to the Cratchits anonymously — "He shan\'t know who sends it" — with a cab hired because the bird is too big to carry. The first amend goes to the family he watched, not the family he has.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Payoff: Charity', title: 'A great many back-payments', note: 'The same portly gentleman from Stave One, met in the street — and Scrooge whispers a sum that makes him gasp: "A great many back-payments are included in it, I assure you." Refusal 2, redeemed with interest.', min: 0.3 },
      { lane: '3', type: 'beat', beatFn: 'Payoff: The Street', title: 'Church bells and children', note: 'He walks the streets, watches the people, pats children on the head, questions beggars — "and found that everything could yield him pleasure." The man who chased off a caroler now dresses in his best and goes to church. Refusal 3, redeemed.', min: 0.3 },
      { lane: '3', type: 'beat', beatFn: 'Payoff: Fred', title: 'Will you let me in, Fred?', note: 'The invitation refused in the book\'s first scene, accepted at its own front door: "Why bless my soul! Who\'s that?" — "It\'s I. Your uncle Scrooge. I have come to dinner." Wonderful party, wonderful games, "won-der-ful happiness!"', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Payoff: Bob', title: 'I am about to raise your salary!', note: 'The morning after: Bob eighteen and a half minutes late, Scrooge growling in his old voice — then the dig in the waistcoat: "A merry Christmas, Bob!… I\'ll raise your salary, and endeavour to assist your struggling family." The last and largest Stave One debt, settled where the story began.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Coda', title: 'Better than his word', note: '"He did it all, and infinitely more; and to Tiny Tim, who did NOT die, he was a second father." Some people laughed at the change; "his own heart laughed: and that was quite enough for him." He had no further intercourse with Spirits — the Total Abstinence Principle.', min: 0.2 },
      { lane: '3', type: 'beat', beatFn: 'Frame Closed', title: 'God bless Us, Every One!', note: 'The narrator returns to close the frame the first line opened — "May that be truly said of us, and all of us!" — and hands the last words of the book to Tiny Tim, as the first blessing was his too.', min: 0.1 },
    ],
  },
  gatsby: {
    title: 'The Great Gatsby', year: 1925, form: 'novel',
    teaches: 'Nine chapters with the reunion at chapter five — a mathematically centered midpoint; and the observer-narrator, who tells another man\'s story and is changed by the telling',
    characters: {
      'NICK CARRAWAY': { desc: 'The observer-narrator — a Midwestern bond salesman "within and without, simultaneously enchanted and repelled." Every scene reaches the reader through his judgment; the book is his verdict, delivered two years late.' },
      'JAY GATSBY': { desc: 'Born James Gatz of North Dakota, "sprang from his Platonic conception of himself." The protagonist Nick narrates — a self-made illusion aimed at repeating one autumn in Louisville. His past is the book\'s withheld cargo, doled out in chapters 4, 6, and 8.' },
      'DAISY BUCHANAN': { desc: 'The object of the five-year dream — "her voice is full of money." Nick\'s cousin, Tom\'s wife, Gatsby\'s green light made flesh; the person the illusion cannot survive contact with.' },
      'TOM BUCHANAN': { desc: 'Old money and casual brutality — a national football name at twenty-one, "one of those men who reach such an acute limited excellence at twenty-one that everything afterward savours of anti-climax." The antagonist who wins by simply being what he is.' },
      'JORDAN BAKER': { desc: 'Golf champion and "incurably dishonest" — Nick\'s romance and his second window into the Buchanans\' world. Her Louisville story in chapter 4 is the hinge that decodes the green light.' },
      'MYRTLE WILSON': { desc: 'Tom\'s mistress, all thwarted vitality in the valley of ashes — the collateral of the Buchanans\' carelessness. Her death is the plot\'s detonator: the wrong woman killed by the wrong driver in the right car.' },
      'GEORGE WILSON': { desc: 'Her husband — "spiritless, anaemic," the garage owner ground down by the ash heaps. Grief plus one planted lie about the yellow car makes him the book\'s instrument of climax.' },
      'MEYER WOLFSHIEM': { desc: '"The man who fixed the World\'s Series back in 1919," cufflinks of human molars. One lunch scene that lets the reader glimpse where Gatsby\'s money comes from long before Tom says it out loud.' },
      'OWL EYES': { desc: 'The drunk in the library who discovers the books are real but uncut — the one guest who inspects the illusion and admires the craftsmanship. Fittingly, the only party guest at the funeral.' },
      'HENRY C. GATZ': { desc: 'Gatsby\'s father, arrived too late from Minnesota with a boyhood SCHEDULE written inside a Hopalong Cassidy cover — the self-made self documented at its source, after the self is dead.' },
      'MICHAELIS': { desc: 'The coffee-shop neighbor whose inquest testimony narrates the hit-and-run and Wilson\'s last night — the book\'s reminder that even its catastrophe reaches Nick secondhand.' },
    },
    titlePage: {
      subtitle: 'A Novel',
      authors: 'By F. Scott Fitzgerald · First published 10 April 1925 by Charles Scribner\'s Sons',
      settings: ['West Egg and East Egg, Long Island; the valley of ashes; New York City', 'Summer 1922, one season from June heat to the fall of the leaves', 'Told in retrospect — Nick writing two years after the events, verdict already reached'],
      productionNotes: 'Reference study object — public domain, so beat notes quote the text directly. Study the observer-narrator (Nick tells Gatsby\'s story, and every fact arrives filtered, delayed, or secondhand); the mathematically centered midpoint (nine chapters, reunion in chapter 5); the green light as planted image (chapter 1, deflated in chapter 5, paid off on the final page); and the reconstructed backstory — Gatsby\'s past withheld and doled out in chapters 4, 6, and 8, each installment truer than the last.',
    },
    cards: [
      // Density rule: discrete-dramatic-unit level — every scene, party
      // set-piece, and named encounter its own beat. 81 beats + 9 chapter
      // cards = 90, right at PROSE_TEMPLATE density for a full-length novel.
      //
      // Chapter → lane mapping (~47k words): lane 1 = ch. 1–2 (setup: both
      // eggs, the ashes, both marriages, ~10.1k); 2A = ch. 3–4 (Gatsby
      // revealed, the dream decoded, ~10.6k); 2B = ch. 5–7 (the reunion
      // OPENS the lane — the mirror moment at the book's dead center — and
      // ch. 7, the longest chapter, detonates it; ~16.9k, the fattest
      // stretch); 3 = ch. 8–9 (dark night, climax, verdict, ~9.4k).
      // Fitzgerald matched "bookends thin, middle fat" on his own.

      // ===== LANE 1 — CHAPTER 1 (~5.7k words, 10 beats) =====
      { lane: '1', type: 'scene', title: 'Chapter 1', words: 5700 },
      { lane: '1', type: 'beat', beatFn: 'Hook', title: 'My father gave me some advice', note: '"Whenever you feel like criticizing any one… just remember that all the people in this world haven\'t had the advantages that you\'ve had." Nick opens by declaring himself "inclined to reserve all judgments" — then spends the whole book judging. The narrator\'s instrument is calibrated in the first paragraph.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Frame', title: 'Gatsby turned out all right at the end', note: 'The retrospective frame: Nick is writing two years later, verdict in hand — it was "what preyed on Gatsby, what foul dust floated in the wake of his dreams" that closed out his interest in men. The ending is announced before the story starts; suspense is replaced by autopsy.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Establishing', title: 'The two eggs', note: 'West Egg and East Egg, "identical in contour and separated only by a courtesy bay" — new money and old, with Nick\'s eighty-dollar-a-month bungalow squeezed beside Gatsby\'s "factual imitation of some Hôtel de Ville in Normandy." The class geography the whole plot runs on, drawn as a map.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Arrival', title: 'The Buchanans\' Georgian mansion', note: 'Across the bay to East Egg: Tom in riding clothes on the porch, "a cruel body," arrogant eyes, a voice with "a touch of paternal contempt in it." Fitzgerald builds him entirely from physical menace before he says a significant word.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Introduction', title: 'Two young women buoyed up', note: 'Daisy and Jordan on the enormous couch, dresses "rippling and fluttering as if they had just been blown back in after a short flight around the house" — until Tom shuts the windows and "the caught wind died out." The image is the marriage: motion, then a man closing the room.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Menace', title: 'Civilization\'s going to pieces', note: 'Tom\'s dinner-table rant about "The Rise of the Coloured Empires" — "It\'s up to us, who are the dominant race, to watch out or these other races will have control of things." The brutality gets an ideology; Daisy\'s mock-solemn winking undercuts him without daring to contradict.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Disturbance', title: 'The telephone at dinner', note: 'The butler calls Tom from the table; Daisy follows; Jordan shamelessly leans in to listen and delivers the exposition flat: "Tom\'s got some woman in New York." The crack in the marriage is put on display for a guest within the first evening.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Confession', title: 'A beautiful little fool', note: 'Daisy on her daughter\'s birth, Tom "God knows where": "I hope she\'ll be a fool — that\'s the best thing a girl can be in this world, a beautiful little fool." The one moment Daisy tells the truth about her own life — and Nick, the calibrated instrument, immediately doubts it.', min: 0.7 },
      { lane: '1', type: 'beat', beatFn: 'Unease', title: 'As though the whole evening had been a trick', note: 'Nick drives home "confused and a little disgusted" — Daisy\'s outburst felt performed, "a trick of some sort to exact a contributory emotion from me." The observer-narrator\'s defining move: report the scene, then report his own reading of it, then doubt the reading.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Plant (green light)', title: 'He stretched out his arms toward the dark water', note: 'Gatsby\'s first appearance: alone on his lawn, trembling, arms out toward "a single green light, minute and far away, that might have been the end of a dock." No name spoken, no meaning given — and when Nick looks again he is gone. The book\'s central image planted as pure gesture, to be decoded in ch. 4 and paid off on the last page.', min: 0.7 },

      // ===== LANE 1 — CHAPTER 2 (~4.4k, 8 beats) =====
      { lane: '1', type: 'scene', title: 'Chapter 2', words: 4400 },
      { lane: '1', type: 'beat', beatFn: 'Establishing', title: 'The valley of ashes', note: '"A fantastic farm where ashes grow like wheat" between the Eggs and New York — and above it the eyes of Doctor T. J. Eckleburg, "blue and gigantic," brooding from a forgotten oculist\'s billboard. The book\'s third landscape: what the party pays for, watched over by a god who is only an advertisement.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Introduction', title: 'Wilson\'s garage', note: 'George Wilson, "a blond, spiritless man, anaemic," wiping his hands on waste; then Myrtle, carrying "her surplus flesh sensuously," walking through her husband "as if he were a ghost" to take Tom\'s orders. The whole triangle staged in a doorway.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Transit', title: 'The dog and the train', note: 'Tom parades his mistress into New York — Myrtle buys a dog from a vendor with a basket of dubious airedales, plus magazines and cold cream and perfume: an afternoon of small acquisitions playing at being a marriage.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Set-piece', title: 'The apartment on 158th Street', note: 'The over-furnished flat with its tapestried furniture of "ladies swinging in the gardens of Versailles" — Catherine, the McKees, whiskey, and Myrtle expanding with the room: "her laughter, her gestures, her assertions became more violently affected moment by moment."', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Rumor', title: 'The elaborateness of the lie', note: 'Catherine\'s gossip layer: Gatsby is "a nephew or a cousin of Kaiser Wilhelm\'s" (rumor no. 1 of many), and Tom cannot leave Daisy because "she\'s a Catholic" — "Daisy was not a Catholic, and I was a little shocked at the elaborateness of the lie." Misinformation established as the book\'s weather.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Narrator Stance', title: 'Within and without', note: 'Nick, drunk for the second time in his life, imagining a casual watcher in the darkening streets looking up at their lighted windows: "I was within and without, simultaneously enchanted and repelled by the inexhaustible variety of life." The observer-narrator\'s job description, stated outright in chapter 2.', min: 0.6 },
      { lane: '1', type: 'beat', beatFn: 'Violence', title: 'Making a short deft movement', note: 'Myrtle chants the forbidden name — "Daisy! Daisy! Daisy!… I\'ll say it whenever I want to!" — and Tom breaks her nose with his open hand. One sentence, no wind-up. The casual brutality that chapter 7 will scale up from a nose to a body.', min: 0.5 },
      { lane: '1', type: 'beat', beatFn: 'Dissolve', title: 'Bloody towels and Penn Station', note: 'The party disintegrates around the injury — "the despairing figure on the couch, bleeding fluently" — and Nick\'s memory goes fragmentary: Mr. McKee\'s bedside portfolio, then "half asleep in the cold lower level of the Pennsylvania Station" waiting for the four o\'clock train.', min: 0.4 },

      // ===== LANE 2A — CHAPTER 3 (~5.3k, 9 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapter 3', words: 5300 },
      { lane: '2A', type: 'beat', beatFn: 'Set-piece', title: 'Men and girls came and went like moths', note: 'The party catalogue: five crates of oranges and lemons every Friday, a corps of caterers, a full orchestra — "no thin five-piece affair" — and guests who "conducted themselves according to the rules of behaviour associated with an amusement park." The machine shown running before its purpose is known.', min: 0.8 },
      { lane: '2A', type: 'beat', beatFn: 'Arrival', title: 'One of the few guests who had actually been invited', note: 'A chauffeur in robin\'s-egg blue crosses the lawn with a formal invitation — Nick alone is asked; everyone else simply comes: "People were not invited — they went there." The host\'s courtesy toward his neighbor is the first hint that Nick, specifically, is wanted for something.', min: 0.5 },
      { lane: '2A', type: 'beat', beatFn: 'Encounter', title: 'Owl Eyes in the library', note: 'The drunk in enormous spectacles marveling at the shelves: "Absolutely real — have pages and everything… This fella\'s a regular Belasco. It\'s a triumph. What thoroughness! What realism! Knew when to stop, too — didn\'t cut the pages." The illusion inspected and found to be craftsmanship: real books, unread.', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Reveal', title: 'I\'m Gatsby', note: 'Nick chats with a stranger about the war before learning he is talking to his host — then the smile: "one of those rare smiles with a quality of eternal reassurance in it, that you may come across four or five times in life." The title character withheld for two and a half chapters, then delivered as pure charm.', min: 0.8 },
      { lane: '2A', type: 'beat', beatFn: 'Mystery', title: 'Somebody told me they thought he killed a man once', note: 'The rumor chorus swells — German spy, killer, Oxford man — while the host stands apart from his own party, drinking nothing: "no one swooned backward on Gatsby, and no French bob touched Gatsby\'s shoulder." The emptier the center, the louder the speculation around it.', min: 0.5 },
      { lane: '2A', type: 'beat', beatFn: 'Withheld', title: 'The most amazing thing', note: 'Gatsby draws Jordan away for a private hour, and she emerges tantalizing: "I\'ve just heard the most amazing thing… I\'m not supposed to tell." The plot\'s central fact — why all of this exists — is dangled and then withheld for a full chapter. Delay as structure.', min: 0.5 },
      { lane: '2A', type: 'beat', beatFn: 'Plant (careless driving)', title: 'The wheel in the ditch', note: 'The party ends with a coupé in the ditch, its wheel sheared off, and Owl Eyes disclaiming from the wreck: "I know very little about driving — next to nothing. It happened, and that\'s all I know." Drunken, blameless, shrugging carelessness at the wheel — chapter 7\'s catastrophe rehearsed as farce.', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Image', title: 'A sudden emptiness seemed to flow', note: 'The last image of the night: Gatsby alone on his marble steps, hand raised in "a gracious gesture of farewell" over the emptying drive, "a sudden emptiness" flowing from the windows and doors. Host of hundreds, companion of none — the loneliness the parties exist to disguise, caught in a single tableau.', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'Narrator', title: 'I am one of the few honest people I have ever known', note: 'Nick pulls the camera back — these were only three nights in a crowded summer; mostly he worked. Then the turn to Jordan, "incurably dishonest," and his verdict on himself: "I am one of the few honest people that I have ever known." The narrator rates his own reliability, and the reader must decide whether to sign off on it.', min: 0.6 },

      // ===== LANE 2A — CHAPTER 4 (~5.3k, 9 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapter 4', words: 5300 },
      { lane: '2A', type: 'beat', beatFn: 'Catalogue', title: 'The names on the timetable', note: 'Nick\'s list of that summer\'s guests, jotted on an old timetable: the Leeches, the Blackbucks, Doctor Webster Civet "who was drowned last summer up in Maine" — a page of satirical Homeric catalogue that indicts a whole class by its surnames alone.', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Backstory 1 (as told)', title: 'The son of some wealthy people in the Middle West', note: 'Gatsby\'s autobiography, delivered in the car: San Francisco as "the Middle West," Oxford by family tradition, rubies and big game and "trying to forget something very sad that had happened to me long ago." Nick nearly laughs — "the very phrases were worn so threadbare" — then cannot decide. Installment one of the backstory: the varnished lie.', min: 0.9 },
      { lane: '2A', type: 'beat', beatFn: 'Proof', title: 'The medal and the photograph', note: 'The Montenegro medal — "Major Jay Gatsby, For Valour Extraordinary" — and the Trinity Quad photograph, cricket bat and all: "Then it was all true." Physical props authenticate the false parts along with the true; the reader is being managed exactly as Nick is.', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'Power', title: 'Right you are, Mr. Gatsby', note: 'Pulled over for speeding, Gatsby waves a white card and the policeman apologizes: "Know you next time, Mr. Gatsby. Excuse me!" One beat, three lines — and the reach of the money is established before its source is.', min: 0.4 },
      { lane: '2A', type: 'beat', beatFn: 'Underworld', title: 'Meyer Wolfshiem', note: 'Lunch with the man wearing human molars as cufflinks, misty about the night they shot Rosy Rosenthal — and afterward the identification: "He\'s the man who fixed the World\'s Series back in 1919." Nick is staggered: "it never occurred to me that one man could start to play with the faith of fifty million people." The money\'s source, glimpsed once, deniably.', min: 0.8 },
      { lane: '2A', type: 'beat', beatFn: 'Near-miss', title: 'Tom across the room', note: 'Nick spots Tom Buchanan in the same restaurant and turns to introduce Gatsby — who has vanished: "a strained, unfamiliar look" and then an empty space. The two rivals almost meet three chapters early, and Gatsby\'s composure fails for the first time on the page.', min: 0.3 },
      { lane: '2A', type: 'beat', beatFn: 'Backstory 2 (Daisy)', title: 'Jordan\'s Louisville story', note: 'October 1917: Daisy Fay and the young officer in the white roadster; then the wedding eve — Daisy drunk as a monkey with a letter dissolving "like snow" in the bath, "Tell \'em all Daisy\'s change\' her mine!" — and married to Tom the next day "without so much as a shiver." The dream\'s origin, delivered secondhand through a second narrator inside the first.', min: 1.0 },
      { lane: '2A', type: 'beat', beatFn: 'Decode (green light)', title: 'Gatsby bought that house so that Daisy would be just across the bay', note: 'Jordan lands the reveal, and Nick reframes everything: "He came alive to me, delivered suddenly from the womb of his purposeless splendour." The chapter 1 gesture is retroactively decoded — the light was never scenery, and the parties were bait. And the ask, staggering in its modesty: will Nick invite Daisy to tea.', min: 0.6 },
      { lane: '2A', type: 'beat', beatFn: 'Entangled', title: 'I drew up the girl beside me', note: 'Nick pulls Jordan closer in the taxi — "Unlike Gatsby and Tom Buchanan, I had no girl whose disembodied face floated along the dark cornices… so I drew up the girl beside me, tightening my arms." The observer steps into the story he is telling, defining himself against both men as he does it.', min: 0.3 },

      // ===== LANE 2B — CHAPTER 5 (~4.0k, 8 beats — THE MIDPOINT: the reunion at the dead center of nine chapters opens the lane) =====
      { lane: '2B', type: 'scene', title: 'Chapter 5', words: 4000 },
      { lane: '2B', type: 'beat', beatFn: 'Threshold', title: 'His house lit from tower to cellar', note: 'Nick comes home at two in the morning to find Gatsby\'s mansion blazing with light and nobody in it — Gatsby strolling over, desperate to seem casual. The offer of "a little business on the side" for arranging the tea (declined) shows how this world normally pays for favors; Nick\'s refusal is part of why he gets to be the narrator.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Preparation', title: 'A greenhouse arrived from Gatsby\'s', note: 'The day itself: rain, a man sent unasked to cut Nick\'s grass, an absurd profusion of flowers, and Gatsby in white flannel suit, silver shirt, and gold tie, "pale as death," bolting for the door — "This is a terrible mistake." Five years of planning reduced to stage fright; the comedy is what makes the yearning credible.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Midpoint / Mirror Moment', title: 'We\'ve met before', note: 'The reunion — chapter 5 of 9, the mathematically centered midpoint of the book. Gatsby leans against the mantelpiece "in a strained counterfeit of perfect ease," head tilted back against a defunct clock, which tips — and he catches it: "I\'m sorry about the clock." Five years of stopped time, nearly smashed, caught, and set trembling back on the shelf. The whole novel folds in half here.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Recovery', title: 'He literally glowed', note: 'Nick withdraws into the rain for half an hour and returns to a transformed room: Daisy\'s face "smeared with tears," and Gatsby radiant — "he literally glowed; without a word or a gesture of exultation a new well-being radiated from him." The scene\'s emotional peak happens offstage; the observer-narrator can report only the before and the after.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'The Tour', title: 'My house looks well, doesn\'t it?', note: 'The mansion finally performs its function — shown to the one spectator it was built for, room by room, while Gatsby "revalued everything in his house according to the measure of response it drew from her well-loved eyes." The parties, the library, the marble: all of it retroactively becomes a stage set with an audience of one.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Set-piece', title: 'Such beautiful shirts', note: 'The shirts thrown into a rainbow heap — "shirts with stripes and scrolls and plaids in coral and apple-green and lavender and faint orange" — and Daisy bending her head into them, crying: "It makes me sad because I\'ve never seen such — such beautiful shirts before." Grief displaced onto fabric; what she cannot say out loud is the five years.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Deflation (green light)', title: 'His count of enchanted objects had diminished by one', note: 'Gatsby points across the bay — "You always have a green light that burns all night at the end of your dock" — and Nick watches the symbol die in real time: "Now it was again a green light on a dock. His count of enchanted objects had diminished by one." The planted image\'s second station: possession kills enchantment.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Diagnosis', title: 'The colossal vitality of his illusion', note: 'Nick\'s reading of a flicker of doubt in Gatsby\'s face: "There must have been moments even that afternoon when Daisy tumbled short of his dreams — not through her own fault, but because of the colossal vitality of his illusion. It had gone beyond her, beyond everything." The book\'s thesis sentence, placed at the exact moment of triumph.', min: 0.3 },

      // ===== LANE 2B — CHAPTER 6 (~4.2k, 8 beats) =====
      { lane: '2B', type: 'scene', title: 'Chapter 6', words: 4200 },
      { lane: '2B', type: 'beat', beatFn: 'Backstory 3 (the truth)', title: 'James Gatz of North Dakota', note: 'The real story, breaking chronology because Nick wants to kill the rumors: the seventeen-year-old who rowed out to Dan Cody\'s yacht had already invented the name. "Jay Gatsby of West Egg, Long Island, sprang from his Platonic conception of himself. He was a son of God." Installment three of the backstory — the truth, told out of order, exactly when the lie has finished serving its purpose.', min: 0.9 },
      { lane: '2B', type: 'beat', beatFn: 'Origin', title: 'Five years on the Tuolomee', note: 'Dan Cody — the "pioneer debauchee" — gives Gatz his education in yachts and money and drink (Gatsby\'s abstinence dates from watching Cody\'s), then dies; Ella Kaye\'s lawyers take the twenty-five-thousand-dollar legacy. The apprenticeship produced the manner but not the means: the money would have to come from somewhere else.', min: 0.6 },
      { lane: '2B', type: 'beat', beatFn: 'Intrusion', title: 'The party on horseback', note: 'Tom, the Sloanes, and the hollow courtesy: a supper invitation not meant, Gatsby accepting anyway, the riders trotting off before he can fetch his car. Tom\'s verdict lingers behind them: "I\'d like to know who he is and what he does. And I think I\'ll make a point of finding out." The investigation that detonates chapter 7 is announced here.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Set-piece', title: 'The Buchanans come to the party', note: 'The same carnival as chapter 3, now seen through Daisy\'s eyes — and it curdles: "she was appalled by West Egg… by its raw vigour." The identical material re-shot from a hostile point of view is the chapter\'s structural trick: nothing at the party changed except the spectator.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Verdict', title: 'Offended by everything except the movie star', note: 'Daisy likes exactly one thing all evening — the actress under the white-plum tree, a scene, a performance. The rest, the place "that Broadway had begotten upon a Long Island fishing village," repels her. Gatsby built the show for an audience whose taste he never actually knew.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Deflation', title: 'She didn\'t like it', note: 'After the lights go out: "She didn\'t like it… She didn\'t have a good time." And Nick finally states the demand underneath everything: Gatsby wants nothing less than that Daisy go to Tom and say "I never loved you" — five years annulled, the record wiped clean. The impossible object, named plainly for the first time.', min: 0.4 },
      { lane: '2B', type: 'beat', beatFn: 'Thesis Line', title: 'Can\'t repeat the past? Why, of course you can!', note: 'Nick offers the sane warning — "You can\'t repeat the past" — and gets the book\'s most famous reply: "Can\'t repeat the past?… Why of course you can!" Gatsby "looked around him wildly, as if the past were lurking here in the shadow of his house, just out of reach of his hand."', min: 0.3 },
      { lane: '2B', type: 'beat', beatFn: 'Reconstruction', title: 'The sidewalk was white with moonlight', note: 'The Louisville kiss, five years late in the telling: Gatsby "wed his unutterable visions to her perishable breath," and "at his lips\' touch she blossomed for him like a flower and the incarnation was complete." The past he means to repeat, finally shown — placed immediately after his vow to repeat it.', min: 0.3 },

      // ===== LANE 2B — CHAPTER 7 (~8.7k, 13 beats — the longest chapter, in the fattest stretch) =====
      { lane: '2B', type: 'scene', title: 'Chapter 7', words: 8700 },
      { lane: '2B', type: 'beat', beatFn: 'Turn', title: 'The lights in his house failed to go on', note: 'The parties stop dead — servants dismissed, replaced with Wolfshiem\'s people who "wouldn\'t gossip," because Daisy comes over afternoons now. "The whole caravansary had fallen in like a card house at the disapproval in her eyes." The machine built to attract her is dismantled the moment it works.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Pressure', title: 'The hottest day of the summer', note: 'Lunch at the Buchanans\' in broiling heat — and Pammy, the daughter, trotted out in white. Gatsby "kept looking at the child with surprise. I don\'t think he had ever really believed in its existence before." Five years of Daisy\'s actual, unrepeatable life, four feet tall, standing in the room.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Reveal', title: 'Her voice is full of money', note: 'Nick fumbles for what Daisy\'s voice is, and Gatsby — not Nick — lands it: "Her voice is full of money." Nick completes the thought: "That was it… the jingle of it, the cymbals\' song of it… High in a white palace the king\'s daughter, the golden girl." The love object and the money were never separable; Gatsby knows it and loves her anyway.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Discovery', title: 'You always look so cool', note: 'Daisy says it to Gatsby across the table — and "she had told him that she loved him, and Tom Buchanan saw. He was astounded." No confrontation staged, no letter found: the affair is exposed by tone of voice at lunch, witnessed by everyone at the table, deniable by no one.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Convoy', title: 'The swap of cars', note: 'Tom insists on driving Gatsby\'s yellow car to town — the exchange the catastrophe requires. At Wilson\'s pumps: George sick and gray ("I\'ve been here too long. I want to get away"), having "locked my wife in up there" — and above them, at the window, Myrtle staring down at Jordan with jealous terror, mistaking her for Daisy. Every wrong identification the disaster needs, loaded in one stop.', min: 0.8 },
      { lane: '2B', type: 'beat', beatFn: 'Image', title: 'The eyes of Doctor T. J. Eckleburg kept their vigil', note: 'Tom, discovering that "his wife and his mistress, until an hour ago secure and inviolate, were slipping precipitately from his control," floors the coupé toward town under the billboard\'s giant stare. Panic in the strong man, watched by the ash-heap god.', min: 0.3 },
      { lane: '2B', type: 'beat', beatFn: 'Arena', title: 'A suite at the Plaza Hotel', note: 'The five of them in a stifling parlour, the "portentous chords" of Mendelssohn\'s Wedding March drifting up from the ballroom below — somebody else\'s marriage beginning while this one is torn open. The confrontation gets a sealed arena, staged like a play.', min: 0.5 },
      { lane: '2B', type: 'beat', beatFn: 'Confrontation', title: 'Your wife doesn\'t love you', note: 'Tom opens with the Oxford sneer — "An Oxford man!… Like hell he is. He wears a pink suit" — and Gatsby detonates his whole case: "Your wife doesn\'t love you. She\'s never loved you. She loves me… She only married you because I was poor and she was tired of waiting." Everything he has built is staked on Daisy saying one sentence.', min: 1.0 },
      { lane: '2B', type: 'beat', beatFn: 'Reversal', title: 'I did love him once — but I loved you too', note: 'Tom counterattacks with the actual past — Kapiolani, the Punch Bowl — and Daisy breaks: "I can\'t say I never loved Tom… It wouldn\'t be true." Then, to Gatsby: "I did love him once — but I loved you too." Gatsby\'s stunned echo — "You loved me too?" — is the sound of the illusion meeting the only terms reality offers, and refusing them. The dream dies here, hours before the man does.', min: 0.9 },
      { lane: '2B', type: 'beat', beatFn: 'Exposure', title: 'The drug-stores and Walter Chase', note: 'Tom unloads the investigation: bootlegging over drug-store counters with Wolfshiem, Walter Chase left holding the bag, "something on now that Walter\'s afraid to tell me about." Daisy shrinks back toward her husband; the "presumptuous little flirtation is over" — and Tom\'s coup de grâce is contempt: sending Daisy home in Gatsby\'s car, with Gatsby, because he no longer needs to fear him.', min: 0.7 },
      { lane: '2B', type: 'beat', beatFn: 'Aside', title: 'I just remembered that to-day\'s my birthday', note: 'In the middle of the wreckage, Nick: "Thirty — the promise of a decade of loneliness, a thinning list of single men to know, a thinning brief-case of enthusiasm, thinning hair." The observer keeps his own ledger even inside the catastrophe — one paragraph of private memoir embedded in the plot\'s worst hour.', min: 0.4 },
      { lane: '2B', type: 'beat', beatFn: 'Catastrophe', title: 'The death car', note: 'Myrtle\'s death arrives secondhand — through Michaelis\'s inquest testimony and the newspapers: she runs out toward the car she believes is Tom\'s, and "the \'death car\' as the newspapers called it, didn\'t stop." Fitzgerald reports the body with clinical brutality — the torn breast, "her thick dark blood" mingling with the dust — and withholds the driver\'s identity from everyone, including the reader.', min: 1.0 },
      { lane: '2B', type: 'beat', beatFn: 'Vigil', title: 'Watching over nothing', note: 'Gatsby in the moonlight outside Daisy\'s house, keeping guard in case Tom turns violent — and the double reveal: "Was Daisy driving?" "Yes… but of course I\'ll say I was." Through the pantry window, Tom and Daisy over cold fried chicken and ale, "conspiring together," neither happy nor unhappy. Nick leaves him "standing there in the moonlight — watching over nothing." Devotion outliving its object by hours.', min: 0.9 },

      // ===== LANE 3 — CHAPTER 8 (~4.8k, 8 beats) =====
      { lane: '3', type: 'scene', title: 'Chapter 8', words: 4800 },
      { lane: '3', type: 'beat', beatFn: 'Dark Night', title: 'Toward dawn', note: 'Nick, sleepless, crosses to Gatsby\'s at dawn and urges him to run — "They\'ll trace your car." Gatsby will not consider it: he is still waiting for Daisy\'s signal. "He couldn\'t possibly leave Daisy until he knew what she was going to do. He was clutching at some last hope and I couldn\'t bear to shake him free."', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Backstory 4 (complete)', title: 'She was the first "nice" girl he had ever known', note: 'The final installment, told straight at last: Louisville 1917, the officer with no past taking Daisy "under false pretenses… he had deliberately given Daisy a sense of security" — and being taken himself: "he found that he had committed himself to the following of a grail… he felt married to her, that was all." The fourth telling of the backstory is the truest and the saddest; the reconstruction method completes itself the morning he dies.', min: 0.9 },
      { lane: '3', type: 'beat', beatFn: 'The Wound', title: 'The letter to Oxford', note: 'The war ends, Gatsby is stranded at Oxford by "some complication or misunderstanding," and Daisy\'s letters grow nervous, then final: "she wanted her life shaped now, immediately — and the decision must be made by some force… of unquestionable practicality." Tom Buchanan is that force. Gatsby\'s last army pay goes on a miserable pilgrimage back to Louisville, riding the day coach home past everything she had made lovely.', min: 0.6 },
      { lane: '3', type: 'beat', beatFn: 'Farewell', title: 'You\'re worth the whole damn bunch put together', note: 'Nick\'s goodbye across the lawn: "They\'re a rotten crowd… You\'re worth the whole damn bunch put together." — "I\'ve always been glad I said that. It was the only compliment I ever gave him, because I disapproved of him from beginning to end." The observer-narrator\'s whole paradox in two sentences: total disapproval, total allegiance.', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Waiting', title: 'The pool he had not used all summer', note: 'Gatsby, still expecting Daisy\'s call, takes the pneumatic mattress down to the pool — and Nick imagines his last hour if the dream had already died in him: "a new world, material without being real, where poor ghosts, breathing dreams like air, drifted fortuitously about." The disenchanted universe, hypothesized by the narrator because no one alive can report it.', min: 0.6 },
      { lane: '3', type: 'beat', beatFn: 'Grief Engine', title: 'God sees everything', note: 'The night in the garage, through Michaelis: Wilson raving over the body, the dog-leash discovered in the drawer, and the yellow car hardening into theology — Wilson staring out at the billboard: "God sees everything." Michaelis, appalled: "That\'s an advertisement." The valley of ashes mistakes an oculist\'s sign for its god, and acts on it.', min: 0.7 },
      { lane: '3', type: 'beat', beatFn: 'The Hunt', title: 'Wilson\'s morning', note: 'By half-past two Wilson is in Port Roosevelt, then Gad\'s Hill, moving on foot, "learning, somehow, the name of the man who owned the yellow car" — the how left deliberately blank until chapter 9, when Tom admits he supplied it. The instrument travels toward the wrong man all afternoon while the right ones pack their trunks.', min: 0.4 },
      { lane: '3', type: 'beat', beatFn: 'Climax', title: 'The holocaust was complete', note: 'The chauffeur hears the shots; Nick arrives to find the laden mattress moving irregularly down the pool, "a thin red circle in the water," and Wilson\'s body a little way off in the grass — the murder-suicide delivered in one paragraph, at arm\'s length, without a line of scene. Gatsby dies waiting for a phone call that was never coming, killed for a crime that was Daisy\'s.', min: 0.6 },

      // ===== LANE 3 — CHAPTER 9 (~4.6k, 8 beats) =====
      { lane: '3', type: 'scene', title: 'Chapter 9', words: 4600 },
      { lane: '3', type: 'beat', beatFn: 'Aftermath', title: 'On Gatsby\'s side, and alone', note: 'Two years later, Nick still remembers the reporters and the "grotesque, circumstantial, eager and untrue" coverage. In the emptying house: "I found myself on Gatsby\'s side, and alone… it grew upon me that I was responsible, because no one else was interested." The observer becomes the executor — the narrator\'s final promotion.', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Desertion', title: 'They had gone away early that afternoon', note: 'Daisy and Tom: gone, no address, no message, no flowers. Wolfshiem writes that he is "tied up in some very important business and cannot get mixed up in this thing now." And Klipspringer, the boarder, telephones — about a pair of tennis shoes he left behind. The roll call of desertion, itemized one caller at a time.', min: 0.7 },
      { lane: '3', type: 'beat', beatFn: 'Epitaph (declined)', title: 'Let us learn to show our friendship for a man when he is alive', note: 'Nick tracks Wolfshiem to the Swastika Holding Company and gets the gangster\'s eulogy — "I made him… I raised him up out of nothing, right out of the gutter" — and his refusal dressed as wisdom: "Let us learn to show our friendship for a man when he is alive and not after he is dead." The man who made Gatsby will not bury him.', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Payoff (the self-made self)', title: 'The SCHEDULE in the Hopalong Cassidy cover', note: 'Henry C. Gatz, proud and grieving, produces the boyhood book: "Rise from bed 6.00 A.M. Dumbbell exercise and wall-scaling… Study needed inventions." — "Jimmy was bound to get ahead." The Platonic self-conception of chapter 6, discovered in a twelve-year-old\'s handwriting: the dream predates Daisy, predates Cody, predates everything but the boy.', min: 0.8 },
      { lane: '3', type: 'beat', beatFn: 'Funeral', title: 'The poor son-of-a-bitch', note: 'Rain at the graveside, and nobody from the parties except one man: Owl Eyes, who inspected the library and came anyway. "Why, my God! they used to go there by the hundreds… The poor son-of-a-bitch." The hundred-guest summers settle their account: one mourner, and he was uninvited both times.', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Frame', title: 'A story of the West, after all', note: 'Nick\'s memory of trains home at Christmas — "my Middle West… the thrilling returning trains of my youth" — and the reframe: "I see now that this has been a story of the West, after all — Tom and Gatsby, Daisy and Jordan and I, were all Westerners, and perhaps we possessed some deficiency in common which made us subtly unadaptable to Eastern life." The narrator refiles the whole book under a different heading two pages before it ends.', min: 0.5 },
      { lane: '3', type: 'beat', beatFn: 'Verdict', title: 'They were careless people, Tom and Daisy', note: 'The last meeting with Tom on Fifth Avenue — the handshake finally given "because I felt suddenly as though I were talking to a child" — and the book\'s moral summation: "They were careless people, Tom and Daisy — they smashed up things and creatures and then retreated back into their money or their vast carelessness… and let other people clean up the mess they had made." The judgment the reserving-judgments narrator was building toward from page one.', min: 0.6 },
      { lane: '3', type: 'beat', beatFn: 'Payoff (green light) / Coda', title: 'Boats against the current', note: 'The last night, on Gatsby\'s beach, and the planted image\'s final station: "Gatsby believed in the green light, the orgastic future that year by year recedes before us. It eluded us then, but that\'s no matter — to-morrow we will run faster, stretch out our arms farther…" And the last line: "So we beat on, boats against the current, borne back ceaselessly into the past." Chapter 1\'s private gesture, universalized into the first-person plural.', min: 0.5 },
    ],
  },
  pride: {
    title: 'Pride and Prejudice', year: 1813, form: 'novel',
    teaches: 'The textbook mirror moment — Darcy\'s failed proposal at the book\'s centre splits it in half, and the back half systematically reverses the front: three proposals, two accounts of Wickham, and every first impression re-tried on better evidence',
    characters: {
      'ELIZABETH BENNET': { desc: 'The second Bennet daughter — quick, satirical, and confident in her own reading of people, which is precisely the instrument the novel breaks. "I have courted prepossession and ignorance, and driven reason away." Her arc is not from single to married but from certainty to self-knowledge.' },
      'FITZWILLIAM DARCY': { desc: 'Ten thousand a year, master of Pemberley, and unable to perform in company: "I certainly have not the talent which some people possess of conversing easily with those I have never seen before." The antagonist of the front half and the co-protagonist of the back — the only major character whose interior we are largely denied, so his reversal must be shown in deeds.' },
      'JANE BENNET': { desc: 'The eldest and the beauty, who "never sees a fault in anybody" — the novel\'s control group. Her courtship runs the same obstacle course as Elizabeth\'s with none of the wit, proving the plot is not driven by charm but by other people\'s interference.' },
      'CHARLES BINGLEY': { desc: 'Amiable, wealthy, and fatally suggestible — "I would buy Pemberley itself if Darcy would sell it." His pliancy is the hinge of the Jane plot: he is talked out of love in Volume I and must be released back into it in Volume III.' },
      'MR BENNET': { desc: 'The father who retreated into his library and his own jokes: "For what do we live, but to make sport for our neighbours, and laugh at them in our turn?" The novel\'s funniest character and its most quietly indicted — his abdication is what puts Lydia on the road to Brighton.' },
      'MRS BENNET': { desc: '"A woman of mean understanding, little information, and uncertain temper… the business of her life was to get her daughters married." A comic engine whose panic is, in the entail, entirely rational — the novel lets her be ridiculous and correct at once.' },
      'LYDIA BENNET': { desc: 'The youngest, "self-willed and careless," pushed forward by a mother who sees herself in her. Her elopement is the plot\'s detonator and the family\'s near-ruin — comedy escalated until it stops being funny.' },
      'GEORGE WICKHAM': { desc: 'The militia officer with "the happy manners which may ensure his making friends" and no principle underneath. The novel\'s test of first impressions: he is believed because he is charming, and the letter that corrects him arrives too late to unteach the habit.' },
      'MR COLLINS': { desc: 'The clergyman who will inherit Longbourn, and Lady Catherine\'s creature — a man who composes his spontaneous compliments in advance. His proposal is the structural rehearsal for Darcy\'s: same room, same refusal, opposite meaning.' },
      'CHARLOTTE LUCAS': { desc: 'Elizabeth\'s closest friend and her sharpest counter-argument: "I am not romantic, you know. I never was. I ask only a comfortable home." Marries Collins with clear eyes. The book\'s realist, and the road not taken that it refuses to condemn.' },
      'LADY CATHERINE DE BOURGH': { desc: 'Darcy\'s aunt, Rosings, and rank as a personality — she "likes to have the distinction of rank preserved." Her attempt to prevent the marriage is what brings it about: the antagonist who delivers the ending by opposing it.' },
      'MR AND MRS GARDINER': { desc: 'Elizabeth\'s uncle in trade and his wife — the only happy, competent marriage in the book, and the reason the plot resolves: they take her to Derbyshire, they run the Lydia crisis in London, and the last paragraph gives them the credit.' },
      'GEORGIANA DARCY': { desc: 'Darcy\'s shy sixteen-year-old sister — Wickham\'s earlier target, whose near-elopement is the letter\'s decisive evidence. Meeting her at Pemberley is Darcy\'s proof of changed footing: he introduces the woman who refused him to the person he most protects.' },
      'COLONEL FITZWILLIAM': { desc: 'Darcy\'s cousin — easy where Darcy is stiff, and the accidental agent of the crisis. His idle boast about a friend saved from an imprudent marriage hands Elizabeth the charge she fires an hour later.' },
      'CAROLINE BINGLEY': { desc: 'Bingley\'s sister, angling for Darcy and against Elizabeth. Her sneering at Pemberley in Volume III lets Darcy state his changed judgment aloud without ever addressing Elizabeth directly.' },
      'MARY BENNET': { desc: 'The bookish middle daughter who moralizes in borrowed sentences — and who states the novel\'s title theme outright in chapter 5: "Pride relates more to our opinion of ourselves, vanity to what we would have others think of us."' },
    },
    titlePage: {
      subtitle: 'A Novel, in Three Volumes',
      authors: 'By Jane Austen · First published 28 January 1813 by T. Egerton, Whitehall · Originally drafted 1796–97 as "First Impressions"',
      settings: ['Longbourn, Netherfield and Meryton, Hertfordshire', 'Hunsford and Rosings Park, Kent; Pemberley and Lambton, Derbyshire; Gracechurch Street, London', 'England, c. 1811–12 — an entailed estate, five unmarried daughters, and a militia regiment quartered nearby'],
      productionNotes: 'Reference study object — public domain, so beat notes quote the text directly. The shelf\'s clearest demonstration of the app\'s own structural thesis: Bell\'s mirror moment and Wells\'s chiasmus in one book. Darcy\'s first proposal (ch. 34 of 61) splits the novel, and Elizabeth\'s "Till this moment I never knew myself" two chapters later is the axis it turns on. Read the halves against each other: three proposals (Collins refused, Darcy refused, Darcy accepted), two accounts of Wickham (spoken and believed; written and true), two visits to a great house (Rosings, endured; Pemberley, loved), and two interventions in a sister\'s marriage (Darcy separating Bingley from Jane; Darcy buying Wickham for Lydia). Nearly every front-half beat is re-run in the back half on better evidence.',
    },
    cards: [
      // Density rule: discrete-dramatic-unit level, scaled to length. 90 beats
      // across ~122,000 words (~1,350 words/beat) — coarser grain than Gatsby's
      // ~580 because P&P is two and a half times longer; at Gatsby's density
      // this book would need 210 beats.
      //
      // DEVIATION from the chapter-as-scene-card convention (carol = staves,
      // gatsby = chapters): 61 chapters would mean 61 spine cards, crowding the
      // board and pushing beats below the discrete-unit grain. Scene cards here
      // group by MOVEMENT with explicit chapter ranges — which is how the novel
      // actually travels, house by house — and every beat names its chapter.
      // Austen's own unit above the chapter was the volume; these sit between.
      //
      // Chapter → lane mapping (~122k words): lane 1 = ch. 1–17 (first
      // impressions formed and hardened, ~32k); 2A = ch. 18–33 (the ball, two
      // proposals, Hunsford, and Fitzwilliam's slip, ~32k); 2B OPENS on the
      // proposal — the mirror moment at the book's centre — and runs through
      // the letter, Pemberley and the elopement (ch. 34–50, ~35k, the fattest
      // lane); 3 = ch. 51–61 (the secret revealed, Lady Catherine, the second
      // proposal, ~23k). Bookends thin, middle fat — Austen's own proportions.

      // ===== LANE 1 — CHAPTERS 1–3 (~5.5k, 6 beats) =====
      { lane: '1', type: 'scene', title: 'Chapters 1–3 · Longbourn and the Meryton Assembly', words: 5500 },
      { lane: '1', type: 'beat', beatFn: 'Hook', title: 'A truth universally acknowledged', note: '"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife." The most famous opening in English fiction, and an ironic trap: the sentence states the neighbourhood\'s view as though it were natural law, then the next line reveals the truth is really about what the neighbourhood *wants*. The narrator\'s irony is calibrated before a character speaks.', min: 1.0 },
      { lane: '1', type: 'beat', beatFn: 'Establishing (the bad marriage)', title: 'Mr and Mrs Bennet', note: 'Chapter 1 is almost pure dialogue — the husband baiting, the wife failing to notice — and closes with the narrator\'s summary: he is "so odd a mixture of quick parts, sarcastic humour, reserve, and caprice," she "a woman of mean understanding, little information, and uncertain temper." The novel\'s cautionary marriage is installed on page one, so every courtship after it is measured against a known failure.', min: 1.2 },
      { lane: '1', type: 'beat', beatFn: 'Stakes (the entail)', title: 'Five daughters and no son', note: 'Longbourn is entailed away to a male cousin; five unmarried daughters and no provision. Mrs Bennet\'s hysteria is comic and *correct* — the novel is careful that its most ridiculous character is right about the economics. The marriage plot is a survival plot wearing a ballgown.', min: 1.2 },
      { lane: '1', type: 'beat', beatFn: 'Set-piece', title: 'The assembly at Meryton', note: 'Bingley is "good-looking and gentlemanlike… with a pleasant countenance, and easy, unaffected manners"; Darcy draws the room\'s attention with his ten thousand a year and loses it inside half an hour — "his manners gave a disgust which turned the tide of his popularity." Two men introduced by the same crowd\'s verdict, delivered in a single evening.', min: 1.4 },
      { lane: '1', type: 'beat', beatFn: 'Plant (first impression)', title: 'Tolerable, but not handsome enough', note: 'Bingley urges Darcy to dance with Elizabeth; Darcy, in her hearing: "She is tolerable; but not handsome enough to tempt me; and I am in no humour at present to give consequence to young ladies who are slighted by other men." The insult that sets the whole machine running — and Elizabeth "remained with no very cordial feelings toward him," but told the story "with great spirit among her friends." She makes it a comic routine, which is how the prejudice hardens.', min: 1.2 },
      { lane: '1', type: 'beat', beatFn: 'Comic chorus', title: 'Mrs Bennet reports the evening', note: 'The assembly replayed at Longbourn in Mrs Bennet\'s voice — every dance itemized, Darcy denounced as "the proudest, most disagreeable man in the world." Austen\'s habit of staging an event and then staging its retelling: gossip is the novel\'s circulatory system, and the reader watches reputation being manufactured in real time.', min: 1.1 },

      // ===== LANE 1 — CHAPTERS 4–6 (~5k, 5 beats) =====
      { lane: '1', type: 'scene', title: 'Chapters 4–6 · Lucas Lodge', words: 5000 },
      { lane: '1', type: 'beat', beatFn: 'Contrast (the two readers)', title: 'Jane sees no fault in anybody', note: 'The sisters compare notes: Jane finds Bingley "sensible, good-humoured, lively," and will not hear ill of his sisters; Elizabeth notes drily that Jane "never sees a fault in anybody." Two instruments for reading people are set side by side in chapter 4 — one too generous, one too confident — and the novel will break the confident one.', min: 1.2 },
      { lane: '1', type: 'beat', beatFn: 'Theme stated', title: 'Pride relates to our opinion of ourselves', note: 'Mary Bennet, moralizing from her reading, states the title outright: "Pride relates more to our opinion of ourselves, vanity to what we would have others think of us." Austen gives her thesis to the dullest character in the book — stated so flatly that it reads as pedantry, and only proves itself two hundred pages later.', min: 1.0 },
      { lane: '1', type: 'beat', beatFn: 'Reversal (private)', title: 'The beautiful expression of her dark eyes', note: 'The turn nobody in the novel witnesses: Darcy, having declared her merely tolerable, "began to find it was rendered uncommonly intelligent by the beautiful expression of her dark eyes." The reader is let in on his interest at chapter 6 and Elizabeth is not told until chapter 34 — twenty-eight chapters of dramatic irony, the engine of the whole front half.', min: 1.3 },
      { lane: '1', type: 'beat', beatFn: 'Refusal (rehearsal)', title: 'Sir William offers her hand', note: 'Sir William Lucas tries to pair them at his party; Darcy is willing; Elizabeth "instantly drew back" and refuses with perfect politeness. The first of the novel\'s refusals, played as a trifle — a hand declined in a drawing room, rehearsing the proposal she will decline in Kent.', min: 1.1 },
      { lane: '1', type: 'beat', beatFn: 'Counter-argument', title: 'Charlotte\'s doctrine', note: 'Charlotte Lucas argues that Jane should show more affection than she feels, and that "happiness in marriage is entirely a matter of chance" — better to know as little as possible of the defects of your partner beforehand. Elizabeth laughs it off: "You would never act in this way yourself." The novel plants the friend\'s philosophy sixteen chapters before it makes her live by it.', min: 1.4 },

      // ===== LANE 1 — CHAPTERS 7–12 (~11k, 7 beats) =====
      { lane: '1', type: 'scene', title: 'Chapters 7–12 · Netherfield', words: 11000 },
      { lane: '1', type: 'beat', beatFn: 'Inciting (domestic scheming)', title: 'Sent on horseback in the rain', note: 'Jane is invited to Netherfield; Mrs Bennet refuses her the carriage so she must ride, so the rain will keep her overnight. It works better than planned — Jane falls ill. The comic mother\'s manoeuvre is what puts both sisters inside Bingley\'s house for a week; farce doing the structural work of plot.', min: 1.5 },
      { lane: '1', type: 'beat', beatFn: 'Character in action', title: 'Three miles, and the petticoat six inches deep in mud', note: 'Elizabeth walks to Netherfield across fields, "jumping over stiles and springing over puddles with impatient activity," and arrives with "weary ancles, dirty stockings, and a face glowing with the warmth of exercise." Caroline is scandalized; Darcy is struck. One action tells the reader everything about her that dialogue could only assert — and the mud is what he remembers.', min: 1.7 },
      { lane: '1', type: 'beat', beatFn: 'Set-piece (the accomplished woman)', title: 'A thorough knowledge of music, singing, drawing, dancing', note: 'Caroline\'s catalogue of female accomplishment, topped by Darcy: "to all this she must yet add something more substantial, in the improvement of her mind by extensive reading." Elizabeth: "I am no longer surprised at your knowing only six accomplished women. I rather wonder now at your knowing any." The sparring reads as antagonism and is, in fact, courtship — neither of them knows it yet.', min: 1.6 },
      { lane: '1', type: 'beat', beatFn: 'Theme (the flaw named)', title: 'My good opinion once lost is lost for ever', note: 'Darcy names his own defect precisely — "My temper would perhaps be called resentful. My good opinion once lost is lost for ever" — and Elizabeth answers "That is a failing indeed!… but you have chosen your fault well." She then names hers without knowing it: "to misunderstand them… seems the design of Providence." Both characters diagnose themselves in chapter 11 and neither is listening.', min: 1.7 },
      { lane: '1', type: 'beat', beatFn: 'Danger acknowledged', title: 'He had never been so bewitched', note: 'Darcy, alone with the narrator: he "began to feel the danger of paying Elizabeth too much attention," and admits to himself that "he had never been so bewitched by any woman as he was by her." The attraction is confirmed as a problem *he* is managing — which is exactly the condescension that will wreck his proposal.', min: 1.2 },
      { lane: '1', type: 'beat', beatFn: 'Comic exhibition', title: 'Mrs Bennet at Netherfield', note: 'The mother arrives to assess Jane\'s illness and stays to boast, quarrel with Darcy about country society, and humiliate her daughters by degrees. The first full demonstration of the family\'s power to embarrass — a rehearsal for the ball, and the raw material of Darcy\'s later objection.', min: 1.3 },
      { lane: '1', type: 'beat', beatFn: 'Exit', title: 'Darcy is glad to see them go', note: 'The sisters leave; Bingley is sorry, Caroline relieved, and Darcy resolves that "no sign of admiration should now escape him." The Netherfield sequence closes with him deciding to stop — the first of three retreats from feeling, each one costlier than the last.', min: 0.9 },

      // ===== LANE 1 — CHAPTERS 13–17 (~10k, 6 beats) =====
      { lane: '1', type: 'scene', title: 'Chapters 13–17 · Mr Collins and Mr Wickham', words: 10000 },
      { lane: '1', type: 'beat', beatFn: 'Arrival (the entail personified)', title: 'A letter from the cousin who will inherit', note: 'Mr Collins announces himself by letter, offering to make amends to the daughters he will dispossess. Mr Bennet reads it aloud with relish — "There is something very pompous in his stile" — and looks forward to the visit as entertainment. The threat to the family arrives as comedy, which is how this novel prefers to deliver bad news.', min: 1.5 },
      { lane: '1', type: 'beat', beatFn: 'Comic portrait', title: 'Compliments arranged beforehand', note: 'Collins on his own technique: he studies "such little elegant compliments as may be adapted to ordinary occasions," and though he tries to give them "as unstudied an air as possible," they are composed in advance. A character whose spontaneity is pre-written — and a sly warning about how much of this society\'s sincerity is rehearsed.', min: 1.1 },
      { lane: '1', type: 'beat', beatFn: 'Setup', title: 'From Jane to Elizabeth in one morning', note: 'Collins arrives intending to marry Jane, learns she is likely engaged, and transfers his object to Elizabeth "while Mrs. Bennet was stirring the fire" — the work of a moment. His affection is an allocation, not a feeling, and the novel makes sure we see the switch happen so the proposal arrives pre-emptied of romance.', min: 1.0 },
      { lane: '1', type: 'beat', beatFn: 'Introduction (the charmer)', title: 'Wickham in the street at Meryton', note: 'A new officer with "a most gentlemanlike appearance" and "the happy readiness of conversation" — and then the tableau that should warn everyone: Darcy rides up, the two men see each other, one turns white and one red, and neither speaks. Austen shows the evidence of a history before anyone supplies the story, then lets the wrong version arrive first.', min: 1.5 },
      { lane: '1', type: 'beat', beatFn: 'Plant (the false account)', title: 'The living I was promised', note: 'Over cards at the Philipses\', Wickham tells his tale to a woman he met yesterday: the valuable living left him by old Mr Darcy, withheld by the son out of jealousy. He is careful to say he cannot expose the family, and then exposes it for an hour. The suspicious *manner* of the confidence is on the page in plain sight, and Elizabeth notices none of it.', min: 1.9 },
      { lane: '1', type: 'beat', beatFn: 'Prejudice confirmed', title: 'She honoured him for such feelings', note: 'Elizabeth believes every word and "honoured him for such feelings, and thought him handsomer than ever." Her judgment is not lazy — it is *confident*, built on a real slight at a real assembly. The novel\'s cruellest structural joke: her intelligence is what makes her wrong, because it lets her build so persuasive a case.', min: 1.5 },

      // ===== LANE 2A — CHAPTER 18 (~5k, 4 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapter 18 · The Netherfield Ball', words: 5000 },
      { lane: '2A', type: 'beat', beatFn: 'Disappointment', title: 'Wickham stays away', note: 'Elizabeth dresses for the ball expecting Wickham and finds he has absented himself — on Darcy\'s account, she assumes. The evening is soured before it starts, which is precisely the mood in which she will be asked to dance by the man she blames.', min: 1.2 },
      { lane: '2A', type: 'beat', beatFn: 'Duel in a dance', title: 'We are each of an unsocial, taciturn disposition', note: 'Surprised into accepting, Elizabeth dances with Darcy and fences the whole set — "We are each of an unsocial, taciturn disposition, unwilling to speak, unless we expect to say something that will amaze the whole room" — before pressing him on Wickham and watching him close. The novel\'s two leads at their most alive, in public, mutually infuriated.', min: 1.6 },
      { lane: '2A', type: 'beat', beatFn: 'Pinch (the family exhibits itself)', title: 'Every one of them exposed', note: 'The ball\'s long humiliation: Mrs Bennet audibly planning Jane\'s marriage within Darcy\'s hearing, Mary seizing the pianoforte and singing badly at length, Collins introducing himself to Darcy uninvited, Mr Bennet cutting his daughter off with "you have delighted us long enough." Elizabeth watches, mortified, unable to stop any of it.', min: 1.8 },
      { lane: '2A', type: 'beat', beatFn: 'Consequence (evidence for the defence)', title: 'The case Darcy is quietly building', note: 'Nothing is said, but the reader will meet this evening again — in the letter of chapter 35, itemized as grounds. Austen stages the family\'s failure in full so that Darcy\'s later objection is *earned*: when he calls the connection degrading, the reader has already sat through the proof.', min: 1.1 },

      // ===== LANE 2A — CHAPTERS 19–23 (~9k, 7 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapters 19–23 · Two Proposals at Longbourn', words: 9000 },
      { lane: '2A', type: 'beat', beatFn: 'Proposal 1', title: 'My reasons for marrying are, first…', note: 'Collins proposes by enumeration — a clergyman ought to set the example, it will add to his happiness, and Lady Catherine advised it — before mentioning Elizabeth at all, and closing with the violence of his affection and the loss of her thousand pounds. The first of the book\'s three proposals: a man reciting his own advantages to a woman he has not consulted.', min: 1.7 },
      { lane: '2A', type: 'beat', beatFn: 'Refusal 1', title: 'You could not make me happy', note: '"You could not make me happy, and I am convinced that I am the last woman in the world who would make you so." He refuses to believe her, ascribing the no to "the usual practice of elegant females." The refusal Darcy will hear in chapter 34 is drafted here, in farce — and the phrase "the last woman in the world" is the one she will re-use, in earnest, on him.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Comic authority', title: 'A stranger to one of your parents', note: 'Mrs Bennet demands her husband compel the match; Mr Bennet obliges with the funniest sentence in the novel: "An unhappy alternative is before you, Elizabeth… Your mother will never see you again if you do not marry Mr. Collins, and I will never see you again if you do." He saves his daughter with a joke — the one time his detachment is an unambiguous good, which makes chapter 41 sting.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Turn (the friend)', title: 'Charlotte takes him', note: 'Within three days Charlotte has secured the man Elizabeth refused, meeting him "accidentally in the lane" by careful design. The engagement lands on Elizabeth as a betrayal; on the reader it lands as chapter 6\'s doctrine coming due.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Rupture (the realist\'s case)', title: 'I am not romantic, you know', note: 'Charlotte states her terms without apology: "I am not romantic, you know. I never was. I ask only a comfortable home." At twenty-seven, without beauty or fortune, she has taken "the only honourable provision for well-educated young women of small fortune." Elizabeth cannot forgive it — and the novel declines to take her side, letting the realist keep her dignity.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Loss', title: 'The whole party has left Netherfield', note: 'Caroline\'s letter: Bingley is gone to town and will not return, with warm hints of Georgiana Darcy waiting for him there. Jane reads it as friendship; Elizabeth reads it as a plot by the sisters. Both are partly wrong — the mover is Darcy, and neither will learn it for eleven chapters.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Volume break', title: 'The end of Volume One', note: 'Austen\'s first volume closes on withdrawal: Bingley gone, Jane quietly wretched, Charlotte lost to Hunsford, and Mrs Bennet lamenting the entail to anyone who will listen. A deliberately unresolved act break — everything set up, nothing yet paid.', min: 1.1 },

      // ===== LANE 2A — CHAPTERS 24–27 (~7k, 5 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapters 24–27 · London and the Long Winter', words: 7000 },
      { lane: '2A', type: 'beat', beatFn: 'Suffering (the control group)', title: 'Jane, composed, in pain', note: 'Jane suffers without display and defends everyone involved; Elizabeth rages on her behalf: "There are few people whom I really love, and still fewer of whom I think well." The sister who does everything right is rewarded with exactly nothing — proof that the novel\'s obstacles are structural, not personal failings.', min: 1.3 },
      { lane: '2A', type: 'beat', beatFn: 'Introduction (the good marriage)', title: 'The Gardiners from Gracechurch Street', note: 'The uncle in trade — "greatly superior to his sister… by nature as by education" — and his sensible, affectionate wife. The one happy competent marriage in the book belongs to the least fashionable couple in it, and the plot will be resolved by them twice.', min: 1.2 },
      { lane: '2A', type: 'beat', beatFn: 'Warning', title: 'You must not let your fancy run away with you', note: 'Mrs Gardiner cautions Elizabeth against Wickham on grounds of money — a young man with no fortune cannot marry where there is none. Elizabeth accepts the reasoning easily, which is telling: her feeling for Wickham was never strong enough to test.', min: 1.3 },
      { lane: '2A', type: 'beat', beatFn: 'Defection (unremarked)', title: 'Miss King\'s ten thousand pounds', note: 'Wickham transfers his attentions to a girl who has just inherited, and Elizabeth excuses him — "handsome young men must have something to live on." The same mercenary manoeuvre she condemned in Charlotte, forgiven instantly in a charming man. The novel logs the double standard without comment and lets the letter collect it later.', min: 1.2 },
      { lane: '2A', type: 'beat', beatFn: 'Journey', title: 'Setting out for Kent', note: 'Elizabeth travels to Hunsford with Sir William and Maria, breaking the trip in Gracechurch Street, where the Gardiners propose a summer tour to the Lakes. Two invitations issued in one chapter: one takes her to the proposal, the other — reduced to Derbyshire — will take her to Pemberley.', min: 1.1 },

      // ===== LANE 2A — CHAPTERS 28–33 (~11k, 8 beats) =====
      { lane: '2A', type: 'scene', title: 'Chapters 28–33 · Hunsford and Rosings', words: 11000 },
      { lane: '2A', type: 'beat', beatFn: 'Arrival (the bargain, furnished)', title: 'Charlotte\'s parsonage', note: 'Elizabeth arrives braced for pity and finds her friend serene — Charlotte has chosen the back parlour for her sitting room precisely because her husband prefers the front, and encourages his gardening for the hours it takes. The marriage examined at close range: not happiness, but competent management, and Charlotte is not pretending otherwise.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Set-piece (rank as personality)', title: 'Lady Catherine at Rosings', note: 'Dinner at Rosings: her ladyship interrogating Elizabeth on her education, her sisters\' ages, her mother\'s want of a governess — and delivering opinions "in so decisive a manner as proved that she was not used to have her judgment controverted." Comedy now, and the exact register she will bring to Longbourn in chapter 56 when she is no longer funny.', min: 1.5 },
      { lane: '2A', type: 'beat', beatFn: 'Comic detail', title: 'The shelves in the closet upstairs', note: 'Lady Catherine\'s attention descends to the smallest domestic arrangements at the parsonage, down to advising on the shelves in the upstairs closet — and Collins receives it as wisdom. A single detail that establishes an entire system of patronage and deference in one line.', min: 0.9 },
      { lane: '2A', type: 'beat', beatFn: 'Arrival (the antagonist returns)', title: 'Darcy and Colonel Fitzwilliam come to Rosings', note: 'The two cousins arrive for Easter — Fitzwilliam easy and conversable, Darcy silent. Elizabeth registers only the annoyance of it. The novel has now placed her, for a fortnight, in a small society containing the man she despises and the man who will accidentally arm her against him.', min: 1.2 },
      { lane: '2A', type: 'beat', beatFn: 'Sparring (the last)', title: 'My fingers do not move over this instrument', note: 'At the pianoforte, Elizabeth tells Fitzwilliam how his cousin behaved at Meryton, teasing to Darcy\'s face; then the confession under the joke — "My fingers do not move over this instrument in the masterly manner… but then I have always supposed it to be my own fault, because I would not take the trouble of practising." Their last exchange as adversaries, and the warmest scene either has had.', min: 1.4 },
      { lane: '2A', type: 'beat', beatFn: 'Approach (unreadable)', title: 'He calls at the parsonage, and says nothing', note: 'Darcy begins visiting Hunsford at odd hours, sitting mostly silent; Charlotte, watching, concludes he must be in love with her friend. Elizabeth cannot construe it and stops trying. The reader, holding chapter 6, watches a courtship the heroine cannot see — the dramatic irony wound to its tightest.', min: 1.2 },
      { lane: '2A', type: 'beat', beatFn: 'Pinch (the slip)', title: 'Congratulating himself on saving a friend', note: 'Walking in the park, Colonel Fitzwilliam mentions idly that Darcy lately "congratulated himself on having lately saved a friend from the inconveniences of a most imprudent marriage" — there were "some very strong objections against the lady." He has no idea what he is handing her.', min: 1.5 },
      { lane: '2A', type: 'beat', beatFn: 'Fury', title: 'It was Jane', note: 'Elizabeth walks home with a headache and a certainty: the friend was Bingley, the lady her sister, the objections her family. She refuses to go to Rosings that evening. The novel puts her alone in the parsonage, at maximum anger, with a loaded case — and then sends Darcy to the door.', min: 1.3 },

      // ===== LANE 2B — CHAPTERS 34–36 (~7k, 7 beats) — THE MIRROR MOMENT =====
      { lane: '2B', type: 'scene', title: 'Chapters 34–36 · The Proposal and the Letter', words: 7000 },
      { lane: '2B', type: 'beat', beatFn: 'MIRROR MOMENT — Proposal 2', title: 'In vain have I struggled', note: 'Chapter 34 of 61, and the axis of the book: "In vain have I struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you." Then he keeps talking — of her inferiority, of the family obstacles, of "his sense of her inferiority… of the family obstacles which judgment had always opposed to inclination." He is not asking; he is announcing a concession.', min: 1.5 },
      { lane: '2B', type: 'beat', beatFn: 'Refusal 2', title: 'The last man in the world', note: '"You could not have made me the offer of your hand in any possible way that would have tempted me to accept it… you are the last man in the world whom I could ever be prevailed on to marry." The line answers Collins in chapter 19 word for word — and answers "not handsome enough to tempt me" from chapter 3. The book\'s two halves are hinged on this sentence.', min: 1.5 },
      { lane: '2B', type: 'beat', beatFn: 'The charges', title: 'Jane, and Wickham', note: 'She names both counts: that he ruined her sister\'s happiness, and that he reduced Wickham to poverty. He does not deny the first — "I have no wish of denying that I did every thing in my power to separate my friend from your sister" — and it is his *composure* that enrages her most. Both charges are on the table, one true and one false, and neither of them knows which is which.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Ungentlemanlike', title: 'Had you behaved in a more gentlemanlike manner', note: 'Her closing blow: "you could not have made me the offer of your hand in any possible way… had you behaved in a more gentleman-like manner." The word lands on the one part of himself he has never questioned. He leaves the room; the front half of the novel ends with it.', min: 1.1 },
      { lane: '2B', type: 'beat', beatFn: 'The letter (the reversal engine)', title: 'Be not alarmed, Madam', note: 'The next morning, two sheets written close: Bingley and Jane — he genuinely believed her indifferent, and confesses concealing Bingley\'s presence in town — and then Wickham, entire. The refusal to answer aloud and the decision to answer in writing is the structural masterstroke: the reader gets the true account in the antagonist\'s own voice, at the exact centre of the book.', min: 1.6 },
      { lane: '2B', type: 'beat', beatFn: 'Evidence (Georgiana)', title: 'Ramsgate, and a girl of fifteen', note: 'The letter\'s decisive proof: Wickham pursued Georgiana Darcy — fifteen, thirty thousand pounds — to the point of an elopement stopped days beforehand, "chiefly for the sake of the fortune, and revenge." Darcy stakes his sister\'s reputation on being believed, which is why Elizabeth believes him. Also the plant that makes chapter 46 inevitable.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'THE TURN — self-knowledge', title: 'Till this moment I never knew myself', note: 'She reads it twice, contradicts it, reads it again — and breaks: "How despicably have I acted!… I, who have prided myself on my discernment!… who have often disdained the generous candour of my sister… Pleased with the preference of one, and offended by the neglect of the other, on the very beginning of our acquaintance, I have courted prepossession and ignorance, and driven reason away. Till this moment I never knew myself." Bell\'s mirror moment in one paragraph, at the book\'s centre: not "what will I do" but "who am I."', min: 1.6 },

      // ===== LANE 2B — CHAPTERS 37–42 (~10k, 6 beats) =====
      { lane: '2B', type: 'scene', title: 'Chapters 37–42 · Longbourn, and Brighton', words: 10000 },
      { lane: '2B', type: 'beat', beatFn: 'Reversal (vanity named)', title: 'Vanity, not love, has been my folly', note: 'The self-audit continues past the first shock: "Vanity, not love, has been my folly." She was flattered by Wickham and slighted by Darcy, and built a moral system on the difference. The novel is precise that her error was not stupidity but *pride* — which makes her the title\'s second half, not its first.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Departure (seeing clearly)', title: 'Leaving Hunsford', note: 'Farewells at the parsonage, with Elizabeth now able to see Charlotte\'s bargain without contempt, and Collins commending his own domestic felicity at length. The Kent movement closes on a heroine who has learned to look at a life she would not choose and grant it its terms.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Reunion (comic, ominous)', title: 'Lydia and Kitty at the inn', note: 'The younger sisters meet the travellers with a laid-out luncheon they cannot pay for and a bonnet Lydia has bought and already dislikes — plus the news that the regiment leaves for Brighton. Broad comedy carrying the fuse: everything that destroys the family in Volume III is cheerfully announced here.', min: 1.2 },
      { lane: '2B', type: 'beat', beatFn: 'Confidence (partial)', title: 'She tells Jane about Wickham, and not about the proposal', note: 'Elizabeth shares the Wickham half of the letter and withholds the proposal entirely — and the sisters agree to keep his character quiet, since the regiment is leaving anyway. A decision made from delicacy that turns out to be catastrophic; the novel is careful that good manners help ruin Lydia.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Refusal (the fatal one)', title: 'Let Lydia go to Brighton', note: 'Elizabeth argues seriously against Brighton — Lydia is "vain, ignorant, idle, and absolutely uncontrolled" and will be worse in a garrison town. Mr Bennet declines to be troubled: Lydia will be "poor and insignificant" enough to come to no harm, and "we shall have no peace at Longbourn if she does not go." The wittiest man in the book makes the worst decision in it, on grounds of comfort.', min: 1.5 },
      { lane: '2B', type: 'beat', beatFn: 'Indictment (the father)', title: 'Talents which might have preserved the respectability of his daughters', note: 'The narrator anatomizes the Bennet marriage without a joke: captivated by youth and beauty, he found "respect, esteem, and confidence had vanished for ever," and took his revenge in ridicule — "talents, which, rightly used, might at least have preserved the respectability of his daughters." Austen closes Volume II by naming the cause of the disaster before it happens.', min: 1.3 },

      // ===== LANE 2B — CHAPTERS 43–45 (~8k, 7 beats) =====
      { lane: '2B', type: 'scene', title: 'Chapters 43–45 · Pemberley', words: 8000 },
      { lane: '2B', type: 'beat', beatFn: 'Arrival (the house as argument)', title: 'She had never seen a place for which nature had done more', note: 'Pemberley from the rise: a stream "swelled into greater, but without any artificial appearance," and Elizabeth "had never seen a place for which nature had done more, or where natural beauty had been so little counteracted by an awkward taste." The house is a character reference in landscape form — restraint, proportion, nothing showy — and she reads it correctly at once.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Confession (half a joke)', title: 'To be mistress of Pemberley might be something', note: '"And of this place… I might have been mistress!… she felt that to be mistress of Pemberley might be something!" Austen lets her heroine feel the money — honestly, and only for a moment. The novel never pretends the estate is irrelevant; it insists only that it not be the reason.', min: 1.1 },
      { lane: '2B', type: 'beat', beatFn: 'Testimony (the reversal, in evidence)', title: 'Mrs Reynolds, the housekeeper', note: 'The servant who has known him since he was four: "He is the best landlord, and the best master that ever lived… There is not one of his tenants or servants but will give him a good name." Elizabeth is astonished — "This was praise, of all others most extraordinary, most opposite to her ideas." Character testimony from the one witness with nothing to gain, and it demolishes twenty chapters of her reading.', min: 1.5 },
      { lane: '2B', type: 'beat', beatFn: 'Image (the portrait)', title: 'A smile she remembered to have sometimes seen', note: 'In the picture gallery she stands before his portrait "with a smile over the face as she remembered to have sometimes seen, when he looked at her," and thinks of his regard with gratitude for the first time. The novel gives her a silent, private minute with the man in effigy before it gives her the man.', min: 1.1 },
      { lane: '2B', type: 'beat', beatFn: 'Encounter (both undone)', title: 'He came suddenly forward from the way behind', note: 'Darcy arrives a day early and walks straight into her on his own grounds. Both are scarlet; both are painfully civil; he asks after her family, twice, and about the Gardiners — the relations in trade he was invited to despise — and walks with them. Nothing is declared. Everything is answered.', min: 1.4 },
      { lane: '2B', type: 'beat', beatFn: 'Reversal (proof by deed)', title: 'He wishes to introduce his sister', note: 'The measure of the change: he brings Georgiana — the sister whose near-ruin he confessed in the letter — to be introduced to the woman who refused him. He cannot argue his case, so the novel has him demonstrate it: every objection he made in chapter 34 is retracted in an action, not a speech.', min: 1.4 },
      { lane: '2B', type: 'beat', beatFn: 'Contrast', title: 'Caroline\'s spite, and his answer', note: 'Caroline Bingley, needling at Lambton, calls Elizabeth much altered and reminds Darcy he once thought her barely tolerable. His reply, spoken to the room: it is "many months since I have considered her as one of the handsomest women of my acquaintance." Chapter 3\'s insult formally revoked, in public, without Elizabeth present.', min: 1.2 },

      // ===== LANE 2B — CHAPTERS 46–50 (~10k, 6 beats) =====
      { lane: '2B', type: 'scene', title: 'Chapters 46–50 · The Elopement', words: 10000 },
      { lane: '2B', type: 'beat', beatFn: 'Catastrophe', title: 'Two letters from Jane, one misdirected', note: 'The blow arrives by post, delayed: Lydia has gone from Brighton with Wickham, and they are not married and are not going to be. Elizabeth\'s first coherent thought is that she could have prevented it — she had the letter, she had the proof, and she chose delicacy. The plot\'s disaster is generated by the heroine\'s own good manners.', min: 1.5 },
      { lane: '2B', type: 'beat', beatFn: 'Exposure (the worst moment)', title: 'Darcy walks in as she reads', note: 'He finds her in tears and she tells him everything — the elopement, the disgrace, the family ruined — and watches him "in earnest meditation." She reads his silence as the end: "never had she so honestly felt that she could have loved him, as now, when all love must be vain." The novel puts recognition and loss in the same paragraph.', min: 1.4 },
      { lane: '2B', type: 'beat', beatFn: 'Home in crisis', title: 'Longbourn without a plan', note: 'Mrs Bennet in bed with her nerves, blaming the Forsters; Mr Bennet gone to London to search without a notion how; Mary supplying morals — "loss of virtue in a female is irretrievable" — and Kitty aggrieved at not being told. The family\'s comic incapacity, replayed with the stakes turned all the way up.', min: 1.3 },
      { lane: '2B', type: 'beat', beatFn: 'Remorse', title: 'Let me once in my life feel how much I have been to blame', note: 'Mr Bennet returns, unable to joke: "Let me once in my life feel how much I have been to blame. I am not afraid of being overpowered by the impression. It will pass away soon enough." He accepts the fault exactly, and changes nothing — his self-knowledge arrives without reform, which is what makes it the dark twin of Elizabeth\'s.', min: 1.2 },
      { lane: '2B', type: 'beat', beatFn: 'Rescue (terms too cheap)', title: 'Mr Gardiner\'s letter from London', note: 'They are found; Wickham will marry her for a hundred pounds a year and the settling of his debts. Mr Bennet is baffled — no man takes on Lydia for so little — and calculates that his brother-in-law must have paid ten thousand pounds. The novel signals a hidden benefactor and then makes the reader wait two chapters, exactly as it did with the green light in Gatsby.', min: 1.4 },
      { lane: '2B', type: 'beat', beatFn: 'Reversal (private grief)', title: 'She began to comprehend that he was exactly the man', note: 'With the family saved on shameful terms and Darcy — she assumes — permanently withdrawn, Elizabeth arrives at the plainest statement of her feeling in the book: "she began to comprehend that he was exactly the man who, in disposition and talents, would most suit her." Understanding is complete and, as far as she knows, useless.', min: 1.4 },

      // ===== LANE 3 — CHAPTERS 51–55 (~9k, 6 beats) =====
      { lane: '3', type: 'scene', title: 'Chapters 51–55 · What Lydia Let Slip', words: 9000 },
      { lane: '3', type: 'beat', beatFn: 'Shamelessness', title: 'Mrs Wickham comes home', note: 'Lydia returns married, unrepentant and delighted, thrusting her ring at the housekeeper and reminding Jane that she must now go in to dinner ahead of her, "because I am a married woman." The disgrace that nearly destroyed five sisters is, to its author, a triumph. Austen refuses to reform her.', min: 1.3 },
      { lane: '3', type: 'beat', beatFn: 'The slip', title: 'Mr Darcy was there', note: 'Chattering about the wedding, Lydia lets it out — "Mr. Darcy was there" — then claps her hand over her mouth: it was to be a secret. The entire third-act revelation turns on the indiscretion of the least reliable person in the book. Elizabeth writes to her aunt within the hour.', min: 1.2 },
      { lane: '3', type: 'beat', beatFn: 'REVELATION', title: 'Mrs Gardiner\'s letter: he did it all', note: 'The answer from Gracechurch Street: Darcy found them, met Wickham repeatedly, paid his debts, bought his commission, settled money on Lydia, and stood at the wedding — on condition that no one be told. His stated reason: it was his own reticence about Wickham\'s character that let it happen. The chapter-35 letter\'s twin, and the mirror of chapter 34 — there he separated Bingley from a sister; here he marries one off to save the family.', min: 1.6 },
      { lane: '3', type: 'beat', beatFn: 'Recognition', title: 'For such a woman as Lydia', note: 'Elizabeth\'s reaction is not gratitude but arithmetic: he did it for her, and he did it by paying, personally, to make Wickham his brother — the man he most despises, bound to him for life. "Her heart did whisper that he had done it for her." The debt is unpayable, which is precisely why she cannot speak of it.', min: 1.2 },
      { lane: '3', type: 'beat', beatFn: 'Payoff (release)', title: 'Bingley comes back to Netherfield', note: 'Bingley returns, and Darcy comes with him — silent, stiff, impossible to read. Mrs Bennet fawns on one and insults the other in the same breath, oblivious that the man she is slighting has just bought her family\'s respectability.', min: 1.2 },
      { lane: '3', type: 'beat', beatFn: 'Payoff (the control group)', title: 'Jane, at last', note: 'Bingley proposes; Jane is "the happiest creature in the world." The first plot to be set in motion is the last to be undone and the first to be paid — and the payment consists entirely of Darcy standing aside and telling the truth about her feelings, undoing his own chapter-34 confession.', min: 1.4 },

      // ===== LANE 3 — CHAPTERS 56–58 (~7k, 5 beats) =====
      { lane: '3', type: 'scene', title: 'Chapters 56–58 · Lady Catherine, and After', words: 7000 },
      { lane: '3', type: 'beat', beatFn: 'Confrontation', title: 'Are the shades of Pemberley to be thus polluted?', note: 'Lady Catherine arrives unannounced, marches Elizabeth into the wilderness, and demands she deny a report of an engagement: "Are the shades of Pemberley to be thus polluted?" The comic grande dame of Volume II returns with the register unchanged and the stakes transformed — the same manner that was funny at Rosings is naked class violence at Longbourn.', min: 1.6 },
      { lane: '3', type: 'beat', beatFn: 'Refusal 3', title: 'I am only resolved to act in that manner', note: 'Elizabeth will not promise. "I am only resolved to act in that manner, which will, in my own opinion, constitute my happiness, without reference to you, or to any person so wholly unconnected with me." Three refusals now — Collins, Darcy, and a titled woman with every social weapon — and this is the one where she refuses on her own authority rather than in reaction to someone else.', min: 1.3 },
      { lane: '3', type: 'beat', beatFn: 'Backfire (the antagonist delivers the ending)', title: 'Her ladyship reports the conversation', note: 'Lady Catherine goes to Darcy to enlist him — and by repeating Elizabeth\'s refusal to disavow him, tells him the one thing he could not have asked: that there is hope. "It taught me to hope, as I had scarcely ever allowed myself to hope before." The obstacle character carries the message that resolves the book.', min: 1.3 },
      { lane: '3', type: 'beat', beatFn: 'Proposal 3', title: 'You are too generous to trifle with me', note: 'On the walk: Elizabeth thanks him for Lydia; he answers that he thought only of her. Then — "You are too generous to trifle with me. If your feelings are still what they were last April, tell me so at once. My affections and wishes are unchanged, but one word from you will silence me on this subject for ever." The third proposal is the shortest, and the only one that asks a question and waits.', min: 1.5 },
      { lane: '3', type: 'beat', beatFn: 'CHIASMUS CLOSED', title: 'By you, I was properly humbled', note: 'Both audit the front half aloud. Darcy: "I have been a selfish being all my life, in practice, though not in principle… You taught me a lesson, hard indeed at first, but most advantageous. By you, I was properly humbled." Elizabeth on her letter: "the adieu is charity itself." The novel stops to name its own structure — the back half exists to reverse the front, and the characters say so.', min: 1.4 },

      // ===== LANE 3 — CHAPTERS 59–61 (~6k, 6 beats) =====
      { lane: '3', type: 'scene', title: 'Chapters 59–61 · Longbourn Settles', words: 6000 },
      { lane: '3', type: 'beat', beatFn: 'Disbelief', title: 'Good heaven! can it be really true?', note: 'Jane cannot believe it; Mrs Bennet, who has called him the most disagreeable man in England for fifty chapters, converts on the instant to "Oh! my sweetest Lizzy! how rich and how great you will be!" The novel gets its last laugh out of the mother without letting her learn a thing.', min: 1.1 },
      { lane: '3', type: 'beat', beatFn: 'The father\'s test', title: 'We all know him to be a proud, unpleasant sort of man', note: 'Mr Bennet, alone with her: "He is rich, to be sure… but will this make you happy?… We all know him to be a proud, unpleasant sort of man; but this would be nothing if you really liked him." The one moment he does his job as a father, and Elizabeth must argue her own case — to the man whose failure to argue Lydia\'s nearly ruined them.', min: 1.4 },
      { lane: '3', type: 'beat', beatFn: 'Consent (and the debt named)', title: 'Lizzy, I have given him my consent', note: 'She tells her father what Darcy did for Lydia, and he consents — with the wry postscript that he would have given ten thousand pounds not to have to repay it. The last act of the father plot: the debt he could not pay, paid by his daughter\'s suitor, acknowledged in a joke.', min: 1.1 },
      { lane: '3', type: 'beat', beatFn: 'The joke that is half true', title: 'From my first seeing his beautiful grounds at Pemberley', note: 'Jane asks how long she has loved him. "It has been coming on so gradually, that I hardly know when it began. But I believe I must date it from my first seeing his beautiful grounds at Pemberley." A joke that is also the plot: the estate did change her mind — not as property, but as evidence.', min: 1.0 },
      { lane: '3', type: 'beat', beatFn: 'Retrospect', title: 'I was in the middle before I knew that I had begun', note: 'Darcy on his own beginning: "I cannot fix on the hour, or the spot, or the look, or the words, which laid the foundation. It is too long ago. I was in the middle before I knew that I had begun." And on why she took him: "you were sick of civility, of deference, of officious attention… I roused, and interested you, because I was so unlike them."', min: 1.1 },
      { lane: '3', type: 'beat', beatFn: 'Coda (the settlement)', title: 'Happy for all her maternal feelings', note: 'The last chapter disposes of everyone in a page: "Happy for all her maternal feelings was the day on which Mrs. Bennet got rid of her two most deserving daughters." Kitty improves away from Lydia, Mary stops comparing herself to her sisters, the Wickhams are always asking for money — and the final sentence goes to the Gardiners, who brought Elizabeth to Derbyshire. The book\'s last word of thanks is for the relations in trade whom Darcy was once too proud to meet.', min: 1.3 },
    ],
  },
};
