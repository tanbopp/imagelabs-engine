import sharp from 'sharp';
import { ConvertFromJpgOptions } from '@imagelabs/shared';
import { assembleAnimatedGif } from '../lib/gif-assembler';

export async function processConvertFromJpg(
  inputBuffers: Buffer[],
  options: ConvertFromJpgOptions,
): Promise<Array<{ buffer: Buffer; format: string; filenameExt: string }>> {
  const { targetFormat, delayMs = 500, loop = 0 } = options;

  // Case A: Animated GIF from multiple or single inputs
  if (targetFormat === 'gif') {
    const gifBuffer = await assembleAnimatedGif(inputBuffers, { delayMs, loop });
    return [
      {
        buffer: gifBuffer,
        format: 'gif',
        filenameExt: 'gif',
      },
    ];
  }

  // Case B: Convert each input JPEG to PNG
  const results = await Promise.all(
    inputBuffers.map(async (buf) => {
      const pngBuffer = await sharp(buf).rotate().png({ compressionLevel: 9 }).toBuffer();
      return {
        buffer: pngBuffer,
        format: 'png',
        filenameExt: 'png',
      };
    }),
  );

  return results;
}
