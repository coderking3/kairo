# Kairo

## 定位

**Kairo 是一个轻量级响应式 UI 框架，核心只提供响应式系统、虚拟 DOM 和组件模型，渲染语法交给生态。**

填补的是 jQuery 和 Vue/React 之间的空白地带：

- **jQuery 太原始** — 命令式 DOM 操作，状态管理混乱，不适合现代开发思维
- **Vue/React 太重** — 为复杂 SPA 设计，构建工具链、路由、状态管理全家桶，用来写一个官网就像用航母运快递

Kairo 面向的是那些**不需要全家桶但又想要现代开发体验**的场景：企业官网、产品着陆页、营销活动页、个人作品集、嵌入式组件、轻交互页面。在这些场景中，你需要的只是「数据变了 → UI 自动更新」和基本的组件化组织能力，不需要为此引入一个 33KB+ 的运行时和一整套工具链。

**一句话：写简单页面时，不必在 jQuery 和 Vue/React 之间二选一。**

## 设计原则

1. **核心最小化** — 只做别人做不了的事（响应式、diff、组件调度）
2. **零构建可用** — CDN 引入即写，搭配 htm 体验良好
3. **有构建更好用** — Vite + JSX/TSX 全类型支持
4. **标准 h 函数** — 兼容任何 JSX 转换工具，不绑定特定方案

## 生态策略

Kairo 核心包只解决 UI 渲染问题。路由和状态管理作为**官方维护的独立包**提供，按需引入、即插即用：

```
kairo          ← 核心（~6KB）随时可以单独使用
kairo/router   ← 可选，需要多页面切换时引入
kairo/store    ← 可选，需要跨组件共享状态时引入
```

**不集成也完全可用** — 一个着陆页可能只需要核心包；一个多页官网加上 router；一个带复杂表单交互的页面再加上 store。用多少引多少，不用的不会出现在产物里（tree-shakable）。

**和全家桶框架的区别：** Vue/React 的生态是"全带上然后想办法摇掉"，Kairo 是"默认什么都没有，你主动加上"。心智模型更接近工具库组合而非框架捆绑。

## 模块划分

| 包           | 体积预估   | 职责                             |
| ------------ | ---------- | -------------------------------- |
| kairo        | ~6KB       | 核心框架                         |
| kairo/router | ~1.5KB     | hash/history 路由，tree-shakable |
| kairo/store  | ~1KB       | 跨组件状态共享                   |
| **全量引入** | **~8.5KB** | 依然远小于 Vue/React             |

核心包内部模块：

| 模块        | 体积预估 | 职责                                        |
| ----------- | -------- | ------------------------------------------- |
| reactivity  | ~1.5KB   | ref, reactive, computed, watchEffect, watch |
| vdom        | ~2KB     | h, Fragment, diff/patch, 文本节点优化       |
| component   | ~1.5KB   | defineComponent, 生命周期, props, 组件实例  |
| scheduler   | ~0.5KB   | queueMicrotask 批量更新                     |
| app         | ~0.5KB   | createApp, mount, 插件注册                  |
| jsx-runtime | ~0.1KB   | jsxImportSource 入口（h + Fragment 再导出） |

## 核心 API

```ts
// 响应式
export { computed, reactive, ref, watch, watchEffect }

// 渲染
export { Fragment, h }

// 组件
export { defineComponent }

// 生命周期
export { onError, onMounted, onUnmounted, onUpdated }

// 应用
export { createApp }
```

## 组件模型

```ts
// 无状态组件：纯函数
const Logo = (props) => h('img', { src: props.url })

// 有状态组件：defineComponent
const Counter = defineComponent((props) => {
  // setup 只执行一次
  const count = ref(props.initial ?? 0)
  const double = computed(() => count.value * 2)

  onMounted(() => console.log('ready'))
  onUnmounted(() => console.log('bye'))

  // 返回 render 函数，响应式自动追踪依赖
  return () =>
    h('div', null, [
      h('span', null, `${count.value} × 2 = ${double.value}`),
      h('button', { onClick: () => count.value++ }, '+1')
    ])
})
```

**设计要点：**

- setup 执行一次，render 函数被 watchEffect 包裹
- 依赖变化 → render 重新执行 → 新旧 VNode diff → 最小化 DOM 更新
- Props 为 reactive 对象，父组件更新自动触发子组件重渲染
- 组件实例上下文栈支持生命周期注册

## 使用方式

### 模式一：CDN + htm（零构建）

```html
<div id="app"></div>
<script src="https://cdn.xxx/kairo.umd.js"></script>
<script src="https://unpkg.com/htm"></script>
<script>
  const { h, ref, defineComponent, createApp } = Kairo
  const html = htm.bind(h)

  const App = defineComponent(() => {
    const msg = ref('Hello Kairo')
    return () =>
      html`<h1 onClick=${() => (msg.value = 'Clicked!')}>${msg.value}</h1>`
  })

  createApp(App).mount('#app')
</script>
```

### 模式二：Vite + JSX（工程化开发）

