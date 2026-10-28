# Multi-stage production Dockerfile for @imagelabs/worker-puppeteer
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY workers/puppeteer/ ./workers/puppeteer/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @imagelabs/worker-puppeteer build

FROM node:20-slim AS runner

# Install Chromium and headless rendering dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/workers/puppeteer/package.json ./workers/puppeteer/
COPY --from=builder /app/workers/puppeteer/dist ./workers/puppeteer/dist

RUN pnpm install --prod --frozen-lockfile

USER node

CMD ["node", "workers/puppeteer/dist/index.js"]
