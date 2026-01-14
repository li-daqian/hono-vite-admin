<script setup lang="ts">
import { getUserProfile } from '@admin/client'
import Avatar from '@admin/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@admin/components/ui/avatar/AvatarFallback.vue'
import DropdownMenu from '@admin/components/ui/dropdown-menu/DropdownMenu.vue'
import DropdownMenuContent from '@admin/components/ui/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuLabel from '@admin/components/ui/dropdown-menu/DropdownMenuLabel.vue'
import DropdownMenuSeparator from '@admin/components/ui/dropdown-menu/DropdownMenuSeparator.vue'
import DropdownMenuTrigger from '@admin/components/ui/dropdown-menu/DropdownMenuTrigger.vue'
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
