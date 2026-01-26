import type { Permission, PrismaClient, User } from '@server/generated/prisma/client'
import type { TransactionClient } from '@server/generated/prisma/internal/prismaNamespace'
import { PermissionType, UserStatus } from '@server/generated/prisma/enums'
import { getEnv } from '@server/src/lib/env'
import { prisma } from '@server/src/lib/prisma'
import bcrypt from 'bcryptjs'

const menus = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    order: 1,
  },
  {
    code: 'system',
    name: 'System Management',
    order: 2,
    children: [
      {
        code: 'user',
        name: 'User Management',
        path: '/system/users',
        order: 1,
        actions: [
          { code: 'create', name: 'Create', description: 'Create user' },
          { code: 'edit', name: 'Edit', description: 'Edit user' },
          { code: 'delete', name: 'Delete', description: 'Delete user' },
        ],
      },
      {
        code: 'role',
        name: 'Role Management',
        path: '/system/roles',
        order: 2,
        actions: [
          { code: 'create', name: 'Create', description: 'Create role' },
          { code: 'edit', name: 'Edit', description: 'Edit role' },
          { code: 'delete', name: 'Delete', description: 'Delete role' },
        ],
      },
    ],
  },
]

async function bootstrapSystem() {
  const adminUser = await ensureAdminUser()
  await setupAdminAuthorization(adminUser)
}

async function setupAdminAuthorization(adminUser: User) {
  await prisma.$transaction(async (tx) => {
    await tx.menu.deleteMany()

    await seedMenus(tx, menus)

    const permissions = await generatePermissions(tx)
    await assignAllPermissionsToAdmin(tx, adminUser, permissions)
  })
}

async function assignAllPermissionsToAdmin(
  client: PrismaClient | TransactionClient,
  adminUser: User,
  permissions: Permission[],
) {
  const adminRoleName = getEnv().admin.roleName

  const adminRole = await client.role.upsert({
    where: { name: adminRoleName },
    update: {},
    create: {
      name: adminRoleName,
      description: 'Administrator role with full permissions',
    },
  })

  await client.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  await client.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
  await client.rolePermission.createMany({
    data: permissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    })),
  })
}

async function generatePermissions(
  client: PrismaClient | TransactionClient,
): Promise<Permission[]> {
  await client.permission.deleteMany({
    where: { type: { in: [PermissionType.MENU, PermissionType.ACTION] } },
  })

  const permissions = [
    ...(await client.menu.findMany()).map(menu => ({
      id: `${PermissionType.MENU}.${menu.id}`,
      type: PermissionType.MENU,
      targetId: menu.id,
    })),
    ...(await client.action.findMany()).map(action => ({
      id: `${PermissionType.ACTION}.${action.id}`,
      type: PermissionType.ACTION,
      targetId: action.id,
    })),
  ]

  await client.permission.createMany({ data: permissions })
  return permissions
}

async function seedMenus(
  client: PrismaClient | TransactionClient,
  menus: any[],
  parentCode?: string,
) {
  for (const menu of menus) {
    const menuId = parentCode ? `${parentCode}.${menu.code}` : menu.code

    await client.menu.create({
      data: {
        id: menuId,
        parentId: parentCode ?? null,
        name: menu.name,
        path: menu.path,
        order: menu.order,
      },
    })

    if (menu.actions?.length) {
      await client.action.createMany({
        data: menu.actions.map((action: any) => ({
          id: `${menuId}.${action.code}`,
          menuId,
          name: action.name,
          description: action.description,
        })),
      })
    }

    if (menu.children?.length) {
      await seedMenus(client, menu.children, menuId)
    }
  }
}

async function ensureAdminUser(): Promise<User> {
  const adminUsername = getEnv().admin.username
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(getEnv().admin.password, salt)

  return prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      salt,
      displayName: 'Administrator',
      email: getEnv().admin.email,
      status: UserStatus.ACTIVE,
    },
  })
}

bootstrapSystem()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
