export { defineComponent } from './define'
export {
  type ComponentInstance,
  createComponentInstance,
  getCurrentInstance,
  setCurrentInstance,
  setupComponent,
  setupRenderEffect,
  unmountComponent
} from './instance'
export {
  invokeHooks,
  onError,
  onMounted,
  onUnmounted,
  onUpdated
} from './lifecycle'
