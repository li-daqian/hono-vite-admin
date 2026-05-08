import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { getRequestId } from '@server/src/middleware/requestId.middleware'
import { logger } from '@server/src/middleware/trace.middleware'
import { auditService } from '@server/src/modules/audit/audit.service'

const AUDITED_FAILURE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const NON_OPERATION_PATH_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/audit',
]

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export async function onErrorHandler(error: Error | HTTPResponseError, c: Context): Promise<Response> {
  if (isHTTPResponseError(error)) {
    logger().warn(`HTTP Response Error: ${c.req.method} ${c.req.url} - ${error.message}`)
    return error.getResponse()
  }

  if (error instanceof BusinessError) {
    logger().info(`${c.req.method} ${c.req.url} - ${error}`)
    await recordOperationFailure(error, c)
    return error.getErrorResponse(c)
  }

  logger().error(error, error.message)
  return c.json({ message: 'An internal server error occurred', requestId: getRequestId() }, 500)
}

export function onNotFoundHandler(c: Context): Response | Promise<Response> {
  logger().warn(`Not Found: ${c.req.method} ${c.req.url}`)
  return c.json({ message: 'The requested resource was not found' }, 404)
}

function isHTTPResponseError(e: unknown): e is HTTPResponseError {
  return (
    !!e
    && typeof e === 'object'
    && 'getResponse' in e
    && typeof (e as any).getResponse === 'function'
  )
}

async function recordOperationFailure(error: BusinessError, c: Context): Promise<void> {
  if (!AUDITED_FAILURE_METHODS.has(c.req.method.toUpperCase())) {
    return
  }

  if (NON_OPERATION_PATH_PREFIXES.some(prefix => c.req.path.startsWith(prefix))) {
    return
  }

  const module = getOperationModule(c.req.path)
  if (!module) {
    return
  }

  try {
    await auditService.record(prisma, {
      category: 'operation',
      module,
      action: getOperationAction(c.req.method),
      requestSnapshot: {
        result: 'failure',
        failureReason: error.errorCode || error.name,
        message: error.message,
      },
    })
  }
  catch (auditError) {
    logger().warn(auditError, `Failed to record operation failure audit log for ${c.req.method} ${c.req.url}`)
  }
}

function getOperationModule(path: string): string | null {
  const [, module] = path.match(/^\/api\/v\d+\/([^/]+)/) ?? []
  return module ?? null
}

function getOperationAction(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create'
    case 'PUT':
    case 'PATCH':
      return 'update'
    case 'DELETE':
      return 'delete'
    default:
      return method.toLowerCase()
  }
}
