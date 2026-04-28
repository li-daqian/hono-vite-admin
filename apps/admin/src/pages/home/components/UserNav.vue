<script setup lang="ts">
import { postAuthLogout } from '@admin/client'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@admin/components/ui/dropdown-menu'
import { AuthManager } from '@admin/lib/auth'
import ChangePasswordDialog from '@admin/pages/home/components/ChangePasswordDialog.vue'
import UserAvatar from '@admin/pages/home/components/UserAvatar.vue'
import UserProfile from '@admin/pages/home/components/UserProfile.vue'
import { useAppConfigStore } from '@admin/stores/app-config'
import { useAuthStore } from '@admin/stores/auth'
import { KeyRound, LogOut } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const authStore = useAuthStore()
const appConfigStore = useAppConfigStore()
const changePasswordOpen = ref(false)
const readOnly = computed(() => appConfigStore.readOnlyMode)

async function handleLogOut() {
  await postAuthLogout<true>()
  await AuthManager.logout(false)
}

function handleOpenChangePassword() {
  if (readOnly.value) {
    return
  }

  changePasswordOpen.value = true
}
</script>

<template>
  <div>
    <ChangePasswordDialog v-model:open="changePasswordOpen" />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <UserAvatar :user-profile="authStore.user" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="mt-2 mr-2">
        <DropdownMenuLabel>
          <UserProfile :user-profile="authStore.user" class="w-48" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <PermissionTooltip :message="readOnly ? appConfigStore.readOnlyMessage : null" wrapper-class="block w-full">
          <DropdownMenuItem :disabled="readOnly" @click="handleOpenChangePassword">
            <KeyRound :size="16" />
            Change password
          </DropdownMenuItem>
        </PermissionTooltip>
        <DropdownMenuItem @click="handleLogOut">
          <LogOut :size="16" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
