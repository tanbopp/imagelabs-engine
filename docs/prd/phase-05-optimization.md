# Phase 05: Image Optimization Tools (Compress & Resize)

## 1. Phase Title & Goal
- **Phase Title**: Phase 05 — Image Optimization Tools (`compress`, `resize`).
- **Goal**: Deliver production-ready, fully functional optimization pipelines for single and batch image compression and resizing. The tools must operate without database persistence, utilizing Sharp in the fast worker, BullMQ for job orchestration, Redis for ephemeral state/quotas, and S3/MinIO for temporary asset lifecycle.

---

## 2. Context & Dependencies
- **Assumed Completed Foundations (Phases 0–4)**:
  - Phase 0: Monorepo workspace configuration (pnpm, Turborepo, tsconfig, shared package).
  - Phase 1: Fastify API scaffolding with stateless JWT session cookie authentication and Redis integration.
  - Phase 2: S3/MinIO presigned upload and download flows with 1-hour lifecycle rules.
  - Phase 3: BullMQ queue infrastructure and Redis-backed job lifecycle (`job:{uuid}` hashes).
  - Phase 4: Shared UI component foundation (shadcn/ui primitives, theme tokens, layout shell).

---

## 3. Scope

### In-Scope
- Implementation of `compress` tool:
  - Automatic lossy and lossless compression with balanced quality defaults.
  - Multi-format support: JPEG/JPG, PNG, WebP, AVIF.
  - Verification that processed outputs are smaller than inputs (with fallback retention of original if compression yields larger byte payload).
- Implementation of `resize` tool:
  - Single and batch resizing with pixel dimensions (`width`, `height`) and percentages.
  - Aspect ratio locking and bounding box scaling (`fit: 'cover' | 'contain' | 'fill'`).
  - `withoutEnlargement` option to prevent quality degradation when scaling up.
- Frontend workspace and interactive interfaces for both tools:
  - Upload zone, configuration panels, batch preview grids, real-time progress meters, and result views with before/after byte comparisons.
- Strict Zod validation schemas for all tool options shared across web, API, and workers.

### Out-of-Scope
- Manual granular quality sliders on compression (automation-first approach per design blueprint).
- Advanced vector resizing (SVG manipulation).
- Persistent user history, account databases, or long-term analytics.

---

## 4. Tech Stack
- **Engine**: Node.js + Sharp (libvips native bindings).
- **Queue & Storage**: BullMQ + Redis (ioredis), S3/MinIO temporary storage.
- **Validation**: Zod + `@asteasolutions/zod-to-openapi`.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (`Card`, `Button`, `Progress`, `Slider`, `Toggle`, `Table`).

---

## 5. Files to Create / Modify

### Backend & Worker
- `workers/fast/src/processors/compress.ts`: Sharp processor for image compression.
- `workers/fast/src/processors/resize.ts`: Sharp processor for dimension scaling.
- `workers/fast/src/index.ts`: Register processors to the BullMQ `fast-jobs` queue.

### Shared
- `packages/shared/src/schemas/tool-options.schema.ts`: Zod schemas for `CompressOptions` and `ResizeOptions`.
- `packages/shared/src/index.ts`: Export tool option schemas and types.

### Frontend
- `apps/web/src/features/compress/pages/compress-page.tsx`: Route view for compression.
- `apps/web/src/features/compress/components/compress-action-panel.tsx`: Options and execution controls.
- `apps/web/src/features/compress/components/compress-result-view.tsx`: Before/after file size diffs.
- `apps/web/src/features/resize/pages/resize-page.tsx`: Route view for resizing.
- `apps/web/src/features/resize/components/resize-action-panel.tsx`: Width/height inputs, aspect lock toggle, fit selector.
- `apps/web/src/features/resize/components/resize-preview-grid.tsx`: Multi-image batch preview grid.

---

## 6. Detailed Requirements

### 6.1 Compress
- **Option Schema**:
  ```typescript
  export const CompressOptionsSchema = z.object({
    quality: z.number().int().min(1).max(100).optional(), // Default auto handled internally
  });
  ```
- **Processing Logic**:
  - Detect input format via Sharp metadata.
  - JPEG: `sharp(buffer).jpeg({ mozjpeg: true, quality: options.quality ?? 80 })`.
  - PNG: `sharp(buffer).png({ compressionLevel: 9, effort: 7, palette: true })`.
  - WebP: `sharp(buffer).webp({ quality: options.quality ?? 80, effort: 4 })`.
  - AVIF: `sharp(buffer).avif({ quality: options.quality ?? 65, effort: 4 })`.
  - **Output Size Guarantee**: Compare compressed buffer size with original buffer size. If compressed size $\ge$ original size, return original buffer to guarantee payload reduction.

### 6.2 Resize
- **Option Schema**:
  ```typescript
  export const ResizeOptionsSchema = z.object({
    width: z.number().int().positive().max(16384).optional(),
    height: z.number().int().positive().max(16384).optional(),
    fit: z.enum(['cover', 'contain', 'fill']).default('contain'),
    withoutEnlargement: z.boolean().default(true),
  }).refine((data) => data.width !== undefined || data.height !== undefined, {
    message: 'At least one dimension (width or height) must be specified',
  });
  ```
- **Processing Logic**:
  - Execute `sharp(buffer).resize({ width, height, fit, withoutEnlargement })`.
  - Preserve source format and color space unless explicitly converted.
  - Auto-orient based on EXIF before resizing.

