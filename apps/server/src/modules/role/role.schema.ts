import { z } from '@hono/zod-openapi'
import { PermissionType } from '@server/generated/prisma/enums'

export const RoleBaseResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the role', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  name: z.string().openapi({ description: 'Unique role name', example: 'admin' }),
  description: z.string().nullable().openapi({ description: 'Role description', example: 'System administrator role' }),
})

export const RoleCreateRequestSchema = z.object({
  name: z.string().min(1).max(50).openapi({ description: 'Unique role name', example: 'admin' }),
  description: z.string().max(255).nullable().openapi({ description: 'Role description', example: 'System administrator role' }),
})
export const RoleCreateResponseSchema = RoleBaseResponseSchema
export type RoleCreateRequest = z.infer<typeof RoleCreateRequestSchema>
export type RoleCreateResponse = z.infer<typeof RoleCreateResponseSchema>

export const RoleUpdateRequestSchema = z.object({
  name: z.string().min(1).max(50).optional().openapi({ description: 'Unique role name', example: 'operator' }),
  description: z.string().max(255).nullable().optional().openapi({ description: 'Role description', example: 'Operations role' }),
}).refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided for update',
})
export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>

export const RoleProfileResponseSchema = RoleBaseResponseSchema.openapi('RoleProfileResponseSchema')
export type RoleProfileResponse = z.infer<typeof RoleProfileResponseSchema>

export const RoleListResponseSchema = z.array(RoleProfileResponseSchema).openapi('RoleListResponseSchema')
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>

export const RoleDeleteResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative().openapi({ description: 'Number of roles deleted', example: 1 }),
})
export type RoleDeleteResponse = z.infer<typeof RoleDeleteResponseSchema>

export interface RolePermissionTreeNode {
  id: string
  name: string
  type: PermissionType
  description: string | null
  enable: boolean
  children: RolePermissionTreeNode[]
}

export const RolePermissionTreeNodeSchema: z.ZodType<RolePermissionTreeNode> = z.object({
  id: z.string().openapi({ description: 'Permission target ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  name: z.string().openapi({ description: 'Permission display name', example: 'Dashboard' }),
  type: z.nativeEnum(PermissionType).openapi({ description: 'Permission node type', example: 'MENU' }),
  description: z.string().nullable().openapi({ description: 'Permission description', example: '/dashboard' }),
  enable: z.boolean().openapi({ description: 'Whether the permission is enabled for the role', example: true }),
  get children(): z.ZodArray<typeof RolePermissionTreeNodeSchema> {
    return z.array(RolePermissionTreeNodeSchema).openapi({
      type: 'array',
      items: { $ref: '#/components/schemas/RolePermissionTreeNodeSchema' },
      description: 'Child permission nodes',
    })
  },
}).openapi('RolePermissionTreeNodeSchema')

export const RolePermissionsResponseSchema = z.array(RolePermissionTreeNodeSchema).openapi('RolePermissionsResponseSchema')
export type RolePermissionsResponse = z.infer<typeof RolePermissionsResponseSchema>

export const RolePermissionsUpdateRequestSchema = z.array(RolePermissionTreeNodeSchema).openapi('RolePermissionsUpdateRequestSchema')
export type RolePermissionsUpdateRequest = z.infer<typeof RolePermissionsUpdateRequestSchema>
