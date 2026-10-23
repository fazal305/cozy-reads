import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = './sample-assets';
const COZY_DIR = path.join(OUT_DIR, 'cozy-stickers');
const FANTASY_DIR = path.join(OUT_DIR, 'fantasy-stickers');

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(COZY_DIR, { recursive: true });
await fs.mkdir(FANTASY_DIR, { recursive: true });

// --- Color Constants ---
const cBg = rgb(1, 0.961, 0.961);       // #FFF5F5
const cCard = rgb(1, 1, 1);             // #FFFFFF
const cPrimary = rgb(0.957, 0.71, 0.71); // #F4B5B5
const cAccent = rgb(0.91, 0.541, 0.541); // #E88A8A
const cText = rgb(0.29, 0.208, 0.208);   // #4A3535
const cMuted = rgb(0.557, 0.459, 0.459); // #8E7575

// 1. GENERATE 2026-reading-planner.pdf
async function generatePdf() {
  const doc = await PDFDocument.create();
  const fontTitle = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontBody = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Helper: Draw common header & background
  function initPage(title, subtitle) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
      color: cBg,
    });

    // Decorative border
    page.drawRectangle({
      x: 24,
      y: 24,
      width: 547.28,
      height: 793.89,
      borderColor: cPrimary,
      borderWidth: 1.5,
      color: cCard,
    });

    // Header title
    page.drawText(title, {
      x: 44,
      y: 775,
      size: 26,
      font: fontTitle,
      color: cText,
    });

    page.drawText(subtitle, {
      x: 44,
      y: 755,
      size: 11,
      font: fontBody,
      color: cMuted,
    });

    page.drawLine({
      start: { x: 44, y: 742 },
      end: { x: 551, y: 742 },
      color: cPrimary,
      thickness: 1,
    });

    return page;
  }

  // --- PAGE 1: 2026 Reading Challenge ---
  const page1 = initPage('2026 Reading Challenge', 'Track your annual reading goals & completed books');

  // Goal Box
  page1.drawRectangle({
    x: 44,
    y: 670,
    width: 240,
    height: 52,
    borderColor: cPrimary,
    borderWidth: 1,
    color: cBg,
  });
  page1.drawText('ANNUAL GOAL:', { x: 56, y: 702, size: 9, font: fontBold, color: cAccent });
  page1.drawText('_______ / 24 Books', { x: 56, y: 682, size: 14, font: fontBold, color: cText });

  page1.drawRectangle({
    x: 311,
    y: 670,
    width: 240,
    height: 52,
    borderColor: cPrimary,
    borderWidth: 1,
    color: cBg,
  });
  page1.drawText('FAVOURITE GENRE:', { x: 323, y: 702, size: 9, font: fontBold, color: cAccent });
  page1.drawText('________________________', { x: 323, y: 682, size: 12, font: fontBody, color: cMuted });

  // Books Grid (24 book slots)
  page1.drawText('BOOK LOG', { x: 44, y: 642, size: 12, font: fontBold, color: cText });

  const rows = 12;
  const colW = 245;
  const startY = 620;
  const rowH = 43;

  for (let i = 0; i < 24; i++) {
    const col = i < 12 ? 0 : 1;
    const row = i % 12;
    const x = col === 0 ? 44 : 306;
    const y = startY - (row * rowH);

    page1.drawRectangle({
      x,
      y,
      width: colW,
      height: 38,
      borderColor: cPrimary,
      borderWidth: 0.8,
      color: cCard,
    });

    // Number tag
    page1.drawRectangle({
      x: x + 1,
      y: y + 1,
      width: 26,
      height: 36,
      color: cBg,
    });
    page1.drawText(`${i + 1}`, {
      x: i < 9 ? x + 9 : x + 6,
      y: y + 14,
      size: 11,
      font: fontBold,
      color: cAccent,
    });

    page1.drawText('Title: ___________________________', {
      x: x + 34,
      y: y + 23,
      size: 8.5,
      font: fontBody,
      color: cText,
    });
    page1.drawText('Author: _________________ Rating: [ ] [ ] [ ] [ ] [ ]', {
      x: x + 34,
      y: y + 9,
      size: 7.5,
      font: fontBody,
      color: cMuted,
    });
  }

  // --- PAGE 2: In-Depth Book Review Journal ---
  const page2 = initPage('Reading Journal & Review', 'Detailed notes, favorite quotes & review');

  // Book Details Box
  page2.drawRectangle({
    x: 44,
    y: 570,
    width: 507,
    height: 150,
    borderColor: cPrimary,
    borderWidth: 1,
    color: cBg,
  });

  page2.drawText('BOOK DETAILS', { x: 56, y: 698, size: 10, font: fontBold, color: cAccent });
  page2.drawText('Title: _____________________________________________   Author: ___________________________', { x: 56, y: 675, size: 9, font: fontBody, color: cText });
  page2.drawText('Genre: ________________________   Tropes: ___________________________________________', { x: 56, y: 650, size: 9, font: fontBody, color: cText });
  page2.drawText('Date Started: ____ / ____ / 2026      Date Finished: ____ / ____ / 2026', { x: 56, y: 625, size: 9, font: fontBody, color: cText });
  page2.drawText('Format:  [ ] Physical   [ ] E-Book   [ ] Audiobook       Pacing:  [ ] Slow   [ ] Medium   [ ] Fast', { x: 56, y: 600, size: 9, font: fontBody, color: cText });
  page2.drawText('Overall Rating:  [ ] [ ] [ ] [ ] [ ]  (1 to 5 Stars)', { x: 56, y: 578, size: 9, font: fontBold, color: cAccent });

  // Favorite Quotes
  page2.drawText('MEMORABLE QUOTES', { x: 44, y: 545, size: 11, font: fontBold, color: cText });
  page2.drawRectangle({
    x: 44,
    y: 395,
    width: 507,
    height: 135,
    borderColor: cPrimary,
    borderWidth: 0.8,
    color: cCard,
  });
  for (let l = 0; l < 4; l++) {
    page2.drawLine({
      start: { x: 56, y: 500 - (l * 28) },
      end: { x: 539, y: 500 - (l * 28) },
      color: cPrimary,
      thickness: 0.5,
    });
  }

  // Thoughts & Reflections
  page2.drawText('THOUGHTS & REFLECTIONS', { x: 44, y: 370, size: 11, font: fontBold, color: cText });
  page2.drawRectangle({
    x: 44,
    y: 60,
    width: 507,
    height: 295,
    borderColor: cPrimary,
    borderWidth: 0.8,
    color: cCard,
  });
  for (let l = 0; l < 9; l++) {
    page2.drawLine({
      start: { x: 56, y: 325 - (l * 28) },
      end: { x: 539, y: 325 - (l * 28) },
      color: cPrimary,
      thickness: 0.5,
    });
  }

  // --- PAGE 3: Monthly Overview & TBR ---
  const page3 = initPage('Monthly Tracker & TBR', 'Monthly book milestones and To-Be-Read wishlist');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mBoxW = 120;
  const mBoxH = 55;

  page3.drawText('MONTHLY HIGHLIGHTS', { x: 44, y: 720, size: 11, font: fontBold, color: cText });

  for (let m = 0; m < 12; m++) {
    const col = m % 4;
    const row = Math.floor(m / 4);
    const x = 44 + (col * (mBoxW + 9));
    const y = 645 - (row * (mBoxH + 9));

    page3.drawRectangle({
      x,
      y,
      width: mBoxW,
      height: mBoxH,
      borderColor: cPrimary,
      borderWidth: 0.8,
      color: cBg,
    });
    page3.drawText(months[m], { x: x + 8, y: y + 38, size: 9, font: fontBold, color: cAccent });
    page3.drawText('Books read: ___', { x: x + 8, y: y + 22, size: 8, font: fontBody, color: cText });
    page3.drawText('Top pick: _______', { x: x + 8, y: y + 8, size: 8, font: fontBody, color: cMuted });
  }

  // TBR Section
  page3.drawText('TO-BE-READ WISHLIST', { x: 44, y: 420, size: 11, font: fontBold, color: cText });
  page3.drawRectangle({
    x: 44,
    y: 60,
    width: 507,
    height: 345,
    borderColor: cPrimary,
    borderWidth: 0.8,
    color: cCard,
  });

  for (let l = 0; l < 11; l++) {
    const y = 375 - (l * 28);
    page3.drawRectangle({
      x: 56,
      y: y - 2,
      width: 14,
      height: 14,
      borderColor: cPrimary,
      borderWidth: 1,
      color: cBg,
    });
    page3.drawLine({
      start: { x: 80, y: y + 5 },
      end: { x: 539, y: y + 5 },
      color: cPrimary,
      thickness: 0.6,
    });
  }

  const pdfBytes = await doc.save();
  await fs.writeFile(path.join(OUT_DIR, '2026-reading-planner.pdf'), pdfBytes);
  console.log('✓ 2026-reading-planner.pdf created successfully');
}

