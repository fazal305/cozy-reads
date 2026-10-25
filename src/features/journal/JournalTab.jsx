import { useState, useRef, useEffect, memo } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today } from '../../lib/bookMeta';
import { card, input, primaryButton, softButton } from '../../lib/ui';
import { Modal } from '../challenges/shared';
import PageCanvas from './PageCanvas';
import PageEditor, { StylePicker } from './PageEditor';
import { NotebookCover } from './covers';
import { COVERS } from './coverData';
import { getTemplate } from './templates';

const CURRENT_YEAR = String(new Date().getFullYear());

const orderOf = (entry, fallback) => (typeof entry.data.order === 'number' ? entry.data.order : fallback);

function sortPages(entries) {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => orderOf(a.e, a.i) - orderOf(b.e, b.i) || String(a.e.created_at).localeCompare(String(b.e.created_at)))
    .map(({ e }) => e);
}

function ErrorText({ children }) {
  if (!children) return null;
  return <p role="alert" className="text-xs text-cozy-accent-ink bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{children}</p>;
}

function NewPageDialog({ books, onCreate, onClose }) {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const [template, setTemplate] = useState('review');
  const [paper, setPaper] = useState(dark ? 'midnight' : 'cream');
  const [paperColor, setPaperColor] = useState('');
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const book = books.find((b) => b.id === bookId);
    const result = await onCreate({ template, paper, paperColor: paper === 'custom' ? paperColor : undefined, title: title.trim() || (book ? book.title : getTemplate(template).label), book_id: bookId || null });
    setBusy(false);
    if (result?.error) setError(result.error);
  };

  return (
    <Modal title="New page" eyebrow="Journal" labelId="journal-new-title" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <StylePicker template={template} paper={paper} paperColor={paperColor} onTemplate={setTemplate} onPaper={setPaper} onPaperColor={(c) => { setPaperColor(c); setPaper('custom'); }} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <label htmlFor="journal-new-name" className="block text-xs font-medium text-cozy-text">Page name</label>
            <input id="journal-new-name" className={input} value={title} maxLength={80} placeholder={getTemplate(template).label} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1 min-w-0">
            <label htmlFor="journal-new-book" className="block text-xs font-medium text-cozy-text">Link a book (optional)</label>
            <select id="journal-new-book" className={input} value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">No book</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={softButton}>Cancel</button>
          <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Creating…' : 'Create page'}</button>
        </div>
      </form>
    </Modal>
  );
}

function DetailsDialog({ entry, books, onSave, onClose }) {
  const [title, setTitle] = useState(entry.data.title || '');
  const [bookId, setBookId] = useState(entry.data.book_id || '');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const result = await onSave({ title: title.trim() || 'Untitled page', book_id: bookId || null });
    if (result?.error) setError(result.error);
    else onClose();
  };

  return (
    <Modal title="Page details" labelId="journal-details-title" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="journal-page-name" className="block text-xs font-medium text-cozy-text">Page name</label>
        <input id="journal-page-name" className={input} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="journal-page-book" className="block text-xs font-medium text-cozy-text">Linked book</label>
        <select id="journal-page-book" className={input} value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">No book</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={softButton}>Cancel</button>
          <button type="submit" className={primaryButton}>Save</button>
        </div>
      </form>
    </Modal>
  );
}

