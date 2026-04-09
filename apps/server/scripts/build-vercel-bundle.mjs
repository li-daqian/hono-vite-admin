import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const outdir = path.join(appRoot, 'dist')

rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

await esbuild.build({
  entryPoints: [path.join(appRoot, 'vercel.entry.ts')],
  outfile: path.join(outdir, 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  tsconfig: path.join(appRoot, 'tsconfig.json'),
})

writeFileSync(
  path.join(outdir, 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
)

for (const filename of ['.env', '.env.production']) {
  const sourceFile = path.join(appRoot, filename)
  if (existsSync(sourceFile)) {
    copyFileSync(sourceFile, path.join(outdir, filename))
  }
}
