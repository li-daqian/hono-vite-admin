# Copilot Instructions for hono-vite-admin

- **Repo shape**: Turborepo monorepo. Admin UI in `apps/admin` (Vue 3 + Vite + Tailwind v4). API server in `apps/server` (Hono + Zod OpenAPI + Prisma on PostgreSQL, Bun runtime). Shared configs live under `packages/`.

- **Top commands**
  - Install: `pnpm install` (Node >=20, pnpm@9).
  - Root dev/build/lint/types: `pnpm dev|build|lint|check-types` (Turbo fan-out).
  - Admin dev: `pnpm --filter @hono-vite-admin/admin dev` (Vite). Build: `pnpm --filter @hono-vite-admin/admin build`.
  - Server dev: `pnpm --filter @hono-vite-admin/server dev` (Bun hot). Test: `pnpm --filter @hono-vite-admin/server test`. Lint/types: `pnpm --filter @hono-vite-admin/server lint|check-types`.
  - DB reset/seed: `cd apps/server && pnpm prisma:reset` (runs generate, migrate reset, db push, seed). Use PostgreSQL URL in `DATABASE_URL`.

- **API server architecture (apps/server)**
  - Entry: `src/index.ts` wires Hono app with middlewares (`cors`, `holdContext` via AsyncLocalStorage, `requestId`, `traceLogger`, `authMiddleware`), 404 and `onErrorHandler`, then mounts `api` from `src/openai.ts`.
  - OpenAPI wiring: `src/openai.ts` creates `OpenAPIHono` with `defaultHook` throwing `BadRequestError` on Zod validation failures; registers `/openapi.json` and `/docs` in non-production; mounts `authRoute` and `userRoute`.
  - Routes pattern: define `createRoute` with Zod schemas (`schemas/*`), then `api.openapi(route, handler)`; responses go through `okResponse()` to embed `requestId`.
  - Error flow: Throw `HttpStatusError` subclasses from `common/exception.ts`; `onErrorHandler` logs (pino) and maps to `errorResponse()` or 500 via `internalServerErrorResponse()`.
  - Auth: `authMiddleware` skips login/refresh routes, otherwise pulls access token via `lib/jwt`, resolves user context, and sets it on Hono context. Use `getLoginUser()` when a handler needs the authenticated user. Tokens and expiry configured via env (`JWT_SECRET`, `TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`).
  - Logging/request tracing: `traceLogger` attaches a per-request pino logger keyed by `requestId` (from `hono/request-id`). Use `logger()` and `requestId()` helpers from the middleware.
  - Path alias: server imports use `@server/src/...` (tsconfig paths). Keep this alias in new files.

- **Data layer (Prisma)**
  - Schema: `prisma/schema.prisma` uses ULID `String` IDs for all tables (`User`, `Role`, `Permission`, `Menu`, `SysConfig`, `RefreshToken`, junction tables). Relation mode `prisma`. Generated client emitted to `generated/prisma` (already checked in).
  - Seeding: `prisma/seed.ts` executed by `prisma:reset`. Keep seeds aligned with auth defaults from `common/config.ts` env values.

- **Admin UI (apps/admin)**
  - Vite + Vue 3 `<script setup>` with Tailwind v4 (via `@tailwindcss/vite`, `tw-animate-css`). Entry in `src/main.ts`; styles in `src/style.css` define CSS variables/theme and dark variant.
  - Components under `src/components`, shared utils in `src/lib/utils.ts`. Prefer class utilities (`clsx`, `tailwind-merge`, `class-variance-authority`) for styling.

- **Env expectations**
  - Server requires `DOMAIN`, `DATABASE_URL`, `LOG_LEVEL`, admin bootstrap creds (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_ROLE_NAME`), and JWT settings (`JWT_SECRET`, `TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`). Non-production exposes Swagger at `/docs`.

- **When adding features**
  - New API endpoint: add Zod schema in `schemas`, route via `createRoute` in `routes`, service logic in `service`, reuse `okResponse`/errors, and ensure middleware auth/story fits. Update OpenAPI tags accordingly.
  - Database changes: edit `prisma/schema.prisma`, run `pnpm --filter @hono-vite-admin/server prisma generate` + migrate/reset as needed, keep generated client in sync.
  - Frontend components: follow existing Tailwind utility-first style and theme tokens in `style.css`; keep dark mode compatibility.

If anything is unclear or missing for your workflow, tell me and I’ll refine these notes.
<parameter name="filePath">/home/lidaqian/code/hono-vite-admin/.github/copilot-instructions.md