// 2. GENERATE DIGITAL STICKERS (SVG -> PNG via sharp)
async function generateSticker(svg, outPath) {
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(outPath);
}

// Cozy sticker SVGs
const cozyStickers = [
  {
    name: 'currently-reading.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="160" width="440" height="192" rx="96" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <circle cx="120" cy="256" r="54" fill="#E88A8A"/>
      <path d="M120 236 C120 236 100 216 100 248 C100 268 120 280 120 280 C120 280 140 268 140 248 C140 216 120 236 120 236Z" fill="#FFFFFF"/>
      <text x="195" y="272" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#4A3535">Currently Reading</text>
    </svg>`
  },
  {
    name: 'five-stars.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="26" y="170" width="460" height="172" rx="86" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="240" font-family="sans-serif" font-size="44" fill="#E88A8A" text-anchor="middle">★★★★★</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">5 STAR READ</text>
    </svg>`
  },
  {
    name: 'cozy-teacup.png',
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
    name: 'book-stack.png',
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
    name: 'book-hangover.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="160" width="440" height="192" rx="96" fill="#FFF5F5" stroke="#F4B5B5" stroke-width="14"/>
      <text x="256" y="246" font-family="sans-serif" font-size="38" fill="#E88A8A" text-anchor="middle">💔 📖</text>
      <text x="256" y="300" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#4A3535" text-anchor="middle">Book Hangover</text>
    </svg>`
  },
  {
    name: 'sakura-flower.png',
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
  }
];

// Fantasy sticker SVGs
const fantasyStickers = [
  {
    name: 'enemies-to-lovers.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="26" y="160" width="460" height="192" rx="96" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="235" font-family="sans-serif" font-size="40" fill="#E88A8A" text-anchor="middle">⚔️ ♥ ⚔️</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#FFF5F5" text-anchor="middle">Enemies to Lovers</text>
    </svg>`
  },
  {
    name: 'chosen-one.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <polygon points="256,120 276,190 350,190 290,234 312,304 256,260 200,304 222,234 162,190 236,190" fill="#E88A8A"/>
      <text x="256" y="380" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#FFF5F5" text-anchor="middle">The Chosen One</text>
    </svg>`
  },
  {
    name: 'magic-potion.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#E88A8A" stroke-width="14"/>
      <rect x="236" y="140" width="40" height="30" rx="4" fill="#4A3535"/>
      <path d="M236 170 L210 240 C170 300 200 370 256 370 C312 370 342 300 302 240 L276 170 Z" fill="#2E2038" stroke="#E88A8A" stroke-width="10"/>
      <circle cx="256" cy="300" r="24" fill="#E88A8A"/>
      <text x="256" y="425" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#4A3535" text-anchor="middle">Trope Potion</text>
    </svg>`
  },
  {
    name: 'slow-burn.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect x="36" y="160" width="440" height="192" rx="96" fill="#FFF5F5" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="235" font-family="sans-serif" font-size="40" fill="#E88A8A" text-anchor="middle">🕯️ ✨</text>
      <text x="256" y="295" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#4A3535" text-anchor="middle">Slow Burn</text>
    </svg>`
  },
  {
    name: 'plot-twist.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#2E2038" stroke="#E88A8A" stroke-width="14"/>
      <text x="256" y="230" font-family="sans-serif" font-size="52" fill="#E88A8A" text-anchor="middle">⚡ 📜</text>
      <text x="256" y="310" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#FFF5F5" text-anchor="middle">Plot Twist!</text>
      <text x="256" y="350" font-family="Georgia, serif" font-size="20" fill="#F4B5B5" text-anchor="middle">Never saw it coming</text>
    </svg>`
  },
  {
    name: 'fantasy-dagger.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="210" fill="#FFF5F5" stroke="#2E2038" stroke-width="14"/>
      <path d="M256 120 L275 260 L256 320 L237 260 Z" fill="#2E2038" stroke="#E88A8A" stroke-width="8"/>
      <rect x="220" y="320" width="72" height="16" rx="4" fill="#E88A8A"/>
      <rect x="248" y="336" width="16" height="40" fill="#4A3535"/>
      <circle cx="256" cy="384" r="10" fill="#E88A8A"/>
      <text x="256" y="430" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="#4A3535" text-anchor="middle">Knife to Throat</text>
    </svg>`
  }
];

async function generateAllStickers() {
  for (const s of cozyStickers) {
    await generateSticker(s.svg, path.join(COZY_DIR, s.name));
  }
  console.log(`✓ Generated ${cozyStickers.length} cozy stickers`);

  for (const s of fantasyStickers) {
    await generateSticker(s.svg, path.join(FANTASY_DIR, s.name));
  }
  console.log(`✓ Generated ${fantasyStickers.length} fantasy stickers`);
}

// 3. ZIP STICKER PACKS
function zipPacks() {
  const cozyZip = path.resolve(OUT_DIR, 'cozy-sticker-pack.zip');
  const fantasyZip = path.resolve(OUT_DIR, 'fantasy-sticker-pack.zip');

  // Use PowerShell Compress-Archive
  execSync(`powershell -Command "Compress-Archive -Path '${COZY_DIR}/*' -DestinationPath '${cozyZip}' -Force"`);
  console.log('✓ cozy-sticker-pack.zip created');

  execSync(`powershell -Command "Compress-Archive -Path '${FANTASY_DIR}/*' -DestinationPath '${fantasyZip}' -Force"`);
  console.log('✓ fantasy-sticker-pack.zip created');
}

await generatePdf();
await generateAllStickers();
zipPacks();

console.log('\\nAll assets successfully generated in sample-assets/!');
