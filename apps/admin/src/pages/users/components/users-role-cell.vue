<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { cn } from '@admin/lib/utils'
import { Check, GripVertical, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useUsers } from './users-provider.vue'

const props = defineProps<{
  row: UserProfileResponseSchema
}>()

const { roleOptions, getUserRoles, setUserRoles, ensureRoleOption } = useUsers()

const open = ref(false)
const searchTerm = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const selectedRoles = computed(() => getUserRoles(props.row))
const mergedRoleOptions = computed(() => {
  const options = [...roleOptions.value]

  for (const roleName of selectedRoles.value) {
    if (!options.some(option => option.trim().toLowerCase() === roleName.trim().toLowerCase())) {
      options.push(roleName)
    }
  }

  return options.sort((left, right) => left.localeCompare(right))
})

const filteredRoleOptions = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  if (!keyword) {
    return mergedRoleOptions.value
  }

  return mergedRoleOptions.value.filter(roleName => roleName.toLowerCase().includes(keyword))
})

const canCreateRole = computed(() => {
  const keyword = searchTerm.value.trim()
  if (!keyword) {
    return false
  }

  return !mergedRoleOptions.value.some(roleName => roleName.toLowerCase() === keyword.toLowerCase())
})

function updateRoles(nextRoles: string[]) {
  setUserRoles(props.row.id, nextRoles)
}

function toggleRole(roleName: string) {
  const nextRoles = [...selectedRoles.value]
  const roleIndex = nextRoles.findIndex(currentRole => currentRole.toLowerCase() === roleName.toLowerCase())

  if (roleIndex >= 0) {
    nextRoles.splice(roleIndex, 1)
  }
  else {
    nextRoles.push(roleName)
  }

  updateRoles(nextRoles)
  searchTerm.value = ''
}

function removeRole(roleName: string) {
  updateRoles(selectedRoles.value.filter(currentRole => currentRole.toLowerCase() !== roleName.toLowerCase()))
}

function createRole() {
  const nextRoleName = searchTerm.value.trim()
  if (!nextRoleName) {
    return
  }

  ensureRoleOption(nextRoleName)
  if (!selectedRoles.value.some(roleName => roleName.toLowerCase() === nextRoleName.toLowerCase())) {
    updateRoles([...selectedRoles.value, nextRoleName])
  }
  searchTerm.value = ''
}

watch(open, async (value) => {
  if (!value) {
    searchTerm.value = ''
    return
  }

  await nextTick()
  searchInputRef.value?.focus()
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border border-transparent px-1 py-1 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
      >
        <template v-if="selectedRoles.length > 0">
          <Badge
            v-for="roleName in selectedRoles"
            :key="roleName"
            variant="outline"
            class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-none"
          >
            {{ roleName }}
          </Badge>
        </template>
        <span v-else class="text-sm text-muted-foreground">Select roles</span>
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" class="w-[320px] p-0">
      <div class="border-b px-3 py-3">
        <div class="flex flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-2">
          <template v-if="selectedRoles.length > 0">
            <Badge
              v-for="roleName in selectedRoles"
              :key="roleName"
              variant="outline"
              class="rounded-md border-border bg-muted px-2 py-1 text-xs font-medium text-foreground"
            >
              <span>{{ roleName }}</span>
              <button
                type="button"
                class="ml-1 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                @click.stop="removeRole(roleName)"
              >
                <X class="size-3" />
              </button>
            </Badge>
          </template>

          <input
            ref="searchInputRef"
            v-model="searchTerm"
            type="text"
            placeholder="Search or create role"
            class="h-7 min-w-20 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
          >
        </div>
      </div>

      <div class="px-3 pt-3 text-sm text-muted-foreground">
        Select an option or create one
      </div>

      <div class="max-h-64 overflow-y-auto p-2">
        <button
          v-for="roleName in filteredRoleOptions"
          :key="roleName"
          type="button"
          :class="cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
            selectedRoles.some(currentRole => currentRole.toLowerCase() === roleName.toLowerCase()) && 'bg-muted',
          )"
          @click="toggleRole(roleName)"
        >
          <GripVertical class="size-4 text-muted-foreground" />
          <Badge variant="outline" class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
            {{ roleName }}
          </Badge>
          <Check
            v-if="selectedRoles.some(currentRole => currentRole.toLowerCase() === roleName.toLowerCase())"
            class="ml-auto size-4 text-foreground"
          />
        </button>

        <button
          v-if="canCreateRole"
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          @click="createRole"
        >
          <span class="text-muted-foreground">Create</span>
          <Badge variant="outline" class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
            {{ searchTerm.trim() }}
          </Badge>
        </button>

        <div
          v-if="filteredRoleOptions.length === 0 && !canCreateRole"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          No roles found.
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
