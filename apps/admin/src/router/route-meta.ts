import type { LucideIcon } from 'lucide-vue-next'
import type { RouteComponent } from 'vue-router'
import { LayoutDashboard, Search, ShieldIcon } from 'lucide-vue-next'

export interface RouteMetaConfig {
  component?: RouteComponent
  icon?: LucideIcon
}

export const routeMetaConfigMap: Record<string, RouteMetaConfig> = {
  'dashboard': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: LayoutDashboard,
  },
  'audit': {
    icon: Search,
  },
  'audit.login': {
    component: () => import('@admin/pages/audit/login/index.vue'),
  },
  'audit.operation': {
    component: () => import('@admin/pages/audit/operation/index.vue'),
  },
  'access': {
    icon: ShieldIcon,
  },
  'access.users': {
    component: () => import('@admin/pages/users/index.vue'),
  },
  'access.departments': {
    component: () => import('@admin/pages/departments/index.vue'),
  },
  'access.roles': {
    component: () => import('@admin/pages/roles/index.vue'),
  },
}

export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  NOT_FOUND: 'not-found',
} as const
