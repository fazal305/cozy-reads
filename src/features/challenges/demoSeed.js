import { BINGO_PRESETS } from './bingoPresets';

const year = new Date().getFullYear();
const ref = (title) => ({ id: null, title });

const classic = BINGO_PRESETS.find((p) => p.key === 'classic').prompts;

export const CHALLENGES_SEED_ENTRIES = [
  {
    kind: 'challenges.bingo',
    entry_date: `${year}-01-01`,
    data: {
      name: `${year} Reading Bingo`,
      year,
      preset: 'classic',
      prompts: [...classic],
      links: {
        1: ref('Piranesi'),
        4: ref('Iron Flame'),
        6: ref('Iron Flame'),
        9: ref('Fourth Wing'),
        13: ref('Fourth Wing'),
        16: ref('The Silent Patient'),
        18: ref('The Silent Patient'),
        24: ref('Book Lovers'),
      },
    },
  },
  { kind: 'challenges.az', entry_date: `${year}-01-01`, data: { year, pins: { P: ref('Piranesi') } } },
  { kind: 'challenges.count', entry_date: `${year}-01-01`, data: { year, target: 25 } },
  {
    kind: 'challenges.bracket',
    entry_date: `${year}-12-31`,
    data: {
      year,
      size: 8,
      seeds: [ref('Fourth Wing'), ref('Book Lovers'), ref('Piranesi'), ref('Iron Flame'), ref('The Silent Patient'), null, null, null],
      picks: { '0-1': 3 },
    },
  },
  {
    kind: 'challenges.custom',
    entry_date: `${year}-01-01`,
    data: { name: 'Romantasy era', goal: 5, start: `${year}-01-01`, end: `${year}-12-31`, rules: { genre: 'Romantasy', format: null, minPages: null, trope: null }, links: [], excluded: [] },
  },
  {
    kind: 'challenges.custom',
    entry_date: `${year}-01-01`,
    data: { name: 'Chunky books', goal: 6, start: `${year}-01-01`, end: `${year}-12-31`, rules: { genre: null, format: null, minPages: 500, trope: null }, links: [ref('Piranesi')], excluded: [] },
  },
];
