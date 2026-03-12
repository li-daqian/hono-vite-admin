import type { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { ErrorResponseSchema } from '@server/src/common/basic.schema'
import { getEnv } from '@server/src/lib/env'

interface SwaggerConfig {
  basePath: string
  title: string
  version: string
}

export function setUpSwagger(api: OpenAPIHono, config: SwaggerConfig) {
  const { basePath, title, version } = config

  if (!getEnv().isProduction) {
    // Register security scheme
    api.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    api.openAPIRegistry.register('ErrorResponse', ErrorResponseSchema)
    // OpenAPI JSON with Bearer auth
    api.doc('/openapi.json', {
      openapi: '3.0.0',
      info: {
        title,
        version,
      },
      servers: [{
        url: basePath,
      }],
    })
    // Swagger UI with auto token setup
    api.get('/docs', swaggerUI({
      url: `${basePath}/openapi.json`,
      onComplete: `() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
          if (args[0].includes('/auth/login') && response.ok) {
            response.clone().json().then(data => {
              if (data?.accessToken) {
                const ui = window.ui;
                ui.preauthorizeApiKey('Bearer', data.accessToken);
              }
            });
          }
          if (args[0].includes('/auth/logout') && response.ok) {
            const ui = window.ui;
            ui.preauthorizeApiKey('Bearer', '');
          }
          if (args[0].includes('/auth/refresh') && response.ok) {
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
}
