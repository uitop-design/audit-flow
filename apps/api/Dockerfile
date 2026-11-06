# syntax=docker/dockerfile:1.7
# Build context: the repository root (the API is part of a pnpm workspace).

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

# --- Build: install from the lockfile, generate the Prisma client, compile ---
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Download packages using only the lockfile, so this layer is cached until dependencies change.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter @auditflow/api
RUN pnpm --filter @auditflow/api build
# A self-contained copy of the API package with production dependencies only.
# --no-optional: @prisma/client lists the Prisma CLI and TypeScript as optional peers, and the
# lockfile records them as its optional dependencies because they exist in development. Nothing
# needs them at runtime; including them would add roughly 300 MB to the image.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @auditflow/api deploy --prod --no-optional --legacy /prod/api

# --- Runtime: compiled output and production dependencies, running as a non-root user ---
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/api/package.json ./package.json
COPY --from=build --chown=node:node /prod/api/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/v1/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/main.js"]
