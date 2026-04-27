import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateUser,
  handleDeleteUsersBatch,
  handleGetUserDetail,
  handleGetUserPage,
  handleGetUserProfile,
  handleUnlockUser,
  handleUpdateUser,
  handleUpdateUserPassword,
  handleUpdateUserStatusBatch,
} from '@server/src/modules/user/user.handler'
import {
  createUserRoute,
  deleteUsersBatchRoute,
  getUserDetailRoute,
  getUserPageRoute,
  getUserProfileRoute,
  unlockUserRoute,
  updateUserPasswordRoute,
  updateUserRoute,
  updateUserStatusBatchRoute,
} from '@server/src/modules/user/user.openapi'

export const userApp = new OpenAPIHono()
  .openapi(getUserProfileRoute, handleGetUserProfile)
  .openapi(getUserPageRoute, handleGetUserPage)
  .openapi(createUserRoute, handleCreateUser)
  .openapi(getUserDetailRoute, handleGetUserDetail)
  .openapi(updateUserRoute, handleUpdateUser)
  .openapi(updateUserPasswordRoute, handleUpdateUserPassword)
  .openapi(unlockUserRoute, handleUnlockUser)
  .openapi(deleteUsersBatchRoute, handleDeleteUsersBatch)
  .openapi(updateUserStatusBatchRoute, handleUpdateUserStatusBatch)
