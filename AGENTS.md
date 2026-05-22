# Repository Guidelines

## Instruction Priority & Scope

These guidelines are written for AI coding agents first and remain useful to human contributors.

When instructions conflict, follow this order:

- The user's current explicit request
- This `AGENTS.md`
- Other repository documentation, inline code comments, and established local patterns
- Default tool or model behavior

Preserve repository-specific constraints over generic habits. Do not import assumptions from other projects into this monorepo.

## Working Modes

- Treat requests such as analysis, design, evaluation, code review, and troubleshooting as read-only unless the user explicitly asks for implementation.
- Treat explicit requests to change files, implement a plan, fix a bug, or add a feature as permission to edit within the requested scope.
- Before broad multi-file or cross-app changes, provide a short implementation plan that names the affected areas and intended validation.
- Do not do unrelated refactors, formatting-only passes, dependency churn, or config cleanup outside the task.

## Validation Before Change

- Verify current behavior from repository truth before editing. Inspect mounted routes, schemas, generated clients, scripts, tests, and nearby implementations instead of assuming.
- Do not invent files, commands, endpoints, generated types, environment variables, or runtime behavior.
- When API contracts change, update the server Zod/OpenAPI definitions first, regenerate `apps/admin/src/client`, and then adapt frontend callers to the generated output.
- When touching menus, permissions, or read-only behavior, trace the backend seed/auth contract and the frontend route/store wiring before changing code.
- Prefer the narrowest validation that proves the change: `pnpm lint`, `pnpm check-types`, targeted app tests, or `pnpm openapi-ts` when contract generation is involved.

## Decision & Communication Rules

- Do not guess through unclear requirements when scope, acceptance criteria, or constraints would materially change the implementation.
- If the user asks for a path that is clearly weaker than an available alternative, explain the better option and its tradeoffs before proceeding.
- Prefer root-cause fixes over surface patches that only hide symptoms.
- Keep status updates and final summaries high signal: what changed, why it changed, how it was validated, what remains unverified, and any follow-up risk.
- Do not auto-commit, push, or open a pull request unless the user explicitly asks for it.

## Definition of Done

A task is not complete until the response includes, when applicable:

- The files changed
- The core behavior or constraint that changed, and why
- The commands run for validation, or a clear note that validation was skipped
- Any required regeneration, migrations, seed changes, or environment/config updates
- Runtime or manual verification guidance for API, admin UI, permissions, or read-only behavior changes
- Remaining risks, assumptions, or follow-up work

Use only commands that exist in this repository when describing validation steps.

## Project Structure & Module Organization

This is a pnpm/Turbo monorepo with two main apps:

- `apps/admin`: Vue 3 + Vite admin frontend. Pages are in `src/pages`, reusable UI in `src/components`, Pinia stores in `src/stores`, and generated API clients in `src/client`.
- `apps/server`: Bun + Hono API server with OpenAPI generated from Zod route definitions and Prisma/PostgreSQL persistence. Feature modules live in `src/modules/<domain>` with `*.route.ts`, `*.handler.ts`, `*.service.ts`, `*.schema.ts`, and `*.openapi.ts`.
- `apps/server/prisma`: Prisma schema, migrations, and seed data.
- `packages/typescript-config`: shared TypeScript configuration.

Do not hand-edit `apps/admin/src/client`; update OpenAPI definitions and regenerate it.

The API server entry point is `apps/server/src/index.ts`. Requests pass through global middleware in this order: CORS, async context storage, request ID assignment, and per-request tracing/logger setup. Versioned APIs are mounted at `/api/v1` and `/api/v2`, assembled in `apps/server/src/openapi/v1.ts` and `apps/server/src/openapi/v2.ts`. Mount new server modules there, not ad hoc in `index.ts`.

`createApi()` in `apps/server/src/openapi/openapi.ts` centralizes `OpenAPIHono` setup and converts Zod validation failures into `BusinessError.BadRequest(...)`. Route handlers should rely on that flow instead of adding parallel validation or error plumbing.

The full-stack contract is OpenAPI-driven. Server route/schema changes flow into `apps/admin/openapi-ts.config.ts`, which generates `apps/admin/src/client/`. Frontend code should call generated functions and use generated schema/types instead of hand-writing request shapes.

The admin app boots in `apps/admin/src/main.ts`: it configures the generated client through `setupAxios()`, installs Pinia with persisted state, loads dynamic routes from menu data, and mounts the router. `apps/admin/src/lib/axios.ts` is the central place for auth headers, refresh-token retries, toast error handling, and generated-client validation error surfacing.

