import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { theme as antdTheme } from 'ant-design-vue'

export type ResolvedTheme = 'light' | 'dark'
export type ThemeTokens = Record<string, string>

export const antdAlgorithmMap: Record<ResolvedTheme, ThemeConfig> = {
  light: {
    algorithm: antdTheme.defaultAlgorithm,
  },
  dark: {
    algorithm: antdTheme.darkAlgorithm,
  },
}
