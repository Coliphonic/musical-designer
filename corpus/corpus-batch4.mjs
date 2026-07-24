// Data-only corpus, batch 4 — the definitive round:
// Golden Age foundations · West End tradition · continental Europe · one-acts.
// Same tuple shape: [half, fn, voice, estMin]. region: bway | westend | europe.
export const BATCH4 = {
  // ═══ GOLDEN AGE FOUNDATIONS ═══
  oklahoma: { form: 'two-act', year: 1943, region: 'bway',
    songs: [
      ['A1', 'opening',   'solo',  3],   // Oh, What a Beautiful Mornin' (solo opening)
      ['A1', 'charm',     'duet',  4],   // The Surrey with the Fringe on Top
      ['A1', 'comedy',    'group', 3],   // Kansas City
      ['A1', 'comedy',    'solo',  3],   // I Cain't Say No
      ['A1', 'charm',     'group', 3],   // Many a New Day
      ['A1', 'comedy',    'group', 2.5], // It's a Scandal! It's a Outrage!
      ['A1', 'love',      'duet',  4],   // People Will Say We're in Love
      ['A1', 'comedy',    'duet',  3.5], // Pore Jud Is Daid
      ['A1', 'soliloquy', 'solo',  3],   // Lonely Room (villain soliloquy, A1)
      ['A1', 'ballad',    'group', 3],   // Out of My Dreams
      ['A1', 'finale',    'group', 6],   // Dream Ballet
      ['A2', 'production','group', 4],   // The Farmer and the Cowman
      ['A2', 'comedy',    'duet',  3],   // All Er Nuthin'
      ['A2', 'reprise',   'duet',  2],   // People Will Say (Rep)
      ['A2', 'anthem',    'group', 3.5], // Oklahoma
      ['A2', 'finaleultimo','group',2],  // Finale Ultimo
    ] },
  carousel: { form: 'two-act', year: 1945, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // The Carousel Waltz
      ['A1', 'charm',     'duet',  2.5], // You're a Queer One, Julie Jordan
      ['A1', 'charm',     'solo',  3.5], // Mister Snow
      ['A1', 'love',      'duet',  5],   // If I Loved You
      ['A1', 'production','group', 4.5], // June Is Bustin' Out All Over
      ['A1', 'love',      'duet',  3.5], // When the Children Are Asleep
      ['A1', 'comedy',    'group', 3],   // Blow High, Blow Low
      ['A1', 'soliloquy', 'solo',  7.5], // Soliloquy — IS the Act 1 finale
      ['A2', 'production','group', 4],   // A Real Nice Clambake
      ['A2', 'comedy',    'solo',  2],   // Geraniums in the Winder
      ['A2', 'ballad',    'solo',  3],   // What's the Use of Wond'rin'
      ['A2', 'anthem',    'solo',  3],   // You'll Never Walk Alone
      ['A2', 'drive',     'solo',  2.5], // The Highest Judge of All
      ['A2', 'production','group', 5],   // Ballet
      ['A2', 'finaleultimo','group',2.5],// You'll Never Walk Alone (Rep)
    ] },
  guysanddolls: { form: 'two-act', year: 1950, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Runyonland / Fugue for Tinhorns
      ['A1', 'diegetic',  'group', 2],   // Follow the Fold
      ['A1', 'production','group', 3],   // The Oldest Established
      ['A1', 'love',      'duet',  3.5], // I'll Know
      ['A1', 'diegetic',  'group', 3],   // A Bushel and a Peck
      ['A1', 'comedy',    'solo',  3.5], // Adelaide's Lament
      ['A1', 'comedy',    'duet',  3],   // Guys and Dolls
      ['A1', 'charm',     'solo',  3],   // If I Were a Bell
      ['A1', 'ballad',    'solo',  2],   // My Time of Day
      ['A1', 'finale',    'duet',  3.5], // I've Never Been in Love Before
      ['A2', 'diegetic',  'group', 3],   // Take Back Your Mink
      ['A2', 'reprise',   'solo',  1.5], // Adelaide's Lament (Rep)
      ['A2', 'ballad',    'solo',  3],   // More I Cannot Wish You
      ['A2', 'production','group', 4],   // Luck Be a Lady
      ['A2', 'comedy',    'duet',  3],   // Sue Me
      ['A2', 'eleven',    'group', 4],   // Sit Down, You're Rockin' the Boat
      ['A2', 'comedy',    'duet',  3],   // Marry the Man Today
      ['A2', 'finaleultimo','group',2],  // Guys and Dolls (Rep)
    ] },
  westsidestory: { form: 'two-act', year: 1957, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4.5], // Prologue
      ['A1', 'production','group', 3],   // Jet Song
      ['A1', 'iwant',     'solo',  2.5], // Something's Coming
      ['A1', 'production','group', 4],   // The Dance at the Gym
      ['A1', 'love',      'solo',  2.5], // Maria (yearning solo)
      ['A1', 'love',      'duet',  4],   // Tonight
      ['A1', 'comedy',    'group', 4.5], // America
      ['A1', 'drive',     'group', 4],   // Cool
      ['A1', 'love',      'duet',  3],   // One Hand, One Heart
      ['A1', 'finale',    'group', 6.5], // Tonight (Quintet) / The Rumble
      ['A2', 'comedy',    'group', 3.5], // I Feel Pretty
      ['A2', 'ballad',    'group', 4.5], // Somewhere
      ['A2', 'comedy',    'group', 4],   // Gee, Officer Krupke (late comedy!)
      ['A2', 'eleven',    'duet',  4.5], // A Boy Like That / I Have a Love
      ['A2', 'finaleultimo','group',2.5],// Finale
    ] },
  musicman: { form: 'two-act', year: 1957, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 2.5], // Rock Island
      ['A1', 'establishing','group',2.5],// Iowa Stubborn
      ['A1', 'production','group', 4],   // Ya Got Trouble
      ['A1', 'iwant',     'solo',  2.5], // Goodnight, My Someone
      ['A1', 'production','group', 4.5], // Seventy-Six Trombones
      ['A1', 'charm',     'group', 2],   // Sincere
      ['A1', 'comedy',    'solo',  2.5], // The Sadder but Wiser Girl
      ['A1', 'comedy',    'group', 3],   // Pickalittle / Goodnight Ladies
      ['A1', 'production','group', 4],   // Marian the Librarian
      ['A1', 'iwant',     'solo',  3],   // My White Knight (dual I Want)
      ['A1', 'finale',    'group', 3],   // The Wells Fargo Wagon
      ['A2', 'charm',     'group', 2],   // It's You
      ['A2', 'production','group', 4],   // Shipoopi
      ['A2', 'charm',     'group', 4],   // Lida Rose / Will I Ever Tell You
      ['A2', 'charm',     'solo',  2],   // Gary, Indiana
      ['A2', 'love',      'duet',  3.5], // Till There Was You (~85%!)
      ['A2', 'finaleultimo','group',2.5],// Seventy-Six Trombones (Rep)
    ] },
  southpacific: { form: 'two-act', year: 1949, region: 'bway',
    songs: [
      ['A1', 'opening',   'duet',  1.5], // Dites-Moi
      ['A1', 'charm',     'solo',  2.5], // A Cockeyed Optimist
      ['A1', 'love',      'duet',  2],   // Twin Soliloquies
      ['A1', 'love',      'solo',  4],   // Some Enchanted Evening (courtship solo)
      ['A1', 'charm',     'group', 2],   // Bloody Mary
      ['A1', 'comedy',    'group', 4],   // There Is Nothin' Like a Dame
      ['A1', 'charm',     'solo',  3.5], // Bali Ha'i
      ['A1', 'comedy',    'group', 3.5], // I'm Gonna Wash That Man…
      ['A1', 'charm',     'group', 3.5], // A Wonderful Guy
      ['A1', 'love',      'solo',  3],   // Younger Than Springtime
      ['A1', 'finale',    'solo',  2.5], // Finale Act 1 (Some Enchanted Rep — solo)
      ['A2', 'charm',     'solo',  3],   // Happy Talk
      ['A2', 'diegetic',  'group', 3],   // Honey Bun
      ['A2', 'drive',     'solo',  2],   // You've Got to Be Carefully Taught
      ['A2', 'eleven',    'solo',  4],   // This Nearly Was Mine
      ['A2', 'finaleultimo','group',1.5],// Finale (Dites-Moi Rep — bookend)
    ] },
  // ═══ WEST END TRADITION ═══
  evita: { form: 'two-act', year: 1978, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 6],   // Requiem / Oh What a Circus
      ['A1', 'diegetic',  'solo',  2.5], // On This Night of a Thousand Stars
      ['A1', 'iwant',     'solo',  4],   // Buenos Aires
      ['A1', 'comedy',    'group', 3.5], // Goodnight and Thank You
      ['A1', 'drive',     'group', 3],   // The Art of the Possible
      ['A1', 'love',      'duet',  3.5], // I'd Be Surprisingly Good for You
      ['A1', 'ballad',    'solo',  3.5], // Another Suitcase in Another Hall
      ['A1', 'comedy',    'group', 3.5], // Peron's Latest Flame
      ['A1', 'finale',    'group', 4.5], // A New Argentina
      ['A2', 'anthem',    'solo',  5.5], // Don't Cry for Me Argentina (opens A2)
      ['A2', 'charm',     'duet',  3.5], // High Flying, Adored
      ['A2', 'production','group', 2.5], // Rainbow High
      ['A2', 'comedy',    'group', 4],   // Rainbow Tour
      ['A2', 'production','group', 4],   // And the Money Kept Rolling In
      ['A2', 'diegetic',  'group', 2],   // Santa Evita
      ['A2', 'drive',     'duet',  4],   // Waltz for Eva and Che
      ['A2', 'ballad',    'solo',  2],   // She Is a Diamond
      ['A2', 'reprise',   'solo',  2.5], // Eva's Final Broadcast
      ['A2', 'finaleultimo','solo',4],   // Lament (SOLO finale ultimo)
    ] },
  jcsuperstar: { form: 'two-act', year: 1971, region: 'westend',
    songs: [
      ['A1', 'soliloquy', 'solo',  4.5], // Heaven on Their Minds (at 4%!)
      ['A1', 'production','group', 2.5], // What's the Buzz
      ['A1', 'charm',     'group', 3.5], // Everything's Alright
      ['A1', 'villain',   'group', 3.5], // This Jesus Must Die
      ['A1', 'production','group', 2],   // Hosanna
      ['A1', 'anthem',    'group', 2.5], // Simon Zealotes
      ['A1', 'ballad',    'solo',  2],   // Poor Jerusalem
      ['A1', 'soliloquy', 'solo',  1.5], // Pilate's Dream
      ['A1', 'production','group', 4.5], // The Temple
      ['A1', 'love',      'solo',  3.5], // I Don't Know How to Love Him (unrequited)
      ['A1', 'finale',    'group', 4],   // Damned for All Time / Blood Money
      ['A2', 'production','group', 7],   // The Last Supper
      ['A2', 'soliloquy', 'solo',  5.5], // Gethsemane
      ['A2', 'comedy',    'solo',  3],   // King Herod's Song
      ['A2', 'ballad',    'duet',  2.5], // Could We Start Again, Please?
      ['A2', 'soliloquy', 'solo',  4],   // Judas's Death
      ['A2', 'production','group', 5.5], // Trial Before Pilate
      ['A2', 'eleven',    'group', 4],   // Superstar
      ['A2', 'finaleultimo','group',4],  // The Crucifixion / John 19:41
    ] },
  misssaigon: { form: 'two-act', year: 1989, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 5],   // The Heat Is On in Saigon
      ['A1', 'iwant',     'solo',  3.5], // The Movie in My Mind
      ['A1', 'love',      'duet',  3],   // Sun and Moon
      ['A1', 'drive',     'group', 2.5], // The Deal
      ['A1', 'love',      'duet',  4.5], // The Last Night of the World
      ['A1', 'production','group', 4],   // The Morning of the Dragon
      ['A1', 'ballad',    'duet',  4.5], // I Still Believe
      ['A1', 'drive',     'group', 2.5], // You Will Not Touch Him
      ['A1', 'comedy',    'solo',  3],   // If You Want to Die in Bed
      ['A1', 'finale',    'solo',  4.5], // I'd Give My Life for You (solo finale)
      ['A2', 'anthem',    'group', 3.5], // Bui Doi (opens A2)
      ['A2', 'production','group', 3.5], // What a Waste
      ['A2', 'ballad',    'duet',  3],   // Please
      ['A2', 'drive',     'group', 6],   // Kim's Nightmare / Fall of Saigon
      ['A2', 'ballad',    'solo',  3],   // Now That I've Seen Her
      ['A2', 'drive',     'group', 3],   // The Confrontation
      ['A2', 'eleven',    'group', 5],   // The American Dream
      ['A2', 'finaleultimo','duet',3],   // Little God of My Heart / Finale
    ] },
  bloodbrothers: { form: 'two-act', year: 1983, region: 'westend',
    songs: [
      ['A1', 'opening',   'solo',  4],   // Marilyn Monroe (solo opening)
      ['A1', 'ballad',    'duet',  3],   // My Child
      ['A1', 'ballad',    'solo',  3],   // Easy Terms
      ['A1', 'motif',     'solo',  2.5], // Shoes Upon the Table (fate motif)
      ['A1', 'comedy',    'group', 4],   // Kids' Game
      ['A1', 'charm',     'duet',  3],   // Long Sunday Afternoon / My Friend
      ['A1', 'finale',    'group', 4],   // Bright New Day
      ['A2', 'reprise',   'solo',  2],   // Marilyn Monroe 2
      ['A2', 'comedy',    'duet',  2.5], // That Guy
      ['A2', 'reprise',   'solo',  2],   // Shoes Upon the Table (Rep)
      ['A2', 'love',      'solo',  3.5], // I'm Not Saying a Word (unrequited)
      ['A2', 'drive',     'group', 3],   // Take a Letter, Miss Jones
      ['A2', 'ballad',    'solo',  3],   // Light Romance / Marilyn Monroe 3
      ['A2', 'drive',     'solo',  2.5], // Madman
      ['A2', 'finaleultimo','group',4],  // Tell Me It's Not True
    ] },
  matilda: { form: 'two-act', year: 2011, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 5],   // Miracle
      ['A1', 'iwant',     'solo',  3],   // Naughty
      ['A1', 'production','group', 3.5], // School Song
      ['A1', 'comedy',    'solo',  2.5], // Pathetic
      ['A1', 'villain',   'solo',  3],   // The Hammer
      ['A1', 'finale',    'group', 4],   // Bruce
      ['A2', 'comedy',    'solo',  2.5], // Telly
      ['A2', 'charm',     'group', 4.5], // When I Grow Up
      ['A2', 'comedy',    'group', 3],   // Loud
      ['A2', 'villain',   'group', 4],   // The Smell of Rebellion
      ['A2', 'soliloquy', 'solo',  3.5], // Quiet
      ['A2', 'ballad',    'solo',  3],   // My House
      ['A2', 'eleven',    'group', 3],   // Revolting Children (group eleven)
      ['A2', 'finaleultimo','group',2],  // When I Grow Up (Rep)
    ] },
  billyelliot: { form: 'two-act', year: 2005, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 5],   // The Stars Look Down
      ['A1', 'comedy',    'group', 4],   // Shine
      ['A1', 'ballad',    'solo',  3.5], // Grandma's Song
      ['A1', 'production','group', 5],   // Solidarity
      ['A1', 'comedy',    'duet',  4],   // Expressing Yourself
      ['A1', 'ballad',    'duet',  3],   // The Letter
      ['A1', 'charm',     'group', 3],   // Born to Boogie
      ['A1', 'finale',    'group', 3.5], // Angry Dance
      ['A2', 'comedy',    'group', 4],   // Merry Christmas, Maggie Thatcher
      ['A2', 'ballad',    'solo',  3],   // Deep Into the Ground
      ['A2', 'drive',     'duet',  3.5], // He Could Be a Star
      ['A2', 'eleven',    'solo',  4.5], // Electricity
      ['A2', 'ballad',    'group', 3.5], // Once We Were Kings
      ['A2', 'reprise',   'solo',  2],   // The Letter (Rep)
      ['A2', 'finaleultimo','group',3],  // Finale
    ] },
  six: { form: 'one-act-80', year: 2017, region: 'westend',
    songs: [
      ['A1', 'opening',   'group', 3.5], // Ex-Wives
      ['A1', 'comedy',    'solo',  3],   // No Way
      ['A1', 'comedy',    'solo',  3],   // Don't Lose Ur Head
      ['A1', 'ballad',    'solo',  4],   // Heart of Stone
      ['A2', 'comedy',    'group', 2.5], // Haus of Holbein
      ['A2', 'production','group', 3.5], // Get Down
      ['A2', 'comedy',    'solo',  4],   // All You Wanna Do
      ['A2', 'eleven',    'solo',  4],   // I Don't Need Your Love
      ['A2', 'finaleultimo','group',3.5],// Six
    ] },
  mammamia: { form: 'two-act', year: 1999, region: 'westend',
    songs: [
      ['A1', 'iwant',     'solo',  3.5], // I Have a Dream / Honey Honey (cold-open)
      ['A1', 'iwant',     'group', 3],   // Money, Money, Money (dual I Want)
      ['A1', 'charm',     'group', 3],   // Thank You for the Music
      ['A1', 'production','group', 3.5], // Mamma Mia
      ['A1', 'ballad',    'duet',  3.5], // Chiquitita
      ['A1', 'production','group', 4],   // Dancing Queen
      ['A1', 'love',      'duet',  4],   // Lay All Your Love on Me
      ['A1', 'diegetic',  'group', 3.5], // Super Trouper
      ['A1', 'production','group', 3.5], // Gimme! Gimme! Gimme!
      ['A1', 'ballad',    'solo',  3.5], // The Name of the Game
      ['A1', 'finale',    'group', 4.5], // Voulez-Vous
      ['A2', 'production','group', 3],   // Under Attack
      ['A2', 'ballad',    'solo',  3],   // One of Us
      ['A2', 'love',      'duet',  3],   // SOS
      ['A2', 'comedy',    'group', 3],   // Does Your Mother Know
      ['A2', 'drive',     'solo',  3],   // Knowing Me, Knowing You
      ['A2', 'charm',     'duet',  3],   // Our Last Summer
      ['A2', 'ballad',    'duet',  3.5], // Slipping Through My Fingers
      ['A2', 'eleven',    'solo',  5],   // The Winner Takes It All
      ['A2', 'comedy',    'duet',  3.5], // Take a Chance on Me
      ['A2', 'finaleultimo','group',3.5],// I Do ×3 / I Have a Dream (Rep — bookend)
    ] },
  // ═══ SONDHEIM / ONE-ACT COMPLETION ═══
  intothewoods: { form: 'two-act', year: 1987, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 12],  // Prologue: Into the Woods
      ['A1', 'villain',   'duet',  2.5], // Hello, Little Girl
      ['A1', 'charm',     'solo',  2.5], // I Know Things Now
      ['A1', 'charm',     'solo',  3],   // Giants in the Sky
      ['A1', 'comedy',    'duet',  3],   // Agony
      ['A1', 'ballad',    'solo',  2.5], // Stay with Me
      ['A1', 'love',      'duet',  3],   // It Takes Two
      ['A1', 'soliloquy', 'solo',  3],   // On the Steps of the Palace
      ['A1', 'finale',    'group', 4],   // Ever After — the FAKE finale ultimo
      ['A2', 'reprise',   'group', 3],   // So Happy
      ['A2', 'reprise',   'duet',  2.5], // Agony (Rep)
      ['A2', 'love',      'duet',  2.5], // Any Moment
      ['A2', 'soliloquy', 'solo',  3],   // Moments in the Woods
      ['A2', 'drive',     'group', 2.5], // Your Fault
      ['A2', 'villain',   'solo',  4],   // Last Midnight
      ['A2', 'ballad',    'duet',  3.5], // No More
      ['A2', 'eleven',    'group', 5],   // No One Is Alone (group eleven)
      ['A2', 'finaleultimo','group',4],  // Finale: Children Will Listen
    ] },
  nightmusic: { form: 'two-act', year: 1973, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Overture / Night Waltz
      ['A1', 'charm',     'group', 6],   // Now / Later / Soon
      ['A1', 'comedy',    'group', 3.5], // The Glamorous Life
      ['A1', 'charm',     'group', 3],   // Remember?
      ['A1', 'comedy',    'duet',  3.5], // You Must Meet My Wife
      ['A1', 'charm',     'solo',  4],   // Liaisons
      ['A1', 'comedy',    'solo',  3],   // In Praise of Women
      ['A1', 'ballad',    'duet',  3.5], // Every Day a Little Death
      ['A1', 'finale',    'group', 6.5], // A Weekend in the Country
      ['A2', 'charm',     'group', 3],   // The Sun Won't Set
      ['A2', 'comedy',    'duet',  3.5], // It Would Have Been Wonderful
      ['A2', 'motif',     'group', 2.5], // Perpetual Anticipation
      ['A2', 'eleven',    'solo',  4],   // Send in the Clowns
      ['A2', 'comedy',    'solo',  4],   // The Miller's Son
      ['A2', 'finaleultimo','group',3],  // Finale (Clowns Rep)
    ] },
  manoflamancha: { form: 'one-act-115', year: 1965, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 3.5], // Man of La Mancha (I, Don Quixote)
      ['A1', 'charm',     'solo',  3],   // It's All the Same
      ['A1', 'love',      'solo',  3],   // Dulcinea (yearning solo)
      ['A1', 'comedy',    'group', 3],   // I'm Only Thinking of Him
      ['A1', 'charm',     'solo',  2.5], // I Really Like Him
      ['A1', 'ballad',    'solo',  2.5], // What Does He Want of Me?
      ['A1', 'diegetic',  'group', 2.5], // Little Bird, Little Bird
      ['A1', 'comedy',    'group', 3],   // Golden Helmet of Mambrino
      ['A2', 'ballad',    'solo',  2.5], // To Each His Dulcinea
      ['A2', 'anthem',    'solo',  3.5], // The Impossible Dream (~60%)
      ['A2', 'production','group', 3],   // Knight of the Woeful Countenance
      ['A2', 'drive',     'solo',  3.5], // Aldonza
      ['A2', 'comedy',    'duet',  2],   // A Little Gossip
      ['A2', 'eleven',    'group', 3],   // The Impossible Dream (Rep) / Death
      ['A2', 'finaleultimo','group',2],  // Finale (The Quest)
    ] },
  comefromaway: { form: 'one-act-100', year: 2017, region: 'bway',
    songs: [
      ['A1', 'opening',   'group', 4],   // Welcome to the Rock
      ['A1', 'production','group', 5],   // 38 Planes / Blankets and Bedding
      ['A1', 'drive',     'group', 4.5], // 28 Hours / Wherever We Are
      ['A1', 'drive',     'group', 3],   // Darkness and Trees
      ['A1', 'charm',     'group', 3.5], // On the Edge / Costume Party
      ['A2', 'soliloquy', 'solo',  3],   // I Am Here
      ['A2', 'ballad',    'group', 3],   // Prayer
      ['A2', 'comedy',    'group', 4],   // Screech In
      ['A2', 'eleven',    'solo',  4.5], // Me and the Sky
      ['A2', 'love',      'duet',  3],   // Stop the World
      ['A2', 'ballad',    'group', 4],   // Something's Missing
      ['A2', 'finaleultimo','group',3.5],// Finale (Welcome Rep — bookend)
    ] },
  // ═══ CONTINENTAL EUROPE ═══
  elisabeth: { form: 'two-act', year: 1992, region: 'europe',
    songs: [
      ['A1', 'opening',   'group', 5],   // Prolog
      ['A1', 'charm',     'duet',  3],   // Wie du
      ['A1', 'villain',   'duet',  3],   // Schwarzer Prinz
      ['A1', 'drive',     'group', 3],   // Jedem gibt er das Seine
      ['A1', 'iwant',     'solo',  4],   // Ich gehör nur mir
      ['A1', 'villain',   'solo',  3.5], // Der letzte Tanz
      ['A1', 'drive',     'group', 2.5], // Eine Kaiserin muss glänzen
      ['A1', 'villain',   'duet',  3],   // Elisabeth, mach auf
      ['A1', 'production','group', 3],   // Milch
      ['A1', 'finale',    'group', 3],   // Éljen (Coronation)
      ['A2', 'comedy',    'solo',  3],   // Kitsch
      ['A2', 'production','duet',  4.5], // Wenn ich tanzen will
      ['A2', 'ballad',    'solo',  3],   // Mama, wo bist du?
      ['A2', 'villain',   'duet',  4],   // Die Schatten werden länger
      ['A2', 'production','group', 4],   // Die fröhliche Apokalypse / Hass
      ['A2', 'ballad',    'duet',  3.5], // Boote in der Nacht
      ['A2', 'drive',     'group', 3.5], // Totenklage / Mayerling-Walzer
      ['A2', 'finaleultimo','duet',3],   // Der Schleier fällt
    ] },
  notredame: { form: 'two-act', year: 1998, region: 'europe',
    songs: [
      ['A1', 'opening',   'solo',  3.5], // Le temps des cathédrales (solo opening)
      ['A1', 'establishing','group',3.5],// Les sans-papiers
      ['A1', 'iwant',     'solo',  3],   // Bohémienne
      ['A1', 'charm',     'duet',  3],   // Ces diamants-là
      ['A1', 'production','group', 4.5], // La fête des fous / Le pape des fous
      ['A1', 'production','group', 3.5], // La cour des miracles
      ['A1', 'charm',     'duet',  3],   // Le mot Phoebus / Beau comme le soleil
      ['A1', 'drive',     'solo',  3],   // Déchiré
      ['A1', 'love',      'group', 4.5], // Belle (trio)
      ['A1', 'charm',     'duet',  3],   // Ma maison c'est ta maison
      ['A1', 'soliloquy', 'solo',  4],   // Tu vas me détruire (A1 soliloquy)
      ['A1', 'production','group', 3.5], // Le val d'amour / La volupté
      ['A1', 'finale',    'group', 2],   // Fatalité
      ['A2', 'drive',     'group', 5],   // Florence / Les cloches
      ['A2', 'ballad',    'duet',  3],   // Les oiseaux qu'on met en cage
      ['A2', 'drive',     'group', 4],   // Condamnés / Le procès / La torture
      ['A2', 'soliloquy', 'solo',  3.5], // Être prêtre et aimer une femme
      ['A2', 'ballad',    'solo',  3],   // La monture / Je reviens vers toi
      ['A2', 'production','group', 3],   // Libérés
      ['A2', 'ballad',    'solo',  3],   // Lune
      ['A2', 'ballad',    'solo',  3.5], // Vivre
      ['A2', 'production','group', 4],   // L'attaque de Notre-Dame / Déportés
      ['A2', 'eleven',    'solo',  3.5], // Danse mon Esmeralda
      ['A2', 'finaleultimo','group',2],  // Le temps des cathédrales (Rep — bookend)
    ] },
};
