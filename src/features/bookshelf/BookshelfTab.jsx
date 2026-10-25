import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { STATUSES, FORMATS, spineStyle, moodEmoji, statusLabel } from '../../lib/bookMeta';
import { card, input, primaryButton, pill } from '../../lib/ui';

const RATING_FILTERS = [
  { key: 'any', label: 'Any rating' },
  { key: '5', label: '★★★★★ only' },
  { key: '4', label: '4★ and up' },
  { key: '3', label: '3★ and up' },
  { key: 'none', label: 'Unrated' },
];

function matchesRating(book, filter) {
  if (filter === 'any') return true;
  if (filter === 'none') return !book.rating;
  return (book.rating || 0) >= Number(filter);
}

function Spine({ book, onOpen }) {
  const height = 120 + Math.min(60, Math.round((book.pages || 300) / 12));
  const width = 26 + Math.min(14, Math.round((book.pages || 300) / 80));
  return (
    <div className="h-[200px] pb-[10px] flex flex-col justify-end px-[1px]">
      <button
        type="button"
        onClick={() => onOpen(book)}
        title={`${book.title}${book.author ? ` by ${book.author}` : ''}`}
        aria-label={`Open ${book.title}`}
        style={{ height, width, ...spineStyle(book) }}
        className="relative rounded-t-sm shadow-[inset_-3px_0_0_rgba(0,0,0,0.18),inset_2px_0_0_rgba(255,255,255,0.15)] hover:-translate-y-2 transition flex items-center justify-center overflow-hidden"
      >
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold text-white/95 tracking-wide truncate max-h-[85%] px-0.5">
          {book.title}
        </span>
        {book.favorite && <span className="absolute top-1 text-[9px]" aria-hidden="true">★</span>}
      </button>
    </div>
  );
}

export default function BookshelfTab({ books, booksApi, openEditor }) {
  const [view, setView] = useState('covers');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [genre, setGenre] = useState('all');
  const [format, setFormat] = useState('all');
  const [rating, setRating] = useState('any');
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const genres = [...new Set(books.map((b) => b.genre).filter(Boolean))].sort();
  const q = query.trim().toLowerCase();

  const filtered = books.filter((b) => {
    if (view === 'shelf' && b.status !== 'read') return false;
    if (view === 'covers' && status !== 'all' && b.status !== status) return false;
    if (genre !== 'all' && b.genre !== genre) return false;
    if (format !== 'all' && b.format !== format) return false;
    if (!matchesRating(b, rating)) return false;
    if (favouritesOnly && !(b.favorite || b.rating === 5)) return false;
    if (q && !`${b.title} ${b.author || ''} ${b.series_name || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const filtersActive = status !== 'all' || genre !== 'all' || format !== 'all' || rating !== 'any' || favouritesOnly || q;
  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setGenre('all');
    setFormat('all');
    setRating('any');
    setFavouritesOnly(false);
  };

  return (
    <section className={`${card} font-sans`}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-serif text-xl text-cozy-text flex items-center gap-2">
            <span aria-hidden="true">📚</span> Bookshelf
          </h2>
          <p className="text-cozy-muted text-sm mt-0.5">
            {filtered.length} of {books.length} {books.length === 1 ? 'book' : 'books'} · tap any book to open its journal
          </p>
        </div>
        <button type="button" onClick={() => openEditor(null, { status: 'read' })} className={primaryButton}>
          + Add book
        </button>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex gap-2">
          <input
            type="search"
            aria-label="Search books"
            className={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author or series…"
          />
          <div className="flex rounded-xl bg-cozy-bg p-1 border border-cozy-primary shrink-0" role="group" aria-label="View">
            {[
              { key: 'covers', label: 'Covers' },
              { key: 'shelf', label: 'Shelf' },
            ].map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                aria-pressed={view === v.key}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                  view === v.key ? 'bg-cozy-accent-strong text-white shadow-sm' : 'text-cozy-muted hover:text-cozy-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select aria-label="Filter by status" className={input} value={view === 'shelf' ? 'read' : status} disabled={view === 'shelf'} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select aria-label="Filter by genre" className={input} value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="all">All genres</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select aria-label="Filter by format" className={input} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">All formats</option>
            {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select aria-label="Filter by rating" className={input} value={rating} onChange={(e) => setRating(e.target.value)}>
            {RATING_FILTERS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setFavouritesOnly(!favouritesOnly)} aria-pressed={favouritesOnly} className={pill(favouritesOnly)}>
            ★ 5-star &amp; favourites
          </button>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="text-xs text-cozy-accent-ink hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {booksApi.loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] bg-cozy-bg rounded-2xl border border-cozy-primary/40 animate-pulse" />
          ))}
        </div>
      ) : booksApi.error ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-cozy-text">{booksApi.error}</p>
          <button type="button" onClick={booksApi.reload} className={primaryButton}>Try again</button>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 px-4 bg-cozy-bg rounded-2xl border border-dashed border-cozy-primary/70 space-y-3">
          <div className="text-4xl" aria-hidden="true">🌸 📖</div>
          <h3 className="font-serif text-lg text-cozy-text">Your bookshelf is ready</h3>
          <p className="text-xs text-cozy-muted max-w-sm mx-auto leading-relaxed">
            Add the books you have read, are reading, or want to read, and collect your favourite quotes.
          </p>
          <button type="button" onClick={() => openEditor(null, { status: 'read' })} className={primaryButton}>
            + Add your first book
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-cozy-muted italic text-center py-10">
          {view === 'shelf' ? 'No finished books match these filters yet.' : 'No books match these filters.'}
        </p>
      ) : view === 'shelf' ? (
        <div className="rounded-2xl bg-[#F3E3D3] dark:bg-[#2B1F18] border border-[#D9B99B] dark:border-[#4A3426] p-3 sm:p-4">
          <div className="flex flex-wrap items-end bg-[repeating-linear-gradient(to_bottom,transparent_0_190px,#8B5E3C_190px_200px)] dark:bg-[repeating-linear-gradient(to_bottom,transparent_0_190px,#5C3D27_190px_200px)]">
            {filtered.map((book) => <Spine key={book.id} book={book} onOpen={openEditor} />)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((book) => (
            <button
              type="button"
              key={book.id}
              onClick={() => openEditor(book)}
              className="group text-left bg-cozy-paper border border-cozy-primary/50 rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col"
            >
              <div className="relative mb-2.5">
                <BookCover book={book} className="aspect-[2/3] w-full" />
                {book.rating ? (
                  <span className="absolute top-2 right-2 bg-cozy-paper/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-500 shadow-sm border border-cozy-primary/40" aria-label={`${book.rating} out of 5 stars`}>
                    {'★'.repeat(book.rating)}
                  </span>
                ) : null}
                <span className="absolute bottom-2 left-2 bg-cozy-paper/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-cozy-text border border-cozy-primary/40">
                  {statusLabel(book.status)}
                </span>
                {book.mood && (
                  <span className="absolute bottom-2 right-2 text-base" aria-hidden="true">{moodEmoji(book.mood)}</span>
                )}
              </div>
              <h4 className="font-serif text-sm font-semibold text-cozy-text truncate leading-tight group-hover:text-cozy-accent-ink transition">
                {book.favorite && <span className="text-amber-500 mr-1" aria-label="Favourite">★</span>}
                {book.title}
              </h4>
              <p className="text-xs text-cozy-muted truncate mt-0.5">{book.author || 'Unknown author'}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