### 6.3 Edge Cases & Error Handling
- Corrupted images or invalid byte streams must fail immediately with error code `INVALID_INPUT`.
- Unrecognized or unsupported image formats must reject with `UNSUPPORTED_TYPE`.
- Processing timeouts (> 30s) must trigger BullMQ job failure and report `INTERNAL`.

---

## 7. UI Specification

### 7.1 Compress Workspace
1. **Upload Stage**: `<UploadZone>` supporting multi-file drag-and-drop.
2. **Configuration Stage**: Displays total queued files, combined raw size, and a prominent "Compress Images" button.
3. **Processing Stage**: `<JobProgress>` displaying percentage completion and active file count.
4. **Result Stage**: `<ResultView>` showing:
   - Summary card: Total bytes saved and percentage reduction (e.g., "Saved 64% (2.4 MB -> 860 KB)").
   - File table listing original name, original size, compressed size, and download button.
   - Batch "Download All (.zip)" primary action.

### 7.2 Resize Workspace
1. **Upload Stage**: Multi-file drop zone.
2. **Configuration Stage**:
   - Numeric inputs for Width (`px`) and Height (`px`).
   - Aspect ratio lock toggle button (linked inputs based on primary image's ratio).
   - Dropdown for resizing mode (`contain`, `cover`, `fill`).
   - Checkbox: "Do not enlarge if smaller".
   - Batch preview grid displaying each image with overlaid output dimension targets.
3. **Processing & Result Stage**: `<JobProgress>` transition to `<ResultView>` with instant download links.

---

## 8. API / Data Contract

### Dispatch Job
- **Endpoint**: `POST /api/jobs`
- **Request Body**:
  ```json
  {
    "tool": "compress",
    "inputs": [
      {
        "s3Key": "inputs/uuid/photo.jpg",
        "filename": "photo.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 2048576
      }
    ],
    "options": {}
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "jobId": "a90b4d45-7e44-482f-897b-6c4c9fae5e91"
  }
  ```

---

## 9. Security

- **File Header Inspection**: Inspect magic bytes (first 512 bytes) using `file-type` to verify that JPEG/PNG/WebP matches declared MIME types before invoking libvips.
- **Maximum File Ceiling**: Enforce strict 50 MB per-file limit (`FILE_TOO_LARGE`).
- **Memory Safety**: Stream data to temporary buffers with highWaterMark limits to prevent Node process OOM.
- **Path Traversal Protection**: Ensure S3 object keys are validated UUID-scoped paths only.

---

## 10. Performance Targets

- **Batch Velocity**: Process 10 standard JPEG images (each ~2–5 MB) in $< 2.0$ seconds total compute time.
- **Single File Throughput**: Individual compress/resize operations complete in $< 300\text{ ms}$ on Node/Sharp fast worker.
- **Concurrency**: Support 100+ concurrent image processing jobs across worker pods without queue stalling.

---

## 11. Step-by-Step Implementation Order

1. **Schemas**: Implement `CompressOptionsSchema` and `ResizeOptionsSchema` in `packages/shared/src/schemas/tool-options.schema.ts`.
2. **Worker Processors**:
   - Build `workers/fast/src/processors/compress.ts` with format detection, mozjpeg, and png quant.
   - Build `workers/fast/src/processors/resize.ts` with aspect math and withoutEnlargement guards.
3. **Worker Queue Integration**: Attach processors to `fast-jobs` BullMQ worker loop in `workers/fast/src/index.ts`.
4. **API Validation Hook**: Connect `tool-options.schema.ts` to `POST /api/jobs` route validation.
5. **Frontend UI Components**:
   - Implement `CompressPage`, action panel, and before/after result views.
   - Implement `ResizePage`, dimension controls, aspect lock hook, and preview grid.
6. **Automated Testing**: Write Vitest unit tests with image fixtures in `packages/shared/src/__fixtures__/`.

---

## 12. Acceptance Criteria

- [ ] `compress` reduces file sizes for JPEG and PNG test fixtures by at least 20% on average without noticeable visual artifacts.
- [ ] If compression results in a larger file, the original asset buffer is retained.
- [ ] `resize` correctly constrains images by width, height, or both while respecting the aspect ratio lock.
- [ ] Batch resize applies target rules accurately across multiple distinct image aspect ratios.
- [ ] Corrupt image inputs return `INVALID_INPUT` error and fail gracefully without crashing worker threads.
- [ ] Quota meter decrements accurately in Redis upon job submission.

---

## 13. Test Scenarios

- **Unit**: Verify `compress` returns smaller buffer for `sample.jpg` and `sample.png`.
- **Unit**: Verify `resize` produces exact target dimensions $\pm 1\text{px}$ according to fit rule.
- **Integration**: Send corrupt binary file to `POST /api/jobs` $\rightarrow$ Expect job status `failed` with code `INVALID_INPUT`.
- **E2E / Browser**: Upload 5 images to Compress UI, trigger processing, verify progress bar moves, verify Before/After size savings are rendered, download single and ZIP files.

---

## 14. Definition of Done

- All code strictly adheres to `docs/conventions.md` and `docs/design-system.md`.
- No database dependencies added; all state remains ephemeral in Redis (1h TTL) and S3.
- Unit and integration tests pass with 100% success on CI.
- Typecheck (`tsc --noEmit`) and linter (`eslint .`) pass without warnings.
