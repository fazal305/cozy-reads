import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const STICKER_DIR = './public/stickers';
const SIZE = 512;
const PAD = 24;
const SERIF = 'Georgia, serif';
const SANS = 'Verdana, sans-serif';

await fs.mkdir(STICKER_DIR, { recursive: true });

const THEMES = {
  rose: { bg: '#FFF5F5', stroke: '#F4B5B5', accent: '#E88A8A', ink: '#4A3535', sub: '#8E7575' },
  roseBold: { bg: '#FFF5F5', stroke: '#E88A8A', accent: '#E88A8A', ink: '#4A3535', sub: '#8E7575' },
  plum: { bg: '#2E2038', stroke: '#E88A8A', accent: '#E88A8A', ink: '#FFF5F5', sub: '#F4B5B5' },
  sage: { bg: '#EEF5EF', stroke: '#A9C7B0', accent: '#5E8A6A', ink: '#2F4436', sub: '#5E7A66' },
  lav: { bg: '#F4F0FB', stroke: '#C9BCE6', accent: '#8A72C0', ink: '#3A2E4F', sub: '#6F6290' },
  ocean: { bg: '#EEF4FA', stroke: '#B3CBE0', accent: '#4F7FAE', ink: '#253445', sub: '#5B7189' },
  mocha: { bg: '#F8F0E8', stroke: '#DDC4AE', accent: '#9C6B4A', ink: '#40291F', sub: '#7A5A45' },
  gold: { bg: '#FFF8E6', stroke: '#EBCB7E', accent: '#C99A2E', ink: '#4A3A1C', sub: '#86703E' },
  slate: { bg: '#F3F3F7', stroke: '#C7C9D6', accent: '#6E7390', ink: '#33364A', sub: '#6E7390' },
  night: { bg: '#1F2440', stroke: '#7080D6', accent: '#E0B04F', ink: '#F4F1E8', sub: '#C9CEE8' },
};

// --- text measuring: render the label alone and trim it to get its real width ---
const widthCache = new Map();
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function textWidth(text, size, font, weight) {
  const key = `${text}|${size}|${font}|${weight}`;
  if (widthCache.has(key)) return widthCache.get(key);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(text.length * size * 1.2 + 40)}" height="${Math.ceil(size * 2)}">
    <text x="20" y="${size * 1.4}" font-family="${font}" font-size="${size}" font-weight="${weight}">${esc(text)}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim().toBuffer({ resolveWithObject: true });
  widthCache.set(key, info.width);
  return info.width;
}

