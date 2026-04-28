import type { AuthActionSchema } from '@admin/client'
import { isReadOnlyAction, READ_ONLY_MODE_MESSAGE } from '@admin/lib/read-only'
import { useAppConfigStore } from '@admin/stores/app-config'
import { useMenuStore } from '@admin/stores/menu'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

export interface PermissionSource {
  menuId?: string | null
  actions?: AuthActionSchema[] | null
}

export interface ResolveActionPermissionOptions {
  actionName?: string
  subject?: string
}

export interface ResolvedActionPermission {
  allowed: boolean
  actionId: string | null
  actionName: string
  reason: string | null
}

function humanizeActionKey(actionKey: string): string {
  const segments = actionKey.split('.')
  const normalizedKey = actionKey.includes('.')
    ? (segments[segments.length - 1] ?? actionKey)
    : actionKey

  return normalizedKey
    .replace(/[-_]/g, ' ')
    .trim()
    .replace(/^\w/, (char: string) => char.toUpperCase())
}

export function buildActionPermissionId(menuId: string, actionKey: string): string {
  return actionKey.includes('.') ? actionKey : `${menuId}.${actionKey}`
}

export function createPermissionDeniedMessage(actionName: string, subject?: string): string {
  const normalizedActionName = actionName.trim().toLowerCase()
  return subject
    ? `You do not have permission to ${normalizedActionName} ${subject}.`
    : `You do not have permission to ${normalizedActionName} on this page.`
}

export function createPermissionSource(
  currentMenu: PermissionSource | undefined,
  routeMeta: PermissionSource,
): PermissionSource {
  if (currentMenu?.menuId) {
    return {
      menuId: currentMenu.menuId,
      actions: currentMenu.actions ?? [],
    }
  }

  return {
    menuId: routeMeta.menuId ?? null,
    actions: routeMeta.actions ?? [],
  }
}

export function resolveActionPermission(
  source: PermissionSource,
  actionKey: string,
  options: ResolveActionPermissionOptions = {},
): ResolvedActionPermission {
  const actions = source.actions ?? []
  const fallbackActionName = options.actionName?.trim() || humanizeActionKey(actionKey)
  const actionId = source.menuId
    ? buildActionPermissionId(source.menuId, actionKey)
    : (actionKey.includes('.') ? actionKey : null)

  const appConfigStore = useAppConfigStore()
  if (appConfigStore.readOnlyMode && isReadOnlyAction(actionKey)) {
    return {
      allowed: false,
      actionId,
      actionName: fallbackActionName,
      reason: appConfigStore.readOnlyMessage || READ_ONLY_MODE_MESSAGE,
    }
  }

  const matchedAction = actionId
    ? actions.find(action => action.id === actionId)
    : actions.find(action => action.id === actionKey)

  if (!matchedAction) {
    return {
      allowed: false,
      actionId,
      actionName: fallbackActionName,
      reason: createPermissionDeniedMessage(fallbackActionName, options.subject),
    }
  }

  return {
    allowed: true,
    actionId: matchedAction.id,
    actionName: matchedAction.name,
    reason: null,
  }
}

export function usePageActionPermissions() {
  const route = useRoute()
  const menuStore = useMenuStore()

  const source = computed(() => createPermissionSource(
    menuStore.currentMenu
      ? {
          menuId: menuStore.currentMenu.id,
          actions: menuStore.currentMenu.actions,
        }
      : undefined,
    {
      menuId: typeof route.meta.menuId === 'string' ? route.meta.menuId : null,
      actions: Array.isArray(route.meta.actions) ? route.meta.actions : [],
    },
  ))

  function resolve(actionKey: string, options: ResolveActionPermissionOptions = {}) {
    return resolveActionPermission(source.value, actionKey, options)
  }

  function can(actionKey: string): boolean {
    return resolve(actionKey).allowed
  }

  function why(actionKey: string, options: ResolveActionPermissionOptions = {}): string | null {
    return resolve(actionKey, options).reason
  }

  function guard(actionKey: string, options: ResolveActionPermissionOptions = {}): boolean {
    const permission = resolve(actionKey, options)
    if (!permission.allowed && permission.reason) {
      toast.info(permission.reason)
      return false
    }

    return true
  }

  return {
    can,
    guard,
    resolve,
    why,
  }
}
