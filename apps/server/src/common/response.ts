import type { BusinessErrorEnumType } from '@server/src/common/constant'
import { BusinessError } from '@server/src/common/exception'

export interface Response<T = any> {
  code: number
  ok: boolean
  message: string
  data?: T
}

export function okResponse<T = any>(data?: T): Response<T> {
  return { code: 200, ok: true, message: 'OK', data }
}

export function errorResponse<T = any>(businessError: BusinessError<T> | BusinessErrorEnumType): Response<T> {
  if (businessError instanceof BusinessError) {
    return { code: businessError.code, ok: false, message: businessError.message, data: businessError.data }
  }
  else {
    return { code: businessError.code, ok: false, message: businessError.message }
  }
}
