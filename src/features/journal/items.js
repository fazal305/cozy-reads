import { PAGE_W, PAGE_H, newItemId, round } from './templates';
import { newElement } from './elements';

const ASPECT = PAGE_W / PAGE_H;

function centred(item, cx, cy) {
  return { ...item, x: round(cx - item.w / 2), y: round(cy - item.h / 2), w: round(item.w), h: round(item.h), r: 0 };
}

const px = (w, h) => ({ w: w / PAGE_W, h: h / PAGE_H });

const DECOR_SIZES = {
  washi: () => ({ w: 0.42, h: 0.034 }),
  frame: () => ({ w: 0.5, h: 0.28 }),
  double: () => ({ w: 0.5, h: 0.28 }),
  circle: () => ({ w: 0.3, h: 0.3 * ASPECT }),
  heart: () => ({ w: 0.26, h: 0.24 * ASPECT }),
  star: () => ({ w: 0.26, h: 0.26 * ASPECT }),
  ribbon: () => ({ w: 0.55, h: 0.06 }),
  rect: () => px(460, 260),
  rounded: () => px(460, 260),
  line: () => px(500, 40),
  arrow: () => px(440, 90),
  bubble: () => px(440, 280),
  thought: () => px(440, 300),
  cloud: () => px(420, 270),
  flower: () => px(300, 300),
  sparkle: () => px(240, 240),
  bookmark: () => px(150, 300),
  tag: () => px(360, 170),
  banner: () => px(520, 150),
  note: () => px(330, 330),
  dotted: () => px(640, 50),
  wavy: () => px(640, 56),
  dline: () => px(640, 56),
};

// Starting look of the newer shapes. The first six keep their original outline style.
const SHAPE_STYLE = {
  rect: { filled: false, sw: 5, rad: 0 },
  rounded: { filled: false, sw: 5, rad: 40 },
  line: { sw: 5 },
  arrow: { sw: 5 },
  bubble: { filled: false, sw: 5, rad: 36 },
  thought: { filled: false, sw: 5 },
  cloud: { filled: false, sw: 5 },
  flower: { filled: false, sw: 5 },
  sparkle: { filled: true, sw: 4 },
  bookmark: { filled: true, sw: 4 },
  tag: { filled: true, sw: 4 },
  banner: { filled: true, sw: 4 },
  note: { filled: true, sw: 3 },
  dotted: { sw: 8 },
  wavy: { sw: 4 },
  dline: { sw: 5 },
};

// payload comes from the drawer: { kind: 'sticker' | 'washi' | 'shape', ... }
export function decorItem(payload, cx, cy) {
  if (payload.kind === 'sticker') {
    const w = 0.26;
    return centred({ id: newItemId(), type: 'sticker', sticker: payload.sticker, w, h: (w * ASPECT) / (payload.aspect || 1) }, cx, cy);
  }
  if (payload.kind === 'washi') {
    return centred({ id: newItemId(), type: 'washi', style: payload.style, color: payload.color, ...DECOR_SIZES.washi() }, cx, cy);
  }
  if (payload.kind === 'element') return centred({ id: newItemId(), ...newElement(payload.element, payload.color) }, cx, cy);
  return centred({ id: newItemId(), type: 'shape', shape: payload.shape, color: payload.color, ...SHAPE_STYLE[payload.shape], ...(DECOR_SIZES[payload.shape] || DECOR_SIZES.frame)() }, cx, cy);
}

export function textItem(color, cx = 0.5, cy = 0.45) {
  return centred({ id: newItemId(), type: 'text', text: '', font: 'hand', size: 0.045, color, w: 0.5, h: 0.06 }, cx, cy);
}

export function imageItem(source, aspect, cx = 0.5, cy = 0.45) {
  const w = 0.5;
  const ref = source.startsWith('https:') ? { url: source } : { src: source };
  return centred({ id: newItemId(), type: 'image', ...ref, w, h: (w * ASPECT) / (aspect || 1) }, cx, cy);
}

export function duplicateItem(item) {
  const copy = { ...item, id: newItemId() };
  if (item.type === 'stroke') {
    copy.pts = item.pts.map((v, i) => round(v + (i % 2 ? 0.02 : 0.03), 3));
  } else {
    copy.x = round(item.x + 0.03);
    copy.y = round(item.y + 0.02);
  }
  return copy;
}

export function pageDoc(data = {}) {
  const doc = { template: data.template || 'blank', paper: data.paper || 'cream', items: Array.isArray(data.items) ? data.items : [] };
  if (data.paperColor) doc.paperColor = data.paperColor;
  return doc;
}

// Tap-to-place spots drift down and right so new items do not stack exactly.
export function cascadeSpot(count) {
  const k = count % 7;
  return { x: 0.42 + k * 0.03, y: 0.36 + k * 0.028 };
}
