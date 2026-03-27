<script setup lang="ts">
import { Badge } from '@admin/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { Check, GripVertical, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  /**
   * All available role name options for selection.
   */
  options: string[]
}>()

const modelValue = defineModel<string[]>({ default: () => [] })

const open = ref(false)
const searchTerm = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const mergedOptions = computed(() => {
  const opts = [...props.options]
  for (const roleName of modelValue.value) {
    if (!opts.some(o => o.trim().toLowerCase() === roleName.trim().toLowerCase())) {
      opts.push(roleName)
    }
  }
  return opts.sort((a, b) => a.localeCompare(b))
})

const filteredOptions = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword)
    return mergedOptions.value
  return mergedOptions.value.filter(r => r.toLowerCase().includes(keyword))
})

function isSelected(roleName: string) {
  return modelValue.value.some(r => r.toLowerCase() === roleName.toLowerCase())
}

function toggleRole(roleName: string) {
  if (isSelected(roleName)) {
    modelValue.value = modelValue.value.filter(r => r.toLowerCase() !== roleName.toLowerCase())
  }
  else {
    modelValue.value = [...modelValue.value, roleName]
  }
  searchTerm.value = ''
}

function removeRole(roleName: string) {
  modelValue.value = modelValue.value.filter(r => r.toLowerCase() !== roleName.toLowerCase())
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
        <template v-if="modelValue.length > 0">
          <Badge
            v-for="roleName in modelValue"
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
          <template v-if="modelValue.length > 0">
            <Badge
              v-for="roleName in modelValue"
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
            placeholder="Search role"
            class="h-7 min-w-20 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
          >
        </div>
      </div>

      <div class="px-3 pt-3 text-sm text-muted-foreground">
        Select an option
      </div>

      <div class="max-h-64 overflow-y-auto p-2">
        <button
          v-for="roleName in filteredOptions"
          :key="roleName"
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          :class="isSelected(roleName) ? 'bg-muted' : ''"
          @click="toggleRole(roleName)"
        >
          <GripVertical class="size-4 text-muted-foreground" />
          <Badge
            variant="outline"
            class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
          >
            {{ roleName }}
          </Badge>
          <Check
            v-if="isSelected(roleName)"
            class="ml-auto size-4 text-foreground"
          />
        </button>

        <div
          v-if="filteredOptions.length === 0"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          No roles found.
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
