// Data-only corpus, batch 6: modern musical comedies + one Hamlisch noir.
// Same tuple shape: [half, fn, voice, estMin].
export const BATCH6 = {
  shrek: { form: 'two-act', year: 2008, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Big Bright Beautiful World
      ['A1', 'production','group', 3.5], // Story of My Life
      ['A1', 'charm',     'solo',  3],   // Don't Let Me Go
      ['A1', 'villain',   'group', 4],   // What's Up, Duloc?
      ['A1', 'iwant',     'solo',  4],   // I Know It's Today
      ['A1', 'comedy',    'duet',  3],   // Travel Song
      ['A1', 'production','group', 3],   // Forever
      ['A1', 'production','group', 3.5], // This Is How a Dream Comes True
      ['A1', 'finale',    'group', 4],   // Who I'd Be
      ['A2', 'comedy',    'group', 3],   // Morning Person
      ['A2', 'comedy',    'duet',  4],   // I Think I Got You Beat
      ['A2', 'villain',   'group', 3],   // The Ballad of Farquaad
      ['A2', 'charm',     'group', 3],   // Make a Move
      ['A2', 'ballad',    'solo',  3],   // When Words Fail
      ['A2', 'reprise',   'group', 1.5], // Morning Person (Rep)
      ['A2', 'drive',     'solo',  3],   // Build a Wall
      ['A2', 'anthem',    'group', 3.5], // Freak Flag (the resolve anthem)
      ['A2', 'reprise',   'solo',  2],   // Big Bright Beautiful World (Rep)
      ['A2', 'finaleultimo','group',3.5],// This Is Our Story
    ] },
  somethingrotten: { form: 'two-act', year: 2015, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 5],   // Welcome to the Renaissance
      ['A1', 'comedy',    'duet',  3.5], // God, I Hate Shakespeare
      ['A1', 'charm',     'solo',  3],   // Right Hand Man
      ['A1', 'reprise',   'solo',  1],   // God, I Hate Shakespeare (Rep)
      ['A1', 'production','group', 6.5], // A Musical (~30%)
      ['A1', 'diegetic',  'group', 2.5], // The Black Death
      ['A1', 'love',      'duet',  3],   // I Love the Way
      ['A1', 'villain',   'group', 4],   // Will Power (Shakespeare the rock star)
      ['A1', 'finale',    'group', 4.5], // Bottom's Gonna Be on Top
      ['A2', 'comedy',    'solo',  4],   // Hard to Be the Bard
      ['A2', 'comedy',    'group', 3],   // It's Eggs!
      ['A2', 'production','group', 4],   // We See the Light
      ['A2', 'eleven',    'duet',  4],   // To Thine Own Self (brothers)
      ['A2', 'reprise',   'solo',  1.5], // Right Hand Man (Rep)
      ['A2', 'finaleultimo','group',3],  // Finale: Welcome to America
    ] },
  shucked: { form: 'two-act', year: 2023, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Corn
      ['A1', 'iwant',     'solo',  3.5], // Walls
      ['A1', 'production','group', 2.5], // Travelin' Song
      ['A1', 'villain',   'group', 3],   // Bad (Gordy the con man)
      ['A1', 'charm',     'group', 3.5], // Woman of the World
      ['A1', 'ballad',    'solo',  3.5], // Somebody Will
      ['A1', 'comedy',    'solo',  4],   // Independently Owned
      ['A1', 'comedy',    'group', 2.5], // Holy Shit
      ['A1', 'love',      'solo',  3],   // Maybe Love (not-yet-secured solo)
      ['A1', 'finale',    'group', 2],   // Corn (Rep)
      ['A2', 'comedy',    'group', 2.5], // We Love Jesus
      ['A2', 'ballad',    'solo',  3],   // OK
      ['A2', 'comedy',    'group', 3],   // I Do
      ['A2', 'charm',     'duet',  3.5], // Friends (~80% — the heart duet)
      ['A2', 'production','group', 3.5], // Best Man Wins
      ['A2', 'finaleultimo','group',2.5],// Maybe Love (Rep)
    ] },
  beetlejuice: { form: 'two-act', year: 2019, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3],   // Prologue: Invisible
      ['A1', 'production','group', 5],   // The Whole "Being Dead" Thing
      ['A1', 'comedy',    'duet',  3],   // Ready, Set, Not Yet
      ['A1', 'reprise',   'group', 1.5], // TWBDT Pt. 2
      ['A1', 'reprise',   'solo',  1],   // TWBDT Pt. 3
      ['A1', 'iwant',     'solo',  3.5], // Dead Mom
      ['A1', 'comedy',    'group', 3.5], // Fright of Their Lives
      ['A1', 'reprise',   'duet',  1],   // Ready, Set (Rep)
      ['A1', 'comedy',    'duet',  3],   // No Reason
      ['A1', 'reprise',   'solo',  2],   // Invisible (Rep) / On the Roof
      ['A1', 'drive',     'group', 4],   // Say My Name
      ['A1', 'finale',    'group', 3],   // Day-O (the dinner party)
      ['A2', 'comedy',    'solo',  2],   // Girl Scout
      ['A2', 'production','group', 4],   // That Beautiful Sound
      ['A2', 'reprise',   'group', 1.5], // TBS (Rep)
      ['A2', 'drive',     'duet',  3],   // Barbara 2.0
      ['A2', 'reprise',   'solo',  1],   // TWBDT Pt. 4
      ['A2', 'villain',   'solo',  2.5], // Good Old Fashioned Wedding
      ['A2', 'production','group', 3.5], // What I Know Now
      ['A2', 'eleven',    'solo',  3.5], // Home
      ['A2', 'comedy',    'group', 3.5], // Creepy Old Guy
      ['A2', 'finaleultimo','group',4],  // Jump in the Line + reprises
    ] },
  spamalot: { // 2005 · Best Musical winner · Python parody
    form: 'two-act', year: 2005, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3],   // Finland / Fisch Schlapping Song
      ['A1', 'comedy',    'group', 3],   // He Is Not Dead Yet
      ['A1', 'charm',     'group', 2.5], // Come With Me
      ['A1', 'love',      'duet',  3],   // The Song That Goes Like This (parody duet)
      ['A1', 'charm',     'group', 2],   // All for One
      ['A1', 'production','group', 3.5], // Knights of the Round Table
      ['A1', 'reprise',   'solo',  1],   // The Song That Goes Like This (Rep)
      ['A1', 'anthem',    'group', 4],   // Find Your Grail (anthem parody)
      ['A1', 'finale',    'group', 3],   // Run Away!
      ['A2', 'comedy',    'group', 3.5], // Always Look on the Bright Side (opens A2)
      ['A2', 'comedy',    'group', 2],   // Brave Sir Robin
      ['A2', 'production','group', 4.5], // You Won't Succeed on Broadway
      ['A2', 'comedy',    'solo',  2.5], // The Diva's Lament (~75% — Dark-Night parody)
      ['A2', 'comedy',    'group', 3],   // His Name Is Lancelot
      ['A2', 'eleven',    'group', 3],   // I'm All Alone (the mock-eleven)
      ['A2', 'reprise',   'duet',  2],   // Twice in Every Show
      ['A2', 'finaleultimo','group',3],  // Finale (Grail / Bright Side Rep)
    ] },
  drowsychaperone: { // 2006 · one-act pastiche; Man in Chair narrates, never sings
    form: 'one-act-100', year: 2006, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3],   // Fancy Dress
      ['A1', 'comedy',    'duet',  3],   // Cold Feets
      ['A1', 'iwant',     'group', 4.5], // Show Off (the INVERTED I Want)
      ['A1', 'anthem',    'solo',  3.5], // As We Stumble Along (anthem parody)
      ['A1', 'comedy',    'duet',  3],   // I Am Aldolpho
      ['A1', 'love',      'duet',  3],   // Accident Waiting to Happen
      ['A2', 'production','group', 4],   // Toledo Surprise
      ['A2', 'diegetic',  'group', 2.5], // Message from a Nightingale (wrong record)
      ['A2', 'ballad',    'group', 3.5], // Bride's Lament (~74% — lament zone)
      ['A2', 'charm',     'duet',  2.5], // Love Is Always Lovely in the End
      ['A2', 'eleven',    'group', 3],   // I Do, I Do in the Sky
      ['A2', 'finaleultimo','group',2],  // As We Stumble Along (Rep)
    ] },
  sweetsmell: { // 2002 · Hamlisch/Carnelia · Broadway noir
    form: 'two-act', year: 2002, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 5],   // The Column
      ['A1', 'iwant',     'solo',  3],   // I Could Get You in J.J.
      ['A1', 'ballad',    'solo',  3.5], // I Cannot Hear the City
      ['A1', 'villain',   'group', 4],   // Welcome to the Night
      ['A1', 'diegetic',  'solo',  2.5], // Laughin' All the Way to the Bank
      ['A1', 'soliloquy', 'solo',  4],   // At the Fountain (the Faustian resolve)
      ['A1', 'villain',   'duet',  2.5], // Psalm 151
      ['A1', 'love',      'duet',  3],   // Don't Know Where You Leave Off
      ['A1', 'ballad',    'solo',  3],   // What If
      ['A1', 'villain',   'solo',  3],   // For Susan
      ['A1', 'diegetic',  'solo',  3],   // One Track Mind
      ['A1', 'finale',    'group', 2.5], // Act I Finale
      ['A2', 'production','group', 3.5], // Break It Up
      ['A2', 'charm',     'solo',  3],   // Rita's Tune
      ['A2', 'production','group', 4],   // Dirt
      ['A2', 'reprise',   'solo',  1.5], // I Could Get You in J.J. (Rep)
      ['A2', 'reprise',   'duet',  2],   // I Cannot Hear the City (Rep)
      ['A2', 'villain',   'solo',  3.5], // Don't Look Now
      ['A2', 'eleven',    'solo',  3.5], // At the Fountain (Rep — the damnation)
      ['A2', 'finaleultimo','group',2.5],// Act II Finale
    ] },
};
