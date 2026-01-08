import { notFoundErrorResponse } from '@server/src/common/response'
import { holdContext } from '@server/src/middleware/context.middleware'
import { corsMiddleware } from '@server/src/middleware/cors.middleware'
import { onErrorHandler } from '@server/src/middleware/expcetion.middleware'
import { traceLogger } from '@server/src/middleware/trace.middleware'
import { api } from '@server/src/openai'
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'

// Initialize main app
const app = new Hono()

// Global middlewares
app.use('api/*', corsMiddleware)
app.use('api/*', holdContext)
app.use('api/*', requestId({ headerName: 'X-Request-ID' }))
app.use('api/*', traceLogger)

// Error handling
app.notFound(c => notFoundErrorResponse(c))
app.onError(onErrorHandler)

// Main API routes
app.route('/', api)

export default app