```tsx
// tsconfig.json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "kairo" } }

// App.tsx
import { ref, defineComponent, createApp } from 'kairo'

const App = defineComponent(() => {
  const msg = ref('Hello Kairo')
  return () => <h1 onClick={() => msg.value = 'Clicked!'}>{msg.value}</h1>
})

createApp(App).mount('#app')
```

## 响应式系统设计

```
┌─────────────────────────────────────────────┐
│  effect(fn)                                  │
│    ↓ 执行 fn 时                              │
│  proxy.get 触发 → track(target, key)         │
│    → 将当前 effect 收集到 dep                 │
│                                              │
│  proxy.set 触发 → trigger(target, key)       │
│    → 通知所有 dep 中的 effect → 进入 scheduler │
│                                              │
│  scheduler: queueMicrotask 去重执行           │
└─────────────────────────────────────────────┘
```

**关键改进（对比 mini-vue 实现）：**

| 项目     | 实现                                                   |
| -------- | ------------------------------------------------------ |
| 批量更新 | scheduler 用微任务队列去重，同步多次修改只触发一次渲染 |
| computed | lazy 求值 + dirty 标记，依赖不变时返回缓存值           |
| 深层响应 | 懒代理，访问嵌套对象时才创建子 Proxy                   |
| 数组支持 | 拦截 push/pop/splice/shift/unshift 等变异方法          |
| 循环依赖 | effect 执行前先清理旧依赖，避免无限循环                |

## Diff 算法

- 支持 `key` 属性标识节点身份
- 双端对比：头头、尾尾、头尾、尾头 四条快速路径
- 剩余节点用 Map 查找，最小化 DOM 移动
- Fragment 支持多根节点
- 独立 TextVNode 类型，文本变更直接 `textContent` 赋值

## 生命周期

```
createApp(App).mount('#app')
        │
        ▼
  setup() 执行 ──→ onMounted 回调入队
        │
        ▼
  首次 render() ──→ mount DOM
        │
        ▼
  flush onMounted 队列
        │
  ┌─────┴─────┐
  │ 响应式变化  │ ──→ render() ──→ patch DOM ──→ onUpdated
  └─────┬─────┘
        │
  unmount 时 ──→ onUnmounted
```

精简为 4 个：

- `onMounted(fn)` — DOM 挂载后
- `onUnmounted(fn)` — DOM 移除前
- `onUpdated(fn)` — 组件重新渲染后
- `onError(fn)` — 子树错误捕获

## 可选路由（kairo/router）

```ts
import { createRouter, useRoute, useRouter } from 'kairo/router'

const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/post/:id', component: Post }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

// 组件内
const route = useRoute() // reactive 的当前路由信息
const { push, back } = useRouter()
```

## 项目结构

```
kairo/
├── src/
│   ├── reactivity/
│   │   ├── effect.ts          # ReactiveEffect, track, trigger
│   │   ├── ref.ts             # ref, isRef, unref
│   │   ├── reactive.ts        # reactive, isReactive
│   │   ├── computed.ts        # computed
│   │   ├── watch.ts           # watchEffect, watch
│   │   └── index.ts
│   ├── vdom/
│   │   ├── vnode.ts           # h, Fragment, createTextVNode
│   │   ├── patch.ts           # diff + DOM 操作
│   │   ├── scheduler.ts       # 微任务调度队列
│   │   └── index.ts
│   ├── component/
│   │   ├── define.ts          # defineComponent
│   │   ├── instance.ts        # 组件实例、上下文栈
│   │   ├── lifecycle.ts       # onMounted, onUnmounted...
│   │   ├── props.ts           # props 响应化处理
│   │   └── index.ts
│   ├── app/
│   │   ├── createApp.ts       # createApp, mount, use
│   │   └── index.ts
│   ├── router/                # 独立入口 kairo/router
│   │   ├── index.ts
│   │   ├── router.ts
│   │   ├── history.ts
│   │   └── matcher.ts
│   ├── store/                 # 独立入口 kairo/store
│   │   ├── index.ts
│   │   └── store.ts
│   ├── jsx-runtime.ts         # jsxImportSource 支持
│   └── index.ts               # 主入口导出
├── dist/
│   ├── kairo.es.js            # ESM
│   ├── kairo.umd.js           # UMD（全局 Kairo）
│   └── kairo.d.ts             # 类型声明
├── examples/
│   ├── cdn.html               # CDN + htm 示例
│   └── vite-app/              # Vite + JSX 示例
├── docs/
│   └── design.md              # 本方案文档
├── package.json
├── tsconfig.json
└── build.config.ts
```

## 构建配置

```json
{
  "name": "kairo",
  "exports": {
    ".": {
      "import": "./dist/kairo.es.js",
      "require": "./dist/kairo.umd.js",
      "types": "./dist/kairo.d.ts"
    },
    "./jsx-runtime": {
      "import": "./dist/jsx-runtime.es.js",
      "types": "./dist/jsx-runtime.d.ts"
    },
    "./router": {
      "import": "./dist/router.es.js",
      "types": "./dist/router.d.ts"
    },
    "./store": {
      "import": "./dist/store.es.js",
      "types": "./dist/store.d.ts"
    }
  }
}
```
