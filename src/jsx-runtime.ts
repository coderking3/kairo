import type { ComponentFn, VNode, VNodeChild } from './vdom/vnode'
import { Fragment, h } from './vdom/vnode'

export { Fragment }

export function jsx(
  type: string | symbol | ComponentFn,
  props: Record<string, any> | null,
  key?: string | number
): VNode {
  const { children, ...restProps } = props ?? {}
  if (key !== undefined) {
    restProps.key = key
  }
  const childArray: VNodeChild[] =
    children == null ? [] : Array.isArray(children) ? children : [children]
  return h(type, restProps, ...childArray)
}

export const jsxs = jsx
export const jsxDEV = jsx

// eslint-disable-next-line typescript/no-namespace
export namespace JSX {
  export type Element = VNode

  export interface IntrinsicElements {
    a: HTMLAttributes<HTMLAnchorElement>
    abbr: HTMLAttributes<HTMLElement>
    address: HTMLAttributes<HTMLElement>
    article: HTMLAttributes<HTMLElement>
    aside: HTMLAttributes<HTMLElement>
    audio: HTMLAttributes<HTMLAudioElement>
    b: HTMLAttributes<HTMLElement>
    blockquote: HTMLAttributes<HTMLQuoteElement>
    body: HTMLAttributes<HTMLBodyElement>
    br: HTMLAttributes<HTMLBRElement>
    button: HTMLAttributes<HTMLButtonElement>
    canvas: HTMLAttributes<HTMLCanvasElement>
    code: HTMLAttributes<HTMLElement>
    div: HTMLAttributes<HTMLDivElement>
    em: HTMLAttributes<HTMLElement>
    footer: HTMLAttributes<HTMLElement>
    form: HTMLAttributes<HTMLFormElement>
    h1: HTMLAttributes<HTMLHeadingElement>
    h2: HTMLAttributes<HTMLHeadingElement>
    h3: HTMLAttributes<HTMLHeadingElement>
    h4: HTMLAttributes<HTMLHeadingElement>
    h5: HTMLAttributes<HTMLHeadingElement>
    h6: HTMLAttributes<HTMLHeadingElement>
    header: HTMLAttributes<HTMLElement>
    hr: HTMLAttributes<HTMLHRElement>
    i: HTMLAttributes<HTMLElement>
    iframe: HTMLAttributes<HTMLIFrameElement>
    img: HTMLAttributes<HTMLImageElement>
    input: HTMLAttributes<HTMLInputElement>
    label: HTMLAttributes<HTMLLabelElement>
    li: HTMLAttributes<HTMLLIElement>
    link: HTMLAttributes<HTMLLinkElement>
    main: HTMLAttributes<HTMLElement>
    nav: HTMLAttributes<HTMLElement>
    ol: HTMLAttributes<HTMLOListElement>
    option: HTMLAttributes<HTMLOptionElement>
    p: HTMLAttributes<HTMLParagraphElement>
    pre: HTMLAttributes<HTMLPreElement>
    progress: HTMLAttributes<HTMLProgressElement>
    section: HTMLAttributes<HTMLElement>
    select: HTMLAttributes<HTMLSelectElement>
    span: HTMLAttributes<HTMLSpanElement>
    strong: HTMLAttributes<HTMLElement>
    style: HTMLAttributes<HTMLStyleElement>
    table: HTMLAttributes<HTMLTableElement>
    tbody: HTMLAttributes<HTMLTableSectionElement>
    td: HTMLAttributes<HTMLTableCellElement>
    textarea: HTMLAttributes<HTMLTextAreaElement>
    th: HTMLAttributes<HTMLTableCellElement>
    thead: HTMLAttributes<HTMLTableSectionElement>
    tr: HTMLAttributes<HTMLTableRowElement>
    ul: HTMLAttributes<HTMLUListElement>
    video: HTMLAttributes<HTMLVideoElement>
    [tag: string]: any
  }

  export interface HTMLAttributes<_T = HTMLElement> {
    id?: string
    class?: string
    style?: string | Record<string, string | number>
    key?: string | number
    children?: any

    onClick?: (e: MouseEvent) => void
    onDblClick?: (e: MouseEvent) => void
    onMouseDown?: (e: MouseEvent) => void
    onMouseUp?: (e: MouseEvent) => void
    onMouseEnter?: (e: MouseEvent) => void
    onMouseLeave?: (e: MouseEvent) => void
    onMouseMove?: (e: MouseEvent) => void
    onKeyDown?: (e: KeyboardEvent) => void
    onKeyUp?: (e: KeyboardEvent) => void
    onKeyPress?: (e: KeyboardEvent) => void
    onFocus?: (e: FocusEvent) => void
    onBlur?: (e: FocusEvent) => void
    onChange?: (e: Event) => void
    onInput?: (e: Event) => void
    onSubmit?: (e: Event) => void
    onScroll?: (e: Event) => void
    onLoad?: (e: Event) => void
    onError?: (e: Event) => void

    href?: string
    src?: string
    alt?: string
    title?: string
    type?: string
    value?: string | number
    name?: string
    placeholder?: string
    disabled?: boolean
    checked?: boolean
    readonly?: boolean
    required?: boolean
    hidden?: boolean
    tabIndex?: number
    role?: string
    width?: string | number
    height?: string | number
    target?: string
    rel?: string
    action?: string
    method?: string
    for?: string

    [key: `data-${string}`]: any
    [key: `aria-${string}`]: any
    [key: string]: any
  }

  export interface ElementChildrenAttribute {
    children: unknown
  }
}
