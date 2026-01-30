import type { LucideIcon } from 'lucide-vue-next'
import type { RouteComponent } from 'vue-router'
import { HomeIcon, ShieldIcon, UsersIcon } from 'lucide-vue-next'

type RouteKey = | 'dashboard' | 'system.user' | 'system.role'

export interface RouteMetaConfig {
  component: RouteComponent
  icon: LucideIcon
}

export const routeMetaConfigMap: Record<RouteKey, RouteMetaConfig> = {
  'dashboard': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: HomeIcon,
  },
  'system.user': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: UsersIcon,
  },
  'system.role': {
    component: () => import('@admin/pages/DashboardPage.vue'),
    icon: ShieldIcon,
  },
}
