<script lang="ts" setup>
import type { DateValue, RangeCalendarRootEmits, RangeCalendarRootProps } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import { buttonVariants } from '@admin/components/ui/button'
import { cn } from '@admin/lib/utils'
import { getLocalTimeZone, today } from '@internationalized/date'
import { reactiveOmit, useVModel } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RangeCalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { toDate } from 'reka-ui/date'
import { computed, ref, toRaw } from 'vue'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNextButton, RangeCalendarPrevButton } from '.'

const props = defineProps<RangeCalendarRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<RangeCalendarRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'placeholder')

const placeholder = useVModel(props, 'placeholder', emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? props.modelValue?.start ?? today(getLocalTimeZone()),
}) as Ref<DateValue>

const formatter = useDateFormatter(props.locale ?? 'en')
const panelMode = ref<'date' | 'year'>('date')
const decadeStart = ref(getDecadeStart(placeholder.value.year))

const years = computed(() => {
  return Array.from({ length: 12 }, (_, index) => decadeStart.value - 1 + index)
})

const decadeLabel = computed(() => `${decadeStart.value} - ${decadeStart.value + 9}`)

function getDecadeStart(year: number) {
  return Math.floor(year / 10) * 10
}

function openYearPanel() {
  decadeStart.value = getDecadeStart(placeholder.value.year)
  panelMode.value = 'year'
}

function selectYear(year: number) {
  placeholder.value = placeholder.value.set({ year, day: 1 })
  panelMode.value = 'date'
}

function formatMonthRange(grid: Array<{ value: DateValue }>) {
  if (!grid.length) {
    return ''
  }

  const firstMonth = grid[0]
  const lastMonth = grid[grid.length - 1]
  if (!firstMonth || !lastMonth) {
    return ''
  }

  const startMonth = formatter.custom(toDate(firstMonth.value), { month: 'short' })
  const endMonth = formatter.custom(toDate(lastMonth.value), { month: 'short' })
  return grid.length === 1 ? startMonth : `${startMonth} - ${endMonth}`
}

function isYearDisabled(year: number) {
  const minYear = toRaw(props.minValue)?.year
  const maxYear = toRaw(props.maxValue)?.year
  return (minYear !== undefined && year < minYear) || (maxYear !== undefined && year > maxYear)
}

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    v-model:placeholder="placeholder"
    data-slot="range-calendar"
    :class="cn('p-3', props.class)"
    v-bind="forwarded"
  >
    <RangeCalendarHeader>
      <RangeCalendarHeading v-if="panelMode === 'date'" as-child>
        <div class="flex items-center justify-center gap-1 text-sm font-medium">
          <span>{{ formatMonthRange(grid) }}</span>
          <button
            type="button"
            :class="cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 px-2 text-sm font-medium')"
            @click="openYearPanel"
          >
            {{ placeholder.year }}
          </button>
        </div>
      </RangeCalendarHeading>

      <div v-else class="text-sm font-medium">
        {{ decadeLabel }}
      </div>

      <div class="flex items-center gap-1">
        <template v-if="panelMode === 'date'">
          <RangeCalendarPrevButton />
          <RangeCalendarNextButton />
        </template>
        <template v-else>
          <button
            type="button"
            :class="cn(buttonVariants({ variant: 'outline' }), 'absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100')"
            @click="decadeStart -= 10"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            :class="cn(buttonVariants({ variant: 'outline' }), 'absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100')"
            @click="decadeStart += 10"
          >
            <ChevronRight class="size-4" />
          </button>
        </template>
      </div>
    </RangeCalendarHeader>

    <div v-if="panelMode === 'year'" class="mt-4 grid w-[520px] max-w-[calc(100vw-2rem)] grid-cols-3 gap-2 sm:grid-cols-4">
      <button
        v-for="year in years"
        :key="year"
        type="button"
        :disabled="isYearDisabled(year)"
        :class="cn(
          buttonVariants({ variant: year === placeholder.year ? 'default' : 'ghost', size: 'sm' }),
          'h-10',
          (year < decadeStart || year > decadeStart + 9) && 'text-muted-foreground',
        )"
        @click="selectYear(year)"
      >
        {{ year }}
      </button>
    </div>

    <div v-else class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell
              v-for="day in weekDays" :key="day"
            >
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <RangeCalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
