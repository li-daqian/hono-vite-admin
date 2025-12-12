import { NotFoundError } from '@server/src/common/exception'
import { errorResponse } from '@server/src/common/response'
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
app.use('api/*', requestId())
app.use('api/*', traceLogger)
app.use('api/*', authMiddleware)

// Error handling
app.notFound(c => c.json(errorResponse(new NotFoundError()), 404))
app.onError(onErrorHandler)

// Main API routes
app.route('/', api)

export default app
