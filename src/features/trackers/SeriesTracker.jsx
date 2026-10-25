import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { statusLabel } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Field } from './parts';
import { normName, useRunner } from './trackerUtils';

const NOT_OWNED = ['wishlist', 'borrowed', 'library'];

function isOwned(book) {
  return !NOT_OWNED.includes(book.status) && !NOT_OWNED.includes(book.format);
}

function Progress({ read, owned, total }) {
  const pct = (n) => `${Math.min(100, (n / Math.max(1, total)) * 100)}%`;
  return (
    <div className="relative h-2 rounded-full bg-cozy-bg border border-cozy-border overflow-hidden" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 bg-cozy-primary" style={{ width: pct(owned) }} />
      <span className="absolute inset-y-0 left-0 bg-cozy-accent" style={{ width: pct(read) }} />
    </div>
  );
}

function Counter({ label, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={`${softButton} px-2 py-0.5`} onClick={() => onChange(Math.max(min, value - 1))} aria-label={`${label}: one fewer`}>−</button>
      <span className="text-xs text-cozy-text tabular-nums w-6 text-center">{value}</span>
      <button type="button" className={`${softButton} px-2 py-0.5`} onClick={() => onChange(value + 1)} aria-label={`${label}: one more`}>+</button>
    </div>
  );
}

