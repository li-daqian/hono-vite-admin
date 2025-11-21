import antfu from "@antfu/eslint-config";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = antfu({
  ignores: ["dist/**"],

  typescript: true,
});
