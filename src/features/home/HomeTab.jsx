import GoalTracker from '../../components/GoalTracker';
import TropeMatrix from '../../components/TropeMatrix';
import AssetDownloads from '../../components/AssetDownloads';
import BookCover from '../../components/BookCover';
import { readYear } from '../../lib/bookMeta';
import { card } from '../../lib/ui';

const CURRENT_YEAR = new Date().getFullYear();

function Stat({ label, value }) {
  return (
    <div className="bg-cozy-bg rounded-xl border border-cozy-primary/60 p-3 text-center">
      <p className="font-serif text-2xl text-cozy-text">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-cozy-muted mt-0.5">{label}</p>
    </div>
  );
}

export default function HomeTab({ books, goalApi, openEditor, onSelectTab }) {
  const { goal, loading, error, logBook, updateChallenge, updateTropes, refetch } = goalApi;

  const reading = books.filter((b) => b.status === 'reading');
  const readThisYear = books.filter((b) => b.status === 'read' && readYear(b) === CURRENT_YEAR);
  const pages = readThisYear.reduce((sum, b) => sum + (b.pages || 0), 0);
  const rated = readThisYear.filter((b) => b.rating);
  const avg = rated.length ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1) : '–';

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="font-serif text-xl text-cozy-text mb-4">{CURRENT_YEAR} at a glance</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Books read" value={readThisYear.length} />
          <Stat label="Pages" value={pages.toLocaleString()} />
          <Stat label="Avg rating" value={avg === '–' ? avg : `${avg}★`} />
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-serif text-xl text-cozy-text">Currently reading</h2>
          <button type="button" onClick={() => onSelectTab('tbr')} className="text-xs text-cozy-accent hover:underline">
            Pick from TBR →
          </button>
        </div>
        {reading.length ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {reading.map((book) => (
              <button key={book.id} type="button" onClick={() => openEditor(book)} className="group w-24 shrink-0 text-left">
                <BookCover book={book} className="w-24 h-36 group-hover:-translate-y-1 transition" />
                <p className="font-serif text-xs font-semibold text-cozy-text truncate mt-1.5">{book.title}</p>
                {book.start_date && <p className="text-[10px] text-cozy-muted">since {book.start_date}</p>}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-cozy-muted italic">Nothing on the go. Shake the TBR jar for your next read.</p>
        )}
      </section>

      {loading && (
        <div className="space-y-6" aria-label="Loading your reading goal…" role="status">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-cozy-card rounded-2xl border border-cozy-border animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-cozy-card rounded-2xl border border-red-200 dark:border-red-900 p-6 text-center space-y-3">
          <p className="text-cozy-text">{error}</p>
          <button onClick={refetch} className="text-sm px-4 py-2 rounded-lg bg-cozy-accent text-white hover:bg-[#d97979] transition">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && !goal && (
        <div className="bg-cozy-card rounded-2xl border border-cozy-border p-6 text-center space-y-3">
          <p className="font-serif text-xl text-cozy-text">Nothing here yet</p>
          <p className="text-cozy-muted text-sm">
            Your reading goal for {CURRENT_YEAR} hasn't been created yet.
            Make sure the database trigger ran on signup, or contact the admin.
          </p>
          <button onClick={refetch} className="text-sm text-cozy-accent hover:underline">
            Refresh
          </button>
        </div>
      )}

      {!loading && !error && goal && (
        <>
          <GoalTracker goal={goal} onLogBook={logBook} onUpdateChallenge={updateChallenge} />
          <TropeMatrix selected={goal.favorite_tropes ?? []} onChange={updateTropes} />
        </>
      )}

      <AssetDownloads />
    </div>
  );
}
