import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'
import { handle } from 'hono/vercel'

import app from './src/index'

function loadEnvFile(filename: string, existingKeys: Set<string>) {
  const filePath = path.resolve(process.cwd(), filename)
  if (!existsSync(filePath)) {
    return
  }

  const parsed = parse(readFileSync(filePath))
  for (const [key, value] of Object.entries(parsed)) {
    if (!existingKeys.has(key)) {
      process.env[key] = value
    }
  }
}

const existingEnvKeys = new Set(Object.keys(process.env))
loadEnvFile('.env', existingEnvKeys)
loadEnvFile('.env.production', existingEnvKeys)

export default handle(app)
