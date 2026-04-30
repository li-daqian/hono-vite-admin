<script setup lang="ts">
import type {
  DictItemResponseSchema,
  DictTypeResponseSchema,
  PostSystemDictItemsData,
  PostSystemDictTypesData,
  PutSystemDictItemsByIdData,
  PutSystemDictTypesByIdData,
} from '@admin/client'
import {
  deleteSystemDictItemsById,
  deleteSystemDictTypesById,
  getSystemDictItemsPage,
  getSystemDictTypesPage,
  postSystemDictItems,
  postSystemDictTypes,
  putSystemDictItemsById,
  putSystemDictTypesById,
} from '@admin/client'
import ConfirmDialog from '@admin/components/ConfirmDialog.vue'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import { Skeleton } from '@admin/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { Textarea } from '@admin/components/ui/textarea'
import { getDictionaryColorClass } from '@admin/lib/dictionary'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { cn } from '@admin/lib/utils'
import { useAppConfigStore } from '@admin/stores/app-config'
import { useDictionaryStore } from '@admin/stores/dictionaries'
import { AlertTriangle, BookOpenText, GripVertical, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

type DictStatus = DictTypeResponseSchema['status']
type DictColor = DictItemResponseSchema['color']
type DropPosition = 'before' | 'after'
type DeleteTarget = {
  kind: 'type' | 'item'
  id: string
  name: string
} | null

const COLOR_OPTIONS: Array<{ value: NonNullable<DictColor>, label: string }> = [
  { value: 'green', label: 'Green' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
  { value: 'violet', label: 'Violet' },
  { value: 'red', label: 'Red' },
  { value: 'slate', label: 'Slate' },
]

const permissions = usePageActionPermissions()
const appConfig = useAppConfigStore()
const dictionaryStore = useDictionaryStore()
const createPermission = computed(() => permissions.resolve('create', { actionName: 'Create', subject: 'dictionary records' }))
const editPermission = computed(() => permissions.resolve('edit', { actionName: 'Update', subject: 'dictionary records' }))
const deletePermission = computed(() => permissions.resolve('delete', { actionName: 'Delete', subject: 'dictionary records' }))

const isReadOnly = computed(() => appConfig.readOnlyMode)
const canCreate = computed(() => !isReadOnly.value && createPermission.value.allowed)
const canEdit = computed(() => !isReadOnly.value && editPermission.value.allowed)
const canDelete = computed(() => !isReadOnly.value && deletePermission.value.allowed)
const createDisabledReason = computed(() => isReadOnly.value ? 'Dictionaries are read-only in this deployment.' : createPermission.value.reason)
const editDisabledReason = computed(() => isReadOnly.value ? 'Dictionaries are read-only in this deployment.' : editPermission.value.reason)
const deleteDisabledReason = computed(() => isReadOnly.value ? 'Dictionaries are read-only in this deployment.' : deletePermission.value.reason)

const typeSearch = ref('')
const itemSearch = ref('')
const types = ref<DictTypeResponseSchema[]>([])
const items = ref<DictItemResponseSchema[]>([])
const selectedTypeId = ref<string | null>(null)
const isTypeLoading = ref(true)
const isItemLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const isReordering = ref(false)
const draggingTypeId = ref<string | null>(null)
const typeDropTargetId = ref<string | null>(null)
const typeDropPosition = ref<DropPosition | null>(null)
const draggingItemId = ref<string | null>(null)
const itemDropTargetId = ref<string | null>(null)
const itemDropPosition = ref<DropPosition | null>(null)

const typeDialogOpen = ref(false)
const typeDialogMode = ref<'add' | 'edit'>('add')
const itemDialogOpen = ref(false)
const itemDialogMode = ref<'add' | 'edit'>('add')
const deleteTarget = ref<DeleteTarget>(null)
const typeForm = reactive({
  id: '',
  code: '',
  name: '',
  status: 'ACTIVE' as DictStatus,
  remark: '',
})
const itemForm = reactive({
  id: '',
  typeId: '',
  value: '',
  label: '',
  color: 'slate' as NonNullable<DictColor>,
  status: 'ACTIVE' as DictStatus,
  remark: '',
})
const typeErrors = reactive<Record<string, string | null>>({})
const itemErrors = reactive<Record<string, string | null>>({})

const selectedType = computed(() => types.value.find(type => type.id === selectedTypeId.value) ?? null)
const canReorderTypes = computed(() => canEdit.value && !typeSearch.value.trim() && types.value.length > 1 && !isReordering.value)
const canReorderItems = computed(() => canEdit.value && !itemSearch.value.trim() && items.value.length > 1 && !isReordering.value)
const typeDragDisabledReason = computed(() => {
  if (!canEdit.value)
    return editDisabledReason.value
  if (typeSearch.value.trim())
    return 'Clear type search before reordering.'
  if (types.value.length <= 1)
    return 'At least two dictionary types are required.'
  if (isReordering.value)
    return 'Reordering...'
  return null
})
const itemDragDisabledReason = computed(() => {
  if (!canEdit.value)
    return editDisabledReason.value
  if (itemSearch.value.trim())
    return 'Clear item search before reordering.'
  if (items.value.length <= 1)
    return 'At least two dictionary items are required.'
  if (isReordering.value)
    return 'Reordering...'
  return null
})

function resetTypeForm(type?: DictTypeResponseSchema) {
  typeForm.id = type?.id ?? ''
  typeForm.code = type?.code ?? ''
  typeForm.name = type?.name ?? ''
  typeForm.status = type?.status ?? 'ACTIVE'
  typeForm.remark = type?.remark ?? ''
  typeErrors.code = null
  typeErrors.name = null
}

function resetItemForm(item?: DictItemResponseSchema) {
  itemForm.id = item?.id ?? ''
  itemForm.typeId = item?.typeId ?? selectedTypeId.value ?? ''
  itemForm.value = item?.value ?? ''
  itemForm.label = item?.label ?? ''
  itemForm.color = item?.color ?? 'slate'
  itemForm.status = item?.status ?? 'ACTIVE'
  itemForm.remark = item?.remark ?? ''
  itemErrors.typeId = null
  itemErrors.value = null
  itemErrors.label = null
}

function validateTypeForm(): boolean {
  const code = typeForm.code.trim()
  const name = typeForm.name.trim()

  typeErrors.code = /^[a-z][a-z0-9_-]{1,63}$/.test(code)
    ? null
    : 'Use 2-64 lowercase letters, numbers, underscores, or hyphens.'
  typeErrors.name = name ? null : 'Name is required.'

  return !typeErrors.code && !typeErrors.name
}

function validateItemForm(): boolean {
  itemErrors.typeId = itemForm.typeId ? null : 'Type is required.'
  itemErrors.value = itemForm.value.trim() ? null : 'Value is required.'
  itemErrors.label = itemForm.label.trim() ? null : 'Label is required.'

  return !itemErrors.typeId && !itemErrors.value && !itemErrors.label
}

function getDropPosition(event: DragEvent): DropPosition {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function reorderByDropPosition<T extends { id: string }>(
  records: T[],
  sourceId: string,
  targetId: string,
  position: DropPosition,
): T[] {
  const nextRecords = [...records]
  const sourceIndex = nextRecords.findIndex(record => record.id === sourceId)
  if (sourceIndex === -1)
    return records

  const [source] = nextRecords.splice(sourceIndex, 1)
  const targetIndex = nextRecords.findIndex(record => record.id === targetId)
  if (!source || targetIndex === -1)
    return records

  nextRecords.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, source)
  return nextRecords
}

function withSequentialOrder<T extends { order: number }>(records: T[]): T[] {
  return records.map((record, index) => ({ ...record, order: index + 1 }))
}

async function getNextTypeOrder(): Promise<number> {
  const response = await getSystemDictTypesPage<true>({
    query: {
      page: 1,
      pageSize: 1,
      sort: 'order desc',
    },
  })
  return Math.min((response.data.items[0]?.order ?? 0) + 1, 9999)
}

async function getNextItemOrder(typeId: string): Promise<number> {
  const response = await getSystemDictItemsPage<true>({
    query: {
      page: 1,
      pageSize: 1,
      sort: 'order desc',
      typeId,
    },
  })
  return Math.min((response.data.items[0]?.order ?? 0) + 1, 9999)
}

async function loadTypes() {
  isTypeLoading.value = true
  try {
    const response = await getSystemDictTypesPage<true>({
      query: {
        page: 1,
        pageSize: 100,
        sort: 'order asc,code asc',
        search: typeSearch.value.trim() || undefined,
      },
    })
    types.value = response.data.items

    if (!selectedTypeId.value || !types.value.some(type => type.id === selectedTypeId.value)) {
      selectedTypeId.value = types.value[0]?.id ?? null
    }
  }
  catch {
    types.value = []
    selectedTypeId.value = null
  }
  finally {
    isTypeLoading.value = false
  }
}

async function loadItems() {
  if (!selectedTypeId.value) {
    items.value = []
    return
  }

  isItemLoading.value = true
  try {
    const response = await getSystemDictItemsPage<true>({
      query: {
        page: 1,
        pageSize: 100,
        sort: 'order asc,value asc',
        typeId: selectedTypeId.value,
        search: itemSearch.value.trim() || undefined,
      },
    })
    items.value = response.data.items
  }
  catch {
    items.value = []
  }
  finally {
    isItemLoading.value = false
  }
}

function clearTypeDropState() {
  draggingTypeId.value = null
  typeDropTargetId.value = null
  typeDropPosition.value = null
}

function clearItemDropState() {
  draggingItemId.value = null
  itemDropTargetId.value = null
  itemDropPosition.value = null
}

function handleTypeDragStart(typeId: string, event: DragEvent) {
  if (!canReorderTypes.value) {
    event.preventDefault()
    return
  }

  event.dataTransfer?.setData('text/plain', typeId)
  if (event.dataTransfer)
    event.dataTransfer.effectAllowed = 'move'
  draggingTypeId.value = typeId
}

function handleTypeDragOver(typeId: string, event: DragEvent) {
  const sourceId = draggingTypeId.value
  if (!canReorderTypes.value || !sourceId || sourceId === typeId)
    return

  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move'
  typeDropTargetId.value = typeId
  typeDropPosition.value = getDropPosition(event)
}

function handleTypeDragLeave(typeId: string, event: DragEvent) {
  const currentTarget = event.currentTarget as Node | null
  const relatedTarget = (event as DragEvent & { relatedTarget: EventTarget | null }).relatedTarget as Node | null
  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget))
    return
  if (typeDropTargetId.value === typeId) {
    typeDropTargetId.value = null
    typeDropPosition.value = null
  }
}

