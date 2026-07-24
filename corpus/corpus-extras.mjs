// Data-only corpus, batch 2 (Colin's picks): Phantom, School of Rock,
// Book of Mormon, In the Heights, Encanto (FILM — no stage version exists),
// The Notebook. Same tuple shape as corpus-winners: [half, fn, voice, estMin].
export const EXTRAS = {
  phantom: { // 1986 · two-act · famously long Act 1 (~85 vs ~50 min)
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 5],   // Overture / Hannibal
      ['A1', 'diegetic',     'solo',  3.5], // Think of Me
      ['A1', 'charm',        'duet',  2.5], // Angel of Music
      ['A1', 'villain',      'duet',  2],   // The Mirror
      ['A1', 'production',   'duet',  4],   // The Phantom of the Opera
      ['A1', 'love',         'solo',  5],   // The Music of the Night
      ['A1', 'drive',        'solo',  2],   // Stranger Than You Dreamt It
      ['A1', 'comedy',       'group', 5.5], // Notes / Prima Donna
      ['A1', 'diegetic',     'group', 2.5], // Poor Fool (Il Muto)
      ['A1', 'drive',        'duet',  2],   // Why Have You Brought Me Here
      ['A1', 'love',         'duet',  4.5], // All I Ask of You
      ['A1', 'finale',       'solo',  3],   // All I Ask of You (Reprise)
      ['A2', 'production',   'group', 4],   // Masquerade
      ['A2', 'villain',      'solo',  1.5], // Why So Silent
      ['A2', 'drive',        'group', 3],   // Notes II / Twisted Every Way
      ['A2', 'ballad',       'solo',  3.5], // Wishing You Were Somehow Here Again
      ['A2', 'drive',        'group', 2],   // Wandering Child
      ['A2', 'production',   'duet',  4.5], // The Point of No Return
      ['A2', 'eleven',       'group', 5],   // Down Once More / Final Lair
      ['A2', 'finaleultimo', 'group', 2],   // Finale
    ],
  },
  schoolofrock: { // 2015 · two-act
    form: 'two-act',
    songs: [
      ['A1', 'diegetic',     'group', 2],   // I'm Too Hot for You (No Vacancy)
      ['A1', 'iwant',        'solo',  3.5], // When I Climb to the Top of Mount Rock
      ['A1', 'establishing', 'group', 1.5], // Horace Green Alma Mater
      ['A1', 'charm',        'solo',  3],   // Here at Horace Green
      ['A1', 'charm',        'duet',  3],   // Children of Rock
      ['A1', 'reprise',      'solo',  1],   // Mount Rock (Reprise)
      ['A1', 'diegetic',     'solo',  2],   // Queen of the Night
      ['A1', 'production',   'group', 5],   // You're in the Band
      ['A1', 'ballad',       'group', 3.5], // If Only You Would Listen
      ['A1', 'charm',        'solo',  2],   // In the End of Time
      ['A1', 'comedy',       'group', 1.5], // Faculty Quadrille
      ['A1', 'anthem',       'group', 3.5], // Stick It to the Man
      ['A1', 'finale',       'group', 2.5], // The Audition / Stick It (Reprise)
      ['A2', 'comedy',       'group', 2.5], // Time to Play
      ['A2', 'diegetic',     'solo',  1],   // Amazing Grace
      ['A2', 'comedy',       'duet',  3],   // Math Is a Wonderful Thing
      ['A2', 'ballad',       'solo',  4],   // Where Did the Rock Go?
      ['A2', 'drive',        'group', 3],   // School of Rock (Pt 1+2)
      ['A2', 'drive',        'group', 2],   // Dewey's Confession
      ['A2', 'reprise',      'group', 2],   // If Only You Would Listen (Rep)
      ['A2', 'eleven',       'group', 4],   // School of Rock (Competition)
      ['A2', 'finaleultimo', 'group', 2],   // Stick It to the Man (Encore)
    ],
  },
  bookofmormon: { // 2011 · two-act · textbook 9/7
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 2.5], // Hello!
      ['A1', 'production',   'group', 3],   // Two by Two
      ['A1', 'iwant',        'duet',  3],   // You and Me (But Mostly Me)
      ['A1', 'comedy',       'group', 4.5], // Hasa Diga Eebowai
      ['A1', 'comedy',       'group', 4],   // Turn It Off
      ['A1', 'charm',        'duet',  1.5], // I Am Here for You
      ['A1', 'production',   'group', 5],   // All-American Prophet
      ['A1', 'iwant',        'solo',  3.5], // Sal Tlay Ka Siti
      ['A1', 'finale',       'group', 3.5], // Man Up
      ['A2', 'drive',        'group', 3.5], // Making Things Up Again
      ['A2', 'production',   'group', 5],   // Spooky Mormon Hell Dream
      ['A2', 'anthem',       'solo',  4],   // I Believe
      ['A2', 'love',         'duet',  3],   // Baptize Me
      ['A2', 'comedy',       'group', 3],   // I Am Africa
      ['A2', 'diegetic',     'group', 4],   // Joseph Smith American Moses
      ['A2', 'finaleultimo', 'group', 4],   // Tomorrow Is a Latter Day
    ],
  },
  intheheights: { // 2008 · two-act
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 5],   // In the Heights
      ['A1', 'iwant',        'solo',  4],   // Breathe
      ['A1', 'charm',        'duet',  2],   // Benny's Dispatch
      ['A1', 'iwant',        'solo',  3],   // It Won't Be Long Now
      ['A1', 'ballad',       'solo',  2.5], // Inútil
      ['A1', 'comedy',       'group', 3],   // No Me Diga
      ['A1', 'production',   'group', 5.5], // 96,000
      ['A1', 'soliloquy',    'solo',  4.5], // Paciencia y Fe
      ['A1', 'love',         'duet',  5],   // When You're Home
      ['A1', 'diegetic',     'solo',  2],   // Piragua
      ['A1', 'production',   'group', 3.5], // The Club
      ['A1', 'finale',       'group', 4],   // Blackout
      ['A2', 'love',         'duet',  3],   // Sunrise
      ['A2', 'charm',        'duet',  3.5], // Hundreds of Stories
      ['A2', 'drive',        'solo',  2.5], // Enough
      ['A2', 'production',   'group', 5.5], // Carnaval del Barrio
      ['A2', 'drive',        'solo',  1.5], // Atención
      ['A2', 'ballad',       'group', 3.5], // Alabanza
      ['A2', 'ballad',       'solo',  3.5], // Everything I Know
      ['A2', 'reprise',      'solo',  1],   // Piragua (Reprise)
      ['A2', 'love',         'duet',  3.5], // Champagne
      ['A2', 'love',         'duet',  3],   // When the Sun Goes Down
      ['A2', 'finaleultimo', 'group', 4.5], // Finale
    ],
  },
  encanto: { // 2021 FILM (~100 min) — no stage adaptation; halves split at ~55% mark
    form: 'film',
    songs: [
      ['A1', 'opening',      'group', 4.5], // The Family Madrigal
      ['A1', 'iwant',        'solo',  2.5], // Waiting on a Miracle
      ['A1', 'diegetic',     'group', 2.5], // Colombia, Mi Encanto
      ['A1', 'charm',        'solo',  3.5], // Surface Pressure
      ['A1', 'production',   'group', 3.5], // We Don't Talk About Bruno
      ['A2', 'charm',        'duet',  3],   // What Else Can I Do?
      ['A2', 'ballad',       'solo',  3.5], // Dos Oruguitas
      ['A2', 'finaleultimo', 'group', 4.5], // All of You
    ],
  },
  notebook: { // 2024 · two-act
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 4],   // Time
      ['A1', 'charm',        'group', 3],   // Dance With Me
      ['A1', 'love',         'duet',  3],   // Carry You Home
      ['A1', 'iwant',        'solo',  2.5], // Blue Shutters
      ['A1', 'iwant',        'solo',  2],   // I Paint
      ['A1', 'love',         'duet',  3],   // Sadness and Joy
      ['A1', 'ballad',       'solo',  3.5], // Leave the Light On
      ['A1', 'drive',        'solo',  2],   // What Happens
      ['A1', 'ballad',       'duet',  3],   // I Wanna Go Back
      ['A1', 'drive',        'duet',  2.5], // If This Is Love
      ['A1', 'love',         'group', 3],   // Kiss Me
      ['A1', 'finale',       'group', 3.5], // Home
      ['A2', 'drive',        'group', 3],   // We Have To Try
      ['A2', 'drive',        'group', 3.5], // Forever
      ['A2', 'reprise',      'solo',  1.5], // Sadness and Joy (Reprise)
      ['A2', 'comedy',       'group', 2.5], // Iron in the Fridge
      ['A2', 'ballad',       'duet',  2.5], // Don't You Worry
      ['A2', 'drive',        'duet',  2.5], // It's Not Easy
      ['A2', 'eleven',       'solo',  3.5], // My Days
      ['A2', 'love',         'group', 3],   // I Love You More
      ['A2', 'ballad',       'duet',  3],   // I Know
      ['A2', 'finaleultimo', 'group', 2],   // Coda
    ],
  },
};
