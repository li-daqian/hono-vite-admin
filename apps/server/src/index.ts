import { API_V1_BASE_PATH, API_V2_BASE_PATH } from '@server/src/common/constant'
import { holdContext } from '@server/src/middleware/context.middleware'
import { corsMiddleware } from '@server/src/middleware/cors.middleware'
import { onErrorHandler, onNotFoundHandler } from '@server/src/middleware/expcetion.middleware'
import { requestIdMiddleware } from '@server/src/middleware/requestId.middleware'
import { traceLogger } from '@server/src/middleware/trace.middleware'
import { apiV1 } from '@server/src/openapi/v1'
import { apiV2 } from '@server/src/openapi/v2'
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
app.route(API_V1_BASE_PATH, apiV1)
app.route(API_V2_BASE_PATH, apiV2)

export default app
