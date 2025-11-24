import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { onErrorHandler } from './middleware/expcetion-handler'
import { traceLogger } from './middleware/trace-logger'

const app = new Hono()

app.use('*', requestId())
app.use('*', traceLogger)

app.notFound(c => c.json({ message: 'Not Found', ok: false }, 404))
app.onError(onErrorHandler)

app.get('/', async (c) => {
  return c.text('Hello Hono!')
})

export default app
