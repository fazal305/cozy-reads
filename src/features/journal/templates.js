import { normHex, luminance, mixHex } from '../../lib/colorMath';

// Page geometry: A5-like portrait. Items store coordinates normalised to the page (0..1).
export const PAGE_W = 1000;
export const PAGE_H = 1414;
export const PAGE_RATIO = PAGE_H / PAGE_W;

export const TEMPLATES = [
  { id: 'blank', label: 'Blank' },
  { id: 'lined', label: 'Lined' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'grid', label: 'Grid' },
  { id: 'review', label: 'Book review' },
  { id: 'monthly', label: 'Monthly wrap-up' },
  { id: 'current', label: 'Currently reading' },
];

// Paper is part of the page itself, so it looks the same in either app theme;
// soft light papers and two dark papers keep it comfortable against both.
export const PAPERS = [
  { id: 'cream', label: 'Cream', bg: '#fbf6ee', line: '#e4d6c1', ink: '#4a3535', accent: '#c97b7b' },
  { id: 'white', label: 'White', bg: '#ffffff', line: '#e9e1e1', ink: '#3b2f2f', accent: '#e07f7f' },
  { id: 'blush', label: 'Blush', bg: '#fcecee', line: '#efc6cc', ink: '#5a3a3f', accent: '#cc6f7c' },
  { id: 'sage', label: 'Sage', bg: '#edf2e8', line: '#cbdac3', ink: '#33463a', accent: '#6a8d6c' },
  { id: 'sky', label: 'Sky', bg: '#ecf2f8', line: '#c9d9e8', ink: '#2f4258', accent: '#5c84ad' },
  { id: 'kraft', label: 'Kraft', bg: '#dcc6a3', line: '#bfa37a', ink: '#3e2f1f', accent: '#8a5a3b' },
  { id: 'midnight', label: 'Midnight', bg: '#23262f', line: '#3b404f', ink: '#ece6dc', accent: '#e3a3a8' },
  { id: 'cocoa', label: 'Cocoa', bg: '#2f2523', line: '#4b3b37', ink: '#f3e4de', accent: '#d97a7e' },
];

// A custom paper is the preset id 'custom' plus a hex colour stored beside it.
export function getPaper(id, color) {
  if (id === 'custom' && normHex(color)) {
    const bg = normHex(color);
    const dark = luminance(bg) < 0.4;
    const ink = dark ? '#f3ece6' : '#3b2f2f';
    return { id: 'custom', label: 'Custom', bg, line: mixHex(bg, ink, 0.18), ink, accent: mixHex(bg, ink, dark ? 0.55 : 0.5) };
  }
  return PAPERS.find((p) => p.id === id) || PAPERS[0];
}

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export const INK_COLORS = ['#3b2f2f', '#ffffff', '#b5524f', '#e88a8a', '#d9a441', '#4f7a63', '#355070', '#6d597a'];
export const HIGHLIGHT_COLORS = ['#ffe066', '#ff9ecb', '#9ef0b0', '#9ed8ff', '#cdb4ff'];
export const DECOR_COLORS = ['#f4b5b5', '#f6d68c', '#a8d5ba', '#a7c7e7', '#cdb4db', '#e8a87c', '#8a5a3b', '#3b2f2f'];

// Widths are fractions of the page width.
export const PEN_SIZES = [0.003, 0.005, 0.009];
export const HIGHLIGHTER_SIZES = [0.016, 0.026, 0.038];
export const BRUSH_SIZES = [0.006, 0.011, 0.018];
export const ERASER_RANGE = [0.008, 0.1];

export const FONTS = [
  { id: 'hand', label: 'Handwritten', css: '"Caveat", "Segoe Print", cursive' },
  { id: 'serif', label: 'Serif', css: '"Playfair Display", Georgia, serif' },
  { id: 'sans', label: 'Sans', css: '"DM Sans", system-ui, sans-serif' },
];
export const TEXT_SIZES = [
  { id: 's', label: 'S', value: 0.032 },
  { id: 'm', label: 'M', value: 0.045 },
  { id: 'l', label: 'L', value: 0.065 },
  { id: 'xl', label: 'XL', value: 0.095 },
];

export function fontCss(id) {
  return (FONTS.find((f) => f.id === id) || FONTS[0]).css;
}

export const round = (value, places = 4) => {
  const f = 10 ** places;
  return Math.round(value * f) / f;
};

export const newItemId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const WASHI_STYLES = [
  { id: 'plain', label: 'Plain tape' },
  { id: 'stripes', label: 'Striped tape' },
  { id: 'dots', label: 'Polka dot tape' },
  { id: 'gingham', label: 'Gingham tape' },
  { id: 'hearts', label: 'Heart tape' },
];

export const SHAPES = [
  { id: 'frame', label: 'Frame' },
  { id: 'double', label: 'Double frame' },
  { id: 'circle', label: 'Circle' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'ribbon', label: 'Ribbon banner' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded box' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'bubble', label: 'Speech bubble' },
  { id: 'thought', label: 'Thought bubble' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'flower', label: 'Flower' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'bookmark', label: 'Bookmark' },
  { id: 'tag', label: 'Label tag' },
  { id: 'banner', label: 'Banner' },
  { id: 'note', label: 'Sticky note' },
  { id: 'dotted', label: 'Dotted divider' },
  { id: 'wavy', label: 'Wavy divider' },
  { id: 'dline', label: 'Double divider' },
];

// Which controls a shape offers: a filled/outline switch and a corner radius.
const OPEN_SHAPES = ['line', 'arrow', 'dotted', 'wavy', 'dline', 'ribbon'];
const RADIUS_SHAPES = ['frame', 'double', 'rect', 'rounded', 'bubble'];
export const shapeCanFill = (id) => !OPEN_SHAPES.includes(id);
export const shapeHasRadius = (id) => RADIUS_SHAPES.includes(id);
