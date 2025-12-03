import type { BusinessErrorEnumType } from '@server/src/common/constant'

export class BusinessError<T> extends Error {
  private _code: number
  private _message: string
  private _data?: T

  constructor(type: BusinessErrorEnumType | number, message?: string, data?: T) {
    super(message)
    this._code = typeof type === 'number' ? type : type.code
    this._message = message || (typeof type === 'number' ? '' : type.message)
    this._data = data
    this.name = 'BusinessError'
  }

  get code(): number {
    return this._code
  }

  get message(): string {
    return this._message
  }

  get data(): T | undefined {
    return this._data
  }
}
