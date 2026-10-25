import { getStroke } from 'perfect-freehand';
import { PAGE_W, PAGE_H, round } from './templates';

// Strokes store a flat normalised point list: pts = [x0, y0, x1, y1, ...], optional pr = [p0, p1, ...].
// Optional: sn = 1 for a snapped shape (even width, no taper), tc = bitmask of ends cut by the eraser (1 start, 2 end).

export const PEN_TOOLS = ['fountain', 'ballpoint', 'brush', 'pencil'];
export const isPen = (tool) => tool === 'pen' || PEN_TOOLS.includes(tool);

// scale: drawn width / stored size. weight: how much real pressure counts. speed: how much fast strokes thin out.
const PENS = {
  fountain: { scale: 1.3, thinning: 0.6, smoothing: 0.6, streamline: 0.2, taper: 3, weight: 0.8, speed: 0.45 },
  ballpoint: { scale: 1, thinning: 0.15, smoothing: 0.5, streamline: 0.25, taper: 0, weight: 0.45, speed: 0 },
  brush: { scale: 2.2, thinning: 0.88, smoothing: 0.65, streamline: 0.25, taper: 6, weight: 1, speed: 0.35 },
  pencil: { scale: 1.05, thinning: 0.3, smoothing: 0.5, streamline: 0.25, taper: 1, weight: 0.6, speed: 0 },
};

export const penScale = (tool) => PENS[tool]?.scale || 1;

function toUnits(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i += 2) out.push([pts[i] * PAGE_W, pts[i + 1] * PAGE_H]);
  if (out.length === 1) out.push([out[0][0] + 0.01, out[0][1]]);
  return out;
}

const f = (n) => Math.round(n * 10) / 10;

function smoothLine(points) {
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${f(last[0])} ${f(last[1])}`;
}

function continueLine(points) {
  let d = '';
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${f(last[0])} ${f(last[1])}`;
}

// Filled outline whose width follows pen pressure.
function pressureOutline(points, pressures, width) {
  const left = [];
  const right = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [px, py] = points[Math.max(0, i - 1)];
    const [qx, qy] = points[Math.min(n - 1, i + 1)];
    let dx = qx - px;
    let dy = qy - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const p = pressures[Math.min(i, pressures.length - 1)] ?? 0.5;
    const half = (width * (0.3 + 0.9 * p)) / 2;
    const [x, y] = points[i];
    left.push([x - dy * half, y + dx * half]);
    right.push([x + dy * half, y - dx * half]);
  }
  const endR = Math.max(0.5, Math.hypot(left[n - 1][0] - right[n - 1][0], left[n - 1][1] - right[n - 1][1]) / 2);
  const startR = Math.max(0.5, Math.hypot(left[0][0] - right[0][0], left[0][1] - right[0][1]) / 2);
  const back = right.slice().reverse();
  return (
    smoothLine(left) +
    ` A${f(endR)} ${f(endR)} 0 0 1 ${f(back[0][0])} ${f(back[0][1])}` +
    continueLine(back) +
    ` A${f(startR)} ${f(startR)} 0 0 1 ${f(left[0][0])} ${f(left[0][1])} Z`
  );
}

function outlinePath(outline) {
  const n = outline.length;
  if (!n) return '';
  let d = `M${f(outline[0][0])} ${f(outline[0][1])} Q`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % n];
    d += `${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)} `;
  }
  return `${d}Z`;
}

// Pressure per point: real pen pressure mixed with speed (wider gaps between samples = faster = thinner).
function penPressures(points, stroke, spec) {
  const hasPr = stroke.pr && stroke.pr.length;
  const speed = hasPr ? spec.speed : Math.min(1, spec.speed * 1.6);
  const out = [];
  let sp = 0.5;
  for (let i = 0; i < points.length; i++) {
    if (i) {
      const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      sp += (Math.max(0, 1 - d / 24) - sp) * 0.35;
    }
    const real = hasPr ? stroke.pr[Math.min(i, stroke.pr.length - 1)] ?? 0.5 : 0.5;
    const base = 0.5 + (real - 0.5) * spec.weight;
    out.push(base * (1 - speed) + sp * speed);
  }
  return out;
}

