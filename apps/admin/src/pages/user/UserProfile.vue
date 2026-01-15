<script setup lang="ts">
import { getUserProfile } from '@admin/client'
import { Avatar, AvatarFallback } from '@admin/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import { useUserStore } from '@admin/stores/user'
import { onMounted, ref } from 'vue'

const userStore = useUserStore()

const loading = ref(true)
onMounted(async () => {
  try {
    if (!userStore.isProfileLoaded) {
      const userProfile = await getUserProfile<true>()
      userStore.setProfile(userProfile.data)
    }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Avatar>
          <AvatarFallback>{{ userStore.profile?.displayName?.toUpperCase()[0] || '' }}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <Avatar>
            <AvatarFallback>{{ userStore.profile?.displayName?.toUpperCase()[0] || '' }}</AvatarFallback>
          </Avatar>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
