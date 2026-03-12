import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateUser,
  handleDeleteUsersBatch,
  handleGetUserPage,
  handleGetUserProfile,
  handleUpdateUser,
  handleUpdateUserStatusBatch,
} from '@server/src/routes/user.handler'
import {
  createUserRoute,
  deleteUsersBatchRoute,
  getUserPageRoute,
  getUserProfileRoute,
  updateUserRoute,
  updateUserStatusBatchRoute,
} from '@server/src/routes/user.openapi'

export function userRoute(api: OpenAPIHono) {
  api.openapi(createUserRoute, handleCreateUser)
  api.openapi(getUserProfileRoute, handleGetUserProfile)
  api.openapi(getUserPageRoute, handleGetUserPage)
  api.openapi(updateUserRoute, handleUpdateUser)
  api.openapi(deleteUsersBatchRoute, handleDeleteUsersBatch)
  api.openapi(updateUserStatusBatchRoute, handleUpdateUserStatusBatch)
}
