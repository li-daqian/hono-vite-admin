<script setup lang="ts">
import { Toaster } from '@admin/components/ui/sonner'
import { RouterView } from 'vue-router'
import 'vue-sonner/style.css'
</script>

<template>
  <div>
    <Toaster :rich-colors="true" position="top-center" />
    <RouterView />
  </div>
</template>