function penOutline(stroke, last) {
  const spec = PENS[stroke.tool];
  const points = toUnits(stroke.pts);
  const width = stroke.size * PAGE_W;
  const snapped = !!stroke.sn;
  const pr = snapped ? null : penPressures(points, stroke, spec);
  const input = points.map(([x, y], i) => [x, y, pr ? pr[i] : 0.5]);
  const tc = stroke.tc || 0;
  const taper = snapped ? 0 : spec.taper * width;
  const outline = getStroke(input, {
    size: width * spec.scale,
    thinning: snapped ? 0 : spec.thinning,
    smoothing: spec.smoothing,
    streamline: snapped ? 0 : spec.streamline,
    simulatePressure: false,
    start: { taper: tc & 1 ? 0 : taper, cap: true },
    end: { taper: tc & 2 ? 0 : taper, cap: true },
    last,
  });
  return outlinePath(outline);
}

function buildGeometry(stroke, last = true) {
  if (PENS[stroke.tool]) return { d: penOutline(stroke, last), filled: true };
  const points = toUnits(stroke.pts);
  const width = stroke.size * PAGE_W;
  if (stroke.pr && stroke.pr.length && stroke.tool === 'pen') {
    return { d: pressureOutline(points, stroke.pr, width), filled: true };
  }
  return { d: smoothLine(points), filled: false };
}

const cache = new WeakMap();

// Returns { d, filled } in page units (PAGE_W x PAGE_H). Saved strokes never change, so results are cached.
export function strokeGeometry(stroke) {
  let g = cache.get(stroke);
  if (!g) {
    g = buildGeometry(stroke);
    cache.set(stroke, g);
  }
  return g;
}

// For a stroke still being drawn: not cached, end not tapered yet.
export function liveGeometry(stroke) {
  return buildGeometry(stroke, false);
}

export function strokeStyle(stroke) {
  const highlighter = stroke.tool === 'highlighter';
  return {
    width: stroke.size * PAGE_W,
    opacity: highlighter ? 0.38 : stroke.tool === 'pencil' ? 0.82 : 1,
    cap: highlighter ? 'butt' : 'round',
  };
}

// Paints one stroke on a 2D context already scaled to page units.
export function paintStroke(ctx, stroke, geometry) {
  const { d, filled } = geometry;
  const st = strokeStyle(stroke);
  const path = new Path2D(d);
  ctx.globalAlpha = st.opacity;
  if (filled) {
    ctx.fillStyle = stroke.color;
    ctx.fill(path);
  } else {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = st.width;
    ctx.lineCap = st.cap;
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }
  ctx.globalAlpha = 1;
}

