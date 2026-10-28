import sharp from 'sharp';
import { GifWriter } from 'omggif';

export interface GifAssemblyOptions {
  delayMs?: number;
  loop?: number; // 0 = infinite
}

export async function assembleAnimatedGif(
  frameBuffers: Buffer[],
  options: GifAssemblyOptions = {},
): Promise<Buffer> {
  if (frameBuffers.length === 0) {
    throw new Error('At least one image frame is required to create a GIF');
  }

  const delayInHundredthsOfSeconds = Math.max(1, Math.round((options.delayMs ?? 500) / 10));
  const loopCount = options.loop ?? 0;

  // 1. Determine common target canvas dimensions from first frame
  const firstFrameMeta = await sharp(frameBuffers[0]).metadata();
  const width = Math.min(firstFrameMeta.width || 800, 1920);
  const height = Math.min(firstFrameMeta.height || 600, 1080);

  // Allocate buffer for GIF stream
  const maxGifBufferSize = width * height * frameBuffers.length * 2 + 1024;
  const gifBuffer = Buffer.alloc(maxGifBufferSize);
  const gifWriter = new GifWriter(gifBuffer, width, height, { loop: loopCount });

  // 2. Normalize and encode each frame
  for (const buffer of frameBuffers) {
    // Resize to common bounds and extract raw RGBA pixel data
    const rawRgba = await sharp(buffer)
      .rotate()
      .resize(width, height, { fit: 'contain', background: '#00000000' })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Quantize 32-bit RGBA pixels into indexed 256-color palette
    const { palette, indexedPixels } = quantizeRgbaToPalette(rawRgba, width, height);

    gifWriter.addFrame(0, 0, width, height, indexedPixels, {
      palette,
      delay: delayInHundredthsOfSeconds,
      disposal: 2, // Restore to background
    });
  }

  const finalLength = gifWriter.end();
  return gifBuffer.subarray(0, finalLength);
}

function quantizeRgbaToPalette(
  rgbaBuffer: Buffer,
  width: number,
  height: number,
): { palette: number[]; indexedPixels: number[] } {
  const numPixels = width * height;
  const indexedPixels = new Array<number>(numPixels);

  // Simple, deterministic 216-color web-safe palette + grayscale range + transparent
  const palette: number[] = [];
  const colorMap = new Map<number, number>();

  // Reserve index 0 for transparent
  palette.push(0x000000);
  colorMap.set(0, 0);

  // Generate web-safe RGB cubes
  const steps = [0, 51, 102, 153, 204, 255];
  for (const r of steps) {
    for (const g of steps) {
      for (const b of steps) {
        const rgb = (r << 16) | (g << 8) | b;
        if (!colorMap.has(rgb) && palette.length < 256) {
          colorMap.set(rgb, palette.length);
          palette.push(rgb);
        }
      }
    }
  }

  // Fill remaining slots with grayscale
  for (let gray = 10; gray < 250 && palette.length < 256; gray += 15) {
    const rgb = (gray << 16) | (gray << 8) | gray;
    if (!colorMap.has(rgb)) {
      colorMap.set(rgb, palette.length);
      palette.push(rgb);
    }
  }

  // Map each pixel to nearest palette index
  for (let i = 0; i < numPixels; i++) {
    const offset = i * 4;
    const a = rgbaBuffer[offset + 3];

    if (a < 128) {
      indexedPixels[i] = 0; // Transparent
      continue;
    }

    const r = rgbaBuffer[offset];
    const g = rgbaBuffer[offset + 1];
    const b = rgbaBuffer[offset + 2];

    // Quantize to nearest step (0, 51, 102, 153, 204, 255)
    const qr = Math.round(r / 51) * 51;
    const qg = Math.round(g / 51) * 51;
    const qb = Math.round(b / 51) * 51;

    const targetRgb = (qr << 16) | (qg << 8) | qb;
    const index = colorMap.get(targetRgb) ?? 0;
    indexedPixels[i] = index;
  }

  return { palette, indexedPixels };
}
