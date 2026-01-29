<script setup lang="ts">
import { postAuthLogout } from '@admin/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import { AuthManager } from '@admin/lib/auth'
import UserAvatar from '@admin/pages/user/UserAvatar.vue'
import UserProfile from '@admin/pages/user/UserProfile.vue'
import { useUserStore } from '@admin/stores/user'
import { LogOut } from 'lucide-vue-next'

const userStore = useUserStore()

async function handleLogOut() {
  await postAuthLogout<true>()
  await AuthManager.logout(false)
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
