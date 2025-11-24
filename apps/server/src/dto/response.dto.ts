export interface ResponseDto<T = any> {
  ok: boolean
  message: string
  data?: T
}

export function makeResponse<T = any>(ok: boolean, message: string, data?: T): ResponseDto<T> {
  return { ok, message, data }
}

export function okResponse<T = any>(message = 'OK', data?: T): ResponseDto<T> {
  return makeResponse(true, message, data)
}

export function errorResponse<T = any>(message = 'Error', data?: T): ResponseDto<T> {
  return makeResponse(false, message, data)
}
