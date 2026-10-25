import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { input, pill, softButton } from '../../lib/ui';
import { ErrorNote, ProgressRing, YearSelect } from './shared';
import { CURRENT_YEAR, finishStamp, readInYear, DAY_OF_YEAR } from './challengeUtils';

const PRESETS = [25, 50, 100];
const MAX_TARGET = 500;

export default function CountChallenge({ books, openEditor }) {
  const { entries, add, update } = useEntries('challenges.count');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');

  const entry = entries.find((e) => e.data?.year === year);
  const target = entry?.data?.target || 50;
  const read = readInYear(books, year);
  const extra = Math.max(0, read.length - target);

  const setTarget = async (value) => {
    const next = Math.round(Number(value));
    if (!next || next < 1 || next > MAX_TARGET) {
      setError(`Pick a target between 1 and ${MAX_TARGET}.`);
      return;
    }
    setError('');
    const data = { ...(entry?.data || {}), year, target: next };
    const result = entry ? await update(entry.id, { data }) : await add({ entry_date: `${year}-01-01`, data });
    if (result.error) setError(result.error);
    else setCustom('');
  };

  const cols = target <= 25 ? 'grid-cols-5' : 'grid-cols-10';
  const pace = (() => {
    if (year !== CURRENT_YEAR) return null;
    const expected = Math.floor((target * DAY_OF_YEAR) / 365);
    const diff = read.length - expected;
    return diff >= 0 ? `${diff} ahead of pace` : `${-diff} behind pace`;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <ProgressRing value={read.length} max={target} label={`${read.length} of ${target} books read in ${year}`} />
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-serif text-lg text-cozy-text">{target} books in {year}</h3>
          <p className="text-sm text-cozy-muted">
            {read.length >= target ? `🎉 Challenge complete${extra ? `, plus ${extra} bonus` : ''}!` : `${target - read.length} to go`}
            {pace && read.length < target ? ` · ${pace}` : ''}
          </p>
        </div>
        <YearSelect id="count-year" value={year} onChange={setYear} books={books} />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Challenge target">
        {PRESETS.map((n) => (
          <button key={n} type="button" aria-pressed={target === n} className={pill(target === n)} onClick={() => setTarget(n)}>
            {n} books
          </button>
        ))}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTarget(custom);
          }}
        >
          <input
            type="number"
            min="1"
            max={MAX_TARGET}
            aria-label="Custom target"
            placeholder="Custom"
            className={`${input.replace('w-full ', '')} w-24`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button type="submit" className={softButton} disabled={!custom}>Set</button>
        </form>
      </div>
      <ErrorNote message={error} />

      <ol className={`grid ${cols} gap-1 sm:gap-1.5`} aria-label={`${target} book grid`}>
        {Array.from({ length: target }, (_, i) => {
          const book = read[i];
          return (
            <li key={i} className="aspect-[2/3]">
              {book ? (
                <button
                  type="button"
                  onClick={() => openEditor?.(book)}
                  aria-label={`Book ${i + 1}: ${book.title}, finished ${finishStamp(book)}`}
                  title={book.title}
                  className="relative block w-full h-full rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-accent"
                >
                  <span className="absolute inset-0">
                    <BookCover book={book} className="w-full h-full [&_span+span]:hidden" />
                  </span>
                  <span className="absolute top-0 left-0 bg-cozy-accent text-white text-[8px] sm:text-[10px] font-semibold px-1 rounded-br-md">{i + 1}</span>
                </button>
              ) : (
                <span role="img" className="flex w-full h-full items-center justify-center rounded-md border border-dashed border-cozy-primary text-[9px] sm:text-xs text-cozy-muted" aria-label={`Book ${i + 1}: not read yet`}>
                  {i + 1}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {extra > 0 && <p className="text-xs text-cozy-muted">+{extra} more read beyond the target.</p>}
    </div>
  );
}
