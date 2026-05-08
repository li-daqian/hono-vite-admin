<script setup lang="ts">
import type { DateRange, DateValue } from 'reka-ui'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { RangeCalendar } from '@admin/components/ui/range-calendar'
import { cn } from '@admin/lib/utils'
import { CalendarDate } from '@internationalized/date'
import { Calendar, X } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  id?: string
  startValue: string
  endValue: string
  placeholder?: string
}>(), {
  placeholder: 'Select time range',
})

const emit = defineEmits<{
  (e: 'update:startValue', value: string): void
  (e: 'update:endValue', value: string): void
}>()

const startDate = computed(() => parseDateValue(props.startValue))
const endDate = computed(() => parseDateValue(props.endValue))

const calendarValue = computed<DateRange>({
  get() {
    return {
      start: startDate.value,
      end: endDate.value,
    }
  },
  set(value) {
    emit('update:startValue', value.start ? toLocalDateTimeValue(value.start, props.startValue, '00:00') : '')
    emit('update:endValue', value.end ? toLocalDateTimeValue(value.end, props.endValue, '23:59') : '')
  },
})

const startHourValue = computed(() => getTimePart(props.startValue, 'hours'))
const startMinuteValue = computed(() => getTimePart(props.startValue, 'minutes'))
const endHourValue = computed(() => getTimePart(props.endValue, 'hours'))
const endMinuteValue = computed(() => getTimePart(props.endValue, 'minutes'))

const displayLabel = computed(() => {
  if (!props.startValue && !props.endValue) {
    return props.placeholder
  }

  return `${formatDisplayValue(props.startValue) || 'Start time'} - ${formatDisplayValue(props.endValue) || 'End time'}`
})

const hasValue = computed(() => Boolean(props.startValue || props.endValue))

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseDateValue(value: string): DateValue | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) {
    return undefined
  }

  return new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))
}

function getTimeParts(value: string, fallback: string) {
  const match = /T(\d{2}):(\d{2})/.exec(value)
  const [fallbackHours, fallbackMinutes] = fallback.split(':')

  return {
    hours: match?.[1] ?? fallbackHours,
    minutes: match?.[2] ?? fallbackMinutes,
  }
}

function getTimePart(value: string, part: 'hours' | 'minutes') {
  if (!value) {
    return ''
  }

  return getTimeParts(value, '00:00')[part]
}

function toLocalDateTimeValue(date: DateValue, previousValue: string, fallbackTime: string) {
  const time = getTimeParts(previousValue, fallbackTime)
  return `${date.year}-${pad(date.month)}-${pad(date.day)}T${time.hours}:${time.minutes}`
}

function formatDisplayValue(value: string) {
  const date = parseDateValue(value)
  if (!date) {
    return ''
  }

  const time = getTimeParts(value, '00:00')
  return `${date.year}-${pad(date.month)}-${pad(date.day)} ${time.hours}:${time.minutes}`
}

function toDatePart(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function selectPresetRange(days: number) {
  const endDateValue = new Date()
  const startDateValue = new Date()
  startDateValue.setDate(endDateValue.getDate() - days + 1)

  emit('update:startValue', `${toDatePart(startDateValue)}T00:00`)
  emit('update:endValue', `${toDatePart(endDateValue)}T23:59`)
}

function updateTime(boundary: 'start' | 'end', part: 'hours' | 'minutes', value: string | number) {
  const currentValue = boundary === 'start' ? props.startValue : props.endValue
  const currentDate = boundary === 'start' ? startDate.value : endDate.value
  if (!currentDate || !currentValue) {
    return
  }

  const max = part === 'hours' ? 23 : 59
  const nextValue = pad(Math.min(Math.max(Number(value) || 0, 0), max))
  const time = getTimeParts(currentValue, boundary === 'start' ? '00:00' : '23:59')
  time[part] = nextValue

  const nextDateTime = `${currentDate.year}-${pad(currentDate.month)}-${pad(currentDate.day)}T${time.hours}:${time.minutes}`
  if (boundary === 'start') {
    emit('update:startValue', nextDateTime)
  }
  else {
    emit('update:endValue', nextDateTime)
  }
}

function clearValue(event?: Event) {
  event?.preventDefault()
  event?.stopPropagation()
  emit('update:startValue', '')
  emit('update:endValue', '')
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :id="props.id"
        type="button"
        variant="outline"
        size="sm"
        :class="cn(
          'h-8 w-80 justify-start px-2.5 text-left font-normal max-sm:w-full',
          !hasValue && 'text-muted-foreground',
        )"
      >
        <Calendar class="size-4" />
        <span class="min-w-0 flex-1 truncate">
          {{ displayLabel }}
        </span>
        <span
          v-if="hasValue"
          role="button"
          tabindex="0"
          aria-label="Clear time range"
          class="-m-1 inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @click="clearValue"
          @keydown.enter="clearValue"
          @keydown.space="clearValue"
          @pointerdown="clearValue"
        >
          <X class="size-3.5" />
        </span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-auto p-0" align="start">
      <div class="flex flex-col sm:flex-row">
        <div class="grid content-start gap-1 border-b p-2 sm:w-36 sm:border-b-0 sm:border-r">
          <Button
            v-for="preset in presetRanges"
            :key="preset.days"
            type="button"
            variant="ghost"
            size="sm"
            class="justify-start"
            @click="selectPresetRange(preset.days)"
          >
            {{ preset.label }}
          </Button>
        </div>

        <RangeCalendar
          v-model="calendarValue"
          :number-of-months="2"
          initial-focus
          class="pb-2"
        />
      </div>

      <div class="grid gap-3 border-t p-3 sm:grid-cols-2">
        <div class="grid gap-1.5">
          <div class="text-xs font-medium text-muted-foreground">
            Start Time
          </div>
          <div class="flex items-center gap-2">
            <Input
              :model-value="startHourValue"
              inputmode="numeric"
              placeholder="HH"
              class="h-8 w-16 text-center"
              :disabled="!startDate"
              @update:model-value="value => updateTime('start', 'hours', value)"
            />
            <span class="text-muted-foreground">:</span>
            <Input
              :model-value="startMinuteValue"
              inputmode="numeric"
              placeholder="MM"
              class="h-8 w-16 text-center"
              :disabled="!startDate"
              @update:model-value="value => updateTime('start', 'minutes', value)"
            />
          </div>
        </div>

        <div class="grid gap-1.5">
          <div class="text-xs font-medium text-muted-foreground">
            End Time
          </div>
          <div class="flex items-center gap-2">
            <Input
              :model-value="endHourValue"
              inputmode="numeric"
              placeholder="HH"
              class="h-8 w-16 text-center"
              :disabled="!endDate"
              @update:model-value="value => updateTime('end', 'hours', value)"
            />
            <span class="text-muted-foreground">:</span>
            <Input
              :model-value="endMinuteValue"
              inputmode="numeric"
              placeholder="MM"
              class="h-8 w-16 text-center"
              :disabled="!endDate"
              @update:model-value="value => updateTime('end', 'minutes', value)"
            />
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
