import type { ReactiveEffect } from '../reactivity/effect'

const queue: Set<ReactiveEffect> = new Set()
let isFlushing = false
let isFlushPending = false

const resolvedPromise = Promise.resolve()

let pendingPostFlushCbs: Array<() => void> = []

export function queueJob(job: ReactiveEffect): void {
  queue.add(job)
  queueFlush()
}

function queueFlush(): void {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    resolvedPromise.then(flushJobs)
  }
}

function flushJobs(): void {
  isFlushPending = false
  isFlushing = true
  try {
    queue.forEach((job) => job.run())
  } finally {
    queue.clear()
    isFlushing = false
    flushPostFlushCbs()
  }
}

export function queuePostFlushCb(cb: () => void): void {
  pendingPostFlushCbs.push(cb)
  queueFlush()
}

function flushPostFlushCbs(): void {
  if (pendingPostFlushCbs.length === 0) return
  const cbs = [...new Set(pendingPostFlushCbs)]
  pendingPostFlushCbs = []
  cbs.forEach((cb) => cb())
}

export function nextTick(fn?: () => void): Promise<void> {
  return fn ? resolvedPromise.then(fn) : resolvedPromise
}
