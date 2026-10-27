export type ToolId =
  | 'compress'
  | 'resize'
  | 'convert-to-jpg'
  | 'convert-from-jpg'
  | 'convert-image'
  | 'crop'
  | 'rotate'
  | 'watermark'
  | 'image-editor'
  | 'meme-generator'
  | 'html-to-image'
  | 'upscale'
  | 'remove-background'
  | 'blur-face';

export type ToolCategory = 'optimize' | 'convert' | 'edit' | 'ai';

export interface ToolMeta {
  id: ToolId;
  label: string;
  description: string;
  category: ToolCategory;
  acceptsBatch: boolean;
  acceptsMultipleInputs: boolean;
  requiresAI: boolean;
  icon: string;
}

export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; order: number }> = {
  optimize: { label: 'Optimization', order: 1 },
  convert: { label: 'Conversion', order: 2 },
  edit: { label: 'Basic Editing', order: 3 },
  ai: { label: 'Advanced & AI', order: 4 },
};

export const TOOLS: ToolMeta[] = [
  {
    id: 'compress',
    label: 'ImageLabs Compress',
    description: 'Compress images with the best quality and compression ratio.',
    category: 'optimize',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'Minimize2',
  },
  {
    id: 'resize',
    label: 'ImageLabs Resize',
    description: 'Resize images by pixel dimensions or percentages.',
    category: 'optimize',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'Maximize2',
  },
  {
    id: 'convert-to-jpg',
    label: 'ImageLabs Convert to JPG',
    description: 'Convert PNG, GIF, TIF, RAW, WebP, or HEIC to JPG format.',
    category: 'convert',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'FileImage',
  },
  {
    id: 'convert-from-jpg',
    label: 'ImageLabs Convert from JPG',
    description: 'Convert JPG images to PNG or animated GIF format.',
    category: 'convert',
    acceptsBatch: true,
    acceptsMultipleInputs: true,
    requiresAI: false,
    icon: 'FileImage',
  },
  {
    id: 'convert-image',
    label: 'ImageLabs Convert Image',
    description: 'Convert images to WebP, AVIF, PNG, and other modern formats.',
    category: 'convert',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'FileImage',
  },
  {
    id: 'crop',
    label: 'ImageLabs Crop',
    description: 'Crop images by selecting pixels or using predefined aspect ratios.',
    category: 'edit',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'Crop',
  },
  {
    id: 'rotate',
    label: 'ImageLabs Rotate',
    description: 'Rotate images clockwise, counter-clockwise, or by custom angles.',
    category: 'edit',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'RotateCw',
  },
  {
    id: 'watermark',
    label: 'ImageLabs Watermark',
    description: 'Stamp images with custom text or image watermarks.',
    category: 'edit',
    acceptsBatch: true,
    acceptsMultipleInputs: true,
    requiresAI: false,
    icon: 'Stamp',
  },
  {
    id: 'image-editor',
    label: 'ImageLabs Image Editor',
    description: 'Full canvas editor to draw, annotate, and apply filters.',
    category: 'edit',
    acceptsBatch: false,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'PenTool',
  },
  {
    id: 'meme-generator',
    label: 'ImageLabs Meme Generator',
    description: 'Add top and bottom caption text to create custom memes.',
    category: 'edit',
    acceptsBatch: false,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'Smile',
  },
  {
    id: 'html-to-image',
    label: 'ImageLabs HTML to Image',
    description: 'Render and capture webpage screenshots or HTML snippets.',
    category: 'ai',
    acceptsBatch: false,
    acceptsMultipleInputs: false,
    requiresAI: false,
    icon: 'Code2',
  },
  {
    id: 'upscale',
    label: 'ImageLabs Upscale Image',
    description: 'Increase image resolution by 2x or 4x using AI super-resolution.',
    category: 'ai',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: true,
    icon: 'Sparkles',
  },
  {
    id: 'remove-background',
    label: 'ImageLabs Remove Background',
    description: 'Automatically remove the background from images using neural nets.',
    category: 'ai',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: true,
    icon: 'Scissors',
  },
  {
    id: 'blur-face',
    label: 'ImageLabs Blur Face',
    description: 'Detect faces and blur them to preserve personal privacy.',
    category: 'ai',
    acceptsBatch: true,
    acceptsMultipleInputs: false,
    requiresAI: true,
    icon: 'EyeOff',
  },
];
