import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { FORMATS, readYear } from '../../lib/bookMeta';
import { input, primaryButton } from '../../lib/ui';
import { BookSelect, Empty, ErrorNote, Field, Heading, Panel } from './shared';
import { plural, useRunner } from './utils';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function Stat({ label, value }) {
  return (
    <div className="bg-cozy-paper rounded-xl border border-cozy-primary/60 p-3 text-center min-w-0">
      <p className="font-serif text-xl sm:text-2xl text-cozy-text truncate">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-cozy-muted mt-0.5">{label}</p>
    </div>
  );
}

function countBy(list, pick) {
  const counts = new Map();
  list.forEach((item) => {
    [].concat(pick(item) ?? []).forEach((key) => {
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function SplitBars({ title, rows, total }) {
  return (
    <Panel>
      <h4 className="font-serif text-base text-cozy-text mb-3">{title}</h4>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="text-xs">
              <div className="flex justify-between gap-2 text-cozy-text">
                <span className="truncate">{row.label}</span>
                <span className="text-cozy-muted shrink-0">{row.count} · {Math.round((row.count / total) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-cozy-primary/30 mt-1 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-cozy-accent" style={{ width: `${(row.count / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cozy-muted italic">Nothing logged yet.</p>
      )}
    </Panel>
  );
}

function BookLine({ book, onOpen, detail }) {
  return (
    <button type="button" onClick={() => onOpen(book)} className="flex items-center gap-3 text-left group min-w-0 w-full">
      <BookCover book={book} className="w-10 h-14 shrink-0" />
      <span className="min-w-0">
        <span className="block font-serif text-sm text-cozy-text truncate group-hover:text-cozy-accent-ink">{book.title}</span>
        <span className="block text-xs text-cozy-muted truncate">{detail}</span>
      </span>
    </button>
  );
}

function BookOfYear({ year, read, entry, onSave, onOpen }) {
  const [bookId, setBookId] = useState(entry?.data?.book_id || '');
  const [note, setNote] = useState(entry?.data?.note || '');
  const [busy, setBusy] = useState(false);
  const chosen = read.find((b) => b.id === (entry?.data?.book_id || ''));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSave({ book_id: bookId, note });
    setBusy(false);
  };

  return (
    <Panel className="space-y-3">
      <h4 className="font-serif text-base text-cozy-text"><span aria-hidden="true">🏆</span> Book of the year</h4>
      {chosen && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-cozy-paper border border-cozy-accent/60">
          <button type="button" onClick={() => onOpen(chosen)} aria-label={`Open ${chosen.title}`}>
            <BookCover book={chosen} className="w-16 h-24 shrink-0" />
          </button>
          <div className="min-w-0">
            <p className="font-serif text-base text-cozy-text truncate">{chosen.title}</p>
            <p className="text-xs text-cozy-muted truncate">{chosen.author}</p>
            {entry.data.note && <p className="text-sm text-cozy-text mt-1 whitespace-pre-line break-words">{entry.data.note}</p>}
          </div>
        </div>
      )}
      {read.length ? (
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Field label="Pick" id="boty-book">
            <BookSelect id="boty-book" books={read} value={bookId} onChange={setBookId} placeholder="Choose a book…" />
          </Field>
          <Field label="Why it won" id="boty-note">
            <input id="boty-note" className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="It lived in my head all year" />
          </Field>
          <button type="submit" disabled={busy || !bookId} className={primaryButton}>Save pick</button>
        </form>
      ) : (
        <p className="text-sm text-cozy-muted italic">Finish a book in {year} to pick your favourite.</p>
      )}
    </Panel>
  );
}

export default function YearReview({ books, openEditor }) {
  const years = [...new Set([CURRENT_YEAR, ...books.filter((b) => b.status === 'read').map(readYear).filter(Boolean)])].sort((a, b) => b - a);
  const [year, setYear] = useState(CURRENT_YEAR);
  const reviews = useEntries('extras.year_review');
  const { error, run } = useRunner();

  const read = books.filter((b) => b.status === 'read' && readYear(b) === year);
  const dnf = books.filter((b) => b.status === 'dnf' && readYear(b) === year).length;
  const pages = read.reduce((sum, b) => sum + (Number(b.pages) || 0), 0);
  const rated = read.filter((b) => b.rating).sort((a, b) => b.rating - a.rating || Number(b.favorite) - Number(a.favorite));
  const avg = rated.length ? `${(rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length).toFixed(1)}★` : '–';
  const fiveStars = read.filter((b) => Number(b.rating) === 5);
  const paged = read.filter((b) => Number(b.pages) > 0).sort((a, b) => b.pages - a.pages);
  const spiced = read.filter((b) => b.spice !== null && b.spice !== undefined);
  const spiceAvg = spiced.length ? (spiced.reduce((sum, b) => sum + Number(b.spice), 0) / spiced.length).toFixed(1) : null;
  const genres = countBy(read, (b) => b.genre);
  const formats = countBy(read, (b) => FORMATS.find((f) => f.key === b.format)?.label || b.format);
  const tropes = countBy(read, (b) => b.tropes).slice(0, 8);
  const months = MONTHS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const list = read.filter((b) => String(b.finish_date || b.created_at || '').startsWith(key));
    return { label, key, count: list.length, pages: list.reduce((sum, b) => sum + (Number(b.pages) || 0), 0) };
  });
  const peak = Math.max(1, ...months.map((m) => m.count));
  const review = reviews.entries.find((e) => Number(e.data?.year) === year);

  const savePick = (patch) =>
    run(review
      ? reviews.update(review.id, { data: { ...review.data, ...patch } })
      : reviews.add({ data: { year, ...patch }, entry_date: `${year}-01-01` }));

  return (
    <div className="space-y-5">
      <Heading title={`${year} in review`} subtitle={`${plural(read.length, 'book')} finished`}>
        <div className="flex items-center gap-2">
          <label htmlFor="review-year" className="text-xs font-medium text-cozy-text">Year</label>
          <select id="review-year" className={`${input} w-auto`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </Heading>
      <ErrorNote error={error || reviews.error} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <Stat label="Books" value={read.length} />
        <Stat label="Pages" value={pages.toLocaleString()} />
        <Stat label="Avg rating" value={avg} />
        <Stat label="Spice avg" value={spiceAvg ? `${spiceAvg} 🌶️` : '–'} />
        <Stat label="DNF" value={dnf} />
      </div>

      {read.length === 0 ? (
        <Empty>No finished books in {year} yet.</Empty>
      ) : (
        <>
          <Panel>
            <h4 className="font-serif text-base text-cozy-text mb-3">Month by month</h4>
            <div className="flex items-end gap-1 sm:gap-2 h-36" role="list" aria-label={`Books finished per month in ${year}`}>
              {months.map((m) => (
                <div key={m.key} role="listitem" className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1" title={`${m.count} books · ${m.pages} pages`}>
                  <span className="text-[10px] text-cozy-muted">{m.count || ''}</span>
                  <div className="w-full flex-1 flex items-end justify-center" aria-hidden="true">
                    <div className="w-full max-w-[2rem] rounded-t-md bg-cozy-accent/80" style={{ height: `${(m.count / peak) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-cozy-muted" aria-hidden="true">{m.label}</span>
                  <span className="sr-only">{new Date(year, Number(m.key.slice(5)) - 1, 1).toLocaleDateString(undefined, { month: 'long' })}: {m.count} books, {m.pages} pages</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel>
              <h4 className="font-serif text-base text-cozy-text mb-3">Top rated</h4>
              {rated.length ? (
                <ol className="space-y-2">
                  {rated.slice(0, 5).map((book) => (
                    <li key={book.id}><BookLine book={book} onOpen={openEditor} detail={`${'★'.repeat(Math.round(book.rating))}${book.favorite ? ' · ❤' : ''}`} /></li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-cozy-muted italic">No ratings yet.</p>
              )}
            </Panel>
            <Panel>
              <h4 className="font-serif text-base text-cozy-text mb-3">5-star reads <span className="text-xs font-sans text-cozy-muted">{fiveStars.length}</span></h4>
              {fiveStars.length ? (
                <ul className="flex gap-2 flex-wrap">
                  {fiveStars.map((book) => (
                    <li key={book.id}>
                      <button type="button" onClick={() => openEditor(book)} aria-label={`Open ${book.title}`}>
                        <BookCover book={book} className="w-14 h-20" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-cozy-muted italic">No 5-star reads yet.</p>
              )}
            </Panel>
            <Panel>
              <h4 className="font-serif text-base text-cozy-text mb-3">Longest and shortest</h4>
              {paged.length ? (
                <div className="space-y-2">
                  <BookLine book={paged[0]} onOpen={openEditor} detail={`Longest · ${paged[0].pages} pages`} />
                  {paged.length > 1 && <BookLine book={paged[paged.length - 1]} onOpen={openEditor} detail={`Shortest · ${paged[paged.length - 1].pages} pages`} />}
                </div>
              ) : (
                <p className="text-sm text-cozy-muted italic">Add page counts to compare.</p>
              )}
            </Panel>
            <Panel>
              <h4 className="font-serif text-base text-cozy-text mb-3">Favourite tropes</h4>
              {tropes.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {tropes.map((t) => (
                    <li key={t.label} className="text-xs px-2 py-1 rounded-full bg-cozy-paper border border-cozy-primary/60 text-cozy-text">
                      {t.label} <span className="text-cozy-muted">× {t.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-cozy-muted italic">No tropes tagged.</p>
              )}
            </Panel>
            <SplitBars title="Genres" rows={genres} total={read.length} />
            <SplitBars title="Formats" rows={formats} total={read.length} />
          </div>
        </>
      )}

      {!reviews.loading && (
        <BookOfYear key={year} year={year} read={read} entry={review} onSave={savePick} onOpen={openEditor} />
      )}
    </div>
  );
}
