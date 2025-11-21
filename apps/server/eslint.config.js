import { config } from '@hono-vite-admin/eslint-config/base'

export default [
  ...config,
  {
    rules: {
      'no-console': 'off',
    },
  },
]
