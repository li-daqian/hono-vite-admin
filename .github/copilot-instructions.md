# Copilot Instructions for hono-vite-admin

## Build, test, and lint commands

- Install dependencies from the repo root with `pnpm install` (Node `>=20`, root `packageManager` is `pnpm@10.27.0`).
- Run both apps in development with `pnpm dev`.
- Run only the admin app with `pnpm --filter @hono-vite-admin/admin dev`.
- Run only the server app with `pnpm --filter @hono-vite-admin/server dev`.
- Build everything with `pnpm build`.
- Lint everything with `pnpm lint`.
- Run the repo test pipeline with `pnpm test`. Today that mainly runs the server Bun test task; the admin package uses Vitest but does not expose a package-level `test` script yet.
- Run server tests directly with `pnpm --filter @hono-vite-admin/server test`.
- Run a single server test file with `pnpm --filter @hono-vite-admin/server exec bun test src/utils/date.test.ts`.
- Run a single admin test file with `pnpm --filter @hono-vite-admin/admin exec vitest run src/lib/utils.test.ts`.
- Run autofix linting per package with `pnpm --filter @hono-vite-admin/admin lint:fix` or `pnpm --filter @hono-vite-admin/server lint:fix`.
- Run the existing type-check pipeline with `pnpm check-types`. The server has a dedicated `check-types` script; the admin app performs type-checking as part of `pnpm --filter @hono-vite-admin/admin build` via `vue-tsc -b`.
- Reset and reseed the database with `pnpm prisma:reset` from the repo root, or `pnpm --filter @hono-vite-admin/server prisma:reset`.
- Regenerate the admin API client after server OpenAPI changes with `pnpm openapi-ts` from the root, or `pnpm --filter @hono-vite-admin/admin openapi-ts`.

## High-level architecture

This is a Turborepo monorepo with two main apps:

- `apps/server`: Bun + Hono API server with OpenAPI generated from Zod route definitions and Prisma/PostgreSQL for persistence.
- `apps/admin`: Vue 3 + Vite admin SPA that consumes the generated OpenAPI client.

The API server entry point is `apps/server/src/index.ts`. Requests pass through global middleware in a fixed order: CORS, async context storage, request ID assignment, and per-request tracing/logger setup. The app mounts two versioned APIs at `/api/v1` and `/api/v2`, and Swagger is configured from those OpenAPI documents rather than from a single hand-maintained route registry.

Versioned APIs are assembled in `apps/server/src/openapi/v1.ts` and `apps/server/src/openapi/v2.ts`. New server modules are mounted there. `createApi()` in `apps/server/src/openapi/openapi.ts` centralizes the OpenAPIHono setup and converts Zod validation failures into `BusinessError.BadRequest(...)`, so route handlers should rely on that flow instead of adding parallel validation/error plumbing.

The main full-stack contract is OpenAPI-driven. Server route/schema changes flow into `apps/admin/openapi-ts.config.ts`, which generates `apps/admin/src/client/`. Frontend code should call generated functions and use generated schema/types instead of hand-writing request shapes.

The admin app boots in `apps/admin/src/main.ts`: it configures the generated client through `setupAxios()`, installs Pinia with persisted state, loads dynamic routes from menu data, and then mounts the router. The axios integration in `apps/admin/src/lib/axios.ts` is the central place for auth headers, refresh-token retries, toast error handling, and generated-client validation error surfacing.

Authorization and navigation are menu-driven. The backend seeds menu/action IDs in `apps/server/prisma/seed.ts`, exposes permitted menus/actions through auth endpoints, and the frontend stores them in `apps/admin/src/stores/menu.ts`. `apps/admin/src/router/dynamic-routes.ts` turns those menus into Vue Router routes, while `apps/admin/src/router/route-meta.ts` maps stable menu IDs such as `dashboard`, `access.users`, and `access.roles` to actual page components and icons. When adding a new navigable page, backend menu IDs, seeded permissions, and frontend `routeMetaConfigMap` need to stay aligned.

The auth lifecycle spans both apps. The server issues access tokens plus refresh tokens, stores refresh tokens in the database, and supports refresh via cookie/body. The admin client retries `401` responses by calling `postAuthRefresh`, deduplicates concurrent refreshes in `useAuthStore`, and then retries the original request. Protected routes depend on `router.beforeEach()` calling `useAuthStore().fetchMe()`, which refreshes first and then loads the current user.

## Key conventions

- Use the path aliases already configured in each app: `@server/src/...` on the server and `@admin/...` in the admin app.
- On the server, prefer module-oriented files under `apps/server/src/modules/*` and mount module apps in `openapi/v1.ts` or `openapi/v2.ts` instead of wiring routes ad hoc in `index.ts`.
- Server endpoints are expected to use Zod/OpenAPI route definitions plus `api.openapi(...)`; keep request/response typing in schemas and generated clients, not in duplicated manual DTOs.
- Throw `BusinessError` variants from `apps/server/src/common/exception.ts` for expected application failures so the shared error middleware can log and shape the JSON response consistently with `requestId`.
- Prisma uses `relationMode = "prisma"` and string IDs. Do not assume database-level foreign key enforcement when changing relations.
- Menu and action permissions are modeled separately. Backend permission assignment APIs exchange `{ menuIds, actionIds }`, and admin permission UIs should preserve that contract even if they use richer internal view models.
- Seeded menu IDs are meaningful application identifiers, not incidental database values. Frontend dynamic route mapping depends on those IDs remaining stable across seed, permissions, and `routeMetaConfigMap`.
- In the admin app, keep side effects concentrated in shared infrastructure layers like axios interceptors and stores. Existing stores are intentionally small; avoid moving request retry/logout behavior into random page components.
- The admin menu store persists menus to `localStorage`, so route-building code should assume menu data may already exist before the first network fetch in a session.
- When server OpenAPI changes affect the frontend contract, regenerate `apps/admin/src/client/` instead of editing generated files by hand.
- Vue components use `<script setup>` and existing UI building blocks under `apps/admin/src/components/ui/`. Prefer following nearby component patterns instead of introducing a different composition style.
