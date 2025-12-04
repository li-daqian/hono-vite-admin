import type { Context, Next } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
import { envConfig } from '@server/src/common/config'
import pino from 'pino'
import pretty from 'pino-pretty'

// Create the base logger instance
const baseLogger = pino(
  {
    level: envConfig.log.level,
  },
  pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname',
    messageFormat: '{msg}',
  }),
)

export type RequestLogger = pino.Logger
interface LoggerStore { logger: RequestLogger, requestId: string }
// Create an AsyncLocalStorage instance to store the logger for the current request
const als = new AsyncLocalStorage<LoggerStore>()

export async function traceLogger(c: Context, next: Next): Promise<void> {
  // Create a child logger for the request using the requestId
  const requestId = c.get('requestId')
  const logger = baseLogger.child({ requestId })
  c.set('logger', logger)

  logger.debug({ method: c.req.method, path: c.req.path }, 'Incoming request')

  const start = Date.now()
  // Run the downstream handler inside AsyncLocalStorage so the logger is available in async operations
  await als.run({ logger, requestId }, async () => {
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
export function logger(): RequestLogger {
  return als.getStore()?.logger || (() => { throw new Error('Logger not initialized in AsyncLocalStorage') })()
}

export function requestId(): string {
  return als.getStore()?.requestId || ''
}
