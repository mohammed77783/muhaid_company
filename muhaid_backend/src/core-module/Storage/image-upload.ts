import { FileInterceptor } from '@nestjs/platform-express';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// No `dest`/`storage`, so multer keeps the file in memory: the service decides
// where it goes only after the form is validated. Too large -> 413.
export const PhotoInterceptor = FileInterceptor('photo', {
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 20 },
});

export const IMAGE_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export type ImageExt = keyof typeof IMAGE_TYPES;

// Reads the magic bytes; the client-supplied mimetype and filename are never trusted.
export function detectImageType(buf: Buffer): ImageExt | null {
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return 'jpg';
  }
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}
