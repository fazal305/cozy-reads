import { PAGE_W, PAGE_H, newItemId, round } from './templates';

// Lasso selection and group transforms. All maths runs in page units so rotation keeps its shape.

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// A stroke is picked when most of its points are inside; other items when their centre is.
export function lassoSelect(items, poly) {
  const ids = [];
  for (const item of items) {
    if (item.type === 'stroke') {
      let hits = 0;
      const n = item.pts.length / 2;
      for (let i = 0; i < item.pts.length; i += 2) if (pointInPolygon(item.pts[i] * PAGE_W, item.pts[i + 1] * PAGE_H, poly)) hits++;
      if (hits > n / 2) ids.push(item.id);
    } else if (pointInPolygon((item.x + item.w / 2) * PAGE_W, (item.y + item.h / 2) * PAGE_H, poly)) {
      ids.push(item.id);
    }
  }
  return ids;
}

function itemBounds(item) {
  if (item.type === 'stroke') {
    const pad = (item.size * PAGE_W) / 2;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < item.pts.length; i += 2) {
      const x = item.pts[i] * PAGE_W;
      const y = item.pts[i + 1] * PAGE_H;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  }
  const cx = (item.x + item.w / 2) * PAGE_W;
  const cy = (item.y + item.h / 2) * PAGE_H;
  const hw = (item.w * PAGE_W) / 2;
  const hh = (item.h * PAGE_H) / 2;
  const a = ((item.r || 0) * Math.PI) / 180;
  const ex = Math.abs(hw * Math.cos(a)) + Math.abs(hh * Math.sin(a));
  const ey = Math.abs(hw * Math.sin(a)) + Math.abs(hh * Math.cos(a));
  return [cx - ex, cy - ey, cx + ex, cy + ey];
}

// Selection frame in page units: { x, y, w, h, r } with r in degrees.
export function frameOf(items) {
  if (!items.length) return null;
  let [x0, y0, x1, y1] = itemBounds(items[0]);
  for (const item of items.slice(1)) {
    const b = itemBounds(item);
    x0 = Math.min(x0, b[0]);
    y0 = Math.min(y0, b[1]);
    x1 = Math.max(x1, b[2]);
    y1 = Math.max(y1, b[3]);
  }
  const pad = 8;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, r: 0 };
}

// t = { cx, cy, s, a, dx, dy }: scale by s and rotate by a (radians) about (cx, cy), then move.
function mapPoint(x, y, t) {
  const rx = (x - t.cx) * t.s;
  const ry = (y - t.cy) * t.s;
  const cos = Math.cos(t.a);
  const sin = Math.sin(t.a);
  return [t.cx + rx * cos - ry * sin + t.dx, t.cy + rx * sin + ry * cos + t.dy];
}

export function transformItem(item, t) {
  if (item.type === 'stroke') {
    const pts = new Array(item.pts.length);
    for (let i = 0; i < item.pts.length; i += 2) {
      const [x, y] = mapPoint(item.pts[i] * PAGE_W, item.pts[i + 1] * PAGE_H, t);
      pts[i] = round(x / PAGE_W, 3);
      pts[i + 1] = round(y / PAGE_H, 3);
    }
    return t.s === 1 ? { ...item, pts } : { ...item, pts, size: round(item.size * t.s, 4) };
  }
  const [cx, cy] = mapPoint((item.x + item.w / 2) * PAGE_W, (item.y + item.h / 2) * PAGE_H, t);
  const w = item.w * t.s;
  const h = item.h * t.s;
  let r = (item.r || 0) + (t.a * 180) / Math.PI;
  r = ((((r + 180) % 360) + 360) % 360) - 180;
  const next = { ...item, x: round(cx / PAGE_W - w / 2), y: round(cy / PAGE_H - h / 2), w: round(w), h: round(h), r: Math.round(r * 10) / 10 };
  if (item.type === 'text' && t.s !== 1) next.size = round(item.size * t.s);
  return next;
}

export function transformFrame(frame, t) {
  const [cx, cy] = mapPoint(frame.x + frame.w / 2, frame.y + frame.h / 2, t);
  const w = frame.w * t.s;
  const h = frame.h * t.s;
  return { x: cx - w / 2, y: cy - h / 2, w, h, r: frame.r + (t.a * 180) / Math.PI };
}

export const canRecolour = (item) => item.type !== 'sticker' && item.type !== 'image' && 'color' in item;

export function duplicateAll(items) {
  return items.map((item) => ({ ...transformItem(item, { cx: 0, cy: 0, s: 1, a: 0, dx: 24, dy: 24 }), id: newItemId() }));
}
