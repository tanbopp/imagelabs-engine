# Phase 04: BullMQ Queue Infrastructure & Fast Worker Skeleton

## 1. Phase Title & Goal
- **Phase Title**: Phase 04 — BullMQ Queue Infrastructure & Fast Worker Skeleton.
- **Goal**: Establish the distributed background processing pipeline using BullMQ over Redis. Build the `POST /api/jobs` dispatch endpoint, Redis ephemeral job state hash (`job:{uuid}` with 1h TTL), polling endpoint `GET /api/jobs/:id`, download resolution `GET /api/jobs/:id/download`, and the initial Node.js Fast Worker skeleton with progress reporting.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 00 (Redis container), Phase 02 (Stateless session auth), Phase 03 (S3 presigned uploads), and `@imagelabs/shared` (Job types, error codes).
- **Consumes**: `JobCreateRequestSchema`, `JobResponseSchema`, `JobDownloadResponseSchema`.

---

## 3. Scope

### In-Scope
- BullMQ queue initialization: Setup queues `fast-jobs`, `ai-jobs`, `puppeteer-jobs` over Redis.
- Job Dispatch Route: `POST /api/jobs` validating inputs and persisting job state into Redis hash `job:{uuid}`.
- Job Status Polling Route: `GET /api/jobs/:id` retrieving real-time progress and errors.
- Job Download Route: `GET /api/jobs/:id/download` issuing presigned GET URLs for output assets.
- Job Deletion / Abort Route: `DELETE /api/jobs/:id` to cancel pending tasks and clean S3 keys.
- Fast Worker Skeleton (`workers/fast`):
  - BullMQ Worker listening to `fast-jobs`.
  - Downloads input files from S3, executes a placeholder Sharp pass-through, writes outputs to S3 `outputs/{uuid}/*`, updates progress, and marks completion.
- Frontend `<JobProgress>` component displaying active status, progress bar, and cancel action.

### Out-of-Scope
- Implementing specific image processing tools (Compress/Resize are in Phase 05).
- Python AI worker implementation (Phase 09).
- Puppeteer worker implementation (Phase 10).

---

## 4. Tech Stack & Libraries
- **Queue Engine**: BullMQ v5+ running over Redis (`ioredis`).
- **Backend**: Fastify v4/v5, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- **Worker**: Node.js v20, Sharp v0.33+, BullMQ.
- **Frontend**: React 18, shadcn/ui (`Progress`, `Button`, `Card`), `lucide-react`.

---

## 5. Files to Create / Modify
- `apps/api/src/lib/queue.ts`: BullMQ queue instances (`fastQueue`, `aiQueue`, `puppeteerQueue`).
- `apps/api/src/routes/jobs.ts`: CRUD endpoints for jobs (`POST /jobs`, `GET /jobs/:id`, `GET /jobs/:id/download`, `DELETE /jobs/:id`).
- `apps/api/src/services/job.service.ts`: Redis hash interactions for `job:{uuid}`.
- `workers/fast/src/index.ts`: Worker entrypoint and BullMQ listener loop.
- `workers/fast/src/lib/s3.ts`: S3 client for worker download/upload.
- `apps/web/src/components/processing/job-progress.tsx`: Polling UI with progress indicator.
- `apps/web/src/hooks/use-job-polling.ts`: React hook managing job status polling with exponential backoff.

---

## 6. Detailed Requirements

### 6.1 Redis Job Hash Specification
- Key format: `job:{uuid}`
- Fields:
  - `id`: string (UUID)
  - `status`: `'queued' | 'processing' | 'completed' | 'failed'`
  - `tool`: string (e.g., `'compress'`)
  - `inputs`: JSON stringified `JobInput[]`
  - `outputs`: JSON stringified `JobOutput[]`
  - `progress`: integer (0–100)
  - `error`: JSON stringified `{ code, message }` or empty string
  - `session`: string (Session ID)
  - `createdAt`: ISO 8601 string
  - `updatedAt`: ISO 8601 string
- TTL: Automatically set to `3600` seconds on creation.

### 6.2 Job Creation Endpoint (`POST /api/jobs`)
- Validates request body with `JobCreateRequestSchema`.
- Verifies that all `inputs[].s3Key` belong to the active session.
- Creates Redis hash with status `queued` and TTL 3600s.
- Dispatches task to the appropriate queue (`fast-jobs` for fast tools).
- Returns `{ jobId }`.

