<script setup lang="ts">
import type {
  AuditLogListItemSchema,
  DepartmentTreeItemSchema,
  UserProfileResponseSchema,
} from '@admin/client'
import { getAuditPage, getDepartment, getRole, getUserPage } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card'
import { Skeleton } from '@admin/components/ui/skeleton'
import { formatAuditDateTime, formatAuditLabel, formatAuditOperator } from '@admin/pages/audit/components/audit-utils'
import { countDepartmentTree } from '@admin/pages/departments/components/department-utils'
import {
  Activity,
  ArrowRight,
  Building2,
  CircleAlert,
  ClipboardList,
  History,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type MetricTone = 'default' | 'success' | 'warning' | 'info'

interface DashboardMetric {
  label: string
  value: number
  description: string
  tone: MetricTone
  icon: typeof Users
  failed?: boolean
}

interface QuickLink {
  label: string
  description: string
  to: string
  icon: typeof Users
}

const isLoading = ref(true)
const failedSections = ref<string[]>([])
const recentUsers = ref<UserProfileResponseSchema[]>([])
const recentOperationLogs = ref<AuditLogListItemSchema[]>([])
const totalUsers = ref(0)
const activeUsers = ref(0)
const disabledUsers = ref(0)
const totalRoles = ref(0)
const totalDepartments = ref(0)
const totalAuditEvents = ref(0)
const lastRefreshedAt = ref<Date | null>(null)

const hasPartialFailure = computed(() => failedSections.value.length > 0)
const lastRefreshedText = computed(() => lastRefreshedAt.value?.toLocaleString() ?? 'Not refreshed yet')

const metrics = computed<DashboardMetric[]>(() => [
  {
    label: 'Total Users',
    value: totalUsers.value,
    description: 'Accounts managed by the system',
    tone: 'default',
    icon: Users,
    failed: failedSections.value.includes('users'),
  },
  {
    label: 'Active Users',
    value: activeUsers.value,
    description: 'Accounts currently allowed to sign in',
    tone: 'success',
    icon: UserCheck,
    failed: failedSections.value.includes('active users'),
  },
  {
    label: 'Disabled Users',
    value: disabledUsers.value,
    description: 'Accounts blocked from access',
    tone: 'warning',
    icon: UserX,
    failed: failedSections.value.includes('disabled users'),
  },
  {
    label: 'Roles',
    value: totalRoles.value,
    description: 'Permission groups configured',
    tone: 'info',
    icon: ShieldCheck,
    failed: failedSections.value.includes('roles'),
  },
  {
    label: 'Departments',
    value: totalDepartments.value,
    description: 'Organization units in the tree',
    tone: 'info',
    icon: Building2,
    failed: failedSections.value.includes('departments'),
  },
  {
    label: 'Audit Events',
    value: totalAuditEvents.value,
    description: 'Recorded login and operation activity',
    tone: 'default',
    icon: Activity,
    failed: failedSections.value.includes('audit events'),
  },
])

const quickLinks: QuickLink[] = [
  {
    label: 'Users',
    description: 'Create accounts, reset passwords, and manage access.',
    to: '/access/users',
    icon: Users,
  },
  {
    label: 'Departments',
    description: 'Review the organization tree and user assignments.',
    to: '/access/departments',
    icon: Building2,
  },
  {
    label: 'Roles',
    description: 'Maintain role definitions and permission coverage.',
    to: '/access/roles',
    icon: ShieldCheck,
  },
  {
    label: 'Login Logs',
    description: 'Inspect sign-in and sign-out events.',
    to: '/audit/login',
    icon: History,
  },
  {
    label: 'Operation Logs',
    description: 'Review administrative actions across modules.',
    to: '/audit/operation',
    icon: ClipboardList,
  },
]

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function getMetricIconClass(tone: MetricTone): string {
  const toneClassMap: Record<MetricTone, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  }

  return toneClassMap[tone]
}

function getStatusBadgeVariant(status: UserProfileResponseSchema['status']): 'default' | 'secondary' {
  return status === 'ACTIVE' ? 'default' : 'secondary'
}

function getStatusLabel(status: UserProfileResponseSchema['status']): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function getUserName(user: UserProfileResponseSchema): string {
  const displayName = user.displayName?.trim()
  return displayName ? `${displayName} (${user.username})` : user.username
}

function countDepartments(departments: DepartmentTreeItemSchema[]): number {
  return countDepartmentTree(departments)
}

