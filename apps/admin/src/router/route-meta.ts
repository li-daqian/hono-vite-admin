import type { LucideIcon } from 'lucide-vue-next'
import type { RouteComponent } from 'vue-router'
import { FileText, LayoutDashboard, ShieldIcon } from 'lucide-vue-next'

export interface RouteMetaConfig {
  component?: RouteComponent
  icon?: LucideIcon
}

export const routeMetaConfigMap: Record<string, RouteMetaConfig> = {
  'dashboard': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: LayoutDashboard,
  },
  'access': {
    icon: ShieldIcon,
  },
  'access.audit': {
    component: () => import('@admin/pages/audit/index.vue'),
    icon: FileText,
  },
  'access.users': {
    component: () => import('@admin/pages/users/index.vue'),
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
