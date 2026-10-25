import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today } from '../../lib/bookMeta';
import { input, primaryButton, softButton, pill } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Stat, Field } from './parts';
import { formatDate, money, useRunner } from './trackerUtils';

const BLANK = { date: '', title: '', author: '', type: 'haul', cost: '' };

export default function HaulTracker({ books, openEditor }) {
  const { entries, loading, error: loadError, add, remove } = useEntries('trackers.haul');
  const { error, run } = useRunner();
  const [form, setForm] = useState({ ...BLANK, date: today() });
  const [filter, setFilter] = useState('all');
  const thisYear = today().slice(0, 4);

  const sorted = [...entries].sort((a, b) => String(b.entry_date || '').localeCompare(String(a.entry_date || '')));
  const shown = filter === 'all' ? sorted : sorted.filter((e) => e.data?.type === filter);
  const yearEntries = entries.filter((e) => String(e.entry_date || '').startsWith(thisYear));
  const hauls = yearEntries.filter((e) => e.data?.type !== 'unhaul');
  const unhauls = yearEntries.filter((e) => e.data?.type === 'unhaul');
  const spent = hauls.reduce((s, e) => s + (Number(e.data?.cost) || 0), 0);
  const back = unhauls.reduce((s, e) => s + (Number(e.data?.cost) || 0), 0);
  const titles = new Set(books.map((b) => b.title.trim().toLowerCase()));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title || !form.date) return;
    const data = { title, author: form.author.trim(), type: form.type };
    if (form.cost !== '' && Number(form.cost) >= 0) data.cost = Math.round(Number(form.cost) * 100) / 100;
    const result = await run(add({ entry_date: form.date, data }));
    if (!result.error) setForm((f) => ({ ...BLANK, date: f.date, type: f.type }));
  };

  return (
    <div>
      <SectionTitle icon="🛍️" title="Haul & unhaul" subtitle="Books in, books out, and what it cost." />
      <ErrorNote error={error || loadError} />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label={`Hauled ${thisYear}`} value={hauls.length} />
        <Stat label={`Unhauled ${thisYear}`} value={unhauls.length} />
        <Stat label="Spent" value={money(spent)} />
      </div>
      {back > 0 && <p className="text-xs text-cozy-muted -mt-2 mb-4">Got {money(back)} back from unhauls this year · net {money(spent - back)}</p>}

      <form onSubmit={submit} className="rounded-2xl border border-cozy-border bg-cozy-bg/60 p-3 mb-5 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
        <Field label="Title" htmlFor="hl-title" className="col-span-2 sm:col-span-3">
          <input id="hl-title" className={input} value={form.title} onChange={set('title')} required />
        </Field>
        <Field label="Author" htmlFor="hl-author" className="col-span-2 sm:col-span-3">
          <input id="hl-author" className={input} value={form.author} onChange={set('author')} />
        </Field>
        <Field label="Date" htmlFor="hl-date" className="sm:col-span-2">
          <input id="hl-date" type="date" className={input} value={form.date} onChange={set('date')} required />
        </Field>
        <Field label="Bought or unhauled" htmlFor="hl-type" className="sm:col-span-2">
          <select id="hl-type" className={input} value={form.type} onChange={set('type')}>
            <option value="haul">Bought</option>
            <option value="unhaul">Unhauled</option>
          </select>
        </Field>
        <Field label={form.type === 'unhaul' ? 'Sold for' : 'Cost'} htmlFor="hl-cost">
          <input id="hl-cost" type="number" min="0" step="0.01" inputMode="decimal" className={input} value={form.cost} onChange={set('cost')} placeholder="0.00" />
        </Field>
        <button type="submit" className={`${primaryButton} py-2.5`}>Add</button>
      </form>

      <div className="flex gap-2 mb-3" role="group" aria-label="Show">
        {[
          { key: 'all', label: 'All' },
          { key: 'haul', label: 'Bought' },
          { key: 'unhaul', label: 'Unhauled' },
        ].map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key} className={pill(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-cozy-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <Empty>Nothing here yet. Log your next book haul above.</Empty>
      ) : (
        <ul className="divide-y divide-cozy-border rounded-2xl border border-cozy-border">
          {shown.map((entry) => {
            const d = entry.data || {};
            const unhaul = d.type === 'unhaul';
            const inLibrary = titles.has(String(d.title || '').trim().toLowerCase());
            return (
              <li key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${unhaul ? 'bg-cozy-bg border border-cozy-primary' : 'bg-cozy-accent/20'}`}
                  aria-hidden="true"
                >
                  {unhaul ? '📤' : '📥'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cozy-text truncate">{d.title}</p>
                  <p className="text-[11px] text-cozy-muted truncate">
                    {unhaul ? 'Unhauled' : 'Bought'} · {formatDate(entry.entry_date)}{d.author ? ` · ${d.author}` : ''}
                  </p>
                </div>
                {d.cost !== undefined && (
                  <span className="text-xs font-semibold text-cozy-text tabular-nums shrink-0">{unhaul ? '+' : ''}{money(d.cost)}</span>
                )}
                {!unhaul && !inLibrary && (
                  <button
                    type="button"
                    className={`${softButton} shrink-0 px-2`}
                    aria-label={`Add ${d.title} to library`}
                    onClick={() => openEditor(null, { title: d.title, author: d.author || '', status: 'tbr', format: 'owned' })}
                  >
                    + Library
                  </button>
                )}
                <button type="button" onClick={() => run(remove(entry.id))} className="text-xs text-cozy-accent p-1 shrink-0" aria-label={`Delete ${d.title}`}>
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
