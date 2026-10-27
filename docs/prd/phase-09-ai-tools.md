# Phase 09: Advanced & AI Image Tools (Upscale, Remove Background, Blur Face)

## 1. Phase Title & Goal
- **Phase Title**: Phase 09 — Advanced & AI Image Tools (`upscale`, `remove-background`, `blur-face`).
- **Goal**: Implement neural network-driven and computer vision image manipulation pipelines for high-resolution upscaling (Real-ESRGAN), background removal (`rembg` U2-Net), and face blurring (client-side MediaPipe with OpenCV server fallback). All operations are executed asynchronously via the dedicated AI worker and Python bridges without database retention.

---

## 2. Context & Dependencies
- **Assumed Completed Foundations**:
  - Phase 0–4: Monorepo, Fastify API, S3 presigned operations, BullMQ queues, and design system.
  - Phase 5: Fast worker foundation, batch processing, and temporary S3 storage pipelines.
  - Phase 6–8: Format converters, basic editing tools, and client-side canvas utilities.

---

## 3. Scope

### In-Scope
- `upscale` tool:
  - 2x and 4x neural resolution enhancement via Real-ESRGAN Python bridge.
  - Restoration of compressed, low-resolution artifacts while enhancing fine detail.
- `remove-background` tool:
  - Automated subject isolation and background removal powered by `rembg` (U2-Net / RMBG-1.4).
  - Clean alpha channel output export to PNG format.
- `blur-face` tool:
  - Client-side fast face detection and Gaussian blurring using Google MediaPipe Face Detection.
  - Server-side fallback using OpenCV Haar cascades / DNN face detectors for batch jobs or unsupported client devices.
  - Configurable blur intensity and bounding box margin padding.
- Interactive before/after split slider views on the frontend.

### Out-of-Scope
- Generative text-to-image synthesis (Stable Diffusion / Midjourney).
- Custom fine-tuning of machine learning checkpoints on user-uploaded data.
- Relational database storage of face coordinates, model weights, or job results.

---

## 4. Tech Stack
- **AI Worker Orchestration**: Node.js + BullMQ (`ai-jobs` queue) managing Python subprocess bridges.
- **Neural Inference Engine**: Python 3.10+ virtualenv / containerized runtime:
  - `torch` + `torchvision`
  - `real-esrgan` (x2plus and x4plus models)
  - `rembg` (U2-Net / RMBG-1.4)
  - `opencv-python-headless` (Server face detection and Gaussian blur filter)
- **Client-Side Face Detection**: `@mediapipe/face_detection` + `@mediapipe/camera_utils` running in browser WebAssembly / WebGL context.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.

---

## 5. Files to Create / Modify

### AI Worker & Python Bridge
- `workers/ai/src/processors/upscale.ts`: Node bridge invoking `upscale.py`.
- `workers/ai/src/processors/remove-bg.ts`: Node bridge invoking `remove_bg.py`.
- `workers/ai/src/processors/blur-face.ts`: Node bridge invoking `blur_face.py` for server fallback.
- `workers/ai/python/upscale.py`: Real-ESRGAN CLI execution script.
- `workers/ai/python/remove_bg.py`: `rembg` execution script.
- `workers/ai/python/blur_face.py`: OpenCV face detection and Gaussian blurring script.
- `workers/ai/python/requirements.txt`: Python package dependencies.
- `workers/ai/src/index.ts`: Worker entrypoint subscribing to `ai-jobs`.

### Shared
- `packages/shared/src/schemas/tool-options.schema.ts`: Add `UpscaleOptions`, `RemoveBgOptions`, and `BlurFaceOptions`.
- `packages/shared/src/index.ts`: Re-export AI tool option schemas.

### Frontend
- `apps/web/src/features/upscale/pages/upscale-page.tsx`: Upscale workspace view.
- `apps/web/src/features/remove-bg/pages/remove-bg-page.tsx`: Background removal view.
- `apps/web/src/features/blur-face/pages/blur-face-page.tsx`: Face blurring view.
- `apps/web/src/features/ai/components/before-after-slider.tsx`: Interactive split comparison slider.
- `apps/web/src/features/blur-face/lib/mediapipe-face.ts`: Client-side MediaPipe WASM detector.

---

## 6. Detailed Requirements

### 6.1 Upscale
- **Option Schema**:
  ```typescript
  export const UpscaleOptionsSchema = z.object({
    scale: z.enum(['2x', '4x']).default('2x'),
  });
  ```
- **Processing Logic**:
  - Download input file from S3 to worker local scratch disk (`/tmp/scratch/input.jpg`).
  - Invoke `python3 upscale.py --input /tmp/scratch/input.jpg --output /tmp/scratch/output.png --scale 2`.
  - Python script runs `RealESRGAN_x2plus` (or `x4plus`), saves high-resolution output.
  - Upload result to S3 `outputs/{uuid}/*`, clean up scratch files immediately.

### 6.2 Remove Background
- **Option Schema**:
  ```typescript
  export const RemoveBgOptionsSchema = z.object({
    model: z.enum(['u2net', 'rmbg-1.4']).default('u2net'),
  });
  ```
- **Processing Logic**:
  - Python subprocess streams input image into `rembg.remove()`.
  - Generates transparent RGBA PNG output.
  - Returns output path to Node.js worker, uploads to S3, deletes scratch files.

### 6.3 Blur Face
- **Option Schema**:
  ```typescript
  export const BlurFaceOptionsSchema = z.object({
    blurStrength: z.number().int().min(5).max(100).default(35),
    padding: z.number().min(0).max(0.5).default(0.1),
    faces: z.array(z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })).optional(),
  });
  ```
