import type { VNode } from './vnode'
import { Fragment, normalizeVNode, Text } from './vnode'

type MountComponentFn = (vnode: VNode, parentComponent: any) => Node
type UnmountComponentFn = (instance: any) => void

let _mountComponent: MountComponentFn
let _unmountComponent: UnmountComponentFn

export function registerComponentHandlers(
  mount: MountComponentFn,
  unmountComp: UnmountComponentFn
): void {
  _mountComponent = mount
  _unmountComponent = unmountComp
}

export function createElement(vnode: VNode, parentComponent: any): Node {
  const { type, props, children } = vnode

  if (type === Text) {
    const textNode = document.createTextNode(children[0] as string)
    vnode.el = textNode
    return textNode
  }

  if (type === Fragment) {
    const fragment = document.createDocumentFragment()
    children.forEach((child, i) => {
      const childVNode = normalizeVNode(child)
      vnode.children[i] = childVNode
      fragment.appendChild(createElement(childVNode, parentComponent))
    })
    vnode.el = (vnode.children[0] as VNode)?.el ?? null
    return fragment
  }

  if (typeof type === 'function') {
    return _mountComponent(vnode, parentComponent)
  }

  const el = document.createElement(type as string)
  vnode.el = el

  if (props) {
    patchProps(el, {}, props)
  }

  children.forEach((child, i) => {
    const childVNode = normalizeVNode(child)
    vnode.children[i] = childVNode
    el.appendChild(createElement(childVNode, parentComponent))
  })

  return el
}

export function patch(
  oldVNode: VNode | null,
  newVNode: VNode,
  container: Element,
  anchor: Node | null = null,
  parentComponent: any = null
): void {
  if (oldVNode === newVNode) return

  if (oldVNode && oldVNode.type !== newVNode.type) {
    unmount(oldVNode)
    oldVNode = null
  }

  const { type } = newVNode

  if (type === Text) {
    patchText(oldVNode, newVNode, container, anchor)
  } else if (type === Fragment) {
    patchFragment(oldVNode, newVNode, container, anchor, parentComponent)
  } else if (typeof type === 'function') {
    patchComponent(oldVNode, newVNode, container, anchor, parentComponent)
  } else {
    patchElement(oldVNode, newVNode, container, anchor, parentComponent)
  }
}

function patchText(
  oldVNode: VNode | null,
  newVNode: VNode,
  container: Element,
  anchor: Node | null
): void {
  if (oldVNode == null) {
    const el = document.createTextNode(newVNode.children[0] as string)
    newVNode.el = el
    insertNode(el, container, anchor)
  } else {
    const el = (newVNode.el = oldVNode.el!)
    const newText = newVNode.children[0] as string
    if (el.textContent !== newText) {
      el.textContent = newText
    }
  }
}

function patchFragment(
  oldVNode: VNode | null,
  newVNode: VNode,
  container: Element,
  anchor: Node | null,
  parentComponent: any
): void {
  const oldChildren = oldVNode ? oldVNode.children.map(normalizeVNode) : []
  const newChildren = newVNode.children.map((child, i) => {
    const vnode = normalizeVNode(child)
    newVNode.children[i] = vnode
    return vnode
  })
  patchChildren(oldChildren, newChildren, container, anchor, parentComponent)
  newVNode.el = newChildren[0]?.el ?? null
}

function patchComponent(
  oldVNode: VNode | null,
  newVNode: VNode,
  container: Element,
  anchor: Node | null,
  parentComponent: any
): void {
  if (oldVNode == null) {
    const el = createElement(newVNode, parentComponent)
    insertNode(el, container, anchor)
  } else {
    const instance = (newVNode.component = oldVNode.component)
    if (instance) {
      instance.next = newVNode
      instance.update()
    }
  }
}

function patchElement(
  oldVNode: VNode | null,
  newVNode: VNode,
  container: Element,
  anchor: Node | null,
  parentComponent: any
): void {
  if (oldVNode == null) {
    const el = createElement(newVNode, parentComponent)
    insertNode(el, container, anchor)
  } else {
    const el = (newVNode.el = oldVNode.el!) as Element
    patchProps(el, oldVNode.props ?? {}, newVNode.props ?? {})
    const oldChildren = oldVNode.children.map(normalizeVNode)
    const newChildren = newVNode.children.map((child, i) => {
      const vnode = normalizeVNode(child)
      newVNode.children[i] = vnode
      return vnode
    })
    patchChildren(oldChildren, newChildren, el, null, parentComponent)
  }
}

