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
      name: '@hey-api/sdk',
      validator: true,
    },
  ],
})
