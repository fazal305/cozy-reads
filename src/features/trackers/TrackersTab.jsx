// Props contract (from JournalShell):
//   userId     - signed-in user's id
//   books      - all user_books rows, already loaded once by the shell
//   booksApi   - useBooks() result: { books, loading, error, reload, addBook, updateBook, deleteBook, uploadCover }
//   openEditor - optional: openEditor(book) edits a book, openEditor(null, defaults) adds one
// Store feature data with useEntries('trackers.<thing>') from src/hooks/useEntries.js.
import { useState } from 'react';
import { card, input, pill } from '../../lib/ui';
import BooksReadLog from './BooksReadLog';
import ReadingLog from './ReadingLog';
import SeriesTracker from './SeriesTracker';
import DnfTracker from './DnfTracker';
import ArcTracker from './ArcTracker';
import AuthorCatalog from './AuthorCatalog';
import QuotesCollection from './QuotesCollection';
import HabitsTracker from './HabitsTracker';
import HaulTracker from './HaulTracker';

const SECTIONS = [
  { id: 'read', label: 'Books Read', icon: '✅', Component: BooksReadLog },
  { id: 'log', label: 'Daily Log', icon: '🗓️', Component: ReadingLog },
  { id: 'series', label: 'Series', icon: '🔗', Component: SeriesTracker },
  { id: 'dnf', label: 'DNF', icon: '🚪', Component: DnfTracker },
  { id: 'arc', label: 'ARCs', icon: '📬', Component: ArcTracker },
  { id: 'authors', label: 'Authors', icon: '✍️', Component: AuthorCatalog },
  { id: 'quotes', label: 'Quotes', icon: '💬', Component: QuotesCollection },
  { id: 'habits', label: 'Habits', icon: '📈', Component: HabitsTracker },
  { id: 'haul', label: 'Haul', icon: '🛍️', Component: HaulTracker },
];
const STORAGE_KEY = 'cozy-reads.trackers.section';

function savedSection() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return SECTIONS.some((s) => s.id === id) ? id : 'read';
  } catch {
    return 'read';
  }
}

export default function TrackersTab({ books, booksApi, openEditor }) {
  const [section, setSection] = useState(savedSection);
  const active = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const { Component } = active;

  const choose = (id) => {
    setSection(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // storage unavailable, keep the choice in memory only
    }
  };

  return (
    <section className={`${card} font-sans`} aria-labelledby="trackers-title">
      <h2 id="trackers-title" className="font-serif text-xl text-cozy-text flex items-center gap-2 mb-4">
        <span aria-hidden="true">📊</span> Trackers
      </h2>

      <div className="sm:hidden mb-5">
        <label htmlFor="trackers-section" className="sr-only">Tracker</label>
        <select id="trackers-section" className={input} value={section} onChange={(e) => choose(e.target.value)}>
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
          ))}
        </select>
      </div>
      <nav aria-label="Trackers" className="hidden sm:block mb-6">
        <ul className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => choose(s.id)} aria-current={s.id === section ? 'true' : undefined} className={pill(s.id === section)}>
                <span aria-hidden="true" className="mr-1">{s.icon}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Component key={active.id} books={books} booksApi={booksApi} openEditor={openEditor} />
    </section>
  );
}
