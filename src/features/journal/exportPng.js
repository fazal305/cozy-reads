import { STICKERS } from '../../data/stickers';
import { strokeGeometry, paintStroke, grainTile, GRAIN_TILE } from './ink';
import { imageValue, pageLayers } from './layout';
import { PAGE_W, PAGE_H, PAGE_RATIO, fontCss } from './templates';
import { CHECK, RATING, MOOD, MOODS, TABLE, QUOTE, STAR_D, CHILI_D, quoteSize } from './elements';
import { resolveCoverSrc } from '../../lib/coverUrls';

const OUT_W = 1240;
const OUT_H = Math.round(OUT_W * PAGE_RATIO);

function loadImage(src, cors) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load failed'));
    img.src = src;
  });
}

function svgImage(svg, width, height) {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(Math.max(1, Math.round(width))));
  clone.setAttribute('height', String(Math.max(1, Math.round(height))));
  clone.removeAttribute('class');
  const markup = new XMLSerializer().serializeToString(clone);
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`, false);
}

function fit(img, w, h, mode) {
  const scale = mode === 'cover' ? Math.max(w / img.naturalWidth, h / img.naturalHeight) : Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return [(w - dw) / 2, (h - dh) / 2, dw, dh];
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/(\s+)/)) {
      const attempt = line + word;
      if (ctx.measureText(attempt).width <= maxWidth || !line.trim()) {
        line = attempt;
        while (ctx.measureText(line).width > maxWidth && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut--;
          lines.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        lines.push(line.trimEnd());
        line = word.trimStart();
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

function inBox(ctx, item, height, draw) {
  const w = item.w * OUT_W;
  const h = height ?? item.h * OUT_H;
  ctx.save();
  if (item.op != null && item.op < 1) ctx.globalAlpha = item.op;
  ctx.translate(item.x * OUT_W + w / 2, item.y * OUT_H + h / 2);
  if (item.r) ctx.rotate((item.r * Math.PI) / 180);
  draw(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function clipped(ctx, x, y, w, h, draw) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
}

// Mirrors ElementBody: everything is measured in 1% of the element's width.
function drawElement(ctx, item, x, y, w) {
  const U = w / 100;
  const family = fontCss(item.font);
  ctx.fillStyle = item.color;
  ctx.strokeStyle = item.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (item.kind === 'checklist') {
    item.items.forEach((row, i) => {
      const top = y + (CHECK.pad + i * CHECK.row) * U;
      const cy = top + (CHECK.row * U) / 2;
      const size = CHECK.box * U;
      const bx = x + CHECK.pad * U;
      const by = cy - size / 2;
      ctx.lineWidth = size * 0.11;
      roundRectPath(ctx, bx + size * 0.05, by + size * 0.05, size * 0.9, size * 0.9, size * 0.22);
      if (row.done) ctx.fill();
      ctx.stroke();
      if (row.done) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.13;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(bx + size * 0.26, by + size * 0.52);
        ctx.lineTo(bx + size * 0.44, by + size * 0.7);
        ctx.lineTo(bx + size * 0.75, by + size * 0.32);
        ctx.stroke();
        ctx.restore();
      }
      if (!row.t) return;
      const tx = x + CHECK.left * U;
      const maxW = (100 - CHECK.pad - CHECK.left) * U;
      ctx.save();
      if (row.done) ctx.globalAlpha *= 0.6;
      ctx.font = `${CHECK.text * U}px ${family}`;
      clipped(ctx, tx, top, maxW, CHECK.row * U, () => {
        ctx.fillText(row.t, tx, cy);
        if (row.done) {
          ctx.lineWidth = Math.max(1, CHECK.text * U * 0.07);
          ctx.beginPath();
          ctx.moveTo(tx, cy);
          ctx.lineTo(tx + Math.min(ctx.measureText(row.t).width, maxW), cy);
          ctx.stroke();
        }
      });
      ctx.restore();
    });
  } else if (item.kind === 'stars' || item.kind === 'spice') {
    const spice = item.kind === 'spice';
    const path = new Path2D(spice ? CHILI_D : STAR_D);
    const size = RATING.icon * U;
    for (let n = 0; n < 5; n++) {
      const on = n < (item.value || 0);
      ctx.save();
      ctx.translate(x + (RATING.edge + RATING.slot * (n + 0.5)) * U - size / 2, y + (RATING.height * U) / 2 - size / 2);
      ctx.scale(size, size);
      ctx.lineWidth = spice ? 0.06 : 0.07;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const base = ctx.globalAlpha;
      if (on) {
        ctx.globalAlpha = base * (spice ? 0.9 : 1);
        ctx.fill(path);
      }
      ctx.globalAlpha = base * (on ? 1 : 0.4);
      ctx.stroke(path);
      ctx.restore();
    }
  } else if (item.kind === 'mood') {
    const d = MOOD.emoji * 1.5 * U;
    ctx.textAlign = 'center';
    ctx.font = `${MOOD.emoji * U}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    MOODS.forEach((m, i) => {
      const cx = x + (100 / MOODS.length) * (i + 0.5) * U;
      const cy = y + (MOOD.height * U) / 2;
      const chosen = item.value === i;
      if (chosen) {
        ctx.save();
        ctx.globalAlpha *= 0.18;
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 0.5 * U;
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2 - 0.25 * U, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      ctx.globalAlpha *= chosen || item.value == null ? 1 : 0.4;
      ctx.fillText(m.emoji, cx, cy + U * 0.4);
      ctx.restore();
    });
  } else if (item.kind === 'table') {
    const cw = w / item.cols;
    const rh = TABLE.row * U;
    ctx.lineWidth = 0.5 * U;
    ctx.strokeRect(x + 0.25 * U, y + 0.25 * U, w - 0.5 * U, rh * item.rows - 0.5 * U);
    ctx.beginPath();
    for (let c = 1; c < item.cols; c++) {
      ctx.moveTo(x + c * cw + 0.25 * U, y);
      ctx.lineTo(x + c * cw + 0.25 * U, y + rh * item.rows);
    }
    for (let r = 1; r < item.rows; r++) {
      ctx.moveTo(x, y + r * rh + 0.25 * U);
      ctx.lineTo(x + w, y + r * rh + 0.25 * U);
    }
    ctx.stroke();
    ctx.font = `${TABLE.text * U}px ${family}`;
    item.cells.forEach((row, r) =>
      row.forEach((text, c) => {
        if (!text) return;
        clipped(ctx, x + c * cw, y + r * rh, cw, rh, () => ctx.fillText(text, x + c * cw + TABLE.pad * U, y + (r + 0.5) * rh));
      }),
    );
  } else if (item.kind === 'quote') {
    ctx.lineWidth = 0.7 * U;
    roundRectPath(ctx, x + 0.35 * U, y + 0.35 * U, w - 0.7 * U, QUOTE.height * U - 0.7 * U, 3 * U);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.textBaseline = 'top';
    ctx.font = `${22 * U}px ${fontCss('serif')}`;
    ctx.fillText('“', x + (QUOTE.pad - 1) * U, y - 1 * U);
    ctx.restore();
    if (item.quote) {
      const size = quoteSize(item.quote) * U;
      ctx.font = `${size}px ${family}`;
      const left = x + (QUOTE.pad + 2) * U;
      const lines = wrapText(ctx, item.quote, w - (QUOTE.pad * 2 + 2) * U);
      const top = y + QUOTE.textTop * U;
      clipped(ctx, left, top, w - (QUOTE.pad * 2 + 2) * U, QUOTE.textHeight * U, () => lines.forEach((line, i) => ctx.fillText(line, left, top + size * 1.25 * (i + 0.5))));
    }
    if (item.by) {
      ctx.font = `${QUOTE.by * U}px ${family}`;
      ctx.textAlign = 'right';
      ctx.fillText(`— ${item.by}`, x + w - QUOTE.pad * U, y + QUOTE.byTop * U + QUOTE.by * U * 0.625, w - QUOTE.pad * 2 * U);
    }
  }
}

