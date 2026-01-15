<script setup lang="ts">
import { getUserProfile, postAuthLogout } from '@admin/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import UserAvatar from '@admin/pages/user/UserAvatar.vue'
import UserProfile from '@admin/pages/user/UserProfile.vue'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useUserStore } from '@admin/stores/user'
import { LogOut } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  if (!userStore.isProfileLoaded) {
    const userProfile = await getUserProfile<true>()
    userStore.setProfile(userProfile.data)
  }
})

async function handleLogOut() {
  await postAuthLogout<true>()

  await router.replace({ name: ROUTE_NAMES.LOGIN })
}
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
        <DropdownMenuItem @click="handleLogOut">
          <LogOut :size="16" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
