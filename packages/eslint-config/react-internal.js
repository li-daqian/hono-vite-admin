import antfu from "@antfu/eslint-config";

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = antfu({
  react: true,
});
