import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today, currentMonth } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Stat, Field } from './parts';
import { formatDate, monthLabel, shiftMonth, streaks, useRunner } from './trackerUtils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function amountOf(entry) {
  return { pages: Number(entry.data?.pages) || 0, minutes: Number(entry.data?.minutes) || 0 };
}

function describe(totals) {
  const parts = [];
  if (totals.pages) parts.push(`${totals.pages} pages`);
  if (totals.minutes) parts.push(`${totals.minutes} min`);
  return parts.join(' · ') || 'logged';
}

export default function ReadingLog({ books }) {
  const { entries, loading, error: loadError, add, remove } = useEntries('trackers.reading_log');
  const { error, run } = useRunner();
  const candidates = books
    .filter((b) => b.status === 'reading' || b.status === 'read')
    .sort((a, b) => (a.status === b.status ? a.title.localeCompare(b.title) : a.status === 'reading' ? -1 : 1));

  const [date, setDate] = useState(today());
  const [bookId, setBookId] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('pages');
  const [month, setMonth] = useState(currentMonth());

  const todayYmd = today();
  const { current, longest } = streaks(entries.map((e) => e.entry_date), todayYmd);

  const byDay = {};
  entries.forEach((e) => {
    if (!e.entry_date) return;
    const key = e.entry_date.slice(0, 10);
    const t = byDay[key] || { pages: 0, minutes: 0 };
    const a = amountOf(e);
    byDay[key] = { pages: t.pages + a.pages, minutes: t.minutes + a.minutes };
  });

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const intensity = (totals) => totals.pages + totals.minutes;
  const maxDay = Math.max(1, ...monthDays.map((d) => (byDay[d] ? intensity(byDay[d]) : 0)));
  const monthEntries = entries
    .filter((e) => e.entry_date?.startsWith(month))
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const monthTotals = monthEntries.reduce((t, e) => {
    const a = amountOf(e);
    return { pages: t.pages + a.pages, minutes: t.minutes + a.minutes };
  }, { pages: 0, minutes: 0 });

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!date || !(value > 0)) return;
    const book = books.find((b) => b.id === bookId);
    const data = { [unit]: Math.round(value) };
    if (book) {
      data.book_id = book.id;
      data.book_title = book.title;
    }
    const result = await run(add({ entry_date: date, data }));
    if (!result.error) setAmount('');
  };

  return (
    <div>
      <SectionTitle icon="🗓️" title="Daily Reading Log" subtitle="Log pages or minutes each day and keep your streak going." />
      <ErrorNote error={error || loadError} />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Streak" value={`${current} ${current === 1 ? 'day' : 'days'}`} />
        <Stat label="Best streak" value={`${longest} ${longest === 1 ? 'day' : 'days'}`} />
        <Stat label="Days logged" value={Object.keys(byDay).length} />
      </div>

      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-[9.5rem_1fr_5.5rem_7rem_auto] gap-2 items-end mb-5">
        <Field label="Date" htmlFor="rl-date">
          <input id="rl-date" type="date" className={input} value={date} max={todayYmd} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Book" htmlFor="rl-book" className="col-span-2 sm:col-span-1 order-first sm:order-none">
          <select id="rl-book" className={input} value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">No book picked</option>
            {candidates.map((b) => (
              <option key={b.id} value={b.id}>{b.status === 'reading' ? '📖 ' : ''}{b.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount" htmlFor="rl-amount">
          <input id="rl-amount" type="number" min="1" step="1" inputMode="numeric" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="30" required />
        </Field>
        <Field label="Unit" htmlFor="rl-unit">
          <select id="rl-unit" className={input} value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="pages">Pages</option>
            <option value="minutes">Minutes</option>
          </select>
        </Field>
        <button type="submit" className={`${primaryButton} py-2.5 col-span-1`}>Log it</button>
      </form>

      <div className="rounded-2xl border border-cozy-border p-3 sm:p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button type="button" className={softButton} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">‹</button>
          <p className="font-serif text-cozy-text text-sm sm:text-base text-center" aria-live="polite">
            {monthLabel(month)}
            <span className="block text-[11px] font-sans text-cozy-muted">{describe(monthTotals)}</span>
          </p>
          <button type="button" className={softButton} onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= currentMonth()} aria-label="Next month">›</button>
        </div>
        <ol className="grid grid-cols-7 gap-1 sm:gap-1.5 max-w-sm mx-auto" aria-label={`Reading heatmap for ${monthLabel(month)}`}>
          {WEEKDAYS.map((d, i) => (
            <li key={i} className="text-[10px] text-center text-cozy-muted font-medium" aria-hidden="true">{d}</li>
          ))}
          {Array.from({ length: lead }, (_, i) => <li key={`lead-${i}`} aria-hidden="true" />)}
          {monthDays.map((d) => {
            const totals = byDay[d];
            const level = totals ? 0.25 + 0.75 * (intensity(totals) / maxDay) : 0;
            const label = `${formatDate(d, { day: 'numeric', month: 'long' })}: ${totals ? describe(totals) : 'no reading'}`;
            return (
              <li
                key={d}
                title={label}
                className={`relative aspect-square rounded-md border text-[10px] flex items-center justify-center tabular-nums ${
                  d === todayYmd ? 'border-cozy-accent' : 'border-cozy-border'
                } ${totals ? 'text-white font-semibold' : 'text-cozy-muted bg-cozy-bg'}`}
              >
                {totals && <span className="absolute inset-0 rounded-[5px] bg-cozy-accent" style={{ opacity: level }} aria-hidden="true" />}
                <span className="relative" aria-hidden="true">{Number(d.slice(8))}</span>
                <span className="sr-only">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {loading ? (
        <p className="text-sm text-cozy-muted">Loading your log…</p>
      ) : monthEntries.length === 0 ? (
        <Empty>Nothing logged in {monthLabel(month)} yet.</Empty>
      ) : (
        <ul className="divide-y divide-cozy-border rounded-2xl border border-cozy-border">
          {monthEntries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-14 shrink-0 text-xs text-cozy-muted">{formatDate(entry.entry_date, { day: 'numeric', month: 'short' })}</span>
              <span className="flex-1 min-w-0 truncate text-cozy-text">{entry.data?.book_title || <span className="text-cozy-muted">Reading</span>}</span>
              <span className="text-xs text-cozy-text whitespace-nowrap">{describe(amountOf(entry))}</span>
              <button
                type="button"
                onClick={() => run(remove(entry.id))}
                className="text-xs text-cozy-accent p-1 shrink-0"
                aria-label={`Delete log for ${formatDate(entry.entry_date)}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