function CoverDialog({ settings, onSave, onClose }) {
  const [cover, setCover] = useState(settings.cover || COVERS[0].id);
  const [title, setTitle] = useState(settings.title || '');
  const [name, setName] = useState(settings.name || '');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const result = await onSave({ cover, title: title.trim(), name: name.trim() });
    if (result?.error) setError(result.error);
    else onClose();
  };

  return (
    <Modal title="Notebook cover" eyebrow="Journal" labelId="journal-cover-title" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <NotebookCover coverId={cover} title={title} name={name} />
        <fieldset>
          <legend className="text-xs font-medium text-cozy-text mb-2">Design</legend>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {COVERS.map((c) => (
              <button key={c.id} type="button" aria-pressed={cover === c.id} onClick={() => setCover(c.id)} className={`rounded-2xl p-1 border-2 text-left transition ${cover === c.id ? 'border-cozy-accent' : 'border-transparent hover:border-cozy-primary'}`}>
                <NotebookCover coverId={c.id} compact />
                <span className="block mt-1 px-0.5 text-[11px] text-cozy-text leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <label htmlFor="journal-cover-name" className="block text-xs font-medium text-cozy-text">Notebook title</label>
            <input id="journal-cover-name" className={input} value={title} maxLength={40} placeholder="My Reading Journal" onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1 min-w-0">
            <label htmlFor="journal-cover-owner" className="block text-xs font-medium text-cozy-text">Name or year (optional)</label>
            <input id="journal-cover-owner" className={input} value={name} maxLength={30} placeholder={CURRENT_YEAR} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={softButton}>Cancel</button>
          <button type="submit" className={primaryButton}>Save cover</button>
        </div>
      </form>
    </Modal>
  );
}

// Re-renders only when the saved page data changes, never while the editor is drawing.
const Thumbnail = memo(function Thumbnail({ data }) {
  return <PageCanvas page={{ template: data.template, paper: data.paper, paperColor: data.paperColor, items: data.items || [] }} />;
});

function PageCard({ entry, index, total, bookTitle, onOpen, onMove, onDetails, onDuplicate, onDelete }) {
  const title = entry.data.title || 'Untitled page';
  const iconButton = `${softButton} !px-2 !py-1`;
  return (
    <li className="min-w-0 flex flex-col">
      <button type="button" onClick={onOpen} aria-label={`Open ${title}`} className="block rounded-lg shadow-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition">
        <Thumbnail data={entry.data} />
      </button>
      <div className="mt-2 min-w-0">
        <p className="text-sm font-medium text-cozy-text truncate">{title}</p>
        <p className="text-[11px] text-cozy-muted truncate">{bookTitle ? `📖 ${bookTitle}` : getTemplate(entry.data.template).label}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${title} earlier`} className={iconButton}>←</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${title} later`} className={iconButton}>→</button>
        <button type="button" onClick={onDetails} aria-label={`Rename or link ${title}`} className={iconButton}>✎</button>
        <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${title}`} className={iconButton}>⧉</button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${title}`} className={iconButton}>🗑</button>
      </div>
    </li>
  );
}

