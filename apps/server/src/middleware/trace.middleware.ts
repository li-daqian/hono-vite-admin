import type { Context, Next } from 'hono'
import { getEnv } from '@server/src/lib/env'
import { getContext } from '@server/src/middleware/context.middleware'
import { getRequestId } from '@server/src/middleware/requestId.middleware'
import pino from 'pino'
import pretty from 'pino-pretty'

// Create the base logger instance
const baseLogger = pino(
  {
    level: getEnv().log.level,
  },
  pretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    messageFormat: '{msg}',
  }),
)

type RequestLogger = pino.Logger
const loggerKey = 'logger'

export async function traceLogger(c: Context, next: Next): Promise<void> {
  // Create a child logger for the request using the requestId
  const requestId = getRequestId()
  const logger = baseLogger.child({ requestId })
  c.set(loggerKey, logger)

  logger.debug({ method: c.req.method, path: c.req.path }, 'Incoming request')

  const start = Date.now()
  // Run the downstream handler inside AsyncLocalStorage so the logger is available in async operations
  await next()
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
 * @returns The logger for the current request
 */
export function logger(c: Context = getContext()!): RequestLogger {
  return c.get(loggerKey)
}
