// App
export { type App, createApp, type Plugin } from './app'

// Component
export { defineComponent } from './component'
export { onError, onMounted, onUnmounted, onUpdated } from './component'
export { getCurrentInstance } from './component'

// Reactivity
export { isRef, ref, type Ref, unref } from './reactivity'

export { isReactive, reactive, toRaw } from './reactivity'
export { computed } from './reactivity'

export { watch, watchEffect } from './reactivity'
export { effect } from './reactivity'

// VDom
export { createTextVNode, Fragment, h, Text } from './vdom'

export { nextTick } from './vdom'
