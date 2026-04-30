import { randomUUID } from 'node:crypto'
import { DictStatus } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { APP_CONFIG_KEYS } from '@server/src/modules/app/app.config'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { systemService } from './system.service'

const APP_CONFIG_KEY_VALUES = Object.values(APP_CONFIG_KEYS)

function createContext(userId: string, requestId: string) {
  return {
    req: {
      method: 'PUT',
      path: '/api/v1/system/configs',
      header(name: string) {
        const headers: Record<string, string | undefined> = {
          'cf-connecting-ip': undefined,
          'x-forwarded-for': '203.0.113.10',
          'x-real-ip': undefined,
          'forwarded': undefined,
          'user-agent': 'bun:test',
        }

        return headers[name.toLowerCase()]
      },
    },
    get(key: string) {
      if (key === 'authPayload') {
        return { userId }
      }

      if (key === 'requestId') {
        return requestId
      }

      return undefined
    },
  } as any
}

describe('system service', () => {
  let originalReadOnlyMode: string | undefined
  let userId: string
  let requestIds: string[] = []
  let codePrefix: string

  beforeEach(async () => {
    originalReadOnlyMode = process.env.READ_ONLY_MODE
    process.env.READ_ONLY_MODE = 'false'
    codePrefix = `test_${randomUUID().replace(/-/g, '_')}`
    requestIds = []

    const { hashedPassword, salt } = await createPasswordHash('Password123!')
    const user = await prisma.user.create({
      data: {
        username: `system-operator-${randomUUID()}`,
        password: hashedPassword,
        salt,
        displayName: 'System Operator',
      },
    })
    userId = user.id

    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: APP_CONFIG_KEY_VALUES,
        },
      },
    })
  })

  afterEach(async () => {
    const testTypes = await prisma.dictType.findMany({
      where: {
        code: {
          startsWith: codePrefix,
        },
      },
      select: { id: true },
    })
    const typeIds = testTypes.map(type => type.id)

    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { requestId: { in: requestIds } },
          { operatorId: userId },
        ],
      },
    })
    if (typeIds.length > 0) {
      await prisma.dictItem.deleteMany({
        where: {
          typeId: {
            in: typeIds,
          },
        },
      })
      await prisma.dictType.deleteMany({
        where: {
          id: {
            in: typeIds,
          },
        },
      })
    }
    await prisma.user.deleteMany({
      where: { id: userId },
    })
    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: APP_CONFIG_KEY_VALUES,
        },
      },
    })

    if (originalReadOnlyMode === undefined) {
      delete process.env.READ_ONLY_MODE
    }
    else {
      process.env.READ_ONLY_MODE = originalReadOnlyMode
    }
  })

  function nextRequestId() {
    const requestId = `req-${randomUUID()}`
    requestIds.push(requestId)
    return requestId
  }

  it('updates whitelisted system configs and records an audit log', async () => {
    const requestId = nextRequestId()

    await holdContext(createContext(userId, requestId), async () => {
      const result = await systemService.updateConfigs({
        configs: [
          { key: APP_CONFIG_KEYS.siteName, value: 'Demo Console' },
          { key: APP_CONFIG_KEYS.defaultPageSize, value: '20' },
        ],
      })

      expect(result.items.find(item => item.key === APP_CONFIG_KEYS.siteName)?.value).toBe('Demo Console')
      expect(result.items.find(item => item.key === APP_CONFIG_KEYS.defaultPageSize)?.value).toBe('20')
    })

    const publicConfigValues = await prisma.sysConfig.findMany({
      where: {
        key: {
          in: [APP_CONFIG_KEYS.siteName, APP_CONFIG_KEYS.defaultPageSize],
        },
      },
      orderBy: { key: 'asc' },
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        module: 'system-config',
        action: 'update',
      },
    })

    expect(publicConfigValues.map(config => [config.key, config.value])).toEqual([
      [APP_CONFIG_KEYS.defaultPageSize, '20'],
      [APP_CONFIG_KEYS.siteName, 'Demo Console'],
    ])
    expect(auditLog?.requestSnapshot).toMatchObject({
      next: [
        { key: APP_CONFIG_KEYS.siteName, value: 'Demo Console' },
        { key: APP_CONFIG_KEYS.defaultPageSize, value: '20' },
      ],
    })
  })

  it('rejects invalid system config values', async () => {
    let error: unknown

    await holdContext(createContext(userId, nextRequestId()), async () => {
      try {
        await systemService.updateConfigs({
          configs: [
            { key: APP_CONFIG_KEYS.defaultPageSize, value: '15' },
          ],
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('InvalidSystemConfigValue')
  })

  it('creates, updates, lists, and deletes dictionary records', async () => {
    const typeCode = `${codePrefix}_status`
    const requestId = nextRequestId()
    let typeId = ''
    let itemId = ''

    await holdContext(createContext(userId, requestId), async () => {
      const type = await systemService.createDictType({
        code: typeCode,
        name: 'Test Status',
        order: 10,
        status: DictStatus.ACTIVE,
        remark: 'Test dictionary type',
      })
      typeId = type.id

      const item = await systemService.createDictItem({
        typeId,
        value: 'OPEN',
        label: 'Open',
        color: 'green',
        order: 1,
        status: DictStatus.ACTIVE,
        remark: 'Open state',
      })
      itemId = item.id

      const updatedItem = await systemService.updateDictItem(itemId, {
        label: 'Opened',
        color: 'blue',
      })

      expect(updatedItem.label).toBe('Opened')
      expect(updatedItem.color).toBe('blue')
    })

    const page = await systemService.getDictItemPage({
      page: 1,
      pageSize: 10,
      sort: null,
      typeCode,
      typeId: null,
      search: null,
      status: [DictStatus.ACTIVE],
    })
    const auditLogCount = await prisma.auditLog.count({
      where: {
        requestId,
        module: 'dictionary',
      },
    })

    expect(page.items.map(item => item.value)).toEqual(['OPEN'])
    expect(page.items[0]?.label).toBe('Opened')
    expect(auditLogCount).toBe(3)

    await holdContext(createContext(userId, nextRequestId()), async () => {
      expect(await systemService.deleteDictItem(itemId)).toEqual({ deletedCount: 1 })
      expect(await systemService.deleteDictType(typeId)).toEqual({ deletedCount: 1 })
    })
  })

  it('rejects duplicate dictionary type codes and item values', async () => {
    const typeCode = `${codePrefix}_duplicate`
    let error: unknown

    await holdContext(createContext(userId, nextRequestId()), async () => {
      const type = await systemService.createDictType({
        code: typeCode,
        name: 'Duplicate Type',
        order: 1,
        status: DictStatus.ACTIVE,
        remark: null,
      })

      await systemService.createDictItem({
        typeId: type.id,
        value: 'DUPLICATE',
        label: 'Duplicate',
        color: 'slate',
        order: 1,
        status: DictStatus.ACTIVE,
        remark: null,
      })

      try {
        await systemService.createDictItem({
          typeId: type.id,
          value: 'DUPLICATE',
          label: 'Duplicate again',
          color: 'slate',
          order: 2,
          status: DictStatus.ACTIVE,
          remark: null,
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('DictItemValueAlreadyExists')
  })
})
