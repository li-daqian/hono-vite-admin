import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateUser,
  handleDeleteUsersBatch,
  handleGetUserPage,
  handleGetUserProfile,
  handleUpdateUser,
  handleUpdateUserStatusBatch,
} from '@server/src/modules/user/user.handler'
import {
  createUserRoute,
  deleteUsersBatchRoute,
  getUserPageRoute,
  getUserProfileRoute,
  updateUserRoute,
  updateUserStatusBatchRoute,
} from '@server/src/modules/user/user.openapi'

export const userApp = new OpenAPIHono()
  .openapi(getUserProfileRoute, handleGetUserProfile)
  .openapi(getUserPageRoute, handleGetUserPage)
  .openapi(createUserRoute, handleCreateUser)
  .openapi(updateUserRoute, handleUpdateUser)
  .openapi(deleteUsersBatchRoute, handleDeleteUsersBatch)
  .openapi(updateUserStatusBatchRoute, handleUpdateUserStatusBatch)
