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

// Phase 06: Conversion Schemas
export const ConvertImageOptionsSchema = z.object({
  targetFormat: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff']).default('webp').openapi({ example: 'webp' }),
  quality: z.number().int().min(1).max(100).optional().default(85).openapi({ example: 85 }),
});

export type ConvertImageOptions = z.infer<typeof ConvertImageOptionsSchema>;

export const ConvertFromJpgOptionsSchema = z.object({
  targetFormat: z.enum(['png', 'gif']).default('png').openapi({ example: 'png' }),
  delayMs: z.number().int().min(50).max(5000).default(500).openapi({ example: 500 }),
  loop: z.number().int().min(0).max(100).default(0).openapi({ example: 0 }),
});

export type ConvertFromJpgOptions = z.infer<typeof ConvertFromJpgOptionsSchema>;

// Phase 07: Basic Editing Schemas
export const CropOptionsSchema = z
  .object({
    left: z.number().int().nonnegative().optional().openapi({ example: 100 }),
    top: z.number().int().nonnegative().optional().openapi({ example: 100 }),
    width: z.number().int().positive().optional().openapi({ example: 800 }),
    height: z.number().int().positive().optional().openapi({ example: 600 }),
    aspectRatio: z.enum(['free', '1:1', '4:3', '16:9', '3:2', '9:16']).optional().openapi({ example: '16:9' }),
  })
  .refine(
    (data) => (data.width && data.height) || (data.aspectRatio && data.aspectRatio !== 'free'),
    { message: 'Must specify either explicit coordinates (width/height) or a fixed aspect ratio' },
  );

export type CropOptions = z.infer<typeof CropOptionsSchema>;

export const RotateOptionsSchema = z.object({
  angle: z.number().int().min(0).max(360).default(0).openapi({ example: 90 }),
  autoOrient: z.boolean().default(true).openapi({ example: true }),
});

export type RotateOptions = z.infer<typeof RotateOptionsSchema>;

export const WatermarkOptionsSchema = z.object({
  type: z.enum(['text', 'image']).default('text').openapi({ example: 'text' }),
  text: z.string().max(200).optional().openapi({ example: 'ImageLabs' }),
  imageKey: z.string().optional().openapi({ example: 'inputs/uuid/logo.png' }),
  position: z
    .enum([
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ])
    .default('bottom-right')
    .openapi({ example: 'bottom-right' }),
  opacity: z.number().min(0).max(1).default(0.7).openapi({ example: 0.7 }),
  scale: z.number().min(0.05).max(1.0).default(0.2).openapi({ example: 0.2 }),
  tiled: z.boolean().default(false).openapi({ example: false }),
});

export type WatermarkOptions = z.infer<typeof WatermarkOptionsSchema>;

// Phase 09: AI Tools Schemas
export const UpscaleOptionsSchema = z.object({
  scale: z.enum(['2x', '4x']).default('2x').openapi({ example: '2x' }),
});

export type UpscaleOptions = z.infer<typeof UpscaleOptionsSchema>;

export const RemoveBgOptionsSchema = z.object({
  model: z.enum(['u2net', 'rmbg-1.4']).default('u2net').openapi({ example: 'u2net' }),
});

export type RemoveBgOptions = z.infer<typeof RemoveBgOptionsSchema>;

export const BlurFaceOptionsSchema = z.object({
  blurStrength: z.number().int().min(5).max(100).default(35).openapi({ example: 35 }),
  padding: z.number().min(0).max(0.5).default(0.1).openapi({ example: 0.1 }),
  faces: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    )
    .optional(),
});

export type BlurFaceOptions = z.infer<typeof BlurFaceOptionsSchema>;

// Phase 10: HTML to Image Schema
export const HtmlToImageOptionsSchema = z
  .object({
    sourceType: z.enum(['html', 'url']).default('html').openapi({ example: 'html' }),
    html: z.string().max(500000).optional().openapi({ example: '<h1>Hello ImageLabs</h1>' }),
    url: z.string().url().optional().openapi({ example: 'https://example.com' }),
    format: z.enum(['png', 'jpeg']).default('png').openapi({ example: 'png' }),
    quality: z.number().int().min(1).max(100).default(90).openapi({ example: 90 }),
    viewport: z
      .object({
        width: z.number().int().min(320).max(3840).default(1280),
        height: z.number().int().min(240).max(2160).default(800),
        deviceScaleFactor: z.number().min(1).max(3).default(1),
      })
      .default({ width: 1280, height: 800, deviceScaleFactor: 1 }),
    fullPage: z.boolean().default(false).openapi({ example: false }),
    delayMs: z.number().int().min(0).max(5000).default(500).openapi({ example: 500 }),
  })
  .refine((data) => (data.sourceType === 'html' ? !!data.html : !!data.url), {
    message: 'Must provide html content or a valid url based on sourceType',
  });

export type HtmlToImageOptions = z.infer<typeof HtmlToImageOptionsSchema>;


