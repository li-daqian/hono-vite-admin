import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://localhost:3000/api/v1/openapi.json',
  output: 'src/client',
  plugins: ['@hey-api/client-axios'],
  services: {
    asClass: true, // UserService.getXXX()
  },
})
