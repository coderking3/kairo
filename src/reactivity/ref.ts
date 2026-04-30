import { track, trigger } from './effect'
import { reactive } from './reactive'

export interface Ref<T = any> {
  value: T
  __k_isRef: true
}

class RefImpl<T> {
  private _value: T
  public readonly __k_isRef = true

  constructor(value: T) {
    this._value = toReactive(value)
  }

  get value(): T {
    track(this as any, 'value')
    return this._value
  }

  set value(newValue: T) {
    if (!Object.is(this._value, newValue)) {
      this._value = toReactive(newValue)
      trigger(this as any, 'value')
    }
  }
}

function toReactive<T>(value: T): T {
  return value !== null && typeof value === 'object'
    ? (reactive(value as any) as T)
    : value
}

export function ref<T>(value: T): Ref<T>
export function ref<T = any>(): Ref<T | undefined>
export function ref(value?: unknown): Ref {
  if (isRef(value)) return value
  return new RefImpl(value) as any
}

export function isRef(value: unknown): value is Ref {
  return !!(value && (value as any).__k_isRef === true)
}

export function unref<T>(ref: Ref<T> | T): T {
  return isRef(ref) ? ref.value : ref
}
