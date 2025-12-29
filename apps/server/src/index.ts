import { notFoundErrorResponse } from '@server/src/common/response'
import { authMiddleware } from '@server/src/middleware/auth'
import { holdContext } from '@server/src/middleware/context-holder'
import { corsMiddleware } from '@server/src/middleware/cors'
import { onErrorHandler } from '@server/src/middleware/expcetion-handler'
import { traceLogger } from '@server/src/middleware/trace-logger'
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
app.use('api/*', authMiddleware)

// Error handling
app.notFound(c => notFoundErrorResponse(c))
app.onError(onErrorHandler)

// Main API routes
app.route('/', api)

export default app
