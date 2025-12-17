<script setup lang="ts">
import BaseLayout from '@admin/layouts/BaseLayout.vue'
import { App, ConfigProvider } from 'ant-design-vue'
import { useTheme } from './theme/useTheme'

const { themeConfig } = useTheme()
</script>

<template>
  <ConfigProvider :theme="themeConfig">
    <App>
      <BaseLayout />
    </App>
  </ConfigProvider>
</template>

<style scoped>

</style>
