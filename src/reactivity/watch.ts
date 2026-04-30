import type { Ref } from './ref'
import { queueJob } from '../vdom/scheduler'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'
import { isRef } from './ref'

export function watchEffect(fn: () => void) {
  const effect = new ReactiveEffect(fn, () => {
    queueJob(effect)
  })
  effect.run()
  return () => effect.stop()
}

type WatchSource<T = any> = Ref<T> | (() => T)

function getSourceValue<T>(source: WatchSource<T>): T {
  if (isRef(source)) return source.value
  if (typeof source === 'function') return source()
  return undefined as T
}

function traverse(value: unknown, seen = new Set()): unknown {
  if (value === null || typeof value !== 'object' || seen.has(value))
    return value
  seen.add(value)
  if (Array.isArray(value)) {
    value.forEach((v) => traverse(v, seen))
  } else {
    for (const key of Object.keys(value as object)) {
      traverse((value as any)[key], seen)
    }
  }
  return value
}

export function watch<T>(
  source: WatchSource<T> | object,
  callback: (newValue: T, oldValue: T | undefined) => void
) {
  let getter: () => T

  if (isRef(source)) {
    getter = () => source.value as T
  } else if (isReactive(source)) {
    getter = () => {
      traverse(source)
      return source as T
    }
  } else if (typeof source === 'function') {
    getter = source as () => T
  } else {
    return () => {}
  }

  let oldValue: T | undefined

  const effect = new ReactiveEffect(getter, () => {
    queueJob(effect)
  })

  effect.run = ((originalRun) => {
    return () => {
      const newValue = originalRun.call(effect)
      if (!Object.is(newValue, oldValue)) {
        callback(newValue, oldValue)
        oldValue = newValue
      }
      return newValue
    }
  })(effect.run)

  oldValue = getSourceValue(source as WatchSource<T>)

  return () => effect.stop()
}
