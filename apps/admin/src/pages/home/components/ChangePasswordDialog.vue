<script setup lang="ts">
import type { PostAuthChangePasswordData } from '@admin/client'
import { postAuthChangePassword } from '@admin/client'
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
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const initialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const validationSchema = toTypedSchema(z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters long')
    .max(100, 'New password must be at most 100 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })
  }

  if (value.currentPassword === value.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['newPassword'],
      message: 'New password must be different from current password',
    })
  }
}))

const formKey = ref(0)

watch(() => props.open, (open) => {
  if (open) {
    formKey.value += 1
  }
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function handleSubmit(values: Record<string, any>) {
  const payload: PostAuthChangePasswordData['body'] = {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
    confirmPassword: values.confirmPassword,
  }

  await postAuthChangePassword<true>({
    body: payload,
  })

  toast.success('Password changed.')
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-start">
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          Update the password for your current account.
        </DialogDescription>
      </DialogHeader>

      <Form
        :key="formKey"
        v-slot="{ handleSubmit: submit, isSubmitting }"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
      >
        <form
          id="change-password-form"
          class="space-y-4"
          @submit.prevent="submit(handleSubmit)"
        >
          <FormField v-slot="{ componentField }" name="currentPassword">
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl class="h-9">
                <Input v-bind="componentField" type="password" placeholder="Enter current password" maxlength="100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

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
            form="change-password-form"
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
