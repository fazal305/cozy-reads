import { PAGE_RATIO, round } from './templates';

// Page elements are laid out in units of 1% of the element's own width, so they
// scale as one piece. The screen (cqw) and the PNG export share these numbers.

export const ELEMENTS = [
  { id: 'checklist', label: 'Checklist', icon: '☑️' },
  { id: 'stars', label: 'Star rating', icon: '⭐' },
  { id: 'spice', label: 'Spice rating', icon: '🌶️' },
  { id: 'mood', label: 'Mood', icon: '😊' },
  { id: 'table', label: 'Table', icon: '▦' },
  { id: 'quote', label: 'Quote box', icon: '❝' },
];

export const MOODS = [
  { emoji: '😍', label: 'Swooning' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Cosy' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😢', label: 'Teary' },
  { emoji: '😡', label: 'Furious' },
];

export const CHECK = { pad: 3, row: 10, box: 5.6, text: 6.4, left: 12.5, maxRows: 12 };
export const RATING = { slot: 19, edge: 2.5, height: 20, icon: 15 };
export const MOOD = { height: 20, emoji: 10 };
export const TABLE = { row: 9, text: 4.6, pad: 1.4, max: 6 };
export const QUOTE = { height: 50, pad: 5, textTop: 13, textHeight: 26, byTop: 40, by: 4.6 };

// Star and chili outlines in a 0..1 box
export const STAR_D = (() => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const k = i % 2 ? 0.45 : 1;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${round(0.5 + 0.5 * k * Math.cos(a), 3)} ${round(0.54 + 0.5 * k * Math.sin(a), 3)} `;
  }
  return `${d}Z`;
})();
export const CHILI_D = 'M .2 .34 C .22 .18 .42 .12 .52 .26 C .62 .42 .74 .6 .96 .94 C .62 .9 .3 .74 .2 .34 Z M .3 .17 C .28 .08 .36 .03 .46 .07';

export function quoteSize(text) {
  const n = (text || '').length;
  if (n <= 50) return 7.5;
  if (n <= 110) return 6.2;
  if (n <= 190) return 5.2;
  return 4.4;
}

// Height in units for the current content.
export function elementUnits(item) {
  switch (item.kind) {
    case 'checklist':
      return CHECK.pad * 2 + item.items.length * CHECK.row;
    case 'stars':
    case 'spice':
      return RATING.height;
    case 'mood':
      return MOOD.height;
    case 'table':
      return item.rows * TABLE.row;
    default:
      return QUOTE.height;
  }
}

export const elementHeight = (item) => round((elementUnits(item) * item.w) / (100 * PAGE_RATIO));

// A patch that also keeps h in step with the content.
export function withHeight(item, patch) {
  const next = { ...item, ...patch };
  return { ...patch, h: elementHeight(next) };
}

const blankRow = () => ({ t: '', done: false });

export function newElement(kind, color) {
  const base = { type: 'element', kind, color, font: kind === 'quote' ? 'serif' : 'hand', w: 0.5 };
  let item;
  switch (kind) {
    case 'checklist':
      item = { ...base, items: [blankRow(), blankRow(), blankRow()] };
      break;
    case 'stars':
      item = { ...base, color: '#e3a82b', value: 0, w: 0.5 };
      break;
    case 'spice':
      item = { ...base, color: '#d9483b', value: 0, w: 0.5 };
      break;
    case 'mood':
      item = { ...base, value: null, w: 0.56 };
      break;
    case 'table':
      item = { ...base, rows: 3, cols: 3, cells: Array.from({ length: 3 }, () => Array(3).fill('')), w: 0.62 };
      break;
    default:
      item = { ...base, quote: '', by: '', w: 0.62 };
  }
  return { ...item, h: elementHeight(item) };
}

export function resizeCells(cells, rows, cols) {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => cells[r]?.[c] ?? ''));
}
