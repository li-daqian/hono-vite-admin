<script setup lang="ts">
import { Button } from '@admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  desc?: string
  disabled?: boolean
  cancelBtnText?: string
  confirmText?: string
  destructive?: boolean
  isLoading?: boolean
  class?: string
  handleConfirm: () => void | Promise<void>
}>(), {
  title: '',
  desc: '',
  disabled: false,
  cancelBtnText: 'Cancel',
  confirmText: 'Continue',
  destructive: false,
  isLoading: false,
  class: '',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

function handleCancel() {
  handleOpenChange(false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent :class="props.class">
      <DialogHeader class="text-start">
        <DialogTitle>
          <slot name="title">
            {{ props.title }}
          </slot>
        </DialogTitle>

        <DialogDescription as-child>
          <div>
            <slot name="desc">
              {{ props.desc }}
            </slot>
          </div>
        </DialogDescription>
      </DialogHeader>

      <slot />

      <DialogFooter>
        <Button variant="outline" :disabled="props.isLoading" @click="handleCancel">
          {{ props.cancelBtnText }}
        </Button>
        <Button
          :variant="props.destructive ? 'destructive' : 'default'"
          :disabled="props.disabled || props.isLoading"
          @click="props.handleConfirm"
        >
          {{ props.confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
