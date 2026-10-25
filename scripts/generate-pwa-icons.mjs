import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg', 'utf8');
const inner = svg.replace(/^[\s\S]*?<rect[^>]*\/>\s*/, '').replace(/<\/svg>\s*$/, '');
const BG = '#FFF5F5';

// Full-bleed square with the mark scaled into the maskable safe zone.
const fullBleed = (scale) => {
  const offset = (64 - 64 * scale) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${BG}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${inner}</g></svg>`
  );
};

const out = (input, size, file) =>
  sharp(input, { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${file}`);

await Promise.all([
  out(Buffer.from(svg), 192, 'icon-192.png'),
  out(Buffer.from(svg), 512, 'icon-512.png'),
  out(fullBleed(0.72), 512, 'icon-maskable-512.png'),
  out(fullBleed(0.9), 180, 'apple-touch-icon.png'),
]);
