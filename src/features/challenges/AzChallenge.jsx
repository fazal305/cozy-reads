import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { softButton } from '../../lib/ui';
import { BookList, ErrorNote, Modal, ProgressBar, YearSelect } from './shared';
import { CURRENT_YEAR, bookRef, findBook, readInYear } from './challengeUtils';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function startsWith(book, letter) {
  const title = String(book.title || '').trim().toUpperCase();
  const bare = title.replace(/^(THE|AN|A)\s+/, '');
  return title.startsWith(letter) || bare.startsWith(letter);
}

function assign(pool, pins, books) {
  const used = new Set();
  const result = {};
  LETTERS.forEach((letter) => {
    const pinned = findBook(books, pins?.[letter]);
    if (pinned) {
      result[letter] = { book: pinned, pinned: true };
      used.add(pinned.id);
    }
  });
  LETTERS.forEach((letter) => {
    if (result[letter]) return;
    const book = pool.find((b) => !used.has(b.id) && startsWith(b, letter));
    if (book) {
      result[letter] = { book, pinned: false };
      used.add(book.id);
    }
  });
  return result;
}

export default function AzChallenge({ books, openEditor }) {
  const { entries, add, update } = useEntries('challenges.az');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [letter, setLetter] = useState(null);
  const [error, setError] = useState('');

  const entry = entries.find((e) => e.data?.year === year);
  const pins = entry?.data?.pins || {};
  const pool = readInYear(books, year);
  const slots = assign(pool, pins, books);
  const done = Object.keys(slots).length;

  const savePins = async (next) => {
    setError('');
    const data = { ...(entry?.data || {}), year, pins: next };
    const result = entry ? await update(entry.id, { data }) : await add({ entry_date: year === 'all' ? null : `${year}-01-01`, data });
    if (result.error) setError(result.error);
  };

  const pin = async (book) => {
    await savePins({ ...pins, [letter]: bookRef(book) });
    setLetter(null);
  };

  const unpin = async () => {
    const next = { ...pins };
    delete next[letter];
    await savePins(next);
    setLetter(null);
  };

  const current = letter && slots[letter];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-cozy-muted max-w-md">
          Read a book for every letter. Titles are matched automatically (ignoring “The”, “A” and “An”); tap a tile to pin your pick.
        </p>
        <YearSelect id="az-year" value={year} onChange={setYear} books={books} allowAll />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-cozy-text">{done} of 26 letters</span>
          <span className="text-cozy-muted">{done === 26 ? '🎉 Alphabet complete!' : `${26 - done} to go`}</span>
        </div>
        <ProgressBar value={done} max={26} label="A to Z progress" />
      </div>

      <ul className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {LETTERS.map((l) => {
          const slot = slots[l];
          return (
            <li key={l}>
              <button
                type="button"
                onClick={() => setLetter(l)}
                aria-label={`Letter ${l}: ${slot ? `${slot.book.title}${slot.pinned ? ', pinned' : ', suggested'}` : 'no book yet'}`}
                className={`w-full h-full flex flex-col items-center gap-1 p-1.5 rounded-xl border transition text-center ${
                  slot ? 'border-cozy-accent/70 bg-cozy-accent/10' : 'border-cozy-primary/60 bg-cozy-bg hover:border-cozy-accent'
                }`}
              >
                <span className="flex items-center gap-1 font-serif text-lg text-cozy-text leading-none">
                  {l}
                  {slot?.pinned && <span className="text-[10px]" aria-hidden="true">📌</span>}
                </span>
                {slot ? (
                  <>
                    <BookCover book={slot.book} className="w-full aspect-[2/3] [&_span+span]:hidden" />
                    <span className="text-[10px] text-cozy-text leading-tight line-clamp-2 w-full break-words">{slot.book.title}</span>
                  </>
                ) : (
                  <span className="w-full aspect-[2/3] rounded-lg border border-dashed border-cozy-primary flex items-center justify-center text-cozy-muted text-lg" aria-hidden="true">
                    +
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <ErrorNote message={error} />

      {letter && (
        <Modal labelId="az-title" eyebrow={`A–Z · ${year === 'all' ? 'All time' : year}`} title={`Letter ${letter}`} onClose={() => setLetter(null)}>
          {current && (
            <p className="text-sm text-cozy-muted">
              {current.pinned ? 'Pinned' : 'Suggested'}: <span className="text-cozy-text font-medium">{current.book.title}</span>
            </p>
          )}
          {current?.pinned && (
            <button type="button" className={softButton} onClick={unpin}>Unpin and use the suggestion</button>
          )}
          <BookList
            books={pool}
            selectedId={current?.pinned ? current.book.id : null}
            suggested={pool.filter((b) => startsWith(b, letter))}
            onPick={pin}
            openEditor={openEditor}
            onClose={() => setLetter(null)}
            emptyText={`No read books ${year === 'all' ? 'yet' : `in ${year}`}.`}
          />
        </Modal>
      )}
    </div>
  );
}
