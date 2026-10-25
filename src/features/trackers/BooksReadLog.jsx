import { useState } from 'react';
import { readYear, today } from '../../lib/bookMeta';
import { input, primaryButton } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Stars, Switch } from './parts';
import { formatDate, useRunner } from './trackerUtils';

const SHORT = { day: 'numeric', month: 'short' };

function finishKey(book) {
  return String(book.finish_date || book.created_at || '');
}

export default function BooksReadLog({ books, booksApi, openEditor }) {
  const read = books.filter((b) => b.status === 'read');
  const years = [...new Set(read.map(readYear).filter(Boolean))].sort((a, b) => b - a);
  const thisYear = Number(today().slice(0, 4));
  const [picked, setYear] = useState(null);
  const year = picked ?? (years.includes(thisYear) ? String(thisYear) : 'all');
  const { error, run } = useRunner();

  const rows = read
    .filter((b) => year === 'all' || readYear(b) === Number(year))
    .sort((a, b) => finishKey(a).localeCompare(finishKey(b)));
  const reviewed = rows.filter((b) => b.review_done).length;

  return (
    <div>
      <SectionTitle
        icon="✅"
        title="Books Read log"
        subtitle={`${rows.length} ${rows.length === 1 ? 'book' : 'books'} · ${reviewed} reviewed`}
      >
        <select aria-label="Filter by year" className={`${input} !w-auto`} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" className={primaryButton} onClick={() => openEditor(null, { status: 'read' })}>
          + Log a read
        </button>
      </SectionTitle>
      <ErrorNote error={error} />

      {rows.length === 0 ? (
        <Empty>No finished books {year === 'all' ? 'yet' : `in ${year}`}. Mark a book as read to see it here.</Empty>
      ) : (
        <div className="rounded-2xl border border-cozy-border overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Books read{year === 'all' ? '' : ` in ${year}`}</caption>
            <thead className="bg-cozy-bg text-[11px] uppercase tracking-wide text-cozy-muted">
              <tr>
                <th scope="col" className="w-8 py-2 pl-3 text-left font-medium">#</th>
                <th scope="col" className="py-2 px-2 text-left font-medium">Book</th>
                <th scope="col" className="hidden sm:table-cell w-36 py-2 px-2 text-left font-medium">Dates</th>
                <th scope="col" className="w-[4.5rem] py-2 px-2 text-left font-medium">Stars</th>
                <th scope="col" className="w-16 py-2 pr-3 text-right font-medium">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cozy-border">
              {rows.map((book, i) => {
                const dates = [formatDate(book.start_date, SHORT), formatDate(book.finish_date, SHORT)].filter(Boolean).join(' – ');
                return (
                  <tr key={book.id} className="align-top">
                    <td className="py-2.5 pl-3 text-cozy-muted tabular-nums">{i + 1}</td>
                    <td className="py-2.5 px-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => openEditor(book)}
                        className="block max-w-full text-left font-medium text-cozy-text hover:text-cozy-accent-ink truncate"
                        title={book.title}
                      >
                        {book.title}
                      </button>
                      {book.author && <p className="text-xs text-cozy-muted truncate">{book.author}</p>}
                      {dates && <p className="sm:hidden text-[11px] text-cozy-muted truncate">{dates}</p>}
                    </td>
                    <td className="hidden sm:table-cell py-2.5 px-2 text-xs text-cozy-muted">{dates || '–'}</td>
                    <td className="py-2.5 px-2"><Stars value={book.rating} /></td>
                    <td className="py-2.5 pr-3 text-right">
                      <Switch
                        checked={Boolean(book.review_done)}
                        label={`Review done for ${book.title}`}
                        onChange={(next) => run(booksApi.updateBook(book.id, { review_done: next }))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
