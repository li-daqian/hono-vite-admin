import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,

  ignores: [
    'dist/**',
    // openapi-ts generated clients
    'src/client/**/*.ts',
  ],
})
