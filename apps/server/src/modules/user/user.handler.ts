import type { RouteHandler } from '@hono/zod-openapi'
import type { createUserRoute, deleteUsersBatchRoute, getUserDetailRoute, getUserPageRoute, getUserProfileRoute, updateUserRoute, updateUserStatusBatchRoute } from '@server/src/modules/user/user.openapi'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { userService } from '@server/src/modules/user/user.service'

export const handleCreateUser: RouteHandler<typeof createUserRoute> = async (c) => {
  const body = c.req.valid('json')
  const createdUser = await userService.createUser(body)
  return c.json(createdUser, 201)
}

export const handleGetUserProfile: RouteHandler<typeof getUserProfileRoute> = async (c) => {
  const { userId } = getLoginUser(c)
  const userProfile = await userService.getUserProfile(userId)
  return c.json(userProfile, 200)
}

export const handleGetUserPage: RouteHandler<typeof getUserPageRoute> = async (c) => {
  const query = c.req.valid('query')
  const userPage = await userService.getUserPage(query)
  return c.json(userPage, 200)
}

export const handleUpdateUser: RouteHandler<typeof updateUserRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const updatedUser = await userService.updateUser(id, body)
  return c.json(updatedUser, 200)
}

export const handleDeleteUsersBatch: RouteHandler<typeof deleteUsersBatchRoute> = async (c) => {
  const body = c.req.valid('json')
  const result = await userService.deleteUsers(body.userIds)
  return c.json(result, 200)
}

export const handleUpdateUserStatusBatch: RouteHandler<typeof updateUserStatusBatchRoute> = async (c) => {
  const body = c.req.valid('json')
  const result = await userService.updateUsersStatus(body.userIds, body.status)
  return c.json(result, 200)
}

export const handleGetUserDetail: RouteHandler<typeof getUserDetailRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const user = await userService.getUserProfile(id)
  return c.json(user, 200)
}