export default function JournalTab({ books }) {
  const { entries, loading, error, add, update, remove } = useEntries('journal.page');
  const settingsApi = useEntries('journal.settings');
  const settingsEntry = settingsApi.entries[0];
  const settings = settingsEntry?.data || {};
  const [openId, setOpenId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [actionError, setActionError] = useState('');
  const entriesRef = useRef(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const pages = sortPages(entries);
  const openEntry = entries.find((e) => e.id === openId);
  const bookTitle = (id) => (id ? books.find((b) => b.id === id)?.title : null) || null;

  const run = async (promise) => {
    const result = await promise;
    setActionError(result?.error || '');
    return result;
  };

  const savePage = (id, patch) => {
    const latest = entriesRef.current.find((e) => e.id === id);
    if (!latest) return Promise.resolve({ error: 'Page not found.' });
    return update(id, { data: { ...latest.data, ...patch } });
  };

  const createPage = async ({ template, paper, paperColor, title, book_id }) => {
    const order = pages.reduce((max, p, i) => Math.max(max, orderOf(p, i)), -1) + 1;
    const result = await add({ data: { title, template, paper, ...(paperColor ? { paperColor } : {}), book_id, order, items: [] }, entry_date: today() });
    if (!result.error) {
      setDialog(null);
      setOpenId(result.data.id);
    }
    return result;
  };

  const move = async (index, delta) => {
    const a = pages[index];
    const b = pages[index + delta];
    if (!a || !b) return;
    let oa = orderOf(a, index);
    let ob = orderOf(b, index + delta);
    if (oa === ob) {
      oa = index;
      ob = index + delta;
    }
    const first = await run(savePage(a.id, { order: ob }));
    if (!first?.error) await run(savePage(b.id, { order: oa }));
  };

  const duplicate = (index) => {
    const page = pages[index];
    const next = pages[index + 1];
    const o = orderOf(page, index);
    const order = next ? (o + orderOf(next, index + 1)) / 2 : o + 1;
    return run(add({ data: { ...page.data, title: `${page.data.title || 'Untitled page'} (copy)`, order }, entry_date: today() }));
  };

  const saveCover = (data) => (settingsEntry ? settingsApi.update(settingsEntry.id, { data: { ...settings, ...data } }) : settingsApi.add({ data }));

  return (
    <section className={`${card} font-sans space-y-5`} aria-labelledby="journal-title">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 id="journal-title" className="font-serif text-xl text-cozy-text flex items-center gap-2">
            <span aria-hidden="true">📓</span> Journal
          </h2>
          <p className="text-cozy-muted text-sm mt-0.5">Free-form pages for stickers, notes and doodles.</p>
        </div>
        <button type="button" onClick={() => setDialog({ type: 'new' })} className={primaryButton}>+ New page</button>
      </div>

      <div className="relative">
        <NotebookCover coverId={settings.cover} title={settings.title} name={settings.name} />
        <button type="button" onClick={() => setDialog({ type: 'cover' })} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/90 text-[#4a3535] shadow hover:bg-white transition">
          🎨 Change cover
        </button>
      </div>

      <ErrorText>{error || actionError}</ErrorText>

      {loading ? (
        <p className="text-sm text-cozy-muted text-center py-6">Opening your notebook…</p>
      ) : pages.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-cozy-muted italic">No pages yet. Start one from a template.</p>
          <button type="button" onClick={() => setDialog({ type: 'new' })} className={softButton}>Create your first page</button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6" aria-label="Pages">
          {pages.map((page, index) => (
            <PageCard
              key={page.id}
              entry={page}
              index={index}
              total={pages.length}
              bookTitle={bookTitle(page.data.book_id)}
              onOpen={() => (String(page.id).startsWith('tmp-') ? null : setOpenId(page.id))}
              onMove={(delta) => move(index, delta)}
              onDetails={() => setDialog({ type: 'details', id: page.id })}
              onDuplicate={() => duplicate(index)}
              onDelete={() => setDialog({ type: 'delete', id: page.id })}
            />
          ))}
        </ul>
      )}

      {dialog?.type === 'new' && <NewPageDialog books={books} onCreate={createPage} onClose={() => setDialog(null)} />}
      {dialog?.type === 'cover' && <CoverDialog settings={settings} onSave={saveCover} onClose={() => setDialog(null)} />}
      {dialog?.type === 'details' && entries.some((e) => e.id === dialog.id) && (
        <DetailsDialog entry={entries.find((e) => e.id === dialog.id)} books={books} onSave={(patch) => savePage(dialog.id, patch)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'delete' && (
        <Modal title="Delete this page?" labelId="journal-delete-title" onClose={() => setDialog(null)}>
          <p className="text-sm text-cozy-text">
            “{entries.find((e) => e.id === dialog.id)?.data.title || 'Untitled page'}” and everything on it will be removed. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDialog(null)} className={softButton}>Keep page</button>
            <button
              type="button"
              onClick={async () => {
                const id = dialog.id;
                setDialog(null);
                await run(remove(id));
              }}
              className={primaryButton}
            >
              Delete page
            </button>
          </div>
        </Modal>
      )}

      {openEntry && (
        <PageEditor
          key={openEntry.id}
          entry={openEntry}
          bookTitle={bookTitle(openEntry.data.book_id)}
          onSave={(doc) => savePage(openEntry.id, doc)}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
