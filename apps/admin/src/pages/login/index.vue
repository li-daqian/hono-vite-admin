<script setup lang="ts">
import { Button } from '@admin/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@admin/components/ui/field'
import { Input } from '@admin/components/ui/input'
import { GalleryVerticalEnd } from 'lucide-vue-next'
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col gap-6">
        <form>
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-xl font-bold">
                Sign in to Admin
              </h1>
            </div>
            <Field>
              <FieldLabel for="username">
                Username
              </FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="username"
                required
              />
            </Field>
            <Field>
              <FieldLabel for="password">
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="password"
                required
              />
            </Field>
            <Field>
              <Button type="submit">
                Login
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <FieldDescription class="text-center">
          Don't have an account?
          <a href="#">
            Sign up
          </a>
        </FieldDescription>
      </div>
    </div>
  </div>
</template>
