<script setup lang="ts">
import type { DepartmentLeaderResponseSchema, UserProfileResponseSchema } from '@admin/client'
import { getUserPage } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Checkbox } from '@admin/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { Skeleton } from '@admin/components/ui/skeleton'
import { cn } from '@admin/lib/utils'
import { Search, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface UserOption {
  id: string
  username: string
  displayName: string | null
  email: string | null
  status: DepartmentLeaderResponseSchema['status']
}

const props = withDefaults(defineProps<{
  selectedUsers?: DepartmentLeaderResponseSchema[]
  placeholder?: string
  searchPlaceholder?: string
}>(), {
  selectedUsers: () => [],
  placeholder: 'Select leaders',
  searchPlaceholder: 'Search users',
})

const modelValue = defineModel<string[]>({ default: () => [] })

const open = ref(false)
const search = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const fetchedUsers = ref<UserProfileResponseSchema[]>([])
const cachedUsers = ref<UserOption[]>([])
const isLoading = ref(false)

let searchTimer: number | undefined

const userOptions = computed<UserOption[]>(() => {
  const options = new Map<string, UserOption>()

  for (const user of props.selectedUsers) {
    options.set(user.id, toUserOption(user))
  }

  for (const user of cachedUsers.value) {
    options.set(user.id, user)
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

  return modelValue.value.map(userId => optionsById.get(userId) ?? {
    id: userId,
    username: userId,
    displayName: null,
    email: null,
    status: 'ACTIVE' as const,
  })
})

function toUserOption(user: DepartmentLeaderResponseSchema | UserProfileResponseSchema): UserOption {
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
  return modelValue.value.includes(userId)
}

function cacheUser(userId: string) {
  const user = userOptions.value.find(option => option.id === userId)
  if (!user || cachedUsers.value.some(option => option.id === userId)) {
    return
  }

  cachedUsers.value = [...cachedUsers.value, user]
}

function toggleUser(userId: string) {
  if (isSelected(userId)) {
    modelValue.value = modelValue.value.filter(id => id !== userId)
    return
  }

  cacheUser(userId)
  modelValue.value = [...modelValue.value, userId]
}

function removeUser(userId: string) {
  modelValue.value = modelValue.value.filter(id => id !== userId)
}

async function loadUserOptions() {
  isLoading.value = true

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
    isLoading.value = false
  }
}

watch(open, async (value) => {
  if (!value) {
    search.value = ''
    return
  }

  await nextTick()
  searchInputRef.value?.focus()
  void loadUserOptions()
})

watch(search, () => {
  if (!open.value) {
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
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border border-transparent px-1 py-1 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
      >
        <template v-if="selectedUsers.length > 0">
          <Badge
            v-for="user in selectedUsers"
            :key="user.id"
            variant="outline"
            class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-none"
          >
            {{ getUserLabel(user) }}
          </Badge>
        </template>
        <span v-else class="text-sm text-muted-foreground">{{ props.placeholder }}</span>
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" class="w-[360px] p-0">
      <div class="border-b px-3 py-3">
        <div class="flex flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-2">
          <template v-if="selectedUsers.length > 0">
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
                @click.stop="removeUser(user.id)"
              >
                <X class="size-3" />
                <span class="sr-only">Remove user</span>
              </button>
            </Badge>
          </template>

          <div class="relative min-w-32 flex-1">
            <Search class="pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref="searchInputRef"
              v-model="search"
              type="text"
              autocomplete="off"
              :placeholder="props.searchPlaceholder"
              class="h-7 w-full bg-transparent pl-5 text-sm outline-hidden placeholder:text-muted-foreground"
            >
          </div>
        </div>
      </div>

      <div class="max-h-72 overflow-y-auto p-2">
        <div v-if="isLoading" class="space-y-2 p-1">
          <Skeleton v-for="index in 5" :key="index" class="h-10" />
        </div>

        <template v-else-if="userOptions.length > 0">
          <button
            v-for="user in userOptions"
            :key="user.id"
            type="button"
            :class="cn(
              'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted',
              isSelected(user.id) && 'bg-muted',
            )"
            @click="toggleUser(user.id)"
          >
            <Checkbox :model-value="isSelected(user.id)" @click.stop @update:model-value="() => toggleUser(user.id)" />

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
          </button>
        </template>

        <div v-else class="px-2 py-8 text-center text-sm text-muted-foreground">
          No users found.
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
