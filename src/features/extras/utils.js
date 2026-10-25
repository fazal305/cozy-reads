import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today } from '../../lib/bookMeta';

export const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'INR', 'AED', 'SAR', 'CAD', 'AUD'];

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function parseDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  return y && m ? new Date(y, m - 1, d || 1) : null;
}

export function monthLabel(value, style = 'long') {
  const date = parseDate(value);
  return date ? date.toLocaleDateString(undefined, { month: style, year: 'numeric' }) : value;
}

export function dateLabel(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export function daysUntil(value) {
  const date = parseDate(value);
  const now = parseDate(today());
  return date ? Math.round((date - now) / 86400000) : null;
}

export function countdown(value) {
  const days = daysUntil(value);
  if (days === null) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `in ${days} days`;
  return days === -1 ? 'Yesterday' : `${-days} days ago`;
}

export function shiftMonth(value, delta) {
  const date = parseDate(value);
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMoney(amount, currency) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function bookTitle(books, id, fallback = '') {
  return books.find((b) => b.id === id)?.title || fallback;
}

export function useSettings() {
  const api = useEntries('extras.settings');
  const entry = api.entries[0];
  const settings = { currency: 'PKR', ...entry?.data };
  const save = (patch) => {
    const data = { ...settings, ...patch };
    return entry ? api.update(entry.id, { data }) : api.add({ data });
  };
  return { settings, save, loading: api.loading };
}

export function useRunner() {
  const [error, setError] = useState('');
  const run = async (promise) => {
    setError('');
    const result = await promise;
    if (result?.error) setError(result.error);
    return result;
  };
  return { error, run, setError };
}

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
