import sharp from 'sharp';
import { CropOptions } from '@imagelabs/shared';

export async function processCrop(
  inputBuffer: Buffer,
  options: CropOptions,
): Promise<{ buffer: Buffer; format: string }> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unable to read image dimensions or format for crop');
  }

  const origWidth = metadata.width;
  const origHeight = metadata.height;

  // Case 1: Explicit pixel coordinates
  if (
    options.left !== undefined &&
    options.top !== undefined &&
    options.width !== undefined &&
    options.height !== undefined
  ) {
    const left = Math.max(0, Math.min(Math.round(options.left), origWidth - 1));
    const top = Math.max(0, Math.min(Math.round(options.top), origHeight - 1));
    const width = Math.min(Math.round(options.width), origWidth - left);
    const height = Math.min(Math.round(options.height), origHeight - top);

    if (width <= 0 || height <= 0) {
      throw new Error('Invalid crop bounding box dimensions');
    }

    const buffer = await sharp(inputBuffer)
      .extract({ left, top, width, height })
      .toBuffer();

    return { buffer, format: metadata.format };
  }

  // Case 2: Aspect ratio preset (centered cover crop)
  if (options.aspectRatio && options.aspectRatio !== 'free') {
    const [numStr, denStr] = options.aspectRatio.split(':');
    const targetRatio = Number(numStr) / Number(denStr);

    if (isNaN(targetRatio) || targetRatio <= 0) {
      throw new Error(`Invalid aspect ratio: ${options.aspectRatio}`);
    }

    let cropWidth = origWidth;
    let cropHeight = origHeight;

    const currentRatio = origWidth / origHeight;

    if (currentRatio > targetRatio) {
      // Original is wider than target ratio -> crop width
      cropWidth = Math.round(origHeight * targetRatio);
    } else {
      // Original is taller than target ratio -> crop height
      cropHeight = Math.round(origWidth / targetRatio);
    }

    const left = Math.max(0, Math.round((origWidth - cropWidth) / 2));
    const top = Math.max(0, Math.round((origHeight - cropHeight) / 2));

    const buffer = await sharp(inputBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();

    return { buffer, format: metadata.format };
  }

  // Default fallback if no coordinates or aspect ratio specified
  return { buffer: inputBuffer, format: metadata.format };
}
