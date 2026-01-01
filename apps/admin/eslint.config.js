import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  ignores: [
    'dist/**',
    // openapi-ts generated clients
    'src/client/**/*.ts',
  ],
})