async function persistTypeOrder(nextTypes: DictTypeResponseSchema[]) {
  const previousTypes = types.value
  const orderedTypes = withSequentialOrder(nextTypes)
  types.value = orderedTypes
  isReordering.value = true

  try {
    await Promise.all(orderedTypes.map(type =>
      putSystemDictTypesById<true>({
        path: { id: type.id },
        body: { order: type.order },
      }),
    ))
    toast.success('Dictionary types reordered.')
    await loadTypes()
  }
  catch {
    types.value = previousTypes
    toast.error('Failed to reorder dictionary types.')
    await loadTypes()
  }
  finally {
    isReordering.value = false
  }
}

async function handleTypeDrop(typeId: string, event: DragEvent) {
  const sourceId = draggingTypeId.value
  if (!canReorderTypes.value || !sourceId || sourceId === typeId) {
    clearTypeDropState()
    return
  }

  event.preventDefault()
  const position = getDropPosition(event)
  clearTypeDropState()
  await persistTypeOrder(reorderByDropPosition(types.value, sourceId, typeId, position))
}

function handleItemDragStart(itemId: string, event: DragEvent) {
  if (!canReorderItems.value) {
    event.preventDefault()
    return
  }

  event.dataTransfer?.setData('text/plain', itemId)
  if (event.dataTransfer)
    event.dataTransfer.effectAllowed = 'move'
  draggingItemId.value = itemId
}

