import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { today, statusLabel } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Stat, Switch, Field } from './parts';
import { dayNumber, formatDate, useRunner } from './trackerUtils';

function dueState(book, todayYmd) {
  const due = book.extra?.arc_due;
  if (book.extra?.arc_posted || !due) return null;
  const days = dayNumber(due) - dayNumber(todayYmd);
  if (days < 0) return { label: `Overdue ${-days}d`, tone: 'overdue' };
  if (days <= 7) return { label: days === 0 ? 'Due today' : `Due in ${days}d`, tone: 'soon' };
  return null;
}

function ArcEditor({ book, onSave, onCancel }) {
  const [form, setForm] = useState({
    arc_publisher: book.extra?.arc_publisher || '',
    arc_release: book.extra?.arc_release || '',
    arc_due: book.extra?.arc_due || '',
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const id = `arc-${book.id}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3"
    >
      <Field label="Publisher / platform" htmlFor={`${id}-pub`} className="col-span-2 sm:col-span-1">
        <input id={`${id}-pub`} className={input} value={form.arc_publisher} onChange={set('arc_publisher')} placeholder="NetGalley, Edelweiss…" />
      </Field>
      <Field label="Release date" htmlFor={`${id}-rel`}>
        <input id={`${id}-rel`} type="date" className={input} value={form.arc_release} onChange={set('arc_release')} />
      </Field>
      <Field label="Review due" htmlFor={`${id}-due`}>
        <input id={`${id}-due`} type="date" className={input} value={form.arc_due} onChange={set('arc_due')} />
      </Field>
      <div className="col-span-2 sm:col-span-3 flex justify-end gap-2">
        <button type="button" className={softButton} onClick={onCancel}>Cancel</button>
        <button type="submit" className={primaryButton}>Save</button>
      </div>
    </form>
  );
}

export default function ArcTracker({ books, booksApi, openEditor }) {
  const { error, run } = useRunner();
  const [editing, setEditing] = useState(null);
  const todayYmd = today();
  const arcs = books
    .filter((b) => b.format === 'arc')
    .sort((a, b) => {
      if (Boolean(a.extra?.arc_posted) !== Boolean(b.extra?.arc_posted)) return a.extra?.arc_posted ? 1 : -1;
      return String(a.extra?.arc_due || '9999').localeCompare(String(b.extra?.arc_due || '9999'));
    });
  const posted = arcs.filter((b) => b.extra?.arc_posted).length;
  const overdue = arcs.filter((b) => dueState(b, todayYmd)?.tone === 'overdue').length;

  const saveExtra = (book, patch) => {
    const extra = { ...(book.extra || {}), ...patch };
    Object.keys(patch).forEach((k) => {
      if (extra[k] === '' || extra[k] === null) delete extra[k];
    });
    return run(booksApi.updateBook(book.id, { extra }));
  };

  return (
    <div>
      <SectionTitle icon="📬" title="ARC tracker" subtitle="Advance copies, release dates and review deadlines.">
        <button type="button" className={primaryButton} onClick={() => openEditor(null, { status: 'tbr', format: 'arc' })}>+ Add ARC</button>
      </SectionTitle>
      <ErrorNote error={error} />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="ARCs" value={arcs.length} />
        <Stat label="Reviews posted" value={`${posted} / ${arcs.length}`} />
        <Stat label="Overdue" value={overdue} />
      </div>

      {arcs.length === 0 ? (
        <Empty>No ARCs yet. Set a book's format to ARC to track it here.</Empty>
      ) : (
        <ul className="space-y-3">
          {arcs.map((book) => {
            const state = dueState(book, todayYmd);
            const isPosted = Boolean(book.extra?.arc_posted);
            return (
              <li key={book.id} className="rounded-2xl border border-cozy-border p-3">
                <div className="flex gap-3">
                  <button type="button" onClick={() => openEditor(book)} className="shrink-0" aria-label={`Open ${book.title}`}>
                    <BookCover book={book} className="w-12 h-[4.5rem]" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-cozy-text truncate">{book.title}</p>
                        <p className="text-xs text-cozy-muted truncate">
                          {book.author || 'Unknown author'} · {statusLabel(book.status)}
                        </p>
                      </div>
                      {state && (
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                            state.tone === 'overdue' ? 'bg-red-600 text-white dark:bg-red-500' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100'
                          }`}
                        >
                          {state.label}
                        </span>
                      )}
                    </div>
                    <dl className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                      <div className="min-w-0">
                        <dt className="text-cozy-muted">From</dt>
                        <dd className="text-cozy-text truncate">{book.extra?.arc_publisher || '–'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-cozy-muted">Release</dt>
                        <dd className="text-cozy-text truncate">{formatDate(book.extra?.arc_release) || '–'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-cozy-muted">Review due</dt>
                        <dd className="text-cozy-text truncate">{formatDate(book.extra?.arc_due) || '–'}</dd>
                      </div>
                    </dl>
                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <Switch
                        checked={isPosted}
                        showLabel
                        label={isPosted ? 'Review posted' : 'Review not posted'}
                        onChange={(next) => saveExtra(book, { arc_posted: next || null })}
                      />
                      {editing !== book.id && (
                        <button type="button" className={softButton} onClick={() => setEditing(book.id)} aria-label={`Edit ARC details for ${book.title}`}>
                          Edit details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {editing === book.id && (
                  <ArcEditor book={book} onCancel={() => setEditing(null)} onSave={async (patch) => {
                      const result = await saveExtra(book, patch);
                      if (!result.error) setEditing(null);
                    }} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
