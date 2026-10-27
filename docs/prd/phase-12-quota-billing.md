# Phase 12: Ephemeral Quota Enforcement & Consumption Tracking

## 1. Phase Title & Goal
- **Phase Title**: Phase 12 — Ephemeral Quota Enforcement & Consumption Tracking.
- **Goal**: Implement hard daily usage quotas (jobs processed and bytes uploaded) without a persistent database or user billing system. Use atomic Redis counters with automatic 24-hour expiration tied to signed session cookies. Expose `GET /api/quota`, block abusive usage with HTTP 403 `QUOTA_EXCEEDED`, and render an accessible `<QuotaMeter>` on the frontend.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 02 (Stateless JWT session auth & Redis), Phase 03 (Upload pipeline), and Phase 04 (Job queue dispatching).
- **Consumes**: `QuotaSnapshot` and `QuotaResponseSchema` from `@imagelabs/shared`.

---

## 3. Scope

### In-Scope
- Redis atomic counter implementation using `INCR`, `INCRBY`, and `EXPIRE`.
- Daily tracking keys:
  - `quota:jobs:{sessionId}:{YYYY-MM-DD}` (Limit: 20 jobs/day).
  - `quota:bytes:{sessionId}:{YYYY-MM-DD}` (Limit: 500 MB/day).
- API Route: `GET /api/quota` returning current daily usage and UTC midnight reset time.
- Pre-handler validation hooks on `POST /api/upload` (bytes check) and `POST /api/jobs` (jobs check).
- Rejection responses returning HTTP 403 with `QUOTA_EXCEEDED`.
- Frontend `<QuotaMeter>` component rendered in the navigation header with progress indicators and tooltip countdowns.

### Out-of-Scope
- Credit card billing, Stripe integration, or paid subscriptions (ImageLabs is strictly free/ephemeral).
- Persistent user history across different browsers or cleared cookies.
- Enterprise multi-tenant quotas.

---

## 4. Tech Stack & Libraries
- **Backend**: Fastify + Redis (`ioredis` pipeline / multi-exec).
- **Validation**: Zod + `@imagelabs/shared`.
- **Frontend**: React 18, shadcn/ui (`Progress`, `Tooltip`), `lucide-react`.

---

## 5. Files to Create / Modify
- `apps/api/src/services/quota.service.ts`: Atomic counter increment, inspection, and TTL logic.
- `apps/api/src/plugins/quota-guard.ts`: Fastify pre-handler hook blocking requests over limit.
- `apps/api/src/routes/quota.ts`: Route exposing `GET /api/quota`.
- `apps/web/src/components/common/quota-meter.tsx`: Visual consumption meter component.
- `apps/web/src/hooks/use-quota.ts`: React hook managing quota state and refetching.
- `apps/web/src/components/layout/header.tsx`: Mount `<QuotaMeter>` in the global navigation bar.

---

## 6. Detailed Requirements

### 6.1 Quota Limits & Key Strategy
- **Default Limits**:
  - `MAX_JOBS_PER_DAY = 20`
  - `MAX_BYTES_PER_DAY = 524288000` (500 MB)
- **Key Patterns**:
  - `quota:jobs:${sessionId}:${currentDateString}`
  - `quota:bytes:${sessionId}:${currentDateString}`
- **Atomic Initialization**:
  - When incrementing a counter for the first time in a day, set the key TTL to expire at UTC midnight $+ 3600\text{s}$ (grace window), or a flat 86400 seconds (24h).
  - Use Redis `MULTI` / `EXEC` or Lua scripts to ensure atomicity between `INCR` and `EXPIRE`.

### 6.2 Pre-handler Guard Integration
- **Upload Route (`POST /api/upload`)**:
  - Extract incoming file size.
  - Query current `quota:bytes`. If $(current + sizeBytes) > MAX\_BYTES$, abort immediately with HTTP 413 `QUOTA_EXCEEDED` before generating presigned S3 URLs.
  - Increment byte counter atomically upon successful validation.
- **Job Route (`POST /api/jobs`)**:
  - Query current `quota:jobs`. If $current \ge MAX\_JOBS$, abort with HTTP 403 `QUOTA_EXCEEDED`.
  - Increment job counter by 1 upon job enqueue.

### 6.3 Quota Inquiry Route (`GET /api/quota`)
- Returns `QuotaResponse` structure:
  ```json
  {
    "session": "sess_89f0a2e5-7d4b-4832-843c-6238b31a1001",
    "quota": {
      "jobsUsedToday": 4,
      "jobsLimitToday": 20,
      "bytesUsedToday": 52428800,
      "bytesLimitToday": 524288000
    },
    "resetsAt": "2026-10-28T00:00:00.000Z"
  }
  ```

---

## 7. UI Specification
- Embedded in `<Header>` right action tray:
  - `<QuotaMeter>`: Compact pill button displaying a mini progress ring or horizontal bar with label: `4 / 20`.
  - Color state: Neutral foreground for $< 80\%$ usage, warning amber for $80–99\%$, destructive red when $100\%$ limit reached.
  - Interactive Tooltip: Displays breakdown of daily jobs and bandwidth used, along with exact time until reset ("Resets in 7 hours").
- If user attempts action when quota is exhausted:
  - Accessible modal or banner: "Daily Free Quota Reached. Your quota resets at UTC midnight."

---

## 8. API / Data Contract
- **Route**: `GET /api/quota`
- **Error Response (when limit exceeded)**: `403 Forbidden`
  ```json
  {
    "error": {
      "code": "QUOTA_EXCEEDED",
      "message": "You have reached your daily processing limit (20 jobs / day). Quota resets at midnight UTC."
    }
  }
  ```

---

## 9. Security & Validation
- **Race Condition Prevention**: Enforce usage counters via atomic Redis operations to prevent concurrent request race attacks.
- **Session Integrity**: Session cookies are signed HMAC tokens, preventing clients from spoofing new session IDs without clearing cookies.

---

## 10. Performance
- Quota check latency: $< 2\text{ ms}$ (Redis in-memory lookup).
- Zero database overhead or disk locking.

---

## 11. Step-by-Step Implementation Order
1. Build `quota.service.ts` with Redis atomic increment and TTL helpers.
2. Build `quota-guard.ts` Fastify pre-handler hook.
3. Attach quota check to `POST /api/upload` and `POST /api/jobs`.
4. Implement `GET /api/quota` route.
5. Build `useQuota` React hook and `<QuotaMeter>` component.
6. Mount `<QuotaMeter>` in the global header and verify real-time consumption updates.

---

## 12. Acceptance Criteria
- [ ] Submitting a job increments the session's Redis job counter.
- [ ] Uploading a file increments the session's byte counter by exact payload size.
- [ ] Once 20 jobs are dispatched, subsequent `POST /api/jobs` requests are rejected with 403 `QUOTA_EXCEEDED`.
- [ ] Quota keys expire automatically after 24 hours.
- [ ] Frontend `<QuotaMeter>` accurately reflects remaining daily allowances.

---

## 13. Test Scenarios
- Test: Dispatch 20 jobs $\rightarrow$ verify job 21 receives HTTP 403 `QUOTA_EXCEEDED`.
- Test: Upload file exceeding remaining daily bandwidth $\rightarrow$ verify request rejected before S3 URL generation.
- Test: Verify `GET /api/quota` returns formatted reset timestamp matching next UTC midnight.

---

## 14. Definition of Done
- Ephemeral quota enforcement operating flawlessly in memory.
- No database tables or billing systems added.
- Full unit and integration test coverage with 0 lint errors.
