<script setup lang="ts">
import type { AppSecurityPolicyResponseSchema, PutAppSecurityPolicyData } from '@admin/client'
import { getAppSecurityPolicy, putAppSecurityPolicy } from '@admin/client'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Skeleton } from '@admin/components/ui/skeleton'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { Hash, LockKeyhole, Save, ShieldCheck } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const durationPattern = /^[1-9]\d*[smhdwMy]$/

const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { actionName: 'Update', subject: 'security policy' }))

const isLoading = ref(true)
const isSaving = ref(false)
const policy = ref<AppSecurityPolicyResponseSchema | null>(null)
const maxFailedLoginAttempts = ref<number | string>('')
const loginLockDuration = ref('')
const maxFailedLoginAttemptsError = ref<string | null>(null)
const loginLockDurationError = ref<string | null>(null)

const isEditable = computed(() => Boolean(policy.value?.editable))
const canUpdate = computed(() => isEditable.value && editPermission.value.allowed && !isLoading.value && !isSaving.value)
const disabledReason = computed(() => {
  if (!isEditable.value) {
    return 'Security policy is read-only in this deployment.'
  }

  return editPermission.value.reason
})

function setPolicy(nextPolicy: AppSecurityPolicyResponseSchema) {
  policy.value = nextPolicy
  maxFailedLoginAttempts.value = nextPolicy.maxFailedLoginAttempts
  loginLockDuration.value = nextPolicy.loginLockDuration
}

function validateForm(): boolean {
  const attempts = Number(maxFailedLoginAttempts.value)
  maxFailedLoginAttemptsError.value = Number.isInteger(attempts) && attempts >= 1 && attempts <= 1000
    ? null
    : 'Enter a whole number between 1 and 1000.'

  loginLockDurationError.value = durationPattern.test(loginLockDuration.value.trim())
    ? null
    : 'Use a value like 15m, 2h, or 7d.'

  return !maxFailedLoginAttemptsError.value && !loginLockDurationError.value
}

async function loadPolicy() {
  isLoading.value = true
  try {
    const response = await getAppSecurityPolicy<true>()
    setPolicy(response.data)
  }
  finally {
    isLoading.value = false
  }
}

async function savePolicy() {
  if (!canUpdate.value) {
    if (disabledReason.value) {
      toast.info(disabledReason.value)
    }
    return
  }

  if (!validateForm()) {
    return
  }

  const payload: PutAppSecurityPolicyData['body'] = {
    maxFailedLoginAttempts: Number(maxFailedLoginAttempts.value),
    loginLockDuration: loginLockDuration.value.trim(),
  }

  isSaving.value = true
  try {
    const response = await putAppSecurityPolicy<true>({
      body: payload,
    })
    setPolicy(response.data)
    toast.success('Security policy updated.')
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadPolicy()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Security Policy
        </h2>
        <p class="text-muted-foreground">
          Manage login lockout limits for user accounts.
        </p>
      </div>
      <Badge :variant="isEditable ? 'default' : 'secondary'" class="h-6 gap-1.5">
        <ShieldCheck v-if="isEditable" class="size-3.5" />
        <LockKeyhole v-else class="size-3.5" />
        {{ isEditable ? 'Editable' : 'Read only' }}
      </Badge>
    </div>

    <Card class="max-w-3xl rounded-lg">
      <CardHeader>
        <CardTitle>Login Lockout</CardTitle>
        <CardDescription>
          Failed password attempts and temporary account lock duration.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-5">
        <div class="grid gap-2">
          <Label for="maxFailedLoginAttempts" class="gap-2">
            <Hash class="size-4 text-muted-foreground" />
            Max Failed Attempts
          </Label>
          <Skeleton v-if="isLoading" class="h-9" />
          <Input
            v-else
            id="maxFailedLoginAttempts"
            v-model="maxFailedLoginAttempts"
            type="number"
            min="1"
            max="1000"
            step="1"
            :disabled="!canUpdate"
            :aria-invalid="Boolean(maxFailedLoginAttemptsError)"
          />
          <p v-if="maxFailedLoginAttemptsError" class="text-sm text-destructive">
            {{ maxFailedLoginAttemptsError }}
          </p>
        </div>

        <div class="grid gap-2">
          <Label for="loginLockDuration" class="gap-2">
            <LockKeyhole class="size-4 text-muted-foreground" />
            Login Lock Duration
          </Label>
          <Skeleton v-if="isLoading" class="h-9" />
          <Input
            v-else
            id="loginLockDuration"
            v-model="loginLockDuration"
            type="text"
            placeholder="15m"
            maxlength="16"
            :disabled="!canUpdate"
            :aria-invalid="Boolean(loginLockDurationError)"
          />
          <p v-if="loginLockDurationError" class="text-sm text-destructive">
            {{ loginLockDurationError }}
          </p>
        </div>
      </CardContent>

      <CardFooter class="flex flex-wrap justify-end gap-2">
        <PermissionTooltip :message="disabledReason">
          <Button type="button" :disabled="!canUpdate" @click="savePolicy">
            <Save class="size-4" />
            Save
          </Button>
        </PermissionTooltip>
      </CardFooter>
    </Card>
  </div>
</template>
