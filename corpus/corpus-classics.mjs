// Data-only corpus, batch 3: Best Musical Tony winners across seven decades.
// Same tuple shape: [half, fn, voice, estMin]. Minutes are cast-recording
// ballparks; function tags editorial. `year` = Broadway opening.
export const CLASSICS = {
  myfairlady: { // 1957 winner · famously long Act 1
    form: 'two-act', year: 1956,
    songs: [
      ['A1', 'opening',      'solo',  3],   // Why Can't the English? (solo opening!)
      ['A1', 'iwant',        'solo',  3.5], // Wouldn't It Be Loverly?
      ['A1', 'comedy',       'group', 3.5], // With a Little Bit of Luck
      ['A1', 'comedy',       'solo',  4],   // I'm an Ordinary Man
      ['A1', 'comedy',       'solo',  2.5], // Just You Wait
      ['A1', 'production',   'group', 3],   // The Rain in Spain
      ['A1', 'ballad',       'solo',  3.5], // I Could Have Danced All Night
      ['A1', 'production',   'group', 3],   // Ascot Gavotte
      ['A1', 'love',         'solo',  3],   // On the Street Where You Live (solo love!)
      ['A1', 'finale',       'group', 2.5], // The Embassy Waltz
      ['A2', 'production',   'group', 4],   // You Did It
      ['A2', 'reprise',      'solo',  1],   // Just You Wait (Rep)
      ['A2', 'drive',        'solo',  2.5], // Show Me
      ['A2', 'production',   'group', 4.5], // Get Me to the Church on Time
      ['A2', 'comedy',       'solo',  3],   // A Hymn to Him
      ['A2', 'drive',        'duet',  2.5], // Without You
      ['A2', 'eleven',       'solo',  5],   // I've Grown Accustomed to Her Face
    ],
  },
  soundofmusic: { // 1960 winner (tie)
    form: 'two-act', year: 1959,
    songs: [
      ['A1', 'opening',      'group', 2.5], // Preludium
      ['A1', 'charm',        'solo',  3],   // The Sound of Music
      ['A1', 'comedy',       'group', 3],   // Maria
      ['A1', 'charm',        'duet',  3],   // My Favorite Things
      ['A1', 'production',   'group', 5.5], // Do-Re-Mi
      ['A1', 'love',         'duet',  3.5], // Sixteen Going on Seventeen
      ['A1', 'diegetic',     'group', 3],   // The Lonely Goatherd
      ['A1', 'comedy',       'duet',  3],   // How Can Love Survive?
      ['A1', 'diegetic',     'group', 3],   // So Long, Farewell
      ['A1', 'finale',       'solo',  3],   // Climb Ev'ry Mountain (solo act finale!)
      ['A2', 'reprise',      'group', 1.5], // My Favorite Things (Rep)
      ['A2', 'comedy',       'group', 3],   // No Way to Stop It
      ['A2', 'love',         'duet',  3],   // Something Good
      ['A2', 'production',   'group', 2.5], // The Wedding / Gaudeamus
      ['A2', 'reprise',      'duet',  2],   // Sixteen (Rep)
      ['A2', 'eleven',       'solo',  2.5], // Edelweiss
      ['A2', 'reprise',      'group', 1.5], // So Long, Farewell (Rep)
      ['A2', 'finaleultimo', 'group', 2],   // Climb Ev'ry Mountain (Rep)
    ],
  },
  hellodolly: { // 1964 winner
    form: 'two-act', year: 1964,
    songs: [
      ['A1', 'opening',      'group', 3],   // I Put My Hand In
      ['A1', 'comedy',       'group', 3],   // It Takes a Woman
      ['A1', 'production',   'group', 4.5], // Put On Your Sunday Clothes
      ['A1', 'ballad',       'solo',  3],   // Ribbons Down My Back
      ['A1', 'comedy',       'group', 2.5], // Motherhood March
      ['A1', 'production',   'group', 4],   // Dancing
      ['A1', 'finale',       'group', 4.5], // Before the Parade Passes By
      ['A2', 'charm',        'group', 3],   // Elegance
      ['A2', 'production',   'group', 5.5], // Hello, Dolly!
      ['A2', 'love',         'duet',  3],   // It Only Takes a Moment
      ['A2', 'comedy',       'solo',  2.5], // So Long, Dearie
      ['A2', 'finaleultimo', 'group', 2.5], // Finale
    ],
  },
  cabaret: { // 1967 winner
    form: 'two-act', year: 1966,
    songs: [
      ['A1', 'opening',      'group', 4.5], // Willkommen
      ['A1', 'charm',        'solo',  3],   // So What?
      ['A1', 'diegetic',     'group', 3.5], // Don't Tell Mama
      ['A1', 'charm',        'duet',  3],   // Perfectly Marvelous
      ['A1', 'diegetic',     'group', 2.5], // Two Ladies
      ['A1', 'charm',        'duet',  2.5], // It Couldn't Please Me More
      ['A1', 'villain',      'group', 2],   // Tomorrow Belongs to Me
      ['A1', 'love',         'solo',  3],   // Why Should I Wake Up? (solo love)
      ['A1', 'diegetic',     'group', 3],   // Money
      ['A1', 'love',         'duet',  3],   // Married
      ['A1', 'finale',       'group', 3],   // Tomorrow Belongs to Me (Rep)
      ['A2', 'diegetic',     'group', 2],   // Kickline
      ['A2', 'reprise',      'solo',  1.5], // Married (Rep)
      ['A2', 'diegetic',     'solo',  3],   // If You Could See Her
      ['A2', 'soliloquy',    'solo',  3],   // What Would You Do?
      ['A2', 'ballad',       'solo',  2.5], // I Don't Care Much
      ['A2', 'eleven',       'solo',  4.5], // Cabaret
      ['A2', 'finaleultimo', 'group', 2.5], // Finale
    ],
  },
  company: { // 1971 winner
    form: 'two-act', year: 1970,
    songs: [
      ['A1', 'opening',      'group', 4],   // Company
      ['A1', 'comedy',       'group', 3],   // The Little Things You Do Together
      ['A1', 'ballad',       'group', 3.5], // Sorry-Grateful
      ['A1', 'comedy',       'group', 2.5], // You Could Drive a Person Crazy
      ['A1', 'comedy',       'group', 2.5], // Have I Got a Girl for You
      ['A1', 'ballad',       'solo',  3],   // Someone Is Waiting
      ['A1', 'drive',        'solo',  3],   // Another Hundred People
      ['A1', 'comedy',       'group', 3],   // Getting Married Today
      ['A1', 'finale',       'solo',  3.5], // Marry Me a Little (solo act finale)
      ['A2', 'production',   'group', 5],   // Side by Side by Side
      ['A2', 'comedy',       'group', 2.5], // Poor Baby
      ['A2', 'love',         'duet',  3],   // Barcelona
      ['A2', 'soliloquy',    'solo',  4.5], // The Ladies Who Lunch
      ['A2', 'eleven',       'solo',  4.5], // Being Alive
    ],
  },
  achorusline: { // 1976 winner · one-act ~2:10
    form: 'one-act-130', year: 1975,
    songs: [
      ['A1', 'opening',      'group', 6],   // I Hope I Get It
      ['A1', 'charm',        'solo',  2.5], // I Can Do That
      ['A1', 'ballad',       'group', 5.5], // At the Ballet
      ['A1', 'comedy',       'duet',  2],   // Sing!
      ['A1', 'production',   'group', 8],   // Hello Twelve, Hello Thirteen, Hello Love
      ['A1', 'ballad',       'solo',  4],   // Nothing
      ['A2', 'comedy',       'solo',  2.5], // Dance: Ten; Looks: Three
      ['A2', 'iwant',        'solo',  6],   // The Music and the Mirror (late I Want!)
      ['A2', 'drive',        'group', 3],   // One (Rehearsal)
      ['A2', 'eleven',       'solo',  4],   // What I Did for Love
      ['A2', 'finaleultimo', 'group', 4],   // One (Finale)
    ],
  },
  annie: { // 1977 winner
    form: 'two-act', year: 1977,
    songs: [
      ['A1', 'iwant',        'solo',  2.5], // Maybe (show OPENS on the I Want)
      ['A1', 'production',   'group', 3],   // It's the Hard-Knock Life
      ['A1', 'anthem',       'solo',  2.5], // Tomorrow
      ['A1', 'comedy',       'group', 2.5], // We'd Like to Thank You, Herbert Hoover
      ['A1', 'villain',      'solo',  2.5], // Little Girls
      ['A1', 'production',   'group', 3],   // I Think I'm Gonna Like It Here
      ['A1', 'production',   'group', 5],   // N.Y.C.
      ['A1', 'villain',      'group', 3],   // Easy Street
      ['A1', 'finale',       'group', 2.5], // You Won't Be an Orphan for Long
      ['A2', 'diegetic',     'group', 3],   // You're Never Fully Dressed…
      ['A2', 'reprise',      'group', 1.5], // Fully Dressed (Kids Rep)
      ['A2', 'reprise',      'group', 1.5], // Easy Street (Rep)
      ['A2', 'reprise',      'group', 2],   // Tomorrow (Cabinet Rep)
      ['A2', 'ballad',       'solo',  3],   // Something Was Missing
      ['A2', 'love',         'duet',  3],   // I Don't Need Anything But You
      ['A2', 'finaleultimo', 'group', 2.5], // Tomorrow (Finale)
    ],
  },
  sweeneytodd: { // 1979 winner
    form: 'two-act', year: 1979,
    songs: [
      ['A1', 'opening',      'group', 4.5], // The Ballad of Sweeney Todd
      ['A1', 'establishing', 'duet',  4],   // No Place Like London
      ['A1', 'ballad',       'solo',  2],   // The Barber and His Wife
      ['A1', 'comedy',       'solo',  3],   // The Worst Pies in London
      ['A1', 'ballad',       'solo',  3],   // Poor Thing
      ['A1', 'charm',        'duet',  3],   // My Friends
      ['A1', 'iwant',        'solo',  3],   // Green Finch and Linnet Bird
      ['A1', 'love',         'solo',  2.5], // Johanna (solo love)
      ['A1', 'comedy',       'group', 3.5], // Pirelli's Miracle Elixir
      ['A1', 'production',   'group', 3],   // The Contest
      ['A1', 'ballad',       'solo',  3],   // Wait
      ['A1', 'love',         'duet',  2.5], // Kiss Me
      ['A1', 'comedy',       'duet',  2],   // Ladies in Their Sensitivities
      ['A1', 'charm',        'duet',  3.5], // Pretty Women
      ['A1', 'soliloquy',    'solo',  3.5], // Epiphany (Act 1 soliloquy!)
      ['A1', 'finale',       'duet',  6],   // A Little Priest (comedy-duet act finale)
      ['A2', 'production',   'group', 4],   // God, That's Good!
      ['A2', 'love',         'group', 4],   // Johanna (Quartet)
      ['A2', 'comedy',       'solo',  3.5], // By the Sea
      ['A2', 'ballad',       'duet',  4],   // Not While I'm Around
      ['A2', 'diegetic',     'group', 3],   // Parlor Songs
      ['A2', 'production',   'group', 2.5], // City on Fire!
      ['A2', 'eleven',       'group', 8],   // Final Scene
      ['A2', 'finaleultimo', 'group', 3],   // The Ballad of Sweeney Todd (Rep)
    ],
  },
  lesmis: { // 1987 winner · sung-through (recitative merged into numbers)
    form: 'two-act', year: 1987,
    songs: [
      ['A1', 'opening',      'group', 5],   // Prologue: Look Down
      ['A1', 'soliloquy',    'solo',  3],   // Valjean's Soliloquy (A1!)
      ['A1', 'production',   'group', 4],   // At the End of the Day
      ['A1', 'ballad',       'solo',  4.5], // I Dreamed a Dream
      ['A1', 'production',   'group', 3.5], // Lovely Ladies
      ['A1', 'soliloquy',    'solo',  2.5], // Who Am I? (A1!)
      ['A1', 'ballad',       'duet',  2.5], // Fantine's Death (Come to Me)
      ['A1', 'drive',        'duet',  2.5], // The Confrontation
      ['A1', 'iwant',        'solo',  2],   // Castle on a Cloud
      ['A1', 'comedy',       'group', 4.5], // Master of the House
      ['A1', 'villain',      'solo',  3],   // Stars
      ['A1', 'motif',        'group', 3],   // Look Down (Beggars)
      ['A1', 'anthem',       'group', 5],   // Red and Black
      ['A1', 'anthem',       'group', 3],   // Do You Hear the People Sing?
      ['A1', 'love',         'group', 3],   // A Heart Full of Love
      ['A1', 'drive',        'group', 2],   // The Attack on Rue Plumet
      ['A1', 'finale',       'group', 4],   // One Day More
      ['A2', 'ballad',       'solo',  4],   // On My Own
      ['A2', 'drive',        'group', 2],   // Building the Barricade
      ['A2', 'ballad',       'duet',  3.5], // A Little Fall of Rain
      ['A2', 'ballad',       'group', 3],   // Drink with Me
      ['A2', 'ballad',       'solo',  3.5], // Bring Him Home
      ['A2', 'drive',        'group', 3],   // The Final Battle
      ['A2', 'soliloquy',    'solo',  4],   // Javert's Suicide
      ['A2', 'motif',        'group', 2.5], // Turning
      ['A2', 'eleven',       'solo',  3.5], // Empty Chairs at Empty Tables
      ['A2', 'production',   'group', 4],   // Wedding / Beggars at the Feast
      ['A2', 'finaleultimo', 'group', 5],   // Epilogue / Finale
    ],
  },
  rent: { // 1996 winner
    form: 'two-act', year: 1996,
    songs: [
      ['A1', 'opening',      'group', 4],   // Rent
      ['A1', 'iwant',        'solo',  4],   // One Song Glory
      ['A1', 'love',         'duet',  4],   // Light My Candle
      ['A1', 'comedy',       'solo',  2.5], // Today 4 U
      ['A1', 'drive',        'group', 3],   // You'll See
      ['A1', 'comedy',       'duet',  3.5], // Tango: Maureen
      ['A1', 'motif',        'group', 3],   // Life Support / Will I?
      ['A1', 'charm',        'solo',  3.5], // Out Tonight
      ['A1', 'drive',        'group', 3.5], // Another Day
      ['A1', 'charm',        'group', 3],   // Santa Fe
      ['A1', 'love',         'duet',  2.5], // I'll Cover You
      ['A1', 'diegetic',     'solo',  3.5], // Over the Moon
      ['A1', 'finale',       'group', 6.5], // La Vie Bohème / I Should Tell You
      ['A2', 'anthem',       'group', 3],   // Seasons of Love (opens Act 2)
      ['A2', 'drive',        'group', 4],   // Happy New Year
      ['A2', 'comedy',       'duet',  4],   // Take Me or Leave Me
      ['A2', 'ballad',       'duet',  3.5], // Without You
      ['A2', 'production',   'group', 3],   // Contact
      ['A2', 'reprise',      'group', 3],   // I'll Cover You (Rep)
      ['A2', 'soliloquy',    'solo',  2],   // Halloween
      ['A2', 'drive',        'group', 5],   // Goodbye Love
      ['A2', 'drive',        'duet',  4],   // What You Own
      ['A2', 'eleven',       'solo',  2.5], // Your Eyes
      ['A2', 'finaleultimo', 'group', 2.5], // Finale B
    ],
  },
  producers: { // 2001 winner
    form: 'two-act', year: 2001,
    songs: [
      ['A1', 'opening',      'group', 2.5], // Opening Night
      ['A1', 'charm',        'group', 4.5], // The King of Broadway
      ['A1', 'drive',        'duet',  4],   // We Can Do It
      ['A1', 'iwant',        'group', 5],   // I Wanna Be a Producer
      ['A1', 'comedy',       'group', 2],   // Der Guten Tag Hop-Clop
      ['A1', 'comedy',       'group', 3.5], // Keep It Gay
      ['A1', 'charm',        'solo',  3],   // When You've Got It, Flaunt It
      ['A1', 'finale',       'group', 4.5], // Along Came Bialy
      ['A2', 'love',         'duet',  3.5], // That Face
      ['A2', 'comedy',       'solo',  2],   // Haben Sie Gehört das Deutsche Band?
      ['A2', 'production',   'group', 7],   // Springtime for Hitler
      ['A2', 'eleven',       'solo',  5],   // Betrayed
      ['A2', 'ballad',       'duet',  3.5], // 'Til Him
      ['A2', 'finaleultimo', 'group', 3],   // Prisoners of Love
    ],
  },
  hairspray: { // 2003 winner
    form: 'two-act', year: 2002,
    songs: [
      ['A1', 'opening',      'group', 4],   // Good Morning Baltimore
      ['A1', 'diegetic',     'group', 3],   // The Nicest Kids in Town
      ['A1', 'comedy',       'group', 3.5], // Mama, I'm a Big Girl Now
      ['A1', 'iwant',        'solo',  3.5], // I Can Hear the Bells
      ['A1', 'villain',      'solo',  3],   // Miss Baltimore Crabs
      ['A1', 'love',         'duet',  3],   // It Takes Two
      ['A1', 'production',   'group', 5],   // Welcome to the 60's
      ['A1', 'charm',        'group', 4],   // Run and Tell That
      ['A1', 'finale',       'group', 4],   // Big, Blonde and Beautiful
      ['A2', 'comedy',       'group', 3],   // The Big Dollhouse
      ['A2', 'comedy',       'duet',  4.5], // (You're) Timeless to Me
      ['A2', 'love',         'group', 4.5], // Without Love
      ['A2', 'eleven',       'solo',  4],   // I Know Where I've Been
      ['A2', 'diegetic',     'group', 3.5], // Hairspray
      ['A2', 'charm',        'group', 2],   // Cooties
      ['A2', 'finaleultimo', 'group', 5],   // You Can't Stop the Beat
    ],
  },
  avenueq: { // 2004 winner
    form: 'two-act', year: 2003,
    songs: [
      ['A1', 'opening',      'group', 2],   // The Avenue Q Theme
      ['A1', 'iwant',        'solo',  1.5], // What Do You Do with a B.A. in English?
      ['A1', 'production',   'group', 4.5], // It Sucks to Be Me
      ['A1', 'comedy',       'duet',  2],   // If You Were Gay
      ['A1', 'iwant',        'solo',  3],   // Purpose (dual I Want)
      ['A1', 'comedy',       'group', 3.5], // Everyone's a Little Bit Racist
      ['A1', 'comedy',       'group', 3],   // The Internet Is for Porn
      ['A1', 'charm',        'duet',  3],   // Mix Tape
      ['A1', 'charm',        'solo',  2.5], // Special
      ['A1', 'comedy',       'group', 2.5], // You Can Be as Loud as the Hell You Want
      ['A1', 'ballad',       'group', 3.5], // Fantasies Come True
      ['A1', 'comedy',       'solo',  2],   // My Girlfriend, Who Lives in Canada
      ['A1', 'finale',       'solo',  3.5], // There's a Fine, Fine Line (solo act finale)
      ['A2', 'production',   'group', 4],   // There Is Life Outside Your Apartment
      ['A2', 'comedy',       'duet',  2.5], // The More You Ruv Someone
      ['A2', 'comedy',       'duet',  3],   // Schadenfreude
      ['A2', 'ballad',       'group', 3],   // I Wish I Could Go Back to College
      ['A2', 'production',   'group', 3.5], // The Money Song
      ['A2', 'finaleultimo', 'group', 3.5], // For Now
    ],
  },
  springawakening: { // 2007 winner
    form: 'two-act', year: 2006,
    songs: [
      ['A1', 'iwant',        'solo',  2.5], // Mama Who Bore Me (opens on the I Want)
      ['A1', 'reprise',      'group', 1.5], // Mama Who Bore Me (Rep)
      ['A1', 'drive',        'solo',  2.5], // All That's Known
      ['A1', 'production',   'group', 3],   // The Bitch of Living
      ['A1', 'charm',        'group', 3],   // My Junk
      ['A1', 'production',   'group', 3.5], // Touch Me
      ['A1', 'love',         'duet',  2.5], // The Word of Your Body
      ['A1', 'ballad',       'duet',  3.5], // The Dark I Know Well
      ['A1', 'drive',        'solo',  3],   // And Then There Were None
      ['A1', 'motif',        'solo',  2.5], // The Mirror-Blue Night
      ['A1', 'finale',       'group', 3.5], // I Believe
      ['A2', 'motif',        'group', 3],   // The Guilty Ones
      ['A2', 'drive',        'duet',  4],   // Don't Do Sadness / Blue Wind
      ['A2', 'reprise',      'duet',  2],   // The Word of Your Body (Rep)
      ['A2', 'ballad',       'solo',  3],   // Whispering
      ['A2', 'ballad',       'solo',  3.5], // Left Behind
      ['A2', 'production',   'group', 3],   // Totally Fucked
      ['A2', 'eleven',       'group', 4],   // Those You've Known
      ['A2', 'finaleultimo', 'group', 4],   // The Song of Purple Summer
    ],
  },
  funhome: { // 2015 winner · one-act ~100
    form: 'one-act-100', year: 2015,
    songs: [
      ['A1', 'opening',      'group', 4],   // It All Comes Back
      ['A1', 'production',   'group', 4],   // Welcome to Our House on Maple Avenue
      ['A1', 'diegetic',     'group', 3],   // Come to the Fun Home
      ['A1', 'charm',        'solo',  4],   // Changing My Major
      ['A1', 'drive',        'solo',  2.5], // Maps
      ['A1', 'production',   'group', 3],   // Raincoat of Love
      ['A1', 'charm',        'solo',  4],   // Ring of Keys
      ['A2', 'ballad',       'solo',  4],   // Days and Days
      ['A2', 'eleven',       'solo',  5],   // Telephone Wire
      ['A2', 'soliloquy',    'solo',  4],   // Edges of the World
      ['A2', 'finaleultimo', 'group', 4],   // Flying Away
    ],
  },
};
