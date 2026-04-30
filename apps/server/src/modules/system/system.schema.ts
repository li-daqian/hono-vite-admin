import { z } from '@hono/zod-openapi'
import { DictStatus } from '@server/generated/prisma/enums'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@server/src/common/basic.schema'
import { APP_CONFIG_KEYS, APP_PAGE_SIZE_OPTIONS } from '@server/src/modules/app/app.config'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

function stringToArray(value: unknown) {
  if (value === '') {
    return undefined
  }

  if (typeof value === 'string') {
    return [value]
  }

  return value
}

const SYSTEM_CONFIG_KEY_VALUES = Object.values(APP_CONFIG_KEYS) as [string, ...string[]]
export const SystemConfigKeySchema = z.enum(SYSTEM_CONFIG_KEY_VALUES).openapi({
  description: 'Editable system config key',
  example: APP_CONFIG_KEYS.siteName,
})
export type SystemConfigKey = z.infer<typeof SystemConfigKeySchema>

export const SystemConfigValueTypeSchema = z.enum(['string', 'number'])
export type SystemConfigValueType = z.infer<typeof SystemConfigValueTypeSchema>

export const SystemConfigItemSchema = z.object({
  key: SystemConfigKeySchema,
  label: z.string().openapi({ description: 'Human-readable config name', example: 'Site Name' }),
  value: z.string().openapi({ description: 'Stored config value', example: 'User Admin' }),
  valueType: SystemConfigValueTypeSchema.openapi({ description: 'Input type used by the admin UI', example: 'string' }),
  description: z.string().openapi({ description: 'Short config description', example: 'Application name shown in the admin shell' }),
  options: z.array(z.string()).nullable().openapi({
    description: 'Allowed option values when the config is constrained',
    example: APP_PAGE_SIZE_OPTIONS.map(String),
  }),
}).openapi('SystemConfigItemSchema')
export type SystemConfigItem = z.infer<typeof SystemConfigItemSchema>

export const SystemConfigListResponseSchema = z.object({
  editable: z.boolean().openapi({ description: 'Whether this deployment allows config edits', example: true }),
  items: z.array(SystemConfigItemSchema),
}).openapi('SystemConfigListResponseSchema')
export type SystemConfigListResponse = z.infer<typeof SystemConfigListResponseSchema>

export const SystemConfigUpdateRequestSchema = z.object({
  configs: z.array(z.object({
    key: SystemConfigKeySchema,
    value: z.string().trim().max(100),
  })).min(1),
})
export type SystemConfigUpdateRequest = z.infer<typeof SystemConfigUpdateRequestSchema>

export const DictStatusSchema = z.enum(Object.values(DictStatus)).openapi({
  description: 'Dictionary record status',
  example: DictStatus.ACTIVE,
})
export type DictStatusValue = z.infer<typeof DictStatusSchema>

export const DictColorSchema = z.enum(['green', 'zinc', 'amber', 'blue', 'violet', 'red', 'slate']).openapi({
  description: 'Semantic badge color used by the admin UI',
  example: 'green',
})
export type DictColor = z.infer<typeof DictColorSchema>

const DictCodeSchema = z.string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/, 'Use lowercase letters, numbers, underscores, or hyphens')

export const DictTypeResponseSchema = z.object({
  id: z.string().openapi({ description: 'Dictionary type ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  code: z.string().openapi({ description: 'Unique dictionary type code', example: 'user_status' }),
  name: z.string().openapi({ description: 'Dictionary type name', example: 'User Status' }),
  order: z.number().int().openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema,
  remark: z.string().nullable().openapi({ description: 'Optional remark', example: 'Shared user account states' }),
  itemCount: z.number().int().nonnegative().openapi({ description: 'Number of items in this type', example: 2 }),
  createdAt: z.iso.datetime().openapi({ description: 'Creation timestamp', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Last update timestamp', example: '2024-01-02T12:00:00Z' }),
}).openapi('DictTypeResponseSchema')
export type DictTypeResponse = z.infer<typeof DictTypeResponseSchema>

export const DictTypeCreateRequestSchema = z.object({
  code: DictCodeSchema.openapi({ description: 'Unique dictionary type code', example: 'user_status' }),
  name: z.string().trim().min(1).max(50).openapi({ description: 'Dictionary type name', example: 'User Status' }),
  order: z.number().int().min(0).max(9999).default(0).openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema.default(DictStatus.ACTIVE),
  remark: z.string().trim().max(255).nullable().optional().openapi({ description: 'Optional remark', example: 'Shared user account states' }),
})
export type DictTypeCreateRequest = z.infer<typeof DictTypeCreateRequestSchema>

export const DictTypeUpdateRequestSchema = z.object({
  code: DictCodeSchema.optional().openapi({ description: 'Unique dictionary type code', example: 'user_status' }),
  name: z.string().trim().min(1).max(50).optional().openapi({ description: 'Dictionary type name', example: 'User Status' }),
  order: z.number().int().min(0).max(9999).optional().openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema.optional(),
  remark: z.string().trim().max(255).nullable().optional().openapi({ description: 'Optional remark', example: 'Shared user account states' }),
}).refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided for update',
})
export type DictTypeUpdateRequest = z.infer<typeof DictTypeUpdateRequestSchema>

export const DictTypePageRequestSchema = PaginationQuerySchema.extend({
  search: z.preprocess(emptyStringToUndefined, z.string().max(100).nullable().default(null)).openapi({
    description: 'Search dictionary types by code, name, or remark',
    example: 'status',
  }),
  status: z.preprocess(stringToArray, z.array(DictStatusSchema).nullable().default(null)).openapi({
    description: 'Filter dictionary types by status',
    example: [DictStatus.ACTIVE],
  }),
})
export type DictTypePageRequest = z.infer<typeof DictTypePageRequestSchema>

export const DictTypePageResponseSchema = PaginatedResponseSchema(DictTypeResponseSchema)
export type DictTypePageResponse = z.infer<typeof DictTypePageResponseSchema>

export const DictDeleteResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative().openapi({ description: 'Number of deleted records', example: 1 }),
}).openapi('DictDeleteResponseSchema')
export type DictDeleteResponse = z.infer<typeof DictDeleteResponseSchema>

