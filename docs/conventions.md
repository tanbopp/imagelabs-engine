# ImageLabs Cross-Phase Coding Conventions

## 1. Monorepo & Package Boundaries

The ImageLabs codebase is structured as a pnpm workspace orchestrated by Turborepo:

- `apps/web`: React 18 frontend application (Vite, Tailwind CSS, shadcn/ui).
- `apps/api`: Backend Fastify API handling sessions, presigned uploads, job orchestration, and quota tracking.
- `workers/fast`: High-throughput image processing worker powered by Node.js and Sharp.
- `workers/ai`: AI-driven worker handling background removal, upscaling, and face blurring (Replicate / Python bridge).
- `workers/puppeteer`: Dedicated sandboxed worker for HTML-to-image rendering.
- `packages/shared`: Universal source-of-truth package containing types, Zod schemas, error codes, and tool definitions.
- `packages/config`: Centralized ESLint, Prettier, and TypeScript configurations.

### Strict Dependency Rule
- Shared types, constants, and Zod schemas live **ONLY** in `packages/shared`.
- `apps/web` must **never** import from `apps/api` or `workers/*`.
- `apps/api` must **never** import from `apps/web` or `workers/*`.
- `workers/*` must **never** import from `apps/*`.
- All applications and workers consume shared interfaces strictly via `@imagelabs/shared`.

---

## 2. File & Symbol Naming

- **Files and Folders**: `kebab-case` (e.g., `job-progress.tsx`, `error-codes.ts`, `upload-zone.tsx`).
- **React Components**: `PascalCase` (e.g., `JobProgress`, `UploadZone`, `ToolCard`).
- **Functions & Variables**: `camelCase` (e.g., `calculateQuota`, `formatBytes`, `processImage`).
- **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE_BYTES`, `DEFAULT_QUOTA_LIMIT`).
- **Exports**: One primary exported symbol per file by default (e.g., `tool-card.tsx` exports `ToolCard`). Barrel files (`index.ts`) may re-export multiple symbols.

---

## 3. TypeScript Rules

- TypeScript `strict` mode is enabled across all workspaces (`"strict": true`).
- No usage of `any`. If an unknown payload must be handled, use `unknown` and validate with Zod or type guards.
- Any unavoidable `any` requires `// eslint-disable-next-line @typescript-eslint/no-explicit-any` accompanied by an explicit inline comment explaining the rationale.
- Prefer `type` over `interface` for object definitions unless extending third-party interfaces.

```typescript
// Correct
export type SessionPayload = {
  sessionId: string;
  createdAt: number;
};

// Incorrect
export interface SessionPayload {
  sessionId: any; // Forbidden: no any
}
```

---

## 4. Zod Usage

- Every incoming API request body, query parameter, and outgoing response payload **must** have an authoritative Zod schema defined in `packages/shared/src/schemas`.
- TypeScript types must be inferred directly from the schema using `z.infer<typeof Schema>` rather than written independently.
- Never duplicate schemas or definitions between `apps/web`, `apps/api`, or `workers`.
- Every schema intended for public REST documentation must include `.openapi()` metadata descriptors.

```typescript
import { z } from 'zod';

export const UploadRequestSchema = z.object({
  filename: z.string().min(1).openapi({ example: 'photo.jpg' }),
  mimeType: z.string().regex(/^image\//).openapi({ example: 'image/jpeg' }),
  sizeBytes: z.number().int().positive().openapi({ example: 204800 }),
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;
```

---

## 5. Error Handling Pattern

- All API errors adhere to a standardized response envelope:
  ```json
  {
    "error": {
      "code": "INVALID_INPUT",
      "message": "The provided image format is not supported.",
      "details": {
        "field": "mimeType"
      }
    }
  }
  ```
- Error codes must use values defined in `@imagelabs/shared/constants/error-codes`.
- The frontend must consume API routes using a centralized `apiClient` wrapper that intercepts non-2xx responses and throws a typed `ApiError` class.
- **Security Rule**: Never leak internal exception messages, database strings, or stack traces to the client in production responses.

---

## 6. Import Order

Imports must follow this standardized hierarchy, enforced via ESLint:

