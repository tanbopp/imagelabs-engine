# Phase 07: Basic Image Editing Tools (Crop, Rotate, Watermark)

## 1. Phase Title & Goal
- **Phase Title**: Phase 07 — Basic Image Editing Tools (`crop`, `rotate`, `watermark`).
- **Goal**: Implement high-performance, accessible image editing pipelines for cropping (freeform and aspect ratio presets), rotating (discrete 90° steps and EXIF auto-orientation), and watermarking (text and image overlays) using Sharp and client-side canvas preview utilities.

---

## 2. Context & Dependencies
- **Assumed Completed Foundations**:
  - Phase 0–4: Monorepo workspace, Fastify API, S3 presigned operations, BullMQ queues, and core UI shell.
  - Phase 5: Fast worker foundation, Sharp processor patterns, and batch upload/download infrastructure.

---

## 3. Scope

### In-Scope
- `crop` tool:
  - Single image coordinate cropping (`left`, `top`, `width`, `height`).
  - Batch cropping driven by aspect ratio presets (`1:1`, `4:3`, `16:9`, `3:2`, `9:16`) centered via Sharp's `fit: 'cover'`.
- `rotate` tool:
  - Orthogonal rotation (90°, 180°, 270°) and arbitrary degree angles.
  - EXIF orientation extraction and normalization (`autoOrient`).
  - Batch application across multiple files.
- `watermark` tool:
  - Text-based watermarks rendered dynamically into SVG buffers and composited via Sharp.
  - Image-based watermark overlays positioned by coordinate grid (9 compass points).
  - Configurable opacity, scale, margin padding, and optional repeating grid tiling.
- Interactive frontend previews for crop bounding boxes, rotation transforms, and watermark positioning.

### Out-of-Scope
- Freehand brush drawing, vector shape insertion, or eraser tools (reserved for Phase 08 Canvas Editor).
- Multi-layer non-destructive timeline editing.
- Persistent database storage of watermark presets or user preferences.

---

## 4. Tech Stack
- **Engine**: Node.js + Sharp (libvips native composite and extract operations).
- **Text Rendering**: SVG text templates converted to raster buffers via Sharp.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, `lucide-react`.
- **Canvas / Geometry**: Lightweight client-side canvas/CSS transform overlays for interactive crop and watermark placement.

---

## 5. Files to Create / Modify

### Backend & Worker
- `workers/fast/src/processors/crop.ts`: Extraction and cover-based aspect cropping.
- `workers/fast/src/processors/rotate.ts`: Angle rotation and EXIF orientation normalization.
- `workers/fast/src/processors/watermark.ts`: SVG text generation and Sharp composite processor.

### Shared
- `packages/shared/src/schemas/tool-options.schema.ts`: Add `CropOptions`, `RotateOptions`, and `WatermarkOptions`.
- `packages/shared/src/index.ts`: Re-export editing options.

### Frontend
- `apps/web/src/features/crop/pages/crop-page.tsx`: Crop workspace view.
- `apps/web/src/features/crop/components/crop-canvas-overlay.tsx`: Interactive crop bounding box.
- `apps/web/src/features/rotate/pages/rotate-page.tsx`: Rotation workspace view.
- `apps/web/src/features/rotate/components/rotate-controls.tsx`: Angle buttons, slider, and auto-orient toggle.
- `apps/web/src/features/watermark/pages/watermark-page.tsx`: Watermark workspace view.
- `apps/web/src/features/watermark/components/watermark-position-grid.tsx`: 3x3 compass alignment selector.

---

## 6. Detailed Requirements

### 6.1 Crop
- **Option Schema**:
  ```typescript
  export const CropOptionsSchema = z.object({
    left: z.number().int().nonnegative().optional(),
    top: z.number().int().nonnegative().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    aspectRatio: z.enum(['free', '1:1', '4:3', '16:9', '3:2', '9:16']).optional(),
  }).refine(
    (data) => (data.width && data.height) || (data.aspectRatio && data.aspectRatio !== 'free'),
    { message: 'Must specify either explicit coordinates (width/height) or a fixed aspect ratio' }
  );
  ```
- **Processing Logic**:
  - Explicit coordinates: Execute `sharp(input).extract({ left, top, width, height })`.
  - Batch with aspect ratio: Parse ratio numerator/denominator (e.g., `16:9` $\rightarrow 16/9$), calculate target dimensions centered within original bounds, and apply `sharp(input).resize({ width, height, fit: 'cover', position: 'center' })`.

### 6.2 Rotate
- **Option Schema**:
  ```typescript
  export const RotateOptionsSchema = z.object({
    angle: z.number().int().min(0).max(360).default(0),
    autoOrient: z.boolean().default(true),
  });
  ```
- **Processing Logic**:
  - If `autoOrient: true`, invoke `sharp(input).rotate()`.
  - Apply user angle: `sharp.rotate(angle, { background: '#00000000' })` (maintaining transparency for non-right angles on PNG/WebP, or neutral background for JPEG).

### 6.3 Watermark
- **Option Schema**:
  ```typescript
  export const WatermarkOptionsSchema = z.object({
    type: z.enum(['text', 'image']),
    text: z.string().max(200).optional(),
    imageKey: z.string().optional(),
    position: z.enum([
      'top-left', 'top-center', 'top-right',
      'center-left', 'center', 'center-right',
      'bottom-left', 'bottom-center', 'bottom-right',
    ]).default('bottom-right'),
    opacity: z.number().min(0).max(1).default(0.7),
    scale: z.number().min(0.05).max(1.0).default(0.2),
    tiled: z.boolean().default(false),
  });
  ```
