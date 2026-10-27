import sharp from 'sharp';
import { ResizeOptions } from '@imagelabs/shared';

export async function processResize(
  inputBuffer: Buffer,
  options: ResizeOptions,
): Promise<{ buffer: Buffer; format: string }> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (!metadata.format) {
    throw new Error('Unable to determine image format for resizing');
  }

  const { width, height, fit = 'contain', withoutEnlargement = true } = options;

  const resizedBuffer = await sharp(inputBuffer)
    .rotate() // Auto-orient via EXIF
    .resize({
      width,
      height,
      fit,
      withoutEnlargement,
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent for contain fit on PNG/WebP
    })
    .toBuffer();

  return { buffer: resizedBuffer, format: metadata.format };
}
