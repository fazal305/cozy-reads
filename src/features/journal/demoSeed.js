import { today } from '../../lib/bookMeta';

const r3 = (n) => Math.round(n * 1000) / 1000;

// A small hand-drawn heart and a wavy underline, as stored point lists.
function heart(cx, cy, s) {
  const pts = [];
  for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.18) {
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push(r3(cx + (x * s) / 16), r3(cy - (y * s * 0.707) / 16));
  }
  return pts;
}

function wave(x0, x1, y, amp) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.001; x += 0.02) pts.push(r3(x), r3(y + Math.sin((x - x0) * 40) * amp));
  return pts;
}

export const JOURNAL_SEED_ENTRIES = [
  {
    kind: 'journal.settings',
    entry_date: null,
    data: { cover: 'croc-pink', title: 'My Reading Journal', name: String(new Date().getFullYear()) },
  },
  {
    kind: 'journal.page',
    entry_date: today(),
    data: {
      title: 'Fourth Wing review',
      template: 'review',
      paper: 'cream',
      book_id: null,
      order: 0,
      items: [
        { id: 'seed-t1', type: 'text', text: 'Fourth Wing', font: 'hand', size: 0.05, color: '#4a3535', x: 0.22, y: 0.145, w: 0.6, h: 0.06, r: 0 },
        { id: 'seed-t2', type: 'text', text: 'Rebecca Yarros', font: 'hand', size: 0.045, color: '#4a3535', x: 0.24, y: 0.2, w: 0.55, h: 0.06, r: 0 },
        { id: 'seed-t3', type: 'text', text: 'Fly or die.', font: 'serif', size: 0.05, color: '#b5524f', x: 0.2, y: 0.43, w: 0.6, h: 0.08, r: -3 },
        { id: 'seed-t4', type: 'text', text: 'Dragons, banter and a war college.\nCould not put it down!', font: 'hand', size: 0.042, color: '#4a3535', x: 0.08, y: 0.6, w: 0.62, h: 0.12, r: 0 },
        { id: 'seed-w1', type: 'washi', style: 'stripes', color: '#f4b5b5', x: 0.62, y: 0.03, w: 0.34, h: 0.034, r: 12 },
        { id: 'seed-s1', type: 'sticker', sticker: 'five-star', x: 0.7, y: 0.6, w: 0.24, h: 0.17, r: 8 },
        { id: 'seed-s2', type: 'sticker', sticker: 'enemies-to-lovers', x: 0.66, y: 0.79, w: 0.28, h: 0.198, r: -6 },
        { id: 'seed-k1', type: 'stroke', tool: 'highlighter', color: '#ffe066', size: 0.026, pts: [0.22, 0.183, 0.36, 0.183, 0.5, 0.183, 0.62, 0.183] },
        { id: 'seed-k2', type: 'stroke', tool: 'pen', color: '#b5524f', size: 0.005, pts: heart(0.1, 0.08, 0.05) },
      ],
    },
  },
  {
    kind: 'journal.page',
    entry_date: today(),
    data: {
      title: 'Autumn reading notes',
      template: 'lined',
      paper: 'sage',
      book_id: null,
      order: 1,
      items: [
        { id: 'seed-t5', type: 'text', text: 'Autumn TBR mood', font: 'serif', size: 0.07, color: '#33463a', x: 0.15, y: 0.04, w: 0.75, h: 0.07, r: 0 },
        { id: 'seed-k3', type: 'stroke', tool: 'pen', color: '#6a8d6c', size: 0.004, pts: wave(0.18, 0.82, 0.115, 0.006) },
        { id: 'seed-t6', type: 'text', text: '• Babel for the dark academia vibes\n• Mexican Gothic before Halloween\n• one cozy re-read', font: 'hand', size: 0.045, color: '#33463a', x: 0.13, y: 0.155, w: 0.78, h: 0.14, r: 0 },
        { id: 'seed-f1', type: 'shape', shape: 'frame', color: '#e8a87c', x: 0.12, y: 0.5, w: 0.5, h: 0.26, r: -2 },
        { id: 'seed-s3', type: 'sticker', sticker: 'cozy-teacup', x: 0.65, y: 0.55, w: 0.26, h: 0.18, r: 0 },
        { id: 'seed-w2', type: 'washi', style: 'dots', color: '#a7c7e7', x: 0.08, y: 0.48, w: 0.2, h: 0.03, r: -30 },
      ],
    },
  },
  {
    kind: 'journal.page',
    entry_date: today(),
    data: { title: 'Monthly wrap-up', template: 'monthly', paper: 'blush', book_id: null, order: 2, items: [] },
  },
];
