export const FREE_INDEX = 12;
export const FREE_LABEL = 'Free Space';

export const BINGO_PRESETS = [
  {
    key: 'classic',
    label: 'Classic reading prompts',
    prompts: [
      'Love Triangle', 'Fantasy', 'Non-Fiction', 'Graphic Novel', 'Found Family',
      'Movie Adaptation', 'Finish a Series', 'Time Travel', 'Banned Book', 'Over 500 Pages',
      'Debut Author', 'Set in Another Country', FREE_LABEL, 'Enemies to Lovers', 'Book Club Pick',
      'Published This Year', 'Audiobook', 'Under 200 Pages', 'Mystery', 'Classic',
      'Cover in Your Favourite Colour', 'Retelling', 'Recommended by a Friend', 'Horror', 'Five-Star Read',
    ],
  },
  {
    key: 'romance',
    label: 'Romance & romantasy',
    prompts: [
      'Fake Dating', 'Slow Burn', 'Grumpy / Sunshine', 'Second Chance', 'Forced Proximity',
      'Small Town', 'Fae Courts', 'Friends to Lovers', 'Holiday Romance', 'Sports Romance',
      'Spice Level 4+', 'Forbidden Love', FREE_LABEL, 'Only One Bed', 'Romantasy',
      'Workplace Romance', 'Age Gap', 'Dual POV', 'Royalty', 'Rom-Com',
      'Second Book in a Series', 'Illustrated Cover', 'Love Triangle', 'Happily Ever After', 'Favourite Author',
    ],
  },
  {
    key: 'blank',
    label: 'Blank custom board',
    prompts: Array.from({ length: 25 }, (_, i) => (i === FREE_INDEX ? FREE_LABEL : '')),
  },
];

// Rows, columns, then both diagonals.
export const BINGO_LINES = [
  ...Array.from({ length: 5 }, (_, r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...Array.from({ length: 5 }, (_, c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];
