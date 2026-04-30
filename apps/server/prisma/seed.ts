import type { Permission, PrismaClient, User } from '@server/generated/prisma/client'
import type { TransactionClient } from '@server/generated/prisma/internal/prismaNamespace'
import { randomUUID } from 'node:crypto'
import { DepartmentStatus, DictStatus, PermissionType, UserStatus } from '@server/generated/prisma/enums'
import { getEnv } from '@server/src/lib/env'
import { createPasswordHash } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'

const menus = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    order: 1,
  },
  {
    code: 'access',
    name: 'Access',
    order: 2,
    children: [
      {
        code: 'users',
        name: 'Users',
        path: '/access/users',
        order: 1,
        actions: [
          { code: 'create', name: 'Create', description: 'Create user' },
          { code: 'edit', name: 'Edit', description: 'Edit user' },
          { code: 'password', name: 'Change Password', description: 'Change user password' },
          { code: 'unlock', name: 'Unlock', description: 'Unlock user account' },
          { code: 'delete', name: 'Delete', description: 'Delete user' },
        ],
      },
      {
        code: 'departments',
        name: 'Departments',
        path: '/access/departments',
        order: 2,
        actions: [
          { code: 'create', name: 'Create', description: 'Create department' },
          { code: 'edit', name: 'Edit', description: 'Edit department' },
          { code: 'delete', name: 'Delete', description: 'Delete department' },
        ],
      },
      {
        code: 'roles',
        name: 'Roles',
        path: '/access/roles',
        order: 3,
        actions: [
          { code: 'create', name: 'Create', description: 'Create role' },
          { code: 'edit', name: 'Edit', description: 'Edit role' },
          { code: 'permissions', name: 'Manage Permissions', description: 'Manage role permissions' },
          { code: 'delete', name: 'Delete', description: 'Delete role' },
        ],
      },
    ],
  },
  {
    code: 'system',
    name: 'System',
    order: 3,
    children: [
      {
        code: 'security-policy',
        name: 'Security Policy',
        path: '/system/security-policy',
        order: 1,
        actions: [
          { code: 'edit', name: 'Edit', description: 'Edit user security policy' },
        ],
      },
      {
        code: 'configs',
        name: 'System Config',
        path: '/system/configs',
        order: 2,
        actions: [
          { code: 'edit', name: 'Edit', description: 'Edit system configuration' },
        ],
      },
      {
        code: 'dictionaries',
        name: 'Dictionaries',
        path: '/system/dictionaries',
        order: 3,
        actions: [
          { code: 'create', name: 'Create', description: 'Create dictionary types and items' },
          { code: 'edit', name: 'Edit', description: 'Edit dictionary types and items' },
          { code: 'delete', name: 'Delete', description: 'Delete dictionary types and items' },
        ],
      },
    ],
  },
  {
    code: 'audit',
    name: 'Audit',
    order: 4,
    children: [
      {
        code: 'login',
        name: 'Login Logs',
        path: '/audit/login',
        order: 1,
      },
      {
        code: 'operation',
        name: 'Operation Logs',
        path: '/audit/operation',
        order: 2,
      },
    ],
  },
]

const demoDepartments = [
  {
    id: 'dept.company',
    parentId: null,
    name: 'Acme Operations',
    leader: 'Lydia Chen',
    phone: '+12025550100',
    email: 'operations@example.com',
    order: 1,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.product',
    parentId: 'dept.company',
    name: 'Product',
    leader: 'Maya Patel',
    phone: '+12025550110',
    email: 'product@example.com',
    order: 1,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.engineering',
    parentId: 'dept.product',
    name: 'Engineering',
    leader: 'Alex Chen',
    phone: '+12025550120',
    email: 'engineering@example.com',
    order: 1,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.design',
    parentId: 'dept.product',
    name: 'Design',
    leader: 'Nina Ross',
    phone: '+12025550130',
    email: 'design@example.com',
    order: 2,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.sales',
    parentId: 'dept.company',
    name: 'Sales',
    leader: 'Owen Brooks',
    phone: '+12025550140',
    email: 'sales@example.com',
    order: 2,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.customer-success',
    parentId: 'dept.sales',
    name: 'Customer Success',
    leader: 'Zoe Kim',
    phone: '+12025550150',
    email: 'success@example.com',
    order: 1,
    status: DepartmentStatus.ACTIVE,
  },
  {
    id: 'dept.finance',
    parentId: 'dept.company',
    name: 'Finance',
    leader: 'Victor Lee',
    phone: '+12025550160',
    email: 'finance@example.com',
    order: 3,
    status: DepartmentStatus.DISABLED,
  },
]

const demoUsers = [
  {
    id: 'user.demo.maya',
    username: 'demo.maya',
    email: 'maya.patel@example.com',
    phone: '+12025550210',
    displayName: 'Maya Patel',
    status: UserStatus.ACTIVE,
    departmentIds: ['dept.product'],
  },
  {
    id: 'user.demo.alex',
    username: 'demo.alex',
    email: 'alex.chen@example.com',
    phone: '+12025550220',
    displayName: 'Alex Chen',
    status: UserStatus.ACTIVE,
    departmentIds: ['dept.product', 'dept.engineering'],
  },
  {
    id: 'user.demo.nina',
    username: 'demo.nina',
    email: 'nina.ross@example.com',
    phone: '+12025550230',
    displayName: 'Nina Ross',
    status: UserStatus.ACTIVE,
    departmentIds: ['dept.design'],
  },
  {
    id: 'user.demo.owen',
    username: 'demo.owen',
    email: 'owen.brooks@example.com',
    phone: '+12025550240',
    displayName: 'Owen Brooks',
    status: UserStatus.ACTIVE,
    departmentIds: ['dept.sales'],
  },
  {
    id: 'user.demo.zoe',
    username: 'demo.zoe',
    email: 'zoe.kim@example.com',
    phone: '+12025550250',
    displayName: 'Zoe Kim',
    status: UserStatus.DISABLED,
    departmentIds: ['dept.customer-success'],
  },
]

const demoDictionaries = [
  {
    id: 'dict.type.user_status',
    code: 'user_status',
    name: 'User Status',
    order: 1,
    remark: 'User account status labels',
    items: [
      {
        id: 'dict.item.user_status.active',
        value: 'ACTIVE',
        label: 'Active',
        color: 'green',
        order: 1,
        remark: 'Users that can sign in',
      },
      {
        id: 'dict.item.user_status.disabled',
        value: 'DISABLED',
        label: 'Disabled',
        color: 'zinc',
        order: 2,
        remark: 'Users blocked from signing in',
      },
    ],
  },
  {
    id: 'dict.type.audit_module',
    code: 'audit_module',
    name: 'Audit Module',
    order: 2,
    remark: 'Audit log module labels',
    items: [
      { id: 'dict.item.audit_module.auth', value: 'auth', label: 'Authentication', color: 'blue', order: 1, remark: null },
      { id: 'dict.item.audit_module.user', value: 'user', label: 'Users', color: 'green', order: 2, remark: null },
      { id: 'dict.item.audit_module.role', value: 'role', label: 'Roles', color: 'violet', order: 3, remark: null },
      { id: 'dict.item.audit_module.department', value: 'department', label: 'Departments', color: 'amber', order: 4, remark: null },
      { id: 'dict.item.audit_module.system_config', value: 'system-config', label: 'System Config', color: 'red', order: 5, remark: null },
      { id: 'dict.item.audit_module.dictionary', value: 'dictionary', label: 'Dictionaries', color: 'slate', order: 6, remark: null },
    ],
  },
  {
    id: 'dict.type.audit_category',
    code: 'audit_category',
    name: 'Audit Category',
    order: 3,
    remark: 'Audit log category labels',
    items: [
      { id: 'dict.item.audit_category.login', value: 'login', label: 'Login', color: 'blue', order: 1, remark: null },
      { id: 'dict.item.audit_category.operation', value: 'operation', label: 'Operation', color: 'slate', order: 2, remark: null },
    ],
  },
]

async function bootstrapSystem() {
  const adminUser = await ensureAdminUser()
  await setupAdminAuthorization(adminUser)
  await seedDemoOrganization(adminUser)
  await seedSystemDictionaries()
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
  const { hashedPassword, salt } = await createPasswordHash(getEnv().admin.password)

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

async function seedDemoOrganization(adminUser: User) {
  const { hashedPassword, salt } = await createPasswordHash(randomUUID())

  await prisma.$transaction(async (tx) => {
    for (const department of demoDepartments) {
      await tx.department.upsert({
        where: { id: department.id },
        update: {
          parentId: department.parentId,
          name: department.name,
          leader: department.leader,
          phone: department.phone,
          email: department.email,
          order: department.order,
          status: department.status,
        },
        create: department,
      })
    }

    const users = await Promise.all(demoUsers.map(user => tx.user.upsert({
      where: { username: user.username },
      update: {
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        status: user.status,
      },
      create: {
        id: user.id,
        username: user.username,
        password: hashedPassword,
        salt,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        status: user.status,
      },
    })))

    const userIdsByUsername = new Map(users.map(user => [user.username, user.id]))
    const assignments = [
      { userId: adminUser.id, departmentId: 'dept.company' },
      { userId: adminUser.id, departmentId: 'dept.engineering' },
      ...demoUsers.flatMap(user =>
        user.departmentIds.map(departmentId => ({
          userId: userIdsByUsername.get(user.username)!,
          departmentId,
        })),
      ),
    ]

    await tx.userDepartment.createMany({
      data: assignments,
      skipDuplicates: true,
    })
  })
}

async function seedSystemDictionaries() {
  await prisma.$transaction(async (tx) => {
    for (const dictionary of demoDictionaries) {
      const type = await tx.dictType.upsert({
        where: { code: dictionary.code },
        update: {},
        create: {
          id: dictionary.id,
          code: dictionary.code,
          name: dictionary.name,
          order: dictionary.order,
          status: DictStatus.ACTIVE,
          remark: dictionary.remark,
        },
      })

      for (const item of dictionary.items) {
        await tx.dictItem.upsert({
          where: {
            typeId_value: {
              typeId: type.id,
              value: item.value,
            },
          },
          update: {},
          create: {
            id: item.id,
            typeId: type.id,
            value: item.value,
            label: item.label,
            color: item.color,
            order: item.order,
            status: DictStatus.ACTIVE,
            remark: item.remark,
          },
        })
      }
    }
  })
}

bootstrapSystem()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
