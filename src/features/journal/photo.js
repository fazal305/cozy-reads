const MAX_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1600;
const QUALITY = 0.82;

export class PhotoError extends Error {}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to the image element
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new PhotoError('That file could not be read as a photo. Try a JPG, PNG or WebP image.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

// Checks, downsizes and re-encodes a photo. Drawing it to a canvas drops EXIF and GPS data.
export async function preparePhoto(file) {
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new PhotoError('That file is not a photo. Choose a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_BYTES) throw new PhotoError('That photo is larger than 15 MB. Choose a smaller one.');

  const source = await decode(file);
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();

  let blob = await encode(canvas, 'image/webp');
  if (!blob || blob.type !== 'image/webp') {
    // no WebP support: JPEG has no alpha, so paint white underneath
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await encode(canvas, 'image/jpeg');
  }
  if (!blob) throw new PhotoError('That photo could not be prepared. Try another one.');
  return { blob, ext: blob.type === 'image/webp' ? 'webp' : 'jpg', aspect: canvas.width / canvas.height };
}
