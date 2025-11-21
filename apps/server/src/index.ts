import { Hono } from 'hono'
import { traceMiddleware } from './middleware/traceLogger'

const app = new Hono()

app.use('*', traceMiddleware)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
