<script setup lang="ts">
import type { PostUserByIdPasswordData, UserProfileResponseSchema } from '@admin/client'
import { postUserByIdPassword } from '@admin/client'
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
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'

const props = defineProps<{
  open: boolean
  currentRow: UserProfileResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const initialValues = {
  newPassword: '',
  confirmPassword: '',
}

const validationSchema = toTypedSchema(z.object({
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters long')
    .max(100, 'New password must be at most 100 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm the new password'),
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })
  }
}))

const formKey = ref(0)
const userLabel = computed(() => props.currentRow.displayName?.trim() || props.currentRow.username)

watch(() => props.open, (open) => {
  if (open) {
    formKey.value += 1
  }
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function handleSubmit(values: Record<string, any>) {
  const payload: PostUserByIdPasswordData['body'] = {
    newPassword: values.newPassword,
    confirmPassword: values.confirmPassword,
  }

  await postUserByIdPassword<true>({
    path: {
      id: props.currentRow.id,
    },
    body: payload,
  })

  toast.success(`Password updated for "${props.currentRow.username}".`)
  emit('success')
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-start">
        <DialogTitle>Change User Password</DialogTitle>
        <DialogDescription>
          Set a new password for {{ userLabel }}. Existing refresh tokens will be revoked.
        </DialogDescription>
      </DialogHeader>

      <Form
        :key="formKey"
        v-slot="{ handleSubmit: submit, isSubmitting }"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
      >
        <form
          id="change-user-password-form"
          class="space-y-4"
          @submit.prevent="submit(handleSubmit)"
        >
          <FormField v-slot="{ componentField }" name="newPassword">
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl class="h-9">
                <Input v-bind="componentField" type="password" placeholder="At least 6 characters" maxlength="100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl class="h-9">
                <Input v-bind="componentField" type="password" placeholder="Confirm new password" maxlength="100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </form>

        <DialogFooter class="pt-2">
          <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button
            type="submit"
            form="change-user-password-form"
            :disabled="isSubmitting"
            :class="isSubmitting ? 'animate-pulse' : undefined"
          >
            <span v-if="isSubmitting">Saving...</span>
            <span v-else>Save changes</span>
          </Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  </Dialog>
</template>