- **Processing Logic**:
  - **Text Mode**: Sanitize input string (escape XML entities). Wrap into an SVG string with embedded font styling, calculate bounding box, and render SVG to a PNG buffer via Sharp.
  - **Image Mode**: Retrieve watermark image from S3, resize relative to base image using the `scale` factor.
  - **Composite**: Compute pixel offsets for the 9 compass positions with margins. Apply `sharp(base).composite([{ input: overlayBuffer, top, left, blend: 'over' }])`. If `tiled: true`, repeat composite overlay across full image dimensions.

---

## 7. UI Specification

### 7.1 Crop Workspace
- Single-image mode: Interactive bounding box overlay allowing corner dragging and pan.
- Aspect ratio preset bar (`1:1`, `4:3`, `16:9`, `Free`) that constrains the overlay box.
- Batch mode: Displays file grid with preset selector, applying the aspect crop to all files simultaneously.

### 7.2 Rotate Workspace
- Primary controls: Quick 90° Clockwise and 90° Counter-Clockwise buttons.
- Fine-tune slider: 0° to 360° with numeric input and "Reset" action.
- "Auto-Orient EXIF" switch enabled by default.
- Live canvas preview displaying real-time rotation transform.

### 7.3 Watermark Workspace
- Segmented toggle: "Text Watermark" vs "Image Watermark".
- Text tab: Input field, font size slider, color picker, opacity slider.
- Image tab: Drag-and-drop zone for watermark logo upload.
- 3x3 interactive alignment matrix for positioning (`top-left` through `bottom-right`).
- "Tile Watermark across image" toggle.

---

## 8. API / Data Contract

### Dispatch Crop / Rotate / Watermark Job
- **Endpoint**: `POST /api/jobs`
- **Request Body (Example: Watermark)**:
  ```json
  {
    "tool": "watermark",
    "inputs": [
      {
        "s3Key": "inputs/uuid/main.jpg",
        "filename": "main.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 3145728
      }
    ],
    "options": {
      "type": "text",
      "text": "ImageLabs Confidential",
      "position": "bottom-right",
      "opacity": 0.5,
      "scale": 0.25,
      "tiled": false
    }
  }
  ```

---

## 9. Security

- **SVG Injection Prevention**: When creating text watermarks via SVG buffers, rigorously sanitize text input by escaping XML control characters (`&`, `<`, `>`, `"`, `'`). Prevent external entity injection (XXE).
- **Coordinate Bounds Validation**: Ensure crop dimensions (`left + width <= originalWidth`, `top + height <= originalHeight`) to prevent libvips buffer extraction errors.
- **Watermark Image Validation**: Enforce that watermark overlay images pass magic-byte verification and do not exceed 10 MB.

---

## 10. Performance Targets

- **Crop / Rotate Execution**: Single-image operations complete in $< 200\text{ ms}$.
- **Watermark Composition**: Text or image overlay composite completes in $< 400\text{ ms}$ on a 4K image.
- **Batch Processing**: 10 images processed in $< 2.5\text{ seconds}$ on the fast worker.

---

## 11. Step-by-Step Implementation Order

1. **Schemas**: Add `CropOptionsSchema`, `RotateOptionsSchema`, and `WatermarkOptionsSchema` in `packages/shared`.
2. **Worker Processors**:
   - Build `workers/fast/src/processors/crop.ts` with coordinate clamping and cover math.
   - Build `workers/fast/src/processors/rotate.ts` with rotation matrix and auto-orient logic.
   - Build `workers/fast/src/processors/watermark.ts` with XML-safe SVG text generation and 3x3 compass layout engine.
3. **Queue Wiring**: Hook processors into the BullMQ fast worker dispatcher.
4. **Frontend Workspaces**:
   - Implement Crop UI with aspect ratio selectors and bounding box controls.
   - Implement Rotate UI with 90° quick buttons and transform preview.
   - Implement Watermark UI with 3x3 placement grid, text customization, and logo overlay.
5. **Testing**: Write unit tests for coordinate bounding, SVG sanitization, and Sharp composite output verification.

---

## 12. Acceptance Criteria

- [ ] `crop` successfully slices image to exact requested pixel bounds.
- [ ] Batch crop with aspect ratio preset centers and crops images without distorting aspect ratios.
- [ ] `rotate` turns images accurately by 90°, 180°, 270°, and custom angles.
- [ ] Auto-orient normalizes smartphone camera images with EXIF orientation metadata.
- [ ] `watermark` text overlay is crisp, supports transparency, and safely handles special characters (`<script>`, `&`).
- [ ] 3x3 position alignment accurately places watermark relative to image dimensions.

---

## 13. Test Scenarios

- **Unit**: Verify `crop` fails gracefully if crop coordinates exceed image dimensions.
- **Security**: Verify `watermark` with text `"<script>alert(1)</script>"` does not evaluate or corrupt SVG parsing.
- **Unit**: Verify `rotate` by 90° swaps image width and height dimensions.
- **E2E**: Upload test image to Watermark UI, add text, select `bottom-center`, submit job, verify download output image contains overlay.

---

## 14. Definition of Done

- All code adheres strictly to `docs/conventions.md` and `docs/design-system.md`.
- No database usage; state remains strictly in Redis and S3 with 1-hour TTL.
- All Vitest unit tests pass and code coverage for processors exceeds 90%.
- Typecheck and ESLint validations complete with 0 errors.
