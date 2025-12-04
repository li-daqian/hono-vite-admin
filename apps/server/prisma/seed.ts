import { UserStatus } from '@server/generated/prisma/enums'
import { prisma } from '@server/src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminRole = await upsertAdminRole()

  await upsertAdminUser(adminRole.id)
}

async function upsertAdminRole() {
  return await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator role with full permissions',
    },
  })
}

async function upsertAdminUser(adminRoleId: string) {
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash('admin@123!', salt)

  return await prisma.user.upsert({
    where: { username: 'Admin' },
    update: {},
    create: {
      username: 'Admin',
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
