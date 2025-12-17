<script lang="ts" setup>
import GlobalHeader from '@admin/components/GlobalHeader.vue'
</script>

<template>
  <div id="baseLayout" class="min-h-screen">
    <GlobalHeader />
    <a-layout>
      <a-layout-sider>
        Sider
      </a-layout-sider>
      <a-layout-content>
        Content
      </a-layout-content>
    </a-layout>
  </div>
</template>
