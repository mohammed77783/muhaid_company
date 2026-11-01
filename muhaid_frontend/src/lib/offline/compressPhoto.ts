/** The API rejects anything larger with 413. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Under this, an accepted photo is sent untouched. */
const KEEP_BELOW_BYTES = 2 * 1024 * 1024;

/** Tried in order until the result fits: legible for a record, cheap on a weak signal. */
const ATTEMPTS = [
  { maxSide: 2048, quality: 0.8 },
  { maxSide: 1600, quality: 0.7 },
  { maxSide: 1280, quality: 0.6 },
];

async function encode(
  bitmap: ImageBitmap,
  maxSide: number,
  quality: number,
): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

/**
 * Compresses before upload, so the size limit is not the first thing an inspector hears
 * about. A file the browser cannot decode comes back unchanged, for the form to reject
 * with its real size and type.
 */
export async function compressPhoto(file: Blob): Promise<Blob> {
  const accepted = ACCEPTED_TYPES.includes(file.type);
  if (accepted && file.size <= KEEP_BELOW_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  try {
    let result: Blob | null = null;
    for (const { maxSide, quality } of ATTEMPTS) {
      result = await encode(bitmap, maxSide, quality);
      if (result && result.size <= MAX_PHOTO_BYTES) break;
    }
    // Never swap in a larger file, unless the original is a type the API would refuse.
    if (!result || (accepted && result.size >= file.size)) return file;
    return result;
  } finally {
    bitmap.close();
  }
}
