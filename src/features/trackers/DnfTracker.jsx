import BookCover from '../../components/BookCover';
import { primaryButton } from '../../lib/ui';
import { SectionTitle, Empty, Stat } from './parts';

// "40%", "page 90" (of book.pages) or "ch 3" -> percent when it can be worked out.
function dnfPercent(book) {
  const text = String(book.dnf_progress || '').toLowerCase();
  const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return Math.min(100, Number(pct[1]));
  const page = text.match(/(?:p(?:age)?\.?\s*)?(\d+)/);
  if (page && book.pages && !/ch/.test(text)) return Math.min(100, Math.round((Number(page[1]) / book.pages) * 100));
  return null;
}

export default function DnfTracker({ books, openEditor }) {
  const dnf = books.filter((b) => b.status === 'dnf');
  const percents = dnf.map(dnfPercent).filter((p) => p !== null);
  const avg = percents.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : null;
  const withReason = dnf.filter((b) => b.dnf_reason?.trim()).length;

  return (
    <div>
      <SectionTitle icon="🚪" title="DNF tracker" subtitle="Books you set down, why, and how far you got.">
        <button type="button" className={primaryButton} onClick={() => openEditor(null, { status: 'dnf' })}>+ Add DNF</button>
      </SectionTitle>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="DNF books" value={dnf.length} />
        <Stat label="Avg. reached" value={avg === null ? '–' : `${avg}%`} />
        <Stat label="With a reason" value={withReason} />
      </div>

      {dnf.length === 0 ? (
        <Empty>No DNFs. Life is short, it's fine to stop a book that isn't working.</Empty>
      ) : (
        <ul className="space-y-3">
          {dnf.map((book) => {
            const pct = dnfPercent(book);
            return (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => openEditor(book)}
                  className="w-full text-left flex gap-3 rounded-2xl border border-cozy-border p-3 hover:border-cozy-accent transition"
                  aria-label={`Open ${book.title}`}
                >
                  <BookCover book={book} className="w-12 h-[4.5rem] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm text-cozy-text truncate">{book.title}</span>
                    {book.author && <span className="block text-xs text-cozy-muted truncate">{book.author}</span>}
                    <span className="block text-xs text-cozy-text mt-1.5 break-words">
                      <span className="font-semibold">Why:</span>{' '}
                      {book.dnf_reason?.trim() || <span className="text-cozy-muted">No reason noted</span>}
                    </span>
                    <span className="flex items-center gap-2 mt-1.5">
                      <span className="flex-1 h-2 rounded-full bg-cozy-bg border border-cozy-border overflow-hidden" aria-hidden="true">
                        <span className="block h-full bg-cozy-accent" style={{ width: `${pct ?? 0}%` }} />
                      </span>
                      <span className="text-[11px] text-cozy-muted whitespace-nowrap">
                        {book.dnf_progress || 'Progress not noted'}{pct !== null && !String(book.dnf_progress).includes('%') ? ` · ${pct}%` : ''}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
