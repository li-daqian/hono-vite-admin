import type { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { PermissionType, UserStatus } from '@server/generated/prisma/client'
import { API_V1_BASE_PATH } from '@server/src/common/constant'
import { getEnv } from '@server/src/lib/env'
import { ErrorResponseSchema } from '@server/src/schemas/error.schema'

export function setUpSwagger(api: OpenAPIHono) {
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
    api.openAPIRegistry.registerComponent('schemas', 'PermissionType', {
      type: 'string',
      enum: Object.values(PermissionType),
      description: 'Type of permission',
    })
    api.openAPIRegistry.register('ErrorResponse', ErrorResponseSchema)
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
