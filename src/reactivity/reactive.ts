import { track, trigger } from './effect'

const reactiveMap = new WeakMap<object, object>()

const arrayMutationMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
] as const

export function reactive<T extends object>(target: T): T {
  const existing = reactiveMap.get(target)
  if (existing) return existing as T

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__k_isReactive') return true
      if (key === '__k_raw') return target

      const value = Reflect.get(target, key, receiver)

      track(target, key)

      if (
        Array.isArray(target) &&
        typeof key === 'string' &&
        arrayMutationMethods.includes(key as any)
      ) {
        return function (this: any, ...args: any[]) {
          const result = (value as (...a: any[]) => any).apply(this, args)
          trigger(target, 'length')
          return result
        }
      }

      if (value !== null && typeof value === 'object') {
        return reactive(value)
      }

      return value
    },

    set(target, key, newValue, receiver) {
      const oldValue = Reflect.get(target, key, receiver)
      const result = Reflect.set(target, key, newValue, receiver)
      if (!Object.is(oldValue, newValue)) {
        trigger(target, key)
      }
      return result
    },

    deleteProperty(target, key) {
      const hadKey = Reflect.has(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result) {
        trigger(target, key)
      }
      return result
    }
  })

  reactiveMap.set(target, proxy)
  return proxy as T
}

export function isReactive(value: unknown): boolean {
  return !!(value && (value as any).__k_isReactive)
}

export function toRaw<T>(value: T): T {
  const raw = value && (value as any).__k_raw
  return raw ? toRaw(raw) : value
}
