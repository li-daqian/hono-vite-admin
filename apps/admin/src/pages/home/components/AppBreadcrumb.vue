<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@admin/components/ui/breadcrumb'

export interface BreadcrumbItemType {
  label: string
  href?: string
}

const props = defineProps<{
  items: BreadcrumbItemType[]
}>()
</script>

<template>
  <div>
    <Breadcrumb>
      <BreadcrumbList>
        <template v-for="(item, index) in props.items" :key="index">
          <!-- if have href and not the last item can click -->
          <template v-if="index !== props.items.length - 1">
            <BreadcrumbItem class="hidden md:block">
              <template v-if="item.href">
                <BreadcrumbLink as-child>
                  <RouterLink :to="item.href">
                    {{ item.label }}
                  </RouterLink>
                </BreadcrumbLink>
              </template>
              <template v-else>
                {{ item.label }}
              </template>
            </BreadcrumbItem>
          </template>

          <!-- if is the last item -->
          <template v-if="index === props.items.length - 1">
            <BreadcrumbItem>
              <BreadcrumbPage>
                {{ item.label }}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </template>

          <!-- if is not the last item show separator -->
          <BreadcrumbSeparator v-if="index !== props.items.length - 1" class="hidden md:block" />
        </template>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
</template>
