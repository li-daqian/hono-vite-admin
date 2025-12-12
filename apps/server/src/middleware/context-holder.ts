import type { Context, Next } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'

const als = new AsyncLocalStorage<Context>()

export async function holdContext(c: Context, next: Next): Promise<void> {
  await als.run(c, async () => {
    await next()
  })
}

export function getContext(): Context | undefined {
  return als.getStore()
}
