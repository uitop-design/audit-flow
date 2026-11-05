# AuditFlow — Implementation Plan

Companion to [architecture.md](architecture.md) and [api-design.md](api-design.md).
Each phase ends with a verification step and a short report (what was built, files, commands, results,
open issues). A phase is not done until its exit criteria pass. Nothing is suppressed to get there.

## Phase 0 — Inspection and planning ✅

- Repository inspected: **empty directory, not a git repository.** No existing code or config to preserve.
- Toolchain found: Node 24.10, pnpm 10.28, Docker 28.5 / Compose 2.40, Git 2.50.
  A local PostgreSQL (Postgres.app) is listening on **5432**, so Docker Postgres will publish on **5433**.
- Registry checked for current versions. Deviations from `latest` are recorded in architecture §7
  (TypeScript 6 not 7, Prisma 7.10 not 8.0 RC, TanStack Table 8).
- Spike: NestJS 12 (ESM) DI test passes under Jest 30 + `@swc/jest` in ESM mode.
- Deliverables: `docs/architecture.md`, `docs/api-design.md`, `docs/implementation-plan.md`.

## Developer commands (target)

The brief's `pnpm db…` entries were truncated. They are interpreted as the `db:*` scripts below.

| Command                                    | Does                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `pnpm install`                             | Install workspace deps; generates the Prisma client (`postinstall`)     |
| `pnpm db:up` / `pnpm db:down`              | Start / stop PostgreSQL in Docker                                       |
| `pnpm db:migrate`                          | `prisma migrate dev` (create/apply migrations in development)           |
| `pnpm db:deploy`                           | `prisma migrate deploy` (apply committed migrations, used by CI/Docker) |
| `pnpm db:seed`                             | Reset and seed demo data (refuses to run with `NODE_ENV=production`)    |
| `pnpm dev`                                 | API (watch) + web (Vite) in parallel                                    |
| `pnpm build`                               | Production builds of both apps                                          |
| `pnpm lint` / `pnpm format` / `pnpm check` | Biome lint / format-write / full check (CI uses `biome ci`)             |
| `pnpm typecheck`                           | `tsc --noEmit` in every workspace                                       |
| `pnpm test`                                | API unit + integration (needs `db:up`) and web tests                    |
| `pnpm api:types`                           | Regenerate OpenAPI JSON and web TS types                                |

---

## Phase 1 — Monorepo and infrastructure

**Build**

- `git init`, `.gitignore`, `.nvmrc` (24), `.editorconfig`.
- `pnpm-workspace.yaml` (`apps/*`), root `package.json` with scripts above, `packageManager` pinned.
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `isolatedModules`.
- `biome.json`: formatter, linter (recommended), import organisation, `apps/api` override for
  decorators/`useImportType`, and generated/vendored paths ignored.
- `apps/api`: NestJS 12 ESM skeleton (Nest CLI with SWC builder), `/api/v1` prefix, minimal `AppModule`.
- `apps/web`: Vite 8 + React 19 + TS, Tailwind 4 via `@tailwindcss/vite`, `shadcn init` with path aliases,
  Vite proxy `/api → http://localhost:3000`.
- `docker-compose.yml`: `postgres:18-alpine`, named volume, healthcheck, port `5433:5432`, init script
  creating `auditflow_test`.
- Prisma 7: `prisma.config.ts`, empty schema with datasource + `prisma-client` generator, `@prisma/adapter-pg`.
- `.env.example` with documented variables.

**Verify**

- `pnpm install` clean; `pnpm db:up` → container healthy; `pnpm dev` → API answers on :3000,
  web renders on :5173 and reaches the API through the proxy.
- `pnpm check`, `pnpm typecheck`, `pnpm build` pass on the skeletons.

**Risks** Nest CLI + SWC in ESM mode. Fallback: build with `tsc` and run `node --watch dist/main.js`.

**Outcome ✅**

- Nest CLI + SWC works in ESM mode (`nest start --watch`, `nest build`). A `tsconfig.build.json` scoped to `src`
  keeps the output flat (`dist/main.js`).
- Prisma reads the root `.env` through Node's built-in `process.loadEnvFile`, so there is no `dotenv` dependency.
  It is skipped when the file is absent (CI, containers).
- shadcn initialised with the `radix-nova` preset. The `vite` template's oxlint config was removed (Biome is
  the only linter), and the web app uses the workspace's TypeScript 6 instead of the template's TypeScript 7.
- Biome also formats Markdown, YAML and CSS (Tailwind directives enabled).
- No `test` scripts yet: Jest arrives in Phase 2 and Vitest in Phase 5. A stub that exits 0 would look like a
  passing suite.

## Phase 2 — Backend foundation

**Build**

