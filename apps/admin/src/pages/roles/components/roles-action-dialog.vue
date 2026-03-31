<script setup lang="ts">
import type { PostRoleData, PutRoleByIdData } from '@admin/client'
import { getRoleById, postRole, putRoleById } from '@admin/client'
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
import { Skeleton } from '@admin/components/ui/skeleton'
import { Textarea } from '@admin/components/ui/textarea'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const validationSchema = computed(() => toTypedSchema(z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z.string().trim().max(255, 'Description must be at most 255 characters').or(z.literal('')).optional(),
})))

const initialValues = { name: '', description: '' }
const isPrefilling = ref(props.mode === 'edit')

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function onVueMounted(setValues: (values: Record<string, any>) => void) {
  if (props.mode === 'edit') {
    if (!props.id) {
      isPrefilling.value = false
      toast.error('Cannot edit role: missing id.')
      return
    }

    try {
      const roleRes = await getRoleById<true>({ path: { id: props.id } })
      setValues({
        name: roleRes.data.name,
        description: roleRes.data.description ?? '',
      })
    }
    finally {
      isPrefilling.value = false
    }

    return
  }

  setValues(initialValues)
  isPrefilling.value = false
}

async function handleSubmit(values: Record<string, any>) {
  const description = values.description?.trim() || null

  if (props.mode === 'add') {
    const payload: PostRoleData['body'] = {
      name: values.name.trim(),
      description,
    }
    await postRole<true>({ body: payload })
    toast.success(`Role "${payload.name}" created.`)
    emit('success')
    handleOpenChange(false)
    return
  }

  if (!props.id) {
    toast.error('Cannot update role: missing id.')
    return
  }

  const payload: PutRoleByIdData['body'] = {
    name: values.name.trim(),
    description,
  }
  await putRoleById<true>({ path: { id: props.id }, body: payload })
  toast.success(`Role "${payload.name}" updated.`)
  emit('success')
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>{{ props.mode === 'edit' ? 'Edit Role' : 'Add New Role' }}</DialogTitle>
        <DialogDescription>
          {{ props.mode === 'edit' ? 'Update this role.' : 'Create a new role.' }}
          Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>

      <Form v-slot="{ handleSubmit: submit, isSubmitting, setValues }" :validation-schema="validationSchema" :initial-values="initialValues" class="flex flex-col min-h-0 flex-1 overflow-hidden">
        <form
          id="role-action-form"
          class="flex flex-col min-h-0 flex-1 overflow-hidden"
          @vue:mounted="() => onVueMounted(setValues)"
          @submit.prevent="submit(handleSubmit)"
        >
          <div class="space-y-4 overflow-y-auto flex-1 pr-1">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="text" placeholder="e.g. admin" maxlength="50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Skeleton v-if="isPrefilling" class="h-16" />
                  <Textarea
                    v-else
                    v-bind="componentField"
                    placeholder="Optional description"
                    maxlength="255"
                    class="resize-none"
                    :rows="3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <DialogFooter class="pt-4 shrink-0">
            <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
              Cancel
            </Button>
            <Button type="submit" form="role-action-form" :disabled="isSubmitting || isPrefilling">
              <span v-if="isSubmitting">{{ props.mode === 'edit' ? 'Saving...' : 'Creating...' }}</span>
              <span v-else>{{ props.mode === 'edit' ? 'Save changes' : 'Create role' }}</span>
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>