// --- icons: drawn in a unit box (-0.5..0.5) and placed with translate/scale ---
let uid = 0;
const starPoints = (outer, inner) =>
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`;
  }).join(' ');
const HEART = 'M0,0.38 C-0.55,0.02 -0.5,-0.42 -0.24,-0.42 C-0.1,-0.42 0,-0.32 0,-0.22 C0,-0.32 0.1,-0.42 0.24,-0.42 C0.5,-0.42 0.55,0.02 0,0.38Z';
const FLAME = 'M0,-0.48 C0.3,-0.2 0.32,0.22 0,0.45 C-0.32,0.22 -0.28,-0.06 -0.1,-0.24 C-0.06,-0.1 0.04,-0.1 0,-0.48Z';

const ICONS = {
  star: (c) => `<polygon points="${starPoints(0.5, 0.21)}" fill="${c.accent}"/>`,
  starEmpty: (c) => `<polygon points="${starPoints(0.46, 0.19)}" fill="none" stroke="${c.accent}" stroke-width="0.07" stroke-linejoin="round"/>`,
  starHalf: (c) => {
    const id = `half${uid++}`;
    return `<clipPath id="${id}"><rect x="-0.5" y="-0.5" width="0.5" height="1"/></clipPath>
      <polygon points="${starPoints(0.46, 0.19)}" fill="none" stroke="${c.accent}" stroke-width="0.07" stroke-linejoin="round"/>
      <polygon points="${starPoints(0.5, 0.21)}" fill="${c.accent}" clip-path="url(#${id})"/>`;
  },
  heart: (c) => `<path d="${HEART}" fill="${c.accent}"/>`,
  heartInk: (c) => `<path d="${HEART}" fill="${c.ink}"/>`,
  heartBroken: (c) => `<path d="${HEART}" fill="${c.accent}"/><path d="M0,-0.24 L-0.08,-0.04 L0.07,0.08 L-0.02,0.34" fill="none" stroke="${c.bg}" stroke-width="0.07" stroke-linejoin="round"/>`,
  hearts: (c) => `<g transform="translate(-0.14 0.04) scale(0.7)"><path d="${HEART}" fill="${c.accent}"/></g><g transform="translate(0.17 -0.08) scale(0.6)"><path d="${HEART}" fill="${c.stroke}"/></g>`,
  heartCircle: (c) => `<circle r="0.5" fill="${c.accent}"/><g transform="scale(0.55)"><path d="${HEART}" fill="${c.bg}"/></g>`,
  chili: () => `<path d="M-0.3,-0.18 C-0.06,-0.3 0.27,-0.18 0.37,0.14 C0.43,0.33 0.31,0.46 0.2,0.38 C0.14,0.12 0,-0.02 -0.28,-0.01 C-0.42,-0.03 -0.42,-0.14 -0.3,-0.18Z" fill="#D9534F"/>
      <path d="M-0.34,-0.12 C-0.43,-0.22 -0.4,-0.36 -0.28,-0.44" fill="none" stroke="#6E9E5A" stroke-width="0.08" stroke-linecap="round"/>
      <ellipse cx="-0.31" cy="-0.12" rx="0.08" ry="0.1" fill="#6E9E5A"/>`,
  book: (c) => `<rect x="-0.3" y="-0.44" width="0.6" height="0.88" rx="0.05" fill="${c.accent}"/><rect x="-0.3" y="-0.44" width="0.1" height="0.88" fill="#000" opacity="0.18"/><rect x="-0.14" y="-0.28" width="0.32" height="0.12" rx="0.02" fill="${c.bg}"/>`,
  openBook: (c) => `<path d="M0,-0.24 C-0.15,-0.34 -0.35,-0.34 -0.48,-0.27 L-0.48,0.3 C-0.35,0.23 -0.15,0.23 0,0.33 Z" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.06" stroke-linejoin="round"/>
      <path d="M0,-0.24 C0.15,-0.34 0.35,-0.34 0.48,-0.27 L0.48,0.3 C0.35,0.23 0.15,0.23 0,0.33 Z" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.06" stroke-linejoin="round"/>
      <path d="M-0.38,-0.12 C-0.26,-0.16 -0.14,-0.16 -0.08,-0.12 M-0.38,0.02 C-0.26,-0.02 -0.14,-0.02 -0.08,0.02 M0.38,-0.12 C0.26,-0.16 0.14,-0.16 0.08,-0.12 M0.38,0.02 C0.26,-0.02 0.14,-0.02 0.08,0.02" fill="none" stroke="${c.stroke}" stroke-width="0.035" stroke-linecap="round"/>`,
  bookStack: (c) => `<rect x="-0.46" y="0.18" width="0.92" height="0.22" rx="0.04" fill="${c.stroke}" stroke="${c.ink}" stroke-width="0.04"/>
      <rect x="-0.38" y="-0.06" width="0.76" height="0.22" rx="0.04" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.04"/>
      <rect x="-0.3" y="-0.3" width="0.6" height="0.22" rx="0.04" fill="${c.accent}" stroke="${c.ink}" stroke-width="0.04"/>
      <g transform="translate(0 -0.42) scale(0.2)"><path d="${HEART}" fill="${c.accent}"/></g>`,
  cup: (c) => `<path d="M-0.4,-0.16 L0.22,-0.16 C0.22,0.22 0.1,0.4 -0.09,0.4 C-0.28,0.4 -0.4,0.22 -0.4,-0.16Z" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.06" stroke-linejoin="round"/>
      <path d="M0.22,-0.06 C0.46,-0.06 0.46,0.22 0.18,0.22" fill="none" stroke="${c.accent}" stroke-width="0.06" stroke-linecap="round"/>
      <path d="M-0.2,-0.28 C-0.24,-0.36 -0.14,-0.4 -0.18,-0.48 M-0.02,-0.28 C-0.06,-0.36 0.04,-0.4 0,-0.48" fill="none" stroke="${c.stroke}" stroke-width="0.04" stroke-linecap="round"/>`,
  candle: (c) => `<rect x="-0.16" y="-0.04" width="0.32" height="0.52" rx="0.04" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.05"/>
      <line x1="0" y1="-0.04" x2="0" y2="-0.12" stroke="${c.ink}" stroke-width="0.03"/>
      <path d="M0,-0.48 C0.12,-0.34 0.12,-0.16 0,-0.13 C-0.12,-0.16 -0.12,-0.34 0,-0.48Z" fill="${c.accent}"/>`,
  flame: (c) => `<path d="${FLAME}" fill="${c.accent}"/>`,
  bookmark: (c) => `<path d="M-0.22,-0.48 L0.22,-0.48 L0.22,0.48 L0,0.28 L-0.22,0.48Z" fill="${c.accent}"/><g transform="translate(0 -0.18) scale(0.22)"><path d="${HEART}" fill="${c.bg}"/></g>`,
  moon: (c) => `<path d="M0.12,-0.46 A0.46,0.46 0 1 0 0.44,0.18 A0.36,0.36 0 1 1 0.12,-0.46Z" fill="${c.accent}"/>`,
  sparkle: (c) => `<path d="M0,-0.5 C0.05,-0.1 0.1,-0.05 0.5,0 C0.1,0.05 0.05,0.1 0,0.5 C-0.05,0.1 -0.1,0.05 -0.5,0 C-0.1,-0.05 -0.05,-0.1 0,-0.5Z" fill="${c.accent}"/>`,
  planet: (c) => `<circle r="0.27" fill="${c.accent}"/><ellipse rx="0.48" ry="0.13" transform="rotate(-20)" fill="none" stroke="${c.ink}" stroke-width="0.05"/>`,
  bolt: (c) => `<polygon points="0.08,-0.5 -0.3,0.06 -0.02,0.06 -0.1,0.5 0.3,-0.08 0.02,-0.08" fill="${c.accent}" stroke-linejoin="round"/>`,
  magnifier: (c) => `<circle cx="-0.08" cy="-0.08" r="0.28" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.08"/><line x1="0.13" y1="0.13" x2="0.4" y2="0.4" stroke="${c.accent}" stroke-width="0.12" stroke-linecap="round"/>`,
  feather: (c) => `<path d="M0.42,-0.46 C-0.1,-0.4 -0.36,0 -0.3,0.3 C0,0.3 0.36,0.04 0.42,-0.46Z" fill="${c.accent}"/><path d="M-0.44,0.46 L0.22,-0.22" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
  bulb: (c) => `<circle cy="-0.1" r="0.3" fill="${c.accent}"/><rect x="-0.13" y="0.18" width="0.26" height="0.22" rx="0.04" fill="${c.ink}"/>`,
  leaf: (c) => `<path d="M-0.4,0.4 C-0.46,-0.2 0,-0.46 0.46,-0.46 C0.46,0 0.2,0.46 -0.4,0.4Z" fill="${c.accent}"/><path d="M-0.4,0.4 L0.24,-0.24" stroke="${c.bg}" stroke-width="0.04" stroke-linecap="round"/>`,
  snowflake: (c) => [0, 60, 120].map((r) => `<g transform="rotate(${r})"><line y1="-0.46" y2="0.46" stroke="${c.accent}" stroke-width="0.07" stroke-linecap="round"/><path d="M-0.1,-0.4 L0,-0.3 L0.1,-0.4 M-0.1,0.4 L0,0.3 L0.1,0.4" fill="none" stroke="${c.accent}" stroke-width="0.05" stroke-linecap="round"/></g>`).join(''),
  flower: (c) => `${[0, 72, 144, 216, 288].map((r) => `<circle cx="0" cy="-0.26" r="0.2" transform="rotate(${r})" fill="${c.stroke}" stroke="${c.accent}" stroke-width="0.03"/>`).join('')}<circle r="0.13" fill="${c.accent}"/>`,
  sun: (c) => `<circle r="0.24" fill="${c.accent}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((r) => `<line y1="-0.33" y2="-0.47" transform="rotate(${r})" stroke="${c.accent}" stroke-width="0.07" stroke-linecap="round"/>`).join('')}`,
  pumpkin: (c) => `<ellipse cx="-0.16" cy="0.08" rx="0.24" ry="0.34" fill="${c.accent}"/><ellipse cx="0.16" cy="0.08" rx="0.24" ry="0.34" fill="${c.accent}"/><ellipse cy="0.08" rx="0.18" ry="0.36" fill="${c.stroke}" opacity="0.6"/><rect x="-0.04" y="-0.42" width="0.08" height="0.16" rx="0.03" fill="#6E9E5A"/>`,
  tree: (c) => `<polygon points="0,-0.48 0.26,-0.1 0.14,-0.1 0.36,0.24 -0.36,0.24 -0.14,-0.1 -0.26,-0.1" fill="${c.accent}" stroke-linejoin="round"/><rect x="-0.06" y="0.24" width="0.12" height="0.2" fill="${c.ink}"/>`,
  drop: (c) => `<path d="M0,-0.48 C0.24,-0.16 0.32,0.04 0.32,0.14 A0.32,0.32 0 0 1 -0.32,0.14 C-0.32,0.04 -0.24,-0.16 0,-0.48Z" fill="${c.accent}"/>`,
  wave: (c) => `<path d="M-0.48,-0.08 C-0.3,-0.26 -0.18,-0.26 0,-0.08 C0.18,0.1 0.3,0.1 0.48,-0.08 M-0.48,0.18 C-0.3,0 -0.18,0 0,0.18 C0.18,0.36 0.3,0.36 0.48,0.18" fill="none" stroke="${c.accent}" stroke-width="0.08" stroke-linecap="round"/>`,
  apple: (c) => `<path d="M0,-0.2 C0.35,-0.4 0.5,0 0.3,0.3 C0.2,0.45 0.05,0.4 0,0.36 C-0.05,0.4 -0.2,0.45 -0.3,0.3 C-0.5,0 -0.35,-0.4 0,-0.2Z" fill="${c.accent}"/><path d="M0,-0.2 C0,-0.32 0.04,-0.4 0.1,-0.46" stroke="${c.ink}" stroke-width="0.04" fill="none"/><path d="M0.06,-0.32 C0.2,-0.46 0.32,-0.38 0.3,-0.32 C0.2,-0.26 0.1,-0.28 0.06,-0.32Z" fill="#6E9E5A"/>`,
  clover: (c) => `<circle cy="-0.2" r="0.19" fill="${c.accent}"/><circle cx="-0.19" cy="0.05" r="0.19" fill="${c.accent}"/><circle cx="0.19" cy="0.05" r="0.19" fill="${c.accent}"/><path d="M0,0.05 C0.05,0.25 0.1,0.36 0.2,0.46" stroke="${c.accent}" stroke-width="0.06" fill="none" stroke-linecap="round"/>`,
  firework: (c) => Array.from({ length: 12 }, (_, i) => `<line y1="-0.16" y2="-0.44" transform="rotate(${i * 30})" stroke="${i % 2 ? c.stroke : c.accent}" stroke-width="0.06" stroke-linecap="round"/>`).join('') + `<circle r="0.07" fill="${c.accent}"/>`,
  glasses: (c) => `<circle cx="-0.24" cy="0.04" r="0.19" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.07"/><circle cx="0.24" cy="0.04" r="0.19" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.07"/><path d="M-0.06,0 C-0.02,-0.05 0.02,-0.05 0.06,0 M-0.43,0 L-0.48,-0.14 M0.43,0 L0.48,-0.14" fill="none" stroke="${c.accent}" stroke-width="0.06" stroke-linecap="round"/>`,
  plant: (c) => `<ellipse cx="-0.16" cy="-0.16" rx="0.1" ry="0.26" transform="rotate(-30 -0.16 -0.16)" fill="#6E9E5A"/><ellipse cx="0.16" cy="-0.16" rx="0.1" ry="0.26" transform="rotate(30 0.16 -0.16)" fill="#6E9E5A"/><ellipse cy="-0.26" rx="0.09" ry="0.24" fill="#7FB06A"/><polygon points="-0.26,0.04 0.26,0.04 0.19,0.48 -0.19,0.48" fill="${c.accent}"/>`,
  ghost: (c) => `<path d="M-0.32,0.45 L-0.32,-0.1 A0.32,0.32 0 0 1 0.32,-0.1 L0.32,0.45 L0.16,0.32 L0,0.45 L-0.16,0.32Z" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.05" stroke-linejoin="round"/><circle cx="-0.11" cy="-0.06" r="0.05" fill="${c.ink}"/><circle cx="0.11" cy="-0.06" r="0.05" fill="${c.ink}"/>`,
  sword: (c) => `<g transform="rotate(45)"><polygon points="0,-0.5 0.05,-0.42 0.05,0.18 -0.05,0.18 -0.05,-0.42" fill="${c.accent}"/><rect x="-0.17" y="0.17" width="0.34" height="0.06" rx="0.02" fill="${c.accent}"/><rect x="-0.035" y="0.23" width="0.07" height="0.2" rx="0.02" fill="${c.accent}"/></g>`,
  swordLeft: (c) => `<g transform="scale(-1 1)">${ICONS.sword(c)}</g>`,
  dagger: (c) => `<g transform="rotate(35)"><polygon points="0,-0.48 0.07,-0.36 0.07,0.08 -0.07,0.08 -0.07,-0.36" fill="${c.accent}"/><rect x="-0.17" y="0.08" width="0.34" height="0.07" rx="0.03" fill="${c.ink}"/><rect x="-0.045" y="0.15" width="0.09" height="0.24" rx="0.03" fill="${c.ink}"/></g>`,
  crown: (c) => `<polygon points="-0.45,0.3 -0.45,-0.25 -0.22,0 0,-0.36 0.22,0 0.45,-0.25 0.45,0.3" fill="${c.accent}" stroke-linejoin="round"/>`,
  ring: (c) => `<circle cy="0.12" r="0.3" fill="none" stroke="${c.accent}" stroke-width="0.08"/><polygon points="0,-0.18 -0.12,-0.3 -0.06,-0.42 0.06,-0.42 0.12,-0.3" fill="${c.stroke}" stroke="${c.accent}" stroke-width="0.03"/>`,
  doc: (c) => `<rect x="-0.3" y="-0.42" width="0.6" height="0.84" rx="0.05" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.05"/><path d="M-0.18,-0.22 L0.18,-0.22 M-0.18,-0.06 L0.18,-0.06 M-0.18,0.1 L0.08,0.1" stroke="${c.stroke}" stroke-width="0.05" stroke-linecap="round"/><path d="M0.02,0.26 C0.08,0.2 0.12,0.32 0.2,0.24" stroke="${c.accent}" stroke-width="0.04" fill="none"/>`,
  door: (c) => `<rect x="-0.26" y="-0.46" width="0.52" height="0.92" rx="0.04" fill="${c.accent}"/><rect x="-0.17" y="-0.36" width="0.34" height="0.3" rx="0.03" fill="${c.bg}" opacity="0.5"/><circle cx="0.14" cy="0.06" r="0.04" fill="${c.bg}"/>`,
  bed: (c) => `<rect x="-0.46" y="-0.3" width="0.08" height="0.7" rx="0.03" fill="${c.ink}"/><rect x="-0.4" y="0.02" width="0.86" height="0.2" rx="0.04" fill="${c.accent}"/><rect x="-0.36" y="-0.12" width="0.24" height="0.14" rx="0.06" fill="${c.stroke}"/><rect x="0.38" y="0.22" width="0.06" height="0.18" fill="${c.ink}"/>`,
  pin: (c) => `<line x1="0" y1="-0.02" x2="0" y2="0.48" stroke="${c.ink}" stroke-width="0.06" stroke-linecap="round"/><circle cy="-0.2" r="0.26" fill="${c.accent}"/><circle cx="-0.08" cy="-0.28" r="0.07" fill="#FFFFFF" opacity="0.7"/>`,
  stop: (c) => `<polygon points="${Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i + Math.PI / 8; return `${(0.48 * Math.cos(a)).toFixed(3)},${(0.48 * Math.sin(a)).toFixed(3)}`; }).join(' ')}" fill="${c.accent}"/><rect x="-0.26" y="-0.07" width="0.52" height="0.14" rx="0.03" fill="#FFFFFF"/>`,
  house: (c) => `<polygon points="0,-0.46 0.46,-0.04 -0.46,-0.04" fill="${c.accent}" stroke-linejoin="round"/><rect x="-0.32" y="-0.06" width="0.64" height="0.5" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.05"/><rect x="-0.08" y="0.16" width="0.16" height="0.28" fill="${c.accent}"/>`,
  mask: (c) => `<path d="M-0.48,-0.12 C-0.3,-0.26 0.3,-0.26 0.48,-0.12 C0.46,0.2 0.2,0.26 0,0.1 C-0.2,0.26 -0.46,0.2 -0.48,-0.12Z" fill="${c.accent}"/><ellipse cx="-0.2" cy="-0.02" rx="0.1" ry="0.07" fill="${c.bg}"/><ellipse cx="0.2" cy="-0.02" rx="0.1" ry="0.07" fill="${c.bg}"/>`,
  family: (c) => `<circle cx="-0.28" cy="-0.16" r="0.12" fill="${c.accent}"/><circle cx="0.28" cy="-0.16" r="0.12" fill="${c.accent}"/><circle cy="-0.02" r="0.1" fill="${c.ink}"/><path d="M-0.48,0.36 C-0.48,0.06 -0.08,0.06 -0.08,0.36Z M0.08,0.36 C0.08,0.06 0.48,0.06 0.48,0.36Z" fill="${c.accent}"/><path d="M-0.18,0.42 C-0.18,0.16 0.18,0.16 0.18,0.42Z" fill="${c.ink}"/>`,
  cap: (c) => `<polygon points="0,-0.36 0.5,-0.14 0,0.08 -0.5,-0.14" fill="${c.accent}"/><path d="M-0.28,-0.02 L-0.28,0.22 C-0.1,0.36 0.1,0.36 0.28,0.22 L0.28,-0.02 L0,0.1Z" fill="${c.ink}"/><path d="M0.4,-0.1 L0.4,0.24" stroke="${c.stroke}" stroke-width="0.05"/><circle cx="0.4" cy="0.28" r="0.05" fill="${c.stroke}"/>`,
  lock: (c) => `<path d="M-0.2,-0.04 L-0.2,-0.2 A0.2,0.2 0 0 1 0.2,-0.2 L0.2,-0.04" fill="none" stroke="${c.ink}" stroke-width="0.08"/><rect x="-0.32" y="-0.06" width="0.64" height="0.5" rx="0.08" fill="${c.accent}"/><g transform="translate(0 0.18) scale(0.3)"><path d="${HEART}" fill="${c.bg}"/></g>`,
  triangle: (c) => `<polygon points="0,-0.4 0.42,0.34 -0.42,0.34" fill="none" stroke="${c.accent}" stroke-width="0.06" stroke-linejoin="round"/><g transform="translate(0 0.08) scale(0.34)"><path d="${HEART}" fill="${c.accent}"/></g>`,
  clock: (c) => `<circle r="0.42" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.07"/><path d="M0,-0.26 L0,0 L0.18,0.12" fill="none" stroke="${c.ink}" stroke-width="0.06" stroke-linecap="round" stroke-linejoin="round"/>`,
  cloud: (c) => `<path d="M-0.36,0.22 A0.15,0.15 0 0 1 -0.3,-0.06 A0.21,0.21 0 0 1 0.08,-0.14 A0.18,0.18 0 0 1 0.38,0.06 A0.13,0.13 0 0 1 0.36,0.22Z" fill="${c.stroke}"/>`,
  gem: (c) => `<polygon points="-0.42,-0.14 -0.22,-0.38 0.22,-0.38 0.42,-0.14 0,0.42" fill="${c.accent}"/><path d="M-0.42,-0.14 L0.42,-0.14 M-0.22,-0.38 L-0.1,-0.14 L0,0.42 L0.1,-0.14 L0.22,-0.38" fill="none" stroke="${c.bg}" stroke-width="0.03" opacity="0.7"/>`,
  rainbow: () => ['#E88A8A', '#E0B04F', '#7FA38A', '#6E93B8'].map((col, i) => `<path d="M${-0.46 + i * 0.1},0.3 A${0.46 - i * 0.1},${0.46 - i * 0.1} 0 0 1 ${0.46 - i * 0.1},0.3" fill="none" stroke="${col}" stroke-width="0.09"/>`).join(''),
  loop: (c) => `<path d="M0.34,-0.12 A0.36,0.36 0 1 0 0.32,0.18" fill="none" stroke="${c.accent}" stroke-width="0.09" stroke-linecap="round"/><polygon points="0.44,-0.36 0.46,-0.04 0.16,-0.12" fill="${c.accent}"/>`,
  pause: (c) => `<rect x="-0.26" y="-0.36" width="0.18" height="0.72" rx="0.05" fill="${c.accent}"/><rect x="0.08" y="-0.36" width="0.18" height="0.72" rx="0.05" fill="${c.accent}"/>`,
  card: (c) => `<rect x="-0.46" y="-0.32" width="0.92" height="0.64" rx="0.06" fill="#FFFFFF" stroke="${c.accent}" stroke-width="0.05"/><rect x="-0.46" y="-0.32" width="0.92" height="0.14" fill="${c.accent}"/><path d="M-0.32,-0.04 L0.32,-0.04 M-0.32,0.08 L0.32,0.08 M-0.32,0.2 L0.1,0.2" stroke="${c.stroke}" stroke-width="0.04" stroke-linecap="round"/>`,
  quote: (c) => `<path d="M-0.42,0.3 L-0.42,0 C-0.42,-0.22 -0.3,-0.34 -0.12,-0.38 L-0.08,-0.28 C-0.2,-0.22 -0.24,-0.12 -0.22,-0.02 L-0.06,-0.02 L-0.06,0.3Z M0.06,0.3 L0.06,0 C0.06,-0.22 0.18,-0.34 0.36,-0.38 L0.4,-0.28 C0.28,-0.22 0.24,-0.12 0.26,-0.02 L0.42,-0.02 L0.42,0.3Z" fill="${c.accent}"/>`,
  owl: (c) => `<g transform="translate(-0.12 0) scale(0.75)">${ICONS.moon(c)}</g><g transform="translate(0.3 -0.28) scale(0.26)">${ICONS.sparkle(c)}</g><g transform="translate(0.34 0.18) scale(0.16)">${ICONS.sparkle(c)}</g>`,
};

