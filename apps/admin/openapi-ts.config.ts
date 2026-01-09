import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://localhost:3000/api/v1/openapi.json',
  output: {
    path: './src/client',
  },
  plugins: [
    '@hey-api/client-axios',
    'zod',
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