- **Processing Logic**:
  - **Client-Side (Primary)**: If client browser supports MediaPipe, detect face coordinates on canvas. User can review detected faces, adjust blur strength, and blur directly in browser before final export.
  - **Server-Side Fallback / Batch**: If client sends job without pre-computed face coordinates, `blur_face.py` uses OpenCV Haar Cascade or DNN face model to detect bounding boxes, adds padding, and applies Gaussian blur (`cv2.GaussianBlur(roi, (ksize, ksize), 30)`).

---

## 7. UI Specification

### 7.1 Common AI UI Elements
- **Processing View**: Dedicated spinner with animated step indicator ("Analyzing image...", "Executing neural enhancement...", "Finalizing output...").
- **Interactive Before/After Slider**: `<BeforeAfterSlider>` allowing horizontal drag to compare original vs processed image side-by-side.

### 7.2 Upscale Workspace
- Radio group to select scale factor: `2x (Recommended)` vs `4x (Ultra HD)`.
- Displays estimated output resolution before starting job (e.g., `1920x1080` $\rightarrow$ `3840x2160`).

### 7.3 Remove Background Workspace
- Upload image $\rightarrow$ instant progress indicator.
- Result view displays checkered transparent pattern behind isolated subject.
- One-click "Download Transparent PNG" button.

### 7.4 Blur Face Workspace
- Image canvas showing detected face bounding boxes highlighted with soft outlines.
- Ability to toggle blur on/off for individual detected faces.
- Slider for blur radius / strength.

---

## 8. API / Data Contract

### Dispatch AI Job
- **Endpoint**: `POST /api/jobs`
- **Request Body (Example: Upscale)**:
  ```json
  {
    "tool": "upscale",
    "inputs": [
      {
        "s3Key": "inputs/uuid/lowres.jpg",
        "filename": "lowres.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 524288
      }
    ],
    "options": {
      "scale": "2x"
    }
  }
  ```
- **Response**: `200 OK` with `jobId`.

---

## 9. Security & Data Privacy

- **Zero Data Retention**: AI models and Python workers must never retain input images, facial coordinates, or output buffers on disk after job completion. Scratch files must be deleted in a `finally` block.
- **Model Isolation**: Subprocess execution must run with restricted permissions, no network access (`unshare -n` or container isolation), and a strict execution timeout (60 seconds).
- **No Model Training**: Explicit policy that user-submitted assets are never fed into training or fine-tuning datasets.

---

## 10. Performance Targets

- **Upscale (2x)**: $< 5.0\text{ seconds}$ per standard image on GPU-accelerated worker ($< 12\text{s}$ on modern multi-core CPU).
- **Remove Background**: $< 3.5\text{ seconds}$ per image using `rembg` U2-Net.
- **Face Blurring (Client MediaPipe)**: $< 150\text{ ms}$ real-time detection in browser.
- **Face Blurring (Server OpenCV)**: $< 800\text{ ms}$ per image.

---

## 11. Step-by-Step Implementation Order

1. **Python Dependencies & Scripts**:
   - Write `requirements.txt` for torch, torchvision, rembg, and opencv-python-headless.
   - Implement standalone scripts `upscale.py`, `remove_bg.py`, and `blur_face.py` with CLI arguments.
2. **Worker Subprocess Bridge**:
   - Implement `workers/ai/src/processors/upscale.ts`, `remove-bg.ts`, and `blur-face.ts` using Node `child_process.spawn` with stdout/stderr streaming and timeouts.
3. **Queue Wiring**: Hook AI processors to BullMQ `ai-jobs` queue.
4. **Schemas**: Add `UpscaleOptionsSchema`, `RemoveBgOptionsSchema`, and `BlurFaceOptionsSchema` to `@imagelabs/shared`.
5. **Frontend Features**:
   - Implement `<BeforeAfterSlider>` component.
   - Build Upscale, Remove Background, and Blur Face feature views.
   - Integrate MediaPipe client-side face detection hook in `blur-face-page.tsx`.
6. **Automated Testing**: Write integration tests asserting output format, alpha channel generation for background removal, and dimension doubling for upscale.

---

## 12. Acceptance Criteria

- [ ] `upscale` with `2x` produces an output image with exactly $2\times$ width and $2\times$ height of the input.
- [ ] `remove-background` yields an RGBA PNG with a transparent background where the backdrop previously existed.
- [ ] `blur-face` detects faces and applies Gaussian blur over face bounding boxes.
- [ ] Client-side MediaPipe detector works seamlessly in modern browsers without requiring server fallback.
- [ ] Server fallback correctly processes face blurring when client coordinates are omitted.
- [ ] Scratch files in `/tmp` are wiped immediately after S3 upload.

---

## 13. Test Scenarios

- **Unit / Script**: Execute `upscale.py --scale 2x` on a $500\times 500$ fixture $\rightarrow$ verify output is $1000\times 1000$.
- **Unit / Script**: Execute `remove_bg.py` on portrait fixture $\rightarrow$ verify alpha channel contains non-255 pixels (transparency present).
- **Security**: Verify Python subprocess terminates with error if input file is not a valid image.
- **E2E**: Upload image to Remove Background page, observe progress bar, verify transparent result appears in Before/After slider, download PNG.

---

## 14. Definition of Done

- All code strictly complies with `docs/conventions.md` and `docs/design-system.md`.
- No relational or persistent database added; all job tracking remains strictly in Redis (1h TTL) and S3.
- Vitest worker tests and Python bridge integration tests pass on CI.
- Full TypeScript typecheck and ESLint validations pass with 0 errors.
