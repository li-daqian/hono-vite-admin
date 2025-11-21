import type { Context, Next } from 'hono'
import pino from 'pino'
import pretty from 'pino-pretty'

// 创建基础 logger 实例
const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname,traceId',
    messageFormat: '[{traceId}] {msg}',
  }),
)

export type RequestLogger = ReturnType<typeof pino>

export async function traceMiddleware(c: Context, next: Next): Promise<void> {
  const traceId = crypto.randomUUID()
  c.set('traceId', traceId)

  // 为当前请求创建带 traceId 的 child logger
  const logger = baseLogger.child({ traceId })
  c.set('logger', logger)

  logger.debug({ method: c.req.method, path: c.req.path }, 'Incoming request')

  const start = Date.now()
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

export function getTraceId(c: Context): string | undefined {
  return c.get('traceId') as string | undefined
}

export function getLogger(c: Context): RequestLogger | undefined {
  return c.get('logger') as RequestLogger | undefined
}