function face(expr) {
  return (c) => {
    const eyes = {
      dot: `<circle cx="-0.15" cy="-0.06" r="0.05" fill="${c.ink}"/><circle cx="0.15" cy="-0.06" r="0.05" fill="${c.ink}"/>`,
      happy: `<path d="M-0.22,-0.04 Q-0.15,-0.14 -0.08,-0.04 M0.08,-0.04 Q0.15,-0.14 0.22,-0.04" fill="none" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      closed: `<path d="M-0.22,-0.08 Q-0.15,0 -0.08,-0.08 M0.08,-0.08 Q0.15,0 0.22,-0.08" fill="none" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      hearts: `<g transform="translate(-0.15 -0.06) scale(0.17)"><path d="${HEART}" fill="#D9534F"/></g><g transform="translate(0.15 -0.06) scale(0.17)"><path d="${HEART}" fill="#D9534F"/></g>`,
      round: `<circle cx="-0.15" cy="-0.08" r="0.08" fill="#FFFFFF" stroke="${c.ink}" stroke-width="0.03"/><circle cx="0.15" cy="-0.08" r="0.08" fill="#FFFFFF" stroke="${c.ink}" stroke-width="0.03"/><circle cx="-0.15" cy="-0.08" r="0.035" fill="${c.ink}"/><circle cx="0.15" cy="-0.08" r="0.035" fill="${c.ink}"/>`,
      up: `<circle cx="-0.13" cy="-0.1" r="0.05" fill="${c.ink}"/><circle cx="0.17" cy="-0.1" r="0.05" fill="${c.ink}"/><path d="M0.08,-0.24 L0.26,-0.28" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      sleepy: `<path d="M-0.22,-0.06 L-0.08,-0.06 M0.08,-0.06 L0.22,-0.06" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      angry: `<circle cx="-0.15" cy="-0.04" r="0.05" fill="${c.ink}"/><circle cx="0.15" cy="-0.04" r="0.05" fill="${c.ink}"/><path d="M-0.26,-0.2 L-0.08,-0.12 M0.26,-0.2 L0.08,-0.12" stroke="${c.ink}" stroke-width="0.05" stroke-linecap="round"/>`,
    };
    const mouths = {
      smile: `<path d="M-0.14,0.12 Q0,0.26 0.14,0.12" fill="none" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      small: `<path d="M-0.07,0.14 Q0,0.2 0.07,0.14" fill="none" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      laugh: `<path d="M-0.18,0.08 L0.18,0.08 Q0.16,0.3 0,0.3 Q-0.16,0.3 -0.18,0.08Z" fill="${c.ink}"/>`,
      frown: `<path d="M-0.13,0.22 Q0,0.1 0.13,0.22" fill="none" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      o: `<ellipse cy="0.18" rx="0.07" ry="0.09" fill="${c.ink}"/>`,
      flat: `<path d="M-0.1,0.16 L0.1,0.16" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
      slant: `<path d="M-0.1,0.18 L0.1,0.14" stroke="${c.ink}" stroke-width="0.04" stroke-linecap="round"/>`,
    };
    const [e, m, extra = ''] = expr;
    const extras = {
      blush: `<ellipse cx="-0.26" cy="0.08" rx="0.07" ry="0.04" fill="#E88A8A" opacity="0.6"/><ellipse cx="0.26" cy="0.08" rx="0.07" ry="0.04" fill="#E88A8A" opacity="0.6"/>`,
      tear: `<path d="M-0.17,0.02 C-0.12,0.1 -0.12,0.14 -0.17,0.16 C-0.22,0.14 -0.22,0.1 -0.17,0.02Z" fill="#6E93B8"/>`,
      '': '',
    };
    return `<circle r="0.46" fill="${c.stroke}" stroke="${c.accent}" stroke-width="0.05"/>${eyes[e]}${mouths[m]}${extras[extra]}`;
  };
}

