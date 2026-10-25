// Props contract (from JournalShell):
//   userId     - signed-in user's id
//   books      - all user_books rows, already loaded once by the shell
//   booksApi   - useBooks() result: { books, loading, error, reload, addBook, updateBook, deleteBook, uploadCover }
//   openEditor - optional: openEditor(book) edits a book, openEditor(null, defaults) adds one
// Store feature data with useEntries('extras.<thing>') from src/hooks/useEntries.js.
import { useState } from 'react';
import { card, input, pill } from '../../lib/ui';
import MonthlyView from './MonthlyView';
import YearReview from './YearReview';
import BookClub from './BookClub';
import Budget from './Budget';
import Events from './Events';
import ContentPlanner from './ContentPlanner';
import BookBoard from './BookBoard';

const SECTIONS = [
  { key: 'monthly', label: 'Monthly', emoji: '🗓️', Component: MonthlyView },
  { key: 'year', label: 'Year in review', emoji: '🏆', Component: YearReview },
  { key: 'club', label: 'Book club', emoji: '☕', Component: BookClub },
  { key: 'budget', label: 'Budget', emoji: '💰', Component: Budget },
  { key: 'events', label: 'Events', emoji: '🎟️', Component: Events },
  { key: 'content', label: 'Content planner', emoji: '🎬', Component: ContentPlanner },
  { key: 'board', label: 'Book board', emoji: '🖼️', Component: BookBoard },
];

export default function ExtrasTab({ books = [], booksApi, openEditor = () => {} }) {
  const [section, setSection] = useState('monthly');
  const { Component } = SECTIONS.find((s) => s.key === section);

  return (
    <section className={`${card} font-sans space-y-5 min-w-0`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif text-xl text-cozy-text">
          <span aria-hidden="true">🧺</span> Extras
        </h2>
        <div className="sm:hidden w-full">
          <label htmlFor="extras-section" className="sr-only">Extras section</label>
          <select id="extras-section" className={input} value={section} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="hidden sm:flex gap-2 flex-wrap" role="group" aria-label="Extras sections">
        {SECTIONS.map((s) => (
          <button key={s.key} type="button" onClick={() => setSection(s.key)} aria-pressed={section === s.key} className={pill(section === s.key)}>
            <span aria-hidden="true">{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      <Component books={books} booksApi={booksApi} openEditor={openEditor} />
    </section>
  );
}
