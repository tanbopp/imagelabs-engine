export function isValidImageMagicBytes(buffer: Buffer, expectedMimeType?: string): boolean {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;

  // WebP: RIFF .... WEBP
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)
  const isTiff =
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a);

  // AVIF / HEIC: .... ftyp
  const isFtyp =
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70;

  if (expectedMimeType) {
    switch (expectedMimeType) {
      case 'image/jpeg':
        return isJpeg;
      case 'image/png':
        return isPng;
      case 'image/gif':
        return isGif;
      case 'image/webp':
        return isWebp;
      case 'image/tiff':
        return isTiff;
      case 'image/avif':
      case 'image/heic':
        return isFtyp;
      default:
        break;
    }
  }

  return isJpeg || isPng || isGif || isWebp || isTiff || isFtyp;
}
