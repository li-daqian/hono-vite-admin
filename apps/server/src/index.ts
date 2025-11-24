import { Hono } from 'hono'
import { traceMiddleware } from './middleware/trace-logger'

const app = new Hono()

app.use('*', traceMiddleware)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
