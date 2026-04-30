import type { Ref } from './ref'
import { ReactiveEffect, track, trigger } from './effect'

class ComputedRefImpl<T> {
  private _value!: T
  private _dirty = true
  private _effect: ReactiveEffect
  public readonly __k_isRef = true

  constructor(getter: () => T) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        trigger(this as any, 'value')
      }
    })
  }

  get value(): T {
    track(this as any, 'value')
    if (this._dirty) {
      this._value = this._effect.run()
      this._dirty = false
    }
    return this._value
  }
}

export function computed<T>(getter: () => T): Readonly<Ref<T>> {
  return new ComputedRefImpl(getter) as any
}
