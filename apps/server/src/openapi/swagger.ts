import type { OpenAPIHono } from '@hono/zod-openapi'
import type { Hono } from 'hono'
import { ErrorResponseSchema } from '@server/src/common/basic.schema'
import { getEnv } from '@server/src/lib/env'

interface SwaggerConfig {
  apiBasePath: string
  title: string
  version: string
}

interface UnifiedSwaggerConfig {
  apis: {
    name: string
    url: string
  }[]
  docsPath?: string
  primaryName?: string
}

export function setUpSwagger(api: OpenAPIHono, config: SwaggerConfig) {
  const { apiBasePath, title, version } = config

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
        url: apiBasePath,
      }],
    })
  }
}

export function setUpUnifiedSwagger(app: Hono, config: UnifiedSwaggerConfig) {
  const { apis, docsPath = '/docs', primaryName = apis[0]?.name } = config
  const sortedApis = primaryName
    ? [
        ...apis.filter(api => api.name === primaryName),
        ...apis.filter(api => api.name !== primaryName),
      ]
    : apis

  if (!getEnv().isProduction) {
    const defaultPrimaryName = primaryName ?? sortedApis[0]?.name
    const defaultSpecUrl = sortedApis[0]?.url ?? ''

    const onCompleteScript = `() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const request = args[0];
        const requestUrl = typeof request === 'string' ? request : (request?.url ?? '');

        return originalFetch.apply(this, args).then(response => {
          if (requestUrl.includes('/auth/login') && response.ok) {
            response.clone().json().then(data => {
              if (data?.accessToken) {
                const ui = window.ui;
                ui.preauthorizeApiKey('Bearer', data.accessToken);
              }
            });
          }
          if (requestUrl.includes('/auth/logout') && response.ok) {
            const ui = window.ui;
            ui.preauthorizeApiKey('Bearer', '');
          }
          if (requestUrl.includes('/auth/refresh') && response.ok) {
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

    }`

    app.get(docsPath, (c) => {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      c.header('Pragma', 'no-cache')
      c.header('Expires', '0')

      return c.html(`
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="SwaggerUI" />
          <title>SwaggerUI</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js" crossorigin="anonymous"></script>
          <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
          <script>
            window.onload = () => {
              window.ui = SwaggerUIBundle({
                dom_id: '#swagger-ui',
                url: ${JSON.stringify(defaultSpecUrl)},
                urls: ${JSON.stringify(sortedApis)},
                'urls.primaryName': ${JSON.stringify(defaultPrimaryName)},
                layout: 'StandaloneLayout',
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                onComplete: ${onCompleteScript},
              })
            }
          </script>
        </body>
      </html>
    `)
    })
  }
}
