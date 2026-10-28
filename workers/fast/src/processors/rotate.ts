import sharp from 'sharp';
import { RotateOptions } from '@imagelabs/shared';

export async function processRotate(
  inputBuffer: Buffer,
  options: RotateOptions = { angle: 0, autoOrient: true },
): Promise<{ buffer: Buffer; format: string }> {
  let pipeline = sharp(inputBuffer);
  const metadata = await pipeline.metadata();

  if (!metadata.format) {
    throw new Error('Unable to read image metadata for rotation');
  }

  // 1. Auto-orient based on EXIF metadata if enabled
  if (options.autoOrient) {
    pipeline = pipeline.rotate();
  }

  // 2. Rotate by specific angle
  const angle = options.angle ?? 0;
  if (angle % 360 !== 0) {
    // For non-orthogonal angles, use transparent background for alpha-supporting formats,
    // or white background for formats like jpeg
    const hasAlpha = metadata.hasAlpha || metadata.format === 'png' || metadata.format === 'webp';
    pipeline = pipeline.rotate(angle, {
      background: hasAlpha ? '#00000000' : '#ffffff',
    });
  }

  const buffer = await pipeline.toBuffer();
  return { buffer, format: metadata.format };
}
