# Phase 14: Observability, Metrics & Performance Testing

## 1. Phase Title & Goal
- **Phase Title**: Phase 14 — Observability, Metrics & Performance Testing.
- **Goal**: Implement enterprise-grade observability, structured JSON logging with Pino, Prometheus metrics collection, load testing with k6, end-to-end automated testing with Vitest and Playwright, and Lighthouse performance auditing to ensure Fast tools achieve $p95 < 200\text{ ms}$ processing latency and web vitals achieve a 95+ score.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on all functional application phases (Phases 00 through 13).
- **Focus**: Validation, telemetry, load benchmarking, and quality assurance.

---

## 3. Scope

### In-Scope
- Structured Logging:
  - Fastify and BullMQ Pino logger formatting with correlation IDs (`x-request-id`, `jobId`).
  - Redaction of sensitive fields (JWT signatures, auth headers).
- Metrics Collection:
  - Prometheus metrics exporter route: `GET /metrics` via `prom-client`.
  - Metrics tracked: HTTP request durations, active Redis connections, BullMQ queue depths, job processing latency per tool, error rates.
- Automated Testing Suites:
  - Complete Vitest unit test coverage for `@imagelabs/shared` schemas and worker processors.
  - Integration tests for Fastify API routes using `inject()`.
  - Playwright browser smoke tests for key tool flows (Compress, Resize, Meme).
- Performance & Load Testing:
  - k6 load test scripts simulating 100 concurrent users dispatching image processing jobs.
  - Verification of $p95 < 200\text{ ms}$ for Sharp image operations.
  - Lighthouse CI auditing frontend performance, accessibility, and SEO.

### Out-of-Scope
- Commercial APM vendor setups (Datadog, New Relic) — Prometheus/Pino open standards only.
- Complex distributed tracing spans (OpenTelemetry tracing reserved for cloud migration).

---

## 4. Tech Stack & Libraries
- **Logging**: Fastify built-in Pino + `pino-pretty` (dev).
- **Metrics**: `prom-client`.
- **Testing**: Vitest, `@testing-library/react`, Playwright.
- **Load Testing**: k6.
- **Auditing**: Lighthouse CI (`@lhci/cli`).

---

## 5. Files to Create / Modify
- `apps/api/src/plugins/metrics.ts`: Prometheus metrics registration and `GET /metrics` endpoint.
- `apps/api/src/lib/logger.ts`: Pino logger configuration with serializers and redaction.
- `workers/fast/src/lib/metrics.ts`: Worker queue metrics reporter.
- `scripts/loadtest/k6-job-pipeline.js`: k6 performance benchmark script.
- `playwright.config.ts`: End-to-end browser test configuration.
- `tests/e2e/tools-flow.spec.ts`: Core tools user journey test.
- `lighthouserc.json`: Lighthouse CI budget and threshold configuration.

---

## 6. Detailed Requirements

### 6.1 Prometheus Metrics Specification
The `/metrics` endpoint exports standard Prometheus format metrics:
- `http_request_duration_seconds` (Histogram): Request latency partitioned by route and status.
- `job_processing_duration_seconds` (Histogram): Worker processing time partitioned by `tool`.
- `jobs_enqueued_total` (Counter): Cumulative jobs dispatched partitioned by `tool`.
- `jobs_completed_total` (Counter) & `jobs_failed_total` (Counter).
- `bullmq_queue_waiting_jobs` (Gauge): Current backlog in `fast-jobs`, `ai-jobs`, `puppeteer-jobs`.
- `redis_connected_status` (Gauge): 1 if connected, 0 if disconnected.

### 6.2 k6 Load Benchmark Script
- Simulates realistic user behavior:
  1. Requests `POST /api/session`.
  2. Requests presigned upload `POST /api/upload`.
  3. Uploads 1MB sample JPEG to local MinIO.
  4. Dispatches `POST /api/jobs` with `tool: 'compress'`.
  5. Polls `GET /api/jobs/:id` until completed.
- **SLA Thresholds**:
  - `http_req_duration`: $p(95) < 300\text{ms}$
  - Fast tool processing duration: $p(95) < 200\text{ms}$
  - Error rate: $< 0.1\%$ under 100 virtual users (VUs) for 5 minutes.

### 6.3 Lighthouse Frontend Targets
- Performance: $\ge 95$
- Accessibility: $\ge 98$ (WCAG AA compliance)
- Best Practices: $\ge 95$
- SEO: $\ge 95$

---

## 7. UI Specification
- N/A for Phase 14 (Backend metrics and testing automation).

---

## 8. API / Data Contract

### Prometheus Metrics Endpoint
- **Route**: `GET /metrics`
- **Response**: `200 OK` (Content-Type: `text/plain; version=0.0.4`)

---

## 9. Security & Validation
- **Metrics Protection**: In production, `GET /metrics` must be restricted to internal cluster IP ranges or protected with basic auth.
- **Log Redaction**: Ensure user filenames and raw query parameters containing potential tokens are sanitized before logging.

---

## 10. Performance
- Pino logging overhead: Asynchronous logging adds $< 0.1\text{ ms}$ per request.
- Prometheus scraping overhead: Negligible ($< 5\text{ ms}$ per scrape).

---

## 11. Step-by-Step Implementation Order
1. Configure structured logger with redaction in `apps/api/src/lib/logger.ts`.
2. Implement Prometheus metrics plugin and register HTTP duration hooks.
3. Add worker job duration and queue depth metrics tracking.
4. Write k6 load test script in `scripts/loadtest/k6-job-pipeline.js`.
5. Configure Playwright and write end-to-end smoke tests for upload and processing.
6. Configure Lighthouse CI thresholds and verify audit scores.

---

## 12. Acceptance Criteria
- [ ] `GET /metrics` returns valid Prometheus formatted data.
- [ ] k6 load test runs 100 concurrent users with zero fatal worker errors.
- [ ] Fast tools achieve $p95 < 200\text{ ms}$ processing time during benchmarking.
- [ ] Playwright E2E tests pass for Compress, Resize, and Meme tools.
- [ ] Lighthouse audit scores 95+ across Performance, Accessibility, and Best Practices.

---

## 13. Test Scenarios
- Test: Run `pnpm test` $\rightarrow$ 100% of Vitest unit and integration suites pass.
- Test: Run `npx playwright test` $\rightarrow$ E2E browser flows complete without visual or console errors.
- Test: Run k6 load script against local Docker stack $\rightarrow$ verify all SLA assertions pass.

---

## 14. Definition of Done
- Complete observability stack verified.
- Load and performance SLA targets validated with reproducible test scripts.
- Ready for production CI/CD deployment in Phase 15.
