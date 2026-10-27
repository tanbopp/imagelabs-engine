# Phase 03: File Ingestion & Presigned Object Storage Pipeline

## 1. Phase Title & Goal
- **Phase Title**: Phase 03 — File Ingestion & Presigned Object Storage Pipeline.
- **Goal**: Implement high-throughput, direct-to-storage file uploads using Amazon S3 (or MinIO in local dev) with presigned PUT URLs. Establish strict MIME and magic-byte validation, client-side drag-and-drop `<UploadZone>` components in React, and verify automatic 1-hour lifecycle auto-expiration.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 00 (MinIO container), Phase 01 (UI design tokens, shadcn Card), and Phase 02 (Stateless JWT session authentication).
- **Consumes**: `UploadRequestSchema` and `UploadResponseSchema` from `@imagelabs/shared`.

---

## 3. Scope

### In-Scope
- Backend S3 client setup with AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).
- API route: `POST /api/upload` validating file metadata and issuing scoped presigned PUT URLs with 15-minute expiration.
- Frontend `<UploadZone>` component:
  - Drag-and-drop container with visual hover, focus, and loading states.
  - Client-side pre-validation: File size ceiling (50MB) and MIME checks.
  - Multi-file batch upload progress tracker.
  - Direct upload from browser to S3 via `fetch` (PUT) avoiding backend API proxy bottlenecks.
- Magic byte validation helper validating file signatures against claimed extensions.

### Out-of-Scope
- Passing image binary data through the Fastify API (anti-pattern; direct S3 PUT only).
- Background queue job dispatching (handled in Phase 04).
- Cloud import from Dropbox or Google Drive (handled in Phase 11).

---

## 4. Tech Stack & Libraries
- **Backend**: Fastify, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- **Validation**: Zod + `file-type` (magic bytes verification).
- **Frontend**: React 18, `lucide-react` (`UploadCloud`, `FileImage`, `AlertCircle`), shadcn/ui (`Progress`, `Button`, `Card`).

---

## 5. Files to Create / Modify
- `apps/api/src/lib/s3.ts`: S3 client configured for AWS or MinIO endpoint.
- `apps/api/src/routes/upload.ts`: Route issuing presigned PUT URLs.
- `apps/api/src/services/storage.service.ts`: Helper generating unique object keys (`inputs/{uuid}/{filename}`).
- `apps/web/src/lib/api-client.ts`: Frontend HTTP client for API interactions.
- `apps/web/src/lib/s3-upload.ts`: Direct S3 upload utility handling XMLHttpRequest/Fetch progress events.
- `apps/web/src/components/upload/upload-zone.tsx`: Reusable dropzone component.
- `apps/web/src/components/upload/upload-file-item.tsx`: Uploading progress item.

---

## 6. Detailed Requirements

