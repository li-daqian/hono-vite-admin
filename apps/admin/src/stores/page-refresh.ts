import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePageRefreshStore = defineStore('pageRefresh', () => {
  const refreshCount = ref(0)

  function refresh() {
    refreshCount.value += 1
  }

  return { refreshCount, refresh }
})
