import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateDictItem,
  handleCreateDictType,
  handleDeleteDictItem,
  handleDeleteDictType,
  handleGetDictItemById,
  handleGetDictItemPage,
  handleGetDictTypeById,
  handleGetDictTypePage,
  handleGetSystemConfigs,
  handleUpdateDictItem,
  handleUpdateDictType,
  handleUpdateSystemConfigs,
} from '@server/src/modules/system/system.handler'
import {
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

export const systemApp = new OpenAPIHono()
  .openapi(getSystemConfigsRoute, handleGetSystemConfigs)
  .openapi(updateSystemConfigsRoute, handleUpdateSystemConfigs)
  .openapi(getDictTypePageRoute, handleGetDictTypePage)
  .openapi(createDictTypeRoute, handleCreateDictType)
  .openapi(getDictTypeByIdRoute, handleGetDictTypeById)
  .openapi(updateDictTypeRoute, handleUpdateDictType)
  .openapi(deleteDictTypeRoute, handleDeleteDictType)
  .openapi(getDictItemPageRoute, handleGetDictItemPage)
  .openapi(createDictItemRoute, handleCreateDictItem)
  .openapi(getDictItemByIdRoute, handleGetDictItemById)
  .openapi(updateDictItemRoute, handleUpdateDictItem)
  .openapi(deleteDictItemRoute, handleDeleteDictItem)
