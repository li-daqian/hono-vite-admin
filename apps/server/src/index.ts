import { API_V1_BASE_PATH, API_V2_BASE_PATH } from '@server/src/common/constant'
import { holdContext } from '@server/src/middleware/context.middleware'
import { corsMiddleware } from '@server/src/middleware/cors.middleware'
import { onErrorHandler, onNotFoundHandler } from '@server/src/middleware/expcetion.middleware'
import { readOnlyMiddleware } from '@server/src/middleware/readonly.middleware'
import { requestIdMiddleware } from '@server/src/middleware/requestId.middleware'
import { traceLogger } from '@server/src/middleware/trace.middleware'
import { setUpUnifiedSwagger } from '@server/src/openapi/swagger'
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
app.use('*', readOnlyMiddleware)

// Error handling
app.notFound(onNotFoundHandler)
app.onError(onErrorHandler)

// icon route
app.get('/favicon.ico', (c) => {
  return c.redirect('https://hono.dev/favicon.ico', 302)
})

// Well-known route for Chrome DevTools
app.get('/.well-known/appspecific/com.chrome.devtools.json', (c) => {
  return c.json({})
})

// Main API routes
app.route(API_V1_BASE_PATH, apiV1)
app.route(API_V2_BASE_PATH, apiV2)

setUpUnifiedSwagger(app, {
  apis: [
    { name: 'v1', url: `${API_V1_BASE_PATH}/openapi.json` },
    { name: 'v2', url: `${API_V2_BASE_PATH}/openapi.json` },
  ],
  primaryName: 'v1',
})

export default app