function icon(name, cx, cy, s, theme) {
  const draw = typeof name === 'function' ? name : ICONS[name];
  if (!draw) throw new Error(`Unknown icon ${name}`);
  return `<g transform="translate(${cx} ${cy}) scale(${s})">${draw(theme)}</g>`;
}

// --- shapes: each knows its outline and how wide a text row can be at a given height ---
function shapeOf(kind, t, h) {
  const cx = 256;
  const cy = 256;
  if (kind === 'circle') {
    const r = 210;
    return {
      draw: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.bg}" stroke="${t.stroke}" stroke-width="14"/>`,
      avail: (y0, y1) => {
        const d = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy));
        return d >= r - 30 ? 0 : 2 * Math.sqrt((r - 7) ** 2 - d * d) - 56;
      },
      maxH: 2 * r - 90,
    };
  }
  if (kind === 'scallop') {
    const bumps = Array.from({ length: 20 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 20;
      return `<circle cx="${(cx + 196 * Math.cos(a)).toFixed(1)}" cy="${(cy + 196 * Math.sin(a)).toFixed(1)}" r="34" fill="${t.stroke}"/>`;
    }).join('');
    return {
      draw: `${bumps}<circle cx="${cx}" cy="${cy}" r="200" fill="${t.stroke}"/><circle cx="${cx}" cy="${cy}" r="178" fill="${t.bg}"/><circle cx="${cx}" cy="${cy}" r="160" fill="none" stroke="${t.stroke}" stroke-width="4" stroke-dasharray="10 10"/>`,
      avail: (y0, y1) => {
        const d = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy));
        return d >= 140 ? 0 : 2 * Math.sqrt(150 ** 2 - d * d) - 30;
      },
      maxH: 260,
    };
  }
  const w = 440;
  const x = cx - w / 2;
  const y = cy - h / 2;
  if (kind === 'pill') {
    const r = h / 2;
    return {
      draw: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${t.bg}" stroke="${t.stroke}" stroke-width="14"/>`,
      avail: (y0, y1) => {
        const d = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy));
        const curve = d >= r - 20 ? 0 : Math.sqrt((r - 20) ** 2 - d * d);
        return 2 * (w / 2 - r + curve) - 40;
      },
    };
  }
  if (kind === 'tag') {
    return {
      draw: `<path d="M${x + 60},${y} L${x + w},${y} L${x + w},${y + h} L${x + 60},${y + h} L${x},${cy} Z" fill="${t.bg}" stroke="${t.stroke}" stroke-width="12" stroke-linejoin="round"/><circle cx="${x + 52}" cy="${cy}" r="12" fill="#FFFFFF" stroke="${t.stroke}" stroke-width="6"/>`,
      avail: () => w - 140,
      shift: 34,
    };
  }
  if (kind === 'banner') {
    const tail = 46;
    return {
      draw: `<path d="M${x - 10},${y + 26} L${x + tail},${y + 26} L${x + tail},${y + h + 26} L${x - 10},${y + h + 26} L${x + 18},${y + h / 2 + 26} Z M${x + w + 10},${y + 26} L${x + w - tail},${y + 26} L${x + w - tail},${y + h + 26} L${x + w + 10},${y + h + 26} L${x + w - 18},${y + h / 2 + 26} Z" fill="${t.stroke}"/>
        <rect x="${x + 30}" y="${y}" width="${w - 60}" height="${h}" rx="8" fill="${t.bg}" stroke="${t.accent}" stroke-width="10"/>`,
      avail: () => w - 120,
    };
  }
  if (kind === 'ticket') {
    return {
      draw: `<path d="M${x},${y} L${x + w},${y} L${x + w},${cy - 26} A26,26 0 0 0 ${x + w},${cy + 26} L${x + w},${y + h} L${x},${y + h} L${x},${cy + 26} A26,26 0 0 0 ${x},${cy - 26} Z" fill="${t.bg}" stroke="${t.stroke}" stroke-width="10" stroke-linejoin="round"/>
        <rect x="${x + 44}" y="${y + 18}" width="${w - 88}" height="${h - 36}" rx="10" fill="none" stroke="${t.stroke}" stroke-width="4" stroke-dasharray="10 8"/>`,
      avail: () => w - 130,
    };
  }
  if (kind === 'note') {
    const lines = Array.from({ length: Math.floor((h - 40) / 36) }, (_, i) => `<line x1="${x + 30}" x2="${x + w - 30}" y1="${y + 56 + i * 36}" y2="${y + 56 + i * 36}" stroke="${t.stroke}" stroke-width="3"/>`).join('');
    return {
      draw: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#FFFFFF" stroke="${t.stroke}" stroke-width="10"/>${lines}<line x1="${x + 64}" x2="${x + 64}" y1="${y + 8}" y2="${y + h - 8}" stroke="${t.accent}" stroke-width="3" opacity="0.6"/>`,
      avail: () => w - 140,
      shift: 20,
    };
  }
  return {
    draw: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="${t.bg}" stroke="${t.stroke}" stroke-width="14"/>`,
    avail: () => w - 80,
  };
}

// --- layout: stack icon rows and text rows, shrink or wrap text until every row fits ---
async function textRowFits(row, availFn, y) {
  const lh = row.size * 1.18;
  let worst = 0;
  for (let i = 0; i < row.lines.length; i++) {
    const w = await textWidth(row.lines[i], row.size, row.font, row.weight);
    const avail = availFn(y + i * lh, y + (i + 1) * lh);
    worst = Math.max(worst, w - avail);
  }
  return worst <= 0;
}

function splitTwo(text) {
  const words = text.split(' ');
  if (words.length < 2) return null;
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.abs(a.length - b.length);
    if (!best || score < best.score) best = { score, lines: [a, b] };
  }
  return best.lines;
}

async function badge({ shape = 'pill', theme = 'rose', rows, minH = 212 }) {
  const t = THEMES[theme];
  const items = rows.map((r) =>
    r.text !== undefined
      ? { kind: 'text', lines: [r.text], size: r.size || 34, min: r.min || Math.round((r.size || 34) * 0.62), font: r.font || SERIF, weight: r.weight || 'bold', fill: r.color ? t[r.color] : t.ink, wrap: r.wrap !== false }
      : { kind: 'icons', names: r.icons, s: (r.s || 56) * (shape !== 'circle' && r.icons.length <= 2 ? 1.3 : 1), gap: r.gap ?? 14 },
  );
  const GAP = 16;
  const heightOf = (it) => (it.kind === 'text' ? it.size * 1.18 * it.lines.length : it.s);

  let h = minH;
  let sh;
  for (let iter = 0; iter < 40; iter++) {
    const total = items.reduce((a, it) => a + heightOf(it), 0) + GAP * (items.length - 1);
    if (shape === 'pill' || shape === 'rect' || shape === 'tag' || shape === 'banner' || shape === 'ticket' || shape === 'note') h = Math.max(minH, total + (shape === 'pill' ? 130 : 90));
    sh = shapeOf(shape, t, h);
    if (sh.maxH && total > sh.maxH) {
      items.forEach((it) => {
        if (it.kind === 'icons') it.s *= 0.92;
        else it.size = Math.max(it.min, it.size * 0.95);
      });
      continue;
    }
    let y = 256 - total / 2;
    let changed = false;
    for (const it of items) {
      if (it.kind === 'text' && !(await textRowFits(it, sh.avail, y))) {
        if (it.size > it.min) it.size = Math.max(it.min, Math.floor(it.size * 0.94));
        else if (it.wrap && it.lines.length === 1 && splitTwo(it.lines[0])) {
          it.lines = splitTwo(it.lines[0]);
          it.size = Math.round(it.min / 0.62 * 0.8);
        } else throw new Error(`Label does not fit: ${it.lines.join(' / ')}`);
        changed = true;
        break;
      }
      if (it.kind === 'icons') {
        const width = it.names.length * it.s + (it.names.length - 1) * it.gap;
        if (width > sh.avail(y, y + it.s)) {
          it.s *= 0.92;
          it.gap *= 0.92;
          changed = true;
          break;
        }
      }
      y += heightOf(it) + GAP;
    }
    if (!changed) break;
  }

  const total = items.reduce((a, it) => a + heightOf(it), 0) + GAP * (items.length - 1);
  const shift = sh.shift || 0;
  let y = 256 - total / 2;
  let body = '';
  for (const it of items) {
    if (it.kind === 'icons') {
      const width = it.names.length * it.s + (it.names.length - 1) * it.gap;
      it.names.forEach((n, i) => {
        body += icon(n, 256 + shift - width / 2 + it.s / 2 + i * (it.s + it.gap), y + it.s / 2, it.s, t);
      });
    } else {
      const lh = it.size * 1.18;
      it.lines.forEach((line, i) => {
        body += `<text x="${256 + shift}" y="${(y + i * lh + lh / 2).toFixed(1)}" dominant-baseline="central" text-anchor="middle" font-family="${it.font}" font-size="${it.size}" font-weight="${it.weight}" fill="${it.fill}">${esc(line)}</text>`;
      });
    }
    y += heightOf(it) + GAP;
  }
  return sh.draw + body;
}

// --- washi tape and torn paper ---
const WASHI_PATTERNS = {
  stripes: (c) => `<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="24" fill="${c.stroke}"/><rect width="10" height="24" fill="#FFFFFF" opacity="0.55"/></pattern>`,
  dots: (c) => `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="${c.stroke}"/><circle cx="14" cy="14" r="5" fill="#FFFFFF" opacity="0.8"/></pattern>`,
  grid: (c) => `<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${c.bg}"/><path d="M22,0 L0,0 L0,22" fill="none" stroke="${c.stroke}" stroke-width="3"/></pattern>`,
  hearts: (c) => `<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="${c.stroke}"/><g transform="translate(22 22) scale(18)"><path d="${HEART}" fill="#FFFFFF" opacity="0.8"/></g></pattern>`,
  stars: (c) => `<pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="${c.stroke}"/><g transform="translate(23 23) scale(20)"><polygon points="${starPoints(0.5, 0.21)}" fill="#FFFFFF" opacity="0.85"/></g></pattern>`,
  gingham: (c) => `<pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#FFFFFF"/><rect width="16" height="32" fill="${c.stroke}" opacity="0.55"/><rect width="32" height="16" fill="${c.stroke}" opacity="0.55"/></pattern>`,
};

