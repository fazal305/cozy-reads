import GoalTracker from './GoalTracker';
import TropeMatrix from './TropeMatrix';
import AssetDownloads from './AssetDownloads';
import LibraryGrid from './LibraryGrid';
import StickerVault from './StickerVault';
import { useReadingGoal } from '../hooks/useReadingGoal';

const CURRENT_YEAR = new Date().getFullYear();

export default function Dashboard({ user, onSignOut }) {
  const { goal, loading, error, logBook, updateChallenge, updateTropes, refetch } = useReadingGoal(user.id);

  return (
    <div className="min-h-screen bg-cozy-bg">
      <header className="border-b border-cozy-border bg-cozy-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-7 h-7" />
            <span className="font-serif text-lg text-cozy-text">Cozy Reads</span>
          </div>
          <button
            onClick={onSignOut}
            className="text-sm text-cozy-muted hover:text-cozy-accent transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {loading && (
          <div className="space-y-6" aria-label="Loading your reading data…" role="status">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-40 bg-cozy-card rounded-2xl border border-cozy-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-cozy-card rounded-2xl border border-red-200 p-6 text-center space-y-3">
            <p className="text-cozy-text">{error}</p>
            <button
              onClick={refetch}
              className="text-sm px-4 py-2 rounded-lg bg-cozy-accent text-white hover:bg-[#d97979] transition"
            >
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
            <GoalTracker
              goal={goal}
              onLogBook={logBook}
              onUpdateChallenge={updateChallenge}
            />
            <TropeMatrix
              selected={goal.favorite_tropes ?? []}
              onChange={updateTropes}
            />
            <LibraryGrid userId={user.id} />
            <StickerVault />
            <AssetDownloads />
          </>
        )}
      </main>

      <footer className="border-t border-cozy-border mt-12 py-6 text-center text-xs text-cozy-muted">
        © {CURRENT_YEAR} Cozy Reads
      </footer>
    </div>
  );
}
