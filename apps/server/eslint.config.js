import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,

  rules: {
    'n/prefer-global/process': 'off',
  },

  ignores: [
    'dist/**',
  ],
})