1. External Node.js and npm packages (e.g., `react`, `fastify`, `zod`).
2. Workspace packages (e.g., `@imagelabs/shared`).
3. Internal aliases and relative imports (e.g., `~/components/ui/button`, `./job-card`).
4. Static assets and CSS styles (e.g., `./styles.css`).

```typescript
import * as React from 'react';
import { z } from 'zod';

import { ErrorCode, TOOLS } from '@imagelabs/shared';

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/formatters';

import '@/styles/globals.css';
```

---

## 7. shadcn/ui Rules

- Primitive UI components must be installed via the official shadcn CLI:
  ```bash
  pnpm dlx shadcn@latest add <component>
  ```
- Do **not** hand-write or modify the underlying primitives inside `apps/web/src/components/ui/` except to map theme tokens or add variant tokens.
- Domain-specific composite components must live outside the `ui/` directory under `apps/web/src/components/<domain>/` (e.g., `apps/web/src/components/tools/tool-card.tsx`).

---

## 8. Styling Rules

- Tailwind CSS is the exclusive styling system across all web applications.
- No inline `style={{}}` attributes, except for truly dynamic runtime styles that Tailwind cannot express (e.g., dynamic CSS transform coordinates during canvas panning).
- Never hardcode arbitrary hex codes or pixel units in JSX (e.g., avoid `bg-[#123456]` or `rounded-[17px]`).
- All color, spacing, radius, and font tokens must be configured in `tailwind.config.ts` theme extensions.
- Adhere strictly to the flat design language: no shadows (`shadow-none`) and full rounded borders (`rounded-2xl`, `rounded-full`).

---

## 9. API Route Conventions

- Fastify API routes must be modularized with one file per resource under `apps/api/src/routes/` (e.g., `routes/jobs.ts`, `routes/upload.ts`, `routes/quota.ts`).
- Every route file must export an encapsulated Fastify plugin function:
  ```typescript
  import { FastifyPluginAsync } from 'fastify';

  export const jobsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/jobs', /* ... */);
  };
  ```
- All endpoints must be versioned under the `/api/` prefix.
- Every route handler must validate request payloads against `@imagelabs/shared` schemas using pre-validation hooks or schema validators.

---

## 10. Worker Conventions

- Processor logic must be decomposed into one file per tool under:
  - `workers/fast/src/processors/<tool-id>.processor.ts`
  - `workers/ai/src/processors/<tool-id>.processor.ts`
  - `workers/puppeteer/src/processors/<tool-id>.processor.ts`
- Each processor must be a pure, isolated asynchronous function with the signature:
  ```typescript
  export async function processCompress(job: JobContext): Promise<JobOutput> {
    // Pure processing logic
  }
  ```
- Workers must never directly access client sessions or application databases. Workers read input files exclusively from S3 using presigned keys provided in the BullMQ job payload, execute their transformations, write outputs back to S3, and return results.

---

## 11. Commit Message Format

All git commits must follow the **Conventional Commits** specification:

```
<type>(<scope>): <short description>
```

- **Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`.
- **Scope**: Target package or phase identifier (e.g., `shared`, `web`, `api`, `fast-worker`, `phase-0`, `phase-1`).
- **Examples**:
  - `feat(api): implement presigned upload endpoint`
  - `fix(fast-worker): handle transparent webp compression edge case`
  - `docs(conventions): clarify worker pure function contract`

---

## 12. Branch Naming

Branch names must clearly indicate intent and scope:

- Phase deliverables: `phase/<NN>-<slug>` (e.g., `phase/01-foundation-setup`, `phase/02-fast-tools`)
- Bug fixes: `fix/<slug>` (e.g., `fix/s3-presigned-expiry`)
- Chore / Refactor: `chore/<slug>` (e.g., `chore/bump-sharp-version`)

---

## 13. Testing

- Every phase and major feature must include automated test coverage before merging.
- **Unit & Component Tests**: Powered by Vitest. Located adjacent to source files in `*.test.ts` or `*.test.tsx`.
- **API Integration Tests**: Fastify routes tested using the lightweight `fastify.inject()` harness without spinning up external HTTP listeners.
- **Worker Processor Tests**: Validated using real static test image fixtures located under `packages/shared/src/__fixtures__/` (e.g., sample PNGs, JPGs, WebPs).
- Mock external network calls (Replicate, S3 presigned operations) using MSW or Vitest mocks.
