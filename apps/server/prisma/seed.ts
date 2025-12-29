import { UserStatus } from '@server/generated/prisma/enums'
import { getEnv } from '@server/src/lib/env'
import { prisma } from '@server/src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminRole = await upsertAdminRole()

  await upsertAdminUser(adminRole.id)
}

async function upsertAdminRole() {
  const adminRoleName = getEnv().admin.roleName
  return await prisma.role.upsert({
    where: { name: adminRoleName },
    update: {},
    create: {
      name: adminRoleName,
      description: 'Administrator role with full permissions',
    },
  })
}

async function upsertAdminUser(adminRoleId: string) {
  const adminUsername = getEnv().admin.username
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(getEnv().admin.password, salt)

  return await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      salt,
      displayName: 'Administrator',
      roles: {
        create: { roleId: adminRoleId },
      },
      status: UserStatus.ACTIVE,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