- `config/`: env schema (class-validator), `AppConfig` provider, fail-fast startup with readable errors.
- `database/`: `PrismaService` (adapter-pg pool, lazy connect, disconnect on shutdown), `DatabaseModule`.
- `bootstrap.ts`: shared setup used by `main.ts` and tests (helmet, CORS allow-list, body limit,
  versioning, validation pipe, exception filter, interceptors, shutdown hooks).
- `common/`: `RequestIdMiddleware`, `LoggingInterceptor` (no bodies), `AllExceptionsFilter`
  (uniform error body; maps 413, malformed JSON and Prisma errors), validation exception factory
  producing `details[]`.
- Swagger at `/api/docs` (+ JSON), with the trusted-environment warning in the API description.
- `health` module: `GET /api/v1/health` with DB probe → 200 / 503.
- Jest config (ESM + SWC), test app factory, `globalSetup` that runs `prisma migrate deploy` against
  `auditflow_test`.

**Tests**

- Unit: env validation (missing `DATABASE_URL`, `CORS_ORIGINS=*` rejected); exception filter output
  for HttpException / unknown error (no stack leaked).
- Integration: health 200 with DB; health 503 with an unreachable DB URL; unknown route → uniform 404;
  malformed JSON → 400 in the uniform shape; `X-Request-Id` echoed.

**Exit** tests green, Swagger reachable, app refuses to start with an invalid env.

**Outcome ✅** 29 unit and 18 integration tests pass. Deviations from the plan above:

- No `@nestjs/config`: a small `AppConfig` module is created at startup (architecture §4.7, ADR 12).
- Request logging is Express middleware, not an interceptor, so 404s and parser rejections are logged
  too. JSON parsing is a wrapped `express.json()` that converts parser failures into fixed messages,
  because Nest otherwise forwards raw parser text (ADR 13).
- No Jest `globalSetup`: Jest loads it outside its module mapper. `pnpm test:integration` first runs
  `prisma migrate deploy --config prisma.test.config.ts` (`db:test:prepare`), which uses the same
  `_test` database-name guard as the tests.
- `.env` loading uses `util.parseEnv` with explicit assignment, because `process.loadEnvFile()` does not
  reach Jest's per-file `process.env` sandbox.
- Nest's unknown-route message echoes the full URL, including the query string. It is normalised to
  the path only, matching the `path` field and the logs.
- Biome: `noStaticOnlyClass` is disabled for `*.module.ts` (Nest dynamic modules).
- Manually verified: the built API refuses invalid env with exit code 1, and Swagger UI renders under
  helmet's CSP with no console errors.

## Phase 3 — Audit event domain and API

**Build**

- Prisma model + migration, with hand-written SQL appended for CHECK constraints and the immutability trigger.
- `domain/`: `NewAuditEvent`, `AuditEvent`, `JsonObject`, `AuditEventQuery`, sort-field whitelist,
  `AuditEventRepository` port + token, `AuditEventNotFoundError`.
- `infrastructure/`: `PrismaAuditEventRepository` (append, findById, findPage with transaction,
  stats, facets), row mapper (DbNull ⇄ null, deep freeze), search escaping.
- `application/`: `RecordAuditEvent`, `ListAuditEvents`, `GetAuditEvent`, `GetAuditEventStats`,
  `GetAuditEventFacets`.
- `presentation/`: `CreateAuditEventDto`, `ListAuditEventsQueryDto`, response DTOs, custom validators
  (`@IsJsonObject`, `@MaxJsonBytes`), controller with Swagger decorators and `Location` header on 201.

**Tests**

- Unit: sort whitelist mapping; query DTO (limit bounds, `dateFrom` < `dateTo`, unknown `sortBy`, unknown param);
  create DTO (required fields, identifier patterns, IP, email, JSON object vs array, size caps,
  `id`/`createdAt` rejected); search-term escaping; mapper freezes and normalises nulls.
- Integration (real DB): create → 201 with server `id`/`createdAt` and `Location`; create → GET by id
  round-trip equality; 404 for unknown UUID; 400 for non-UUID; each filter individually and combined;
  date window boundaries (inclusive/exclusive); pagination meta incl. past-last-page and empty table;
  sorting asc/desc + stable tie-break; `search` with `%`/`_` literal; stats on empty and populated DB;
  facets; **immutability**: `PUT`/`PATCH`/`DELETE` → 404 and record unchanged, raw `UPDATE`/`DELETE`
  rejected by the trigger.
- Manual: `curl` the brief's example payload and inspect it in Swagger.

**Exit** all endpoints match `api-design.md`, all tests green, `pnpm api:types` produces web types.

