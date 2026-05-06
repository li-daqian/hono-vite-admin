import type { RolePermissionTreeNodeSchema } from '@admin/client'

export type PermissionTreeNode = RolePermissionTreeNodeSchema
export type PermissionTreeCheckState = boolean | 'indeterminate'
export type PermissionTemplateId = 'empty' | 'navigation' | 'full'

export interface PermissionTemplate {
  id: PermissionTemplateId
  name: string
  description: string
}

export interface PermissionSummary {
  key: string
  id: string
  type: PermissionTreeNode['type']
  name: string
  description: string | null
  path: string[]
}

export interface PermissionDiff {
  added: PermissionSummary[]
  removed: PermissionSummary[]
}

export interface PermissionTreeIndexes {
  nodeById: Map<string, PermissionTreeNode>
  parentById: Map<string, string | null>
}

export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'empty',
    name: 'No permissions',
    description: 'Clear every menu and action.',
  },
  {
    id: 'navigation',
    name: 'Navigation only',
    description: 'Grant all menu entries without write actions.',
  },
  {
    id: 'full',
    name: 'Full access',
    description: 'Grant every menu and action.',
  },
]

function createPermissionKey(node: Pick<PermissionTreeNode, 'id' | 'type'>) {
  return `${node.type}:${node.id}`
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

export function getPermissionKey(node: Pick<PermissionTreeNode, 'id' | 'type'>) {
  return createPermissionKey(node)
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

  if (node.enable && (everyChildChecked || everyChildUnchecked))
    return true

  if (!node.enable && everyChildUnchecked)
    return false

  return 'indeterminate'
}

export function setNodeAndDescendantsEnabled(node: PermissionTreeNode, enabled: boolean): void {
  node.enable = enabled
  node.children.forEach(child => setNodeAndDescendantsEnabled(child, enabled))
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

  return nextTree
}

export function applyPermissionTemplate(
  nodes: PermissionTreeNode[],
  templateId: PermissionTemplateId,
): PermissionTreeNode[] {
  const nextTree = clonePermissionTree(nodes)

  const visit = (node: PermissionTreeNode) => {
    switch (templateId) {
      case 'empty':
        node.enable = false
        break
      case 'navigation':
        node.enable = node.type === 'MENU'
        break
      case 'full':
        node.enable = true
        break
    }

    node.children.forEach(visit)
  }

  nextTree.forEach(visit)
  return nextTree
}

export function getEnabledPermissionSummaries(nodes: PermissionTreeNode[]): PermissionSummary[] {
  const summaries: PermissionSummary[] = []

  const visit = (node: PermissionTreeNode, path: string[]) => {
    const nextPath = [...path, node.name]
    if (node.enable) {
      summaries.push({
        key: createPermissionKey(node),
        id: node.id,
        type: node.type,
        name: node.name,
        description: node.description,
        path: nextPath,
      })
    }

    node.children.forEach(child => visit(child, nextPath))
  }

  nodes.forEach(node => visit(node, []))
  return summaries
}

export function diffPermissionTrees(
  before: PermissionTreeNode[],
  after: PermissionTreeNode[],
): PermissionDiff {
  const beforeSummaries = new Map(getEnabledPermissionSummaries(before).map(summary => [summary.key, summary]))
  const afterSummaries = new Map(getEnabledPermissionSummaries(after).map(summary => [summary.key, summary]))

  return {
    added: [...afterSummaries.values()].filter(summary => !beforeSummaries.has(summary.key)),
    removed: [...beforeSummaries.values()].filter(summary => !afterSummaries.has(summary.key)),
  }
}

export function mergeEnabledPermissions(
  base: PermissionTreeNode[],
  grants: PermissionTreeNode[],
): PermissionTreeNode[] {
  const grantKeys = new Set(getEnabledPermissionSummaries(grants).map(summary => summary.key))
  const nextTree = clonePermissionTree(base)

  const visit = (node: PermissionTreeNode) => {
    if (grantKeys.has(createPermissionKey(node))) {
      node.enable = true
    }

    node.children.forEach(visit)
  }

  nextTree.forEach(visit)
  return nextTree
}
