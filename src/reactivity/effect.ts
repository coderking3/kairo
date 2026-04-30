export type EffectFn = () => void

let activeEffect: ReactiveEffect | null = null
const effectStack: ReactiveEffect[] = []

const targetMap = new WeakMap<
  object,
  Map<string | symbol, Set<ReactiveEffect>>
>()

export class ReactiveEffect {
  private _fn: EffectFn
  public deps: Set<Set<ReactiveEffect>> = new Set()
  public scheduler?: (effect: ReactiveEffect) => void
  private _active = true

  constructor(fn: EffectFn, scheduler?: (effect: ReactiveEffect) => void) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run(): any {
    if (!this._active) return this._fn()
    cleanupEffect(this)
    // eslint-disable-next-line typescript/no-this-alias
    activeEffect = this
    effectStack.push(this)
    try {
      return this._fn()
    } finally {
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1] || null
    }
  }

  stop(): void {
    if (this._active) {
      cleanupEffect(this)
      this._active = false
    }
  }
}

function cleanupEffect(eff: ReactiveEffect): void {
  for (const dep of eff.deps) {
    dep.delete(eff)
  }
  eff.deps.clear()
}

export function track(target: object, key: string | symbol): void {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  dep.add(activeEffect)
  activeEffect.deps.add(dep)
}

export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  const effectsToRun = new Set(dep)
  effectsToRun.forEach((eff) => {
    if (eff === activeEffect) return
    if (eff.scheduler) {
      eff.scheduler(eff)
    } else {
      eff.run()
    }
  })
}

export function effect(
  fn: EffectFn,
  options?: { scheduler?: (eff: ReactiveEffect) => void }
): ReactiveEffect {
  const _effect = new ReactiveEffect(fn, options?.scheduler)
  _effect.run()
  return _effect
}