function handleItemDragOver(itemId: string, event: DragEvent) {
  const sourceId = draggingItemId.value
  if (!canReorderItems.value || !sourceId || sourceId === itemId)
    return

  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move'
  itemDropTargetId.value = itemId
  itemDropPosition.value = getDropPosition(event)
}

function handleItemDragLeave(itemId: string, event: DragEvent) {
  const currentTarget = event.currentTarget as Node | null
  const relatedTarget = (event as DragEvent & { relatedTarget: EventTarget | null }).relatedTarget as Node | null
  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget))
    return
  if (itemDropTargetId.value === itemId) {
    itemDropTargetId.value = null
    itemDropPosition.value = null
  }
}

async function persistItemOrder(nextItems: DictItemResponseSchema[]) {
  const previousItems = items.value
  const orderedItems = withSequentialOrder(nextItems)
  items.value = orderedItems
  isReordering.value = true

  try {
    await Promise.all(orderedItems.map(item =>
      putSystemDictItemsById<true>({
        path: { id: item.id },
        body: { order: item.order },
      }),
    ))
    toast.success('Dictionary items reordered.')
    await loadItems()
    if (selectedType.value)
      await dictionaryStore.fetchType(selectedType.value.code, true)
  }
  catch {
    items.value = previousItems
    toast.error('Failed to reorder dictionary items.')
    await loadItems()
  }
  finally {
    isReordering.value = false
  }
}

