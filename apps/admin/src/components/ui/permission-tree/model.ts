import type { RolePermissionTreeNodeSchema } from '@admin/client'

export type PermissionTreeNode = RolePermissionTreeNodeSchema
export type PermissionTreeCheckState = boolean | 'indeterminate'

export interface PermissionTreeIndexes {
  nodeById: Map<string, PermissionTreeNode>
  parentById: Map<string, string | null>
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

export function clonePermissionTree(nodes: PermissionTreeNode[]): PermissionTreeNode[] {
  return nodes.map(node => ({
    ...node,
    children: clonePermissionTree(node.children),
  }))
}

export function getNodeCheckState(node: PermissionTreeNode): PermissionTreeCheckState {
  const childStates = node.children.map(getNodeCheckState)

  if (childStates.length === 0)
    return node.enable

  const everyChildChecked = childStates.every(state => state === true)
  const everyChildUnchecked = childStates.every(state => state === false)

  if (node.enable && everyChildChecked)
    return true

  if (!node.enable && everyChildUnchecked)
    return false

  return 'indeterminate'
}

export function setNodeAndDescendantsEnabled(node: PermissionTreeNode, enabled: boolean): void {
  node.enable = enabled
  node.children.forEach(child => setNodeAndDescendantsEnabled(child, enabled))
}

export function syncAncestorEnableState(
  nodeId: string,
  indexes: PermissionTreeIndexes,
): void {
  let currentId = indexes.parentById.get(nodeId) ?? null

  while (currentId) {
    const currentNode = indexes.nodeById.get(currentId)
    if (!currentNode)
      break

    currentNode.enable = currentNode.children.some(child => child.enable || getNodeCheckState(child) !== false)
    currentId = indexes.parentById.get(currentId) ?? null
  }
}

export function togglePermissionNode(
  tree: PermissionTreeNode[],
  nodeId: string,
  checked: boolean,
): PermissionTreeNode[] {
  const nextTree = clonePermissionTree(tree)
  const indexes = buildPermissionTreeIndexes(nextTree)
  const node = indexes.nodeById.get(nodeId)
  if (!node)
    return nextTree

  setNodeAndDescendantsEnabled(node, checked)

  if (checked) {
    let currentId = indexes.parentById.get(nodeId) ?? null
    while (currentId) {
      const currentNode = indexes.nodeById.get(currentId)
      if (!currentNode)
        break
      currentNode.enable = true
      currentId = indexes.parentById.get(currentId) ?? null
    }
  }
  else {
    syncAncestorEnableState(nodeId, indexes)
  }

  return nextTree
}
