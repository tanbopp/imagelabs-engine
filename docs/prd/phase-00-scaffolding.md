# Phase 00: Monorepo Scaffolding & Developer Infrastructure

## 1. Phase Title & Goal
- **Phase Title**: Phase 00 — Monorepo Scaffolding & Developer Infrastructure.
- **Goal**: Initialize the complete monorepo foundation using pnpm workspaces, Turborepo, TypeScript base configurations, ESLint, Prettier, and local developer environment orchestration (Docker Compose with Redis and MinIO). Ensure `@imagelabs/shared` is fully configured and importable by all apps and workers.

---

## 2. Context & Dependencies
- **Initial State**: Greenfield workspace following the architecture blueprint and conventions defined in `docs/architecture.md` and `docs/conventions.md`.
- **Target Downstream Consumers**: All subsequent phases (Phases 01 through 15) depend on this core workspace topology.

---

## 3. Scope

### In-Scope
- Root configuration: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`.
- Packages configuration:
  - `packages/shared`: Shared types, constants, and Zod schemas (already initiated).
  - `packages/config`: Centralized configs for ESLint, Prettier, and TypeScript.
- Workspace directory layout for `apps/` (`web`, `api`), `workers/` (`fast`, `ai`, `puppeteer`), `infra/`, and `scripts/`.
- Local infrastructure containerization (`infra/docker/docker-compose.yml`) providing Redis (ioredis backend) and MinIO (S3 compatible object store with bucket auto-initialization).
- Root developer scripts for linting, typechecking, running dev servers, and cleaning artifacts.

### Out-of-Scope
- Implementing application features, React pages, or Fastify route handlers (covered in subsequent phases).
- Production cloud infrastructure (Terraform / Helm covered in Phase 15).

---

## 4. Tech Stack & Libraries
- **Package Manager**: pnpm (v9+).
- **Monorepo Build System**: Turborepo (v2+).
- **Runtime**: Node.js v20 LTS.
- **Language**: TypeScript v5.5+ (Strict mode).
- **Tooling**: ESLint v9, Prettier v3.
- **Local Dev Infra**: Docker Compose, Redis 7 (Alpine), MinIO (RELEASE.2024+).

---

## 5. Files to Create / Modify
- `package.json`: Root scripts and devDependencies.
- `pnpm-workspace.yaml`: Definition of workspace packages and apps.
- `turbo.json`: Task pipelines for `build`, `dev`, `lint`, `typecheck`, `test`, `clean`.
- `tsconfig.base.json`: Base TypeScript compiler options with strict rules.
- `.gitignore`: Standard Node, Turbo, Docker, and environment ignores.
- `.nvmrc`: Node version pinning (`20`).
- `infra/docker/docker-compose.yml`: Local Redis and MinIO with bucket creation service.
- `packages/config/package.json`, `packages/config/eslint/base.js`, `packages/config/prettier/index.js`.
- `apps/web/package.json`, `apps/api/package.json`.
- `workers/fast/package.json`, `workers/ai/package.json`, `workers/puppeteer/package.json`.

---

## 6. Detailed Requirements

### 6.1 Turborepo Pipeline Configuration
- `turbo.json` must declare the following task dependencies:
  - `build`: Depends on `^build`, outputs to `dist/**` and `.next/**` (if applicable).
  - `dev`: Persistent task, `cache: false`.
  - `lint`: Non-cached or cache on source changes.
  - `typecheck`: Runs `tsc --noEmit`.
  - `test`: Runs Vitest across workspaces.

### 6.2 Local Infrastructure (Docker Compose)
- `infra/docker/docker-compose.yml` must spin up:
  - `redis`: Image `redis:7-alpine`, ports `6379:6379`, persistent volume.
  - `minio`: Image `minio/minio`, ports `9000:9000` (API) and `9001:9001` (Console), credentials matching `.env.example` (`minioadmin` / `minioadmin`).
  - `createbuckets`: Setup container running MinIO client (`mc`) to create the bucket `imagelabs-temp` and configure 1-hour lifecycle auto-expiration.

### 6.3 Shared Package Linkage
- `@imagelabs/shared` must be referenced using `"@imagelabs/shared": "workspace:*"` in `apps/web`, `apps/api`, and `workers/*`.

---

## 7. UI Specification
- N/A for Phase 00 (Infrastructure & Scaffolding only).

---

## 8. API / Data Contract
- N/A for Phase 00.

---

## 9. Security & Validation
- `.gitignore` must strictly forbid `.env`, `.env.local`, credentials, and temporary certificates.
- MinIO and Redis instances must be bound strictly to local host networks (`127.0.0.1`) during development.

---

## 10. Performance
- Turborepo remote/local caching must achieve sub-second execution times for cached lint and typecheck tasks across the monorepo.

---

## 11. Step-by-Step Implementation Order
1. Create root `package.json`, `pnpm-workspace.yaml`, and `.nvmrc`.
2. Configure `tsconfig.base.json` with strict type rules.
3. Configure `turbo.json` with build, lint, and dev pipeline definitions.
4. Setup `packages/config` containing ESLint and Prettier shareable configurations.
5. Create package skeleton manifests for `apps/web`, `apps/api`, and `workers/*` with workspace links to `@imagelabs/shared`.
6. Write `infra/docker/docker-compose.yml` for Redis and MinIO container setup.
7. Run `pnpm install` and test `pnpm lint` and `pnpm typecheck`.

---

## 12. Acceptance Criteria
- [ ] `pnpm install` completes cleanly with no peer dependency conflicts.
- [ ] `pnpm typecheck` successfully validates all workspace packages.
- [ ] `docker compose -f infra/docker/docker-compose.yml up -d` starts Redis and MinIO without errors.
- [ ] MinIO automatically creates bucket `imagelabs-temp`.
- [ ] TypeScript imports from `@imagelabs/shared` resolve properly in dummy entrypoints.

---

## 13. Test Scenarios
- Run `pnpm turbo run typecheck` $\rightarrow$ passes without errors.
- Run `docker compose up -d` $\rightarrow$ verify Redis ping returns `PONG` via `redis-cli ping`.
- Verify MinIO responds with HTTP 200 on `http://localhost:9000/minio/health/live`.

---

## 14. Definition of Done
- Workspace boots seamlessly with `pnpm dev`.
- Turborepo cache is working properly.
- All configs adhere strictly to `docs/conventions.md`.
