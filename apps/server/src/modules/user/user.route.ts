import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateUser,
  handleDeleteUsersBatch,
  handleGetUserDetail,
  handleGetUserPage,
  handleGetUserProfile,
  handleUpdateUser,
  handleUpdateUserRoles,
  handleUpdateUserStatusBatch,
} from '@server/src/modules/user/user.handler'
import {
  createUserRoute,
  deleteUsersBatchRoute,
  getUserDetailRoute,
  getUserPageRoute,
  getUserProfileRoute,
  updateUserRolesRoute,
  updateUserRoute,
  updateUserStatusBatchRoute,
} from '@server/src/modules/user/user.openapi'

export const userApp = new OpenAPIHono()
  .openapi(getUserProfileRoute, handleGetUserProfile)
  .openapi(getUserPageRoute, handleGetUserPage)
  .openapi(createUserRoute, handleCreateUser)
  .openapi(getUserDetailRoute, handleGetUserDetail)
  .openapi(updateUserRoute, handleUpdateUser)
  .openapi(updateUserRolesRoute, handleUpdateUserRoles)
  .openapi(deleteUsersBatchRoute, handleDeleteUsersBatch)
  .openapi(updateUserStatusBatchRoute, handleUpdateUserStatusBatch)
