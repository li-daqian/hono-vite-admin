import antfu from "@antfu/eslint-config";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = antfu({
  ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],

  nextjs: true,
});
