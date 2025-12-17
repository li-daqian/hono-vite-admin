<script setup lang="ts">
import type { ThemeMode } from '@admin/theme/useTheme'
import type { MenuProps } from 'ant-design-vue'
import { setThemeMode, useTheme } from '@admin/theme/useTheme'
import { computed } from 'vue'

const { mode, resolvedTheme } = useTheme()

const MODE_OPTIONS: Array<{ key: ThemeMode, label: string, icon: string }> = [
  { key: 'system', label: '系统', icon: '🖥️' },
  { key: 'light', label: '浅色', icon: '🌞' },
  { key: 'dark', label: '黑色', icon: '🌙' },
]

const labelMap: Record<ThemeMode, string> = {
  system: '系统',
  light: '浅色',
  dark: '黑色',
}

const iconMap: Record<ThemeMode, string> = {
  system: '🖥️',
  light: '🌞',
  dark: '🌙',
}

const resolvedLabel = computed(() => (resolvedTheme.value === 'dark' ? '黑色' : '浅色'))
const buttonLabel = computed(() => labelMap[mode.value])
const buttonIcon = computed(() => iconMap[mode.value])
const buttonTitle = computed(() => (mode.value === 'system' ? `系统 (${resolvedLabel.value})` : buttonLabel.value))

const onSelect: MenuProps['onClick'] = ({ key }) => {
  setThemeMode(key as ThemeMode)
}
</script>

<template>
  <a-dropdown trigger="click" placement="bottomRight">
    <a-button size="small" shape="round" class="!flex !items-center !gap-2 !px-3" :title="buttonTitle">
      <span class="text-base">{{ buttonIcon }}</span>
      <span class="text-xs">{{ buttonLabel }}</span>
    </a-button>
    <template #overlay>
      <a-menu :selected-keys="[mode]" @click="onSelect">
        <a-menu-item v-for="item in MODE_OPTIONS" :key="item.key">
          <span class="mr-2">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span v-if="item.key === 'system'" class="ml-2 text-[10px] text-[hsl(var(--mutedForeground))]">跟随 {{ resolvedLabel }}</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
