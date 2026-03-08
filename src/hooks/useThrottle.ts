// ─── hooks/useThrottle.ts ─────────────────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createSignal  — local state for the throttled output value
//   createEffect  — reactive effect that runs when source changes
//   on()          — explicit dependency declaration (same lesson as useDebounce)
//   onCleanup     — component-level cleanup to cancel any pending flush
//
// THROTTLE vs DEBOUNCE:
//   Debounce  — waits for the source to STOP changing for `delay` ms, then fires.
//               Best for: search inputs, resize handlers.
//
//   Throttle  — fires at most once per `interval` ms even if source changes faster.
//               If source changes mid-interval, the latest value is scheduled
//               for the end of the current interval.
//               Best for: high-frequency signals you want to downsample (e.g.
//               a 250ms realtime feed displayed at 1s intervals).
//
// ─────────────────────────────────────────────────────────────────────────────

import { createSignal, createEffect, on, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

export function useThrottle<T>(source: Accessor<T>, interval = 500): Accessor<T> {
  const [throttled, setThrottled] = createSignal<T>(source())

  // Mutable vars — these live OUTSIDE the reactive graph.
  // They're plain closure state, not signals, because we don't need
  // anything to re-run when they change — they're just bookkeeping.
  let lastRun = 0
  let scheduled: ReturnType<typeof setTimeout> | null = null

  // ─── Component-level cleanup ──────────────────────────────────────────────
  //  If the component that owns this hook unmounts while a scheduled update
  //  is pending, we cancel it here. This onCleanup is attached to the
  //  component's reactive scope (not to the inner createEffect scope).
  //
  //  TIP: onCleanup() can be called anywhere during component setup —
  //  inside createEffect, onMount, or at the top level like here.
  //  Solid attaches it to the current reactive owner (component / effect).
  // ─────────────────────────────────────────────────────────────────────────
  onCleanup(() => {
    if (scheduled !== null) { clearTimeout(scheduled); scheduled = null }
  })

  createEffect(on(
    source,
    (value) => {
      const now = Date.now()
      const elapsed = now - lastRun
      const remaining = interval - elapsed

      // Cancel any previously scheduled trailing update — we have a newer value.
      if (scheduled !== null) { clearTimeout(scheduled); scheduled = null }

      if (remaining <= 0) {
        // We've waited long enough since the last fire — update immediately.
        lastRun = now
        ;(setThrottled as (v: T) => void)(value)
      } else {
        // Still within the throttle window. Schedule the update for when
        // the interval expires ("trailing edge" throttle).
        scheduled = setTimeout(() => {
          scheduled = null
          lastRun = Date.now()
          ;(setThrottled as (v: T) => void)(value)
        }, remaining)
      }
    },
    { defer: true }
  ))

  return throttled
}