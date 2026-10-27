import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { getS3Client } from '../lib/s3';

export function sanitizeFilename(filename: string): string {
  // Strip path traversal and illegal characters
  return filename
    .replace(/^.*[\\/]/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

export async function createPresignedUploadUrl(
  filename: string,
  mimeType: string,
  sizeBytes: number,
): Promise<{ uploadUrl: string; s3Key: string; expiresAt: string }> {
  const safeName = sanitizeFilename(filename) || 'image.jpg';
  const fileUuid = randomUUID();
  const s3Key = `inputs/${fileUuid}/${safeName}`;
  const s3 = getS3Client();

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: s3Key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  // 15 minutes = 900 seconds TTL
  const expiresInSeconds = 900;
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    uploadUrl,
    s3Key,
    expiresAt,
  };
}
