import { useState } from 'react';
import BookCover from '../../components/BookCover';
import TbrJar from './TbrJar';
import { SEASONS, today, currentMonth, tbrOrder } from '../../lib/bookMeta';
import { card, input, pill, primaryButton, softButton } from '../../lib/ui';

const VIEWS = [
  { key: 'list', label: '📌 TBR list' },
  { key: 'jar', label: '🫙 TBR jar' },
  { key: 'seasons', label: '🍂 Seasonal' },
  { key: 'hopefuls', label: '🗓️ Monthly hopefuls' },
  { key: 'wishlist', label: '🎁 Wishlist' },
];

function sortTbr(books) {
  return [...books].sort((a, b) => tbrOrder(a) - tbrOrder(b) || String(a.created_at).localeCompare(String(b.created_at)));
}

function monthLabel(value) {
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function BookRow({ book, onOpen, children }) {
  return (
    <li className="flex items-center gap-3 p-2.5 rounded-xl bg-cozy-bg border border-cozy-primary/60">
      <button type="button" onClick={() => onOpen(book)} className="flex items-center gap-3 min-w-0 flex-1 text-left group">
        <BookCover book={book} className="w-10 h-14 shrink-0" />
        <span className="min-w-0">
          <span className="block font-serif text-sm text-cozy-text truncate group-hover:text-cozy-accent transition">{book.title}</span>
          <span className="block text-xs text-cozy-muted truncate">{book.author || 'Unknown author'}</span>
        </span>
      </button>
      <div className="flex items-center gap-1 shrink-0">{children}</div>
    </li>
  );
}

function QuickAdd({ onAdd, withPrice = false, label }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    const result = await onAdd({ title: title.trim(), author: author.trim(), price });
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setTitle('');
    setAuthor('');
    setPrice('');
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className={`grid gap-2 ${withPrice ? 'grid-cols-2 sm:grid-cols-[2fr_2fr_1fr_auto]' : 'grid-cols-2 sm:grid-cols-[2fr_2fr_auto]'}`}>
        <input aria-label="Title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <input aria-label="Author" className={input} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
        {withPrice && (
          <input aria-label="Price" type="number" min="0" step="0.01" className={input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
        )}
        <button type="submit" disabled={busy || !title.trim()} className={`${primaryButton} ${withPrice ? '' : 'col-span-2 sm:col-span-1'}`}>
          {label}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-cozy-accent">{error}</p>}
    </form>
  );
}

export default function TbrTab({ books, booksApi, openEditor }) {
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState('');

  const tbr = sortTbr(books.filter((b) => b.status === 'tbr'));
  const wishlist = books.filter((b) => b.status === 'wishlist');

  const run = async (promise) => {
    setError('');
    const result = await promise;
    if (result?.error) setError(result.error);
    return result;
  };

  const addTbr = ({ title, author }) => {
    const nextOrder = tbr.reduce((max, b) => Math.max(max, typeof b.extra?.order === 'number' ? b.extra.order : -1), -1) + 1;
    return booksApi.addBook({ title, author, status: 'tbr', rating: null, extra: { order: nextOrder } });
  };

  const addWish = ({ title, author, price }) =>
    booksApi.addBook({ title, author, status: 'wishlist', rating: null, extra: price !== '' ? { price: Number(price) } : {} });

  const move = async (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= tbr.length) return;
    const ordered = [...tbr];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const changes = ordered
      .map((book, order) => ({ book, order }))
      .filter(({ book, order }) => book.extra?.order !== order);
    await Promise.all(changes.map(({ book, order }) => run(booksApi.updateBook(book.id, { extra: { ...book.extra, order } }))));
  };

  const startReading = (book) => run(booksApi.updateBook(book.id, { status: 'reading', start_date: today() }));

  const hopefuls = tbr.filter((b) => b.extra?.month === month);
  const notHopeful = tbr.filter((b) => b.extra?.month !== month);
  const wishTotal = wishlist.reduce((sum, b) => sum + (Number(b.extra?.price) || 0), 0);

  return (
    <section className={`${card} font-sans space-y-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-cozy-text">To Be Read</h2>
          <p className="text-cozy-muted text-sm mt-0.5">
            {tbr.length} waiting on the pile · {wishlist.length} on the wishlist
          </p>
        </div>
        <button type="button" onClick={() => openEditor(null, { status: view === 'wishlist' ? 'wishlist' : 'tbr', rating: null })} className={softButton}>
          + Add with details
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1" role="group" aria-label="TBR views">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" onClick={() => setView(v.key)} aria-pressed={view === v.key} className={pill(view === v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-xs text-cozy-accent bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>}

      {view === 'list' && (
        <div className="space-y-4">
          <QuickAdd onAdd={addTbr} label="+ Add to TBR" />
          {tbr.length ? (
            <ol className="space-y-2">
              {tbr.map((book, i) => (
                <BookRow key={book.id} book={book} onOpen={openEditor}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${book.title} up`} className={`${softButton} px-2`}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === tbr.length - 1} aria-label={`Move ${book.title} down`} className={`${softButton} px-2`}>↓</button>
                  <button type="button" onClick={() => startReading(book)} className={`${primaryButton} px-3`}>Start</button>
                </BookRow>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-cozy-muted italic text-center py-6">Your TBR pile is empty. Add the books calling your name.</p>
          )}
        </div>
      )}

      {view === 'jar' && <TbrJar tbr={tbr} booksApi={booksApi} openEditor={openEditor} />}

      {view === 'seasons' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SEASONS.map((season) => {
            const list = tbr.filter((b) => b.season === season.key);
            return (
              <div key={season.key} className="rounded-2xl bg-cozy-bg border border-cozy-primary/60 p-4">
                <h3 className="font-serif text-base text-cozy-text mb-3">
                  <span aria-hidden="true">{season.emoji}</span> {season.label} TBR
                  <span className="text-xs text-cozy-muted font-sans ml-2">{list.length}</span>
                </h3>
                {list.length ? (
                  <ul className="space-y-2">
                    {list.map((book) => (
                      <li key={book.id}>
                        <button type="button" onClick={() => openEditor(book)} className="w-full flex items-center gap-2 text-left group">
                          <BookCover book={book} className="w-8 h-12 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-sm font-serif text-cozy-text truncate group-hover:text-cozy-accent">{book.title}</span>
                            <span className="block text-[11px] text-cozy-muted truncate">{book.author}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-cozy-muted italic">No books yet. Set a season in a TBR book's details.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'hopefuls' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label htmlFor="hopeful-month" className="block text-xs font-medium text-cozy-text">Month</label>
              <input id="hopeful-month" type="month" className={input} value={month} onChange={(e) => setMonth(e.target.value || currentMonth())} />
            </div>
            {notHopeful.length > 0 && (
              <div className="space-y-1 flex-1 min-w-[12rem]">
                <label htmlFor="hopeful-add" className="block text-xs font-medium text-cozy-text">Add a TBR book</label>
                <select
                  id="hopeful-add"
                  className={input}
                  value=""
                  onChange={(e) => {
                    const book = tbr.find((b) => b.id === e.target.value);
                    if (book) run(booksApi.updateBook(book.id, { extra: { ...book.extra, month } }));
                  }}
                >
                  <option value="">Choose a book…</option>
                  {notHopeful.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>
            )}
          </div>
          <h3 className="font-serif text-base text-cozy-text">Hoping to read in {monthLabel(month)}</h3>
          {hopefuls.length ? (
            <ul className="space-y-2">
              {hopefuls.map((book) => (
                <BookRow key={book.id} book={book} onOpen={openEditor}>
                  <button
                    type="button"
                    onClick={() => {
                      const rest = { ...book.extra };
                      delete rest.month;
                      run(booksApi.updateBook(book.id, { extra: rest }));
                    }}
                    aria-label={`Remove ${book.title} from ${monthLabel(month)}`}
                    className={`${softButton} px-2`}
                  >
                    ✕
                  </button>
                  <button type="button" onClick={() => startReading(book)} className={`${primaryButton} px-3`}>Start</button>
                </BookRow>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cozy-muted italic">No hopefuls picked for this month yet.</p>
          )}
        </div>
      )}

      {view === 'wishlist' && (
        <div className="space-y-4">
          <QuickAdd onAdd={addWish} withPrice label="+ Wish" />
          {wishlist.length ? (
            <>
              <ul className="space-y-2">
                {wishlist.map((book) => (
                  <BookRow key={book.id} book={book} onOpen={openEditor}>
                    {book.extra?.price !== undefined && (
                      <span className="text-xs font-semibold text-cozy-text mr-1">{Number(book.extra.price).toFixed(2)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => run(booksApi.updateBook(book.id, { status: 'tbr', format: book.format || 'owned' }))}
                      className={`${primaryButton} px-3`}
                    >
                      Got it!
                    </button>
                  </BookRow>
                ))}
              </ul>
              {wishTotal > 0 && (
                <p className="text-right text-xs text-cozy-muted">Wishlist total: <strong className="text-cozy-text">{wishTotal.toFixed(2)}</strong></p>
              )}
            </>
          ) : (
            <p className="text-sm text-cozy-muted italic text-center py-6">Nothing on the wishlist. Add the books you are eyeing.</p>
          )}
        </div>
      )}
    </section>
  );
}