Authorization and navigation are menu-driven. The backend seeds menu/action IDs in `apps/server/prisma/seed.ts`, exposes permitted menus/actions through auth endpoints, and the frontend stores them in `apps/admin/src/stores/menu.ts`. `apps/admin/src/router/dynamic-routes.ts` turns menus into Vue Router routes, while `apps/admin/src/router/route-meta.ts` maps stable menu IDs such as `dashboard`, `access.users`, and `access.roles` to page components and icons. When adding a navigable page, keep backend menu IDs, seeded permissions, and frontend `routeMetaConfigMap` aligned.

## Build, Test, and Development Commands

Use Node `>=20`, pnpm `10.27.0`, and Bun.

- `pnpm install`: install dependencies and generate Prisma client.
- `pnpm dev`: run all dev tasks through Turbo.
- `pnpm --filter @hono-vite-admin/admin dev`: start the frontend Vite dev server.
- `pnpm --filter @hono-vite-admin/server dev`: start the Bun API server with hot reload.
- `pnpm build`: build all packages.
- `pnpm lint`: run ESLint across the workspace.
- `pnpm check-types`: run TypeScript checks.
- `pnpm test`: run the repo test pipeline.
- `pnpm openapi-ts`: regenerate the admin API client.
- `pnpm prisma:reset`: regenerate Prisma, reset migrations, push schema, and seed the database.
- `pnpm --filter @hono-vite-admin/server test`: run server tests.
- `pnpm --filter @hono-vite-admin/server exec bun test src/utils/date.test.ts`: run one server test file.
- `pnpm --filter @hono-vite-admin/admin exec vitest run src/lib/utils.test.ts`: run one admin test file.
- `pnpm --filter @hono-vite-admin/admin lint:fix` or `pnpm --filter @hono-vite-admin/server lint:fix`: run package-level autofix linting.
- `pnpm --filter @hono-vite-admin/server prisma:reset`: reset and reseed the database from the server package.
- `pnpm --filter @hono-vite-admin/admin openapi-ts`: regenerate the admin API client from the admin package.

## Coding Style & Naming Conventions

The repo uses TypeScript, ESLint 9, `@antfu/eslint-config`, and Prettier. Match existing style: 2-space indentation, single quotes, and no semicolons.

Use `PascalCase.vue` for reusable Vue components, `kebab-case` for page/component directories, and domain-oriented server modules such as `system.service.ts`. Keep DTO validation in Zod schemas and route docs in `*.openapi.ts`.

Use existing path aliases: `@server/src/...` on the server and `@admin/...` in the admin app.

On the server, use Zod/OpenAPI route definitions plus `api.openapi(...)`; keep request/response typing in schemas and generated clients, not duplicated manual DTOs. Throw `BusinessError` variants from `apps/server/src/common/exception.ts` for expected application failures so shared error middleware can log and shape JSON responses consistently with `requestId`.

Prisma uses `relationMode = "prisma"` and string IDs. Do not assume database-level foreign key enforcement when changing relations.

Menu and action permissions are modeled separately. Backend permission assignment APIs exchange `{ menuIds, actionIds }`, and admin permission UIs should preserve that contract even if they use richer internal view models. Seeded menu IDs are meaningful application identifiers and must remain stable across seed data, permissions, and `routeMetaConfigMap`.

In the admin app, keep side effects concentrated in shared infrastructure layers like axios interceptors and stores. The admin menu store persists menus to `localStorage`, so route-building code should assume menu data may already exist before the first network fetch in a session.

Vue components use `<script setup>` and existing UI building blocks under `apps/admin/src/components/ui/`. Prefer nearby component patterns instead of introducing a different composition style.

## Testing Guidelines

Frontend tests use Vitest and live beside source files as `*.test.ts`. Server tests use Bun test. Integration tests are named `*.integration.test.ts`.

Run focused checks when possible:

- `pnpm test`
- `pnpm --filter @hono-vite-admin/server test`
- `pnpm --filter @hono-vite-admin/server exec bun test <path>`
- `pnpm --filter @hono-vite-admin/admin exec vitest run <path>`

Add tests for service logic, permissions, read-only behavior, pagination, and UI utilities when changing those areas.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit-style subjects such as `feat: system configuration`, `fix: integration test failed`, and `test: mock app config prisma access`. Keep commits short and scoped to one change.

PRs should include a summary, linked issue when applicable, test commands run, and screenshots for visible admin UI changes. Call out Prisma migrations, seed changes, new environment variables, and regenerated OpenAPI client output.

## Security & Configuration Tips

Keep secrets out of git. Server deployments require `DATABASE_URL`, `JWT_SECRET`, token expiry settings, and admin bootstrap credentials. Frontend deployments require `VITE_API_BASE_URL`. Use `READ_ONLY_MODE=true` for demos that block writes.

In read-only mode, keep frontend write action buttons available when the user otherwise has permission. The admin UI may show the global read-only banner or read-only status badges, but it should not use read-only state to disable create, edit, delete, save, or reorder controls. Let write requests reach the API so the backend returns the standard read-only error message consistently.
