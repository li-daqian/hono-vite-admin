import type { Context, Next } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
import pino from 'pino'
import pretty from 'pino-pretty'

// Create an AsyncLocalStorage instance to store the logger for the current request
const als = new AsyncLocalStorage<RequestLogger>()

// Create the base logger instance
const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname',
    messageFormat: '{msg}',
  }),
)

export type RequestLogger = pino.Logger

export async function traceLogger(c: Context, next: Next): Promise<void> {
  // Create a child logger for the request using the requestId
  const logger = baseLogger.child({ requestId: c.get('requestId') })
  c.set('logger', logger)

  logger.debug({ method: c.req.method, path: c.req.path }, 'Incoming request')

  const start = Date.now()
  // Run the downstream handler inside AsyncLocalStorage so the logger is available in async operations
  await als.run(logger, async () => {
    await next()
  })
  const duration = Date.now() - start

  logger.debug(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration: `${duration}ms`,
    },
    'Request completed',
  )
}

/**
 * Get the logger for the current request
 * @returns The logger for the current request, or undefined if not available
 */
export function getCurrentLogger(): RequestLogger | undefined {
  return als.getStore()
}
