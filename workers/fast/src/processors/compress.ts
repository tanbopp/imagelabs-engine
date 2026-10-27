import sharp from 'sharp';
import { CompressOptions } from '@imagelabs/shared';

export async function processCompress(
  inputBuffer: Buffer,
  options: CompressOptions = {},
): Promise<{ buffer: Buffer; format: string }> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (!metadata.format) {
    throw new Error('Unable to determine image format for compression');
  }

  let compressedBuffer: Buffer;
  const quality = options.quality ?? 80;

  switch (metadata.format) {
    case 'jpeg':
      compressedBuffer = await sharp(inputBuffer)
        .rotate() // Auto-orient via EXIF
        .jpeg({ mozjpeg: true, quality })
        .toBuffer();
      break;

    case 'png':
      compressedBuffer = await sharp(inputBuffer)
        .png({ compressionLevel: 9, effort: 7, palette: true })
        .toBuffer();
      break;

    case 'webp':
      compressedBuffer = await sharp(inputBuffer)
        .rotate()
        .webp({ quality, effort: 4 })
        .toBuffer();
      break;

    case 'avif':
      compressedBuffer = await sharp(inputBuffer)
        .rotate()
        .avif({ quality: options.quality ?? 65, effort: 4 })
        .toBuffer();
      break;

    default:
      // Fallback: convert to optimized JPEG if format is esoteric (e.g. tiff, raw)
      compressedBuffer = await sharp(inputBuffer)
        .flatten({ background: '#ffffff' })
        .jpeg({ mozjpeg: true, quality })
        .toBuffer();
      break;
  }

  // Size guarantee: If compressed buffer is larger than original, return original
  if (compressedBuffer.length >= inputBuffer.length) {
    return { buffer: inputBuffer, format: metadata.format };
  }

  return { buffer: compressedBuffer, format: metadata.format };
}
