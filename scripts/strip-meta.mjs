import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const publicDir = './public';
const files = (await readdir(publicDir)).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

for (const file of files) {
  const src = path.join(publicDir, file);
  const tmp = src + '.tmp';

  const img = sharp(src);
  const meta = await img.metadata();

  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .toFormat(meta.format, { quality: 92 })
    .toFile(tmp);

  // overwrite original with cleaned file
  const { rename } = await import('fs/promises');
  await rename(tmp, src);

  console.log(`stripped: ${file}`);
}
