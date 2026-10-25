export const card = 'bg-cozy-card rounded-2xl border border-cozy-border p-5 sm:p-6 shadow-sm animate-fade-in';

export const input =
  'w-full px-3 py-2 rounded-xl border border-cozy-primary/60 bg-cozy-paper text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent';

export const primaryButton =
  'px-4 py-2 rounded-xl bg-cozy-accent-strong text-white text-xs font-medium shadow-sm hover:brightness-95 active:scale-95 transition disabled:opacity-50';

export const softButton =
  'px-3 py-1.5 rounded-xl text-xs font-medium border border-cozy-primary bg-cozy-bg text-cozy-text hover:border-cozy-accent hover:text-cozy-accent-ink transition disabled:opacity-40';

export function pill(active) {
  return `px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
    active
      ? 'bg-cozy-accent-strong text-white border-cozy-accent shadow-sm'
      : 'bg-cozy-bg text-cozy-text border-cozy-primary hover:border-cozy-accent hover:text-cozy-accent-ink'
  }`;
}