function washi(theme, pattern) {
  const c = THEMES[theme];
  const zig = (x, dir) => Array.from({ length: 9 }, (_, i) => `${x + (i % 2 ? dir * 10 : 0)},${206 + i * 12.5}`).join(' L');
  return `<defs>${WASHI_PATTERNS[pattern](c)}</defs><g transform="rotate(-6 256 256)" opacity="0.92"><path d="M${zig(36, 1)} L${zig(476, -1).split(' L').reverse().join(' L')} Z" fill="url(#p)"/></g>`;
}

function torn(theme, lined) {
  const c = THEMES[theme];
  const edge = (y0, y1, x, dir) => Array.from({ length: 13 }, (_, i) => `${x + dir * ((i * 37) % 3) * 6},${y0 + ((y1 - y0) * i) / 12}`);
  const top = Array.from({ length: 15 }, (_, i) => `${80 + i * 25},${130 + ((i * 53) % 4) * 5}`);
  const bottom = Array.from({ length: 15 }, (_, i) => `${430 - i * 25},${382 - ((i * 41) % 4) * 5}`);
  const pts = [...top, ...edge(140, 372, 432, 1), ...bottom, ...edge(372, 140, 80, -1)].join(' ');
  const lines = lined ? Array.from({ length: 6 }, (_, i) => `<line x1="96" x2="416" y1="${180 + i * 34}" y2="${180 + i * 34}" stroke="${c.stroke}" stroke-width="3"/>`).join('') : '';
  return `<g transform="rotate(3 256 256)"><polygon points="${pts}" fill="${c.bg}" stroke="${c.stroke}" stroke-width="4" stroke-linejoin="round"/>${lines}</g>`;
}

