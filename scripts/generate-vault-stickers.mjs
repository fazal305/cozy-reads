import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const STICKER_DIR = './public/stickers';
await fs.mkdir(STICKER_DIR, { recursive: true });

async function saveSticker(svg, filename) {
  const outPath = path.join(STICKER_DIR, filename);
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(outPath);
  console.log(`✓ Generated ${filename}`);
}

const stickers = [
  // --- RATINGS & BADGES ---
  {
    id: 'five-star',
    name: '5-Star Read',
    category: 'ratings',
    file: 'five-star.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="235" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">★★★★★</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#4A3535" text-anchor="middle">5 STAR READ</text>
    </svg>`
  },
  {
    id: 'four-star',
    name: '4-Star Read',
    category: 'ratings',
    file: 'four-star.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="235" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">★★★★☆</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#4A3535" text-anchor="middle">4 STAR READ</text>
    </svg>`
  },
  {
    id: 'book-hangover',
    name: 'Book Hangover',
    category: 'ratings',
    file: 'book-hangover.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="235" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">💔 📖</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">Book Hangover</text>
    </svg>`
  },
  {
    id: 'dnf-badge',
    name: 'Did Not Finish',
    category: 'ratings',
    file: 'dnf-badge.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <circle cx="256" cy="210" r="70" fill="#E88A8A" opacity="0.15"/>
      <text x="256" y="230" font-family="sans-serif" font-size="64" fill="#E88A8A" text-anchor="middle">🛑</text>
      <text x="256" y="325" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#4A3535" text-anchor="middle">D.N.F.</text>
      <text x="256" y="365" font-family="Georgia, serif" font-size="20" fill="#8E7575" text-anchor="middle">Life is too short</text>
    </svg>`
  },
  {
    id: 'tbr-priority',
    name: 'TBR Priority',
    category: 'ratings',
    file: 'tbr-priority.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">📌 ✨</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#4A3535" text-anchor="middle">Next on TBR</text>
    </svg>`
  },

  // --- TROPES ---
  {
    id: 'enemies-to-lovers',
    name: 'Enemies to Lovers',
    category: 'tropes',
    file: 'enemies-to-lovers.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="26" y="150" width="460" height="212" rx="106" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">⚔️ ♥ ⚔️</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#FFF5F5" text-anchor="middle">Enemies to Lovers</text>
    </svg>`
  },
  {
    id: 'slow-burn',
    name: 'Slow Burn',
    category: 'tropes',
    file: 'slow-burn.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">🕯️ 🔥</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#4A3535" text-anchor="middle">Slow Burn</text>
    </svg>`
  },
  {
    id: 'fake-dating',
    name: 'Fake Dating',
    category: 'tropes',
    file: 'fake-dating.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="225" font-family="sans-serif" font-size="64" fill="#E88A8A" text-anchor="middle">💍 📜</text>
      <text x="256" y="315" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#4A3535" text-anchor="middle">Fake Dating</text>
      <text x="256" y="355" font-family="Georgia, serif" font-size="20" fill="#8E7575" text-anchor="middle">Just for the weekend</text>
    </svg>`
  },
  {
    id: 'forced-proximity',
    name: 'Forced Proximity',
    category: 'tropes',
    file: 'forced-proximity.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">🚪 🛏️</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">Only One Bed</text>
    </svg>`
  },
  {
    id: 'the-chosen-one',
    name: 'The Chosen One',
    category: 'tropes',
    file: 'the-chosen-one.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <polygon points="256,120 276,190 350,190 290,234 312,304 256,260 200,304 222,234 162,190 236,190" fill="#E88A8A"/>
      <text x="256" y="380" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#FFF5F5" text-anchor="middle">The Chosen One</text>
    </svg>`
  },
  {
    id: 'plot-twist',
    name: 'Plot Twist',
    category: 'tropes',
    file: 'plot-twist.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="52" fill="#E88A8A" text-anchor="middle">⚡ 📜</text>
      <text x="256" y="310" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#FFF5F5" text-anchor="middle">Plot Twist!</text>
      <text x="256" y="350" font-family="Georgia, serif" font-size="20" fill="#F4B5B5" text-anchor="middle">Never saw it coming</text>
    </svg>`
  },
  {
    id: 'morally-grey',
    name: 'Morally Grey',
    category: 'tropes',
    file: 'morally-grey.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="225" font-family="sans-serif" font-size="60" fill="#E88A8A" text-anchor="middle">🗡️ 🖤</text>
      <text x="256" y="315" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#FFF5F5" text-anchor="middle">Morally Grey</text>
      <text x="256" y="355" font-family="Georgia, serif" font-size="20" fill="#F4B5B5" text-anchor="middle">My favorite villain</text>
    </svg>`
  },

  // --- COZY & READING DOODLES ---
  {
    id: 'currently-reading',
    name: 'Currently Reading',
    category: 'cozy',
    file: 'currently-reading.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="150" width="440" height="212" rx="106" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <circle cx="120" cy="256" r="54" fill="#E88A8A"/>
      <path d="M120 236 C120 236 100 216 100 248 C100 268 120 280 120 280 C120 280 140 268 140 248 C140 216 120 236 120 236Z" fill="#FFFFFF"/>
      <text x="195" y="272" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#4A3535">Currently Reading</text>
    </svg>`
  },
  {
    id: 'cozy-teacup',
    name: 'Tea & Books',
    category: 'cozy',
    file: 'cozy-teacup.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <ellipse cx="256" cy="380" rx="140" ry="24" fill="#F4B5B5" opacity="0.6"/>
      <path d="M140 220 L330 220 C330 330 290 360 235 360 C180 360 140 330 140 220 Z" fill="#FFFFFF" stroke="#E88A8A" stroke-width="16"/>
      <path d="M330 240 C380 240 380 320 320 320" fill="none" stroke="#E88A8A" stroke-width="16" stroke-linecap="round"/>
      <path d="M210 180 C210 150 225 150 225 120" fill="none" stroke="#F4B5B5" stroke-width="10" stroke-linecap="round"/>
      <path d="M245 180 C245 150 260 150 260 120" fill="none" stroke="#F4B5B5" stroke-width="10" stroke-linecap="round"/>
      <text x="256" y="440" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#4A3535" text-anchor="middle">Tea &amp; Books</text>
    </svg>`
  },
  {
    id: 'book-stack',
    name: 'One More Chapter',
    category: 'cozy',
    file: 'book-stack.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <rect x="136" y="310" width="240" height="45" rx="8" fill="#F4B5B5" stroke="#4A3535" stroke-width="8"/>
      <rect x="156" y="255" width="200" height="45" rx="8" fill="#FFFFFF" stroke="#E88A8A" stroke-width="8"/>
      <rect x="176" y="200" width="160" height="45" rx="8" fill="#E88A8A" stroke="#4A3535" stroke-width="8"/>
      <path d="M256 120 C256 120 230 90 230 130 C230 155 256 170 256 170 C256 170 282 155 282 130 C282 90 256 120 256 120Z" fill="#E88A8A"/>
      <text x="256" y="415" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">One More Chapter</text>
    </svg>`
  },
  {
    id: 'sakura-flower',
    name: 'Cozy Moments',
    category: 'cozy',
    file: 'sakura-flower.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <g fill="#F4B5B5" stroke="#E88A8A" stroke-width="8">
        <circle cx="256" cy="180" r="48"/>
        <circle cx="328" cy="232" r="48"/>
        <circle cx="300" cy="320" r="48"/>
        <circle cx="212" cy="320" r="48"/>
        <circle cx="184" cy="232" r="48"/>
      </g>
      <circle cx="256" cy="256" r="32" fill="#E88A8A"/>
      <text x="256" y="420" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">Cozy Moments</text>
    </svg>`
  },
  {
    id: 'reading-candle',
    name: 'Late Night Read',
    category: 'cozy',
    file: 'reading-candle.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <rect x="206" y="240" width="100" height="130" rx="12" fill="#FFFFFF" stroke="#E88A8A" stroke-width="10"/>
      <path d="M256 160 C256 160 230 200 230 220 C230 235 242 245 256 245 C270 245 282 235 282 220 C282 200 256 160 256 160 Z" fill="#E88A8A"/>
      <circle cx="256" cy="220" r="12" fill="#FFF5F5"/>
      <text x="256" y="425" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#4A3535" text-anchor="middle">Late Night Reading</text>
    </svg>`
  }
];

for (const s of stickers) {
  await saveSticker(s.svg, s.file);
}

// Generate data file
const dataFileContent = `export const STICKERS = ${JSON.stringify(
  stickers.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    src: '/stickers/' + s.file,
    filename: s.file
  })),
  null,
  2
)};\n`;

await fs.writeFile('./src/data/stickers.js', dataFileContent);
console.log('✓ src/data/stickers.js generated successfully');
