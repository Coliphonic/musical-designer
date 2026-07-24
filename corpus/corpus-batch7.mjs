// Data-only corpus, batch 7: the FLOP CONTROL GROUP (testing survivorship
// bias) + the intimate/off-Broadway wing. Tuples: [half, fn, voice, estMin].
// flop:true marks the control group.
export const BATCH7 = {
  // ═══ FLOP CONTROL GROUP ═══
  merrily: { // 1981 · 16 performances · reverse chronology
    form: 'two-act', year: 1981, region: 'bway', flop: true,
    songs: [
      ['A1', 'opening',   'group', 2.5], // The Hills of Tomorrow
      ['A1', 'production','group', 4],   // Rich and Happy
      ['A1', 'comedy',    'solo',  4.5], // Franklin Shepard, Inc.
      ['A1', 'charm',     'group', 3.5], // Old Friends
      ['A1', 'ballad',    'solo',  3],   // Like It Was
      ['A1', 'ballad',    'solo',  2.5], // Not a Day Goes By
      ['A1', 'finale',    'group', 4],   // Now You Know
      ['A2', 'comedy',    'group', 3],   // It's a Hit!
      ['A2', 'production','group', 3.5], // The Blob
      ['A2', 'ballad',    'solo',  3],   // Good Thing Going
      ['A2', 'diegetic',  'group', 2.5], // Bobby and Jackie and Jack
      ['A2', 'reprise',   'duet',  2],   // Not a Day Goes By (Rep)
      ['A2', 'drive',     'group', 5],   // Opening Doors
      ['A2', 'eleven',    'group', 4.5], // Our Time (the HOPEFUL eleven)
      ['A2', 'finaleultimo','group',2],  // The Hills of Tomorrow (Rep)
    ] },
  chess: { // 1988 Broadway · 68 performances
    form: 'two-act', year: 1988, region: 'bway', flop: true,
    songs: [
      ['A1', 'opening',   'solo',  4],   // The Story of Chess (narrator opening)
      ['A1', 'production','group', 2.5], // Press Conference
      ['A1', 'iwant',     'solo',  4],   // Where I Want to Be
      ['A1', 'comedy',    'group', 2.5], // Merchandisers
      ['A1', 'drive',     'group', 2.5], // Diplomats
      ['A1', 'production','group', 3.5], // Quartet (Model of Decorum…)
      ['A1', 'ballad',    'solo',  4],   // Someone Else's Story
      ['A1', 'production','group', 4],   // One Night in Bangkok
      ['A1', 'love',      'duet',  4],   // Terrace Duet
      ['A1', 'drive',     'duet',  3],   // Florence Quits
      ['A1', 'drive',     'solo',  4],   // Nobody's Side
      ['A1', 'finale',    'solo',  3.5], // Anthem (solo act finale)
      ['A2', 'production','solo',  3],   // The Arbiter
      ['A2', 'diegetic',  'group', 2],   // Hungarian Folk Song
      ['A2', 'ballad',    'solo',  3.5], // Heaven Help My Heart
      ['A2', 'drive',     'duet',  3],   // Winning
      ['A2', 'love',      'duet',  3.5], // You and I
      ['A2', 'ballad',    'duet',  4],   // I Know Him So Well
      ['A2', 'soliloquy', 'solo',  4.5], // Pity the Child
      ['A2', 'ballad',    'duet',  2.5], // Father's Lullaby
      ['A2', 'production','group', 6],   // Endgame
      ['A2', 'reprise',   'duet',  2],   // You and I (Rep)
      ['A2', 'finaleultimo','solo',2.5], // Finale (Florence — solo FU)
    ] },
  carrie: { // 1988 (5 performances) · encoded from the 2012 revisal
    form: 'two-act', year: 1988, region: 'bway', flop: true,
    songs: [
      ['A1', 'opening',   'group', 3.5], // In
      ['A1', 'iwant',     'solo',  3],   // Carrie
      ['A1', 'production','group', 3],   // Open Your Heart
      ['A1', 'villain',   'duet',  3.5], // And Eve Was Weak
      ['A1', 'villain',   'group', 3],   // The World According to Chris
      ['A1', 'ballad',    'duet',  3],   // Evening Prayers
      ['A1', 'charm',     'solo',  2.5], // Dreamer in Disguise
      ['A1', 'drive',     'solo',  2.5], // Once You See
      ['A1', 'charm',     'duet',  3],   // Unsuspecting Hearts
      ['A1', 'drive',     'group', 3],   // Do Me a Favor
      ['A1', 'finale',    'duet',  3],   // I Remember How Those Boys Could Dance
      ['A2', 'production','group', 3.5], // A Night We'll Never Forget
      ['A2', 'love',      'duet',  3],   // You Shine
      ['A2', 'charm',     'group', 2.5], // Why Not Me?
      ['A2', 'ballad',    'duet',  2.5], // Stay Here Instead
      ['A2', 'soliloquy', 'solo',  3],   // When There's No One
      ['A2', 'production','group', 2],   // Prom Arrival
      ['A2', 'reprise',   'duet',  2],   // Unsuspecting Hearts (Rep)
      ['A2', 'reprise',   'duet',  1.5], // Dreamer in Disguise (Rep)
      ['A2', 'production','group', 4],   // The Destruction
      ['A2', 'reprise',   'solo',  2],   // Carrie (Rep)
      ['A2', 'finaleultimo','group',2.5],// Epilogue
    ] },
  big: { // 1996 · 193 performances, big loss
    form: 'two-act', year: 1996, region: 'bway', flop: true,
    songs: [
      ['A1', 'opening',   'group', 3],   // Prologue
      ['A1', 'charm',     'duet',  2.5], // Talk to Her
      ['A1', 'drive',     'solo',  2.5], // This Isn't Me
      ['A1', 'iwant',     'solo',  3],   // I Want to Go Home (inverted I Want)
      ['A1', 'production','group', 2.5], // The Time of Your Life
      ['A1', 'production','group', 4],   // Fun (the piano number)
      ['A1', 'comedy',    'solo',  2.5], // Here We Go Again
      ['A1', 'love',      'duet',  3.5], // Stars, Stars, Stars
      ['A1', 'finale',    'group', 4],   // Cross the Line
      ['A2', 'production','group', 2.5], // It's Time
      ['A2', 'ballad',    'solo',  4],   // Stop, Time
      ['A2', 'ballad',    'solo',  3],   // Dancing All the Time
      ['A2', 'charm',     'solo',  2],   // I Want to Know
      ['A2', 'production','group', 3.5], // Coffee, Black
      ['A2', 'comedy',    'group', 2.5], // The Real Thing
      ['A2', 'ballad',    'solo',  3],   // One Special Man
      ['A2', 'eleven',    'solo',  3],   // When You're Big
      ['A2', 'finaleultimo','duet',3],   // I Want to Go Home / Stars (Rep)
    ] },
  bonnieclyde: { // 2011 · 69 performances
    form: 'two-act', year: 2011, region: 'bway', flop: true,
    songs: [
      ['A1', 'opening',   'group', 3.5], // Picture Show
      ['A1', 'iwant',     'duet',  3.5], // This World Will Remember Me
      ['A1', 'comedy',    'group', 3],   // You're Goin' Back to Jail
      ['A1', 'charm',     'solo',  3],   // How 'Bout a Dance?
      ['A1', 'charm',     'duet',  3.5], // When I Drive
      ['A1', 'diegetic',  'group', 3],   // God's Arms Are Always Open
      ['A1', 'comedy',    'duet',  3],   // You Can Do Better Than Him
      ['A1', 'ballad',    'duet',  3.5], // You Love Who You Love
      ['A1', 'drive',     'solo',  3],   // Raise a Little Hell
      ['A1', 'finale',    'duet',  3],   // This World Will Remember Us
      ['A2', 'production','group', 3.5], // Made in America
      ['A2', 'love',      'duet',  3],   // Too Late to Turn Back Now
      ['A2', 'ballad',    'solo',  3],   // That's What You Call a Dream
      ['A2', 'drive',     'duet',  3],   // What Was Good Enough for You
      ['A2', 'ballad',    'solo',  2.5], // Bonnie
      ['A2', 'reprise',   'group', 2],   // Raise a Little Hell (Rep)
      ['A2', 'eleven',    'solo',  3.5], // Dyin' Ain't So Bad
      ['A2', 'reprise',   'duet',  1.5], // Picture Show (Rep — bookend)
      ['A2', 'reprise',   'duet',  1.5], // Dyin' Ain't So Bad (Rep)
      ['A2', 'finaleultimo','solo',2],   // How 'Bout a Dance? (Rep — solo FU)
    ] },
  // ═══ INTIMATE / OFF-BROADWAY WING ═══
  nexttonormal: { // 2009 · Pulitzer (fragments merged)
    form: 'two-act', year: 2009, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Just Another Day
      ['A1', 'charm',     'solo',  2.5], // Everything Else
      ['A1', 'production','group', 4],   // My Psychopharmacologist and I
      ['A1', 'iwant',     'solo',  3.5], // I Miss the Mountains
      ['A1', 'comedy',    'group', 2.5], // It's Gonna Be Good
      ['A1', 'drive',     'solo',  1.5], // He's Not Here
      ['A1', 'drive',     'solo',  3],   // You Don't Know
      ['A1', 'drive',     'group', 3.5], // I Am the One
      ['A1', 'charm',     'group', 3],   // Superboy and the Invisible Girl
      ['A1', 'villain',   'solo',  3],   // I'm Alive (the ghost as villain)
      ['A1', 'production','group', 4],   // Make Up Your Mind / Catch Me I'm Falling
      ['A1', 'ballad',    'duet',  2.5], // I Dreamed a Dance
      ['A1', 'villain',   'duet',  2],   // There's a World
      ['A1', 'soliloquy', 'solo',  3],   // I've Been
      ['A1', 'comedy',    'solo',  2.5], // Didn't I See This Movie?
      ['A1', 'finale',    'duet',  3.5], // A Light in the Dark
      ['A2', 'production','duet',  3],   // Wish I Were Here
      ['A2', 'ballad',    'group', 2.5], // Song of Forgetting
      ['A2', 'charm',     'duet',  3],   // Hey #1–3 (merged)
      ['A2', 'production','group', 3],   // Better Than Before
      ['A2', 'villain',   'solo',  2.5], // Aftershocks
      ['A2', 'ballad',    'duet',  3],   // How Could I Ever Forget?
      ['A2', 'drive',     'solo',  2],   // The Break
      ['A2', 'ballad',    'duet',  3.5], // Maybe (Next to Normal)
      ['A2', 'eleven',    'solo',  3],   // So Anyway
      ['A2', 'finaleultimo','group',4],  // Light
    ] },
  littleshop: { // 1982 off-Broadway
    form: 'two-act', year: 1982, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 2.5], // Little Shop of Horrors
      ['A1', 'production','group', 4],   // Skid Row (Downtown)
      ['A1', 'diegetic',  'group', 2],   // Da-Doo
      ['A1', 'charm',     'solo',  2.5], // Grow for Me
      ['A1', 'iwant',     'solo',  3.5], // Somewhere That's Green
      ['A1', 'production','group', 2],   // Closed for Renovation
      ['A1', 'villain',   'solo',  3],   // Dentist!
      ['A1', 'comedy',    'duet',  3],   // Mushnik and Son
      ['A1', 'villain',   'duet',  4],   // Feed Me (Git It)
      ['A1', 'finale',    'duet',  3],   // Now (It's Just the Gas)
      ['A2', 'comedy',    'duet',  2.5], // Call Back in the Morning
      ['A2', 'love',      'duet',  4],   // Suddenly, Seymour
      ['A2', 'villain',   'solo',  3],   // Suppertime
      ['A2', 'production','group', 3.5], // The Meek Shall Inherit
      ['A2', 'reprise',   'duet',  2],   // Sominex / Suppertime (Rep)
      ['A2', 'reprise',   'solo',  1.5], // Somewhere That's Green (Rep)
      ['A2', 'finaleultimo','group',3.5],// Finale (Don't Feed the Plants)
    ] },
  lastfiveyears: { // 2002 off-Broadway · one-act · crossing timelines
    form: 'one-act-85', year: 2002, region: 'bway',
    songs: [
      ['A1', 'ballad',    'solo',  3.5], // Still Hurting (cold-open on the end)
      ['A1', 'charm',     'solo',  3],   // Shiksa Goddess
      ['A1', 'drive',     'solo',  3.5], // See I'm Smiling
      ['A1', 'charm',     'solo',  3],   // Moving Too Fast
      ['A1', 'charm',     'solo',  3.5], // Part of That
      ['A1', 'comedy',    'solo',  4.5], // The Schmuel Song
      ['A1', 'comedy',    'solo',  3.5], // A Summer in Ohio
      ['A1', 'love',      'duet',  5],   // The Next Ten Minutes (the ONLY duet — midpoint wedding)
      ['A2', 'comedy',    'solo',  3],   // A Miracle Would Happen
      ['A2', 'drive',     'solo',  3.5], // Climbing Uphill
      ['A2', 'drive',     'solo',  3.5], // If I Didn't Believe in You
      ['A2', 'charm',     'solo',  3.5], // I Can Do Better Than That
      ['A2', 'soliloquy', 'solo',  3.5], // Nobody Needs to Know
      ['A2', 'finaleultimo','duet',4],   // Goodbye Until Tomorrow / I Could Never Rescue You
    ] },
  falsettos: { // 1992 (March of the Falsettos '81 + Falsettoland '90)
    form: 'two-act', year: 1992, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3],   // Four Jews in a Room Bitching
      ['A1', 'charm',     'solo',  2],   // A Tight-Knit Family
      ['A1', 'production','group', 3],   // Love Is Blind
      ['A1', 'comedy',    'duet',  2.5], // The Thrill of First Love
      ['A1', 'comedy',    'group', 3],   // Marvin at the Psychiatrist
      ['A1', 'drive',     'group', 3],   // This Had Better Come to a Stop
      ['A1', 'comedy',    'solo',  3.5], // I'm Breaking Down
      ['A1', 'charm',     'group', 2.5], // Please Come to Our House
      ['A1', 'comedy',    'duet',  3],   // A Marriage Proposal
      ['A1', 'ballad',    'solo',  3],   // Trina's Song
      ['A1', 'motif',     'group', 2.5], // March of the Falsettos
      ['A1', 'charm',     'group', 3],   // Making a Home
      ['A1', 'ballad',    'solo',  3.5], // The Games I Play
      ['A1', 'drive',     'group', 3.5], // I Never Wanted to Love You
      ['A1', 'finale',    'duet',  3],   // Father to Son
      ['A2', 'production','group', 3],   // Welcome to Falsettoland
      ['A2', 'charm',     'group', 2.5], // The Year of the Child
      ['A2', 'comedy',    'group', 3.5], // The Baseball Game
      ['A2', 'production','group', 3.5], // A Day in Falsettoland
      ['A2', 'comedy',    'duet',  3],   // Everyone Hates His Parents
      ['A2', 'love',      'duet',  2.5], // What More Can I Say?
      ['A2', 'drive',     'duet',  3],   // Something Bad Is Happening
      ['A2', 'ballad',    'solo',  3.5], // Holding to the Ground
      ['A2', 'charm',     'group', 2.5], // Days Like This
      ['A2', 'drive',     'group', 2],   // Cancelling the Bar Mitzvah
      ['A2', 'love',      'group', 4],   // Unlikely Lovers
      ['A2', 'soliloquy', 'solo',  3],   // You Gotta Die Sometime
      ['A2', 'eleven',    'duet',  3.5], // What Would I Do?
      ['A2', 'finaleultimo','group',2],  // Falsettoland (Rep)
    ] },
  once: { // 2012 · Best Musical winner
    form: 'two-act', year: 2012, region: 'bway',
    songs: [
      ['A1', 'ballad',    'solo',  3],   // Leave (cold-open on heartbreak)
      ['A1', 'love',      'duet',  4],   // Falling Slowly (~10% — earliest love duet)
      ['A1', 'drive',     'group', 2],   // North Strand
      ['A1', 'ballad',    'solo',  2.5], // The Moon
      ['A1', 'diegetic',  'group', 2],   // Ej Pada Pada
      ['A1', 'ballad',    'solo',  3.5], // If You Want Me
      ['A1', 'comedy',    'solo',  1.5], // Broken Hearted Hoover Fixer Sucker Guy
      ['A1', 'drive',     'solo',  3],   // Say It to Me Now
      ['A1', 'finale',    'group', 4],   // Gold
      ['A2', 'ballad',    'solo',  3],   // Sleeping
      ['A2', 'drive',     'group', 3.5], // When Your Mind's Made Up
      ['A2', 'ballad',    'solo',  3],   // The Hill
      ['A2', 'motif',     'group', 2.5], // Gold (a cappella)
      ['A2', 'finaleultimo','duet',3.5], // Falling Slowly (Rep — bookend duet)
    ] },
};
