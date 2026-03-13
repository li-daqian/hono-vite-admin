import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { userService } from '@server/src/modules/user/user.service'

export async function handleCreateUser(c: any) {
  const body = c.req.valid('json')
  const createdUser = await userService.createUser(body)
  return c.json(createdUser, 201)
}

export async function handleGetUserProfile(c: any) {
  const { userId } = getLoginUser(c)
  const userProfile = await userService.getUserProfile(userId)
  return c.json(userProfile, 200)
}

export async function handleGetUserPage(c: any) {
  const query = c.req.valid('query')
  const userPage = await userService.getUserPage(query)
  return c.json(userPage, 200)
}

export async function handleUpdateUser(c: any) {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const updatedUser = await userService.updateUser(id, body)
  return c.json(updatedUser, 200)
}

export async function handleDeleteUsersBatch(c: any) {
  const body = c.req.valid('json')
  const result = await userService.deleteUsers(body.userIds)
  return c.json(result, 200)
}

export async function handleUpdateUserStatusBatch(c: any) {
  const body = c.req.valid('json')
  const result = await userService.updateUsersStatus(body.userIds, body.status)
  return c.json(result, 200)
}

export async function handleGetUserDetail(c: any) {
  const { id } = c.req.valid('param')
  const user = await userService.getUserProfile(id)
  return c.json(user, 200)
}
