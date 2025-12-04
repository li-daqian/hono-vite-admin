import { NotFoundError } from '@server/src/common/exception'
import { errorResponse } from '@server/src/common/response'
import { onErrorHandler } from '@server/src/middleware/expcetion-handler'
import { traceLogger } from '@server/src/middleware/trace-logger'
import { api } from '@server/src/openai'
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'

// Initialize main app
const app = new Hono()

// Global middlewares
app.use('*', requestId())
app.use('*', traceLogger)

// Error handling
app.notFound(c => c.json(errorResponse(new NotFoundError()), 404))
app.onError(onErrorHandler)

// Main API routes
app.route('/', api)

export default app