// --- sticker list ---
const S = [];
const add = (id, name, category, build) => S.push({ id, name, category, file: `${id}.png`, build });
const starRow = (n) => Array.from({ length: 5 }, (_, i) => (i < Math.floor(n) ? 'star' : i < n ? 'starHalf' : 'starEmpty'));

// Ratings
add('five-star', '5-Star Read', 'ratings', () => badge({ rows: [{ icons: starRow(5), s: 52, gap: 10 }, { text: '5 STAR READ' }] }));
add('four-star', '4-Star Read', 'ratings', () => badge({ rows: [{ icons: starRow(4), s: 52, gap: 10 }, { text: '4 STAR READ' }] }));
add('book-hangover', 'Book Hangover', 'ratings', () => badge({ rows: [{ icons: ['heartBroken', 'openBook'], s: 66 }, { text: 'Book Hangover' }] }));
add('dnf-badge', 'Did Not Finish', 'ratings', () => badge({ shape: 'circle', rows: [{ icons: ['stop'], s: 90 }, { text: 'D.N.F.', size: 40 }, { text: 'Life is too short', size: 22, weight: 'normal', color: 'sub' }] }));
add('tbr-priority', 'TBR Priority', 'ratings', () => badge({ theme: 'roseBold', rows: [{ icons: ['pin', 'sparkle'], s: 64 }, { text: 'Next on TBR' }] }));
for (const n of [4.5, 3.5, 3, 2.5, 2, 1.5, 1]) {
  const label = String(n).replace('.5', '½');
  add(`stars-${String(n).replace('.', '-')}`, `${label} Stars`, 'ratings', () =>
    badge({ rows: [{ icons: starRow(n), s: 52, gap: 10 }, { text: `${label} STAR READ` }] }));
}

// Spice
add('spice-0', 'Closed Door', 'spice', () => badge({ theme: 'mocha', rows: [{ icons: ['door'], s: 70 }, { text: 'Closed Door' }, { text: 'no spice', size: 22, weight: 'normal', color: 'sub' }] }));
[['Mild', 'A little heat'], ['Warm', 'Some steam'], ['Spicy', 'Things heat up'], ['Very Spicy', 'Fan yourself'], ['Scorching', 'Five alarm read']].forEach(([label, sub], i) => {
  const n = i + 1;
  add(`spice-${n}`, `Spice ${n}/5`, 'spice', () =>
    badge({ theme: n >= 4 ? 'plum' : 'rose', rows: [{ icons: Array(n).fill('chili'), s: 52, gap: 8 }, { text: label }, { text: `${sub} · ${n}/5`, size: 22, weight: 'normal', color: 'sub' }] }));
});

