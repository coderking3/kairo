export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export type ComponentFn = (props: Record<string, any>) => any

export interface VNode {
  type: string | symbol | ComponentFn
  props: Record<string, any> | null
  children: VNodeChild[]
  key: string | number | null
  el: Node | null
  component: any | null
}

export type VNodeChild = VNode | string | number | boolean | null | undefined
export type VNodeChildren = VNodeChild | VNodeChild[]

export function h(
  type: string | symbol | ComponentFn,
  props?: Record<string, any> | null,
  ...children: VNodeChild[]
): VNode {
  const normalizedChildren =
    children.length === 1 && Array.isArray(children[0])
      ? (children[0] as VNodeChild[]).flat()
      : children.flat()
  const key = props?.key ?? null
  if (props?.key !== undefined) {
    props = { ...props }
    delete props.key
  }

  return {
    type,
    props: props ?? null,
    children: normalizedChildren,
    key,
    el: null,
    component: null
  }
}

export function createTextVNode(text: string | number): VNode {
  return {
    type: Text,
    props: null,
    children: [String(text)],
    key: null,
    el: null,
    component: null
  }
}

export function normalizeVNode(child: VNodeChild | VNodeChild[]): VNode {
  if (child == null || typeof child === 'boolean') {
    return createTextVNode('')
  }
  if (typeof child === 'string' || typeof child === 'number') {
    return createTextVNode(child)
  }
  if (Array.isArray(child)) {
    return h(Fragment, null, ...child)
  }
  return child
}