### 6.3 Fast Worker Skeleton (`workers/fast`)
- Subscribes to queue `fast-jobs` with concurrency 5.
- On job received:
  1. Update Redis hash: `status = 'processing'`, `progress = 10`.
  2. Download inputs from S3.
  3. Emit progress updates (e.g., `progress = 50`).
  4. Write outputs to S3 `outputs/{jobId}/{filename}`.
  5. Update Redis hash: `status = 'completed'`, `progress = 100`, `outputs = [...]`.
- On job failure:
  - Update Redis hash: `status = 'failed'`, `error = { code: 'INTERNAL', message: err.message }`.

### 6.4 Polling Hook (`useJobPolling`)
- Polls `GET /api/jobs/:id` every 800ms while status is `queued` or `processing`.
- Stops polling when status is `completed` or `failed`.
- Implements 120-second timeout guard on client side.

---

## 7. UI Specification
- `<JobProgress>` card with rounded-2xl geometry and flat design.
- Animated progress bar (`shadcn/ui Progress`).
- Status label: "Queueing...", "Processing image...", "Finalizing...", "Done!".
- Accessible live region `aria-live="polite"` announcing completion to screen readers.
- "Cancel" button triggering `DELETE /api/jobs/:id`.

---

## 8. API / Data Contract

### Create Job
- **Route**: `POST /api/jobs`
- **Body**:
  ```json
  {
    "tool": "compress",
    "inputs": [
      {
        "s3Key": "inputs/uuid/test.jpg",
        "filename": "test.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 102400
      }
    ],
    "options": {}
  }
  ```
- **Response**: `200 OK`
  ```json
  { "jobId": "b182cb38-c622-441f-82ff-11c7ff8bf399" }
  ```

### Get Job Status
- **Route**: `GET /api/jobs/:id`
- **Response**: `200 OK` (mirrors `JobResponseSchema`)

### Get Download URLs
- **Route**: `GET /api/jobs/:id/download`
- **Response**: `200 OK`
  ```json
  {
    "files": [
      {
        "filename": "test.jpg",
        "url": "http://localhost:9000/imagelabs-temp/outputs/uuid/test.jpg?AWSAccessKeyId=...",
        "expiresAt": "2026-10-27T11:00:00.000Z"
      }
    ]
  }
  ```

---

## 9. Security & Validation
- **Session Scoping**: A client can only query, download, or delete jobs matching their own `session` cookie. Accessing another session's job returns 404 `JOB_NOT_FOUND`.
- **Worker Sandboxing**: Workers execute with non-root privileges inside container environments.
- **Auto-Cleanup**: Jobs and their S3 files expire after 1 hour by design.

---

## 10. Performance
- BullMQ job enqueue latency: $< 5\text{ ms}$.
- Job status polling endpoint: $< 3\text{ ms}$ (single Redis `HGETALL` call).

---

## 11. Step-by-Step Implementation Order
1. Build Redis job service (`apps/api/src/services/job.service.ts`) with hash operations and TTL enforcement.
2. Initialize BullMQ queues and connect to Redis in `apps/api/src/lib/queue.ts`.
3. Implement `POST /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/:id/download`, and `DELETE /api/jobs/:id`.
4. Scaffold `workers/fast` with BullMQ worker loop and S3 client.
5. Implement pass-through worker processor updating job progress and completing jobs.
6. Build `useJobPolling` hook and `<JobProgress>` UI in `apps/web`.
7. Test end-to-end flow: Upload $\rightarrow$ Job Create $\rightarrow$ Worker Processing $\rightarrow$ Download link ready.

---

## 12. Acceptance Criteria
- [ ] Submitting a job creates a `job:{uuid}` hash in Redis with a 3600-second TTL.
- [ ] Worker picks up the job, increments progress from 10 to 100, and uploads output to S3.
- [ ] Polling `GET /api/jobs/:id` reflects real-time status transitions.
- [ ] `GET /api/jobs/:id/download` returns valid presigned download URLs.
- [ ] `DELETE /api/jobs/:id` removes Redis hash and deletes S3 objects.

---

## 13. Test Scenarios
- Test: POST `/api/jobs` without valid inputs $\rightarrow$ returns 400 `INVALID_INPUT`.
- Test: Query status of expired/nonexistent job $\rightarrow$ returns 404 `JOB_NOT_FOUND`.
- Integration: Dispatch job to `workers/fast`, wait for completion, download output from presigned URL.

---

## 14. Definition of Done
- Background queue and worker processing loop verified locally.
- Zero persistent database tables; state is strictly ephemeral in Redis and MinIO.
- Clean code passing all typechecks and unit tests.