export const DictItemResponseSchema = z.object({
  id: z.string().openapi({ description: 'Dictionary item ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  typeId: z.string().openapi({ description: 'Dictionary type ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  typeCode: z.string().openapi({ description: 'Dictionary type code', example: 'user_status' }),
  typeName: z.string().openapi({ description: 'Dictionary type name', example: 'User Status' }),
  value: z.string().openapi({ description: 'Machine-readable item value', example: 'ACTIVE' }),
  label: z.string().openapi({ description: 'User-facing item label', example: 'Active' }),
  color: DictColorSchema.openapi({ description: 'Semantic badge color', example: 'green' }),
  order: z.number().int().openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema,
  remark: z.string().nullable().openapi({ description: 'Optional remark', example: 'Enabled users can sign in' }),
  createdAt: z.iso.datetime().openapi({ description: 'Creation timestamp', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Last update timestamp', example: '2024-01-02T12:00:00Z' }),
}).openapi('DictItemResponseSchema')
export type DictItemResponse = z.infer<typeof DictItemResponseSchema>

const DictItemValueSchema = z.string().trim().min(1).max(64)

export const DictItemCreateRequestSchema = z.object({
  typeId: z.string().min(1).openapi({ description: 'Dictionary type ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  value: DictItemValueSchema.openapi({ description: 'Machine-readable item value', example: 'ACTIVE' }),
  label: z.string().trim().min(1).max(50).openapi({ description: 'User-facing item label', example: 'Active' }),
  color: DictColorSchema.optional().openapi({ description: 'Semantic badge color', example: 'green' }),
  order: z.number().int().min(0).max(9999).default(0).openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema.default(DictStatus.ACTIVE),
  remark: z.string().trim().max(255).nullable().optional().openapi({ description: 'Optional remark', example: 'Enabled users can sign in' }),
})
export type DictItemCreateRequest = z.infer<typeof DictItemCreateRequestSchema>

export const DictItemUpdateRequestSchema = z.object({
  typeId: z.string().min(1).optional().openapi({ description: 'Dictionary type ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  value: DictItemValueSchema.optional().openapi({ description: 'Machine-readable item value', example: 'ACTIVE' }),
  label: z.string().trim().min(1).max(50).optional().openapi({ description: 'User-facing item label', example: 'Active' }),
  color: DictColorSchema.optional().openapi({ description: 'Semantic badge color', example: 'green' }),
  order: z.number().int().min(0).max(9999).optional().openapi({ description: 'Display order', example: 10 }),
  status: DictStatusSchema.optional(),
  remark: z.string().trim().max(255).nullable().optional().openapi({ description: 'Optional remark', example: 'Enabled users can sign in' }),
}).refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided for update',
})
export type DictItemUpdateRequest = z.infer<typeof DictItemUpdateRequestSchema>

export const DictItemPageRequestSchema = PaginationQuerySchema.extend({
  typeId: z.preprocess(emptyStringToUndefined, z.string().nullable().default(null)).openapi({
    description: 'Filter items by dictionary type ID',
    example: '01HZY4QG2R1X0ABCDEF1234567',
  }),
  typeCode: z.preprocess(emptyStringToUndefined, z.string().nullable().default(null)).openapi({
    description: 'Filter items by dictionary type code',
    example: 'user_status',
  }),
  search: z.preprocess(emptyStringToUndefined, z.string().max(100).nullable().default(null)).openapi({
    description: 'Search dictionary items by value, label, or remark',
    example: 'active',
  }),
  status: z.preprocess(stringToArray, z.array(DictStatusSchema).nullable().default(null)).openapi({
    description: 'Filter dictionary items by status',
    example: [DictStatus.ACTIVE],
  }),
})
export type DictItemPageRequest = z.infer<typeof DictItemPageRequestSchema>

export const DictItemPageResponseSchema = PaginatedResponseSchema(DictItemResponseSchema)
export type DictItemPageResponse = z.infer<typeof DictItemPageResponseSchema>
