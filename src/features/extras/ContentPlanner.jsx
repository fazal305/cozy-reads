import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { currentMonth, today } from '../../lib/bookMeta';
import { input, pill, primaryButton } from '../../lib/ui';
import MonthCalendar from './MonthCalendar';
import { BookSelect, DeleteButton, Empty, ErrorNote, Field, Heading, MonthPicker, Panel } from './shared';
import { bookTitle, dateLabel, monthLabel, plural, useRunner } from './utils';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸' },
  { key: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️' },
  { key: 'other', label: 'Other', emoji: '✨' },
];

const STATUSES = [
  { key: 'idea', label: 'Idea', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' },
  { key: 'drafted', label: 'Drafted', tone: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100' },
  { key: 'posted', label: 'Posted', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' },
];

const platform = (key) => PLATFORMS.find((p) => p.key === key) || PLATFORMS[3];
const status = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];

export default function ContentPlanner({ books }) {
  const content = useEntries('extras.content');
  const { error, run } = useRunner();
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState('list');
  const [date, setDate] = useState(today);
  const [platformKey, setPlatformKey] = useState('instagram');
  const [bookId, setBookId] = useState('');
  const [idea, setIdea] = useState('');

  const list = content.entries
    .filter((e) => String(e.data?.date || '').startsWith(month))
    .sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)));
  const counts = STATUSES.map((s) => ({ ...s, count: list.filter((e) => (e.data.status || 'idea') === s.key).length }));
  const label = (e) => e.data.book_id ? bookTitle(books, e.data.book_id, e.data.book_title) : e.data.book_title;

  const changeMonth = (next) => {
    setMonth(next);
    setDate(next === currentMonth() ? today() : `${next}-01`);
  };

  const add = async (e) => {
    e.preventDefault();
    const data = { date, platform: platformKey, book_id: bookId || null, book_title: bookId ? bookTitle(books, bookId) : '', idea: idea.trim(), status: 'idea' };
    const result = await run(content.add({ data, entry_date: date }));
    if (!result?.error) {
      setIdea('');
      setBookId('');
    }
  };

  return (
    <div className="space-y-5">
      <Heading title="Content planner" subtitle={counts.map((c) => (c.key === 'idea' ? plural(c.count, 'idea') : `${c.count} ${c.label.toLowerCase()}`)).join(' · ')}>
        <MonthPicker id="content-month" value={month} onChange={changeMonth} />
      </Heading>
      <ErrorNote error={error || content.error} />

      <Panel>
        <form onSubmit={add} className="grid gap-2 grid-cols-2 sm:grid-cols-6 sm:items-end">
          <Field label="Date" id="content-date" className="sm:col-span-2">
            <input id="content-date" type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Platform" id="content-platform" className="sm:col-span-2">
            <select id="content-platform" className={input} value={platformKey} onChange={(e) => setPlatformKey(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Book" id="content-book" className="col-span-2">
            <BookSelect id="content-book" books={books} value={bookId} onChange={setBookId} />
          </Field>
          <Field label="Idea" id="content-idea" className="col-span-2 sm:col-span-4">
            <input id="content-idea" className={input} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Reel: books that broke me this year" required />
          </Field>
          <button type="submit" disabled={!idea.trim() || !date} className={`${primaryButton} col-span-2`}>+ Plan post</button>
        </form>
      </Panel>

      <div className="flex gap-2" role="group" aria-label="Planner view">
        <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} className={pill(view === 'list')}>📝 List</button>
        <button type="button" onClick={() => setView('calendar')} aria-pressed={view === 'calendar'} className={pill(view === 'calendar')}>🗓️ Calendar</button>
      </div>

      {view === 'calendar' ? (
        <Panel>
          <MonthCalendar
            month={month}
            label={`Posts planned in ${monthLabel(month)}`}
            renderDay={(day) => {
              const items = list.filter((e) => e.data.date === day);
              if (!items.length) return null;
              return (
                <ul className="space-y-0.5">
                  {items.slice(0, 3).map((e) => (
                    <li key={e.id} title={e.data.idea} className={`text-[9px] sm:text-[10px] leading-tight rounded px-0.5 sm:px-1 truncate ${status(e.data.status).tone}`}>
                      <span aria-hidden="true">{platform(e.data.platform).emoji}</span>
                      <span className="hidden sm:inline"> {e.data.idea}</span>
                      <span className="sr-only">{platform(e.data.platform).label}: {e.data.idea} ({status(e.data.status).label})</span>
                    </li>
                  ))}
                  {items.length > 3 && <li className="text-[9px] text-cozy-muted">+{items.length - 3}</li>}
                </ul>
              );
            }}
          />
        </Panel>
      ) : content.loading ? null : list.length ? (
        <ul className="space-y-2">
          {list.map((e) => (
            <li key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-cozy-bg border border-cozy-primary/60 min-w-0">
              <span className="text-xl shrink-0" aria-hidden="true">{platform(e.data.platform).emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-cozy-text break-words">{e.data.idea}</p>
                <p className="text-[11px] text-cozy-muted break-words">
                  {dateLabel(e.data.date)} · {platform(e.data.platform).label}
                  {label(e) && ` · ${label(e)}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <label htmlFor={`status-${e.id}`} className="sr-only">Status of {e.data.idea}</label>
                <select
                  id={`status-${e.id}`}
                  value={e.data.status || 'idea'}
                  onChange={(ev) => run(content.update(e.id, { data: { ...e.data, status: ev.target.value } }))}
                  className={`text-xs rounded-lg px-1.5 py-1 border-0 font-medium ${status(e.data.status).tone}`}
                >
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <DeleteButton label={`Delete post idea ${e.data.idea}`} onConfirm={() => run(content.remove(e.id))} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No posts planned for {monthLabel(month)}.</Empty>
      )}
    </div>
  );
}