async function loadDashboard() {
  isLoading.value = true
  failedSections.value = []

  const [
    usersResult,
    activeUsersResult,
    disabledUsersResult,
    rolesResult,
    departmentsResult,
    auditEventsResult,
    operationLogsResult,
  ] = await Promise.allSettled([
    getUserPage<true>({ query: { page: 1, pageSize: 5, sort: 'createdAt desc' } }),
    getUserPage<true>({ query: { page: 1, pageSize: 1, status: ['ACTIVE'] } }),
    getUserPage<true>({ query: { page: 1, pageSize: 1, status: ['DISABLED'] } }),
    getRole<true>(),
    getDepartment<true>(),
    getAuditPage<true>({ query: { page: 1, pageSize: 1, sort: 'createdAt desc' } }),
    getAuditPage<true>({ query: { page: 1, pageSize: 5, sort: 'createdAt desc', categories: ['operation'] } }),
  ])

  if (usersResult.status === 'fulfilled') {
    totalUsers.value = usersResult.value.data.meta.totalItem
    recentUsers.value = usersResult.value.data.items
  }
  else {
    totalUsers.value = 0
    recentUsers.value = []
    failedSections.value.push('users')
  }

  if (activeUsersResult.status === 'fulfilled') {
    activeUsers.value = activeUsersResult.value.data.meta.totalItem
  }
  else {
    activeUsers.value = 0
    failedSections.value.push('active users')
  }

  if (disabledUsersResult.status === 'fulfilled') {
    disabledUsers.value = disabledUsersResult.value.data.meta.totalItem
  }
  else {
    disabledUsers.value = 0
    failedSections.value.push('disabled users')
  }

  if (rolesResult.status === 'fulfilled') {
    totalRoles.value = rolesResult.value.data.length
  }
  else {
    totalRoles.value = 0
    failedSections.value.push('roles')
  }

  if (departmentsResult.status === 'fulfilled') {
    totalDepartments.value = countDepartments(departmentsResult.value.data)
  }
  else {
    totalDepartments.value = 0
    failedSections.value.push('departments')
  }

  if (auditEventsResult.status === 'fulfilled') {
    totalAuditEvents.value = auditEventsResult.value.data.meta.totalItem
  }
  else {
    totalAuditEvents.value = 0
    failedSections.value.push('audit events')
  }

  if (operationLogsResult.status === 'fulfilled') {
    recentOperationLogs.value = operationLogsResult.value.data.items
  }
  else {
    recentOperationLogs.value = []
    failedSections.value.push('operation logs')
  }

  lastRefreshedAt.value = new Date()
  isLoading.value = false
}

onMounted(() => {
  void loadDashboard()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Dashboard
        </h2>
        <p class="text-muted-foreground">
          Monitor access, organization, and audit activity across the admin system.
        </p>
      </div>
    </div>

    <div
      v-if="hasPartialFailure"
      class="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
    >
      <CircleAlert class="mt-0.5 size-4 shrink-0" />
      <p>
        Some dashboard data could not be loaded: {{ failedSections.join(', ') }}.
      </p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        v-for="metric in metrics"
        :key="metric.label"
        class="rounded-md"
      >
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            {{ metric.label }}
          </CardTitle>
          <div class="rounded-md p-2" :class="[getMetricIconClass(metric.tone)]">
            <component :is="metric.icon" class="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton
            v-if="isLoading"
            class="h-9 w-24"
          />
          <p
            v-else
            class="text-3xl font-bold tracking-tight"
          >
            {{ metric.failed ? '-' : formatNumber(metric.value) }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ metric.description }}
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <Card class="rounded-md">
        <CardHeader>
          <div class="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Newest accounts created in the system.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              :as="RouterLink"
              to="/access/users"
            >
              View all
              <ArrowRight class="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            v-if="isLoading"
            class="space-y-3"
          >
            <Skeleton
              v-for="item in 5"
              :key="item"
              class="h-12"
            />
          </div>

          <div
            v-else-if="recentUsers.length === 0"
            class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            No recent users found.
          </div>

          <div
            v-else
            class="divide-y"
          >
            <div
              v-for="user in recentUsers"
              :key="user.id"
              class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {{ getUserName(user) }}
                </p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ user.email ?? 'No email' }} - Created {{ formatAuditDateTime(user.createdAt) }}
                </p>
              </div>
              <Badge
                :variant="getStatusBadgeVariant(user.status)"
                class="shrink-0"
              >
                {{ getStatusLabel(user.status) }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="rounded-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into the most common administration areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-2">
            <Button
              v-for="link in quickLinks"
              :key="link.to"
              variant="ghost"
              class="h-auto justify-start rounded-md border p-3 text-left"
              :as="RouterLink"
              :to="link.to"
            >
              <component
                :is="link.icon"
                class="size-4 text-muted-foreground"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium">{{ link.label }}</span>
                <span class="block whitespace-normal text-xs font-normal text-muted-foreground">
                  {{ link.description }}
                </span>
              </span>
              <ArrowRight class="size-4 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="rounded-md">
      <CardHeader>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Recent Operation Logs</CardTitle>
            <CardDescription>
              Latest administrative actions captured by audit logging.
            </CardDescription>
          </div>
          <p class="text-xs text-muted-foreground">
            Last refreshed {{ lastRefreshedText }}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div
          v-if="isLoading"
          class="space-y-3"
        >
          <Skeleton
            v-for="item in 5"
            :key="item"
            class="h-14"
          />
        </div>

        <div
          v-else-if="recentOperationLogs.length === 0"
          class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          No recent operation logs found.
        </div>

        <div
          v-else
          class="overflow-hidden rounded-md border"
        >
          <div class="grid grid-cols-[1fr_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid-cols-[160px_1fr_180px_auto]">
            <span>Time</span>
            <span class="hidden sm:block">Action</span>
            <span class="hidden sm:block">Operator</span>
            <span>Module</span>
          </div>
          <div
            v-for="log in recentOperationLogs"
            :key="log.id"
            class="grid grid-cols-[1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[160px_1fr_180px_auto]"
          >
            <span class="text-muted-foreground">{{ formatAuditDateTime(log.createdAt) }}</span>
            <span class="hidden min-w-0 truncate font-medium sm:block">
              {{ formatAuditLabel(log.action) }}
            </span>
            <span class="hidden min-w-0 truncate text-muted-foreground sm:block">
              {{ formatAuditOperator(log) }}
            </span>
            <Badge
              variant="outline"
              class="justify-self-end"
            >
              {{ formatAuditLabel(log.module) }}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