export default function SeriesTracker({ books, openEditor }) {
  const { entries, loading, add, update, remove } = useEntries('trackers.series');
  const { error, run } = useRunner();
  const [form, setForm] = useState({ name: '', author: '', total: '', owned: '', read: '' });
  const [adding, setAdding] = useState(false);

  const rowsByName = {};
  entries.forEach((e) => {
    rowsByName[normName(e.data?.name)] = e;
  });

  const groups = {};
  books.filter((b) => b.series_name?.trim()).forEach((b) => {
    const key = normName(b.series_name);
    if (!groups[key]) groups[key] = { key, name: b.series_name.trim(), books: [] };
    groups[key].books.push(b);
  });
  const library = Object.values(groups)
    .map((g) => {
      const sorted = [...g.books].sort((a, b) => (Number(a.series_number) || 999) - (Number(b.series_number) || 999));
      const row = rowsByName[g.key];
      const maxNumber = Math.max(sorted.length, ...sorted.map((b) => Number(b.series_number) || 0));
      const total = Math.max(Number(row?.data?.total) || 0, maxNumber);
      const read = sorted.filter((b) => b.status === 'read').length;
      const owned = sorted.filter(isOwned).length;
      let next = sorted.find((b) => b.status !== 'read' && b.status !== 'dnf');
      let nextLabel = next ? `#${next.series_number ?? '?'} ${next.title}` : null;
      if (!next && total > maxNumber) nextLabel = `#${maxNumber + 1} (not in your library yet)`;
      return { ...g, books: sorted, row, total, read, owned, next, nextLabel };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const standalone = entries
    .filter((e) => !groups[normName(e.data?.name)])
    .sort((a, b) => String(a.data?.name).localeCompare(String(b.data?.name)));

  const setTotal = (group, total) => {
    if (group.row) return run(update(group.row.id, { data: { ...group.row.data, total } }));
    return run(add({ data: { name: group.name, total } }));
  };

  const patchRow = (entry, patch) => {
    const data = { ...entry.data, ...patch };
    data.owned = Math.min(data.owned ?? 0, data.total ?? 0);
    data.read = Math.min(data.read ?? 0, data.total ?? 0);
    return run(update(entry.id, { data }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const total = Math.max(1, Math.round(Number(form.total) || 1));
    if (!name) return;
    const data = {
      name,
      author: form.author.trim(),
      total,
      owned: Math.min(total, Math.max(0, Math.round(Number(form.owned) || 0))),
      read: Math.min(total, Math.max(0, Math.round(Number(form.read) || 0))),
    };
    const result = await run(add({ data }));
    if (!result.error) {
      setForm({ name: '', author: '', total: '', owned: '', read: '' });
      setAdding(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <SectionTitle icon="🔗" title="Series tracker" subtitle="Owned, read and next-up for every series you follow.">
        <button type="button" className={primaryButton} onClick={() => setAdding(!adding)} aria-expanded={adding}>
          {adding ? 'Close' : '+ Add series'}
        </button>
      </SectionTitle>
      <ErrorNote error={error} />

      {adding && (
        <form onSubmit={submit} className="rounded-2xl border border-cozy-border bg-cozy-bg/60 p-3 mb-5 grid grid-cols-3 gap-2 items-end">
          <Field label="Series name" htmlFor="sr-name" className="col-span-3 sm:col-span-2">
            <input id="sr-name" className={input} value={form.name} onChange={set('name')} required placeholder="e.g. Throne of Glass" />
          </Field>
          <Field label="Author" htmlFor="sr-author" className="col-span-3 sm:col-span-1">
            <input id="sr-author" className={input} value={form.author} onChange={set('author')} />
          </Field>
          <Field label="Total books" htmlFor="sr-total">
            <input id="sr-total" type="number" min="1" inputMode="numeric" className={input} value={form.total} onChange={set('total')} required />
          </Field>
          <Field label="Owned" htmlFor="sr-owned">
            <input id="sr-owned" type="number" min="0" inputMode="numeric" className={input} value={form.owned} onChange={set('owned')} />
          </Field>
          <Field label="Read" htmlFor="sr-read">
            <input id="sr-read" type="number" min="0" inputMode="numeric" className={input} value={form.read} onChange={set('read')} />
          </Field>
          <button type="submit" className={`${primaryButton} col-span-3 sm:col-span-1 sm:col-start-3`}>Save series</button>
        </form>
      )}

      <h4 className="text-xs font-semibold uppercase tracking-wide text-cozy-muted mb-2">From your library</h4>
      {library.length === 0 ? (
        <Empty>Add a series name and number to a book to see it grouped here.</Empty>
      ) : (
        <ul className="space-y-3 mb-6">
          {library.map((g) => (
            <li key={g.key} className="rounded-2xl border border-cozy-border p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0">
                  <p className="font-serif text-cozy-text truncate">{g.name}</p>
                  <p className="text-xs text-cozy-muted">
                    {g.read} read · {g.owned} owned · {g.total} in series
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-cozy-muted">
                  Total books
                  <input
                    type="number"
                    min={g.books.length}
                    inputMode="numeric"
                    className={`${input} !w-16 py-1`}
                    defaultValue={g.total}
                    key={g.total}
                    onBlur={(e) => {
                      const total = Math.round(Number(e.target.value));
                      if (total > 0 && total !== g.total) setTotal(g, total);
                    }}
                  />
                </label>
              </div>
              <Progress read={g.read} owned={g.owned} total={g.total} />
              <p className="text-xs mt-2 text-cozy-text">
                <span className="font-semibold">Next up:</span>{' '}
                {g.next ? (
                  <button type="button" onClick={() => openEditor(g.next)} className="text-cozy-accent hover:underline">{g.nextLabel}</button>
                ) : (
                  <span className="text-cozy-muted">{g.nextLabel || 'All caught up 🎉'}</span>
                )}
              </p>
              <ol className="mt-2 flex flex-wrap gap-1.5">
                {g.books.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => openEditor(b)}
                      className={`px-2 py-1 rounded-lg text-[11px] border transition max-w-[14rem] truncate ${
                        b.status === 'read' ? 'bg-cozy-accent text-white border-cozy-accent' : 'bg-cozy-bg text-cozy-text border-cozy-primary hover:border-cozy-accent'
                      }`}
                      title={`${b.title} · ${statusLabel(b.status)}`}
                    >
                      #{b.series_number ?? '?'} {b.title}
                    </button>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}

      <h4 className="text-xs font-semibold uppercase tracking-wide text-cozy-muted mb-2">Other series you follow</h4>
      {loading ? (
        <p className="text-sm text-cozy-muted">Loading…</p>
      ) : standalone.length === 0 ? (
        <Empty>Track a series you haven't added to the library with “Add series”.</Empty>
      ) : (
        <ul className="space-y-3">
          {standalone.map((entry) => {
            const d = entry.data || {};
            const total = Number(d.total) || 0;
            const read = Number(d.read) || 0;
            const owned = Number(d.owned) || 0;
            return (
              <li key={entry.id} className="rounded-2xl border border-cozy-border p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-serif text-cozy-text truncate">{d.name}</p>
                    <p className="text-xs text-cozy-muted truncate">
                      {d.author ? `${d.author} · ` : ''}{total} books · next up: {read >= total ? 'all read 🎉' : `#${read + 1}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => run(remove(entry.id))} className="text-xs text-cozy-accent p-1 shrink-0" aria-label={`Remove ${d.name}`}>✕</button>
                </div>
                <Progress read={read} owned={owned} total={total} />
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-cozy-muted">
                  <span className="flex items-center gap-1.5">Total <Counter label={`${d.name} total books`} value={total} min={1} onChange={(v) => patchRow(entry, { total: v })} /></span>
                  <span className="flex items-center gap-1.5">Owned <Counter label={`${d.name} books owned`} value={owned} onChange={(v) => patchRow(entry, { owned: v })} /></span>
                  <span className="flex items-center gap-1.5">Read <Counter label={`${d.name} books read`} value={read} onChange={(v) => patchRow(entry, { read: v })} /></span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
