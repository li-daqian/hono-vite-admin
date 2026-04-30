<script setup lang="ts">
import type { PutSystemConfigsData, SystemConfigItemSchema } from '@admin/client'
import { getSystemConfigs, putSystemConfigs } from '@admin/client'
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
import { LockKeyhole, Save, Settings2, SlidersHorizontal } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'

const permissions = usePageActionPermissions()
const appConfig = useAppConfigStore()
const editPermission = computed(() => permissions.resolve('edit', { actionName: 'Update', subject: 'system config' }))

const isLoading = ref(true)
const isSaving = ref(false)
const editable = ref(false)
const configs = ref<SystemConfigItemSchema[]>([])
const values = reactive<Record<string, string>>({})
const errors = reactive<Record<string, string | null>>({})

const canUpdate = computed(() => editable.value && editPermission.value.allowed && !isLoading.value && !isSaving.value)
const disabledReason = computed(() => {
  if (!editable.value) {
    return 'System config is read-only in this deployment.'
  }

  return editPermission.value.reason
})

function setConfigs(items: SystemConfigItemSchema[], nextEditable: boolean) {
  editable.value = nextEditable
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

function validateForm(): boolean {
  return configs.value.every(validateConfig)
}

async function loadConfigs() {
  isLoading.value = true
  try {
    const response = await getSystemConfigs<true>()
    setConfigs(response.data.items, response.data.editable)
  }
  finally {
    isLoading.value = false
  }
}

async function saveConfigs() {
  if (!canUpdate.value) {
    if (disabledReason.value) {
      toast.info(disabledReason.value)
    }
    return
  }

  if (!validateForm()) {
    return
  }

  const payload: PutSystemConfigsData['body'] = {
    configs: configs.value.map(item => ({
      key: item.key,
      value: values[item.key]?.trim() ?? '',
    })),
  }

  isSaving.value = true
  try {
    const response = await putSystemConfigs<true>({ body: payload })
    setConfigs(response.data.items, response.data.editable)
    await appConfig.fetchConfig(true)
    toast.success('System config updated.')
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadConfigs()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          System Config
        </h2>
        <p class="text-muted-foreground">
          Manage application display and table defaults.
        </p>
      </div>
      <Badge :variant="editable ? 'default' : 'secondary'" class="h-6 gap-1.5">
        <Settings2 v-if="editable" class="size-3.5" />
        <LockKeyhole v-else class="size-3.5" />
        {{ editable ? 'Editable' : 'Read only' }}
      </Badge>
    </div>

    <Card class="max-w-3xl rounded-lg">
      <CardHeader>
        <CardTitle>Application Defaults</CardTitle>
        <CardDescription>
          Values applied to the admin shell, login page, and data tables.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-5">
        <template v-if="isLoading">
          <div v-for="index in 3" :key="index" class="grid gap-2">
            <Skeleton class="h-4 w-40" />
            <Skeleton class="h-9" />
          </div>
        </template>

        <template v-else>
          <div v-for="item in configs" :key="item.key" class="grid gap-2">
            <Label :for="item.key" class="gap-2">
              <SlidersHorizontal class="size-4 text-muted-foreground" />
              {{ item.label }}
            </Label>
            <Select
              v-if="item.options"
              v-model="values[item.key]"
              :disabled="!canUpdate"
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
              :disabled="!canUpdate"
              :aria-invalid="Boolean(errors[item.key])"
            />
            <p v-if="errors[item.key]" class="text-sm text-destructive">
              {{ errors[item.key] }}
            </p>
            <p v-else class="text-sm text-muted-foreground">
              {{ item.description }}
            </p>
          </div>
        </template>
      </CardContent>

      <CardFooter class="flex flex-wrap justify-end gap-2">
        <PermissionTooltip :message="disabledReason">
          <Button type="button" :disabled="!canUpdate" @click="saveConfigs">
            <Save class="size-4" />
            Save
          </Button>
        </PermissionTooltip>
      </CardFooter>
    </Card>
  </div>
</template>
