import sharp from 'sharp';

export async function processConvertToJpg(
  inputBuffer: Buffer,
): Promise<{ buffer: Buffer; format: string }> {
  // Convert any format (PNG, GIF, WebP, AVIF, TIFF, HEIC) to standard JPEG
  // Alpha channel is flattened over white (#ffffff) to prevent black border artifacts
  const buffer = await sharp(inputBuffer)
    .rotate() // Auto-orient via EXIF
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return { buffer, format: 'jpeg' };
}
