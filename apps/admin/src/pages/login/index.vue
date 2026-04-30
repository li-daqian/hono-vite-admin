<script setup lang="ts">
import type { ErrorResponse, PostAuthLoginData } from '@admin/client'
import { getAuthPrefill, postAuthLogin } from '@admin/client'
import { Button } from '@admin/components/ui/button'
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
import { AuthManager } from '@admin/lib/auth'
import { useAppConfigStore } from '@admin/stores/app-config'
import { toTypedSchema } from '@vee-validate/zod'
import axios from 'axios'
import { ref } from 'vue'
import z from 'zod'

const validationSchema = toTypedSchema(z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be at most 50 characters long')
    .describe('Username of the user'),
  password: z.string()
    .min(1, 'Password is required')
    .describe('Password of the user'),
}))

const loading = ref(true)
const loginError = ref<string | null>(null)
const appConfig = useAppConfigStore()

function formatLoginErrorMessage(errorResponse: ErrorResponse): string {
  const lockedUntilPrefix = 'after '
  const lockedUntilIndex = errorResponse.message.lastIndexOf(lockedUntilPrefix)
  const lockedUntil = lockedUntilIndex >= 0
    ? errorResponse.message.slice(lockedUntilIndex + lockedUntilPrefix.length)
    : null
  const lockedUntilDate = lockedUntil ? new Date(lockedUntil) : null

  if (lockedUntilDate && !Number.isNaN(lockedUntilDate.getTime())) {
    return `Account is locked. Try again after ${lockedUntilDate.toLocaleString()}.`
  }

  return errorResponse.message
}

async function onVueMounted(setValues: (values: Record<string, any>) => void) {
  try {
    const res = await getAuthPrefill<true>()
    setValues(res.data)
  }
  finally {
    loading.value = false
  }
}

async function handleLogin(values: Record<string, any>) {
  loginError.value = null
  const formData = values as PostAuthLoginData['body']

  try {
    const res = await postAuthLogin<true>({
      body: {
        ...formData,
      },
    })

    await AuthManager.onLoginSuccess(res.data)
  }
  catch (error) {
    if (axios.isAxiosError<ErrorResponse>(error) && error.response?.data) {
      loginError.value = formatLoginErrorMessage(error.response.data)
      return
    }

    throw error
  }
}
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col gap-6">
        <Form v-slot="{ handleSubmit, isSubmitting, setValues }" :validation-schema="validationSchema">
          <form @vue:mounted="() => onVueMounted(setValues)" @submit.prevent="handleSubmit(handleLogin)">
            <template v-if="loading">
              <div class="flex flex-col gap-6">
                <div class="flex flex-col items-center gap-2 text-center">
                  <Skeleton class="h-7 w-36" />
                </div>

                <div class="mt-2 space-y-4">
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-20" />
                    <Skeleton class="h-9 w-full" />
                  </div>

                  <div class="space-y-2">
                    <Skeleton class="h-4 w-20" />
                    <Skeleton class="h-9 w-full" />
                  </div>

                  <Skeleton class="h-9 w-full" />
                </div>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col items-center gap-2 text-center">
                <h1 class="text-xl font-bold">
                  {{ appConfig.loginTitle }}
                </h1>
              </div>

              <div class="mt-2 space-y-4">
                <FormField v-slot="{ componentField }" name="username">
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl class="h-9">
                      <Input v-bind="componentField" type="text" placeholder="username" maxlength="50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="password">
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl class="h-9">
                      <Input v-bind="componentField" type="password" placeholder="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <p
                  v-if="loginError"
                  role="alert"
                  class="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
                >
                  {{ loginError }}
                </p>

                <Button
                  type="submit"
                  class="w-full"
                  :class="isSubmitting ? 'animate-pulse' : undefined"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting">Signing in...</span>
                  <span v-else>Sign in</span>
                </Button>
              </div>
            </template>
          </form>
        </Form>

        <p v-if="loading" class="text-center">
          <Skeleton class="mx-auto h-4 w-48" />
        </p>
      </div>
    </div>
  </div>
</template>
