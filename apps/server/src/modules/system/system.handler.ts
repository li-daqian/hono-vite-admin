import type { RouteHandler } from '@hono/zod-openapi'
import type {
  createDictItemRoute,
  createDictTypeRoute,
  deleteDictItemRoute,
  deleteDictTypeRoute,
  getDictItemByIdRoute,
  getDictItemPageRoute,
  getDictTypeByIdRoute,
  getDictTypePageRoute,
  getSystemConfigsRoute,
  updateDictItemRoute,
  updateDictTypeRoute,
  updateSystemConfigsRoute,
} from '@server/src/modules/system/system.openapi'
import type {
  DictItemCreateRequest,
  DictItemPageRequest,
  DictItemUpdateRequest,
  DictTypeCreateRequest,
  DictTypePageRequest,
  DictTypeUpdateRequest,
  SystemConfigUpdateRequest,
} from '@server/src/modules/system/system.schema'
import { systemService } from '@server/src/modules/system/system.service'

export const handleGetSystemConfigs: RouteHandler<typeof getSystemConfigsRoute> = async (c) => {
  return c.json(await systemService.getConfigs(), 200)
}

export const handleUpdateSystemConfigs: RouteHandler<typeof updateSystemConfigsRoute> = async (c) => {
  const body = c.req.valid('json' as never) as SystemConfigUpdateRequest
  return c.json(await systemService.updateConfigs(body), 200)
}

export const handleGetDictTypePage: RouteHandler<typeof getDictTypePageRoute> = async (c) => {
  const query = c.req.valid('query' as never) as DictTypePageRequest
  return c.json(await systemService.getDictTypePage(query), 200)
}

export const handleGetDictTypeById: RouteHandler<typeof getDictTypeByIdRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  return c.json(await systemService.getDictTypeById(id), 200)
}

export const handleCreateDictType: RouteHandler<typeof createDictTypeRoute> = async (c) => {
  const body = c.req.valid('json' as never) as DictTypeCreateRequest
  return c.json(await systemService.createDictType(body), 201)
}

export const handleUpdateDictType: RouteHandler<typeof updateDictTypeRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  const body = c.req.valid('json' as never) as DictTypeUpdateRequest
  return c.json(await systemService.updateDictType(id, body), 200)
}

export const handleDeleteDictType: RouteHandler<typeof deleteDictTypeRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  return c.json(await systemService.deleteDictType(id), 200)
}

export const handleGetDictItemPage: RouteHandler<typeof getDictItemPageRoute> = async (c) => {
  const query = c.req.valid('query' as never) as DictItemPageRequest
  return c.json(await systemService.getDictItemPage(query), 200)
}

export const handleGetDictItemById: RouteHandler<typeof getDictItemByIdRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  return c.json(await systemService.getDictItemById(id), 200)
}

export const handleCreateDictItem: RouteHandler<typeof createDictItemRoute> = async (c) => {
  const body = c.req.valid('json' as never) as DictItemCreateRequest
  return c.json(await systemService.createDictItem(body), 201)
}

export const handleUpdateDictItem: RouteHandler<typeof updateDictItemRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  const body = c.req.valid('json' as never) as DictItemUpdateRequest
  return c.json(await systemService.updateDictItem(id, body), 200)
}

export const handleDeleteDictItem: RouteHandler<typeof deleteDictItemRoute> = async (c) => {
  const { id } = c.req.valid('param' as never) as { id: string }
  return c.json(await systemService.deleteDictItem(id), 200)
}
