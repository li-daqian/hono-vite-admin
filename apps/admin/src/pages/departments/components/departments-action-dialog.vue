<script setup lang="ts">
import type { PostDepartmentData, PutDepartmentByIdData } from '@admin/client'
import { getDepartmentById, postDepartment, putDepartmentById } from '@admin/client'
import { Button } from '@admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@admin/components/ui/form'
import { Input } from '@admin/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import { Skeleton } from '@admin/components/ui/skeleton'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'
import DepartmentTreeSelect from './department-tree-select.vue'
import { collectDepartmentAndDescendantIds, getNextDepartmentOrder } from './department-utils'
import { useDepartments } from './departments-provider.vue'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const NO_PARENT_VALUE = '__none__'

const validationSchema = computed(() => toTypedSchema(z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  leader: z.string().trim().max(50, 'Leader must be at most 50 characters').or(z.literal('')).optional(),
  phone: z.string().trim().max(20, 'Phone must be at most 20 characters').or(z.literal('')).optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')),
  status: z.enum(['ACTIVE', 'DISABLED']),
})))

const initialValues = {
  name: '',
  leader: '',
  phone: '',
  email: '',
  status: 'ACTIVE' as const,
}

const isPrefilling = ref(props.mode === 'edit')
const parentId = ref(NO_PARENT_VALUE)
const originalParentId = ref(NO_PARENT_VALUE)
const { departmentTree } = useDepartments()
const excludedDepartmentIds = computed(() => {
  if (props.mode !== 'edit' || !props.id) {
    return []
  }

  return Array.from(collectDepartmentAndDescendantIds(departmentTree.value, props.id))
})

function toNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeParentId(value: string): string | null {
  return value === NO_PARENT_VALUE ? null : value
}

function getAppendOrder(nextParentId: string | null, excludeDepartmentId?: string) {
  return getNextDepartmentOrder(departmentTree.value, nextParentId, excludeDepartmentId)
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function onVueMounted(setValues: (values: Record<string, any>) => void) {
  if (props.mode === 'edit') {
    if (!props.id) {
      isPrefilling.value = false
      toast.error('Cannot edit department: missing id.')
      return
    }

    try {
      const response = await getDepartmentById<true>({ path: { id: props.id } })
      setValues({
        name: response.data.name,
        leader: response.data.leader ?? '',
        phone: response.data.phone ?? '',
        email: response.data.email ?? '',
        status: response.data.status,
      })
      parentId.value = response.data.parentId ?? NO_PARENT_VALUE
      originalParentId.value = parentId.value
    }
    finally {
      isPrefilling.value = false
    }

    return
  }

  setValues(initialValues)
  parentId.value = NO_PARENT_VALUE
  originalParentId.value = NO_PARENT_VALUE
  isPrefilling.value = false
}

async function handleSubmit(values: Record<string, any>) {
  const nextParentId = normalizeParentId(parentId.value)

  if (props.mode === 'add') {
    const payload: PostDepartmentData['body'] = {
      parentId: nextParentId,
      name: values.name.trim(),
      leader: toNullable(values.leader ?? ''),
      phone: toNullable(values.phone ?? ''),
      email: toNullable(values.email ?? ''),
      order: getAppendOrder(nextParentId),
      status: values.status,
    }
    await postDepartment<true>({ body: payload })
    toast.success(`Department "${payload.name}" created.`)
    emit('success')
    handleOpenChange(false)
    return
  }

  if (!props.id) {
    toast.error('Cannot update department: missing id.')
    return
  }

  const payload: PutDepartmentByIdData['body'] = {
    parentId: nextParentId,
    name: values.name.trim(),
    leader: toNullable(values.leader ?? ''),
    phone: toNullable(values.phone ?? ''),
    email: toNullable(values.email ?? ''),
    status: values.status,
  }

  if (parentId.value !== originalParentId.value) {
    payload.order = getAppendOrder(nextParentId, props.id)
  }

  await putDepartmentById<true>({ path: { id: props.id }, body: payload })
  toast.success(`Department "${payload.name}" updated.`)
  emit('success')
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>{{ props.mode === 'edit' ? 'Edit Department' : 'Add New Department' }}</DialogTitle>
        <DialogDescription>
          {{ props.mode === 'edit' ? 'Update this department.' : 'Create a new department.' }}
          Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>

      <Form v-slot="{ handleSubmit: submit, isSubmitting, setValues }" :validation-schema="validationSchema" :initial-values="initialValues" class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <form
          id="department-action-form"
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
          @vue:mounted="() => onVueMounted(setValues)"
          @submit.prevent="submit(handleSubmit)"
        >
          <div class="grid flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="text" placeholder="Engineering" maxlength="50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="grid gap-2">
              <label class="text-sm leading-none font-medium">Parent</label>
              <Skeleton v-if="isPrefilling" class="h-9" />
              <DepartmentTreeSelect
                v-else
                v-model="parentId"
                :departments="departmentTree"
                :empty-value="NO_PARENT_VALUE"
                empty-label="No parent"
                placeholder="Select parent"
                search-placeholder="Search department"
                :exclude-ids="excludedDepartmentIds"
              />
            </div>

            <FormField v-slot="{ componentField }" name="status">
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Skeleton v-if="isPrefilling" class="h-9" />
                <Select
                  v-else
                  :model-value="componentField.modelValue"
                  @update:model-value="componentField['onUpdate:modelValue']"
                >
                  <FormControl>
                    <SelectTrigger class="h-9 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      Active
                    </SelectItem>
                    <SelectItem value="DISABLED">
                      Disabled
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="leader">
              <FormItem>
                <FormLabel>Leader</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="text" placeholder="Jane Doe" maxlength="50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="phone">
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="text" placeholder="+1234567890" maxlength="20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="email" placeholder="engineering@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <DialogFooter class="pt-4 shrink-0">
            <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
              Cancel
            </Button>
            <Button
              type="submit"
              form="department-action-form"
              :disabled="isSubmitting || isPrefilling"
              :class="isSubmitting ? 'animate-pulse' : undefined"
            >
              <span v-if="isSubmitting">{{ props.mode === 'edit' ? 'Saving...' : 'Creating...' }}</span>
              <span v-else>{{ props.mode === 'edit' ? 'Save changes' : 'Create department' }}</span>
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>
