# Phase 13: Security Hardening & Zero-Persistence Privacy

## 1. Phase Title & Goal
- **Phase Title**: Phase 13 — Security Hardening & Zero-Persistence Privacy.
- **Goal**: Implement comprehensive security protections and privacy guarantees across all application surfaces. Harden Fastify with strict Content Security Policies (CSP), Cross-Origin Resource Sharing (CORS), CSRF mitigation, binary magic-byte stream validation, scoped 5-minute S3 presigned URLs, immediate purge endpoints (`DELETE /api/jobs/:id`), and an automated orphan-cleanup cron script.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 02 (Fastify setup), Phase 03 (S3 presigned pipeline), and Phase 04 (BullMQ & Redis job lifecycle).
- **Core Principle**: Absolute user privacy and zero permanent data retention.

---

## 3. Scope

### In-Scope
- Advanced Security Headers via `@fastify/helmet`:
  - Strict Content Security Policy (CSP) blocking unauthorized scripts, styles, and frames.
  - HTTP Strict Transport Security (HSTS) with long max-age and preload.
  - X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`).
- Custom CSRF Protection:
  - Header inspection (`X-Requested-With` / custom CSRF header) combined with `SameSite=Lax` cookies.
- Magic Byte Stream Inspection:
  - Fastify pre-parsing inspection of binary file signatures using `file-type` to detect MIME spoofing (e.g., preventing polyglot executable files masked as PNGs).
- S3 URL Security:
  - Presigned upload URL TTL reduced to 300 seconds (5 minutes).
  - Explicit S3 prefix partitioning preventing directory traversal.
- Immediate File & State Purge:
  - Implementation of `DELETE /api/jobs/:id` which immediately issues S3 `DeleteObjectsCommand` for all input/output keys and deletes the Redis `job:{uuid}` hash.
- Automated Orphan Cleanup Script (`scripts/cleanup-orphan-storage.ts`):
  - Scheduled script identifying and removing S3 objects older than 1 hour that were not purged by standard lifecycles.

### Out-of-Scope
- Complex enterprise user role management (RBAC).
- Hardware security module (HSM) key management.

---

## 4. Tech Stack & Libraries
- **Backend**: Fastify, `@fastify/helmet`, `@fastify/cors`, `file-type`, `@aws-sdk/client-s3`.
- **In-Memory Store**: Redis (`ioredis`).
- **Automation**: Node.js standalone script executed via cron or task runner.

---

## 5. Files to Create / Modify
- `apps/api/src/plugins/security-headers.ts`: CSP and HTTP response headers configuration.
- `apps/api/src/plugins/csrf-guard.ts`: CSRF verification hook.
- `apps/api/src/lib/magic-bytes.ts`: Binary stream signature verification helper.
- `apps/api/src/routes/jobs.ts`: Enhance `DELETE /api/jobs/:id` for instant multi-key S3 deletion.
- `scripts/cleanup-orphan-storage.ts`: Background maintenance script for S3/Redis sweep.
- `apps/web/src/features/common/components/privacy-badge.tsx`: UI badge highlighting zero-retention guarantee.

---

## 6. Detailed Requirements

### 6.1 Content Security Policy (CSP)
Configure `@fastify/helmet` with strict policy:
```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://apis.google.com", "https://accounts.google.com", "https://www.dropbox.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:", process.env.S3_ENDPOINT || 'http://localhost:9000'],
      connectSrc: ["'self'", "https:", process.env.S3_ENDPOINT || 'http://localhost:9000'],
      frameSrc: ["https://accounts.google.com", "https://www.dropbox.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
});
```

### 6.2 Magic Byte Binary Validation
- Before issuing a presigned upload or when handling binary validation in workers, read the first 512 bytes of the payload.
- Compare binary magic numbers against expected format signatures (e.g., `FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` for WebP).
- Reject mismatching signatures immediately with HTTP 415 `UNSUPPORTED_TYPE`.

### 6.3 Immediate Job Purge (`DELETE /api/jobs/:id`)
- When user clicks "Delete Now" on the completed result screen:
  1. Retrieve job hash from Redis. Validate `session` matches active caller.
  2. Collect all S3 keys from `inputs` and `outputs`.
  3. Dispatch `DeleteObjectsCommand` to S3 bucket.
  4. Execute `redis.del('job:' + id)`.
  5. Return HTTP 200 `{ success: true }`.

### 6.4 Automated Orphan Cleanup Cron (`scripts/cleanup-orphan-storage.ts`)
- Script connects to S3 and Redis.
- Lists objects in bucket `imagelabs-temp`.
- For each object, inspect `LastModified`. If $(now - LastModified) > 3600\text{s}$ (1 hour):
  - Delete object from S3.
- Query Redis for expired or untracked job keys and evict them.

---

## 7. UI Specification
- Embedded in `<ResultView>`:
  - Prominent "Delete My Files Now" button with `Trash2` icon.
  - Tooltip: "All files are automatically deleted after 1 hour, or you can purge them immediately."
- Embedded in `<Footer>`:
  - Privacy guarantee badge: "Zero Data Retention • No Accounts • Files Auto-Delete in 1h".

---

## 8. API / Data Contract

### Immediate File Purge
- **Route**: `DELETE /api/jobs/:id`
- **Response**: `200 OK`
  ```json
  { "success": true, "purgedKeys": 3 }
  ```

---

## 9. Security & Privacy Highlights
- **Ephemeral Guarantees**: Absolute data minimization. No image persists past 1 hour under any circumstances.
- **Short-Lived URLs**: Presigned URLs expire after 5 minutes, mitigating URL leakage risks in browser history or logs.
- **Input Sanitization**: All user strings (watermarks, captions, filenames) sanitized against HTML/XML injections.

---

## 10. Performance
- Immediate purge operation: $< 100\text{ ms}$ for S3 batch delete and Redis key eviction.
- Magic byte check: $< 1\text{ ms}$ on initial buffer slice.

---

## 11. Step-by-Step Implementation Order
1. Implement strict security headers and CSP in `apps/api/src/plugins/security-headers.ts`.
2. Add CSRF validation hook in Fastify middleware.
3. Build binary magic byte verification in `apps/api/src/lib/magic-bytes.ts`.
4. Implement multi-key S3 deletion in `DELETE /api/jobs/:id`.
5. Write the standalone `cleanup-orphan-storage.ts` maintenance script.
6. Mount "Delete Now" button and privacy badges in frontend.

---

## 12. Acceptance Criteria
- [ ] CSP headers are returned on all API responses without breaking Google/Dropbox popups.
- [ ] Tampered file extensions (e.g., an executable renamed to `.jpg`) are caught and rejected by magic byte inspection.
- [ ] Calling `DELETE /api/jobs/:id` purges both input and output files from MinIO and deletes the Redis hash.
- [ ] S3 presigned URLs expire strictly after 300 seconds.
- [ ] The cleanup script runs cleanly and purges objects older than 1 hour.

---

## 13. Test Scenarios
- Test: Inspect response headers of `GET /api/health` $\rightarrow$ verify `X-Frame-Options: DENY` and CSP headers are present.
- Test: Upload renamed text file as JPEG $\rightarrow$ verify magic byte inspection rejects with 415.
- Test: Delete completed job $\rightarrow$ verify querying S3 object key returns 404 NoSuchKey.

---

## 14. Definition of Done
- Security audits pass with 0 high/critical vulnerabilities.
- Ephemeral lifecycle validated with automatic and immediate purge pipelines.
- Code strictly complies with zero-database architecture.
