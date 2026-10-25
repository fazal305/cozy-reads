export const STATUSES = [
  { key: 'tbr', label: 'TBR', emoji: '📌' },
  { key: 'reading', label: 'Reading', emoji: '📖' },
  { key: 'read', label: 'Read', emoji: '✅' },
  { key: 'dnf', label: 'DNF', emoji: '🚪' },
  { key: 'wishlist', label: 'Wishlist', emoji: '🎁' },
];

export const FORMATS = [
  { key: 'owned', label: 'Owned' },
  { key: 'gifted', label: 'Gifted' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'library', label: 'Library' },
  { key: 'ebook', label: 'E-book' },
  { key: 'audiobook', label: 'Audiobook' },
  { key: 'arc', label: 'ARC' },
];

export const SEASONS = [
  { key: 'spring', label: 'Spring', emoji: '🌷' },
  { key: 'summer', label: 'Summer', emoji: '☀️' },
  { key: 'autumn', label: 'Autumn', emoji: '🍂' },
  { key: 'winter', label: 'Winter', emoji: '❄️' },
];

export const MOODS = [
  { key: 'swoon', emoji: '😍', label: 'Swoony' },
  { key: 'cozy', emoji: '☕', label: 'Cozy' },
  { key: 'funny', emoji: '😂', label: 'Funny' },
  { key: 'heartbroken', emoji: '😭', label: 'Heartbroken' },
  { key: 'shocked', emoji: '😱', label: 'Shocked' },
  { key: 'furious', emoji: '😤', label: 'Furious' },
  { key: 'spooky', emoji: '👻', label: 'Spooky' },
  { key: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { key: 'hopeful', emoji: '🌈', label: 'Hopeful' },
  { key: 'meh', emoji: '😴', label: 'Meh' },
];

export const GENRES = [
  'Romance',
  'Romantasy',
  'Fantasy',
  'Sci-Fi',
  'Thriller',
  'Mystery',
  'Horror',
  'Contemporary',
  'Historical',
  'Literary',
  'Non-fiction',
  'Memoir',
  'Young Adult',
  'Classics',
];

const SPINE_COLORS = ['#9A5B66', '#6D597A', '#355070', '#B5524F', '#4F7A63', '#8A6A3B', '#5E6B8C', '#7E4E6E', '#3F6E73'];

const GENRE_COLORS = {
  romance: '#B5524F',
  romantasy: '#7E4E6E',
  fantasy: '#6D597A',
  'sci-fi': '#355070',
  thriller: '#5E6B8C',
  mystery: '#3F6E73',
  horror: '#4A3A3A',
  contemporary: '#9A5B66',
  historical: '#8A6A3B',
  literary: '#4F7A63',
};

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function spineColor(book) {
  const genre = (book.genre || '').trim().toLowerCase();
  return GENRE_COLORS[genre] || SPINE_COLORS[hash(genre || book.title || '') % SPINE_COLORS.length];
}

export function moodEmoji(key) {
  return MOODS.find((m) => m.key === key)?.emoji || '';
}

export function statusLabel(key) {
  return STATUSES.find((s) => s.key === key)?.label || key;
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function currentMonth() {
  return today().slice(0, 7);
}

// Year a book counts towards: its finish date, else when it was logged.
export function readYear(book) {
  const stamp = book.finish_date || book.created_at;
  return stamp ? Number(String(stamp).slice(0, 4)) : null;
}

export function tbrOrder(book) {
  const order = book.extra?.order;
  return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER;
}
