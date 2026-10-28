# Multi-stage production Dockerfile for @imagelabs/worker-fast
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY workers/fast/ ./workers/fast/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @imagelabs/worker-fast build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/workers/fast/package.json ./workers/fast/
COPY --from=builder /app/workers/fast/dist ./workers/fast/dist

RUN pnpm install --prod --frozen-lockfile

USER node

CMD ["node", "workers/fast/dist/index.js"]
