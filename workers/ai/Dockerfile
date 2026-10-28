# Multi-stage production Dockerfile for @imagelabs/worker-ai
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY workers/ai/ ./workers/ai/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @imagelabs/worker-ai build

FROM python:3.10-slim AS runner

# Install Node.js runtime and system image dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.12.3

WORKDIR /app
ENV NODE_ENV=production

# Install Python requirements
COPY workers/ai/python/requirements.txt ./workers/ai/python/
RUN pip install --no-cache-dir -r ./workers/ai/python/requirements.txt

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/workers/ai/package.json ./workers/ai/
COPY --from=builder /app/workers/ai/dist ./workers/ai/dist
COPY workers/ai/python/ ./workers/ai/python/

RUN pnpm install --prod --frozen-lockfile

CMD ["node", "workers/ai/dist/index.js"]
