<script setup lang="ts">
import type { GetUserProfileResponse } from '@admin/client'
import UserAvatar from '@admin/components/user/UserAvatar.vue'

const props = defineProps<
  { userProfile: GetUserProfileResponse | null }
>()
</script>

<template>
  <div class="flex gap-2">
    <UserAvatar :user-profile="props.userProfile" class="size-10" />
    <div class="flex flex-col justify-between">
      <span class="truncate text-sm font-medium">{{ props.userProfile?.displayName }}</span>
      <span class="truncate text-xs text-ring">{{ props.userProfile?.email }}</span>
    </div>
  </div>
</template>
