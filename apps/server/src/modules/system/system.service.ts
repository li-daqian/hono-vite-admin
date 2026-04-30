import type { DictStatus } from '@server/generated/prisma/enums'
import type {
  DictDeleteResponse,
  DictItemCreateRequest,
  DictItemPageRequest,
  DictItemPageResponse,
  DictItemResponse,
  DictItemUpdateRequest,
  DictTypeCreateRequest,
  DictTypePageRequest,
  DictTypePageResponse,
  DictTypeResponse,
  DictTypeUpdateRequest,
  SystemConfigItem,
  SystemConfigKey,
  SystemConfigListResponse,
  SystemConfigUpdateRequest,
} from '@server/src/modules/system/system.schema'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { prisma } from '@server/src/lib/prisma'
import { APP_CONFIG_DEFAULTS, APP_CONFIG_KEYS, APP_PAGE_SIZE_OPTIONS } from '@server/src/modules/app/app.config'
import { auditService } from '@server/src/modules/audit/audit.service'
import { buildOrderBy, paginate } from '@server/src/utils/pagination'

interface SystemConfigDefinition {
  key: SystemConfigKey
  label: string
  defaultValue: string
  valueType: SystemConfigItem['valueType']
  description: string
  options: string[] | null
  normalize: (value: string) => string
}

interface DictTypeRecord {
  id: string
  code: string
  name: string
  order: number
  status: DictStatus
  remark: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { items: number }
}

interface DictItemRecord {
  id: string
  typeId: string
  value: string
  label: string
  color: string | null
  order: number
  status: DictStatus
  remark: string | null
  createdAt: Date
  updatedAt: Date
  type: {
    code: string
    name: string
  }
}

const SYSTEM_CONFIG_DEFINITIONS: Record<SystemConfigKey, SystemConfigDefinition> = {
  [APP_CONFIG_KEYS.siteName]: {
    key: APP_CONFIG_KEYS.siteName,
    label: 'Site Name',
    defaultValue: APP_CONFIG_DEFAULTS.siteName,
    valueType: 'string',
    description: 'Application name shown in the admin shell.',
    options: null,
    normalize(value) {
      const trimmedValue = value.trim()
      if (trimmedValue.length < 1 || trimmedValue.length > 50) {
        throw BusinessError.BadRequest('Site name must be between 1 and 50 characters.', 'InvalidSystemConfigValue')
      }

      return trimmedValue
    },
  },
  [APP_CONFIG_KEYS.loginTitle]: {
    key: APP_CONFIG_KEYS.loginTitle,
    label: 'Login Page Title',
    defaultValue: APP_CONFIG_DEFAULTS.loginTitle,
    valueType: 'string',
    description: 'Title shown above the login form.',
    options: null,
    normalize(value) {
      const trimmedValue = value.trim()
      if (trimmedValue.length < 1 || trimmedValue.length > 80) {
        throw BusinessError.BadRequest('Login page title must be between 1 and 80 characters.', 'InvalidSystemConfigValue')
      }

      return trimmedValue
    },
  },
  [APP_CONFIG_KEYS.defaultPageSize]: {
    key: APP_CONFIG_KEYS.defaultPageSize,
    label: 'Default Page Size',
    defaultValue: String(APP_CONFIG_DEFAULTS.defaultPageSize),
    valueType: 'number',
    description: 'Default rows per page for paginated tables.',
    options: APP_PAGE_SIZE_OPTIONS.map(String),
    normalize(value) {
      const parsedValue = Number.parseInt(value, 10)
      if (!APP_PAGE_SIZE_OPTIONS.includes(parsedValue as typeof APP_PAGE_SIZE_OPTIONS[number])) {
        throw BusinessError.BadRequest(
          `Default page size must be one of: ${APP_PAGE_SIZE_OPTIONS.join(', ')}.`,
          'InvalidSystemConfigValue',
        )
      }

      return String(parsedValue)
    },
  },
}

const SYSTEM_CONFIG_KEYS = Object.keys(SYSTEM_CONFIG_DEFINITIONS) as SystemConfigKey[]

function assertWritable() {
  if (getEnv().deployment.readOnlyMode) {
    throw BusinessError.ReadOnlyModeEnabled()
  }
}

function normalizeNullable(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim()
  return trimmedValue || null
}

function normalizeColor(value: DictItemCreateRequest['color'] | DictItemUpdateRequest['color']): DictItemResponse['color'] {
  return value ?? 'slate'
}

function normalizeStoredColor(value: string | null): DictItemResponse['color'] {
  if (
    value === 'green'
    || value === 'zinc'
    || value === 'amber'
    || value === 'blue'
    || value === 'violet'
    || value === 'red'
    || value === 'slate'
  ) {
    return value
  }

  return 'slate'
}

function mapConfigItem(definition: SystemConfigDefinition, values: Map<string, string>): SystemConfigItem {
  return {
    key: definition.key,
    label: definition.label,
    value: definition.normalize(values.get(definition.key) ?? definition.defaultValue),
    valueType: definition.valueType,
    description: definition.description,
    options: definition.options,
  }
}