**Outcome ✅** 130 unit and 83 integration tests pass. `pnpm api:types` writes `apps/api/openapi.json`
and `apps/web/src/lib/api/schema.d.ts`; both are committed. Deviations and findings:

- One `AuditEventService` instead of five use-case classes (architecture §4.1).
- **Search escaping.** The literal-`%` test showed that Prisma's `contains` does not escape LIKE
  wildcards: searching `%` matched every row. `escapeLikePattern()` fixes this.
- **Validation messages.** A smoke test showed a missing `description` reporting a length error.
  class-validator evaluates decorators bottom-up, so DTO decorators are ordered accordingly. Unit tests
  pin the messages.
- **Trigger SQLSTATE.** With `restrict_violation` (23001), Prisma reported a blocked `UPDATE` as
  "Foreign key constraint violated". A follow-up migration (`…_immutability_trigger_default_sqlstate`)
  switches the trigger to the default P0001, so the real reason ("append-only: UPDATE is not allowed")
  reaches logs. It is a follow-up migration and not an edit of the applied one, so existing databases
  upgrade without a reset.
- Prisma 7's `migrate dev` no longer runs `generate`. `pnpm db:migrate` now runs both.
- Read queries that combine statements (page + count, stats, facets) use `REPEATABLE READ`.
- `dateFrom`/`dateTo` must carry a time zone, so their meaning never depends on the server's zone.

## Phase 4 — Seed data

**Build**

- `src/seed/`: catalogue of realistic scenarios (auth sign-in/out/failed/MFA, user lifecycle, project
  CRUD, member role changes, API key create/revoke/rotate, payment settings, resource create/delete,
  system jobs with null actor) with plausible before/after snapshots, IPs, user agents, correlation IDs
  shared across multi-step flows.
- ~180 events from a seeded PRNG (mulberry32, fixed seed), so content and relative ordering are identical
  on every run. Timestamps are generated as offsets back from the seed run's "now" over 30 days, weighted
  toward recent days. A fixed absolute date would leave "last 24h" empty as the data ages.
- Strategy: **reset-and-seed** in one transaction (`TRUNCATE audit_events` + batched `createMany`).
  Re-running never duplicates. The script refuses to run when `NODE_ENV=production`.
- Seed inserts directly through Prisma with explicit historical `createdAt` values. This is a trusted
  internal tool, so the API's no-client-timestamps rule does not apply. Documented as such.

**Verify** run twice and get the same count both times; spot-check filters and facets via `curl`; health still
OK; an empty DB (after truncation) still serves the list, stats and facets correctly.

**Outcome ✅** `pnpm db:seed` resets the table and inserts 180 events: 144 flows, 28 of them multi-step
with a shared `correlationId`, across 9 event types and 30 days, with about 27 in the last 24 hours.
142 unit and 87 integration tests pass. Deviations and findings:

- The seed lives in `src/seed/` and the runner in `src/scripts/seed.ts`, not in `prisma/seed/`, so it
  builds with the API's SWC setup and is unit-tested with Jest. `db:seed` builds, then runs it with node.
- Rows are written with one `INSERT … SELECT FROM jsonb_to_recordset(…)` instead of `createMany`. That
  lets each id be `uuidv7(createdAt - clock_timestamp())`, so the time inside the UUIDv7 equals
  `createdAt` and id order equals time order, as for API-recorded events. A first version shifted
  relative to `now()` (transaction start) and drifted 12–16 ms. The integration test now asserts zero drift.
- A unit test runs every generated event through `CreateAuditEventDto` validation, so demo data can
  never contain something the ingestion API would reject.
- Demo identities use reserved example domains and RFC 5737 documentation IP ranges. Snapshots record
  card brand/last four and API-key prefixes only, never secrets. A test checks JSON keys for credentials.
- Verified manually: `NODE_ENV=production` refuses to seed (exit 1). The API responds correctly on an
  empty table (`totalPages: 0`, `topEventType: null`, 14 zero-filled days).

## Phase 5 — Frontend foundation

**Build**

- Providers: `QueryClientProvider` (sane retry/staleTime defaults; no retry on 4xx), `Toaster`, `TooltipProvider`.
- Router: data router with `AppShell` layout, routes from architecture §5.1, route-level error boundary,
  404 page.
- Layout: sidebar (Dashboard, Audit events, API docs link), mobile drawer, header with page title.
- Design tokens in `styles/` (neutral palette, one accent, semantic colors for event-type badges).
- `lib/api`: `apiFetch` (base URL, JSON, `ApiError` parsed from the uniform error body), generated types.
- Shared: `EmptyState`, `ErrorState` (retry), `PageHeader`, `CopyButton`, skeleton helpers.
- Vitest + Testing Library + MSW setup with typed fixtures.

**Verify** typecheck/lint/build pass; shell renders at mobile and desktop widths; smoke test for
routing and the 404 page.

