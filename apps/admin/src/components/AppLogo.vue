<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  size?: number
}>()
</script>

<template>
  <div :class="props.class">
    <img src="/vite.svg" alt="Vite logo">
  </div>
</template>
