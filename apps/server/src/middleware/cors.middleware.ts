import { getEnv } from '@server/src/lib/env'
import { cors } from 'hono/cors'

export const corsMiddleware = cors({
  origin: (origin, _c) => {
    if (getEnv().isProduction) {
      return `https://${getEnv().frontendDomain}`
    }
    else {
      return origin
    }
  },
  credentials: true,
})
