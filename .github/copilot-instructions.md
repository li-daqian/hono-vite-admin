# Copilot Instructions for hono-vite-admin

## Architecture Overview
**Turborepo monorepo**: Admin SPA in `apps/admin` (Vue 3 + Vite + Tailwind v4), API backend in `apps/server` (Hono + Zod OpenAPI + Prisma/PostgreSQL, Bun runtime). Full-stack TypeScript with shared ESLint/TypeScript configs in `packages/`.

## Essential Commands
- **Install**: `pnpm install` (Node ≥20, pnpm@9)
- **Root dev**: `pnpm dev` (both apps hot-reload)
- **Admin dev**: `pnpm --filter @hono-vite-admin/admin dev` (Vite on localhost:5173)
- **Server dev**: `pnpm --filter @hono-vite-admin/server dev` (Bun on localhost:3000, hot-reload)
- **DB reset**: `cd apps/server && pnpm prisma:reset` (generate → migrate reset → seed)
- **Build/Lint/Types**: `pnpm build|lint|check-types` (all apps via Turbo)

## API Server Patterns (apps/server)

**Request Flow**: Entry point `src/index.ts` stacks middlewares in strict order: CORS → holdContext (AsyncLocalStorage) → requestId → traceLogger → error/404 handlers. Routes mounted at `/api/v1` from `src/openapi/openapi.ts`. Auth guards applied per-route via `middleware: [authMiddleware]` in route definitions, bypassing auth for login/refresh endpoints.

**Creating API Endpoints**:
1. Define Zod schemas in `src/schemas/` with `.openapi()` metadata (example: [src/schemas/auth.schema.ts](../apps/server/src/schemas/auth.schema.ts))
2. Create route in `src/routes/` using `createRoute({ path, method, request, responses, security, middleware, tags })`
3. Register handler with `api.openapi(route, handler)`; extract body via `c.req.json<Type>()`
4. Add service logic in `src/service/` (e.g., `authService.login()`)
5. Register route function in [src/openapi/registerRoutes.ts](../apps/server/src/openapi/registerRoutes.ts)
6. Routes auto-expose at `/api/v1/openapi.json` and Swagger UI at `/docs` (non-prod only)

**Error Handling**: Throw `BusinessError` subclasses from [src/common/exception.ts](../apps/server/src/common/exception.ts) (e.g., `BusinessError.Unauthorized()`, `BusinessError.BadRequest()`). Middleware's `onErrorHandler` catches, logs via pino, returns JSON error with `requestId` for tracing.

**Authentication**: [src/middleware/auth.middleware.ts](../apps/server/src/middleware/auth.middleware.ts) extracts bearer token from `Authorization` header, verifies via `jwtService.verifyAccessToken()`. Sets `authPayload` on context; retrieve in handlers via `getLoginUser()`. Use `security: [{ Bearer: [] }]` and `middleware: [authMiddleware]` in route config. Tokens: access (short-lived, `TOKEN_EXPIRY`), refresh (long-lived, stored in DB & httpOnly cookie, `REFRESH_TOKEN_EXPIRY`).

**Logging & Tracing**: Each request gets UUID `requestId` and per-request pino logger from `traceLogger`. Access logger via `logger()` helper; include `requestId` in responses for request tracing. Log level via `LOG_LEVEL` env.

**Path Alias**: Use `@server/src/...` imports (tsconfig.json configured).

