import type { RolePermissionsResponse, RolePermissionTreeNode } from '@server/src/modules/role/role.schema'
import { PermissionType } from '@server/generated/prisma/enums'

export interface RolePermissionMenuRecord {
  id: string
  parentId: string | null
  name: string
  path: string | null
  order: number
}

export interface RolePermissionActionRecord {
  id: string
  menuId: string
  name: string
  description: string | null
}

export interface RolePermissionEntry {
  type: PermissionType
  targetId: string
}

function createPermissionKey(entry: RolePermissionEntry) {
  return `${entry.type}:${entry.targetId}`
}

export function buildRolePermissionsTree(
  menus: RolePermissionMenuRecord[],
  actions: RolePermissionActionRecord[],
  grantedPermissions: RolePermissionEntry[],
): RolePermissionsResponse {
  const grantedPermissionKeys = new Set(grantedPermissions.map(createPermissionKey))
  const menusByParentId = menus.reduce<Record<string, RolePermissionMenuRecord[]>>((acc, menu) => {
    const parentId = menu.parentId ?? ''
    ;(acc[parentId] ??= []).push(menu)
    return acc
  }, {})
  const actionsByMenuId = actions.reduce<Record<string, RolePermissionActionRecord[]>>((acc, action) => {
    ;(acc[action.menuId] ??= []).push(action)
    return acc
  }, {})

  const buildMenuNode = (menu: RolePermissionMenuRecord): RolePermissionTreeNode => ({
    id: menu.id,
    name: menu.name,
    type: PermissionType.MENU,
    description: '',
    enable: grantedPermissionKeys.has(createPermissionKey({ type: PermissionType.MENU, targetId: menu.id })),
    children: [
      ...(actionsByMenuId[menu.id] ?? []).map(action => ({
        id: action.id,
        name: action.name,
        type: PermissionType.ACTION,
        description: action.description,
        enable: grantedPermissionKeys.has(createPermissionKey({ type: PermissionType.ACTION, targetId: action.id })),
        children: [],
      })),
      ...[...(menusByParentId[menu.id] ?? [])]
        .sort((left, right) => left.order - right.order)
        .map(buildMenuNode),
    ],
  })

  return [...(menusByParentId[''] ?? [])]
    .sort((left, right) => left.order - right.order)
    .map(buildMenuNode)
}

export function flattenEnabledRolePermissions(nodes: RolePermissionTreeNode[]): RolePermissionEntry[] {
  const entries: RolePermissionEntry[] = []
  const seen = new Set<string>()

  const visit = (node: RolePermissionTreeNode) => {
    if (node.enable) {
      const entry = {
        type: node.type as PermissionType,
        targetId: node.id,
      }
      const permissionKey = createPermissionKey(entry)
      if (!seen.has(permissionKey)) {
        seen.add(permissionKey)
        entries.push(entry)
      }
    }

    node.children.forEach(visit)
  }

  nodes.forEach(visit)

  return entries
}
