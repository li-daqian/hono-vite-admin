import type { SwaggerUIOptions } from '@hono/swagger-ui'
import type { OpenAPIHono } from '@hono/zod-openapi'
import type { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
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

    const swaggerOptions: SwaggerUIOptions = {
      url: sortedApis[0]?.url,
      urls: sortedApis,
      manuallySwaggerUIHtml: (asset) => {
        const standalonePresetUrl = asset.js[0]?.replace('swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js')
        const defaultPrimaryName = primaryName ?? sortedApis[0]?.name

        return `
          <div>
            <div id="swagger-ui"></div>
            ${asset.css.map(url => `<link rel="stylesheet" href="${url}" />`).join('')}
            ${asset.js.map(url => `<script src="${url}" crossorigin="anonymous"></script>`).join('')}
            ${standalonePresetUrl ? `<script src="${standalonePresetUrl}" crossorigin="anonymous"></script>` : ''}
            <script>
              window.onload = () => {
                window.ui = SwaggerUIBundle({
                  dom_id: '#swagger-ui',
                  url: ${JSON.stringify(sortedApis[0]?.url)},
                  urls: ${JSON.stringify(sortedApis)},
                  'urls.primaryName': ${JSON.stringify(defaultPrimaryName)},
                  presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                  plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                  layout: 'StandaloneLayout',
                  onComplete: ${onCompleteScript},
                })
              }
            </script>
          </div>
        `
      },
    }

    app.get(docsPath, swaggerUI(swaggerOptions))
  }
}
