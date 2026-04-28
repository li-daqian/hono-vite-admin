import { z } from '@hono/zod-openapi'
import { DepartmentStatus } from '@server/generated/prisma/enums'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

function emptyStringToNull(value: unknown) {
  return value === '' ? null : value
}

export const DepartmentCreateRequestSchema = z.object({
  parentId: z.preprocess(emptyStringToNull, z.string().min(1).nullable().optional()).openapi({ description: 'Parent department ID', example: null }),
  name: z.string().trim().min(1).max(50).openapi({ description: 'Department name', example: 'Engineering' }),
  leader: z.string().trim().max(50).nullable().optional().openapi({ description: 'Department leader name', example: 'Jane Doe' }),
  phone: z.string().trim().max(20).nullable().optional().openapi({ description: 'Department contact phone', example: '+1234567890' }),
  email: z.email().nullable().optional().openapi({ description: 'Department contact email', example: 'engineering@example.com' }),
  order: z.number().int().min(0).default(0).openapi({ description: 'Display order', example: 1 }),
  status: z.enum(Object.values(DepartmentStatus)).optional().openapi({ description: 'Department status', example: DepartmentStatus.ACTIVE }),
})
export type DepartmentCreateRequest = z.infer<typeof DepartmentCreateRequestSchema>

export const DepartmentUpdateRequestSchema = z.object({
  parentId: z.preprocess(emptyStringToNull, z.string().min(1).nullable().optional()).openapi({ description: 'Parent department ID', example: null }),
  name: z.string().trim().min(1).max(50).optional().openapi({ description: 'Department name', example: 'Product Engineering' }),
  leader: z.string().trim().max(50).nullable().optional().openapi({ description: 'Department leader name', example: 'Jane Doe' }),
  phone: z.string().trim().max(20).nullable().optional().openapi({ description: 'Department contact phone', example: '+1234567890' }),
  email: z.email().nullable().optional().openapi({ description: 'Department contact email', example: 'engineering@example.com' }),
  order: z.number().int().min(0).optional().openapi({ description: 'Display order', example: 1 }),
  status: z.enum(Object.values(DepartmentStatus)).optional().openapi({ description: 'Department status', example: DepartmentStatus.ACTIVE }),
}).refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided for update',
})
export type DepartmentUpdateRequest = z.infer<typeof DepartmentUpdateRequestSchema>

export const DepartmentListRequestSchema = z.object({
  search: z.preprocess(emptyStringToUndefined, z.string().max(100).nullable().default(null)).openapi({ description: 'Search term for filtering departments by name', example: 'Engineering' }),
  status: z.preprocess(
    (value) => {
      if (value === '')
        return undefined
      if (typeof value === 'string')
        return [value]
      return value
    },
    z.array(z.enum(DepartmentStatus)).nullable().default(null),
  ).openapi({ description: 'Filter departments by one or more statuses', example: [DepartmentStatus.ACTIVE] }),
})
export type DepartmentListRequest = z.infer<typeof DepartmentListRequestSchema>

export const DepartmentProfileResponseSchema = z.object({
  id: z.string().openapi({ description: 'Department ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  parentId: z.string().nullable().openapi({ description: 'Parent department ID', example: null }),
  name: z.string().openapi({ description: 'Department name', example: 'Engineering' }),
  leader: z.string().nullable().openapi({ description: 'Department leader name', example: 'Jane Doe' }),
  phone: z.string().nullable().openapi({ description: 'Department contact phone', example: '+1234567890' }),
  email: z.email().nullable().openapi({ description: 'Department contact email', example: 'engineering@example.com' }),
  order: z.number().int().openapi({ description: 'Display order', example: 1 }),
  status: z.enum(Object.values(DepartmentStatus)).openapi({ description: 'Department status', example: DepartmentStatus.ACTIVE }),
  userCount: z.number().int().nonnegative().openapi({ description: 'Number of users assigned to this department', example: 3 }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the department was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Timestamp when the department was last updated', example: '2024-01-02T12:00:00Z' }),
}).openapi('DepartmentProfileResponseSchema')
export type DepartmentProfileResponse = z.infer<typeof DepartmentProfileResponseSchema>

export interface DepartmentTreeItem extends DepartmentProfileResponse {
  children: DepartmentTreeItem[]
}

export const DepartmentTreeItemSchema: z.ZodType<DepartmentTreeItem> = DepartmentProfileResponseSchema.extend({
  get children(): z.ZodArray<typeof DepartmentTreeItemSchema> {
    return z.array(DepartmentTreeItemSchema).openapi({
      type: 'array',
      items: { $ref: '#/components/schemas/DepartmentTreeItemSchema' },
      description: 'Child departments',
    })
  },
}).openapi('DepartmentTreeItemSchema')

export const DepartmentTreeResponseSchema = z.array(DepartmentTreeItemSchema).openapi('DepartmentTreeResponseSchema')
export type DepartmentTreeResponse = z.infer<typeof DepartmentTreeResponseSchema>

export const DepartmentDeleteResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative().openapi({ description: 'Number of departments deleted', example: 1 }),
})
export type DepartmentDeleteResponse = z.infer<typeof DepartmentDeleteResponseSchema>
