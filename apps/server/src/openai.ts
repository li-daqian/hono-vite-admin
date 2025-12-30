import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { BadRequestError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { registerRoutes } from '@server/src/routes'

export const api = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw new BadRequestError(result.error.message)
    }
  },
})

// Register security scheme
api.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

if (!getEnv().isProduction) {
  // OpenAPI JSON with Bearer auth
  api.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'Hono-vite-admin API',
      version: '1.0.0',
    },
  })
  // Swagger UI with auto token setup
  api.get('/docs', swaggerUI({
    url: '/openapi.json',
    onComplete: `() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
          if (args[0].includes('/api/v1/auth/login') && response.ok) {
            response.clone().json().then(data => {
              if (data?.accessToken) {
                const ui = window.ui;
                ui.preauthorizeApiKey('Bearer', data.accessToken);
              }
            });
          }
          return response;
        });
      };
    }`,
  }))
}

registerRoutes(api)
