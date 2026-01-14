import type { Context } from 'hono'
import { getContext } from '@server/src/middleware/context.middleware'
import { requestId } from 'hono/request-id'

export const requestIdMiddleware = requestId({ headerName: 'X-Request-ID' })

export function getRequestId(c: Context = getContext()!): string {
  return c.get('requestId')
}
