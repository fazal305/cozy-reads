import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today } from '../../lib/bookMeta';
import { input, pill, primaryButton } from '../../lib/ui';
import { DeleteButton, Empty, ErrorNote, Field, Heading, Panel } from './shared';
import { countdown, dateLabel, daysUntil, useRunner } from './utils';

const CATEGORIES = [
  { key: 'release', label: 'Release', emoji: '📚', detail: 'Edition or format', placeholder: 'Hardback, special edition…' },
  { key: 'event', label: 'Event', emoji: '🎟️', detail: 'Location', placeholder: 'City library, online…' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'release', label: '📚 Releases' },
  { key: 'event', label: '🎟️ Events' },
];

function EventRow({ entry, onRemove, next = false }) {
  const meta = CATEGORIES.find((c) => c.key === entry.data.category) || CATEGORIES[1];
  const days = daysUntil(entry.data.date);
  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl bg-cozy-paper border min-w-0 ${next ? 'border-cozy-accent' : 'border-cozy-primary/60'}`}>
      <div className={`w-14 shrink-0 text-center rounded-lg py-1.5 ${days !== null && days >= 0 ? 'bg-cozy-accent/15 text-cozy-accent-ink' : 'bg-cozy-primary/20 text-cozy-muted'}`}>
        <p className="font-serif text-lg leading-none">{days !== null && days >= 0 ? days : '✓'}</p>
        <p className="text-[9px] uppercase tracking-wide mt-0.5">{days !== null && days >= 0 ? (days === 1 ? 'day' : 'days') : 'past'}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-cozy-text font-medium break-words">
          <span aria-hidden="true">{meta.emoji} </span>
          {entry.data.title}
        </p>
        <p className="text-[11px] text-cozy-muted break-words">
          {meta.label} · {dateLabel(entry.data.date)} · {countdown(entry.data.date)}
          {entry.data.detail && ` · ${entry.data.detail}`}
        </p>
        {entry.data.note && <p className="text-xs text-cozy-text mt-0.5 break-words">{entry.data.note}</p>}
      </div>
      <DeleteButton label={`Delete ${entry.data.title}`} onConfirm={onRemove} className="shrink-0" />
    </li>
  );
}

export default function Events() {
  const events = useEntries('extras.event');
  const { error, run } = useRunner();
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('release');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [detail, setDetail] = useState('');
  const [note, setNote] = useState('');
  const meta = CATEGORIES.find((c) => c.key === category);
  const now = today();

  const visible = events.entries
    .filter((e) => filter === 'all' || e.data.category === filter)
    .sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)));
  const upcoming = visible.filter((e) => e.data.date >= now);
  const past = visible.filter((e) => e.data.date < now).reverse();

  const add = async (e) => {
    e.preventDefault();
    const result = await run(events.add({ data: { title: title.trim(), category, date, detail: detail.trim(), note: note.trim() }, entry_date: date }));
    if (!result?.error) {
      setTitle('');
      setDetail('');
      setNote('');
    }
  };

  return (
    <div className="space-y-5">
      <Heading title="Events and release dates" subtitle={upcoming.length ? `Next up ${countdown(upcoming[0].data.date).toLowerCase()}: ${upcoming[0].data.title}` : 'Nothing on the calendar yet'} />
      <ErrorNote error={error || events.error} />

      <Panel>
        <form onSubmit={add} className="grid gap-2 grid-cols-2 sm:grid-cols-6 sm:items-end">
          <Field label={category === 'release' ? 'Book' : 'Event'} id="event-title" className="col-span-2 sm:col-span-3">
            <input id="event-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category === 'release' ? 'Sequel title' : 'Author signing'} required />
          </Field>
          <Field label="Type" id="event-category">
            <select id="event-category" className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Date" id="event-date" className="sm:col-span-2">
            <input id="event-date" type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label={meta.detail} id="event-detail" className="col-span-2 sm:col-span-3">
            <input id="event-detail" className={input} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={meta.placeholder} />
          </Field>
          <Field label="Note" id="event-note" className="col-span-2">
            <input id="event-note" className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pre-ordered, bring tote bag…" />
          </Field>
          <button type="submit" disabled={!title.trim() || !date} className={`${primaryButton} col-span-2 sm:col-span-1`}>+ Add</button>
        </form>
      </Panel>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter events">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key} className={pill(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {events.loading ? null : visible.length === 0 ? (
        <Empty>Add release dates and bookish events to count down to them.</Empty>
      ) : (
        <>
          <section aria-label="Upcoming">
            <h4 className="font-serif text-base text-cozy-text mb-2">Upcoming</h4>
            {upcoming.length ? (
              <ul className="space-y-2">
                {upcoming.map((e, i) => <EventRow key={e.id} entry={e} next={i === 0} onRemove={() => run(events.remove(e.id))} />)}
              </ul>
            ) : (
              <p className="text-sm text-cozy-muted italic">Nothing upcoming.</p>
            )}
          </section>
          {past.length > 0 && (
            <details className="group">
              <summary className="font-serif text-base text-cozy-text cursor-pointer">Past ({past.length})</summary>
              <ul className="space-y-2 mt-2 opacity-80">
                {past.map((e) => <EventRow key={e.id} entry={e} onRemove={() => run(events.remove(e.id))} />)}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
