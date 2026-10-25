import { PAGE_W, PAGE_H, round } from './templates';

// Hold-to-snap: turns a rough stroke into a clean line, arrow, ellipse, rectangle or triangle.

const toUnits = (pts) => {
  const out = [];
  for (let i = 0; i < pts.length; i += 2) out.push([pts[i] * PAGE_W, pts[i + 1] * PAGE_H]);
  return out;
};

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function segDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function pathLength(p) {
  let len = 0;
  for (let i = 1; i < p.length; i++) len += dist(p[i - 1], p[i]);
  return len;
}

// Evenly spaced points along a polyline.
function resample(p, n) {
  const total = pathLength(p);
  if (!total) return [p[0]];
  const step = total / (n - 1);
  const out = [p[0]];
  let acc = 0;
  for (let i = 1; i < p.length && out.length < n; i++) {
    let a = p[i - 1];
    let d = dist(a, p[i]);
    while (acc + d >= step && out.length < n) {
      const t = (step - acc) / d;
      a = [a[0] + (p[i][0] - a[0]) * t, a[1] + (p[i][1] - a[1]) * t];
      out.push(a);
      d = dist(a, p[i]);
      acc = 0;
    }
    acc += d;
  }
  while (out.length < n) out.push(p[p.length - 1]);
  return out;
}

function rdp(p, eps) {
  if (p.length < 3) return p;
  let index = 0;
  let max = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = segDist(p[i], p[0], p[p.length - 1]);
    if (d > max) {
      max = d;
      index = i;
    }
  }
  if (max <= eps) return [p[0], p[p.length - 1]];
  return [...rdp(p.slice(0, index + 1), eps).slice(0, -1), ...rdp(p.slice(index), eps)];
}

const rotate = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// Snap an angle to the nearest quarter turn when it is close.
function tidyAngle(a) {
  const q = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
  return Math.abs(a - q) < (8 * Math.PI) / 180 ? q : a;
}

// Densified polyline so pen outlines follow straight edges exactly.
function polyline(corners, spacing = 5) {
  const out = [corners[0]];
  for (let i = 1; i < corners.length; i++) {
    const a = corners[i - 1];
    const b = corners[i];
    const steps = Math.max(1, Math.round(dist(a, b) / spacing));
    for (let k = 1; k <= steps; k++) out.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps]);
  }
  return out;
}

const fromUnits = (points) => points.flatMap(([x, y]) => [round(x / PAGE_W, 3), round(y / PAGE_H, 3)]);

function ellipse(cx, cy, rx, ry, a) {
  const n = Math.max(36, Math.min(96, Math.round((rx + ry) / 4)));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const [x, y] = rotate([rx * Math.cos(t), ry * Math.sin(t)], a);
    out.push([cx + x, cy + y]);
  }
  return out;
}

function fitEllipse(p) {
  const n = p.length;
  const mx = p.reduce((s, q) => s + q[0], 0) / n;
  const my = p.reduce((s, q) => s + q[1], 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of p) {
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
    sxy += (x - mx) * (y - my);
  }
  const a = tidyAngle(0.5 * Math.atan2(2 * sxy, sxx - syy));
  const local = p.map((q) => rotate([q[0] - mx, q[1] - my], -a));
  const xs = local.map((q) => q[0]);
  const ys = local.map((q) => q[1]);
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2;
  const ry = (Math.max(...ys) - Math.min(...ys)) / 2;
  const ox = (Math.max(...xs) + Math.min(...xs)) / 2;
  const oy = (Math.max(...ys) + Math.min(...ys)) / 2;
  if (rx < 4 || ry < 4) return null;
  const error = local.reduce((s, q) => s + Math.abs(Math.hypot((q[0] - ox) / rx, (q[1] - oy) / ry) - 1), 0) / n;
  const [cx, cy] = rotate([ox, oy], a);
  return { cx: mx + cx, cy: my + cy, rx, ry, a, error };
}

