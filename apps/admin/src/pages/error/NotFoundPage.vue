<script setup lang="ts">
import { Button } from '@admin/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card'
import { Separator } from '@admin/components/ui/separator'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

function handleGoBack() {
  if (window.history.length > 1) {
    router.back()
  }
  else {
    router.replace({ name: ROUTE_NAMES.HOME })
  }
}
</script>

<template>
  <div class="relative isolate flex min-h-svh items-center justify-center bg-linear-to-b from-background via-background to-muted/50 px-6 py-12">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div class="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
    </div>

    <Card class="relative w-full max-w-2xl border-border/70 shadow-xl backdrop-blur">
      <CardHeader class="space-y-3">
        <div class="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span class="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(0,0,0,0.04)]" />
          Lost in the flow
        </div>
        <CardTitle class="text-3xl font-semibold tracking-tight">
          Page not found
        </CardTitle>
        <CardDescription class="text-base">
          We looked everywhere but could not find the route
          <span class="font-mono text-foreground"> {{ route.fullPath }} </span>.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <div class="grid gap-4 rounded-lg border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <p class="font-medium text-foreground">
            Why you're seeing this
          </p>
          <ul class="grid gap-2 list-disc pl-4">
            <li>The link might be outdated or misspelled.</li>
            <li>Your session may have expired and you were redirected.</li>
            <li>The resource has moved or you do not have permission.</li>
          </ul>
        </div>

        <Separator />

        <div class="flex flex-wrap items-center gap-3">
          <Button :as="RouterLink" :to="{ name: ROUTE_NAMES.HOME }" class="shadow-sm">
            Go to dashboard
          </Button>
          <Button variant="outline" @click="handleGoBack">
            Go back
          </Button>
          <Button variant="ghost" :as="RouterLink" :to="{ name: ROUTE_NAMES.LOGIN }">
            Return to login
          </Button>
        </div>
      </CardContent>

      <CardFooter class="text-xs text-muted-foreground">
        Need help? Contact your workspace admin to request access.
      </CardFooter>
    </Card>
  </div>
</template>
