// Dev-only in-memory backend with the same adapter shape as src/lib/backend.js.
// Wrap a tree in <JournalContext.Provider value={{ userId, backend: createMockBackend() }}>
// and useBooks()/useEntries(kind) return exactly what they return against Supabase.
import { useState, useCallback } from 'react';
import { currentMonth } from '../lib/bookMeta';
import { TRACKERS_SEED_ENTRIES } from '../features/trackers/demoSeed';
import { CHALLENGES_SEED_ENTRIES } from '../features/challenges/demoSeed';
import { EXTRAS_SEED_ENTRIES } from '../features/extras/demoSeed';

export const DEMO_USER = { id: 'demo-user', email: 'reader@example.test' };

const year = new Date().getFullYear();
const month = currentMonth();

const SEED_BOOKS = [
  { title: 'Fourth Wing', author: 'Rebecca Yarros', status: 'read', genre: 'Romantasy', pages: 517, format: 'owned', rating: 5, spice: 3, mood: 'swoon', favorite: true, review_done: true, tropes: ['Enemies to Lovers', 'Magic Academy'], series_name: 'The Empyrean', series_number: 1, start_date: `${year}-01-04`, finish_date: `${year}-01-12`, review: 'Dragons, banter and a war college. Could not put it down.', quotes: ['Fly or die.'] },
  { title: 'Iron Flame', author: 'Rebecca Yarros', status: 'read', genre: 'Romantasy', pages: 623, format: 'ebook', rating: 4, spice: 3, mood: 'shocked', tropes: ['Found Family'], series_name: 'The Empyrean', series_number: 2, start_date: `${year}-02-01`, finish_date: `${year}-02-15` },
  { title: 'Book Lovers', author: 'Emily Henry', status: 'read', genre: 'Romance', pages: 373, format: 'library', rating: 5, spice: 2, mood: 'funny', tropes: ['Grumpy / Sunshine'], start_date: `${year}-03-02`, finish_date: `${year}-03-08`, review: 'Witty and warm.' },
  { title: 'The Silent Patient', author: 'Alex Michaelides', status: 'read', genre: 'Thriller', pages: 336, format: 'audiobook', rating: 4, spice: 0, mood: 'shocked', finish_date: `${year}-04-20` },
  { title: 'Piranesi', author: 'Susanna Clarke', status: 'read', genre: 'Fantasy', pages: 272, format: 'gifted', rating: 5, spice: 0, mood: 'thoughtful', favorite: true, finish_date: `${year}-05-11` },
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', status: 'reading', genre: 'Romantasy', pages: 419, format: 'owned', start_date: `${year}-10-10`, tropes: ['Fae Courts'] },
  { title: 'The Thursday Murder Club', author: 'Richard Osman', status: 'reading', genre: 'Mystery', pages: 382, format: 'borrowed', start_date: `${year}-10-18` },
  { title: 'Babel', author: 'R. F. Kuang', status: 'tbr', genre: 'Fantasy', pages: 545, season: 'autumn', extra: { order: 0, month } },
  { title: 'Happy Place', author: 'Emily Henry', status: 'tbr', genre: 'Romance', pages: 400, season: 'summer', extra: { order: 1 } },
  { title: 'The Starless Sea', author: 'Erin Morgenstern', status: 'tbr', genre: 'Fantasy', pages: 498, season: 'winter', extra: { order: 2 } },
  { title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', status: 'tbr', genre: 'Horror', pages: 301, season: 'autumn', format: 'arc', extra: { order: 3, arc_publisher: 'Del Rey', arc_due: `${year}-11-30` } },
  { title: 'The Midnight Library', author: 'Matt Haig', status: 'dnf', genre: 'Literary', pages: 304, rating: 2, dnf_progress: 'page 90', dnf_reason: 'Not the right time for it.' },
  { title: 'Funny Story', author: 'Emily Henry', status: 'wishlist', genre: 'Romance', extra: { price: 18.99 } },
];

const BOOK_DEFAULTS = {
  author: '',
  cover_url: '',
  rating: null,
  summary: '',
  quotes: [],
  status: 'read',
  genre: null,
  pages: null,
  format: null,
  start_date: null,
  finish_date: null,
  spice: null,
  mood: null,
  review: '',
  review_done: false,
  favorite: false,
  tropes: [],
  series_name: null,
  series_number: null,
  season: null,
  dnf_reason: null,
  dnf_progress: null,
  extra: {},
};

const SEED_ENTRIES = [...TRACKERS_SEED_ENTRIES, ...CHALLENGES_SEED_ENTRIES, ...EXTRAS_SEED_ENTRIES];

let counter = 0;
const newId = () => `mock-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const stamp = () => new Date().toISOString();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const copy = (value) => structuredClone(value);

export function createMockBackend({ userId = DEMO_USER.id, delay = 120, seed = true } = {}) {
  let books = (seed ? SEED_BOOKS : []).map((b, i) => {
    const created = new Date(Date.now() - (SEED_BOOKS.length - i) * 86400000).toISOString();
    return { ...BOOK_DEFAULTS, ...b, id: newId(), user_id: userId, created_at: created, updated_at: created };
  });
  let entries = (seed ? SEED_ENTRIES : []).map((e) => ({ ...e, id: newId(), user_id: userId, created_at: stamp(), updated_at: stamp() }));

  const ok = async (data) => {
    await wait(delay);
    return { data: copy(data), error: null };
  };
  const missing = async () => {
    await wait(delay);
    return { data: null, error: { message: 'Row not found' } };
  };

  return {
    books: {
      list: () => ok([...books].sort((a, b) => b.created_at.localeCompare(a.created_at))),
      insert: (uid, row) => {
        const book = { ...BOOK_DEFAULTS, ...row, id: newId(), user_id: uid, created_at: stamp(), updated_at: stamp() };
        books = [book, ...books];
        return ok(book);
      },
      update: (uid, id, patch) => {
        const current = books.find((b) => b.id === id && b.user_id === uid);
        if (!current) return missing();
        const next = { ...current, ...patch, updated_at: stamp() };
        books = books.map((b) => (b.id === id ? next : b));
        return ok(next);
      },
      remove: (uid, id) => {
        books = books.filter((b) => !(b.id === id && b.user_id === uid));
        return ok(null);
      },
      uploadCover: async (_uid, file) => {
        const data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        return { data, error: null };
      },
    },
    entries: {
      list: (uid, kind) =>
        ok(
          entries
            .filter((e) => e.user_id === uid && e.kind === kind)
            .sort((a, b) => String(b.entry_date || '').localeCompare(String(a.entry_date || '')) || b.created_at.localeCompare(a.created_at)),
        ),
      insert: (uid, row) => {
        const entry = { data: {}, entry_date: null, ...row, id: newId(), user_id: uid, created_at: stamp(), updated_at: stamp() };
        entries = [entry, ...entries];
        return ok(entry);
      },
      update: (uid, id, patch) => {
        const current = entries.find((e) => e.id === id && e.user_id === uid);
        if (!current) return missing();
        const next = { ...current, ...patch, updated_at: stamp() };
        entries = entries.map((e) => (e.id === id ? next : e));
        return ok(next);
      },
      remove: (uid, id) => {
        entries = entries.filter((e) => !(e.id === id && e.user_id === uid));
        return ok(null);
      },
    },
  };
}

// Same return shape as useReadingGoal(userId).
export function useMockReadingGoal() {
  const [goal, setGoal] = useState({
    id: 'mock-goal',
    user_id: DEMO_USER.id,
    target_year: year,
    books_challenge_type: 24,
    books_read_count: 5,
    favorite_tropes: ['Enemies to Lovers', 'Found Family'],
  });

  const logBook = useCallback(async () => {
    setGoal((g) => ({ ...g, books_read_count: g.books_read_count + 1 }));
    return { error: null };
  }, []);
  const updateChallenge = useCallback(async (target) => setGoal((g) => ({ ...g, books_challenge_type: target })), []);
  const updateTropes = useCallback((tropes) => setGoal((g) => ({ ...g, favorite_tropes: tropes })), []);

  return { goal, loading: false, error: null, logBook, updateChallenge, updateTropes, refetch: () => {} };
}
