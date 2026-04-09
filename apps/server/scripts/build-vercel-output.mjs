import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(appRoot, '.vercel', 'output')
const functionRoot = path.join(outputRoot, 'functions', 'app.func')
const bundleFile = path.join(functionRoot, 'index.js')

rmSync(outputRoot, { recursive: true, force: true })
mkdirSync(functionRoot, { recursive: true })

const buildResult = spawnSync(
  'bun',
  [
    'build',
    'vercel.entry.ts',
    '--outfile',
    path.relative(appRoot, bundleFile),
    '--target',
    'node',
    '--format',
    'esm',
  ],
  {
    cwd: appRoot,
    stdio: 'inherit',
  },
)

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

writeFileSync(
  path.join(functionRoot, '.vc-config.json'),
  `${JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    shouldAddHelpers: false,
    shouldAddSourcemapSupport: false,
  }, null, 2)}\n`,
)

writeFileSync(
  path.join(functionRoot, 'package.json'),
  `${JSON.stringify({
    type: 'module',
  }, null, 2)}\n`,
)

writeFileSync(
  path.join(outputRoot, 'config.json'),
  `${JSON.stringify({
    version: 3,
    routes: [
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/app' },
    ],
  }, null, 2)}\n`,
)
