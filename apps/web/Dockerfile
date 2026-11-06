# syntax=docker/dockerfile:1.7
# Build context: the repository root (the web app is part of a pnpm workspace).

FROM node:24-alpine AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY tsconfig.base.json ./
COPY apps/web ./apps/web
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter @auditflow/web
RUN pnpm --filter @auditflow/web build

# Static files served by an unprivileged nginx (runs as a non-root user, listens on 8080).
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
