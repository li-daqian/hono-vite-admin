import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { requireActionPermission } from '@server/src/middleware/permission.middleware'
import {
  DictDeleteResponseSchema,
  DictItemCreateRequestSchema,
  DictItemPageRequestSchema,
  DictItemPageResponseSchema,
  DictItemResponseSchema,
  DictItemUpdateRequestSchema,
  DictTypeCreateRequestSchema,
  DictTypePageRequestSchema,
  DictTypePageResponseSchema,
  DictTypeResponseSchema,
  DictTypeUpdateRequestSchema,
  SystemConfigListResponseSchema,
  SystemConfigUpdateRequestSchema,
} from '@server/src/modules/system/system.schema'

const SYSTEM_ACTIONS = {
  UPDATE_CONFIGS: 'system.configs.edit',
  CREATE_DICTIONARY: 'system.dictionaries.create',
  EDIT_DICTIONARY: 'system.dictionaries.edit',
  DELETE_DICTIONARY: 'system.dictionaries.delete',
} as const

const IdParamSchema = z.object({
  id: z.string().openapi({ description: 'Record ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
})

export const getSystemConfigsRoute = createRoute({
  path: '/configs',
  method: 'get',
  description: 'Get editable system config values',
  responses: {
    200: { description: 'System configs retrieved successfully', content: { 'application/json': { schema: SystemConfigListResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['System'],
})

export const updateSystemConfigsRoute = createRoute({
  path: '/configs',
  method: 'put',
  description: 'Update editable system config values',
  request: { body: { required: true, content: { 'application/json': { schema: SystemConfigUpdateRequestSchema } } } },
  responses: {
    200: { description: 'System configs updated successfully', content: { 'application/json': { schema: SystemConfigListResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.UPDATE_CONFIGS)],
  tags: ['System'],
})

export const getDictTypePageRoute = createRoute({
  path: '/dict/types/page',
  method: 'get',
  description: 'Get paginated dictionary types',
  request: { query: DictTypePageRequestSchema },
  responses: {
    200: { description: 'Dictionary types retrieved successfully', content: { 'application/json': { schema: DictTypePageResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['System Dictionary'],
})

export const createDictTypeRoute = createRoute({
  path: '/dict/types',
  method: 'post',
  description: 'Create a dictionary type',
  request: { body: { required: true, content: { 'application/json': { schema: DictTypeCreateRequestSchema } } } },
  responses: {
    201: { description: 'Dictionary type created successfully', content: { 'application/json': { schema: DictTypeResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.CREATE_DICTIONARY)],
  tags: ['System Dictionary'],
})

export const getDictTypeByIdRoute = createRoute({
  path: '/dict/types/{id}',
  method: 'get',
  description: 'Get dictionary type detail by ID',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Dictionary type retrieved successfully', content: { 'application/json': { schema: DictTypeResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['System Dictionary'],
})

export const updateDictTypeRoute = createRoute({
  path: '/dict/types/{id}',
  method: 'put',
  description: 'Update a dictionary type',
  request: {
    params: IdParamSchema,
    body: { required: true, content: { 'application/json': { schema: DictTypeUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'Dictionary type updated successfully', content: { 'application/json': { schema: DictTypeResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.EDIT_DICTIONARY)],
  tags: ['System Dictionary'],
})

export const deleteDictTypeRoute = createRoute({
  path: '/dict/types/{id}',
  method: 'delete',
  description: 'Delete a dictionary type and its items',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Dictionary type deleted successfully', content: { 'application/json': { schema: DictDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.DELETE_DICTIONARY)],
  tags: ['System Dictionary'],
})

export const getDictItemPageRoute = createRoute({
  path: '/dict/items/page',
  method: 'get',
  description: 'Get paginated dictionary items',
  request: { query: DictItemPageRequestSchema },
  responses: {
    200: { description: 'Dictionary items retrieved successfully', content: { 'application/json': { schema: DictItemPageResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['System Dictionary'],
})

export const createDictItemRoute = createRoute({
  path: '/dict/items',
  method: 'post',
  description: 'Create a dictionary item',
  request: { body: { required: true, content: { 'application/json': { schema: DictItemCreateRequestSchema } } } },
  responses: {
    201: { description: 'Dictionary item created successfully', content: { 'application/json': { schema: DictItemResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.CREATE_DICTIONARY)],
  tags: ['System Dictionary'],
})

export const getDictItemByIdRoute = createRoute({
  path: '/dict/items/{id}',
  method: 'get',
  description: 'Get dictionary item detail by ID',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Dictionary item retrieved successfully', content: { 'application/json': { schema: DictItemResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['System Dictionary'],
})

export const updateDictItemRoute = createRoute({
  path: '/dict/items/{id}',
  method: 'put',
  description: 'Update a dictionary item',
  request: {
    params: IdParamSchema,
    body: { required: true, content: { 'application/json': { schema: DictItemUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'Dictionary item updated successfully', content: { 'application/json': { schema: DictItemResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.EDIT_DICTIONARY)],
  tags: ['System Dictionary'],
})

export const deleteDictItemRoute = createRoute({
  path: '/dict/items/{id}',
  method: 'delete',
  description: 'Delete a dictionary item',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Dictionary item deleted successfully', content: { 'application/json': { schema: DictDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(SYSTEM_ACTIONS.DELETE_DICTIONARY)],
  tags: ['System Dictionary'],
})
