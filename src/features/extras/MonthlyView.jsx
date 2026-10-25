import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { MOODS, currentMonth } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import MonthCalendar from './MonthCalendar';
import { Empty, ErrorNote, Heading, MonthPicker, Panel } from './shared';
import { monthLabel, plural, useRunner } from './utils';

function Stat({ label, value }) {
  return (
    <div className="bg-cozy-paper rounded-xl border border-cozy-primary/60 p-3 text-center min-w-0">
      <p className="font-serif text-xl sm:text-2xl text-cozy-text truncate">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-cozy-muted mt-0.5">{label}</p>
    </div>
  );
}

function NoteEditor({ initial, label, onSave }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await onSave(text);
    setBusy(false);
    setSaved(!result?.error);
  };

  return (
    <form onSubmit={save} className="space-y-2">
      <label htmlFor="monthly-note" className="block text-xs font-medium text-cozy-text">{label}</label>
      <textarea
        id="monthly-note"
        rows={4}
        className={input}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="Highlights, slumps, what you want to read next…"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy || text === initial} className={primaryButton}>Save note</button>
        {saved && <span role="status" className="text-xs text-cozy-muted">Saved</span>}
      </div>
    </form>
  );
}

export default function MonthlyView({ books, booksApi, openEditor }) {
  const [month, setMonth] = useState(currentMonth);
  const notes = useEntries('extras.monthly_note');
  const { error, run } = useRunner();

  const finished = books.filter((b) => b.status === 'read' && String(b.finish_date || '').startsWith(month));
  const tbr = books.filter((b) => b.status === 'tbr');
  const hopefuls = tbr.filter((b) => b.extra?.month === month);
  const others = tbr.filter((b) => b.extra?.month !== month);
  const pages = finished.reduce((sum, b) => sum + (Number(b.pages) || 0), 0);
  const rated = finished.filter((b) => b.rating);
  const avg = rated.length ? `${(rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length).toFixed(1)}★` : '–';
  const favourite = finished.find((b) => b.favorite) || [...rated].sort((a, b) => b.rating - a.rating)[0];
  const moods = MOODS.map((m) => ({ ...m, count: finished.filter((b) => b.mood === m.key).length })).filter((m) => m.count);
  const noteEntry = notes.entries.find((e) => e.data?.month === month);

  const saveNote = (note) =>
    run(noteEntry
      ? notes.update(noteEntry.id, { data: { ...noteEntry.data, note } })
      : notes.add({ data: { month, note }, entry_date: `${month}-01` }));

  const removeHopeful = (book) => {
    const rest = { ...book.extra };
    delete rest.month;
    run(booksApi.updateBook(book.id, { extra: rest }));
  };

  return (
    <div className="space-y-5">
      <Heading title={monthLabel(month)} subtitle={`${finished.length} finished · ${plural(hopefuls.length, 'hopeful')}`}>
        <MonthPicker id="monthly-month" value={month} onChange={setMonth} />
      </Heading>
      <ErrorNote error={error || notes.error} />

      <Panel>
        <h4 className="font-serif text-base text-cozy-text mb-3">Reading calendar</h4>
        <MonthCalendar
          month={month}
          label={`Books finished in ${monthLabel(month)}`}
          renderDay={(date) => {
            const list = finished.filter((b) => b.finish_date === date);
            if (!list.length) return null;
            return (
              <div className="relative">
                <button type="button" onClick={() => openEditor(list[0])} className="block w-full max-w-[3rem] mx-auto" aria-label={`Open ${list[0].title}`}>
                  <BookCover book={list[0]} className="w-full aspect-[2/3] !rounded-md [&_span:not(:first-child)]:hidden [&_span]:text-sm" />
                </button>
                {list.length > 1 && (
                  <span className="absolute -top-1 -right-0.5 text-[9px] font-semibold bg-cozy-accent text-white rounded-full px-1" title={list.slice(1).map((b) => b.title).join(', ')}>
                    +{list.length - 1}
                  </span>
                )}
              </div>
            );
          }}
        />
      </Panel>

      <Panel>
        <h4 className="font-serif text-base text-cozy-text mb-3">Monthly hopefuls</h4>
        {hopefuls.length ? (
          <ul className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {hopefuls.map((book) => (
              <li key={book.id} className="w-20 shrink-0">
                <button type="button" onClick={() => openEditor(book)} className="block w-full text-left group">
                  <BookCover book={book} className="w-20 h-28 group-hover:-translate-y-0.5 transition" />
                  <span className="block font-serif text-[11px] text-cozy-text truncate mt-1">{book.title}</span>
                </button>
                <button type="button" onClick={() => removeHopeful(book)} className="text-[11px] text-cozy-muted hover:text-cozy-accent" aria-label={`Remove ${book.title} from hopefuls`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-cozy-muted italic mb-2">No hopefuls for this month yet.</p>
        )}
        {others.length > 0 && (
          <div className="mt-3 max-w-sm">
            <label htmlFor="monthly-hopeful" className="block text-xs font-medium text-cozy-text mb-1">Add a TBR book</label>
            <select
              id="monthly-hopeful"
              className={input}
              value=""
              onChange={(e) => {
                const book = tbr.find((b) => b.id === e.target.value);
                if (book) run(booksApi.updateBook(book.id, { extra: { ...book.extra, month } }));
              }}
            >
              <option value="">Choose a book…</option>
              {others.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
        )}
      </Panel>

      <Panel className="space-y-4">
        <h4 className="font-serif text-base text-cozy-text">Monthly wrap up</h4>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Books" value={finished.length} />
          <Stat label="Pages" value={pages.toLocaleString()} />
          <Stat label="Avg rating" value={avg} />
        </div>
        {finished.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-cozy-text mb-2">Favourite of the month</p>
              {favourite ? (
                <button type="button" onClick={() => openEditor(favourite)} className="flex items-center gap-3 text-left group">
                  <BookCover book={favourite} className="w-12 h-[4.5rem] shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-serif text-sm text-cozy-text group-hover:text-cozy-accent truncate">{favourite.title}</span>
                    <span className="block text-xs text-cozy-muted truncate">{favourite.author}</span>
                    {favourite.rating && <span className="block text-xs text-cozy-accent">{'★'.repeat(Math.round(favourite.rating))}</span>}
                  </span>
                </button>
              ) : (
                <p className="text-sm text-cozy-muted italic">Rate a book to crown a favourite.</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-cozy-text mb-2">Mood mix</p>
              {moods.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {moods.map((m) => (
                    <li key={m.key} className="text-xs px-2 py-1 rounded-full bg-cozy-paper border border-cozy-primary/60 text-cozy-text">
                      <span aria-hidden="true">{m.emoji}</span> {m.label} × {m.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-cozy-muted italic">No moods logged.</p>
              )}
            </div>
          </div>
        ) : (
          <Empty>No books finished in {monthLabel(month)} yet.</Empty>
        )}
        {!notes.loading && (
          <NoteEditor key={month} initial={noteEntry?.data?.note || ''} label={`Notes for ${monthLabel(month)}`} onSave={saveNote} />
        )}
        <button type="button" onClick={() => openEditor(null, { status: 'read', finish_date: `${month}-01` })} className={softButton}>
          + Log a finished book
        </button>
      </Panel>
    </div>
  );
}
