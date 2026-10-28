import sharp from 'sharp';
import { ConvertImageOptions } from '@imagelabs/shared';

export async function processConvertImage(
  inputBuffer: Buffer,
  options: ConvertImageOptions,
): Promise<{ buffer: Buffer; format: string }> {
  const { targetFormat, quality = 85 } = options;
  const image = sharp(inputBuffer).rotate();

  let buffer: Buffer;

  switch (targetFormat) {
    case 'jpeg':
      buffer = await image
        .flatten({ background: '#ffffff' })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      break;

    case 'png':
      buffer = await image
        .png({ compressionLevel: 9 })
        .toBuffer();
      break;

    case 'webp':
      buffer = await image
        .webp({ quality, effort: 4 })
        .toBuffer();
      break;

    case 'avif':
      buffer = await image
        .avif({ quality, effort: 4 })
        .toBuffer();
      break;

    case 'tiff':
      buffer = await image
        .tiff({ compression: 'deflate' })
        .toBuffer();
      break;

    default:
      throw new Error(`Unsupported target conversion format: ${targetFormat}`);
  }

  return { buffer, format: targetFormat };
}
