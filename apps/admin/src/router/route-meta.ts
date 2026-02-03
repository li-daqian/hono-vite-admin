import type { LucideIcon } from 'lucide-vue-next'
import type { RouteComponent } from 'vue-router'
import { HomeIcon, ShieldIcon } from 'lucide-vue-next'

export interface RouteMetaConfig {
  component?: RouteComponent
  icon?: LucideIcon
}

export const routeMetaConfigMap: Record<string, RouteMetaConfig> = {
  'dashboard': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: HomeIcon,
  },
  'system': {
    icon: ShieldIcon,
  },
  'system.user': {
    component: () => import('@admin/pages/DashboardPage.vue'),
  },
  'system.role': {
    component: () => import('@admin/pages/DashboardPage.vue'),
  },
}

export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  NOT_FOUND: 'not-found',
} as const
