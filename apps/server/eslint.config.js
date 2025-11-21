import { config } from '@hono-vite-admin/eslint-config/base'

export default config.append({
  rules: {
    'no-console': 'off',
    'n/prefer-global/process': 'off',
  },
})
