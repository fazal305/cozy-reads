import { readYear } from '../../lib/bookMeta';

export const CURRENT_YEAR = new Date().getFullYear();

// Links are stored as { id, title } so they survive a book being re-imported under a new id.
export function bookRef(book) {
  return book ? { id: book.id, title: book.title } : null;
}

export function findBook(books, ref) {
  if (!ref) return null;
  const byId = ref.id && books.find((b) => b.id === ref.id);
  if (byId) return byId;
  const title = String(ref.title || '').trim().toLowerCase();
  return title ? books.find((b) => String(b.title || '').trim().toLowerCase() === title) || null : null;
}

export function readBooks(books) {
  return books.filter((b) => b.status === 'read');
}

export function finishStamp(book) {
  return String(book.finish_date || book.created_at || '').slice(0, 10);
}

export function byFinish(a, b) {
  return finishStamp(a).localeCompare(finishStamp(b)) || String(a.title).localeCompare(String(b.title));
}

export function readInYear(books, year) {
  return readBooks(books).filter((b) => year === 'all' || readYear(b) === Number(year)).sort(byFinish);
}

export function yearOptions(books) {
  const years = new Set([CURRENT_YEAR]);
  readBooks(books).forEach((b) => {
    const y = readYear(b);
    if (y) years.add(y);
  });
  return [...years].sort((a, b) => b - a);
}

const startOfYear = new Date(CURRENT_YEAR, 0, 1);
export const DAY_OF_YEAR = Math.floor((Date.now() - startOfYear) / 86400000) + 1;
