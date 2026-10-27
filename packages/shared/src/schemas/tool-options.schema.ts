import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CompressOptionsSchema = z.object({
  quality: z.number().int().min(1).max(100).optional().openapi({ example: 80 }),
});

export type CompressOptions = z.infer<typeof CompressOptionsSchema>;

export const ResizeOptionsSchema = z
  .object({
    width: z.number().int().positive().max(16384).optional().openapi({ example: 1920 }),
    height: z.number().int().positive().max(16384).optional().openapi({ example: 1080 }),
    fit: z.enum(['cover', 'contain', 'fill']).default('contain').openapi({ example: 'contain' }),
    withoutEnlargement: z.boolean().default(true).openapi({ example: true }),
  })
  .refine((data) => data.width !== undefined || data.height !== undefined, {
    message: 'At least one dimension (width or height) must be specified',
  });

export type ResizeOptions = z.infer<typeof ResizeOptionsSchema>;
