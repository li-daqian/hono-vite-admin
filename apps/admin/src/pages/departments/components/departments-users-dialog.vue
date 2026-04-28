<script setup lang="ts">
import type {
  DepartmentProfileResponseSchema,
  DepartmentUserResponseSchema,
  PutDepartmentByIdUsersData,
  UserProfileResponseSchema,
} from '@admin/client'
import {
  getDepartmentByIdUsers,
  getUserPage,
  putDepartmentByIdUsers,
} from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import { Checkbox } from '@admin/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'
import { Input } from '@admin/components/ui/input'
import { Skeleton } from '@admin/components/ui/skeleton'
import { cn } from '@admin/lib/utils'
import { Search, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

interface UserOption {
  id: string
  username: string
  displayName: string | null
  email: string | null
  status: DepartmentUserResponseSchema['status']
}

const props = defineProps<{
  open: boolean
  currentRow: DepartmentProfileResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const search = ref('')
const assignedUsers = ref<DepartmentUserResponseSchema[]>([])
const fetchedUsers = ref<UserProfileResponseSchema[]>([])
const selectedUserIds = ref<string[]>([])
const isPrefilling = ref(false)
const isLoadingOptions = ref(false)
const isSubmitting = ref(false)

let searchTimer: number | undefined

const userOptions = computed<UserOption[]>(() => {
  const options = new Map<string, UserOption>()

  for (const user of assignedUsers.value) {
    options.set(user.id, toUserOption(user))
  }

  for (const user of fetchedUsers.value) {
    options.set(user.id, toUserOption(user))
  }

  return [...options.values()].sort((a, b) => {
    const selectedSort = Number(isSelected(b.id)) - Number(isSelected(a.id))
    if (selectedSort !== 0) {
      return selectedSort
    }

    return getUserLabel(a).localeCompare(getUserLabel(b))
  })
})

const selectedUsers = computed(() => {
  const optionsById = new Map(userOptions.value.map(user => [user.id, user]))
  return selectedUserIds.value.map(userId => optionsById.get(userId) ?? {
    id: userId,
    username: userId,
    displayName: null,
    email: null,
    status: 'ACTIVE' as const,
  })
})

function toUserOption(user: DepartmentUserResponseSchema | UserProfileResponseSchema): UserOption {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    status: user.status,
  }
}

function getUserLabel(user: UserOption) {
  return user.displayName ? `${user.displayName} (${user.username})` : user.username
}

function isSelected(userId: string) {
  return selectedUserIds.value.includes(userId)
}

function toggleUser(userId: string) {
  if (isSelected(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
    return
  }

  selectedUserIds.value = [...selectedUserIds.value, userId]
}

function removeUser(userId: string) {
  selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function loadUserOptions() {
  isLoadingOptions.value = true

  try {
    const keyword = search.value.trim()
    const response = await getUserPage<true>({
      query: {
        page: 1,
        pageSize: 50,
        sort: 'username asc',
        search: keyword.length > 0 ? keyword : undefined,
      },
    })
    fetchedUsers.value = response.data.items
  }
  catch {
    fetchedUsers.value = []
  }
  finally {
    isLoadingOptions.value = false
  }
}

async function initialize() {
  isPrefilling.value = true
  search.value = ''

  try {
    const [assignedResult, userResult] = await Promise.all([
      getDepartmentByIdUsers<true>({
        path: {
          id: props.currentRow.id,
        },
      }),
      getUserPage<true>({
        query: {
          page: 1,
          pageSize: 50,
          sort: 'username asc',
        },
      }),
    ])

    assignedUsers.value = assignedResult.data
    fetchedUsers.value = userResult.data.items
    selectedUserIds.value = assignedResult.data.map(user => user.id)
  }
  catch {
    assignedUsers.value = []
    fetchedUsers.value = []
    selectedUserIds.value = []
    toast.error('Failed to load department users.')
  }
  finally {
    isPrefilling.value = false
  }
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  const payload: PutDepartmentByIdUsersData['body'] = {
    userIds: selectedUserIds.value,
  }

  isSubmitting.value = true
  try {
    await putDepartmentByIdUsers<true>({
      path: {
        id: props.currentRow.id,
      },
      body: payload,
    })

    toast.success(`Users assigned to "${props.currentRow.name}".`)
    emit('success')
    handleOpenChange(false)
  }
  finally {
    isSubmitting.value = false
  }
}

watch(() => props.open, (value) => {
  if (value) {
    void initialize()
    return
  }

  assignedUsers.value = []
  fetchedUsers.value = []
  selectedUserIds.value = []
  search.value = ''
}, { immediate: true })

watch(search, () => {
  if (!props.open || isPrefilling.value) {
    return
  }

  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }

  searchTimer = window.setTimeout(() => {
    void loadUserOptions()
  }, 250)
})

onBeforeUnmount(() => {
  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }
})
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>Assign Users</DialogTitle>
        <DialogDescription>
          Manage users assigned to {{ props.currentRow.name }}.
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 space-y-4 overflow-hidden">
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <label class="text-sm leading-none font-medium">Selected Users</label>
            <span class="text-xs text-muted-foreground">{{ selectedUserIds.length }} selected</span>
          </div>

          <div class="min-h-12 rounded-md border bg-background p-2">
            <Skeleton v-if="isPrefilling" class="h-7 w-48" />
            <div v-else-if="selectedUsers.length > 0" class="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              <Badge
                v-for="user in selectedUsers"
                :key="user.id"
                variant="outline"
                class="rounded-md border-border bg-muted px-2 py-1 text-xs font-medium text-foreground"
              >
                <span>{{ getUserLabel(user) }}</span>
                <button
                  type="button"
                  class="ml-1 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                  @click="removeUser(user.id)"
                >
                  <X class="size-3" />
                  <span class="sr-only">Remove user</span>
                </button>
              </Badge>
            </div>
            <div v-else class="flex h-7 items-center text-sm text-muted-foreground">
              No users selected.
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm leading-none font-medium">Users</label>
          <div class="relative">
            <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input v-model="search" class="h-9 pl-8" placeholder="Search users..." />
          </div>
        </div>

        <div class="min-h-64 overflow-y-auto rounded-md border">
          <div v-if="isPrefilling || isLoadingOptions" class="space-y-2 p-3">
            <Skeleton v-for="index in 6" :key="index" class="h-10" />
          </div>

          <template v-else-if="userOptions.length > 0">
            <div
              v-for="user in userOptions"
              :key="user.id"
              :class="cn(
                'flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/60',
                isSelected(user.id) && 'bg-muted/50',
              )"
              @click="toggleUser(user.id)"
            >
              <Checkbox
                :model-value="isSelected(user.id)"
                @click.stop
                @update:model-value="() => toggleUser(user.id)"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ getUserLabel(user) }}
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  {{ user.email ?? user.username }}
                </div>
              </div>

              <Badge
                variant="outline"
                :class="cn(
                  'shrink-0 capitalize',
                  user.status === 'ACTIVE'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
                )"
              >
                {{ user.status.toLowerCase() }}
              </Badge>
            </div>
          </template>

          <div v-else class="px-3 py-10 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        </div>
      </div>

      <DialogFooter class="pt-4 shrink-0">
        <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
          Cancel
        </Button>
        <Button
          :disabled="isSubmitting || isPrefilling"
          :class="isSubmitting ? 'animate-pulse' : undefined"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting">Saving...</span>
          <span v-else>Save changes</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
