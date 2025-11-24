import type { Context, Next } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
import pino from 'pino'
import pretty from 'pino-pretty'

// 创建 AsyncLocalStorage 来存储当前请求的 logger
const als = new AsyncLocalStorage<RequestLogger>()

// 创建基础 logger 实例
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
  // 为当前请求创建带 traceId 的 child logger
  const logger = baseLogger.child({ requestId: c.get('requestId') })
  c.set('logger', logger)

  logger.debug({ method: c.req.method, path: c.req.path }, 'Incoming request')

  const start = Date.now()
  // 使用 AsyncLocalStorage 运行 next，这样在异步操作中可以获取 logger
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

// 新增：获取当前请求的 logger，无需传入 Context
export function getCurrentLogger(): RequestLogger | undefined {
  return als.getStore()
}
