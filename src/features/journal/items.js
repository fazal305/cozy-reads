import { PAGE_W, PAGE_H, newItemId, round } from './templates';

const ASPECT = PAGE_W / PAGE_H;

function centred(item, cx, cy) {
  return { ...item, x: round(cx - item.w / 2), y: round(cy - item.h / 2), w: round(item.w), h: round(item.h), r: 0 };
}

const DECOR_SIZES = {
  washi: () => ({ w: 0.42, h: 0.034 }),
  frame: () => ({ w: 0.5, h: 0.28 }),
  double: () => ({ w: 0.5, h: 0.28 }),
  circle: () => ({ w: 0.3, h: 0.3 * ASPECT }),
  heart: () => ({ w: 0.26, h: 0.24 * ASPECT }),
  star: () => ({ w: 0.26, h: 0.26 * ASPECT }),
  ribbon: () => ({ w: 0.55, h: 0.06 }),
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
  return centred({ id: newItemId(), type: 'shape', shape: payload.shape, color: payload.color, ...(DECOR_SIZES[payload.shape] || DECOR_SIZES.frame)() }, cx, cy);
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
  return { template: data.template || 'blank', paper: data.paper || 'cream', items: Array.isArray(data.items) ? data.items : [] };
}