// Reading status
add('to-be-read', 'To Be Read', 'status', () => badge({ theme: 'lav', rows: [{ icons: ['bookmark'], s: 76 }, { text: 'To Be Read' }] }));
add('finished', 'Finished!', 'status', () => badge({ theme: 'sage', rows: [{ icons: ['sparkle', 'book', 'sparkle'], s: 64 }, { text: 'Finished!' }] }));
add('re-read', 'Re-read', 'status', () => badge({ theme: 'gold', rows: [{ icons: ['loop'], s: 70 }, { text: 'Re-read' }, { text: 'worth it again', size: 22, weight: 'normal', color: 'sub' }] }));
add('on-pause', 'On Pause', 'status', () => badge({ theme: 'ocean', rows: [{ icons: ['pause'], s: 66 }, { text: 'On Pause' }] }));

// Genres
[
  ['romance', 'Romance', 'rose', 'heart'],
  ['romantasy', 'Romantasy', 'plum', 'hearts'],
  ['fantasy', 'Fantasy', 'lav', 'sparkle'],
  ['sci-fi', 'Sci-Fi', 'ocean', 'planet'],
  ['thriller', 'Thriller', 'slate', 'bolt'],
  ['mystery', 'Mystery', 'mocha', 'magnifier'],
  ['horror', 'Horror', 'night', 'moon'],
  ['contemporary', 'Contemporary', 'rose', 'cup'],
  ['historical', 'Historical', 'gold', 'feather'],
  ['literary', 'Literary Fiction', 'sage', 'openBook'],
  ['non-fiction', 'Non-fiction', 'ocean', 'bulb'],
  ['young-adult', 'Young Adult', 'lav', 'star'],
].forEach(([id, label, theme, ic]) =>
  add(`genre-${id}`, label, 'genres', () => badge({ shape: 'rect', theme, rows: [{ icons: [ic], s: 84 }, { text: label, size: 36 }] })));

// Tropes
add('enemies-to-lovers', 'Enemies to Lovers', 'tropes', () => badge({ theme: 'plum', rows: [{ icons: ['swordLeft', 'heart', 'sword'], s: 66 }, { text: 'Enemies to Lovers' }] }));
add('slow-burn', 'Slow Burn', 'tropes', () => badge({ theme: 'roseBold', rows: [{ icons: ['candle', 'flame'], s: 66 }, { text: 'Slow Burn' }] }));
add('fake-dating', 'Fake Dating', 'tropes', () => badge({ shape: 'circle', rows: [{ icons: ['ring', 'doc'], s: 76 }, { text: 'Fake Dating', size: 36 }, { text: 'Just for the weekend', size: 22, weight: 'normal', color: 'sub' }] }));
add('forced-proximity', 'Forced Proximity', 'tropes', () => badge({ rows: [{ icons: ['door', 'bed'], s: 66 }, { text: 'Only One Bed' }] }));
add('the-chosen-one', 'The Chosen One', 'tropes', () => badge({ shape: 'circle', theme: 'plum', rows: [{ icons: ['star'], s: 150 }, { text: 'The Chosen One', size: 32 }] }));
add('plot-twist', 'Plot Twist', 'tropes', () => badge({ shape: 'circle', theme: 'plum', rows: [{ icons: ['bolt', 'doc'], s: 76 }, { text: 'Plot Twist!', size: 36 }, { text: 'Never saw it coming', size: 22, weight: 'normal', color: 'sub' }] }));
add('morally-grey', 'Morally Grey', 'tropes', () => badge({ shape: 'circle', theme: 'plum', rows: [{ icons: ['dagger', 'heart'], s: 76 }, { text: 'Morally Grey', size: 34 }, { text: 'My favourite villain', size: 22, weight: 'normal', color: 'sub' }] }));
[
  ['friends-to-lovers', 'Friends to Lovers', 'rose', ['hearts']],
  ['grumpy-sunshine', 'Grumpy x Sunshine', 'gold', ['cloud', 'sun']],
  ['second-chance', 'Second Chance', 'lav', ['clock', 'heart']],
  ['found-family', 'Found Family', 'sage', ['family']],
  ['love-triangle', 'Love Triangle', 'plum', ['triangle']],
  ['secret-identity', 'Secret Identity', 'night', ['mask']],
  ['small-town', 'Small Town Romance', 'mocha', ['house', 'heart']],
  ['magic-academy', 'Magic Academy', 'lav', ['cap', 'sparkle']],
  ['forbidden-love', 'Forbidden Love', 'plum', ['lock']],
  ['royalty', 'Royals & Courts', 'gold', ['crown']],
].forEach(([id, label, theme, icons]) => add(id, label, 'tropes', () => badge({ theme, rows: [{ icons, s: 72 }, { text: label }] })));

// Content notes
[
  ['content-note', 'Content Note'],
  ['cw-violence', 'Violence'],
  ['cw-death', 'Death'],
  ['cw-grief', 'Grief & Loss'],
  ['cw-abuse', 'Abuse'],
  ['cw-self-harm', 'Self-harm'],
  ['cw-addiction', 'Addiction'],
  ['cw-mental-health', 'Mental Health'],
  ['cw-illness', 'Illness'],
  ['cw-sexual-content', 'Sexual Content'],
].forEach(([id, label], i) =>
  add(id, i === 0 ? 'Content Note' : `CW: ${label}`, 'warnings', () =>
    badge({ shape: 'tag', theme: 'slate', rows: [{ text: i === 0 ? 'PLEASE NOTE' : 'CONTENT NOTE', size: 20, font: SANS, color: 'sub' }, { text: i === 0 ? 'Content Note' : label, size: 38 }] })));

// Moods
[
  ['swoony', 'Swoony', 'rose', ['hearts', 'smile', 'blush']],
  ['cozy', 'Cozy', 'mocha', ['closed', 'small', 'blush']],
  ['funny', 'Funny', 'gold', ['happy', 'laugh']],
  ['heartbroken', 'Heartbroken', 'ocean', ['dot', 'frown', 'tear']],
  ['shocked', 'Shocked', 'lav', ['round', 'o']],
  ['furious', 'Furious', 'rose', ['angry', 'frown']],
  ['thoughtful', 'Thoughtful', 'sage', ['up', 'slant']],
  ['meh', 'Meh', 'slate', ['sleepy', 'flat']],
].forEach(([id, label, theme, expr]) =>
  add(`mood-${id}`, label, 'moods', () => badge({ shape: 'circle', theme, rows: [{ icons: [face(expr)], s: 170 }, { text: label, size: 38 }] })));
add('mood-spooky', 'Spooky', 'moods', () => badge({ shape: 'circle', theme: 'night', rows: [{ icons: ['ghost'], s: 160 }, { text: 'Spooky', size: 38 }] }));
add('mood-hopeful', 'Hopeful', 'moods', () => badge({ shape: 'circle', theme: 'sage', rows: [{ icons: ['rainbow'], s: 170 }, { text: 'Hopeful', size: 38 }] }));

