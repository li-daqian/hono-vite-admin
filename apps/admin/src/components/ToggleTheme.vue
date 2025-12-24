<script setup lang="ts">
import RiMoonLine from '@admin/components/icons/RiMoonLine.vue'
import RiSunLine from '@admin/components/icons/RiSunLine.vue'
import { isDark, toggleDark } from '@admin/lib/utils'
</script>

<template>
  <div>
    <a class="select-none" title="Toggle Color Scheme" @click="toggleDark">
      <RiSunLine v-if="!isDark" />
      <RiMoonLine v-else />
    </a>
  </div>
</template>
