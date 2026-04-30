import type { ComponentFn, VNode } from '../vdom/vnode'
import {
  createComponentInstance,
  setupComponent,
  setupRenderEffect,
  unmountComponent
} from '../component/instance'
import {
  createElement,
  registerComponentHandlers,
  unmount
} from '../vdom/patch'
import { h } from '../vdom/vnode'

registerComponentHandlers((vnode: VNode, parentComponent: any) => {
  const instance = createComponentInstance(vnode, parentComponent)
  vnode.component = instance
  setupComponent(instance)
  setupRenderEffect(instance)
  const subTree = instance.subTree!
  const domNode = createElement(subTree, instance)
  instance.el = subTree.el
  instance.vnode.el = instance.el
  return domNode
}, unmountComponent)

export interface App {
  mount: (container: string | Element) => void
  unmount: () => void
  use: (plugin: Plugin, ...options: any[]) => App
}

export interface Plugin {
  install: (app: App, ...options: any[]) => void
}

export function createApp(
  rootComponent: ComponentFn,
  rootProps?: Record<string, any>
): App {
  const installedPlugins = new Set<Plugin>()
  let rootVNode: VNode | null = null
  let rootContainer: Element | null = null
  let isMounted = false

  const app: App = {
    use(plugin: Plugin, ...options: any[]) {
      if (!installedPlugins.has(plugin)) {
        installedPlugins.add(plugin)
        plugin.install(app, ...options)
      }
      return app
    },

    mount(container: string | Element) {
      const el =
        typeof container === 'string'
          ? document.querySelector(container)
          : container

      if (!el) {
        console.error(`[Kairo] Cannot find mount target: ${container}`)
        return
      }

      rootContainer = el
      el.innerHTML = ''

      rootVNode = h(rootComponent, rootProps ?? null)
      const instance = createComponentInstance(rootVNode, null)
      rootVNode.component = instance
      setupComponent(instance)
      setupRenderEffect(instance)

      if (instance.subTree) {
        const domNode = createElement(instance.subTree, instance)
        instance.el = instance.subTree.el
        instance.vnode.el = instance.el
        el.appendChild(domNode)
      }

      isMounted = true
    },

    unmount() {
      if (isMounted && rootVNode) {
        unmount(rootVNode)
        rootContainer!.innerHTML = ''
        rootVNode = null
        isMounted = false
      }
    }
  }

  return app
}
