# Hono Vite Admin

## Vercel deployment

Deploy the frontend and API as two separate Vercel projects.

### API project

Point the Vercel project to `apps/server` and use the repository Vercel config.

- Root Directory: `apps/server`
- Framework Preset: `Hono`
- Install Command: leave empty and use [`apps/server/vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/vercel.json)
- Build Command: leave empty and use [`apps/server/vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/vercel.json)
- Output Directory: leave empty and use [`apps/server/vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/vercel.json)
- Node.js Version: 20 or later
- Production Domain: use a dedicated API domain such as `api.example.com`

The API deployment uses:

- [`apps/server/vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/vercel.json) to configure Vercel
- [`apps/server/scripts/build-vercel-bundle.mjs`](/home/lidaqian/Code/hono-vite-admin/apps/server/scripts/build-vercel-bundle.mjs) to bundle the server with `esbuild`
- [`apps/server/dist/index.js`](/home/lidaqian/Code/hono-vite-admin/apps/server/dist/index.js) as the final deployment artifact

This is intentional. Vercel's Hono zero-config flow does not resolve the project's TypeScript path aliases, so the API is bundled before deployment to keep `@server/*` imports working.

Required environment variables for the API project:

- `DATABASE_URL`
- `FRONTEND_DOMAIN`
- `JWT_SECRET`
- `TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE_NAME`
- `ADMIN_EMAIL`
- `LOG_LEVEL`
- `READ_ONLY_MODE` (optional)
- `LOGIN_MAX_FAILED_ATTEMPTS` (optional, defaults to `5`)
- `LOGIN_LOCK_DURATION` (optional, defaults to `15m`)

Set `FRONTEND_DOMAIN` to the frontend hostname only, without protocol. Example: `admin.example.com`.

[`apps/server/package.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/package.json) still runs `prisma generate` in `postinstall`, so Prisma Client is generated during the Vercel install step. Database migrations and seed scripts stay out of the Vercel build pipeline.

### Frontend project

Deploy the admin app as a separate Vercel project.

- Root Directory: `apps/admin`
- Framework Preset: `Vite`
- Install Command: leave empty and use the Vercel default
- Build Command: leave empty
- Output Directory: `dist`
- Node.js Version: 20 or later

The frontend deployment uses [`apps/admin/vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/admin/vercel.json) to add the SPA history fallback required by Vue Router's `createWebHistory()`, so direct visits and refreshes to routes like `/dashboard` rewrite to `index.html` instead of returning a Vercel 404.

Required environment variables for the frontend project:

- `VITE_API_BASE_URL`

Set `VITE_API_BASE_URL` to the API origin without a trailing `/api/v1`. Example: `https://api.example.com`.

### GitHub Actions deployment

[`/.github/workflows/deploy-vercel-production.yml`](/home/lidaqian/Code/hono-vite-admin/.github/workflows/deploy-vercel-production.yml) detects the changed paths before deploying. Server-only changes deploy only the API project, admin-only changes deploy only the frontend project, and shared workspace/config or unknown path changes deploy both projects. When both projects deploy, the admin deployment waits for the API deployment to succeed.

Required GitHub Actions production environment configuration:

- Secrets: `DATABASE_URL`, `VERCEL_ORG_ID`, `VERCEL_TOKEN`, `VERCEL_SERVER_PROJECT_ID`, `VERCEL_ADMIN_PROJECT_ID`
- Variables: `FRONTEND_DOMAIN`, `VITE_API_BASE_URL`
- Optional variable: `READ_ONLY_MODE`

### Recommended topology

- Frontend project: `https://admin.example.com`
- API project: `https://api.example.com`
- `FRONTEND_DOMAIN=admin.example.com`
- `VITE_API_BASE_URL=https://api.example.com`

## Read-only deployment mode

Set `READ_ONLY_MODE=true` in your Vercel project environment variables to make the API deployment read-only. All read requests keep working, login/refresh/logout stay available, business write APIs return `ReadOnlyModeEnabled`, and the admin UI loads the public bootstrap config from the API to show a `Demo read-only` banner without disabling the write dialogs.

# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
