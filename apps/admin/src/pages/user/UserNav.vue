<script setup lang="ts">
import { postAuthLogout } from '@admin/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import UserAvatar from '@admin/pages/user/UserAvatar.vue'
import UserProfile from '@admin/pages/user/UserProfile.vue'
import router from '@admin/router'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useMenuStore } from '@admin/stores/menu'
import { useUserStore } from '@admin/stores/user'
import { LogOut } from 'lucide-vue-next'

const userStore = useUserStore()
const menuStore = useMenuStore()

async function handleLogOut() {
  await postAuthLogout<true>()

  userStore.reset()
  menuStore.reset()

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
