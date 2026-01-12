import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { UserStatus } from '@server/generated/prisma/enums'
import { API_V1_BASE_PATH } from '@server/src/common/constant'
import { BadRequestError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { registerRoutes } from '@server/src/routes'

const api = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw new BadRequestError(result.error.message)
    }
  },
})

setUpSwagger(api)

registerRoutes(api)

function setUpSwagger(api: OpenAPIHono) {
  if (!getEnv().isProduction) {
  // Register security scheme
    api.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    // Register enum schemas
    api.openAPIRegistry.registerComponent('schemas', 'UserStatus', {
      type: 'string',
      enum: Object.values(UserStatus),
      description: 'Status of the user account',
    })
    // OpenAPI JSON with Bearer auth
    api.doc('/openapi.json', {
      openapi: '3.0.0',
      info: {
        title: 'Hono-vite-admin API',
        version: '1.0.0',
      },
      servers: [{
        url: `${API_V1_BASE_PATH}`,
      }],
    })
    // Swagger UI with auto token setup
    api.get('/docs', swaggerUI({
      url: `${API_V1_BASE_PATH}/openapi.json`,
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

export { api }
