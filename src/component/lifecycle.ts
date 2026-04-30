import { getCurrentInstance } from './instance'

type LifecycleKey = 'mounted' | 'unmounted' | 'updated' | 'errorHandlers'

function createHook(type: LifecycleKey) {
  return (fn: (...args: any[]) => void): void => {
    const instance = getCurrentInstance()
    if (instance) {
      ;(instance[type] as Array<(...args: any[]) => void>).push(fn)
    }
  }
}

export const onMounted = createHook('mounted')
export const onUnmounted = createHook('unmounted')
export const onUpdated = createHook('updated')
export const onError = createHook('errorHandlers')

export function invokeHooks(hooks: Array<() => void>): void {
  hooks.forEach((fn) => fn())
}
