# Phase 06: Image Format Conversion Suite

## 1. Phase Title & Goal
- **Phase Title**: Phase 06 — Image Format Conversion Suite (`convert-to-jpg`, `convert-from-jpg`, `convert-image`).
- **Goal**: Implement universal, high-fidelity format conversion tools handling raster and modern web image formats (JPEG, PNG, WebP, AVIF, TIFF, GIF) and animated GIF generation from multiple frames using Sharp and `gifencoder` inside the Fast Worker.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 04 (BullMQ Queue infrastructure & worker skeleton) and Phase 05 (Fast worker Sharp patterns).
- **Consumes**: `TOOLS` definitions from `@imagelabs/shared`.

---

## 3. Scope

### In-Scope
- `convert-to-jpg`: High-speed transformation from PNG, GIF, TIFF, WebP, AVIF, and HEIC into standard JPEG.
- `convert-from-jpg`: Converts JPEG images into PNG, static GIF, or multi-image animated GIF (with frame delay and loop controls).
- `convert-image`: Universal multi-format conversion allowing users to pick an arbitrary target format (WebP, AVIF, PNG, TIFF, JPG).
- Animated GIF Assembly: Combining multiple input images into an animated GIF via `gifencoder` + Sharp pixel extraction.
- Frontend format selection interfaces, frame delay sliders, loop count toggles, and batch download packaging.

### Out-of-Scope
- Video-to-GIF conversion (MP4 to GIF — belongs to a dedicated video pipeline).
- Vector SVG-to-raster rendering (addressed via Canvas / Puppeteer).

---

## 4. Tech Stack & Libraries
- **Engine**: Node.js + Sharp (libvips) + `gifencoder` (for animated GIF frame timing).
- **Validation**: Zod + `@imagelabs/shared`.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (`Select`, `Slider`, `ToggleGroup`).

---

## 5. Files to Create / Modify
- `workers/fast/src/processors/convert-to-jpg.ts`: Convert any image to JPG.
- `workers/fast/src/processors/convert-from-jpg.ts`: Convert JPG to PNG/GIF (single/animated).
- `workers/fast/src/processors/convert-image.ts`: General format conversion processor.
- `workers/fast/src/lib/gif-assembler.ts`: Helper assembling animated GIF buffers from frames.
- `packages/shared/src/schemas/tool-options.schema.ts`: Add `ConvertOptions` schema.
- `apps/web/src/features/convert/pages/convert-page.tsx`: Generic conversion view.
- `apps/web/src/features/convert/pages/convert-to-jpg-page.tsx`: Dedicated to-JPG view.
- `apps/web/src/features/convert/pages/convert-from-jpg-page.tsx`: Dedicated from-JPG view with GIF settings.
- `apps/web/src/features/convert/components/format-selector.tsx`: Dropdown / pill selector for target formats.

---

## 6. Detailed Requirements

### 6.1 Convert to JPG
- Accepts inputs: PNG, GIF, WebP, AVIF, TIFF, HEIC.
- Output: Standard JPEG (`.jpg`).
- If input has an alpha channel (transparency), composite over a solid white background (`#ffffff`) to prevent black border artifacts in JPEG.
- Processing: `sharp(buffer).flatten({ background: '#ffffff' }).jpeg({ quality: 90, mozjpeg: true })`.

### 6.2 Convert from JPG
- Target formats: `png`, `gif` (static or animated).
- When multiple inputs are provided and target is `gif`:
  - Assemble animated GIF using `gifencoder`.
  - Accept options: `delayMs` (integer, 50–5000ms, default 500ms) and `loop` (boolean or 0 for infinite, default 0).
  - Normalize all input frames to matching canvas dimensions using Sharp before encoding.

### 6.3 Universal Convert Image
- Accepts any supported format.
- Options:
  ```typescript
  export const ConvertImageOptionsSchema = z.object({
    targetFormat: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff']),
    quality: z.number().int().min(1).max(100).optional().default(85),
  });
  ```
- Executes appropriate Sharp pipeline:
  - `webp`: `.webp({ quality, effort: 4 })`
  - `avif`: `.avif({ quality, effort: 4 })`
  - `png`: `.png({ compressionLevel: 9 })`
  - `tiff`: `.tiff({ compression: 'deflate' })`

---

## 7. UI Specification
- Format selection toolbar with pills: `[ WebP ] [ PNG ] [ JPG ] [ AVIF ] [ GIF ]`.
- For Animated GIF creation:
  - Sequence reordering list with drag-and-drop handles.
  - Frame delay slider (e.g., `0.5s per frame`).
  - Loop toggle: "Loop infinitely" (checked by default).
- Before/After download preview with format badge and file size delta.

---

## 8. API / Data Contract

### Convert Job Dispatch
- **Route**: `POST /api/jobs`
- **Body**:
  ```json
  {
    "tool": "convert-image",
    "inputs": [
      {
        "s3Key": "inputs/uuid/graphic.png",
        "filename": "graphic.png",
        "mimeType": "image/png",
        "sizeBytes": 1048576
      }
    ],
    "options": {
      "targetFormat": "webp",
      "quality": 85
    }
  }
  ```

---

## 9. Security & Validation
- **MIME Extension Matching**: Validate that output filename extensions strictly match the converted MIME type (`.webp` for `image/webp`).
- **Memory Ceiling during GIF Assembly**: Limit animated GIF batch size to a maximum of 30 frames and total uncompressed pixel memory $< 200\text{ MB}$.

---

## 10. Performance
- Single image format conversion (e.g., PNG $\rightarrow$ WebP): $< 300\text{ ms}$.
- Animated GIF assembly (10 frames at 1080p): $< 2.5\text{ seconds}$.

---

## 11. Step-by-Step Implementation Order
1. Define `ConvertOptionsSchema` in `packages/shared`.
2. Implement Sharp processors (`convert-to-jpg.ts`, `convert-image.ts`).
3. Build `gif-assembler.ts` using `gifencoder` for multi-frame animations.
4. Hook processors to the Fast Worker dispatcher in `workers/fast/src/index.ts`.
5. Build frontend conversion feature pages and animated GIF configuration panels.
6. Test conversion outputs against sample fixtures.

---

## 12. Acceptance Criteria
- [ ] Transparent PNG converted to JPG renders on a clean white background with no black fringes.
- [ ] Multi-image batch converted to GIF creates a valid, looping animated GIF with custom delay.
- [ ] Universal conversion to WebP and AVIF produces valid files verified by magic bytes.
- [ ] Processing corrupt images fails gracefully with `INVALID_INPUT`.

---

## 13. Test Scenarios
- Test: Convert transparent PNG to JPG $\rightarrow$ Verify output has 3 channels (RGB) and white background.
- Test: Convert 4 JPGs to animated GIF $\rightarrow$ Verify output MIME is `image/gif` and contains 4 frames.
- Test: Convert JPG to WebP $\rightarrow$ Verify output size is typically 25-35% smaller than source.

---

## 14. Definition of Done
- All conversion tools fully functional without database state.
- Clean code passing all typecheck and Vitest suites.
