# ImageLabs

A fast, private, fully functional clone of iLoveIMG. No accounts, no database, no tracking — files auto-delete in 1 hour.

---

## Stack Summary

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend API**: Fastify + TypeScript
- **Job Processing & Queue**: BullMQ + Redis
- **Image Processing**: Sharp (Fast worker), Fabric.js (Canvas editor), Puppeteer (HTML-to-image)
- **AI Processing**: Replicate (Real-ESRGAN upscaling, RMBG / rembg background removal) + MediaPipe / OpenCV (Face Blurring)
- **Storage**: AWS S3 / MinIO with presigned URLs and 1-hour lifecycle auto-deletion
- **Ephemeral State**: Redis (ioredis) for session tracking, job hashes, and daily usage quotas
- **Database**: **No database. All state is ephemeral in Redis.**

---

## Monorepo Layout

```
imagelabs/
├── .github/workflows/           # CI and deploy pipelines
├── apps/
│   ├── web/                     # React frontend
│   └── api/                     # Fastify backend API
├── workers/
│   ├── fast/                    # Sharp-based worker
│   ├── ai/                      # AI worker (Replicate, rembg, MediaPipe/OpenCV)
│   └── puppeteer/               # HTML-to-image worker
├── packages/
│   ├── shared/                  # Types, Zod schemas, constants — used by web, api, workers
│   ├── ui/                      # (optional) extracted shadcn primitives
│   └── config/                  # Shared eslint, tsconfig, prettier
├── infra/
│   ├── terraform/               # AWS infra as code
│   ├── helm/                    # K8s charts (if EKS)
│   └── docker/docker-compose.yml# Local dev: Redis + MinIO only
├── docs/                        # architecture.md, conventions.md, design-system.md, prd/, glossary.md
├── scripts/                     # seed dev, cleanup cron, smoke test
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

---

## Prerequisites

- **Node.js**: `≥ 20.0.0` (LTS recommended)
- **pnpm**: `≥ 9.0.0`
- **Docker & Docker Compose**: For running local Redis and MinIO storage services
- **AWS S3 / S3-Compatible Bucket**: For production deployment

---

## Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *(Default values in `.env.example` work out-of-the-box for local MinIO and Redis instances).*

3. **Start local infrastructure (Redis + MinIO)**:
   ```bash
   docker compose -f infra/docker/docker-compose.yml up -d
   ```

4. **Run the development stack**:
   ```bash
   pnpm dev
   ```
   *Runs `web`, `api`, and background workers concurrently using Turborepo.*

5. **Regenerate OpenAPI documentation (Optional)**:
   ```bash
   pnpm docs:openapi
   ```

---

## Common Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts all apps and workers in local development mode with hot-reloading |
| `pnpm build` | Compiles all packages, apps, and worker bundles for production |
| `pnpm lint` | Runs ESLint across all apps and workspaces |
| `pnpm test` | Runs the Vitest test runner across all packages |
| `pnpm format` | Formats the codebase using Prettier |
| `pnpm docs:openapi` | Generates the OpenAPI 3.1 specification from shared Zod schemas |
| `pnpm clean` | Cleans build artifacts, cache directories, and node_modules |

---

## Environment Variables

All supported environment configuration variables are documented in [`.env.example`](./.env.example). Secrets must never be committed to version control. Production secrets should be injected via AWS Secrets Manager or secure deployment pipelines.

---

## Contributing Rules

Please review our [Coding Conventions](docs/conventions.md) and [Design System](docs/design-system.md) before writing code.

- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`).
- **Branches**: Structure branch names by phase or issue (`phase/<NN>-<slug>`, `fix/<slug>`, `chore/<slug>`).

---

## License

MIT
