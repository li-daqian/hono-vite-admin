# Server

## Local development

Install dependencies from the monorepo root:

```sh
pnpm install
```

Run the API locally:

```sh
pnpm --filter @hono-vite-admin/server dev
```

The local server listens on `http://localhost:3000`.

## Vercel

Deploy this app as a dedicated Vercel project with:

- Root Directory: `apps/server`
- Framework Preset: `Hono`
- Install Command: leave empty and use the repository `vercel.json`
- Build Command: leave empty and use the repository `vercel.json`
- Output Directory: leave empty and use the repository `vercel.json`

The active deployment flow is:

- [`vercel.json`](/home/lidaqian/Code/hono-vite-admin/apps/server/vercel.json) sets `bunVersion`, `buildCommand`, and `outputDirectory`
- [`build-vercel-bundle.mjs`](/home/lidaqian/Code/hono-vite-admin/apps/server/scripts/build-vercel-bundle.mjs) bundles the server with `esbuild`
- the final deployment artifact is [`dist/index.js`](/home/lidaqian/Code/hono-vite-admin/apps/server/dist/index.js)

This keeps the `@server/*` path aliases working on Vercel by resolving them during bundling instead of relying on Vercel's TypeScript compilation.