function patchChildren(
  oldChildren: VNode[],
  newChildren: VNode[],
  container: Element,
  anchor: Node | null,
  parentComponent: any
): void {
  let oldStartIdx = 0
  let oldEndIdx = oldChildren.length - 1
  let newStartIdx = 0
  let newEndIdx = newChildren.length - 1

  let oldStartVNode = oldChildren[oldStartIdx]
  let oldEndVNode = oldChildren[oldEndIdx]
  let newStartVNode = newChildren[newStartIdx]
  let newEndVNode = newChildren[newEndIdx]

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (!oldStartVNode) {
      oldStartVNode = oldChildren[++oldStartIdx]
    } else if (!oldEndVNode) {
      oldEndVNode = oldChildren[--oldEndIdx]
    } else if (isSameVNode(oldStartVNode, newStartVNode)) {
      patch(oldStartVNode, newStartVNode, container, anchor, parentComponent)
      oldStartVNode = oldChildren[++oldStartIdx]
      newStartVNode = newChildren[++newStartIdx]
    } else if (isSameVNode(oldEndVNode, newEndVNode)) {
      patch(oldEndVNode, newEndVNode, container, anchor, parentComponent)
      oldEndVNode = oldChildren[--oldEndIdx]
      newEndVNode = newChildren[--newEndIdx]
    } else if (isSameVNode(oldStartVNode, newEndVNode)) {
      patch(oldStartVNode, newEndVNode, container, anchor, parentComponent)
      insertNode(oldStartVNode.el!, container, oldEndVNode.el!.nextSibling)
      oldStartVNode = oldChildren[++oldStartIdx]
      newEndVNode = newChildren[--newEndIdx]
    } else if (isSameVNode(oldEndVNode, newStartVNode)) {
      patch(oldEndVNode, newStartVNode, container, anchor, parentComponent)
      insertNode(oldEndVNode.el!, container, oldStartVNode.el!)
      oldEndVNode = oldChildren[--oldEndIdx]
      newStartVNode = newChildren[++newStartIdx]
    } else {
      const idxInOld = findIdxInOld(
        newStartVNode,
        oldChildren,
        oldStartIdx,
        oldEndIdx
      )
      if (idxInOld === -1) {
        patch(null, newStartVNode, container, oldStartVNode.el, parentComponent)
      } else {
        const vnodeToMove = oldChildren[idxInOld]
        patch(vnodeToMove, newStartVNode, container, anchor, parentComponent)
        insertNode(vnodeToMove.el!, container, oldStartVNode.el!)
        oldChildren[idxInOld] = undefined as any
      }
      newStartVNode = newChildren[++newStartIdx]
    }
  }

  if (oldStartIdx > oldEndIdx) {
    const refElm = newChildren[newEndIdx + 1]?.el ?? anchor
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      patch(null, newChildren[i], container, refElm, parentComponent)
    }
  } else if (newStartIdx > newEndIdx) {
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      if (oldChildren[i]) unmount(oldChildren[i])
    }
  }
}

function findIdxInOld(
  vnode: VNode,
  oldChildren: VNode[],
  start: number,
  end: number
): number {
  for (let i = start; i <= end; i++) {
    if (oldChildren[i] && isSameVNode(oldChildren[i], vnode)) {
      return i
    }
  }
  return -1
}

function isSameVNode(a: VNode, b: VNode): boolean {
  return a.type === b.type && a.key === b.key
}

export function unmount(vnode: VNode): void {
  if (vnode.component) {
    _unmountComponent(vnode.component)
    return
  }
  if (vnode.type === Fragment) {
    vnode.children.forEach((child) => {
      if (child && typeof child === 'object') unmount(child as VNode)
    })
    return
  }
  if (vnode.el?.parentNode) {
    vnode.el.parentNode.removeChild(vnode.el)
  }
}

function insertNode(
  el: Node,
  container: Element | Node,
  anchor: Node | null
): void {
  if (anchor) {
    container.insertBefore(el, anchor)
  } else {
    container.appendChild(el)
  }
}

export function patchProps(
  el: Element,
  oldProps: Record<string, any>,
  newProps: Record<string, any>
): void {
  for (const key in newProps) {
    const oldValue = oldProps[key]
    const newValue = newProps[key]
    if (oldValue !== newValue) {
      setProp(el, key, oldValue, newValue)
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      setProp(el, key, oldProps[key], null)
    }
  }
}

function setProp(el: Element, key: string, oldValue: any, newValue: any): void {
  if (key.startsWith('on')) {
    const event = key.slice(2).toLowerCase()
    if (oldValue) el.removeEventListener(event, oldValue)
    if (newValue) el.addEventListener(event, newValue)
  } else if (key === 'style') {
    if (typeof newValue === 'string') {
      ;(el as HTMLElement).style.cssText = newValue
    } else if (typeof newValue === 'object') {
      for (const prop in { ...oldValue, ...newValue }) {
        const val = newValue?.[prop] ?? ''
        ;(el as HTMLElement).style.setProperty(
          prop.startsWith('--')
            ? prop
            : prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
          val
        )
      }
    } else {
      ;(el as HTMLElement).removeAttribute('style')
    }
  } else if (key === 'class') {
    el.className = newValue ?? ''
  } else if (
    key in el &&
    typeof (el as any)[key] !== 'undefined' &&
    key !== 'list'
  ) {
    try {
      ;(el as any)[key] = newValue ?? ''
    } catch {
      el.setAttribute(key, newValue)
    }
  } else if (newValue == null || newValue === false) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, newValue === true ? '' : String(newValue))
  }
}
