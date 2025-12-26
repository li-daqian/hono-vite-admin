import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@server/generated/prisma/client'
import { getEnv } from '@server/src/lib/env'

const connectionString = getEnv().database.url

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }
