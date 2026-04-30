# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm/Turbo monorepo:

- `apps/admin`: Vue 3 + Vite admin frontend. Pages are in `src/pages`, reusable UI in `src/components`, Pinia stores in `src/stores`, and generated API clients in `src/client`.
- `apps/server`: Hono API running on Bun. Feature modules live in `src/modules/<domain>` with `*.route.ts`, `*.handler.ts`, `*.service.ts`, `*.schema.ts`, and `*.openapi.ts`.
- `apps/server/prisma`: Prisma schema, migrations, and seed data.
- `packages/typescript-config`: shared TypeScript configuration.

Do not hand-edit `apps/admin/src/client`; update OpenAPI definitions and regenerate it.

## Build, Test, and Development Commands

Use Node `>=20`, pnpm `10.27.0`, and Bun.

- `pnpm install`: install dependencies and generate Prisma client.
- `pnpm dev`: run all dev tasks through Turbo.
- `pnpm --filter @hono-vite-admin/admin dev`: start the frontend Vite dev server.
- `pnpm --filter @hono-vite-admin/server dev`: start the Bun API server with hot reload.
- `pnpm build`: build all packages.
- `pnpm lint`: run ESLint across the workspace.
- `pnpm check-types`: run TypeScript checks.
- `pnpm openapi-ts`: regenerate the admin API client.
- `pnpm prisma:reset`: regenerate Prisma, reset migrations, push schema, and seed the database.

## Coding Style & Naming Conventions

The repo uses TypeScript, ESLint 9, `@antfu/eslint-config`, and Prettier. Match existing style: 2-space indentation, single quotes, and no semicolons.

Use `PascalCase.vue` for reusable Vue components, `kebab-case` for page/component directories, and domain-oriented server modules such as `system.service.ts`. Keep DTO validation in Zod schemas and route docs in `*.openapi.ts`.

## Testing Guidelines

Frontend tests use Vitest and live beside source files as `*.test.ts`. Server tests use Bun test. Integration tests are named `*.integration.test.ts`.

Run focused checks when possible:

- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm --filter @hono-vite-admin/admin test:unit`
- `pnpm --filter @hono-vite-admin/server test:unit`

Add tests for service logic, permissions, read-only behavior, pagination, and UI utilities when changing those areas.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit-style subjects such as `feat: system configuration`, `fix: integration test failed`, and `test: mock app config prisma access`. Keep commits short and scoped to one change.

PRs should include a summary, linked issue when applicable, test commands run, and screenshots for visible admin UI changes. Call out Prisma migrations, seed changes, new environment variables, and regenerated OpenAPI client output.

## Security & Configuration Tips

Keep secrets out of git. Server deployments require `DATABASE_URL`, `JWT_SECRET`, token expiry settings, and admin bootstrap credentials. Frontend deployments require `VITE_API_BASE_URL`. Use `READ_ONLY_MODE=true` for demos that block writes.