### 6.1 Presigned Upload Endpoint
- **Path**: `POST /api/upload` (Protected by session JWT middleware).
- Validates request payload against `UploadRequestSchema`:
  - `filename`: Non-empty string.
  - `mimeType`: Allowed list (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`, `image/tiff`, `image/heic`).
  - `sizeBytes`: $1 \le \text{sizeBytes} \le 52428800$ (50 MB).
- Generates scoped S3 key: `inputs/${crypto.randomUUID()}/${sanitizeFilename(filename)}`.
- Signs a `PutObjectCommand` with a 900-second (15m) TTL.
- Returns `UploadResponse`: `{ uploadUrl, s3Key, expiresAt }`.

### 6.2 Frontend `<UploadZone>`
- Full drag-and-drop support: `onDragEnter`, `onDragLeave`, `onDragOver`, `onDrop`.
- Native fallback via hidden `<input type="file" multiple accept="image/*" />`.
- When files are dropped/selected:
  1. Inspect local size and reject files $> 50\text{ MB}$ immediately.
  2. For each file, call `POST /api/upload` to fetch presigned URL.
  3. Dispatch `PUT` to `uploadUrl` with binary file stream.
  4. Track byte progress using `onUploadProgress` to update local progress state.
  5. Emit completion event with `{ s3Key, filename, mimeType, sizeBytes }` for queue dispatch.

### 6.3 MinIO / S3 CORS Configuration
- S3 / MinIO bucket `imagelabs-temp` must allow:
  - AllowedOrigins: `['http://localhost:3000', 'https://imagelabs.dev']`
  - AllowedMethods: `['PUT', 'GET', 'HEAD']`
  - AllowedHeaders: `['*']`

---

## 7. UI Specification
- Dashed border card (`border-dashed border-2 border-border`) with rounded-2xl geometry.
- Centered iconography: `UploadCloud` (size 32px), title ("Drag & drop images here"), and button ("Select Images").
- Active Drag Over state: Highlighted foreground border, background shifts to `bg-muted/60`.
- During upload: Progress bars for individual files with smooth percentage rendering (`shadcn/ui Progress`).

---

## 8. API / Data Contract

### Request Presigned URL
- **Route**: `POST /api/upload`
- **Payload**:
  ```json
  {
    "filename": "camera-photo.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 3450000
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "uploadUrl": "http://localhost:9000/imagelabs-temp/inputs/uuid/camera-photo.jpg?AWSAccessKeyId=...",
    "s3Key": "inputs/uuid/camera-photo.jpg",
    "expiresAt": "2026-10-27T10:15:00.000Z"
  }
  ```

---

## 9. Security & Validation
- **Size Limit**: Rigid ceiling of 50 MB rejected at API route level with HTTP 413 `FILE_TOO_LARGE`.
- **MIME Restriction**: Only approved image MIME types permitted; arbitrary binary types return 415 `UNSUPPORTED_TYPE`.
- **Key Isolation**: Object keys strictly scoped under random UUIDs to avoid object overwriting or collision attacks.

---

## 10. Performance
- Backend API overhead: $< 15\text{ ms}$ to generate and sign the presigned S3 URL.
- Direct-to-storage architecture eliminates server proxying, allowing max client bandwidth utilization.

---

## 11. Step-by-Step Implementation Order
1. Configure AWS SDK S3 client in `apps/api/src/lib/s3.ts`.
2. Build storage service helper to generate unique keys and presigned PUT URLs.
3. Implement `POST /api/upload` route in `apps/api/src/routes/upload.ts`.
4. Configure MinIO bucket CORS rules in `infra/docker/docker-compose.yml`.
5. Implement frontend S3 upload handler in `apps/web/src/lib/s3-upload.ts`.
6. Implement `<UploadZone>` component with file pickers and progress states.
7. Run end-to-end upload test to local MinIO.

---

## 12. Acceptance Criteria
- [ ] Dropping an image triggers `POST /api/upload` and receives valid presigned URL.
- [ ] File uploads directly to MinIO and appears under `imagelabs-temp/inputs/...`.
- [ ] Uploading a file $> 50\text{ MB}$ is rejected on the client and rejected by the API with 413.
- [ ] Unsupported MIME types (e.g., `application/pdf`) are rejected with 415.
- [ ] MinIO bucket lifecycle rule is verified to expire uploaded objects after 1 hour.

---

## 13. Test Scenarios
- Test: POST upload with valid JPEG $\rightarrow$ returns 200 with presigned PUT URL.
- Test: Execute PUT request to presigned URL with image data $\rightarrow$ S3 returns 200 OK.
- Test: Request upload for 60MB file $\rightarrow$ API returns 413 `FILE_TOO_LARGE`.
- Test: Request upload without session cookie $\rightarrow$ returns 401 `NO_SESSION`.

---

## 14. Definition of Done
- Complete presigned upload pipeline tested against MinIO.
- Zero server-side file buffering in Fastify memory.
- All code passes typecheck and linting.
