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
- Framework Preset: `Other`
- Build Command: empty
- Output Directory: empty

Vercel picks up [`api/[...route].ts`](/home/lidaqian/Code/hono-vite-admin/apps/server/api/[...route].ts) as the function entrypoint directly, so there is no custom `build:vercel` step anymore.
