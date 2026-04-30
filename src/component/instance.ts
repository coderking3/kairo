import type { VNode } from '../vdom/vnode'
import { ReactiveEffect } from '../reactivity/effect'
import { reactive } from '../reactivity/reactive'
import { patch, unmount as unmountVNode } from '../vdom/patch'
import { queueJob, queuePostFlushCb } from '../vdom/scheduler'
import { normalizeVNode } from '../vdom/vnode'
import { invokeHooks } from './lifecycle'

type HookFn = () => void
type ErrorHookFn = (err: unknown) => void

export interface ComponentInstance {
  vnode: VNode
  type: (props: Record<string, any>) => any
  parent: ComponentInstance | null
  props: Record<string, any>
  setupState: any
  render: (() => VNode) | null
  subTree: VNode | null
  next: VNode | null
  el: Node | null
  isMounted: boolean
  isUnmounted: boolean
  update: () => void
  mounted: HookFn[]
  unmounted: HookFn[]
  updated: HookFn[]
  errorHandlers: ErrorHookFn[]
  provides: Record<string | symbol, any>
}

let currentInstance: ComponentInstance | null = null

export function getCurrentInstance(): ComponentInstance | null {
  return currentInstance
}

export function setCurrentInstance(instance: ComponentInstance | null): void {
  currentInstance = instance
}

export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInstance | null
): ComponentInstance {
  const instance: ComponentInstance = {
    vnode,
    type: vnode.type as (props: Record<string, any>) => any,
    parent,
    props: reactive(vnode.props ?? {}),
    setupState: null,
    render: null,
    subTree: null,
    next: null,
    el: null,
    isMounted: false,
    isUnmounted: false,
    update: () => {},
    mounted: [],
    unmounted: [],
    updated: [],
    errorHandlers: [],
    provides: parent ? Object.create(parent.provides) : {}
  }

  return instance
}

export function setupComponent(instance: ComponentInstance): void {
  const { type, props } = instance
  setCurrentInstance(instance)
  try {
    const setupResult = type(props)
    if (typeof setupResult === 'function') {
      instance.render = setupResult
    } else if (
      setupResult &&
      typeof setupResult === 'object' &&
      typeof setupResult.render === 'function'
    ) {
      instance.render = setupResult.render
    }
  } finally {
    setCurrentInstance(null)
  }
}

export function setupRenderEffect(instance: ComponentInstance): void {
  const componentUpdateFn = (): void => {
    if (!instance.isMounted) {
      const subTree = renderComponentTree(instance)
      instance.subTree = subTree
      instance.isMounted = true
      queuePostFlushCb(() => invokeHooks(instance.mounted))
    } else {
      if (instance.next) {
        const nextVNode = instance.next
        instance.next = null
        updateComponentProps(instance, nextVNode.props ?? {})
        instance.vnode = nextVNode
        nextVNode.component = instance
      }

      const prevTree = instance.subTree!
      const nextTree = renderComponentTree(instance)
      instance.subTree = nextTree
      const container = prevTree.el?.parentNode as Element
      if (container) {
        patch(prevTree, nextTree, container, null, instance)
      }
      instance.el = nextTree.el
      instance.vnode.el = instance.el
      queuePostFlushCb(() => invokeHooks(instance.updated))
    }
  }

  const effect = new ReactiveEffect(componentUpdateFn, () => {
    queueJob(effect)
  })

  instance.update = () => effect.run()
  effect.run()
}

function renderComponentTree(instance: ComponentInstance): VNode {
  setCurrentInstance(instance)
  try {
    const vnode = instance.render!()
    return normalizeVNode(vnode as any)
  } catch (err) {
    handleError(instance, err)
    return normalizeVNode(null)
  } finally {
    setCurrentInstance(null)
  }
}

function updateComponentProps(
  instance: ComponentInstance,
  newProps: Record<string, any>
): void {
  const props = instance.props
  for (const key in newProps) {
    props[key] = newProps[key]
  }
  for (const key in props) {
    if (!(key in newProps)) {
      delete props[key]
    }
  }
}

export function unmountComponent(instance: ComponentInstance): void {
  if (instance.isUnmounted) return
  if (instance.subTree) {
    unmountVNode(instance.subTree)
  }
  invokeHooks(instance.unmounted)
  instance.isUnmounted = true
}

function handleError(instance: ComponentInstance | null, err: unknown): void {
  let cur = instance
  while (cur) {
    if (cur.errorHandlers.length > 0) {
      cur.errorHandlers.forEach((handler) => handler(err))
      return
    }
    cur = cur.parent
  }
  console.error('[Kairo] Unhandled error:', err)
}
