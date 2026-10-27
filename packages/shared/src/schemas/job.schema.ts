import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ToolIdEnum = z.enum([
  'compress',
  'resize',
  'convert-to-jpg',
  'convert-from-jpg',
  'convert-image',
  'crop',
  'rotate',
  'watermark',
  'image-editor',
  'meme-generator',
  'html-to-image',
  'upscale',
  'remove-background',
  'blur-face',
]);

export const JobStatusEnum = z.enum(['queued', 'processing', 'completed', 'failed']);

export const ErrorCodeEnum = z.enum([
  'INVALID_INPUT',
  'NO_SESSION',
  'QUOTA_EXCEEDED',
  'JOB_NOT_FOUND',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_TYPE',
  'RATE_LIMITED',
  'INTERNAL',
]);

export const JobInputSchema = z.object({
  s3Key: z.string().min(1).openapi({ example: 'inputs/123e4567-e89b-12d3-a456-426614174000/photo.jpg' }),
  filename: z.string().min(1).openapi({ example: 'photo.jpg' }),
  mimeType: z.string().min(1).openapi({ example: 'image/jpeg' }),
  sizeBytes: z.number().int().nonnegative().openapi({ example: 1048576 }),
});

export const JobOutputSchema = z.object({
  s3Key: z.string().min(1).openapi({ example: 'outputs/123e4567-e89b-12d3-a456-426614174000/photo-compressed.jpg' }),
  filename: z.string().min(1).openapi({ example: 'photo-compressed.jpg' }),
  mimeType: z.string().min(1).openapi({ example: 'image/jpeg' }),
  sizeBytes: z.number().int().nonnegative().openapi({ example: 524288 }),
});

export const JobCreateRequestSchema = z.object({
  tool: ToolIdEnum.openapi({ example: 'compress' }),
  inputs: z.array(JobInputSchema).min(1).max(50),
  options: z.record(z.unknown()).default({}).openapi({ example: { quality: 'auto' } }),
});

export type JobCreateRequest = z.infer<typeof JobCreateRequestSchema>;

export const JobErrorSchema = z.object({
  code: ErrorCodeEnum.openapi({ example: 'INVALID_INPUT' }),
  message: z.string().openapi({ example: 'The input image could not be processed.' }),
});

export const JobResponseSchema = z.object({
  id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  status: JobStatusEnum.openapi({ example: 'completed' }),
  tool: ToolIdEnum.openapi({ example: 'compress' }),
  inputs: z.array(JobInputSchema),
  outputs: z.array(JobOutputSchema),
  progress: z.number().min(0).max(100).openapi({ example: 100 }),
  error: JobErrorSchema.nullable().openapi({ example: null }),
  session: z.string().openapi({ example: 'sess_9f83ab20' }),
  createdAt: z.string().datetime().openapi({ example: '2026-10-27T10:00:00Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2026-10-27T10:00:05Z' }),
});

export type JobResponse = z.infer<typeof JobResponseSchema>;

export const JobDownloadFileSchema = z.object({
  filename: z.string().openapi({ example: 'photo-compressed.jpg' }),
  url: z.string().url().openapi({ example: 'https://imagelabs-temp.s3.amazonaws.com/outputs/uuid/photo-compressed.jpg?...' }),
  expiresAt: z.string().datetime().openapi({ example: '2026-10-27T11:00:00Z' }),
});

export const JobDownloadResponseSchema = z.object({
  files: z.array(JobDownloadFileSchema).openapi({
    example: [
      {
        filename: 'photo-compressed.jpg',
        url: 'https://imagelabs-temp.s3.amazonaws.com/outputs/uuid/photo-compressed.jpg?...',
        expiresAt: '2026-10-27T11:00:00Z',
      },
    ],
  }),
});

export type JobDownloadResponse = z.infer<typeof JobDownloadResponseSchema>;
