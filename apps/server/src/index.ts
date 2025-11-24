import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { traceLogger } from './middleware/trace-logger'

const app = new Hono()

app.use('*', requestId())
app.use('*', traceLogger)

app.get('/', async (c) => {
  return c.text('Hello Hono!')
})

export default app
