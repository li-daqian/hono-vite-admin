import { config } from '@hono-vite-admin/eslint-config/base'

export default config.append({
  rules: {
    'n/prefer-global/process': 'off',
  },
})