// Pencil grain: a small tile of soft noise used as a mask, so SVG and the PNG export match.
export const GRAIN_TILE = 40;
let grainCanvas = null;
let grainUrl = '';
export function grainTile() {
  if (!grainCanvas && typeof document !== 'undefined') {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    let seed = 7;
    for (let i = 0; i < size * size; i++) {
      seed = (seed * 16807) % 2147483647;
      const a = 0.5 + ((seed % 1000) / 1000) * 0.5;
      img.data.set([255, 255, 255, Math.round(a * 255)], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    grainCanvas = c;
    grainUrl = c.toDataURL('image/png');
  }
  return { canvas: grainCanvas, url: grainUrl };
}

// Light streamlining while drawing; skips points too close to the previous one.
export function addPoint(raw, x, y, pressure) {
  const n = raw.pts.length;
  if (n >= 2) {
    const lx = raw.pts[n - 2];
    const ly = raw.pts[n - 1];
    const dist = Math.hypot((x - lx) * PAGE_W, (y - ly) * PAGE_H);
    if (dist < 2.5) return false;
    const t = 0.65;
    x = lx + (x - lx) * t;
    y = ly + (y - ly) * t;
  }
  raw.pts.push(x, y);
  if (raw.pr) raw.pr.push(pressure);
  return true;
}

// The final point is kept exact so strokes end where the pointer was released.
export function endPoint(raw, x, y, pressure) {
  const n = raw.pts.length;
  if (n >= 2 && Math.hypot((x - raw.pts[n - 2]) * PAGE_W, (y - raw.pts[n - 1]) * PAGE_H) < 1) return;
  raw.pts.push(x, y);
  if (raw.pr) raw.pr.push(pressure);
}

export function finishStroke(raw) {
  const stroke = { ...raw, pts: raw.pts.map((v) => round(v, 3)) };
  if (!stroke.pr) delete stroke.pr;
  if (raw.pr) {
    const pr = raw.pr.map((v) => round(v, 2));
    const varies = pr.some((p) => Math.abs(p - pr[0]) > 0.04);
    if (varies) stroke.pr = pr;
    else delete stroke.pr;
  }
  return stroke;
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

// Adds points along long segments so a hit can split the stroke cleanly.
function resample(item, spacing) {
  const pts = [];
  const pr = item.pr ? [] : null;
  for (let i = 0; i < item.pts.length; i += 2) {
    if (i >= 2) {
      const ax = item.pts[i - 2];
      const ay = item.pts[i - 1];
      const dist = Math.hypot((item.pts[i] - ax) * PAGE_W, (item.pts[i + 1] - ay) * PAGE_H);
      const steps = Math.floor(dist / spacing);
      for (let k = 1; k < steps; k++) {
        const t = k / steps;
        pts.push(round(ax + (item.pts[i] - ax) * t, 3), round(ay + (item.pts[i + 1] - ay) * t, 3));
        if (pr) pr.push(item.pr[i / 2 - 1] ?? 0.5);
      }
    }
    pts.push(item.pts[i], item.pts[i + 1]);
    if (pr) pr.push(item.pr[i / 2] ?? 0.5);
  }
  return pr ? { ...item, pts, pr } : { ...item, pts };
}

// Removes the parts of strokes within the eraser circle, splitting strokes where needed.
// opts.whole removes every stroke it touches; opts.only limits which strokes can be erased.
export function eraseAt(items, x, y, eraserSize, makeId, opts = {}) {
  let changed = false;
  const radius = (eraserSize * PAGE_W) / 2;
  const ex = x * PAGE_W;
  const ey = y * PAGE_H;
  const next = [];
  for (const original of items) {
    if (original.type !== 'stroke' || (opts.only && !opts.only(original))) {
      next.push(original);
      continue;
    }
    const reach = radius + (original.size * PAGE_W) / 2;
    let touched = false;
    const p = original.pts;
    for (let i = 0; i < p.length && !touched; i += 2) {
      const j = Math.max(0, i - 2);
      touched = segmentDistance(ex, ey, p[j] * PAGE_W, p[j + 1] * PAGE_H, p[i] * PAGE_W, p[i + 1] * PAGE_H) <= reach;
    }
    if (!touched) {
      next.push(original);
      continue;
    }
    changed = true;
    if (opts.whole) continue;
    const item = resample(original, Math.max(2, radius / 2));
    const count = item.pts.length / 2;
    const runs = [];
    let run = null;
    for (let i = 0; i < item.pts.length; i += 2) {
      const inside = Math.hypot(item.pts[i] * PAGE_W - ex, item.pts[i + 1] * PAGE_H - ey) <= reach;
      if (inside) {
        run = null;
      } else {
        if (!run) {
          run = { pts: [], pr: item.pr ? [] : null, first: i / 2 };
          runs.push(run);
        }
        run.pts.push(item.pts[i], item.pts[i + 1]);
        run.last = i / 2;
        if (run.pr) run.pr.push(item.pr[i / 2] ?? 0.5);
      }
    }
    runs.forEach((r, index) => {
      if (r.pts.length < 4) return;
      const piece = { ...item, id: index === 0 ? item.id : makeId(), pts: r.pts };
      if (r.pr) piece.pr = r.pr;
      if (PEN_TOOLS.includes(item.tool)) {
        const tc = (r.first > 0 ? 1 : (item.tc || 0) & 1) | (r.last < count - 1 ? 2 : (item.tc || 0) & 2);
        if (tc) piece.tc = tc;
        else delete piece.tc;
      }
      next.push(piece);
    });
  }
  return changed ? next : items;
}

// Erases along the segment between two eraser positions.
export function eraseAlong(items, from, to, eraserSize, makeId, opts) {
  const step = (eraserSize * PAGE_W) / 3;
  const dist = Math.hypot((to.x - from.x) * PAGE_W, (to.y - from.y) * PAGE_H);
  const steps = Math.max(1, Math.ceil(dist / step));
  let result = items;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    result = eraseAt(result, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, eraserSize, makeId, opts);
  }
  return result;
}
