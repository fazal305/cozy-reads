const STORAGE_KEY = 'cozy-reads-theme';
const PALETTE_KEY = 'cozy-reads-palette';

export const PALETTES = [
  { id: 'rose', label: 'Rose', swatch: ['#F4B5B5', '#E88A8A'] },
  { id: 'sage', label: 'Sage', swatch: ['#B8CFB7', '#547559'] },
  { id: 'lavender', label: 'Lavender', swatch: ['#CEC2EA', '#7A5EA6'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#B3CBE0', '#466C90'] },
  { id: 'mocha', label: 'Mocha', swatch: ['#DDC4AE', '#8B5E42'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#161C30', '#7080D6'], darkOnly: true },
  { id: 'blush', label: 'Blush', swatch: ['#2D1B25', '#D56E9E'], darkOnly: true },
];

export function isDarkOnly(palette) {
  return Boolean(PALETTES.find((p) => p.id === palette)?.darkOnly);
}

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage blocked; fall through to the system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialPalette() {
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    if (PALETTES.some((p) => p.id === saved)) return saved;
  } catch {
    // Storage blocked; use the default palette
  }
  return 'rose';
}

export function applyTheme(theme, palette = getInitialPalette()) {
  const root = document.documentElement;
  root.dataset.palette = palette;
  root.classList.toggle('dark', theme === 'dark' || isDarkOnly(palette));
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not persisted; the choice still applies for this visit
  }
}

export function savePalette(palette) {
  try {
    localStorage.setItem(PALETTE_KEY, palette);
  } catch {
    // Not persisted; the choice still applies for this visit
  }
}
