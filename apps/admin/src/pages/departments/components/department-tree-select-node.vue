<script setup lang="ts">
import type { DepartmentTreeItemSchema } from '@admin/client'
import { cn } from '@admin/lib/utils'
import { Check, ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import DepartmentTreeSelectNode from './department-tree-select-node.vue'

defineOptions({ name: 'DepartmentTreeSelectNode' })

const props = defineProps<{
  node: DepartmentTreeItemSchema
  depth: number
  selectedValue: string
  forceOpen?: boolean
}>()

const emit = defineEmits<{
  select: [departmentId: string]
}>()

const isOpen = ref(true)
const hasChildren = computed(() => props.node.children.length > 0)
const childrenVisible = computed(() => props.forceOpen || isOpen.value)
</script>

<template>
  <div>
    <div class="flex items-center gap-1 px-2 py-0.5" :style="{ paddingLeft: `${depth * 14}px` }">
      <button
        type="button"
        :class="cn(
          'flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted',
          !hasChildren && 'invisible',
        )"
        @click.stop="isOpen = !isOpen"
      >
        <ChevronRight :class="cn('size-4 transition-transform', childrenVisible && 'rotate-90')" />
      </button>

      <button
        type="button"
        :class="cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
          selectedValue === node.id && 'bg-muted',
        )"
        @click="emit('select', node.id)"
      >
        <span class="min-w-0 flex-1 truncate">{{ node.name }}</span>
        <Check v-if="selectedValue === node.id" class="size-4 shrink-0 text-foreground" />
      </button>
    </div>

    <template v-if="hasChildren && childrenVisible">
      <DepartmentTreeSelectNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-value="selectedValue"
        :force-open="forceOpen"
        @select="departmentId => emit('select', departmentId)"
      />
    </template>
  </div>
</template>
