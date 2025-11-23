import antfu from '@antfu/eslint-config'

/**
 * A shared ESLint configuration for the repository.
 */
export const config = antfu({
  ignores: ['dist/**'],

  typescript: true,
})
