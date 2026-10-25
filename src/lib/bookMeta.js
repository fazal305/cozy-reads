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

export const SPINE_SWATCHES = [
  { color: '#9A5B66', label: 'Rosewood' },
  { color: '#A9606F', label: 'Blush' },
  { color: '#B5524F', label: 'Brick' },
  { color: '#9A553A', label: 'Terracotta' },
  { color: '#8F6F1F', label: 'Mustard' },
  { color: '#8A6A3B', label: 'Ochre' },
  { color: '#5B7B60', label: 'Sage' },
  { color: '#4F7A63', label: 'Fern' },
  { color: '#3F6E73', label: 'Teal' },
  { color: '#44739B', label: 'Sky' },
  { color: '#355070', label: 'Navy' },
  { color: '#5E6B8C', label: 'Slate' },
  { color: '#75639F', label: 'Lilac' },
  { color: '#6D597A', label: 'Plum' },
  { color: '#7E4E6E', label: 'Mulberry' },
  { color: '#3D3A40', label: 'Charcoal' },
];

export const SPINE_STYLES = [
  { key: 'plain', label: 'Plain' },
  { key: 'stripes', label: 'Stripes' },
  { key: 'dots', label: 'Dots' },
  { key: 'gold', label: 'Gold band' },
];

const SPINE_PATTERNS = {
  stripes: { backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 4px, transparent 4px 9px)' },
  dots: { backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1.3px, transparent 1.8px)', backgroundSize: '7px 7px' },
  gold: {
    backgroundImage:
      'linear-gradient(to bottom, transparent 9%, #D4AF5A 9% 12%, transparent 12% 15%, #D4AF5A 15% 16%, transparent 16% 84%, #D4AF5A 84% 85%, transparent 85% 88%, #D4AF5A 88% 91%, transparent 91%)',
  },
};

export function spineColor(book) {
  const custom = book.extra?.spine_color;
  if (typeof custom === 'string' && /^#[0-9a-f]{6}$/i.test(custom)) return custom;
  const genre = (book.genre || '').trim().toLowerCase();
  return GENRE_COLORS[genre] || SPINE_COLORS[hash(genre || book.title || '') % SPINE_COLORS.length];
}

export function spineStyle(book) {
  return { backgroundColor: spineColor(book), ...SPINE_PATTERNS[book.extra?.spine_style] };
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
