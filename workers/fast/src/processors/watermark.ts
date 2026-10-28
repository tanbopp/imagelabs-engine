import sharp from 'sharp';
import { WatermarkOptions } from '@imagelabs/shared';
import { downloadS3Buffer } from '../lib/s3';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function processWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions,
): Promise<{ buffer: Buffer; format: string }> {
  const baseImage = sharp(inputBuffer);
  const metadata = await baseImage.metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unable to read image dimensions or format for watermarking');
  }

  const baseWidth = metadata.width;
  const baseHeight = metadata.height;
  const opacity = Math.min(1, Math.max(0, options.opacity ?? 0.7));
  const scale = Math.min(1, Math.max(0.05, options.scale ?? 0.2));

  let watermarkBuffer: Buffer;

  if (options.type === 'text') {
    const rawText = options.text || 'ImageLabs';
    const safeText = escapeXml(rawText);

    // Dynamic sizing based on base image dimensions and scale
    const targetOverlayWidth = Math.round(baseWidth * scale);
    const fontSize = Math.max(16, Math.round(targetOverlayWidth / (safeText.length * 0.65)));
    const svgWidth = Math.max(targetOverlayWidth, Math.round(safeText.length * fontSize * 0.75));
    const svgHeight = Math.round(fontSize * 1.6);

    const svgString = `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: rgba(255, 255, 255, ${opacity});
            stroke: rgba(0, 0, 0, ${opacity * 0.7});
            stroke-width: 1.5px;
            font-size: ${fontSize}px;
            font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
            font-weight: 700;
            dominant-baseline: middle;
            text-anchor: middle;
          }
        </style>
        <text x="50%" y="50%" class="watermark-text">${safeText}</text>
      </svg>
    `;

    watermarkBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();
  } else {
    // Image watermark
    if (!options.imageKey) {
      throw new Error('imageKey is required when watermark type is image');
    }
    const rawWatermark = await downloadS3Buffer(options.imageKey);
    const targetWidth = Math.max(20, Math.round(baseWidth * scale));

    watermarkBuffer = await sharp(rawWatermark)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .ensureAlpha(opacity)
      .toBuffer();
  }

  const wmMetadata = await sharp(watermarkBuffer).metadata();
  const wmWidth = wmMetadata.width || 100;
  const wmHeight = wmMetadata.height || 40;

  const composites: sharp.OverlayOptions[] = [];
  const padding = Math.max(12, Math.round(Math.min(baseWidth, baseHeight) * 0.03));

  if (options.tiled) {
    const stepX = wmWidth + padding * 2;
    const stepY = wmHeight + padding * 2;

    for (let x = padding; x < baseWidth; x += stepX) {
      for (let y = padding; y < baseHeight; y += stepY) {
        composites.push({
          input: watermarkBuffer,
          top: y,
          left: x,
          blend: 'over',
        });
      }
    }
  } else {
    let top = padding;
    let left = padding;

    const pos = options.position || 'bottom-right';

    // Horizontal positioning
    if (pos.includes('left')) {
      left = padding;
    } else if (pos.includes('right')) {
      left = Math.max(0, baseWidth - wmWidth - padding);
    } else {
      left = Math.max(0, Math.round((baseWidth - wmWidth) / 2));
    }

    // Vertical positioning
    if (pos.startsWith('top')) {
      top = padding;
    } else if (pos.startsWith('bottom')) {
      top = Math.max(0, baseHeight - wmHeight - padding);
    } else {
      top = Math.max(0, Math.round((baseHeight - wmHeight) / 2));
    }

    composites.push({
      input: watermarkBuffer,
      top,
      left,
      blend: 'over',
    });
  }

  const buffer = await sharp(inputBuffer).composite(composites).toBuffer();
  return { buffer, format: metadata.format };
}