function mapDictType(type: DictTypeRecord): DictTypeResponse {
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    order: type.order,
    status: type.status,
    remark: type.remark,
    itemCount: type._count?.items ?? 0,
    createdAt: type.createdAt.toISOString(),
    updatedAt: type.updatedAt.toISOString(),
  }
}

function mapDictItem(item: DictItemRecord): DictItemResponse {
  return {
    id: item.id,
    typeId: item.typeId,
    typeCode: item.type.code,
    typeName: item.type.name,
    value: item.value,
    label: item.label,
    color: normalizeStoredColor(item.color),
    order: item.order,
    status: item.status,
    remark: item.remark,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

class SystemService {
  async getConfigs(): Promise<SystemConfigListResponse> {
    const values = await this.getStoredConfigValues(SYSTEM_CONFIG_KEYS)
    return {
      editable: !getEnv().deployment.readOnlyMode,
      items: SYSTEM_CONFIG_KEYS.map(key => mapConfigItem(SYSTEM_CONFIG_DEFINITIONS[key]!, values)),
    }
  }

  async updateConfigs(request: SystemConfigUpdateRequest): Promise<SystemConfigListResponse> {
    assertWritable()

    const nextValues = new Map<SystemConfigKey, string>()
    for (const config of request.configs) {
      const definition = SYSTEM_CONFIG_DEFINITIONS[config.key]
      nextValues.set(config.key, definition!.normalize(config.value))
    }

    const previous = await this.getConfigs()

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of nextValues) {
        await tx.sysConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }

      await auditService.record(tx, {
        module: 'system-config',
        action: 'update',
        requestSnapshot: {
          previous: previous.items.filter(item => nextValues.has(item.key)),
          next: [...nextValues.entries()].map(([key, value]) => ({
            key,
            value,
          })),
        },
      })
    })

    return this.getConfigs()
  }

  async getDictTypePage(query: DictTypePageRequest): Promise<DictTypePageResponse> {
    const { page, pageSize, search, status, sort } = query
    const skip = (page - 1) * pageSize
    const where = {
      ...(status && status.length > 0 ? { status: { in: status } } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
              { remark: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
    const orderBy = sort
      ? buildOrderBy(sort, ['code', 'name', 'order', 'status', 'createdAt', 'updatedAt'] as const, { order: 'asc' })
      : [{ order: 'asc' as const }, { code: 'asc' as const }]

    const [total, types] = await prisma.$transaction([
      prisma.dictType.count({ where }),
      prisma.dictType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
    ])

    return paginate(types.map(mapDictType), total, query)
  }

  async getDictTypeById(id: string): Promise<DictTypeResponse> {
    const type = await prisma.dictType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    if (!type) {
      throw BusinessError.NotFound('Dictionary type not found')
    }

    return mapDictType(type)
  }

  async createDictType(request: DictTypeCreateRequest): Promise<DictTypeResponse> {
    assertWritable()
    await this.assertDictTypeCodeUnique(request.code)

    const type = await prisma.$transaction(async (tx) => {
      const createdType = await tx.dictType.create({
        data: {
          code: request.code,
          name: request.name,
          order: request.order,
          status: request.status,
          remark: normalizeNullable(request.remark),
        },
        include: {
          _count: {
            select: { items: true },
          },
        },
      })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'create-type',
        requestSnapshot: request,
      })

      return createdType
    })

    return mapDictType(type)
  }

  async updateDictType(id: string, request: DictTypeUpdateRequest): Promise<DictTypeResponse> {
    assertWritable()
    const existingType = await prisma.dictType.findUnique({ where: { id } })
    if (!existingType) {
      throw BusinessError.NotFound('Dictionary type not found')
    }

    if (request.code && request.code !== existingType.code) {
      await this.assertDictTypeCodeUnique(request.code)
    }

    const type = await prisma.$transaction(async (tx) => {
      const updatedType = await tx.dictType.update({
        where: { id },
        data: {
          ...(request.code !== undefined && { code: request.code }),
          ...(request.name !== undefined && { name: request.name }),
          ...(request.order !== undefined && { order: request.order }),
          ...(request.status !== undefined && { status: request.status }),
          ...(request.remark !== undefined && { remark: normalizeNullable(request.remark) }),
        },
        include: {
          _count: {
            select: { items: true },
          },
        },
      })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'update-type',
        requestSnapshot: {
          id,
          ...request,
        },
      })

      return updatedType
    })

    return mapDictType(type)
  }

  async deleteDictType(id: string): Promise<DictDeleteResponse> {
    assertWritable()
    const type = await prisma.dictType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    if (!type) {
      throw BusinessError.NotFound('Dictionary type not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.dictItem.deleteMany({ where: { typeId: id } })
      await tx.dictType.delete({ where: { id } })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'delete-type',
        requestSnapshot: {
          id,
          code: type.code,
          itemCount: type._count.items,
        },
      })
    })

    return { deletedCount: 1 }
  }

  async getDictItemPage(query: DictItemPageRequest): Promise<DictItemPageResponse> {
    const { page, pageSize, typeId, typeCode, search, status, sort } = query
    const skip = (page - 1) * pageSize
    const where = {
      ...(typeId ? { typeId } : {}),
      ...(typeCode ? { type: { code: typeCode } } : {}),
      ...(status && status.length > 0 ? { status: { in: status } } : {}),
      ...(search
        ? {
            OR: [
              { value: { contains: search, mode: 'insensitive' as const } },
              { label: { contains: search, mode: 'insensitive' as const } },
              { remark: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
    const orderBy = sort
      ? buildOrderBy(sort, ['value', 'label', 'order', 'status', 'createdAt', 'updatedAt'] as const, { order: 'asc' })
      : [{ order: 'asc' as const }, { value: 'asc' as const }]

    const [total, items] = await prisma.$transaction([
      prisma.dictItem.count({ where }),
      prisma.dictItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          type: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
    ])

    return paginate(items.map(mapDictItem), total, query)
  }

  async getDictItemById(id: string): Promise<DictItemResponse> {
    const item = await prisma.dictItem.findUnique({
      where: { id },
      include: {
        type: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    })

    if (!item) {
      throw BusinessError.NotFound('Dictionary item not found')
    }

    return mapDictItem(item)
  }

  async createDictItem(request: DictItemCreateRequest): Promise<DictItemResponse> {
    assertWritable()
    await this.assertDictTypeExists(request.typeId)
    await this.assertDictItemValueUnique(request.typeId, request.value)

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.dictItem.create({
        data: {
          typeId: request.typeId,
          value: request.value,
          label: request.label,
          color: normalizeColor(request.color),
          order: request.order,
          status: request.status,
          remark: normalizeNullable(request.remark),
        },
        include: {
          type: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'create-item',
        requestSnapshot: request,
      })

      return createdItem
    })

    return mapDictItem(item)
  }

  async updateDictItem(id: string, request: DictItemUpdateRequest): Promise<DictItemResponse> {
    assertWritable()
    const existingItem = await prisma.dictItem.findUnique({ where: { id } })
    if (!existingItem) {
      throw BusinessError.NotFound('Dictionary item not found')
    }

    const nextTypeId = request.typeId ?? existingItem.typeId
    const nextValue = request.value ?? existingItem.value

    if (request.typeId) {
      await this.assertDictTypeExists(request.typeId)
    }

    if (nextTypeId !== existingItem.typeId || nextValue !== existingItem.value) {
      await this.assertDictItemValueUnique(nextTypeId, nextValue, id)
    }

    const item = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.dictItem.update({
        where: { id },
        data: {
          ...(request.typeId !== undefined && { typeId: request.typeId }),
          ...(request.value !== undefined && { value: request.value }),
          ...(request.label !== undefined && { label: request.label }),
          ...(request.color !== undefined && { color: normalizeColor(request.color) }),
          ...(request.order !== undefined && { order: request.order }),
          ...(request.status !== undefined && { status: request.status }),
          ...(request.remark !== undefined && { remark: normalizeNullable(request.remark) }),
        },
        include: {
          type: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'update-item',
        requestSnapshot: {
          id,
          ...request,
        },
      })

      return updatedItem
    })

    return mapDictItem(item)
  }

  async deleteDictItem(id: string): Promise<DictDeleteResponse> {
    assertWritable()
    const item = await prisma.dictItem.findUnique({ where: { id } })

    if (!item) {
      throw BusinessError.NotFound('Dictionary item not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.dictItem.delete({ where: { id } })

      await auditService.record(tx, {
        module: 'dictionary',
        action: 'delete-item',
        requestSnapshot: {
          id,
          typeId: item.typeId,
          value: item.value,
        },
      })
    })

    return { deletedCount: 1 }
  }

  private async getStoredConfigValues(keys: readonly string[]): Promise<Map<string, string>> {
    const configs = await prisma.sysConfig.findMany({
      where: {
        key: {
          in: [...keys],
        },
      },
    })

    return new Map(configs.map(config => [config.key, config.value]))
  }

  private async assertDictTypeCodeUnique(code: string): Promise<void> {
    const existingType = await prisma.dictType.findUnique({ where: { code } })
    if (existingType) {
      throw BusinessError.BadRequest('Dictionary type code already exists', 'DictTypeCodeAlreadyExists')
    }
  }

  private async assertDictTypeExists(typeId: string): Promise<void> {
    const type = await prisma.dictType.findUnique({ where: { id: typeId } })
    if (!type) {
      throw BusinessError.BadRequest('Dictionary type not found', 'DictTypeNotFound')
    }
  }

  private async assertDictItemValueUnique(typeId: string, value: string, exceptId?: string): Promise<void> {
    const existingItem = await prisma.dictItem.findFirst({
      where: {
        typeId,
        value,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    })

    if (existingItem) {
      throw BusinessError.BadRequest('Dictionary item value already exists in this type', 'DictItemValueAlreadyExists')
    }
  }
}

export const systemService = new SystemService()
