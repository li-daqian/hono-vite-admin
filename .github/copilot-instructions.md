# Copilot Instructions for hono-vite-admin

## Architecture Overview
This is a monorepo admin application with a Hono-based API server and shared TypeScript/ESLint configurations.

- **Server App** (`apps/server/`): REST API using Hono framework with Zod OpenAPI validation, Prisma ORM for PostgreSQL database
- **Shared Packages** (`packages/`): ESLint and TypeScript configurations using @antfu/eslint-config
- **Build System**: Turborepo for monorepo orchestration, pnpm for package management, Bun for server runtime

## Key Components
- **API Routes**: Defined in `apps/server/src/routes/` using `createRoute` from @hono/zod-openapi
- **Schemas**: Zod schemas in `apps/server/src/schemas/` for request/response validation and OpenAPI docs
- **Services**: Business logic in `apps/server/src/service/` with Prisma client operations
- **Database**: Prisma schema in `apps/server/prisma/schema.prisma`, generated client in `apps/server/generated/prisma/`
- **Middleware**: Global middlewares in `apps/server/src/middleware/` (error handling, logging, request ID)

## Developer Workflows
- **Install**: `pnpm install` (uses pnpm@9.0.0, Node >=20)
- **Dev Server**: `pnpm dev` (runs `turbo dev --filter=server`, uses `bun run --hot src/index.ts`)
- **Build**: `pnpm build` (runs `turbo build`, server builds with `bun build --outdir dist --target bun`)
- **Lint**: `pnpm lint` (runs `turbo lint`, uses @antfu/eslint-config)
- **Type Check**: `pnpm check-types` (runs `turbo check-types`)
- **Database Reset**: `cd apps/server && pnpm dev:prisma:reset` (generates client, resets DB, seeds data)

## Conventions & Patterns
- **Imports**: Use `@server/src/` path alias for server app imports (configured in tsconfig)
- **API Validation**: Always pair Zod schemas with OpenAPI route definitions for automatic docs
- **Error Handling**: Throw custom errors from `apps/server/src/common/exception.ts`, handled by global middleware
- **Responses**: Use `okResponse()` wrapper from `apps/server/src/common/response.ts`
- **Database IDs**: Use ULID (not UUID) for primary keys as per Prisma schema
- **Password Hashing**: Use bcryptjs with per-user salt stored in DB
- **OpenAPI Docs**: Available at `/docs` endpoint with Swagger UI

## Common Patterns
- Route definition example:
  ```typescript
  const route = createRoute({
    method: 'post',
    path: '/api/user',
    request: { body: { content: { 'application/json': { schema: UserSchema } } } },
    responses: { 200: { content: { 'application/json': { schema: ResponseSchema } } } },
    tags: ['User']
  })
  api.openapi(route, handler)
  ```
- Service method example:
  ```typescript
  async createUser(data: UserCreateRequest): Promise<UserCreateResponse> {
    const user = await prisma.user.create({ data: { ... } })
    return { ...user } // Omit sensitive fields
  }
  ```

## Database & Prisma
- **Provider**: PostgreSQL with Prisma relation mode
- **Migrations**: Use `prisma migrate dev` for development schema changes
- **Client Generation**: Run `prisma generate` after schema changes (output to `generated/prisma/`)
- **Seeding**: Data seeding in `apps/server/prisma/seed.ts`

## File Structure Examples
- New API endpoint: Add route in `routes/`, schema in `schemas/`, service method in `service/`
- Database model: Update `prisma/schema.prisma`, run migrations, regenerate client
- Shared config: Add to `packages/eslint-config/` or `packages/typescript-config/`, reference as `workspace:*`</content>
<parameter name="filePath">/home/lidaqian/code/hono-vite-admin/.github/copilot-instructions.md