async function handleItemDrop(itemId: string, event: DragEvent) {
  const sourceId = draggingItemId.value
  if (!canReorderItems.value || !sourceId || sourceId === itemId) {
    clearItemDropState()
    return
  }

  event.preventDefault()
  const position = getDropPosition(event)
  clearItemDropState()
  await persistItemOrder(reorderByDropPosition(items.value, sourceId, itemId, position))
}

function openAddTypeDialog() {
  if (!canCreate.value)
    return
  typeDialogMode.value = 'add'
  resetTypeForm()
  typeDialogOpen.value = true
}

function openEditTypeDialog(type: DictTypeResponseSchema) {
  if (!canEdit.value)
    return
  typeDialogMode.value = 'edit'
  resetTypeForm(type)
  typeDialogOpen.value = true
}

function openAddItemDialog() {
  if (!canCreate.value || !selectedTypeId.value)
    return
  itemDialogMode.value = 'add'
  resetItemForm()
  itemDialogOpen.value = true
}

function openEditItemDialog(item: DictItemResponseSchema) {
  if (!canEdit.value)
    return
  itemDialogMode.value = 'edit'
  resetItemForm(item)
  itemDialogOpen.value = true
}

async function saveType() {
  if (!validateTypeForm())
    return

  isSaving.value = true
  try {
    if (typeDialogMode.value === 'add') {
      const payload: PostSystemDictTypesData['body'] = {
        code: typeForm.code.trim(),
        name: typeForm.name.trim(),
        order: await getNextTypeOrder(),
        status: typeForm.status,
        remark: typeForm.remark.trim() || null,
      }
      const response = await postSystemDictTypes<true>({ body: payload })
      selectedTypeId.value = response.data.id
      toast.success(`Dictionary type "${payload.name}" created.`)
    }
    else {
      const payload: PutSystemDictTypesByIdData['body'] = {
        code: typeForm.code.trim(),
        name: typeForm.name.trim(),
        status: typeForm.status,
        remark: typeForm.remark.trim() || null,
      }
      await putSystemDictTypesById<true>({ path: { id: typeForm.id }, body: payload })
      toast.success(`Dictionary type "${payload.name}" updated.`)
    }

    typeDialogOpen.value = false
    await loadTypes()
    await loadItems()
  }
  finally {
    isSaving.value = false
  }
}

async function saveItem() {
  if (!validateItemForm())
    return

  isSaving.value = true
  try {
    if (itemDialogMode.value === 'add') {
      const payload: PostSystemDictItemsData['body'] = {
        typeId: itemForm.typeId,
        value: itemForm.value.trim(),
        label: itemForm.label.trim(),
        color: itemForm.color,
        order: await getNextItemOrder(itemForm.typeId),
        status: itemForm.status,
        remark: itemForm.remark.trim() || null,
      }
      await postSystemDictItems<true>({ body: payload })
      toast.success(`Dictionary item "${payload.label}" created.`)
    }
    else {
      const existingItem = items.value.find(item => item.id === itemForm.id)
      const isMovingType = Boolean(existingItem && existingItem.typeId !== itemForm.typeId)
      const payload: PutSystemDictItemsByIdData['body'] = {
        typeId: itemForm.typeId,
        value: itemForm.value.trim(),
        label: itemForm.label.trim(),
        color: itemForm.color,
        ...(isMovingType ? { order: await getNextItemOrder(itemForm.typeId) } : {}),
        status: itemForm.status,
        remark: itemForm.remark.trim() || null,
      }
      await putSystemDictItemsById<true>({ path: { id: itemForm.id }, body: payload })
      toast.success(`Dictionary item "${payload.label}" updated.`)
    }

    itemDialogOpen.value = false
    await loadTypes()
    await loadItems()
    if (selectedType.value) {
      await dictionaryStore.fetchType(selectedType.value.code, true)
    }
  }
  finally {
    isSaving.value = false
  }
}

function requestDelete(target: DeleteTarget) {
  if (!target || !canDelete.value)
    return
  deleteTarget.value = target
}

