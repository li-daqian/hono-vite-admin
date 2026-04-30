import type { DictItemResponseSchema } from '@admin/client'

export const DICTIONARY_COLOR_CLASS_MAP: Record<string, string> = {
  green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  zinc: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
}

export interface DictionaryOption {
  label: string
  value: string
  color: DictItemResponseSchema['color']
}

export function formatDictionaryFallback(value: string): string {
  return value
    .split(/[-_.]/g)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

export function getDictionaryColorClass(color: string | null | undefined, fallbackColor = 'slate'): string {
  return DICTIONARY_COLOR_CLASS_MAP[color ?? ''] ?? DICTIONARY_COLOR_CLASS_MAP[fallbackColor]!
}
