import { useState } from 'react';
import { FORMATS, readYear, today } from '../../lib/bookMeta';
import { input } from '../../lib/ui';
import { SectionTitle, Empty, Stat, BarList } from './parts';
import { monthLabel } from './trackerUtils';

function countBy(list, keyOf, labelOf = (k) => k) {
  const counts = {};
  list.forEach((item) => {
    const key = keyOf(item);
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, value]) => ({ key, label: labelOf(key), value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-cozy-border p-3 sm:p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-cozy-muted mb-3">{title}</h4>
      {children}
    </section>
  );
}

export default function HabitsTracker({ books }) {
  const read = books.filter((b) => b.status === 'read');
  const years = [...new Set(read.map(readYear).filter(Boolean))].sort((a, b) => b - a);
  const thisYear = Number(today().slice(0, 4));
  const [picked, setYear] = useState(null);
  const year = picked ?? String(years.includes(thisYear) ? thisYear : years[0] || thisYear);

  const inYear = read.filter((b) => readYear(b) === Number(year));
  const pagesTotal = inYear.reduce((s, b) => s + (Number(b.pages) || 0), 0);
  const genres = countBy(inYear, (b) => b.genre?.trim());
  const formats = countBy(inYear, (b) => b.format, (k) => FORMATS.find((f) => f.key === k)?.label || k);
  const unknownFormat = inYear.filter((b) => !b.format).length;
  if (unknownFormat) formats.push({ key: 'none', label: 'Not set', value: unknownFormat });

  const months = Array.from({ length: 12 }, (_, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`;
    const list = inYear.filter((b) => String(b.finish_date || b.created_at || '').startsWith(ym));
    return { ym, books: list.length, pages: list.reduce((s, b) => s + (Number(b.pages) || 0), 0) };
  });
  const maxPages = Math.max(1, ...months.map((m) => m.pages));

  return (
    <div>
      <SectionTitle icon="📈" title="Genres & reading habits" subtitle="What, how and how much you read.">
        <select aria-label="Year" className={`${input} !w-auto`} value={year} onChange={(e) => setYear(e.target.value)}>
          {(years.includes(Number(year)) ? years : [Number(year), ...years]).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </SectionTitle>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Books read" value={inYear.length} />
        <Stat label="Pages" value={pagesTotal.toLocaleString()} />
        <Stat label="Avg. length" value={inYear.length ? Math.round(pagesTotal / inYear.length) : '–'} />
      </div>

      {inYear.length === 0 ? (
        <Empty>No finished books in {year} yet.</Empty>
      ) : (
        <div className="space-y-3">
          <Panel title={`Pages by month · ${year}`}>
            <ol className="grid grid-cols-12 gap-1 h-40 items-end" aria-label={`Pages read each month in ${year}`}>
              {months.map((m) => {
                const label = `${monthLabel(m.ym)}: ${m.pages} pages, ${m.books} ${m.books === 1 ? 'book' : 'books'}`;
                return (
                  <li key={m.ym} className="h-full flex flex-col items-center gap-1 min-w-0" title={label}>
                    <span className="sr-only">{label}</span>
                    <span className="flex-1 w-full flex flex-col justify-end items-center gap-0.5" aria-hidden="true">
                      <span className="text-[9px] text-cozy-muted tabular-nums">{m.books || ''}</span>
                      <span
                        className={`w-full rounded-t-md ${m.pages ? 'bg-cozy-accent' : 'bg-cozy-border'}`}
                        style={{ height: m.pages ? `${Math.max(4, (m.pages / maxPages) * 85)}%` : '2px' }}
                      />
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-cozy-muted" aria-hidden="true">{monthLabel(m.ym, false).slice(0, 1)}</span>
                  </li>
                );
              })}
            </ol>
            <p className="text-[11px] text-cozy-muted mt-2">Bar height is pages; the number on top is books finished.</p>
          </Panel>
          <div className="grid sm:grid-cols-2 gap-3">
            <Panel title="Genres">
              {genres.length ? <BarList rows={genres} unit="books" /> : <p className="text-xs text-cozy-muted">No genres set.</p>}
            </Panel>
            <Panel title="Formats">
              <BarList rows={formats} unit="books" />
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
