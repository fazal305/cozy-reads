import { PAGE_W, PAGE_H, round } from './templates';

// Strokes store a flat normalised point list: pts = [x0, y0, x1, y1, ...], optional pr = [p0, p1, ...].

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

// Returns { d, filled } in page units (PAGE_W x PAGE_H).
export function strokeGeometry(stroke) {
  const points = toUnits(stroke.pts);
  const width = stroke.size * PAGE_W;
  if (stroke.pr && stroke.pr.length && stroke.tool === 'pen') {
    return { d: pressureOutline(points, stroke.pr, width), filled: true };
  }
  return { d: smoothLine(points), filled: false };
}

export function strokeStyle(stroke) {
  const highlighter = stroke.tool === 'highlighter';
  return {
    width: stroke.size * PAGE_W,
    opacity: highlighter ? 0.38 : 1,
    cap: highlighter ? 'butt' : 'round',
  };
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
export function eraseAt(items, x, y, eraserSize, makeId) {
  let changed = false;
  const radius = (eraserSize * PAGE_W) / 2;
  const ex = x * PAGE_W;
  const ey = y * PAGE_H;
  const next = [];
  for (const original of items) {
    if (original.type !== 'stroke') {
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
    const item = resample(original, Math.max(2, radius / 2));
    const runs = [];
    let run = null;
    for (let i = 0; i < item.pts.length; i += 2) {
      const inside = Math.hypot(item.pts[i] * PAGE_W - ex, item.pts[i + 1] * PAGE_H - ey) <= reach;
      if (inside) {
        run = null;
      } else {
        if (!run) {
          run = { pts: [], pr: item.pr ? [] : null };
          runs.push(run);
        }
        run.pts.push(item.pts[i], item.pts[i + 1]);
        if (run.pr) run.pr.push(item.pr[i / 2] ?? 0.5);
      }
    }
    changed = true;
    runs.forEach((r, index) => {
      if (r.pts.length < 4) return;
      const piece = { ...item, id: index === 0 ? item.id : makeId(), pts: r.pts };
      if (r.pr) piece.pr = r.pr;
      next.push(piece);
    });
  }
  return changed ? next : items;
}

// Erases along the segment between two eraser positions.
export function eraseAlong(items, from, to, eraserSize, makeId) {
  const step = (eraserSize * PAGE_W) / 3;
  const dist = Math.hypot((to.x - from.x) * PAGE_W, (to.y - from.y) * PAGE_H);
  const steps = Math.max(1, Math.ceil(dist / step));
  let result = items;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    result = eraseAt(result, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, eraserSize, makeId);
  }
  return result;
}
