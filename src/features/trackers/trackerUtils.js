import { useState, useCallback } from 'react';

const DAY = 86400000;

export function dayNumber(ymd) {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
}

export function formatDate(ymd, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export function monthLabel(ym, long = true) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: long ? 'long' : 'short', year: long ? 'numeric' : undefined });
}

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Streaks over a set of 'YYYY-MM-DD' strings. Current streak may end today or yesterday.
export function streaks(dates, todayYmd) {
  const days = [...new Set(dates.filter(Boolean).map(dayNumber))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const set = new Set(days);
  let cursor = dayNumber(todayYmd);
  if (!set.has(cursor)) cursor -= 1;
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, longest };
}

export function normName(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function money(value) {
  return (Number(value) || 0).toFixed(2);
}

// Wraps a { error } returning call and keeps the last error message for display.
export function useRunner() {
  const [error, setError] = useState(null);
  const run = useCallback(async (promise) => {
    const result = await promise;
    setError(result?.error || null);
    return result;
  }, []);
  return { error, run };
}
