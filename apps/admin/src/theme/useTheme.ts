import type { ResolvedTheme } from './config'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { antdAlgorithmMap } from './config'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'admin.theme.mode'

const mode = ref<ThemeMode>('system')
const resolvedTheme = ref<ResolvedTheme>('light')
const themeConfig = ref(antdAlgorithmMap.light)

let mediaQuery: MediaQueryList | null = null
let mediaQueryHandler: ((event: MediaQueryListEvent) => void) | null = null

function getStoredMode(): ThemeMode {
  const m = localStorage.getItem(STORAGE_KEY)
  if (m === 'light' || m === 'dark' || m === 'system')
    return m
  if (m === 'forest')
    return 'dark'
  return 'system'
}

function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveMode(next: ThemeMode): ResolvedTheme {
  if (next === 'system')
    return isSystemDark() ? 'dark' : 'light'
  return next
}

function apply(modeToApply: ThemeMode) {
  const resolved = resolveMode(modeToApply)
  resolvedTheme.value = resolved

  themeConfig.value = antdAlgorithmMap[resolved]
}

export function setThemeMode(next: ThemeMode) {
  mode.value = next
  localStorage.setItem(STORAGE_KEY, next)
  apply(next)
}

export function initTheme() {
  mode.value = getStoredMode()
  apply(mode.value)
}

export function useTheme() {
  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryHandler = () => {
      if (mode.value === 'system')
        apply('system')
    }
    mediaQuery.addEventListener?.('change', mediaQueryHandler)
    mediaQuery.addListener?.(mediaQueryHandler)
  })

  onBeforeUnmount(() => {
    if (mediaQuery && mediaQueryHandler) {
      mediaQuery.removeEventListener?.('change', mediaQueryHandler)
      mediaQuery.removeListener?.(mediaQueryHandler)
    }
  })

  return {
    mode,
    resolvedTheme: computed(() => resolvedTheme.value),
    themeConfig,
    setThemeMode,
  }
}
