// Data-only corpus, batch 10: NEW RELEASES — shows carded once their cast
// album is out (2026-09-23, Colin's request, starting with The Lost Boys),
// then the 2024–25 / 2025–26 Broadway seasons' original scores, plus four
// older titles those seasons revived that the corpus never had. Jukebox
// shows (Titaníque, Buena Vista, Just in Time, A Wonderful World, Swept Away)
// are deliberately held back — Colin: "leave out the jukebox for now".
// Tuples: [half, fn, voice, estMin].
//
// SOURCING: running order from the published musical-numbers list, checked
// against the cast album; minutes are the ALBUM TRACK TIMES (iTunes lookup
// API, collection id named per show) rounded to the half-minute, not
// ballparks. Numbers the album does not record are left out and named.
// `year` is the first full production (as titleofshow uses its off-Broadway
// year); the Broadway year is in the comment. Album beats guide when the
// album and the list disagree (Colin's standing rule). Function tags are
// interpretive, as everywhere in this corpus.
//
// Adding a show here: also add its title to NAMES in build-atlas-data.mjs, and
// re-check the four cohort `basis:` strings in app/data.js (they quote live n=).
export const BATCH10 = {
  lostboys: { // 2026 · two-act · The Rescues (music/lyrics), Hornsby & Hoch (book)
    // Palace Theatre, opened 2026-04-26. Album: 28 tracks, 72 min.
    // Act One ends on "Secret Comes Out" (the album's own act-one-finale billing).
    // Omitted: "Thou Shall Not…" (0:31 ensemble fragment) and the bonus track
    // "Brother" (cut in previews, never sung in the show as it opened).
    // "Home (Prelude)" (1:00) is folded into the final number it leads into.
    form: 'two-act', year: 2026, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 4.5], // No More Monsters
      ['A1', 'iwant',        'solo',  2],   // Lose Yourself
      ['A1', 'villain',      'group', 3.5], // Have to Have You
      ['A1', 'comedy',       'group', 2.5], // Murder Capital of the World
      ['A1', 'love',         'duet',  3.5], // Hurt a Little
      ['A1', 'production',   'group', 2],   // Time to Kill
      ['A1', 'charm',        'solo',  2.5], // The Good Part
      ['A1', 'love',         'duet',  3.5], // Now, Forever
      ['A1', 'drive',        'group', 2],   // Lost Boy
      ['A1', 'ballad',       'group', 3],   // Take My Heart With You
      ['A1', 'reprise',      'solo',  1],   // Hurt a Little (Rep)
      ['A1', 'ballad',       'group', 4],   // Belong to Someone
      ['A1', 'finale',       'group', 4],   // Secret Comes Out
      ['A2', 'comedy',       'group', 2],   // My Brother Is A…
      ['A2', 'love',         'duet',  4],   // Wild
      ['A2', 'reprise',      'group', 1.5], // Belong to Someone (Rep)
      ['A2', 'villain',      'group', 2],   // You Belong to Me
      ['A2', 'ballad',       'solo',  3.5], // War
      ['A2', 'comedy',       'group', 1.5], // Your Mom's Boyfriend Is A…
      ['A2', 'reprise',      'group', 3.5], // Lose Yourself (Rep)
      ['A2', 'eleven',       'solo',  3],   // Michael
      ['A2', 'anthem',       'group', 3],   // Superpower
      ['A2', 'reprise',      'group', 2],   // No More Monsters (Rep)
      ['A2', 'drive',        'group', 2],   // The Reckoning
      ['A2', 'finaleultimo', 'group', 4],   // If We Make It Through the Night
    ] },

  // ═══ 2025–26 SEASON ═══
  twostrangers: { // 2023 Kiln, London (2024 West End, 2025 Bway) · two-act · Jim Barne & Kit Buchan
    // Broadway album 1878424761 (44 min). A two-hander, so every voice is solo
    // or duet by construction. Album order followed where Wikipedia differs
    // ("Dad" before "What'll It Be" there). Not recorded: "This Is the Place
    // (Rep)", "What Did You Say?", a mid-Act-2 "New York/What'll It Be".
    // Act One ends on "American Express".
    form: 'two-act', year: 2023, region: 'westend',
    songs: [
      ['A1', 'opening',      'solo',  3.5], // New York
      ['A1', 'charm',        'solo',  4],   // What'll It Be
      ['A1', 'iwant',        'solo',  3],   // Dad
      ['A1', 'comedy',       'duet',  3.5], // On the App
      ['A1', 'charm',        'duet',  2.5], // This Is the Place
      ['A1', 'love',         'duet',  2],   // Under the Mistletoe
      ['A1', 'ballad',       'solo',  3],   // Be Happy
      ['A1', 'finale',       'duet',  3],   // American Express
      ['A2', 'comedy',       'duet',  3],   // The Hangover Duet
      ['A2', 'ballad',       'solo',  3],   // He Doesn't Exist
      ['A2', 'soliloquy',    'solo',  3.5], // About to Go In
      ['A2', 'eleven',       'solo',  3.5], // This Year
      ['A2', 'production',   'duet',  3],   // Dearly Beloved
      ['A2', 'love',         'duet',  3],   // If I Believed
      ['A2', 'finaleultimo', 'duet',  1],   // New York / What'll It Be (Rep)
    ] },
  queenofversailles: { // 2024 Boston (2025 Bway) · two-act · Stephen Schwartz / Lindsey Ferrentino
    // Album 1887957754 (74 min). "Keep On Thrustin'" not recorded. Act One ends
    // on "This Is Not the Way". "Crash (1793)" is billed as the reprise of
    // "Crash" — the Versailles frame returning to answer 2008.
    form: 'two-act', year: 2024, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // Because I Can
      ['A1', 'establishing', 'group', 6],   // Because We Can
      ['A1', 'iwant',        'solo',  4],   // Caviar Dreams
      ['A1', 'comedy',       'group', 2.5], // Mrs. Florida
      ['A1', 'charm',        'solo',  3.5], // Each and Every Day
      ['A1', 'production',   'group', 4.5], // The Ballad of the Timeshare King
      ['A1', 'love',         'solo',  2.5], // Trust Me
      ['A1', 'production',   'group', 3],   // The Golden Hour
      ['A1', 'ballad',       'solo',  4.5], // Pretty Wins
      ['A1', 'production',   'group', 3],   // I Could Get Used to This / More and More
      ['A1', 'drive',        'group', 1.5], // Crash (2008)
      ['A1', 'finale',       'solo',  3],   // This Is Not the Way
      ['A2', 'charm',        'duet',  2],   // The Royal We
      ['A2', 'production',   'group', 3],   // Show 'Em You're the Queen
      ['A2', 'comedy',       'duet',  2],   // Pavane for a Dead Lizard
      ['A2', 'drive',        'group', 3],   // Watch
      ['A2', 'ballad',       'solo',  4],   // The Book of Random
      ['A2', 'ballad',       'group', 4.5], // Little Houses
      ['A2', 'production',   'group', 3],   // Higher Than Ever
      ['A2', 'eleven',       'solo',  3.5], // Grow the Light
      ['A2', 'reprise',      'group', 2],   // Crash (1793)
      ['A2', 'reprise',      'solo',  0.5], // I Could Get Used to This (Rep)
      ['A2', 'finaleultimo', 'solo',  6],   // This Time Next Year
    ] },

  // ═══ 2024–25 SEASON ═══
  deadoutlaw: { // 2024 off-Bway (2025 Bway) · one-act ~100 min · Yazbek & Della Penna / Itamar Moses
    // Album 1831548380 (56 min). No interval. Midpoint split after "A Stranger":
    // the man's life ends and the corpse's afterlife begins with the undertaker
    // ("Something from Nothing"). "Jail Cell" (0:46 fragment) omitted; the
    // "Nobody Knows Your Name" reprise is not recorded. The Bandleader narrates.
    form: 'one-act-100', year: 2024, region: 'bway',
    songs: [
      ['A1', 'opening',      'solo',  2.5], // Ballad
      ['A1', 'establishing', 'solo',  3.5], // Dead
      ['A1', 'iwant',        'duet',  3.5], // Normal
      ['A1', 'reprise',      'duet',  1.5], // Normal (Rep)
      ['A1', 'charm',        'solo',  3.5], // Killed a Man in Maine
      ['A1', 'reprise',      'solo',  1],   // Dead (Rep)
      ['A1', 'ballad',       'duet',  4],   // Nobody Knows Your Name
      ['A1', 'comedy',       'duet',  2],   // Blowin' It Up
      ['A1', 'drive',        'group', 3],   // Indian Train
      ['A1', 'soliloquy',    'solo',  3],   // Leave Me Be
      ['A1', 'ballad',       'solo',  3],   // A Stranger
      ['A2', 'production',   'group', 2.5], // Something from Nothing
      ['A2', 'comedy',       'group', 2],   // Our Dear Brother
      ['A2', 'production',   'group', 3],   // Somethin' 'bout a Mummy
      ['A2', 'charm',        'group', 3],   // Andy Payne
      ['A2', 'reprise',      'duet',  1],   // Somethin' 'bout a Mummy (Rep)
      ['A2', 'ballad',       'solo',  4],   // Millicent's Song
      ['A2', 'eleven',       'solo',  3.5], // Up to the Stars
      ['A2', 'reprise',      'group', 0.5], // Our Dear Brother (Rep)
      ['A2', 'anthem',       'group', 3.5], // Crimson Thread
      ['A2', 'finaleultimo', 'solo',  1.5], // Dead (Finale)
    ] },
  deathbecomesher: { // 2024 Chicago (2024 Bway) · two-act · Julia Mattison & Noel Carey / Marco Pennette
    // Album 1804787949 (60 min). Not recorded: "(I See) Me!", "The Chase".
    // Prelude and Entr'acte omitted. Act One ends on "Confrontation". Viola and
    // the Immortals are the tempters — both their numbers tag villain.
    form: 'two-act', year: 2024, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // If You Want Perfection
      ['A1', 'production',   'group', 4.5], // For the Gaze
      ['A1', 'iwant',        'solo',  3.5], // That Was Then, This Is Now
      ['A1', 'comedy',       'group', 3],   // Tell Me, Ernest
      ['A1', 'production',   'group', 2],   // Madeline Ashton's Intimate Wedding Extravaganza
      ['A1', 'love',         'solo',  0.5], // Ernest's Real Vows
      ['A1', 'comedy',       'solo',  2],   // Madeline
      ['A1', 'ballad',       'solo',  1.5], // 'Til Death
      ['A1', 'reprise',      'solo',  1],   // Tell Me, Ernest (Rep)
      ['A1', 'soliloquy',    'solo',  4.5], // Falling Apart
      ['A1', 'villain',      'group', 4],   // Siempre Viva
      ['A1', 'love',         'duet',  4],   // Let's Run Away Together
      ['A1', 'finale',       'group', 3],   // Confrontation
      ['A2', 'villain',      'group', 3],   // Don't Say I Didn't (Warn You)
      ['A2', 'comedy',       'duet',  3],   // Hit Me
      ['A2', 'drive',        'group', 4],   // The Plan
      ['A2', 'comedy',       'solo',  1],   // Stefan's Turn
      ['A2', 'comedy',       'group', 1.5], // Live to Serve
      ['A2', 'reprise',      'group', 1],   // Siempre Viva (Rep)
      ['A2', 'reprise',      'group', 1.5], // 'Til Death (Rep)
      ['A2', 'eleven',       'duet',  4],   // Alive Forever
      ['A2', 'drive',        'group', 1],   // Fifty Years Later
      ['A2', 'finaleultimo', 'group', 1.5], // The End
    ] },
  operationmincemeat: { // 2019 London (2023 West End, 2025 Bway) · two-act · SpitLip
    // Original Cast album 1680225222 (65 min) — London, there is no Broadway
    // album, and the score is the same. Not recorded: "Dead in the Water
    // (Rep)", "Born to Lead (Rep)", "Love Is a Bird", "I Call Abort",
    // "Haselden's Got a Good Feeling". Act One ends on "Just for Tonight".
    // "Making a Man" is a 9½-minute sequence; kept whole, not trimmed.
    form: 'two-act', year: 2019, region: 'westend',
    songs: [
      ['A1', 'opening',      'group', 5.5], // Born to Lead
      ['A1', 'comedy',       'group', 3],   // God That's Brilliant
      ['A1', 'iwant',        'solo',  2.5], // Dead in the Water
      ['A1', 'iwant',        'group', 2],   // All the Ladies
      ['A1', 'comedy',       'group', 2.5], // The Pitch
      ['A1', 'production',   'group', 9.5], // Making a Man
      ['A1', 'ballad',       'solo',  6],   // Dear Bill
      ['A1', 'drive',        'group', 1.5], // Sail On, Boys
      ['A1', 'finale',       'group', 5.5], // Just for Tonight
      ['A2', 'villain',      'group', 2.5], // Das Übermensch
      ['A2', 'comedy',       'group', 1],   // Bevan's Update
      ['A2', 'ballad',       'group', 3],   // The Ballad of Willie Watkins
      ['A2', 'reprise',      'group', 1],   // Spilsbury Reprise
      ['A2', 'eleven',       'duet',  4.5], // Useful
      ['A2', 'anthem',       'group', 5.5], // Act as If
      ['A2', 'drive',        'group', 2],   // Did We Do It?
      ['A2', 'finaleultimo', 'group', 7],   // A Glitzy Finale
    ] },
  redwood: { // 2024 La Jolla (2025 Bway) · one-act ~110 min · Kate Diaz / Tina Landau
    // Album 1809473164 (57 min). No interval. Midpoint split after "The
    // Ascent" — Jesse goes up into the canopy, the threshold of the story.
    // "A Dream" not recorded; "The Rain" (0:48) folded into "Still". A grief
    // show, and the tags say so: seven ballads.
    form: 'one-act-110', year: 2024, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 5],   // Drive
      ['A1', 'establishing', 'group', 2],   // The Trees
      ['A1', 'iwant',        'group', 3],   // Climb
      ['A1', 'charm',        'solo',  3.5], // Little Redwood
      ['A1', 'ballad',       'solo',  3.5], // The Stars
      ['A1', 'charm',        'group', 3.5], // Big Tree Religion
      ['A1', 'ballad',       'duet',  3.5], // Back Then
      ['A1', 'production',   'group', 2],   // The Ascent
      ['A2', 'soliloquy',    'solo',  3.5], // Great Escape
      ['A2', 'ballad',       'solo',  2],   // Roots
      ['A2', 'reprise',      'group', 1],   // Little Redwood (Rep)
      ['A2', 'ballad',       'solo',  2.5], // Looking Through This Lens
      ['A2', 'ballad',       'duet',  4.5], // In the Leaves
      ['A2', 'ballad',       'solo',  3],   // Becca's Song
      ['A2', 'soliloquy',    'solo',  3],   // No Repair
      ['A2', 'eleven',       'solo',  4.5], // The Fires
      ['A2', 'ballad',       'group', 5.5], // Still
      ['A2', 'finaleultimo', 'group', 2],   // Finale
    ] },
  realwomencurves: { // 2023 A.R.T. (2025 Bway) · two-act · Joy Huerta & Benjamin Velez / Lisa Loomer
    // Album 1813395457 (54 min). Not recorded: "De Nada (Rep)", "Make It Work
    // (Rep)", the Act 2 "Flying Away / If I Were a Bird" reprise. "Itzel's
    // Letter" is the album's name for the "Daydream (Rep)" slot. Act One ends
    // on "Oye Muchacha"; "Adiós Andres" opens Act Two.
    form: 'two-act', year: 2023, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 3],   // Make It Work
      ['A1', 'comedy',       'group', 2.5], // De Nada
      ['A1', 'iwant',        'solo',  3.5], // Flying Away
      ['A1', 'production',   'group', 4.5], // Jugglin'
      ['A1', 'ballad',       'duet',  3],   // If I Were a Bird
      ['A1', 'charm',        'group', 3],   // Daydream
      ['A1', 'love',         'duet',  4],   // Already Know You
      ['A1', 'finale',       'group', 4.5], // Oye Muchacha
      ['A2', 'comedy',       'group', 3],   // Adiós Andres
      ['A2', 'anthem',       'group', 3.5], // Siempre Mi Gente
      ['A2', 'production',   'group', 3.5], // Real Women Have Curves
      ['A2', 'love',         'duet',  3],   // Doin' It Anyway
      ['A2', 'ballad',       'duet',  2.5], // Life Is Like a Dance
      ['A2', 'reprise',      'duet',  2],   // Flying Away (Rep)
      ['A2', 'drive',        'group', 3],   // Finishing the Dresses
      ['A2', 'ballad',       'solo',  1],   // Itzel's Letter
      ['A2', 'finaleultimo', 'group', 4.5], // I Got It Wrong
    ] },
  boop: { // 2023 Chicago (2025 Bway) · two-act · David Foster & Susan Birkenhead / Bob Martin
    // Album 1814224639 (62 min). Overture omitted; "Where Is Betty? (Rep)"
    // not recorded. Act One ends on "Where I Wanna Be".
    form: 'two-act', year: 2023, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 5],   // A Little Versatility
      ['A1', 'iwant',        'solo',  3],   // Ordinary Day
      ['A1', 'production',   'group', 3.5], // In Color
      ['A1', 'drive',        'group', 1.5], // Get Her Back
      ['A1', 'charm',        'group', 3],   // I Speak Jazz
      ['A1', 'charm',        'solo',  3],   // Portrait of Betty
      ['A1', 'charm',        'group', 3],   // Sunlight
      ['A1', 'production',   'group', 3.5], // My New York
      ['A1', 'comedy',       'group', 4],   // A Cure for Love
      ['A1', 'finale',       'group', 3.5], // Where I Wanna Be
      ['A2', 'comedy',       'group', 2],   // Where Is Betty?
      ['A2', 'love',         'group', 3],   // She Knocks Me Out
      ['A2', 'charm',        'duet',  2.5], // My Hero
      ['A2', 'comedy',       'duet',  3.5], // Whatever It Takes
      ['A2', 'villain',      'solo',  3],   // Take It to the Next Level
      ['A2', 'production',   'group', 3],   // The Campaign
      ['A2', 'love',         'duet',  4],   // Why Look Around the Corner
      ['A2', 'eleven',       'solo',  3],   // Something to Shout About
      ['A2', 'finaleultimo', 'group', 3],   // The Color of Love
    ] },

  // ═══ REVIVED 2024–26, NEVER IN THE CORPUS ═══
  // Carded as ORIGINALLY written, from the original cast albums — the
  // corpus measures the form, and a revival's reorder would blur the date.
  ragtime: { // 1996 Toronto (1998 Bway) · two-act · Flaherty & Ahrens / Terrence McNally
    // OBC album 274487578 (2 discs = the two acts). Omitted: Entr'acte and the
    // orchestral "Fire in the City" / "Harlem Nightclub"; the "New Music (Rep)"
    // is not recorded; the Symphonic Suite bonus track excluded.
    form: 'two-act', year: 1996, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 9.5], // Prologue: Ragtime
      ['A1', 'ballad',       'solo',  2],   // Goodbye, My Love
      ['A1', 'iwant',        'group', 4],   // Journey On
      ['A1', 'comedy',       'group', 3],   // The Crime of the Century
      ['A1', 'soliloquy',    'solo',  2.5], // What Kind of Woman
      ['A1', 'establishing', 'group', 1.5], // A Shtetl Iz Amereke
      ['A1', 'iwant',        'group', 5.5], // Success
      ['A1', 'establishing', 'group', 2.5], // His Name Was Coalhouse Walker
      ['A1', 'diegetic',     'group', 1.5], // Gettin' Ready Rag
      ['A1', 'comedy',       'group', 1.5], // Henry Ford
      ['A1', 'charm',        'group', 2.5], // Nothing Like the City
      ['A1', 'ballad',       'solo',  3.5], // Your Daddy's Son
      ['A1', 'love',         'group', 3],   // The Courtship
      ['A1', 'production',   'group', 4],   // New Music
      ['A1', 'love',         'duet',  4],   // Wheels of a Dream
      ['A1', 'drive',        'group', 3.5], // The Night That Goldman Spoke at Union Square
      ['A1', 'ballad',       'solo',  4],   // Gliding
      ['A1', 'drive',        'group', 1],   // The Trashing of the Car
      ['A1', 'drive',        'group', 3],   // Justice
      ['A1', 'drive',        'solo',  1],   // President
      ['A1', 'finale',       'group', 4],   // Till We Reach That Day
      ['A2', 'drive',        'duet',  1],   // Harry Houdini, Master Escapist
      ['A2', 'soliloquy',    'solo',  1.5], // Coalhouse's Soliloquy
      ['A2', 'drive',        'group', 4],   // Coalhouse Demands
      ['A2', 'comedy',       'group', 3],   // What a Game
      ['A2', 'production',   'group', 5.5], // Atlantic City
      ['A2', 'charm',        'solo',  2.5], // Buffalo Nickel Photoplay, Inc.
      ['A2', 'love',         'duet',  3.5], // Our Children
      ['A2', 'love',         'duet',  3.5], // Sarah Brown Eyes
      ['A2', 'drive',        'group', 2.5], // He Wanted to Say
      ['A2', 'eleven',       'solo',  4],   // Back to Before
      ['A2', 'drive',        'group', 6],   // Look What You've Done
      ['A2', 'anthem',       'solo',  2],   // Make Them Hear You
      ['A2', 'finaleultimo', 'group', 4],   // Epilogue: Ragtime / Wheels of a Dream
    ] },
  floydcollins: { // 1996 Playwrights Horizons (1994 Philadelphia tryout; 2025 Bway) · two-act · Adam Guettel / Tina Landau
    // Original Cast album 63491671 (68 min), which does not mark the interval;
    // Act One ends on "The Riddle Song" per the published list. Not recorded:
    // the Act 1 "Ballad" reprise and "And She'd Have Blue Eyes". "The Call"
    // and "The Riddle Song" run long by design (the cave echoes); kept whole.
    form: 'two-act', year: 1996, region: 'bway',
    songs: [
      ['A1', 'opening',      'group', 1.5], // The Ballad of Floyd Collins
      ['A1', 'iwant',        'solo',  7.5], // The Call
      ['A1', 'soliloquy',    'solo',  3],   // It Moves
      ['A1', 'drive',        'solo',  1.5], // Time to Go
      ['A1', 'iwant',        'duet',  3.5], // Lucky
      ['A1', 'establishing', 'group', 3.5], // 'Tween a Rock an' a Hard Place
      ['A1', 'charm',        'duet',  3.5], // Daybreak
      ['A1', 'comedy',       'solo',  1],   // I Landed on Him
      ['A1', 'love',         'duet',  3],   // Heart an' Hand
      ['A1', 'finale',       'duet',  8.5], // The Riddle Song
      ['A2', 'comedy',       'group', 4.5], // Is That Remarkable?
      ['A2', 'production',   'group', 5],   // The Carnival
      ['A2', 'ballad',       'solo',  4],   // Through the Mountain
      ['A2', 'ballad',       'solo',  2.5], // Git Comfortable
      ['A2', 'reprise',      'solo',  3.5], // The Ballad of Floyd Collins (Rep)
      ['A2', 'eleven',       'group', 7],   // The Dream
      ['A2', 'finaleultimo', 'solo',  5.5], // How Glory Goes
    ] },
  sunsetboulevard: { // 1993 London (1994 Bway) · two-act · Lloyd Webber / Black & Hampton
    // OLC album 1843485485 (2 discs = the two acts). Near sung-through, so the
    // album's recitative tracks (Sheldrake's Office, On the Road, the dialogue
    // and Artie's-apartment links, the second House on Sunset reprise) are
    // left out and the carded list follows the published numbers. Act One
    // ends on the third House on Sunset reprise — Joe back at Norma's side
    // after her suicide attempt. The title-song reprise is Joe's break with
    // Norma, tagged eleven.
    form: 'two-act', year: 1993, region: 'westend',
    songs: [
      ['A1', 'opening',      'solo',  3],   // The House on Sunset (Prologue)
      ['A1', 'establishing', 'group', 3.5], // Let's Have Lunch
      ['A1', 'charm',        'solo',  2.5], // Surrender
      ['A1', 'iwant',        'solo',  4],   // With One Look
      ['A1', 'charm',        'duet',  4.5], // Salome
      ['A1', 'ballad',       'solo',  3.5], // The Greatest Star of All
      ['A1', 'love',         'duet',  3.5], // Girl Meets Boy
      ['A1', 'reprise',      'solo',  1],   // The House on Sunset (Rep)
      ['A1', 'love',         'duet',  4.5], // New Ways to Dream
      ['A1', 'comedy',       'group', 4.5], // The Lady's Paying
      ['A1', 'love',         'duet',  3],   // The Perfect Year
      ['A1', 'production',   'group', 5.5], // This Time Next Year
      ['A1', 'finale',       'solo',  1.5], // The House on Sunset (Rep 3)
      ['A2', 'soliloquy',    'solo',  6],   // Sunset Boulevard
      ['A2', 'reprise',      'duet',  1.5], // The Perfect Year (Rep)
      ['A2', 'drive',        'group', 3.5], // Journey to Paramount
      ['A2', 'ballad',       'solo',  7],   // As If We Never Said Goodbye
      ['A2', 'reprise',      'solo',  1],   // Surrender (Rep)
      ['A2', 'reprise',      'duet',  2],   // Girl Meets Boy (Rep)
      ['A2', 'comedy',       'group', 3.5], // Eternal Youth Is Worth a Little Suffering
      ['A2', 'love',         'duet',  5.5], // Too Much in Love to Care
      ['A2', 'reprise',      'solo',  4],   // New Ways to Dream (Rep)
      ['A2', 'eleven',       'solo',  6],   // Sunset Boulevard (Rep)
      ['A2', 'finaleultimo', 'group', 4],   // The Final Scene
    ] },
  cats: { // 1981 London (1982 Bway; 2026 Bway "The Jellicle Ball") · two-act · Lloyd Webber / T. S. Eliot
    // OLC album 1843487732 (2 discs = the two acts). Overture omitted; "The
    // Awefull Battle of the Pekes and the Pollicles" is not on this album; the
    // "Memory (Radio Edit)" bonus excluded. A revue-shaped book: the catalogue
    // of cats is the structure, so charm and production carry Act One.
    // Act One ends on Grizabella's first, fragmentary "Memory".
    form: 'two-act', year: 1981, region: 'westend',
    songs: [
      ['A1', 'opening',      'group', 5.5], // Prologue: Jellicle Songs for Jellicle Cats
      ['A1', 'establishing', 'group', 2.5], // The Naming of Cats
      ['A1', 'establishing', 'group', 2],   // The Invitation to the Jellicle Ball
      ['A1', 'charm',        'group', 5.5], // The Old Gumbie Cat
      ['A1', 'charm',        'group', 3],   // The Rum Tum Tugger
      ['A1', 'ballad',       'group', 2.5], // Grizabella: The Glamour Cat
      ['A1', 'comedy',       'group', 4.5], // Bustopher Jones
      ['A1', 'comedy',       'duet',  4],   // Mungojerrie and Rumpelteazer
      ['A1', 'ballad',       'group', 5],   // Old Deuteronomy
      ['A1', 'production',   'group', 7],   // The Jellicle Ball
      ['A1', 'reprise',      'duet',  3],   // Grizabella: The Glamour Cat (Rep)
      ['A1', 'finale',       'solo',  1.5], // Memory (End of Act One)
      ['A2', 'ballad',       'group', 3],   // The Moments of Happiness
      ['A2', 'ballad',       'duet',  6.5], // Gus: The Theatre Cat
      ['A2', 'production',   'group', 9.5], // Growltiger's Last Stand
      ['A2', 'charm',        'group', 5],   // Skimbleshanks: The Railway Cat
      ['A2', 'villain',      'group', 7],   // Macavity: The Mystery Cat
      ['A2', 'production',   'group', 3.5], // Mr. Mistoffelees
      ['A2', 'eleven',       'solo',  5.5], // Memory
      ['A2', 'drive',        'group', 2],   // The Journey to the Heaviside Layer
      ['A2', 'finaleultimo', 'group', 5.5], // The Ad-Dressing of Cats
    ] },
};
