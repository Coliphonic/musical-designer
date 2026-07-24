// Data-only corpus: Best Musical Tony winners 2018–2026 not already on the shelf.
// Each song: [half, fn, voiceClass, estMin]. half: 'A1'|'A2' ('1H' whole for one-acts,
// split at the natural midpoint marker). Minutes are interpretive ballparks from
// cast recordings. Function tags are editorial (same taxonomy as data.js FN).
export const WINNERS = {
  bandsvisit: { // 2018 · one-act ~95 min · book musical
    form: 'one-act-95',
    songs: [
      ['A1', 'opening',      'group', 3],   // Waiting
      ['A1', 'establishing', 'group', 3.5], // Welcome to Nowhere
      ['A1', 'charm',        'solo',  3],   // It Is What It Is
      ['A1', 'charm',        'group', 3.5], // The Beat of Your Heart
      ['A1', 'motif',        'solo',  2],   // Soraya (instr.)
      ['A2', 'ballad',       'solo',  4],   // Omar Sharif
      ['A2', 'comedy',       'solo',  3],   // Papi Hears the Ocean
      ['A2', 'charm',        'solo',  3],   // Haled's Song About Love
      ['A2', 'love',         'duet',  3.5], // Something Different
      ['A2', 'ballad',       'solo',  3],   // Itzik's Lullaby
      ['A2', 'eleven',       'solo',  3.5], // Answer Me
      ['A2', 'finaleultimo', 'group', 3],   // The Concert
    ],
  },
  hadestown: { // 2019 · two-act 2:30 incl interm · near-sung-through
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 4],   // Road to Hell
      ['A1', 'establishing', 'solo',  3],   // Any Way the Wind Blows
      ['A1', 'charm',        'duet',  1.5], // Come Home with Me
      ['A1', 'love',         'duet',  3],   // Wedding Song
      ['A1', 'motif',        'solo',  1.5], // Epic I
      ['A1', 'production',   'group', 3],   // Livin' It Up on Top
      ['A1', 'love',         'duet',  4],   // All I've Ever Known
      ['A1', 'production',   'group', 4.5], // Way Down Hadestown
      ['A1', 'drive',        'duet',  1.5], // A Gathering Storm
      ['A1', 'motif',        'solo',  1.5], // Epic II
      ['A1', 'drive',        'group', 5],   // Chant
      ['A1', 'villain',      'solo',  3],   // Hey, Little Songbird
      ['A1', 'drive',        'group', 2.5], // When the Chips Are Down
      ['A1', 'ballad',       'solo',  2],   // Gone, I'm Gone
      ['A1', 'anthem',       'group', 5],   // Wait for Me
      ['A1', 'finale',       'group', 4.5], // Why We Build the Wall
      ['A2', 'diegetic',     'group', 4],   // Our Lady of the Underground
      ['A2', 'reprise',      'group', 1.5], // Way Down Hadestown (Rep)
      ['A2', 'ballad',       'solo',  3],   // Flowers
      ['A2', 'reprise',      'duet',  1],   // Come Home with Me (Rep)
      ['A2', 'motif',        'group', 1.5], // Nothing Changes
      ['A2', 'drive',        'group', 3.5], // If It's True
      ['A2', 'ballad',       'duet',  3.5], // How Long?
      ['A2', 'reprise',      'group', 3.5], // Chant (Rep)
      ['A2', 'eleven',       'solo',  4],   // Epic III
      ['A2', 'love',         'duet',  3],   // Promises
      ['A2', 'motif',        'group', 1.5], // Word to the Wise
      ['A2', 'soliloquy',    'solo',  3],   // His Kiss, the Riot
      ['A2', 'reprise',      'group', 2.5], // Wait for Me (Rep)
      ['A2', 'drive',        'group', 4],   // Doubt Comes In
      ['A2', 'reprise',      'group', 3],   // Road to Hell (Rep)
      ['A2', 'finaleultimo', 'group', 3],   // We Raise Our Cups
    ],
  },
  moulinrouge: { // 2020 · two-act 2:35 incl interm · jukebox
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 5],   // Welcome to the Moulin Rouge!
      ['A1', 'motif',        'group', 2],   // Truth Beauty Freedom Love
      ['A1', 'production',   'group', 4.5], // The Sparkling Diamond
      ['A1', 'production',   'group', 3],   // Shut Up and Raise Your Glass
      ['A1', 'iwant',        'solo',  3],   // Firework
      ['A1', 'love',         'duet',  3.5], // Your Song
      ['A1', 'drive',        'group', 3],   // So Exciting! (The Pitch Song)
      ['A1', 'villain',      'solo',  2],   // Sympathy for the Duke
      ['A1', 'motif',        'solo',  1.5], // Nature Boy
      ['A1', 'finale',       'duet',  5],   // Elephant Love Medley
      ['A2', 'production',   'group', 4.5], // Backstage Romance
      ['A2', 'love',         'duet',  3.5], // Come What May
      ['A2', 'drive',        'group', 3],   // Only Girl in a Material World
      ['A2', 'soliloquy',    'solo',  3.5], // Chandelier
      ['A2', 'production',   'group', 4.5], // El Tango de Roxanne
      ['A2', 'eleven',       'solo',  4],   // Crazy Rolling
      ['A2', 'reprise',      'solo',  1],   // Your Song (Rep)
      ['A2', 'reprise',      'duet',  2],   // Come What May (Rep)
      ['A2', 'finaleultimo', 'group', 2.5], // More More More!
    ],
  },
  strangeloop: { // 2022 · one-act ~100 min
    form: 'one-act-100',
    songs: [
      ['A1', 'opening',      'group', 4],   // Intermission Song
      ['A1', 'iwant',        'solo',  3.5], // Today
      ['A1', 'comedy',       'group', 2.5], // We Wanna Know
      ['A1', 'charm',        'solo',  3.5], // Inner White Girl
      ['A1', 'comedy',       'solo',  2.5], // Didn't Want Nothin'
      ['A1', 'comedy',       'group', 3],   // Exile in Gayville
      ['A2', 'ballad',       'solo',  3],   // Second Wave
      ['A2', 'comedy',       'group', 3],   // Tyler Perry Writes Real Life
      ['A2', 'charm',        'solo',  2.5], // A Sympathetic Ear
      ['A2', 'production',   'group', 4],   // Inwood Daddy
      ['A2', 'reprise',      'solo',  1.5], // Didn't Want Nothin' (Rep)
      ['A2', 'ballad',       'solo',  4],   // Periodically
      ['A2', 'production',   'group', 5],   // Precious Little Dream / AIDS Is God's Punishment
      ['A2', 'ballad',       'solo',  4],   // Memory Song
      ['A2', 'finaleultimo', 'group', 3],   // A Strange Loop
    ],
  },
  outsiders: { // 2024 · two-act 2:25 incl interm · book-heavy
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 4],   // Tulsa '67
      ['A1', 'production',   'group', 4],   // Grease Got a Hold
      ['A1', 'drive',        'solo',  3],   // Runs in the Family
      ['A1', 'iwant',        'solo',  3.5], // Great Expectations
      ['A1', 'production',   'group', 3.5], // Friday at the Drive-In
      ['A1', 'love',         'duet',  3],   // I Could Talk to You All Night
      ['A1', 'reprise',      'solo',  1.5], // Runs in the Family (Rep)
      ['A1', 'ballad',       'duet',  3.5], // Far Away from Tulsa
      ['A1', 'finale',       'group', 4],   // Run Run Brother
      ['A2', 'drive',        'group', 3],   // Justice for Tulsa
      ['A2', 'soliloquy',    'solo',  3],   // Death's at My Door
      ['A2', 'ballad',       'duet',  3],   // Throwing in the Towel
      ['A2', 'soliloquy',    'solo',  2.5], // Soda's Letter
      ['A2', 'comedy',       'group', 2.5], // Hoods Turned Heroes
      ['A2', 'ballad',       'solo',  3],   // Hopeless War
      ['A2', 'production',   'group', 4],   // Trouble
      ['A2', 'ballad',       'solo',  3.5], // Little Brother
      ['A2', 'eleven',       'solo',  3.5], // Stay Gold
      ['A2', 'finaleultimo', 'group', 2.5], // Finale (Tulsa '67)
    ],
  },
  schmigadoon: { // 2026 · two-act 2:30 incl interm · Golden Age pastiche
    form: 'two-act',
    songs: [
      ['A1', 'opening',      'group', 4],   // Schmigadoon!
      ['A1', 'charm',        'solo',  2.5], // You Can't Tame Me
      ['A1', 'comedy',       'group', 3],   // Corn Puddin'
      ['A1', 'comedy',       'solo',  2],   // Leprechaun Song
      ['A1', 'comedy',       'group', 2.5], // Lovers' Spat
      ['A1', 'ballad',       'solo',  3],   // Somewhere Love Is Waiting for You
      ['A1', 'production',   'group', 3.5], // The Picnic Basket Auction
      ['A1', 'charm',        'duet',  3],   // Enjoy the Ride
      ['A1', 'comedy',       'solo',  2.5], // Not That Kinda Gal
      ['A1', 'reprise',      'solo',  1.5], // You Done Tamed Me
      ['A1', 'production',   'group', 3.5], // I'm Engaged
      ['A1', 'comedy',       'duet',  2.5], // What's the Matter with Men?
      ['A1', 'drive',        'group', 3],   // Cross That Bridge
      ['A1', 'finale',       'group', 3],   // Act 1 Finale
      ['A2', 'ballad',       'solo',  3],   // With All of Your Heart
      ['A2', 'comedy',       'solo',  2],   // Baby Talk
      ['A2', 'love',         'duet',  2],   // I Thought I Was the Only One
      ['A2', 'ballad',       'solo',  3],   // When the Night Is Darkest
      ['A2', 'love',         'duet',  3],   // Suddenly
      ['A2', 'villain',      'solo',  2.5], // Tribulation
      ['A2', 'soliloquy',    'solo',  2],   // Melissa's Epiphany
      ['A2', 'production',   'group', 3],   // Election Day
      ['A2', 'eleven',       'solo',  3.5], // You Make Me Wanna Sing
      ['A2', 'finaleultimo', 'group', 3.5], // How We Change
    ],
  },
};
