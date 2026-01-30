<script setup lang="ts">
import type { GetUserProfileResponse } from '@admin/client'
import type { HTMLAttributes } from 'vue'
import { Avatar, AvatarFallback } from '@admin/components/ui/avatar'
import { cn } from '@admin/lib/utils'
import { computed } from 'vue'

const props = defineProps<
  { userProfile: GetUserProfileResponse | null }
  & { class?: HTMLAttributes['class'] }
>()

const statusClass = computed(() => {
  switch (props.userProfile?.status) {
    case 'ACTIVE':
      return 'bg-green-500'
    case 'DISABLED':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
})
</script>

<template>
  <div class="relative inline-block">
    <Avatar :class="props.class">
      <AvatarFallback>{{ props.userProfile?.displayName?.toUpperCase()[0] || '' }}</AvatarFallback>
    </Avatar>
    <span
      :class="cn('absolute bottom-[0.2em] right-[0.2em] h-[25%] w-[25%] rounded-full ring-2 ring-background', statusClass)"
    />
  </div>
</template>