// Frames, labels and banners
add('frame-scallop', 'Scalloped Frame', 'frames', () => shapeOf('scallop', THEMES.rose).draw);
add('frame-rounded', 'Rounded Frame', 'frames', () => `<rect x="56" y="96" width="400" height="320" rx="40" fill="${THEMES.sage.bg}" stroke="${THEMES.sage.stroke}" stroke-width="14"/><rect x="80" y="120" width="352" height="272" rx="24" fill="none" stroke="${THEMES.sage.stroke}" stroke-width="4" stroke-dasharray="12 10"/>`);
add('frame-polaroid', 'Photo Frame', 'frames', () => `<g transform="rotate(-4 256 256)"><rect x="96" y="70" width="320" height="372" rx="8" fill="#FFFFFF" stroke="#E6DCD6" stroke-width="6"/><rect x="120" y="94" width="272" height="260" fill="${THEMES.rose.bg}" stroke="${THEMES.rose.stroke}" stroke-width="4"/></g>`);
add('banner-book-of-the-month', 'Book of the Month', 'frames', () => badge({ shape: 'banner', rows: [{ text: 'Book of the Month', size: 34 }], minH: 120 }));
add('banner-must-read', 'Must Read', 'frames', () => badge({ shape: 'banner', theme: 'plum', rows: [{ text: 'Must Read', size: 38 }], minH: 120 }));
add('banner-currently-obsessed', 'Currently Obsessed', 'frames', () => badge({ shape: 'banner', theme: 'lav', rows: [{ text: 'Currently Obsessed', size: 34 }], minH: 120 }));
add('label-favourite-quote', 'Favourite Quote', 'frames', () => badge({ shape: 'rect', rows: [{ icons: ['quote'], s: 70 }, { text: 'Favourite Quote', size: 36 }] }));
add('label-notes', 'Notes', 'frames', () => badge({ shape: 'note', theme: 'ocean', rows: [{ text: 'Notes', size: 44 }], minH: 260 }));
add('label-book-club', 'Book Club Ticket', 'frames', () => badge({ shape: 'ticket', theme: 'gold', rows: [{ text: 'ADMIT ONE', size: 20, font: SANS, color: 'sub' }, { text: 'Book Club', size: 42 }], minH: 200 }));
add('label-library-haul', 'Library Haul', 'frames', () => badge({ shape: 'tag', theme: 'mocha', rows: [{ text: 'Library Haul', size: 38 }] }));

// Washi and torn paper
[['rose', 'stripes'], ['sage', 'dots'], ['ocean', 'grid'], ['rose', 'hearts'], ['gold', 'stars'], ['lav', 'gingham']].forEach(([theme, pattern]) =>
  add(`washi-${theme}-${pattern}`, `Washi ${pattern[0].toUpperCase()}${pattern.slice(1)}`, 'washi', () => washi(theme, pattern)));
add('torn-paper-cream', 'Torn Paper', 'washi', () => torn('rose', false));
add('torn-paper-lined', 'Torn Lined Paper', 'washi', () => torn('ocean', true));
add('torn-paper-kraft', 'Torn Kraft Paper', 'washi', () => torn('mocha', false));
add('torn-paper-sage', 'Torn Sage Paper', 'washi', () => torn('sage', true));

// Months and seasons
[
  ['january', 'January', 'New year, new reads', 'ocean', 'snowflake'],
  ['february', 'February', 'Falling for books', 'rose', 'heart'],
  ['march', 'March', 'Lucky reads', 'sage', 'clover'],
  ['april', 'April', 'Rainy day reads', 'ocean', 'drop'],
  ['may', 'May', 'In full bloom', 'lav', 'flower'],
  ['june', 'June', 'Summer reading', 'gold', 'sun'],
  ['july', 'July', 'Sparkling stories', 'night', 'firework'],
  ['august', 'August', 'Beach reads', 'ocean', 'wave'],
  ['september', 'September', 'Back to books', 'rose', 'apple'],
  ['october', 'October', 'Spooky season', 'mocha', 'pumpkin'],
  ['november', 'November', 'Cozy chapters', 'mocha', 'leaf'],
  ['december', 'December', 'Winter reads', 'sage', 'tree'],
].forEach(([id, label, sub, theme, ic]) =>
  add(`month-${id}`, `${label} Reads`, 'seasonal', () =>
    badge({ shape: 'circle', theme, rows: [{ icons: [ic], s: 110 }, { text: label, size: 40 }, { text: sub, size: 22, weight: 'normal', color: 'sub' }] })));

// Cozy and bookish
add('currently-reading', 'Currently Reading', 'cozy', () => badge({ rows: [{ icons: ['heartCircle'], s: 76 }, { text: 'Currently Reading' }] }));
add('cozy-teacup', 'Tea & Books', 'cozy', () => badge({ shape: 'circle', rows: [{ icons: ['cup'], s: 210 }, { text: 'Tea & Books', size: 32 }] }));
add('book-stack', 'One More Chapter', 'cozy', () => badge({ shape: 'circle', rows: [{ icons: ['bookStack'], s: 200 }, { text: 'One More Chapter', size: 32 }] }));
add('sakura-flower', 'Cozy Moments', 'cozy', () => badge({ shape: 'circle', rows: [{ icons: ['flower'], s: 200 }, { text: 'Cozy Moments', size: 32 }] }));
add('reading-candle', 'Late Night Read', 'cozy', () => badge({ shape: 'circle', rows: [{ icons: ['candle'], s: 200 }, { text: 'Late Night Reading', size: 32 }] }));
[
  ['coffee-and-chapters', 'Coffee & Chapters', 'mocha', 'cup'],
  ['saving-my-place', 'Saving My Place', 'rose', 'bookmark'],
  ['lost-in-a-book', 'Lost in a Book', 'lav', 'openBook'],
  ['bookish-mode', 'Bookish Mode', 'ocean', 'glasses'],
  ['plants-and-paperbacks', 'Plants & Paperbacks', 'sage', 'plant'],
  ['night-owl-reader', 'Night Owl Reader', 'night', 'owl'],
  ['library-day', 'Library Day', 'gold', 'card'],
].forEach(([id, label, theme, ic]) =>
  add(id, label, 'cozy', () => badge({ shape: 'circle', theme, rows: [{ icons: [ic], s: 190 }, { text: label, size: 32 }] })));

const CATEGORIES = [
  { id: 'ratings', label: 'Ratings' },
  { id: 'spice', label: 'Spice' },
  { id: 'status', label: 'Reading status' },
  { id: 'genres', label: 'Genres' },
  { id: 'tropes', label: 'Tropes' },
  { id: 'moods', label: 'Moods' },
  { id: 'warnings', label: 'Content notes' },
  { id: 'frames', label: 'Frames & banners' },
  { id: 'washi', label: 'Washi & paper' },
  { id: 'seasonal', label: 'Months' },
  { id: 'cozy', label: 'Cozy & bookish' },
];

// Keep only the chunks needed to draw the image (drops pHYs, text, time and any other metadata).
const KEEP_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);
function stripChunks(png) {
  const parts = [png.subarray(0, 8)];
  for (let o = 8; o < png.length; ) {
    const end = o + 12 + png.readUInt32BE(o);
    if (KEEP_CHUNKS.has(png.toString('ascii', o + 4, o + 8))) parts.push(png.subarray(o, end));
    o = end;
  }
  return Buffer.concat(parts);
}

// Render on an oversized canvas, trim to the artwork, then centre it with even padding.
async function saveSticker(svgBody, filename) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="-64 -64 640 640">${svgBody}</svg>`;
  const art = await sharp(Buffer.from(svg)).trim().toBuffer();
  const png = await sharp(art)
    .resize(SIZE - PAD * 2, SIZE - PAD * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(path.join(STICKER_DIR, filename), stripChunks(png));
}

for (const s of S) {
  await saveSticker(await s.build(), s.file);
}
console.log(`✓ Generated ${S.length} stickers`);

const dataFileContent = `export const STICKER_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};\n\nexport const STICKERS = ${JSON.stringify(
  S.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    src: '/stickers/' + s.file,
    filename: s.file,
  })),
  null,
  2,
)};\n`;

await fs.writeFile('./src/data/stickers.js', dataFileContent);
console.log('✓ src/data/stickers.js generated successfully');
