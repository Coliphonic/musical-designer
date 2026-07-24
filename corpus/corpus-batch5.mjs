// Data-only corpus, batch 5: two modern family-comedy adaptations,
// one per tradition. Same tuple shape: [half, fn, voice, estMin].
export const BATCH5 = {
  mrsdoubtfire: { // 2021 Broadway — album/Wikipedia split (A1 ends Rockin' Now).
    // Album's 11 A2 tracks = these 8 stage numbers + entr'acte + reprise +
    // the As Long as There Is Love Pt.1/Pt.2 split (merged into the finale).
    form: 'two-act', year: 2021, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3.5], // What's Wrong with This Picture
      ['A1', 'iwant',     'solo',  3.5], // I Want to Be There
      ['A1', 'production','group', 4],   // Make Me a Woman
      ['A1', 'comedy',    'group', 3],   // What the Hell (kids)
      ['A1', 'diegetic',  'group', 2],   // The Mr. Jolly Show
      ['A1', 'production','group', 3.5], // Easy Peasy
      ['A1', 'reprise',   'group', 1.5], // The Mr. Jolly Show (Rep)
      ['A1', 'charm',     'solo',  2.5], // About Time
      ['A1', 'finale',    'group', 3.5], // Rockin' Now — the act-break blowout
      ['A2', 'production','group', 3.5], // The Shape of Things to Come (opens A2)
      ['A2', 'comedy',    'group', 2.5], // Big Fat No
      ['A2', 'ballad',    'solo',  3.5], // Let Go
      ['A2', 'drive',     'solo',  2.5], // Clean Up This Mess
      ['A2', 'production','group', 3],   // Playing with Fire
      ['A2', 'diegetic',  'group', 3],   // He Lied to Me (La Rosa flamenco)
      ['A2', 'eleven',    'duet',  3.5], // Just Pretend
      ['A2', 'finaleultimo','group',3.5],// As Long as There Is Love (Pt.1+2)
    ] },
  paddington: { // 2025 West End (Savoy) · Fletcher/Swale
    form: 'two-act', year: 2025, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 3],   // Overture / Mr Gruber's Curiosities
      ['A1', 'charm',     'solo',  3],   // I've Arrived
      ['A1', 'comedy',    'solo',  2.5], // The Taxi Driver's Code
      ['A1', 'comedy',    'group', 3],   // Don't Touch That One
      ['A1', 'charm',     'duet',  3],   // Page at a Time
      ['A1', 'villain',   'solo',  3],   // Pretty Little Dead Things
      ['A1', 'production','group', 4],   // The Rhythm of London
      ['A1', 'charm',     'duet',  3],   // Mr Gruber's Shop
      ['A1', 'comedy',    'solo',  2.5], // Hard Stare
      ['A1', 'ballad',    'group', 3.5], // The Explorer and the Bear
      ['A1', 'drive',     'group', 3],   // Risky Business
      ['A1', 'finale',    'group', 4],   // One of Us
      ['A2', 'production','group', 3.5], // Marmalade
      ['A2', 'charm',     'duet',  3],   // Worth the Work
      ['A2', 'drive',     'group', 3],   // Where's Paddington
      ['A2', 'villain',   'solo',  3],   // Everything You Never Were
      ['A2', 'ballad',    'solo',  3],   // It's Never Too Late
      ['A2', 'ballad',    'solo',  3],   // Aunt Lucy's Prayer
      ['A2', 'production','group', 3],   // The Geographer's Guild
      ['A2', 'drive',     'group', 3],   // Unstoppable
      ['A2', 'reprise',   'solo',  1.5], // Everything You Never Were (Rep)
      ['A2', 'finaleultimo','group',3],  // Worth the Work (Rep)
    ] },
};
