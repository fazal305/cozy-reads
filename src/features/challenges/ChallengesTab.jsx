// Props contract (from JournalShell):
//   userId     - signed-in user's id
//   books      - all user_books rows, already loaded once by the shell
//   booksApi   - useBooks() result: { books, loading, error, reload, addBook, updateBook, deleteBook, uploadCover }
//   openEditor - optional: openEditor(book) edits a book, openEditor(null, defaults) adds one
// Store feature data with useEntries('challenges.<thing>') from src/hooks/useEntries.js.
import { useState } from 'react';
import { card, input, pill } from '../../lib/ui';
import BookBingo from './BookBingo';
import AzChallenge from './AzChallenge';
import CountChallenge from './CountChallenge';
import BookBracket from './BookBracket';
import CustomChallenges from './CustomChallenges';

const SECTIONS = [
  { key: 'bingo', emoji: '🎯', label: 'Book Bingo', component: BookBingo },
  { key: 'az', emoji: '🔤', label: 'A–Z', component: AzChallenge },
  { key: 'count', emoji: '💯', label: 'Number challenge', component: CountChallenge },
  { key: 'bracket', emoji: '⚔️', label: 'Book Battle', component: BookBracket },
  { key: 'custom', emoji: '✏️', label: 'Custom', component: CustomChallenges },
];

export default function ChallengesTab({ books, openEditor }) {
  const [section, setSection] = useState('bingo');
  const active = SECTIONS.find((s) => s.key === section) || SECTIONS[0];
  const Section = active.component;

  return (
    <section className={`${card} font-sans space-y-5`}>
      <div>
        <h2 className="font-serif text-xl text-cozy-text">
          <span aria-hidden="true">🏆</span> Challenges
        </h2>
        <p className="text-cozy-muted text-sm mt-0.5">Bingo boards, alphabet hunts, reading goals and a battle for book of the year.</p>
      </div>

      <div className="hidden sm:flex gap-2 flex-wrap" role="group" aria-label="Challenge types">
        {SECTIONS.map((s) => (
          <button key={s.key} type="button" onClick={() => setSection(s.key)} aria-pressed={section === s.key} className={pill(section === s.key)}>
            <span aria-hidden="true">{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>
      <div className="sm:hidden">
        <label htmlFor="challenge-section" className="sr-only">Challenge type</label>
        <select id="challenge-section" className={input} value={section} onChange={(e) => setSection(e.target.value)}>
          {SECTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
          ))}
        </select>
      </div>

      <Section key={active.key} books={books} openEditor={openEditor} />
    </section>
  );
}
