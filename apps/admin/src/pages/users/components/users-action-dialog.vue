<script setup lang="ts">
import type { PostUserData, PutUserByIdData } from '@admin/client'
import { getUserById, postUser, putUserById } from '@admin/client'
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
import { MultiSelect } from '@admin/components/ui/multi-select'
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
import { useUsers } from './users-provider.vue'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const addValidationSchema = toTypedSchema(z.object({
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must be at most 30 characters long'),
  password: z.string()
    .trim()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be at most 100 characters long'),
  confirmPassword: z.string().trim().min(1, 'Please confirm password'),
  email: z.string().trim().email('Invalid email address').or(z.literal('')),
  phone: z.string().trim().min(10, 'Phone must be at least 10 characters').max(15, 'Phone must be at most 15 characters').or(z.literal('')),
  displayName: z.string().trim().max(50, 'Display name must be at most 50 characters').or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords don\'t match',
}))

const editValidationSchema = toTypedSchema(z.object({
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must be at most 30 characters long'),
  email: z.string().trim().email('Invalid email address').or(z.literal('')),
  phone: z.string().trim().min(10, 'Phone must be at least 10 characters').max(15, 'Phone must be at most 15 characters').or(z.literal('')),
  displayName: z.string().trim().max(50, 'Display name must be at most 50 characters').or(z.literal('')),
  status: z.enum(['ACTIVE', 'DISABLED']),
}))

const addInitialValues = {
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  displayName: '',
}

const editInitialValues = {
  username: '',
  email: '',
  phone: '',
  displayName: '',
  status: 'ACTIVE' as const,
}

const isPrefilling = ref(props.mode === 'edit')
const validationSchema = computed(() => (props.mode === 'edit' ? editValidationSchema : addValidationSchema))

const { roleOptions } = useUsers()
const editRoles = ref<string[]>([])

function toNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function onVueMounted(setValues: (values: Record<string, any>) => void) {
  if (props.mode === 'edit') {
    if (!props.id) {
      isPrefilling.value = false
      toast.error('Cannot edit user: missing id.')
      return
    }

    try {
      const response = await getUserById<true>({
        path: {
          id: props.id,
        },
      })

      setValues({
        username: response.data.username,
        email: response.data.email ?? '',
        phone: response.data.phone ?? '',
        displayName: response.data.displayName ?? '',
        status: response.data.status,
      })
      editRoles.value = response.data.roles ?? []
    }
    finally {
      isPrefilling.value = false
    }

    return
  }

  setValues(addInitialValues)
  isPrefilling.value = false
}

async function handleSubmit(values: Record<string, any>) {
  if (props.mode === 'add') {
    const payload: PostUserData['body'] = {
      username: values.username.trim(),
      password: values.password.trim(),
      email: toNullable(values.email),
      phone: toNullable(values.phone),
      displayName: toNullable(values.displayName),
    }

    await postUser<true>({ body: payload })
    toast.success(`User \"${payload.username}\" created.`)
    emit('success')
    handleOpenChange(false)
    return
  }

  if (!props.id) {
    toast.error('Cannot update user: missing id.')
    return
  }

  const payload: PutUserByIdData['body'] = {
    username: values.username.trim(),
    email: toNullable(values.email),
    phone: toNullable(values.phone),
    displayName: toNullable(values.displayName),
    status: values.status,
    roles: editRoles.value,
  }

  await putUserById<true>({
    path: {
      id: props.id,
    },
    body: payload,
  })

  toast.success(`User \"${payload.username}\" updated.`)
  emit('success')
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader class="text-start">
        <DialogTitle>{{ props.mode === 'edit' ? 'Edit User' : 'Add New User' }}</DialogTitle>
        <DialogDescription>
          {{ props.mode === 'edit' ? 'Update this user.' : 'Create a new user.' }}
          Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>

      <Form v-slot="{ handleSubmit: submit, isSubmitting, setValues }" :validation-schema="validationSchema" :initial-values="props.mode === 'edit' ? editInitialValues : addInitialValues">
        <form
          id="user-action-form"
          class="space-y-4"
          @vue:mounted="() => onVueMounted(setValues)"
          @submit.prevent="submit(handleSubmit)"
        >
          <FormField v-slot="{ componentField }" name="username">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl class="h-9">
                <Skeleton v-if="isPrefilling" />
                <Input v-else v-bind="componentField" type="text" placeholder="john_doe" maxlength="30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <template v-if="props.mode === 'add'">
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="password" placeholder="At least 6 characters" maxlength="100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmPassword">
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl class="h-9">
                  <Skeleton v-if="isPrefilling" />
                  <Input v-else v-bind="componentField" type="password" placeholder="Confirm password" maxlength="100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </template>

          <FormField v-slot="{ componentField }" name="displayName">
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl class="h-9">
                <Skeleton v-if="isPrefilling" />
                <Input v-else v-bind="componentField" type="text" placeholder="John Doe" maxlength="50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl class="h-9">
                <Skeleton v-if="isPrefilling" />
                <Input v-else v-bind="componentField" type="email" placeholder="john@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="phone">
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl class="h-9">
                <Skeleton v-if="isPrefilling" />
                <Input v-else v-bind="componentField" type="text" placeholder="+1234567890" maxlength="15" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-if="props.mode === 'edit'" v-slot="{ componentField }" name="status">
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

          <div v-if="props.mode === 'edit'" class="grid gap-2">
            <label class="text-sm leading-none font-medium">Roles</label>
            <Skeleton v-if="isPrefilling" class="h-9" />
            <MultiSelect v-else v-model="editRoles" :options="roleOptions" placeholder="Select roles" search-placeholder="Search role" />
          </div>
        </form>

        <DialogFooter class="pt-6">
          <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button type="submit" form="user-action-form" :disabled="isSubmitting || isPrefilling">
            <span v-if="isSubmitting">{{ props.mode === 'edit' ? 'Saving...' : 'Creating...' }}</span>
            <span v-else>{{ props.mode === 'edit' ? 'Save changes' : 'Create user' }}</span>
          </Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  </Dialog>
</template>