## Phase 6 — Dashboard and audit events UI

**Build**

- Dashboard: KPI cards (total, last 24h, unique actors, top event type), event-type distribution
  (horizontal bar), 14-day volume (bar/area), recent activity list linking to details. Empty state
  when `totalEvents === 0` (shows the `curl`/seed commands to get data). Skeletons and an error state.
- Events page: `useAuditEventFilters` (Zod-parsed URL state, page reset on filter change);
  toolbar with debounced search (300 ms), event type / action / resource type selects fed by
  `/facets`, date-range popover (calendar), "More filters" RHF+Zod popover (actor ID, resource ID,
  source, correlation ID), active-filter chips, Clear filters.
- TanStack Table (manual pagination/sorting) with columns Timestamp, Actor, Action, Resource,
  Event type, Source; sortable headers only for whitelisted fields; row click and keyboard Enter open details;
  pagination footer with page size select and "x–y of total".
- Loading skeleton rows, empty state (distinguishes "no events at all" vs "no matches → clear filters"),
  error state with retry.

**Tests** loading → rows; empty (no data) vs empty (filtered); error + retry; typing in search updates
URL after debounce and refetches; selecting a filter resets page; clear filters; sort header toggles
`sortBy/sortOrder`; dashboard empty state.

## Phase 7 — Event details UI

**Build**

- Nested route `/events/:eventId` rendering a `Sheet`; closing it returns to `/events?<same params>`.
- Sections: header (action, event type badge, relative and absolute time, copyable ID), Actor, Resource,
  Request context (source, IP, user agent, correlation ID with a "show related" link that applies the
  `correlationId` filter), Description, Metadata, Changes.
- `JsonViewer`: formatted, monospace, collapsible nodes, copy button, handles large/deep values, text-only rendering.
- Before/after: side by side ≥ `lg`, stacked below. Changed top-level keys are highlighted, computed
  for display only. When one side is missing it is labelled "No previous state" or "Removed".
- Loading skeleton, 404 ("event not found") and generic error states inside the sheet.

**Tests** details render all fields; null fields show an em dash; before/after both, one-sided and
neither; copy buttons call the clipboard with the exact value; 404 state.

## Phase 8 — Quality and documentation

**Build / verify**

- Full run: `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, all green with no suppressions.
- Dockerfiles: API (multi-stage, `pnpm deploy --prod`, non-root, runs migrations via a one-off
  `migrate` service), web (build, then nginx with `/api` proxy and SPA fallback).
- Compose: `postgres` by default; `api`, `migrate`, `web` behind the `full` profile
  (`docker compose --profile full up --build`). Verify end to end in containers.
- GitHub Actions `ci.yml`: pnpm cache → `biome ci` → typecheck → Postgres 18 service →
  `db:deploy` → API tests → web tests → builds → check that generated OpenAPI types are up to date.
- README: overview, screenshots, Mermaid architecture diagram, tech stack, features, folder structure,
  setup, env vars, API examples, testing, decisions and known limitations, production/security checklist.
- Final review pass against the brief's Definition of Done, item by item.

## Definition of Done traceability

| DoD item                                    | Phase                        |
| ------------------------------------------- | ---------------------------- |
| Start whole project via documented commands | 1, 8                         |
| PostgreSQL via Docker Compose               | 1                            |
| Prisma migrations work                      | 1, 3                         |
| Demo events seeded                          | 4                            |
| Ingest via API                              | 3                            |
| Query with filters/sort/pagination          | 3, 6                         |
| Inspect individual events                   | 3, 7                         |
| No modification/deletion through the app    | 3 (tests at HTTP + DB level) |
| Dashboard shows real API data               | 6                            |
| Loading/empty/error states                  | 5, 6, 7                      |
| Backend + frontend tests pass               | 2–7, 8                       |
| Biome, TypeScript, production builds pass   | every phase, 8               |
| Swagger available                           | 2, 3                         |
| README                                      | 8                            |

## Open questions (resolved with defaults unless you say otherwise)

1. **NestJS 12 (ESM) vs 11 (CJS).** Plan: 12, since the spike succeeded. Fallback: 11 if ESM tooling
   blocks progress in Phase 1–2.
2. **Docker Postgres on host port 5433** to avoid the local Postgres.app on 5432.
3. **Strict `SCREAMING_SNAKE_CASE` for `eventType`/`action`/`resourceType`.** Could be relaxed to a
   wider charset if producers need dotted names (e.g. `user.updated`).
4. **Optional extra, not planned:** a "Send test event" dialog (RHF + Zod) in the UI that posts to
   the ingestion endpoint. Useful for demos, but it widens the UI's role, so it is left out unless requested.