// Pencil strokes are painted on a scratch canvas, masked by the grain tile, then copied over.
function drawStroke(ctx, item, scratch) {
  const geometry = strokeGeometry(item);
  if (item.tool !== 'pencil') {
    ctx.save();
    ctx.scale(OUT_W / PAGE_W, OUT_H / PAGE_H);
    paintStroke(ctx, item, geometry);
    ctx.restore();
    return;
  }
  const s = scratch.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'source-over';
  s.clearRect(0, 0, OUT_W, OUT_H);
  s.scale(OUT_W / PAGE_W, OUT_H / PAGE_H);
  s.fillStyle = item.color;
  s.fill(new Path2D(geometry.d));
  s.globalCompositeOperation = 'destination-in';
  const pattern = s.createPattern(grainTile().canvas, 'repeat');
  pattern.setTransform(new DOMMatrix().scale(GRAIN_TILE / grainTile().canvas.width));
  s.fillStyle = pattern;
  s.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.drawImage(scratch, 0, 0);
  ctx.restore();
}

// Draws the page on a canvas and downloads it. Returns { skipped } (images blocked by CORS).
export async function exportPagePng({ page, root, background, filename }) {
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  let skipped = 0;

  try {
    await document.fonts?.ready;
  } catch {
    // fonts api unavailable, canvas falls back to system fonts
  }

  ctx.drawImage(await svgImage(background, OUT_W, OUT_H), 0, 0, OUT_W, OUT_H);

  const scratch = document.createElement('canvas');
  scratch.width = OUT_W;
  scratch.height = OUT_H;
  const ordered = pageLayers(page.items || []).flatMap((layer) => layer.strokes || [layer.item]);

  for (const item of ordered) {
    if (item.type === 'stroke') {
      drawStroke(ctx, item, scratch);
    } else if (item.type === 'sticker') {
      const sticker = STICKERS.find((s) => s.id === item.sticker);
      if (!sticker) continue;
      try {
        const img = await loadImage(sticker.src, false);
        inBox(ctx, item, null, (x, y, w, h) => {
          const [dx, dy, dw, dh] = fit(img, w, h, 'contain');
          ctx.drawImage(img, x + dx, y + dy, dw, dh);
        });
      } catch {
        skipped++;
      }
    } else if (item.type === 'image') {
      const value = imageValue(item);
      if (!value) continue;
      try {
        const img = await loadImage(await resolveCoverSrc(value), true);
        inBox(ctx, item, null, (x, y, w, h) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          const [dx, dy, dw, dh] = fit(img, w, h, 'cover');
          ctx.drawImage(img, x + dx, y + dy, dw, dh);
          ctx.restore();
        });
      } catch {
        skipped++;
      }
    } else if (item.type === 'washi' || item.type === 'shape') {
      const svg = root.querySelector(`svg[data-export="${item.id}"]`);
      if (!svg) continue;
      const img = await svgImage(svg, item.w * OUT_W, item.h * OUT_H);
      inBox(ctx, item, null, (x, y, w, h) => ctx.drawImage(img, x, y, w, h));
    } else if (item.type === 'element') {
      try {
        await document.fonts?.load(`16px ${fontCss(item.font)}`);
      } catch {
        // keep going with whatever font is available
      }
      inBox(ctx, item, null, (x, y, w) => drawElement(ctx, item, x, y, w));
    } else if (item.type === 'text' && item.text) {
      const px = item.size * OUT_W;
      const family = fontCss(item.font);
      try {
        await document.fonts?.load(`${px}px ${family}`);
      } catch {
        // keep going with whatever font is available
      }
      ctx.font = `${px}px ${family}`;
      const padX = px * 0.15;
      const padY = px * 0.1;
      const lineH = px * 1.25;
      const lines = wrapText(ctx, item.text, item.w * OUT_W - padX * 2);
      inBox(ctx, item, lines.length * lineH + padY * 2, (x, y) => {
        ctx.fillStyle = item.color;
        ctx.textBaseline = 'middle';
        lines.forEach((line, i) => ctx.fillText(line, x + padX, y + padY + lineH * (i + 0.5)));
      });
    }
  }

  const blob = await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty'))), 'image/png');
    } catch (err) {
      reject(err);
    }
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { skipped };
}
