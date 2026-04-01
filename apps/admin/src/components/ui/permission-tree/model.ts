import type { MenuActionSchema, MenuItemSchema } from '@admin/client'

export type PermissionTreeCheckState = boolean | 'indeterminate'

export interface PermissionTreeAction {
  id: string
  name: string
  description: string | null
  parentId: string
}

export interface PermissionTreeNode {
  id: string
  name: string
  description: string | null
  parentId: string | null
  children: PermissionTreeNode[]
  actions: PermissionTreeAction[]
}

export interface PermissionTreeIndexes {
  nodeById: Map<string, PermissionTreeNode>
  parentById: Map<string, string | null>
}

function mapMenuActionToPermissionTreeAction(
  action: MenuActionSchema,
  parentId: string,
): PermissionTreeAction {
  return {
    id: action.id,
    name: action.name,
    description: action.description,
    parentId,
  }
}

function mapMenuItemToPermissionTreeNode(
  menu: MenuItemSchema,
  parentId: string | null,
): PermissionTreeNode {
  return {
    id: menu.id,
    name: menu.name,
    description: menu.path,
    parentId,
    actions: menu.actions.map(action => mapMenuActionToPermissionTreeAction(action, menu.id)),
    children: menu.children.map(child => mapMenuItemToPermissionTreeNode(child, menu.id)),
  }
}

export function mapMenuTreeToPermissionTree(nodes: MenuItemSchema[]): PermissionTreeNode[] {
  return nodes.map(node => mapMenuItemToPermissionTreeNode(node, null))
}

export function buildPermissionTreeIndexes(
  nodes: PermissionTreeNode[],
  parentId: string | null = null,
): PermissionTreeIndexes {
  const nodeById = new Map<string, PermissionTreeNode>()
  const parentById = new Map<string, string | null>()

  const visit = (items: PermissionTreeNode[], currentParentId: string | null) => {
    for (const node of items) {
      nodeById.set(node.id, node)
      parentById.set(node.id, currentParentId)
      visit(node.children, node.id)
    }
  }

  visit(nodes, parentId)

  return { nodeById, parentById }
}

export function getAllMenuIds(node: PermissionTreeNode): string[] {
  return [node.id, ...node.children.flatMap(getAllMenuIds)]
}

export function getAllActionIds(node: PermissionTreeNode): string[] {
  return [...node.actions.map(action => action.id), ...node.children.flatMap(getAllActionIds)]
}

export function hasSelectedDescendants(
  node: PermissionTreeNode,
  menuIds: Set<string>,
  actionIds: Set<string>,
): boolean {
  return node.actions.some(action => actionIds.has(action.id))
    || node.children.some(child => menuIds.has(child.id) || hasSelectedDescendants(child, menuIds, actionIds))
}

export function getNodeCheckState(
  node: PermissionTreeNode,
  selectedMenuIds: Set<string>,
  selectedActionIds: Set<string>,
): PermissionTreeCheckState {
  const allMenus = getAllMenuIds(node)
  const allActions = getAllActionIds(node)

  const checkedMenus = allMenus.filter(id => selectedMenuIds.has(id)).length
  const checkedActions = allActions.filter(id => selectedActionIds.has(id)).length

  const totalChecked = checkedMenus + checkedActions
  const totalItems = allMenus.length + allActions.length

  if (totalChecked === 0)
    return false
  if (totalChecked === totalItems)
    return true
  return 'indeterminate'
}
