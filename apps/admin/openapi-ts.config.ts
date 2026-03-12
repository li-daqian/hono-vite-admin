import process from 'node:process'
import { defineConfig } from '@hey-api/openapi-ts'

const API_BASE_URL = process.env.OPENAPI_SERVER_URL ?? 'http://localhost:3000'
const API_V1_OPENAPI_JSON = '/api/v1/openapi.json'

export default defineConfig({
  input: `${API_BASE_URL}${API_V1_OPENAPI_JSON}`,
  output: {
    path: './src/client',
  },
  plugins: [
    '@hey-api/client-axios',
    {
      enums: true,
      name: '@hey-api/typescript',
    },
    {
      name: 'zod',
      metadata: true,
    },
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      name: '@hey-api/sdk',
      validator: true,
      transformer: true,
    },
  ],
})
