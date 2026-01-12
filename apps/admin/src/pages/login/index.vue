<script setup lang="ts">
import type { PostAuthLoginData } from '@admin/client'
import { getAuthPrefill, postAuthLogin } from '@admin/client'
import { zPostAuthLoginData } from '@admin/client/zod.gen'
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
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useAuthStore } from '@admin/stores/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const validationSchema = toTypedSchema(zPostAuthLoginData.shape.body)

const loading = ref(true)
const router = useRouter()

async function onVueMounted(setValues: (values: Record<string, any>) => void) {
  try {
    const res = await getAuthPrefill<true>()
    setValues(res.data)
  }
  finally {
    loading.value = false
  }
}

async function onSubmit(values: Record<string, any>) {
  const formData = values as PostAuthLoginData['body']
  const res = await postAuthLogin<true>({
    body: {
      ...formData,
    },
  })

  const accessToken = res.data.accessToken
  useAuthStore().setAccessToken(accessToken)

  await router.replace({ name: ROUTE_NAMES.HOME })
}
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col gap-6">
        <Form v-slot="{ handleSubmit, isSubmitting, setValues }" :validation-schema="validationSchema">
          <form @vue:mounted="() => onVueMounted(setValues)" @submit.prevent="handleSubmit(onSubmit)">
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-xl font-bold">
                Sign in to Admin
              </h1>
            </div>

            <div class="space-y-4 mt-2">
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl class="h-9">
                    <Skeleton v-if="loading" />
                    <Input v-else v-bind="componentField" type="text" placeholder="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="password">
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl class="h-9">
                    <Skeleton v-if="loading" />
                    <Input v-else v-bind="componentField" type="password" placeholder="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <Button type="submit" class="w-full" :disabled="isSubmitting">
                <span v-if="isSubmitting">Signing in...</span>
                <span v-else>Sign in</span>
              </Button>
            </div>
          </form>
        </Form>

        <p class="text-muted-foreground text-sm text-center">
          Don't have an account?
          <a href="#" class="underline underline-offset-4">Sign up</a>
        </p>
      </div>
    </div>
  </div>
</template>