function corners(p, diag) {
  const n = p.length;
  const mx = p.reduce((s, q) => s + q[0], 0) / n;
  const my = p.reduce((s, q) => s + q[1], 0) / n;
  let start = 0;
  p.forEach((q, i) => {
    if (dist(q, [mx, my]) > dist(p[start], [mx, my])) start = i;
  });
  const loop = [...p.slice(start), ...p.slice(0, start), p[start]];
  let pts = rdp(loop, diag * 0.07).slice(0, -1);
  // Drop nearly straight vertices.
  let changed = true;
  while (changed && pts.length > 3) {
    changed = false;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i - 1 + pts.length) % pts.length];
      const b = pts[i];
      const c = pts[(i + 1) % pts.length];
      const v1 = [a[0] - b[0], a[1] - b[1]];
      const v2 = [c[0] - b[0], c[1] - b[1]];
      const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(...v1) * Math.hypot(...v2)) || 1);
      if (cos < -0.9 || dist(a, b) < diag * 0.08) {
        pts = pts.filter((_, k) => k !== i);
        changed = true;
        break;
      }
    }
  }
  return pts;
}

function rectangle(p, quad) {
  let longest = 0;
  let a = 0;
  for (let i = 0; i < 4; i++) {
    const s = quad[i];
    const e = quad[(i + 1) % 4];
    if (dist(s, e) > longest) {
      longest = dist(s, e);
      a = Math.atan2(e[1] - s[1], e[0] - s[0]);
    }
  }
  a = tidyAngle(a);
  const local = p.map((q) => rotate(q, -a));
  const xs = local.map((q) => q[0]);
  const ys = local.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].map((q) => rotate(q, a));
}

function arrow(p) {
  const tail = p[0];
  const far = Math.max(...p.map((q) => dist(q, tail)));
  const k = p.findIndex((q) => dist(q, tail) >= far * 0.97);
  const tip = p[k];
  const shaft = dist(tail, tip);
  if (shaft < 40 || k >= p.length - 2) return null;
  const head = p.slice(k);
  const headLen = pathLength(head);
  const straight = p.slice(0, k + 1).every((q) => segDist(q, tail, tip) < Math.max(8, shaft * 0.07));
  if (!straight || headLen < shaft * 0.12 || headLen > shaft * 1.2) return null;
  if (head.some((q) => dist(q, tip) > shaft * 0.5)) return null;
  const u = [(tip[0] - tail[0]) / shaft, (tip[1] - tail[1]) / shaft];
  const wing = Math.min(shaft * 0.3, Math.max(16, headLen * 0.45));
  const w1 = rotate(u, (28 * Math.PI) / 180);
  const w2 = rotate(u, (-28 * Math.PI) / 180);
  return [tail, tip, [tip[0] - w1[0] * wing, tip[1] - w1[1] * wing], tip, [tip[0] - w2[0] * wing, tip[1] - w2[1] * wing]];
}

export function straightLine(pts) {
  const p = toUnits(pts);
  return fromUnits(polyline([p[0], p[p.length - 1]], 8));
}

// Returns { kind, pts } with normalised points, or null when nothing matches.
export function recogniseShape(pts) {
  const raw = toUnits(pts);
  if (raw.length < 4) return null;
  const len = pathLength(raw);
  if (len < 30) return null;
  const a = raw[0];
  const b = raw[raw.length - 1];
  const chord = dist(a, b);

  if (chord > len * 0.85 && raw.every((q) => segDist(q, a, b) < Math.max(6, chord * 0.06))) {
    return { kind: 'line', pts: fromUnits(polyline([a, b], 8)) };
  }

  const head = arrow(raw);
  if (head) return { kind: 'arrow', pts: fromUnits(polyline(head)) };

  const xs = raw.map((q) => q[0]);
  const ys = raw.map((q) => q[1]);
  const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (chord > Math.max(24, len * 0.2) || diag < 20) return null;

  const even = resample([...raw, raw[0]], 72);
  const fit = fitEllipse(even);
  const quad = corners(even, diag);
  if (fit && fit.error < 0.075 && quad.length !== 3) {
    let { rx, ry, a: angle } = fit;
    if (Math.abs(rx - ry) / Math.max(rx, ry) < 0.12) {
      rx = ry = (rx + ry) / 2;
      angle = 0;
    }
    return { kind: rx === ry ? 'circle' : 'ellipse', pts: fromUnits(ellipse(fit.cx, fit.cy, rx, ry, angle)) };
  }
  if (quad.length === 3) return { kind: 'triangle', pts: fromUnits(polyline([...quad, quad[0]])) };
  if (quad.length === 4) return { kind: 'rectangle', pts: fromUnits(polyline(rectangle(even, quad))) };
  if (fit && fit.error < 0.12) return { kind: 'ellipse', pts: fromUnits(ellipse(fit.cx, fit.cy, fit.rx, fit.ry, fit.a)) };
  return null;
}
