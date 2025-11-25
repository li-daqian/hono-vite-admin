import { errorResponse } from '@server/src/dto/response.dto'
import { onErrorHandler } from '@server/src/middleware/expcetion-handler'
import { traceLogger } from '@server/src/middleware/trace-logger'
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'

const app = new Hono()

app.use('*', requestId())
app.use('*', traceLogger)

app.notFound(c => c.json(errorResponse('Not Found'), 404))
app.onError(onErrorHandler)

app.get('/', async (c) => {
  return c.text('Hello Hono!')
})

export default app
