const now = new Date();
const year = now.getFullYear();

function daysAgo(n) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const LOG_DAYS = [
  [0, { pages: 34, book_title: 'A Court of Thorns and Roses' }],
  [1, { pages: 28, book_title: 'A Court of Thorns and Roses' }],
  [2, { minutes: 45, book_title: 'The Thursday Murder Club' }],
  [3, { pages: 51, book_title: 'A Court of Thorns and Roses' }],
  [6, { pages: 20, book_title: 'The Thursday Murder Club' }],
  [7, { pages: 62, book_title: 'A Court of Thorns and Roses' }],
  [8, { minutes: 30 }],
  [9, { pages: 40, book_title: 'A Court of Thorns and Roses' }],
  [10, { pages: 25, book_title: 'A Court of Thorns and Roses' }],
  [15, { pages: 70, book_title: 'Piranesi' }],
  [16, { pages: 44, book_title: 'Piranesi' }],
  [24, { minutes: 60 }],
];

export const TRACKERS_SEED_ENTRIES = [
  ...LOG_DAYS.map(([n, data]) => ({ kind: 'trackers.reading_log', entry_date: daysAgo(n), data })),
  { kind: 'trackers.series', entry_date: null, data: { name: 'The Empyrean', total: 5 } },
  { kind: 'trackers.series', entry_date: null, data: { name: 'Throne of Glass', author: 'Sarah J. Maas', total: 8, owned: 3, read: 2 } },
  { kind: 'trackers.series', entry_date: null, data: { name: 'The Cruel Prince', author: 'Holly Black', total: 3, owned: 3, read: 3 } },
  { kind: 'trackers.favorite_authors', entry_date: null, data: { name: 'Emily Henry' } },
  { kind: 'trackers.favorite_authors', entry_date: null, data: { name: 'Susanna Clarke' } },
  { kind: 'trackers.haul', entry_date: `${year}-03-14`, data: { title: 'Babel', author: 'R. F. Kuang', type: 'haul', cost: 14.5 } },
  { kind: 'trackers.haul', entry_date: `${year}-06-02`, data: { title: 'Happy Place', author: 'Emily Henry', type: 'haul', cost: 11.99 } },
  { kind: 'trackers.haul', entry_date: `${year}-07-20`, data: { title: 'The Starless Sea', author: 'Erin Morgenstern', type: 'haul', cost: 9 } },
  { kind: 'trackers.haul', entry_date: `${year}-08-09`, data: { title: 'The Midnight Library', author: 'Matt Haig', type: 'unhaul', cost: 4 } },
  { kind: 'trackers.haul', entry_date: daysAgo(5), data: { title: 'Onyx Storm', author: 'Rebecca Yarros', type: 'haul', cost: 22 } },
];
