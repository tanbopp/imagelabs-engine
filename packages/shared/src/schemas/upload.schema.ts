import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const UploadRequestSchema = z.object({
  filename: z.string().min(1).openapi({ example: 'photo.jpg' }),
  mimeType: z.string().min(1).openapi({ example: 'image/jpeg' }),
  sizeBytes: z.number().int().positive().openapi({ example: 1048576 }),
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;

export const UploadResponseSchema = z.object({
  uploadUrl: z
    .string()
    .url()
    .openapi({ example: 'https://imagelabs-temp.s3.amazonaws.com/inputs/uuid/photo.jpg?AWSAccessKeyId=...' }),
  s3Key: z.string().openapi({ example: 'inputs/123e4567-e89b-12d3-a456-426614174000/photo.jpg' }),
  expiresAt: z.string().datetime().openapi({ example: '2026-10-27T10:15:00Z' }),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;