async function confirmDelete() {
  if (!deleteTarget.value)
    return

  isDeleting.value = true
  try {
    const target = deleteTarget.value
    if (target.kind === 'type') {
      await deleteSystemDictTypesById<true>({ path: { id: target.id } })
      toast.success(`Dictionary type "${target.name}" deleted.`)
      if (selectedTypeId.value === target.id) {
        selectedTypeId.value = null
      }
      await loadTypes()
      await loadItems()
    }
    else {
      await deleteSystemDictItemsById<true>({ path: { id: target.id } })
      toast.success(`Dictionary item "${target.name}" deleted.`)
      await loadTypes()
      await loadItems()
      if (selectedType.value) {
        await dictionaryStore.fetchType(selectedType.value.code, true)
      }
    }
    deleteTarget.value = null
  }
  finally {
    isDeleting.value = false
  }
}

let typeSearchTimer: number | undefined
let itemSearchTimer: number | undefined

watch(typeSearch, () => {
  if (typeSearchTimer)
    window.clearTimeout(typeSearchTimer)
  typeSearchTimer = window.setTimeout(() => {
    void loadTypes()
  }, 300)
})

watch(itemSearch, () => {
  if (itemSearchTimer)
    window.clearTimeout(itemSearchTimer)
  itemSearchTimer = window.setTimeout(() => {
    void loadItems()
  }, 300)
})

watch(selectedTypeId, () => {
  itemSearch.value = ''
  void loadItems()
})

