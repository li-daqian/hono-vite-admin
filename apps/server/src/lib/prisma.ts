import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@server/generated/prisma/client'
import { envConfig } from '@server/src/common/config'

const connectionString = envConfig.database.url

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }
