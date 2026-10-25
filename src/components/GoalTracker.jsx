import { useState } from 'react';
import HeartParticles from './HeartParticles';

const CHALLENGE_OPTIONS = [12, 24, 36, 48, 75, 100];
const CURRENT_YEAR = new Date().getFullYear();

export default function GoalTracker({ goal, onLogBook, onUpdateChallenge }) {
  const [heartTrigger, setHeartTrigger] = useState(0);
  const [logError, setLogError] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  const pct = goal
    ? Math.min(100, Math.round((goal.books_read_count / goal.books_challenge_type) * 100))
    : 0;

  const handleLog = async () => {
    if (logLoading) return;
    setLogError('');
    setLogLoading(true);
    setHeartTrigger(t => t + 1);

    const result = await onLogBook();
    if (result?.error) setLogError(result.error);
    setLogLoading(false);
  };

  return (
    <section className="bg-cozy-card rounded-2xl border border-cozy-border p-6 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-cozy-text">
            {CURRENT_YEAR} Reading Challenge
          </h2>
          <p className="text-cozy-muted text-sm mt-0.5">
            {goal.books_read_count} of {goal.books_challenge_type} books
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="challenge-select" className="text-sm text-cozy-muted whitespace-nowrap">
            Goal:
          </label>
          <select
            id="challenge-select"
            value={goal.books_challenge_type}
            onChange={(e) => onUpdateChallenge(Number(e.target.value))}
            className="text-sm border border-cozy-primary rounded-lg px-2 py-1.5 bg-cozy-bg text-cozy-text focus:outline-none focus:ring-2 focus:ring-cozy-accent"
          >
            {CHALLENGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} books</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 mb-1">
        <div
          className="h-3 rounded-full bg-cozy-bg border border-cozy-primary overflow-hidden"
          role="progressbar"
          aria-valuenow={goal.books_read_count}
          aria-valuemin={0}
          aria-valuemax={goal.books_challenge_type}
          aria-label={`${pct}% of reading goal complete`}
        >
          <div
            className="h-full rounded-full bg-cozy-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-xs text-cozy-muted mt-1">{pct}%</p>
      </div>

      <div className="relative mt-4 flex justify-center">
        <HeartParticles trigger={heartTrigger} />
        <button
          onClick={handleLog}
          disabled={logLoading}
          aria-label="Log a finished book"
          className="relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cozy-accent text-white font-medium text-sm shadow-sm hover:bg-[#d97979] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">♥</span>
          {logLoading ? 'Saving…' : 'I finished a book!'}
        </button>
      </div>

      {logError && (
        <p role="alert" className="text-sm text-cozy-accent text-center mt-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-4 py-2">
          {logError}
        </p>
      )}

      {pct >= 100 && (
        <p className="text-center text-sm font-serif text-cozy-accent mt-4 animate-bounce-in">
          🎉 Challenge complete — what a reader!
        </p>
      )}
    </section>
  );
}