onMounted(async () => {
  await loadTypes()
  await loadItems()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Dictionaries
        </h2>
        <p class="text-muted-foreground">
          Manage shared labels, colors, and filter options.
        </p>
      </div>
      <PermissionTooltip :message="createDisabledReason">
        <Button :disabled="!canCreate" @click="openAddTypeDialog">
          <Plus class="size-4" />
          Type
        </Button>
      </PermissionTooltip>
    </div>

    <div class="grid min-h-[560px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section class="flex min-h-0 flex-col overflow-hidden rounded-md border bg-background">
        <div class="flex items-center gap-2 border-b p-3">
          <Input v-model="typeSearch" placeholder="Search types..." class="h-9" />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <template v-if="isTypeLoading">
            <div v-for="index in 6" :key="index" class="mb-2 rounded-md border p-3">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="mt-2 h-3 w-20" />
            </div>
          </template>

          <div
            v-for="type in types"
            v-else
            :key="type.id"
            role="button"
            tabindex="0"
            :class="cn(
              'mb-2 w-full rounded-md border p-3 text-left transition-colors',
              selectedTypeId === type.id ? 'border-primary bg-primary/5' : 'hover:bg-muted',
              draggingTypeId === type.id && 'opacity-50',
              typeDropTargetId === type.id && typeDropPosition === 'before' && 'border-t-2 border-t-primary',
              typeDropTargetId === type.id && typeDropPosition === 'after' && 'border-b-2 border-b-primary',
            )"
            @click="selectedTypeId = type.id"
            @keydown.enter="selectedTypeId = type.id"
            @keydown.space.prevent="selectedTypeId = type.id"
            @dragover="handleTypeDragOver(type.id, $event)"
            @dragleave="handleTypeDragLeave(type.id, $event)"
            @drop="handleTypeDrop(type.id, $event)"
          >
            <div class="flex items-start gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :draggable="canReorderTypes"
                :disabled="!canReorderTypes"
                :title="canReorderTypes ? 'Drag to reorder' : typeDragDisabledReason ?? undefined"
                :class="cn(
                  'mt-0.5 size-7 shrink-0 text-muted-foreground',
                  canReorderTypes && 'cursor-grab active:cursor-grabbing hover:text-foreground',
                )"
                @click.stop
                @dragstart="handleTypeDragStart(type.id, $event)"
                @dragend="clearTypeDropState"
              >
                <GripVertical class="size-4" />
                <span class="sr-only">Drag to reorder</span>
              </Button>
              <div class="flex min-w-0 flex-1 items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">
                    {{ type.name }}
                  </p>
                  <p class="truncate font-mono text-xs text-muted-foreground">
                    {{ type.code }}
                  </p>
                </div>
                <Badge :variant="type.status === 'ACTIVE' ? 'default' : 'secondary'" class="shrink-0">
                  {{ type.status.toLowerCase() }}
                </Badge>
              </div>
            </div>
            <p class="mt-2 ps-9 text-xs text-muted-foreground">
              {{ type.itemCount }} items
            </p>
          </div>

          <div v-if="!isTypeLoading && types.length === 0" class="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No dictionary types.
          </div>
        </div>
      </section>

      <section class="flex min-w-0 min-h-0 flex-col gap-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <BookOpenText class="size-5 text-muted-foreground" />
              <h3 class="truncate text-lg font-semibold">
                {{ selectedType?.name ?? 'Dictionary Items' }}
              </h3>
            </div>
            <p class="font-mono text-sm text-muted-foreground">
              {{ selectedType?.code ?? 'Select a dictionary type' }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Input v-model="itemSearch" placeholder="Search items..." class="h-9 w-56" :disabled="!selectedTypeId" />
            <PermissionTooltip :message="createDisabledReason">
              <Button :disabled="!canCreate || !selectedTypeId" @click="openAddItemDialog">
                <Plus class="size-4" />
                Item
              </Button>
            </PermissionTooltip>
          </div>
        </div>

        <div v-if="selectedType" class="flex flex-wrap gap-2">
          <PermissionTooltip :message="editDisabledReason">
            <Button variant="outline" size="sm" :disabled="!canEdit" @click="openEditTypeDialog(selectedType)">
              <Pencil class="size-4" />
              Edit Type
            </Button>
          </PermissionTooltip>
          <PermissionTooltip :message="deleteDisabledReason">
            <Button
              variant="outline"
              size="sm"
              class="text-destructive hover:text-destructive"
              :disabled="!canDelete"
              @click="requestDelete({ kind: 'type', id: selectedType.id, name: selectedType.name })"
            >
              <Trash2 class="size-4" />
              Delete Type
            </Button>
          </PermissionTooltip>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-10" />
                <TableHead>Value</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="isItemLoading">
                <TableRow v-for="index in 5" :key="index">
                  <TableCell colspan="6">
                    <Skeleton class="h-8 w-full" />
                  </TableCell>
                </TableRow>
              </template>

              <template v-else-if="items.length">
                <TableRow
                  v-for="item in items"
                  :key="item.id"
                  :class="cn(
                    'group/row',
                    draggingItemId === item.id && 'opacity-50',
                    itemDropTargetId === item.id && itemDropPosition === 'before' && 'border-t-2 border-t-primary',
                    itemDropTargetId === item.id && itemDropPosition === 'after' && 'border-b-2 border-b-primary',
                  )"
                  @dragover="handleItemDragOver(item.id, $event)"
                  @dragleave="handleItemDragLeave(item.id, $event)"
                  @drop="handleItemDrop(item.id, $event)"
                >
                  <TableCell class="w-10 px-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      :draggable="canReorderItems"
                      :disabled="!canReorderItems"
                      :title="canReorderItems ? 'Drag to reorder' : itemDragDisabledReason ?? undefined"
                      :class="cn(
                        'size-7 text-muted-foreground',
                        canReorderItems && 'cursor-grab active:cursor-grabbing hover:text-foreground',
                      )"
                      @dragstart="handleItemDragStart(item.id, $event)"
                      @dragend="clearItemDropState"
                    >
                      <GripVertical class="size-4" />
                      <span class="sr-only">Drag to reorder</span>
                    </Button>
                  </TableCell>
                  <TableCell class="font-mono text-xs">
                    {{ item.value }}
                  </TableCell>
                  <TableCell class="font-medium">
                    {{ item.label }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" :class="getDictionaryColorClass(item.color)">
                      {{ item.color ?? 'slate' }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="item.status === 'ACTIVE' ? 'default' : 'secondary'">
                      {{ item.status.toLowerCase() }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <PermissionTooltip :message="editDisabledReason">
                        <Button variant="ghost" size="icon" class="size-8" :disabled="!canEdit" @click="openEditItemDialog(item)">
                          <Pencil class="size-4" />
                        </Button>
                      </PermissionTooltip>
                      <PermissionTooltip :message="deleteDisabledReason">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-8 text-destructive hover:text-destructive"
                          :disabled="!canDelete"
                          @click="requestDelete({ kind: 'item', id: item.id, name: item.label })"
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      </PermissionTooltip>
                    </div>
                  </TableCell>
                </TableRow>
              </template>

              <TableRow v-else>
                <TableCell colspan="6" class="h-32 text-center text-muted-foreground">
                  {{ selectedTypeId ? 'No dictionary items.' : 'Select a dictionary type.' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </div>

    <Dialog v-model:open="typeDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="text-start">
          <DialogTitle>{{ typeDialogMode === 'edit' ? 'Edit Dictionary Type' : 'Add Dictionary Type' }}</DialogTitle>
          <DialogDescription>
            Dictionary types group related label and filter values.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid gap-2">
            <Label for="type-code">Code</Label>
            <Input id="type-code" v-model="typeForm.code" placeholder="user_status" maxlength="64" :aria-invalid="Boolean(typeErrors.code)" />
            <p v-if="typeErrors.code" class="text-sm text-destructive">
              {{ typeErrors.code }}
            </p>
          </div>
          <div class="grid gap-2">
            <Label for="type-name">Name</Label>
            <Input id="type-name" v-model="typeForm.name" placeholder="User Status" maxlength="50" :aria-invalid="Boolean(typeErrors.name)" />
            <p v-if="typeErrors.name" class="text-sm text-destructive">
              {{ typeErrors.name }}
            </p>
          </div>
          <div class="grid gap-2">
            <Label>Status</Label>
            <Select v-model="typeForm.status">
              <SelectTrigger class="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>
                <SelectItem value="DISABLED">
                  Disabled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="type-remark">Remark</Label>
            <Textarea id="type-remark" v-model="typeForm.remark" maxlength="255" class="resize-none" :rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="isSaving" @click="typeDialogOpen = false">
            Cancel
          </Button>
          <Button :disabled="isSaving" :class="isSaving ? 'animate-pulse' : undefined" @click="saveType">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="itemDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="text-start">
          <DialogTitle>{{ itemDialogMode === 'edit' ? 'Edit Dictionary Item' : 'Add Dictionary Item' }}</DialogTitle>
          <DialogDescription>
            Dictionary items provide labels, colors, and filter values.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid gap-2">
            <Label>Type</Label>
            <Select v-model="itemForm.typeId">
              <SelectTrigger class="h-9" :aria-invalid="Boolean(itemErrors.typeId)">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="type in types" :key="type.id" :value="type.id">
                  {{ type.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="itemErrors.typeId" class="text-sm text-destructive">
              {{ itemErrors.typeId }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-2">
              <Label for="item-value">Value</Label>
              <Input id="item-value" v-model="itemForm.value" placeholder="ACTIVE" maxlength="64" :aria-invalid="Boolean(itemErrors.value)" />
              <p v-if="itemErrors.value" class="text-sm text-destructive">
                {{ itemErrors.value }}
              </p>
            </div>
            <div class="grid gap-2">
              <Label for="item-label">Label</Label>
              <Input id="item-label" v-model="itemForm.label" placeholder="Active" maxlength="50" :aria-invalid="Boolean(itemErrors.label)" />
              <p v-if="itemErrors.label" class="text-sm text-destructive">
                {{ itemErrors.label }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-2">
              <Label>Color</Label>
              <Select v-model="itemForm.color">
                <SelectTrigger class="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="color in COLOR_OPTIONS" :key="color.value" :value="color.value">
                    {{ color.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>Status</Label>
              <Select v-model="itemForm.status">
                <SelectTrigger class="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    Active
                  </SelectItem>
                  <SelectItem value="DISABLED">
                    Disabled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="item-remark">Remark</Label>
            <Textarea id="item-remark" v-model="itemForm.remark" maxlength="255" class="resize-none" :rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="isSaving" @click="itemDialogOpen = false">
            Cancel
          </Button>
          <Button :disabled="isSaving" :class="isSaving ? 'animate-pulse' : undefined" @click="saveItem">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      :handle-confirm="confirmDelete"
      :is-loading="isDeleting"
      confirm-text="Delete"
      destructive
      @update:open="value => { if (!value) deleteTarget = null }"
    >
      <template #title>
        <span class="text-destructive">
          <AlertTriangle class="me-1 inline-block stroke-destructive" :size="18" />
          Delete {{ deleteTarget?.kind === 'type' ? 'Dictionary Type' : 'Dictionary Item' }}
        </span>
      </template>

      <template #desc>
        <p class="text-sm leading-6">
          Are you sure you want to delete
          <span class="font-bold">{{ deleteTarget?.name }}</span>?
          <span v-if="deleteTarget?.kind === 'type'"> Its items will be removed too.</span>
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
