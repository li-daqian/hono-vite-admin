<script setup lang="ts">
import { getUserProfile } from '@admin/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import UserAvatar from '@admin/pages/user/UserAvatar.vue'
import UserProfile from '@admin/pages/user/UserProfile.vue'
import { useUserStore } from '@admin/stores/user'
import { onMounted } from 'vue'

const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.isProfileLoaded) {
    const userProfile = await getUserProfile<true>()
    userStore.setProfile(userProfile.data)
  }
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <UserAvatar :user-profile="userStore.profile" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="mt-2 mr-2">
        <DropdownMenuLabel>
          <UserProfile :user-profile="userStore.profile" class="w-48" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