## Database (Prisma)
- **Schema** ([apps/server/prisma/schema.prisma](../apps/server/prisma/schema.prisma)): ULID string IDs, `relationMode = "prisma"` (no DB-level FK constraints)
- **Models**: User (with status, salt for bcrypt), Role, Permission, Menu, Action, RefreshToken; junction tables for m2m relations
- **Generated client** in `generated/prisma/` (committed, regenerated via `prisma generate`)
- **Seeding** ([apps/server/prisma/seed.ts](../apps/server/prisma/seed.ts)): Runs on `prisma:reset`; bootstraps admin user from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_ROLE_NAME`, `ADMIN_EMAIL`)
- **Password hashing**: bcryptjs with per-user salt; verify via `bcrypt.hash(input, user.salt) === user.password`

## Admin UI Patterns (apps/admin)

**Build & Code Generation**: Vite config ([vite.config.ts](../apps/admin/vite.config.ts)) includes `@tailwindcss/vite` plugin. OpenAPI client generator ([openapi-ts.config.ts](../apps/admin/openapi-ts.config.ts)) reads `/api/v1/openapi.json` → generates `src/client/` (run manually after server changes: `cd apps/admin && pnpm exec openapi-ts --output src/client`). Entry: [src/main.ts](../apps/admin/src/main.ts) sets up Pinia, Vue Router, axios interceptors.

**API Integration**: Generated client ([src/client/](../apps/admin/src/client)) provides typed request functions (e.g., `postAuthLogin`, `getUserProfile`). [src/lib/axios.ts](../apps/admin/src/lib/axios.ts) configures interceptors: auto-attach bearer token, handle 401 → refresh token → retry, logout on 401 with redirect to login. Refresh token stored in httpOnly cookie; fallback to body parameter. Concurrent refresh requests deduplicated via closure pattern.

**Routing & Auth**: [src/router/index.ts](../apps/admin/src/router/index.ts) defines routes, with `authWhitelist` for login page. `beforeEach` guard fetches user profile for protected routes; 401 triggers axios interceptor logout. Route names centralized in [src/router/route-name.ts](../apps/admin/src/router/route-name.ts). NProgress integration for navigation feedback.

**State Management**: Pinia stores in `src/stores/`: [auth.ts](../apps/admin/src/stores/auth.ts) (accessToken), [user.ts](../apps/admin/src/stores/user.ts) (profile). Minimal stores—avoid side effects; axios interceptors handle token refresh. Use getters for computed state (e.g., `isAuthenticated`).

**Styling**: Tailwind v4 via `@tailwindcss/vite` + `tw-animate-css` plugin. CSS vars in [src/style.css](../apps/admin/src/style.css) (oklch color space); dark mode via `@custom-variant dark`. Component library under `src/components/ui/` (shadcn style, pre-generated). Compose UI with Tailwind classes.

**Components**: Vue 3 `<script setup>` (no `<script>` blocks). Path alias `@admin` → `src/`. Example: [src/components/GlobalHeader.vue](../apps/admin/src/components/GlobalHeader.vue). Prefer composables in `src/lib/` for shared logic.

## Environment Variables
**Server** (`apps/server/.env`):
- `DATABASE_URL` (PostgreSQL), `NODE_ENV`, `FRONTEND_DOMAIN`, `LOG_LEVEL`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_ROLE_NAME`, `ADMIN_EMAIL` (seeded on `prisma:reset`)
- `JWT_SECRET`, `TOKEN_EXPIRY` (e.g., "15m"), `REFRESH_TOKEN_EXPIRY` (e.g., "7d")

**Admin** (`apps/admin/.env.local`):
- `VITE_API_URL` (e.g., `http://localhost:3000`)

## Key Integration Flows

**Login**: User submits form → Admin calls `postAuthLogin({ body: { username, password } })` → Server validates via `authService.login()`, returns `accessToken` & `refreshToken` (in cookie + body) → Axios interceptor captures, stores in Pinia auth store → Router redirects to home, `beforeEach` fetches user profile.

**Token Refresh**: Protected endpoint returns 401 → Axios `onError` calls `postAuthRefresh()` → Server generates new token → Interceptor updates Pinia, retries original request → Concurrent refreshes deduplicated via closure promise.

**Route Navigation**: Router `beforeEach` starts NProgress → For protected routes, calls `getUserProfile()` → On 401, axios handles logout + redirect to login with redirect query → Pinia store cleared.

## Adding Features

**New API Endpoint**:
1. Add Zod schema in `src/schemas/` with `.openapi()` metadata
2. Define route in `src/routes/` with `createRoute` (add `security: [{ Bearer: [] }]` + `middleware: [authMiddleware]` if protected)
3. Add service method in `src/service/`
4. Register route in [src/openapi/registerRoutes.ts](../apps/server/src/openapi/registerRoutes.ts)
5. Regenerate admin client: `cd apps/admin && pnpm exec openapi-ts --output src/client`

**Database Change**:
1. Edit [apps/server/prisma/schema.prisma](../apps/server/prisma/schema.prisma)
2. Run `cd apps/server && pnpm prisma generate`
3. Run `pnpm prisma migrate dev --name description` or `pnpm prisma:reset` to reset & reseed
4. Update [apps/server/prisma/seed.ts](../apps/server/prisma/seed.ts) if needed

**New Admin Page**:
1. Create `.vue` in `src/pages/` with `<script setup>` syntax
2. Add route name to [src/router/route-name.ts](../apps/admin/src/router/route-name.ts), route to [src/router/index.ts](../apps/admin/src/router/index.ts)
3. Use generated client functions for API calls; store in Pinia if needed
4. Style with Tailwind classes using theme vars from [src/style.css](../apps/admin/src/style.css)
5. Exclude from `authWhitelist` if auth-required
