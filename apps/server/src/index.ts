import { holdContext } from '@server/src/middleware/context.middleware'
import { corsMiddleware } from '@server/src/middleware/cors.middleware'
import { onErrorHandler, onNotFoundHandler } from '@server/src/middleware/expcetion.middleware'
import { requestIdMiddleware } from '@server/src/middleware/requestId.middleware'
import { traceLogger } from '@server/src/middleware/trace.middleware'
import { api } from '@server/src/openapi/openapi'
import { Hono } from 'hono'

// Initialize main app
const app = new Hono()

// Global middlewares
app.use('*', corsMiddleware)
app.use('*', holdContext)
app.use('*', requestIdMiddleware)
app.use('*', traceLogger)

// Error handling
app.notFound(onNotFoundHandler)
app.onError(onErrorHandler)

// icon route
app.get('/favicon.ico', (c) => {
  return c.redirect('https://hono.dev/favicon.ico', 302)
})

// Main API routes
app.route('/api/v1', api)

export default app
