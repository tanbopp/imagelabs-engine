import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const QuotaSnapshotSchema = z.object({
  jobsUsedToday: z.number().int().nonnegative().openapi({ example: 4 }),
  jobsLimitToday: z.number().int().positive().openapi({ example: 20 }),
  bytesUsedToday: z.number().int().nonnegative().openapi({ example: 52428800 }),
  bytesLimitToday: z.number().int().positive().openapi({ example: 524288000 }),
});

export const QuotaResponseSchema = z.object({
  session: z.string().openapi({ example: 'sess_9f83ab20' }),
  quota: QuotaSnapshotSchema,
  resetsAt: z.string().datetime().openapi({ example: '2026-10-28T00:00:00Z' }),
});

export type QuotaResponse = z.infer<typeof QuotaResponseSchema>;
