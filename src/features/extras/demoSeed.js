import { currentMonth } from '../../lib/bookMeta';

const year = new Date().getFullYear();
const month = currentMonth();

function inDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const day = (n) => `${month}-${String(n).padStart(2, '0')}`;

export const EXTRAS_SEED_ENTRIES = [
  { kind: 'extras.settings', entry_date: null, data: { currency: 'PKR' } },
  { kind: 'extras.monthly_note', entry_date: `${year}-01-01`, data: { month: `${year}-01`, note: 'Started the year with dragons. Want more standalones next month.' } },
  { kind: 'extras.budget', entry_date: `${month}-01`, data: { month, amount: 6000 } },
  { kind: 'extras.purchase', entry_date: day(3), data: { item: 'Babel paperback', amount: 2400, category: 'Books' } },
  { kind: 'extras.purchase', entry_date: day(9), data: { item: 'Bookmark set', amount: 650, category: 'Merch' } },
  { kind: 'extras.purchase', entry_date: day(12), data: { item: 'Audiobook credit', amount: 1500, category: 'E-books & audio' } },
  { kind: 'extras.subscription', entry_date: inDays(9), data: { service: 'Monthly book box', cost: 3500, renewal_date: inDays(9), books_received: 4 } },
  { kind: 'extras.subscription', entry_date: inDays(20), data: { service: 'Audiobook app', cost: 1500, renewal_date: inDays(20), books_received: 7 } },
  {
    kind: 'extras.savings',
    entry_date: null,
    data: {
      name: 'Sprayed-edge Empyrean set',
      target: 15000,
      contributions: [
        { id: 'seed-c1', date: inDays(-40), amount: 3000 },
        { id: 'seed-c2', date: inDays(-12), amount: 2500 },
      ],
    },
  },
  { kind: 'extras.event', entry_date: inDays(18), data: { title: 'Next Empyrean book', category: 'release', date: inDays(18), detail: 'Special edition hardback', note: 'Pre-ordered' } },
  { kind: 'extras.event', entry_date: inDays(33), data: { title: 'City book fair', category: 'event', date: inDays(33), detail: 'Expo Centre', note: 'Bring a tote bag' } },
  { kind: 'extras.event', entry_date: inDays(-25), data: { title: 'Library author talk', category: 'event', date: inDays(-25), detail: 'Online', note: '' } },
  { kind: 'extras.content', entry_date: day(5), data: { date: day(5), platform: 'instagram', book_id: null, book_title: 'Fourth Wing', idea: 'Flat lay with dragon bookmarks', status: 'posted' } },
  { kind: 'extras.content', entry_date: day(14), data: { date: day(14), platform: 'tiktok', book_id: null, book_title: '', idea: 'Books that broke me this year', status: 'drafted' } },
  { kind: 'extras.content', entry_date: day(22), data: { date: day(22), platform: 'youtube', book_id: null, book_title: 'Babel', idea: 'Autumn TBR video', status: 'idea' } },
  {
    kind: 'extras.book_club',
    entry_date: null,
    data: {
      name: 'Chai and Chapters',
      meetings: [
        {
          id: 'seed-m1',
          book_id: null,
          book_title: 'Book Lovers',
          date: inDays(-30),
          time: '18:30',
          location: 'Café Lumen',
          questions: [
            { id: 'seed-q1', text: 'Which character did you connect with most, and why?', notes: 'Nora, obviously.' },
            { id: 'seed-q2', text: 'Did the ending work for you?', notes: '' },
          ],
          notes: 'Five of us came. Next pick voted: Piranesi.',
        },
        { id: 'seed-m2', book_id: null, book_title: 'Piranesi', date: inDays(6), time: '19:00', location: 'https://meet.example.com/chai-and-chapters', questions: [], notes: '' },
      ],
    },
  },
  {
    kind: 'extras.board',
    entry_date: null,
    data: {
      name: 'Autumn reading',
      items: [
        { id: 'seed-b1', type: 'note', text: 'Rainy windows, candlelight and a dark academia mystery.', color: 'amber' },
        { id: 'seed-b2', type: 'sticker', sticker_id: 'slow-burn' },
        { id: 'seed-b3', type: 'sticker', sticker_id: 'five-star' },
        { id: 'seed-b4', type: 'note', text: 'Reread: Piranesi', color: 'sage' },
      ],
    },
  },
];
