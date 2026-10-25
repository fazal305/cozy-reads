import { STICKERS } from '../../data/stickers';
import { strokeGeometry, strokeStyle } from './ink';
import { imageValue } from './layout';
import { PAGE_W, PAGE_H, PAGE_RATIO, fontCss } from './templates';
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
  ctx.translate(item.x * OUT_W + w / 2, item.y * OUT_H + h / 2);
  if (item.r) ctx.rotate((item.r * Math.PI) / 180);
  draw(-w / 2, -h / 2, w, h);
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

  for (const item of page.items || []) {
    if (item.type === 'stroke') {
      const { d, filled } = strokeGeometry(item);
      const st = strokeStyle(item);
      ctx.save();
      ctx.scale(OUT_W / PAGE_W, OUT_H / PAGE_H);
      ctx.globalAlpha = st.opacity;
      const path = new Path2D(d);
      if (filled) {
        ctx.fillStyle = item.color;
        ctx.fill(path);
      } else {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = st.width;
        ctx.lineCap = st.cap;
        ctx.lineJoin = 'round';
        ctx.stroke(path);
      }
      ctx.restore();
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
