import { envConfig } from '@server/src/common/config'
import { cors } from 'hono/cors'

export const corsMiddleware = cors({
  origin: (origin, _c) => {
    if (envConfig.isProduction) {
      return `https://${envConfig.domain}`
    }
    else {
      return origin
    }
  },
  credentials: true,
})
