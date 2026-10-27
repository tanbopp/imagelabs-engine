# Phase 02: Fastify API Setup & Stateless Session Authentication

## 1. Phase Title & Goal
- **Phase Title**: Phase 02 — Fastify API Setup & Stateless Session Authentication.
- **Goal**: Initialize the `apps/api` Fastify backend service with strict TypeScript typing, Redis connectivity (`ioredis`), stateless JWT session management via secure `httpOnly` cookies, sliding window rate limiting, standardized Zod error envelopes, and basic health check endpoints.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 00 (Monorepo setup, local Redis container) and `@imagelabs/shared` (Error codes, schemas).
- **Core Principle**: Absolute "No Database" policy. Identity is entirely encapsulated within signed JWTs and ephemeral Redis keys.

---

## 3. Scope

### In-Scope
- Fastify server configuration with plugins: `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`.
- Dedicated Redis connection client managing Redis operations via `ioredis`.
- Stateless Session Endpoint: `POST /api/session` generating/refreshing a secure session JWT.
- Authentication Plugin / Hook: Verifies JWT signature and extracts anonymous `sessionId`.
- Sliding Window Rate Limiting middleware backed by Redis: 30 requests/minute per IP/endpoint.
- Global Fastify error handler transforming Zod validation errors and internal exceptions into standard `@imagelabs/shared` JSON envelopes.
- Health check route: `GET /api/health` returning system and Redis status.

### Out-of-Scope
- User registration, login tables, database schemas, or password storage.
- File upload handling (covered in Phase 03).
- Queue orchestration (covered in Phase 04).

---

## 4. Tech Stack & Libraries
- **Backend Framework**: Fastify v4/v5 + TypeScript.
- **In-Memory Store**: Redis (via `ioredis`).
- **Security & Tokens**: `jsonwebtoken` (or `jose`), `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`.
- **Validation & Schemas**: Zod + `@imagelabs/shared`.
- **Logging**: Fastify built-in Pino logger.

---

## 5. Files to Create / Modify
- `apps/api/src/server.ts`: Server factory and plugin registration.
- `apps/api/src/index.ts`: Application bootstrap and process lifecycle.
- `apps/api/src/config/env.ts`: Zod-validated environment config.
- `apps/api/src/lib/redis.ts`: Redis connection singleton with reconnection handling.
- `apps/api/src/plugins/auth.ts`: Fastify decorator validating session JWT from cookies.
- `apps/api/src/plugins/rate-limit.ts`: Redis-backed sliding window rate limiter.
- `apps/api/src/plugins/error-handler.ts`: Unified error formatter.
- `apps/api/src/routes/health.ts`: Health check endpoint.
- `apps/api/src/routes/session.ts`: Session initialization route.

---

## 6. Detailed Requirements

### 6.1 Session Lifecycle & Token Management
- When a user visits ImageLabs, the frontend requests `POST /api/session`.
- If a valid `imagelabs_session` cookie already exists, the server validates the signature and returns the existing session metadata.
- If no cookie exists, generate a cryptographic UUID (`sessionId`), sign it into a JWT with 7-day expiry using `JWT_SECRET`, and attach it as a cookie:
  ```typescript
  reply.setCookie('imagelabs_session', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
  ```
- Store session birth time in Redis (`session:{id}` hash) with a 7-day TTL.

### 6.2 Sliding Window Rate Limiter
- Track request velocity using a Redis sorted set: `ratelimit:{ip}:{endpoint}`.
- Remove timestamps older than $(now - 60000ms)$.
- If remaining count $\ge 30$, return HTTP 429 with error code `RATE_LIMITED`.
- Otherwise, record current timestamp and set key TTL to 60 seconds.

### 6.3 Global Error Handling Pattern
- Intercept all errors. If instance of `ZodError`, respond with status 400 and code `INVALID_INPUT` containing field-level issues.
- If recognized `ErrorCode`, return corresponding HTTP status code.
- Fallback unhandled errors to HTTP 500 `INTERNAL` while stripping stack traces in production.

---

## 7. UI Specification
- N/A for Phase 02 (Frontend connects automatically via `apiClient` to request session on first load).

---

## 8. API / Data Contract

### Session Initialization
- **Route**: `POST /api/session`
- **Headers**: None required.
- **Response**: `200 OK`
  ```json
  {
    "sessionId": "sess_89f0a2e5-7d4b-4832-843c-6238b31a1001",
    "createdAt": "2026-10-27T10:00:00.000Z"
  }
  ```
- **Cookies Set**: `imagelabs_session=<jwt>`

### Health Check
- **Route**: `GET /api/health`
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "redis": "connected",
    "timestamp": "2026-10-27T10:00:00.000Z"
  }
  ```

---

## 9. Security & Validation
- Signed cookies prevent client forgery of `sessionId`.
- CORS configured strictly to allow only authorized frontend origins in production.
- `@fastify/helmet` enables default security headers (HSTS, X-Content-Type-Options, etc.).
- No plain session IDs or secrets transmitted in URLs or logs.

---

## 10. Performance
- Session validation hook latency: $< 1\text{ ms}$ (pure cryptographic verification, zero network I/O if token is self-contained).
- Health check latency: $< 5\text{ ms}$ including Redis ping.

---

## 11. Step-by-Step Implementation Order
1. Setup environment configuration validator in `apps/api/src/config/env.ts`.
2. Implement Redis client singleton with retry strategy in `apps/api/src/lib/redis.ts`.
3. Implement Fastify error handler mapping errors to `@imagelabs/shared` error codes.
4. Implement stateless session plugin and `POST /api/session` endpoint.
5. Implement Redis sliding-window rate limit hook.
6. Implement `GET /api/health` route.
7. Write unit tests with Fastify `inject()` harness.

---

## 12. Acceptance Criteria
- [ ] `POST /api/session` sets an `httpOnly` secure cookie containing a signed JWT.
- [ ] Subsequent requests without cookie receive 401 when accessing protected endpoints.
- [ ] Rapid requests exceeding 30 req/min return 429 `RATE_LIMITED`.
- [ ] Malformed payload sent to API returns 400 `INVALID_INPUT` in standardized JSON format.
- [ ] `GET /api/health` returns status `ok` and verified Redis connectivity.

---

## 13. Test Scenarios
- Test: Request `POST /api/session` $\rightarrow$ inspect `set-cookie` header.
- Test: Tamper with cookie signature $\rightarrow$ expect 401 `NO_SESSION`.
- Test: Dispatch 35 consecutive requests in 5 seconds $\rightarrow$ verify requests 31-35 return 429.
- Test: Terminate Redis container $\rightarrow$ `GET /api/health` reports status degraded.

---

## 14. Definition of Done
- Fastify server boots locally with `pnpm dev`.
- 100% test pass on Fastify route integration tests.
- Strictly no relational database or Prisma involved.
