import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { FORMATS, GENRES } from '../../lib/bookMeta';
import { TROPES } from '../../data/tropes';
import { input, primaryButton, softButton } from '../../lib/ui';
import { BookList, ErrorNote, Modal, ProgressBar } from './shared';
import { CURRENT_YEAR, bookRef, byFinish, findBook, finishStamp, readBooks } from './challengeUtils';

const EMPTY = { name: '', goal: 10, genre: '', format: '', minPages: '', trope: '', start: `${CURRENT_YEAR}-01-01`, end: `${CURRENT_YEAR}-12-31` };

function matchesRules(book, data) {
  if (book.status !== 'read') return false;
  const stamp = finishStamp(book);
  if (data.start && stamp < data.start) return false;
  if (data.end && stamp > data.end) return false;
  const rules = data.rules || {};
  if (rules.genre && String(book.genre || '').toLowerCase() !== rules.genre.toLowerCase()) return false;
  if (rules.format && book.format !== rules.format) return false;
  if (rules.minPages && !(Number(book.pages) >= Number(rules.minPages))) return false;
  if (rules.trope && !(book.tropes || []).includes(rules.trope)) return false;
  return true;
}

function progress(data, books) {
  const excluded = new Set(data.excluded || []);
  const auto = books.filter((b) => matchesRules(b, data) && !excluded.has(b.id));
  const manual = (data.links || []).map((ref) => findBook(books, ref)).filter(Boolean);
  const seen = new Set();
  const list = [...auto.map((b) => ({ book: b, manual: false })), ...manual.map((b) => ({ book: b, manual: true }))]
    .filter(({ book }) => !seen.has(book.id) && seen.add(book.id))
    .sort((a, b) => byFinish(a.book, b.book));
  return list;
}

function ruleSummary(data) {
  const rules = data.rules || {};
  const parts = [];
  if (rules.genre) parts.push(rules.genre);
  if (rules.format) parts.push(FORMATS.find((f) => f.key === rules.format)?.label || rules.format);
  if (rules.minPages) parts.push(`${rules.minPages}+ pages`);
  if (rules.trope) parts.push(rules.trope);
  const range = [data.start, data.end].filter(Boolean).join(' → ');
  return [parts.length ? parts.join(' · ') : 'Any read book', range].filter(Boolean).join(' · ');
}

function toForm(data) {
  if (!data) return EMPTY;
  const r = data.rules || {};
  return { name: data.name, goal: data.goal, genre: r.genre || '', format: r.format || '', minPages: r.minPages || '', trope: r.trope || '', start: data.start || '', end: data.end || '' };
}

function ChallengeForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const valid = form.name.trim() && Number(form.goal) >= 1 && (!form.start || !form.end || form.start <= form.end);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    await onSubmit({
      name: form.name.trim(),
      goal: Math.round(Number(form.goal)),
      start: form.start || null,
      end: form.end || null,
      rules: {
        genre: form.genre || null,
        format: form.format || null,
        minPages: form.minPages ? Number(form.minPages) : null,
        trope: form.trope || null,
      },
    });
    setBusy(false);
  };

  const field = 'text-xs text-cozy-muted space-y-1 block';
  return (
    <form onSubmit={submit} className="p-4 rounded-2xl bg-cozy-bg border border-cozy-primary/60 space-y-3">
      <h3 className="font-serif text-lg text-cozy-text">{initial ? 'Edit challenge' : 'New challenge'}</h3>
      <div className="grid gap-2 sm:grid-cols-[3fr_1fr]">
        <label className={field}>
          <span>Name</span>
          <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Chunky fantasy winter" required maxLength={80} />
        </label>
        <label className={field}>
          <span>Goal (books)</span>
          <input type="number" min="1" max="500" className={input} value={form.goal} onChange={(e) => set('goal', e.target.value)} required />
        </label>
      </div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
        <label className={field}>
          <span>Genre</span>
          <select className={input} value={form.genre} onChange={(e) => set('genre', e.target.value)}>
            <option value="">Any</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className={field}>
          <span>Format</span>
          <select className={input} value={form.format} onChange={(e) => set('format', e.target.value)}>
            <option value="">Any</option>
            {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
        <label className={field}>
          <span>Minimum pages</span>
          <input type="number" min="1" className={input} value={form.minPages} onChange={(e) => set('minPages', e.target.value)} placeholder="Any" />
        </label>
        <label className={field}>
          <span>Trope</span>
          <select className={input} value={form.trope} onChange={(e) => set('trope', e.target.value)}>
            <option value="">Any</option>
            {TROPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-2 grid-cols-2">
        <label className={field}>
          <span>From</span>
          <input type="date" className={input} value={form.start} onChange={(e) => set('start', e.target.value)} />
        </label>
        <label className={field}>
          <span>To</span>
          <input type="date" className={input} value={form.end} onChange={(e) => set('end', e.target.value)} />
        </label>
      </div>
      {form.start && form.end && form.start > form.end && <p role="alert" className="text-xs text-cozy-accent-ink">The end date is before the start date.</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !valid} className={primaryButton}>{initial ? 'Save changes' : 'Create challenge'}</button>
        <button type="button" onClick={onCancel} className={softButton}>Cancel</button>
      </div>
    </form>
  );
}

function ChallengeCard({ entry, books, openEditor, onSave, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const data = entry.data;
  const list = progress(data, books);
  const done = list.length >= data.goal;
  const listId = `custom-${entry.id}-books`;

  const exclude = (item) => {
    if (item.manual) {
      onSave({ ...data, links: (data.links || []).filter((ref) => findBook(books, ref)?.id !== item.book.id) });
    } else {
      onSave({ ...data, excluded: [...(data.excluded || []), item.book.id] });
    }
  };

  const link = async (book) => {
    const excluded = (data.excluded || []).filter((id) => id !== book.id);
    const links = matchesRules(book, data) ? data.links || [] : [...(data.links || []), bookRef(book)];
    await onSave({ ...data, links, excluded });
    setPicking(false);
  };

  const listedIds = new Set(list.map((i) => i.book.id));

  return (
    <li className="p-4 rounded-2xl bg-cozy-bg border border-cozy-primary/60 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-cozy-text break-words">{done ? '🏅 ' : ''}{data.name}</h3>
          <p className="text-xs text-cozy-muted break-words">{ruleSummary(data)}</p>
        </div>
        <span className={`shrink-0 text-sm font-semibold ${done ? 'text-cozy-accent-ink' : 'text-cozy-text'}`}>{list.length}/{data.goal}</span>
      </div>
      <ProgressBar value={list.length} max={data.goal} label={`${data.name} progress`} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={softButton} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide books' : `Show books (${list.length})`}
        </button>
        <button type="button" className={softButton} onClick={() => setPicking(true)}>+ Link a book</button>
        <button type="button" className={softButton} onClick={onEdit}>Edit</button>
        <button type="button" className={softButton} onClick={onDelete}>Delete</button>
      </div>
      {open && (
        <ul id={listId} className="space-y-2">
          {list.length === 0 && <li className="text-sm text-cozy-muted">No matching read books yet.</li>}
          {list.map((item) => (
            <li key={item.book.id} className="flex items-center gap-3 p-2 rounded-xl bg-cozy-card border border-cozy-primary/40">
              <button type="button" onClick={() => openEditor?.(item.book)} className="flex items-center gap-3 min-w-0 flex-1 text-left group">
                <BookCover book={item.book} className="w-8 h-11 shrink-0 [&_span+span]:hidden" />
                <span className="min-w-0">
                  <span className="block font-serif text-sm text-cozy-text truncate group-hover:text-cozy-accent-ink transition">{item.book.title}</span>
                  <span className="block text-[11px] text-cozy-muted">{item.manual ? 'Linked by hand' : 'Matched'} · {finishStamp(item.book)}</span>
                </span>
              </button>
              <button type="button" className={softButton} onClick={() => exclude(item)} aria-label={`Remove ${item.book.title} from ${data.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {picking && (
        <Modal labelId={`pick-${entry.id}`} eyebrow={data.name} title="Link a read book" onClose={() => setPicking(false)}>
          <p className="text-xs text-cozy-muted">Books that match the rules count automatically. Linking one by hand counts it even if it does not match.</p>
          <BookList
            books={readBooks(books).filter((b) => !listedIds.has(b.id))}
            suggested={readBooks(books).filter((b) => matchesRules(b, data))}
            onPick={link}
            openEditor={openEditor}
            onClose={() => setPicking(false)}
            emptyText="Every read book is already counted."
          />
        </Modal>
      )}
    </li>
  );
}

export default function CustomChallenges({ books, openEditor }) {
  const { entries, loading, add, update, remove } = useEntries('challenges.custom');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const run = async (promise) => {
    setError('');
    const result = await promise;
    if (result?.error) setError(result.error);
    return result;
  };

  const submit = async (fields) => {
    const existing = editing !== 'new' && entries.find((e) => e.id === editing);
    const result = existing
      ? await run(update(existing.id, { data: { ...existing.data, ...fields }, entry_date: fields.start }))
      : await run(add({ entry_date: fields.start, data: { ...fields, links: [], excluded: [] } }));
    if (!result.error) setEditing(null);
  };

  const editingEntry = editing && editing !== 'new' ? entries.find((e) => e.id === editing) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-cozy-muted max-w-md">Make your own challenge. Read books that fit the rules count automatically; link or remove books by hand to override.</p>
        {!editing && <button type="button" className={primaryButton} onClick={() => setEditing('new')}>+ New challenge</button>}
      </div>
      {editing && <ChallengeForm key={editing} initial={editingEntry?.data} onSubmit={submit} onCancel={() => setEditing(null)} />}
      <ErrorNote message={error} />
      {loading ? (
        <p className="text-sm text-cozy-muted">Loading challenges…</p>
      ) : entries.length === 0 ? (
        !editing && <p className="text-sm text-cozy-muted">No custom challenges yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <ChallengeCard
              key={entry.id}
              entry={entry}
              books={books}
              openEditor={openEditor}
              onSave={(data) => run(update(entry.id, { data }))}
              onEdit={() => setEditing(entry.id)}
              onDelete={() => confirm(`Delete "${entry.data.name}"?`) && run(remove(entry.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
