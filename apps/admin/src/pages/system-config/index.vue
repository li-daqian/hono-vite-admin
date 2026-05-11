<script setup lang="ts">
import type {
  AppSecurityPolicyResponseSchema,
  PutAppSecurityPolicyData,
  PutSystemConfigsData,
  SystemConfigItemSchema,
} from '@admin/client'
import {
  getAppSecurityPolicy,
  getSystemConfigs,
  putAppSecurityPolicy,
  putSystemConfigs,
} from '@admin/client'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import { Skeleton } from '@admin/components/ui/skeleton'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { useAppConfigStore } from '@admin/stores/app-config'
import { Hash, LockKeyhole, Save, Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'

const durationPattern = /^[1-9]\d*[smhdwMy]$/

const permissions = usePageActionPermissions()
const appConfig = useAppConfigStore()
const configEditPermission = computed(() => permissions.resolve('edit', { actionName: 'Update', subject: 'system config' }))
const securityPolicyEditPermission = computed(() => permissions.resolve('system.security-policy.edit', { actionName: 'Update', subject: 'security policy' }))

const isConfigLoading = ref(true)
const isConfigSaving = ref(false)
const configEditable = ref(false)
const configs = ref<SystemConfigItemSchema[]>([])
const values = reactive<Record<string, string>>({})
const errors = reactive<Record<string, string | null>>({})

const canUpdateConfig = computed(() =>
  configEditPermission.value.allowed
  && !isConfigLoading.value
  && !isConfigSaving.value
  && configs.value.length > 0,
)
const configDisabledReason = computed(() => configEditPermission.value.reason)

const isPolicyLoading = ref(true)
const isPolicySaving = ref(false)
const policy = ref<AppSecurityPolicyResponseSchema | null>(null)
const maxFailedLoginAttempts = ref<number | string>('')
const loginLockDuration = ref('')
const maxFailedLoginAttemptsError = ref<string | null>(null)
const loginLockDurationError = ref<string | null>(null)

const policyEditable = computed(() => Boolean(policy.value?.editable))
const canUpdatePolicy = computed(() =>
  Boolean(policy.value)
  && securityPolicyEditPermission.value.allowed
  && !isPolicyLoading.value
  && !isPolicySaving.value,
)
const policyDisabledReason = computed(() => securityPolicyEditPermission.value.reason)

function setConfigs(items: SystemConfigItemSchema[], nextEditable: boolean) {
  configEditable.value = nextEditable
  configs.value = items
  for (const item of items) {
    values[item.key] = item.value
    errors[item.key] = null
  }
}

function validateConfig(item: SystemConfigItemSchema): boolean {
  const value = values[item.key]?.trim() ?? ''

  if (!value) {
    errors[item.key] = `${item.label} is required.`
    return false
  }

  if (item.options && !item.options.includes(value)) {
    errors[item.key] = `${item.label} must be one of: ${item.options.join(', ')}.`
    return false
  }

  errors[item.key] = null
  return true
}

function validateConfigForm(): boolean {
  return configs.value.every(validateConfig)
}

function setPolicy(nextPolicy: AppSecurityPolicyResponseSchema) {
  policy.value = nextPolicy
  maxFailedLoginAttempts.value = nextPolicy.maxFailedLoginAttempts
  loginLockDuration.value = nextPolicy.loginLockDuration
}

function validatePolicyForm(): boolean {
  const attempts = Number(maxFailedLoginAttempts.value)
  maxFailedLoginAttemptsError.value = Number.isInteger(attempts) && attempts >= 1 && attempts <= 1000
    ? null
    : 'Enter a whole number between 1 and 1000.'

  loginLockDurationError.value = durationPattern.test(loginLockDuration.value.trim())
    ? null
    : 'Use a value like 15m, 2h, or 7d.'

  return !maxFailedLoginAttemptsError.value && !loginLockDurationError.value
}

async function loadConfigs() {
  isConfigLoading.value = true
  try {
    const response = await getSystemConfigs<true>()
    setConfigs(response.data.items, response.data.editable)
  }
  finally {
    isConfigLoading.value = false
  }
}

async function loadPolicy() {
  isPolicyLoading.value = true
  try {
    const response = await getAppSecurityPolicy<true>()
    setPolicy(response.data)
  }
  finally {
    isPolicyLoading.value = false
  }
}

async function saveConfigs() {
  if (!canUpdateConfig.value) {
    if (configDisabledReason.value) {
      toast.info(configDisabledReason.value)
    }
    return
  }

  if (!validateConfigForm()) {
    return
  }

  const payload: PutSystemConfigsData['body'] = {
    configs: configs.value.map(item => ({
      key: item.key,
      value: values[item.key]?.trim() ?? '',
    })),
  }

  isConfigSaving.value = true
  try {
    const response = await putSystemConfigs<true>({ body: payload })
    setConfigs(response.data.items, response.data.editable)
    await appConfig.fetchConfig(true)
    toast.success('System config updated.')
  }
  finally {
    isConfigSaving.value = false
  }
}

async function savePolicy() {
  if (!canUpdatePolicy.value) {
    if (policyDisabledReason.value) {
      toast.info(policyDisabledReason.value)
    }
    return
  }

  if (!validatePolicyForm()) {
    return
  }

  const payload: PutAppSecurityPolicyData['body'] = {
    maxFailedLoginAttempts: Number(maxFailedLoginAttempts.value),
    loginLockDuration: loginLockDuration.value.trim(),
  }

  isPolicySaving.value = true
  try {
    const response = await putAppSecurityPolicy<true>({
      body: payload,
    })
    setPolicy(response.data)
    toast.success('Security policy updated.')
  }
  finally {
    isPolicySaving.value = false
  }
}

onMounted(() => {
  void loadConfigs()
  void loadPolicy()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          System Config
        </h2>
        <p class="text-muted-foreground">
          Manage application defaults and login security policy.
        </p>
      </div>
    </div>

    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Application defaults and login protection settings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section class="overflow-hidden rounded-lg border">
            <div class="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3">
              <div class="space-y-1">
                <h3 class="text-sm font-medium leading-none">
                  Application Defaults
                </h3>
                <p class="text-sm text-muted-foreground">
                  Values applied to the admin shell, login page, and data tables.
                </p>
              </div>
              <Badge :variant="configEditable ? 'default' : 'secondary'" class="h-6 shrink-0 gap-1.5">
                <Settings2 v-if="configEditable" class="size-3.5" />
                <LockKeyhole v-else class="size-3.5" />
                {{ configEditable ? 'Editable' : 'Read only' }}
              </Badge>
            </div>

            <div class="divide-y">
              <template v-if="isConfigLoading">
                <div v-for="index in 3" :key="index" class="grid gap-3 p-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-36" />
                    <Skeleton class="h-4 w-44" />
                  </div>
                  <Skeleton class="h-9" />
                </div>
              </template>

              <template v-else>
                <div v-for="item in configs" :key="item.key" class="grid gap-3 p-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div class="space-y-1.5">
                    <Label :for="item.key" class="gap-2">
                      <SlidersHorizontal class="size-4 shrink-0 text-muted-foreground" />
                      {{ item.label }}
                    </Label>
                    <p class="text-sm leading-5 text-muted-foreground">
                      {{ item.description }}
                    </p>
                  </div>
                  <div class="grid content-start gap-2">
                    <Select
                      v-if="item.options"
                      v-model="values[item.key]"
                      :disabled="!canUpdateConfig"
                    >
                      <SelectTrigger :id="item.key" class="h-9">
                        <SelectValue :placeholder="item.value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="option in item.options" :key="option" :value="option">
                          {{ option }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      v-else
                      :id="item.key"
                      v-model="values[item.key]"
                      :type="item.valueType === 'number' ? 'number' : 'text'"
                      maxlength="100"
                      :disabled="!canUpdateConfig"
                      :aria-invalid="Boolean(errors[item.key])"
                    />
                    <p v-if="errors[item.key]" class="text-sm text-destructive">
                      {{ errors[item.key] }}
                    </p>
                  </div>
                </div>
              </template>
            </div>

            <div class="flex justify-end border-t bg-muted/20 px-4 py-3">
              <PermissionTooltip :message="configDisabledReason">
                <Button type="button" :disabled="!canUpdateConfig" @click="saveConfigs">
                  <Save class="size-4" />
                  Save
                </Button>
              </PermissionTooltip>
            </div>
          </section>

          <section class="overflow-hidden rounded-lg border">
            <div class="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3">
              <div class="space-y-1">
                <h3 class="text-sm font-medium leading-none">
                  Login Lockout
                </h3>
                <p class="text-sm text-muted-foreground">
                  Failed attempts and temporary lock duration.
                </p>
              </div>
              <Badge :variant="policyEditable ? 'default' : 'secondary'" class="h-6 shrink-0 gap-1.5">
                <ShieldCheck v-if="policyEditable" class="size-3.5" />
                <LockKeyhole v-else class="size-3.5" />
                {{ policyEditable ? 'Editable' : 'Read only' }}
              </Badge>
            </div>

            <div class="divide-y">
              <div class="grid gap-3 p-4">
                <div class="space-y-1.5">
                  <Label for="maxFailedLoginAttempts" class="gap-2">
                    <Hash class="size-4 shrink-0 text-muted-foreground" />
                    Max Failed Attempts
                  </Label>
                  <p class="text-sm leading-5 text-muted-foreground">
                    Attempts allowed before locking the account.
                  </p>
                </div>
                <Skeleton v-if="isPolicyLoading" class="h-9" />
                <Input
                  v-else
                  id="maxFailedLoginAttempts"
                  v-model="maxFailedLoginAttempts"
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  :disabled="!canUpdatePolicy"
                  :aria-invalid="Boolean(maxFailedLoginAttemptsError)"
                />
                <p v-if="maxFailedLoginAttemptsError" class="text-sm text-destructive">
                  {{ maxFailedLoginAttemptsError }}
                </p>
              </div>

              <div class="grid gap-3 p-4">
                <div class="space-y-1.5">
                  <Label for="loginLockDuration" class="gap-2">
                    <LockKeyhole class="size-4 shrink-0 text-muted-foreground" />
                    Login Lock Duration
                  </Label>
                  <p class="text-sm leading-5 text-muted-foreground">
                    How long a locked account stays blocked.
                  </p>
                </div>
                <Skeleton v-if="isPolicyLoading" class="h-9" />
                <Input
                  v-else
                  id="loginLockDuration"
                  v-model="loginLockDuration"
                  type="text"
                  placeholder="15m"
                  maxlength="16"
                  :disabled="!canUpdatePolicy"
                  :aria-invalid="Boolean(loginLockDurationError)"
                />
                <p v-if="loginLockDurationError" class="text-sm text-destructive">
                  {{ loginLockDurationError }}
                </p>
              </div>
            </div>

            <div class="flex justify-end border-t bg-muted/20 px-4 py-3">
              <PermissionTooltip :message="policyDisabledReason">
                <Button type="button" :disabled="!canUpdatePolicy" @click="savePolicy">
                  <Save class="size-4" />
                  Save
                </Button>
              </PermissionTooltip>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
