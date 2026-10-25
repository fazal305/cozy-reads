import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BookCover from '../../components/BookCover';
import { today } from '../../lib/bookMeta';
import { yearOptions } from './challengeUtils';
import { input, softButton } from '../../lib/ui';

export function YearSelect({ id, value, onChange, books, allowAll = false }) {
  return (
    <select id={id} aria-label="Year" className={`${input.replace('w-full ', '')} w-auto`} value={value} onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
      {allowAll && <option value="all">All time</option>}
      {yearOptions(books).map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

export function ErrorNote({ message }) {
  if (!message) return null;
  return <p role="alert" className="text-xs text-cozy-accent">{message}</p>;
}

export function ProgressRing({ value, max, size = 96, label }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${value} of ${max}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-cozy-primary/40" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="stroke-cozy-accent transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-serif text-xl text-cozy-text leading-none">{value}</span>
        <span className="text-[10px] text-cozy-muted">of {max}</span>
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded-full bg-cozy-primary/30 overflow-hidden" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <div className="h-full bg-cozy-accent rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ title, eyebrow, onClose, children, labelId }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Portalled: the tab card's fade-in transform would otherwise trap position: fixed.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onClick={(e) => e.stopPropagation()}
        className="bg-cozy-card border border-cozy-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-xl p-5 sm:p-6 space-y-4 font-sans focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-wider text-cozy-accent">{eyebrow}</span>}
            <h3 id={labelId} className="font-serif text-xl text-cozy-text leading-tight break-words">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full bg-cozy-bg border border-cozy-primary text-cozy-text hover:bg-cozy-accent hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// Searchable list of books; `suggested` float to the top with a badge.
// onClose runs before the book editor opens, so the editor is not stacked under this dialog.
export function BookList({ books, selectedId, suggested = [], onPick, openEditor, onClose, emptyText = 'No read books yet.' }) {
  const [query, setQuery] = useState('');
  const suggestedIds = new Set(suggested.map((b) => b.id));
  const q = query.trim().toLowerCase();
  const list = [...books]
    .filter((b) => !q || `${b.title} ${b.author || ''}`.toLowerCase().includes(q))
    .sort((a, b) => Number(suggestedIds.has(b.id)) - Number(suggestedIds.has(a.id)) || String(a.title).localeCompare(String(b.title)));

  return (
    <div className="space-y-3">
      <input type="search" aria-label="Search books" placeholder="Search your read books" className={input} value={query} onChange={(e) => setQuery(e.target.value)} />
      {list.length === 0 ? (
        <p className="text-sm text-cozy-muted">{books.length ? 'No books match that search.' : emptyText}</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {list.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => onPick(book)}
                aria-pressed={selectedId === book.id}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${
                  selectedId === book.id ? 'border-cozy-accent bg-cozy-accent/10' : 'border-cozy-primary/60 bg-cozy-bg hover:border-cozy-accent'
                }`}
              >
                <BookCover book={book} className="w-9 h-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-sm text-cozy-text truncate">{book.title}</span>
                  <span className="block text-xs text-cozy-muted truncate">{book.author || 'Unknown author'}</span>
                </span>
                {suggestedIds.has(book.id) && <span className="text-[10px] font-semibold uppercase tracking-wide text-cozy-accent shrink-0">Match</span>}
                {selectedId === book.id && <span className="text-cozy-accent shrink-0" aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {openEditor && (
        <button type="button" className={softButton} onClick={() => {
          onClose?.();
          openEditor(null, { status: 'read', finish_date: today() });
        }}>
          + Log a newly read book
        </button>
      )}
    </div>
  );
}
