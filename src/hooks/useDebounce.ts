// ─── hooks/useDebounce.ts ─────────────────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createSignal  — local state for the debounced output value
//   createEffect  — side effect that re-runs when the source signal changes
//   on()          — explicit dependency declaration (opt-in vs auto-tracking)
//   onCleanup     — cancel the pending timer when the effect re-runs
//
// ─────────────────────────────────────────────────────────────────────────────

import { createSignal, createEffect, on, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

// ─── SOLID LESSON: on() — explicit dependency tracking ───────────────────────
//
//  By default, createEffect() AUTOMATICALLY tracks every signal/memo read
//  inside its body. This is Solid's "implicit tracking" model.
//
//  on(deps, fn) lets you OPT OUT of auto-tracking and declare deps explicitly:
//    - deps:  a signal (or array of signals) you want to watch
//    - fn:    runs only when those specific deps change;
//             any other signals read inside fn are NOT subscribed to
//
//  SYNTAX:
//    createEffect(on(sourceSignal, (newValue, prevValue) => { ... }))
//
//  OPTION: { defer: true }
//    By default on() runs fn once immediately (like useEffect with no dep array).
//    defer: true skips the initial run — fn only fires on subsequent changes.
//    Here we use defer:true because we already initialize debounced = source(),
//    so there's no reason to schedule a timer at mount.
//
//  ⚠️  REACT COMPARISON:
//       React:  useEffect(() => { ... }, [source])   — manual dep array required
//       Solid:  createEffect(() => { source(); ... }) — auto-tracking (no array)
//       Solid:  createEffect(on(source, fn))          — explicit, like React's model
//
//  Use on() when you want predictable, auditable deps — similar to how React
//  devs think. Auto-tracking is more ergonomic but on() is easier to reason
//  about in complex effects with multiple signal reads.
//
// ─────────────────────────────────────────────────────────────────────────────

export function useDebounce<T>(source: Accessor<T>, delay = 300): Accessor<T> {
  // Initialize with current value so consumers never see an "empty" state.
  const [debounced, setDebounced] = createSignal<T>(source())

  createEffect(on(
    source,        // Watch ONLY this signal
    (value) => {
      // Schedule an update after `delay` ms.
      const timer = setTimeout(() => {
        // Cast note: Solid's setter (Setter<T>) treats function values as
        // updater callbacks. To safely store any T — including function types —
        // cast to a plain value setter. For primitive T (string, number) this
        // is equivalent to setDebounced(value).
        ;(setDebounced as (v: T) => void)(value)
      }, delay)

      // ─── SOLID LESSON: onCleanup inside createEffect ──────────────────────
      //
      //  When createEffect re-runs (because `source` changed again before the
      //  timer fired), onCleanup runs FIRST — cancelling the previous timer.
      //  This is the debounce mechanism: reset the countdown on every change.
      //
      //  onCleanup(fn) also runs when the component unmounts, preventing
      //  setState calls on a dead component.
      //
      //  ⚠️  REACT COMPARISON:
      //       React: useEffect(() => { ...; return () => clearTimeout(timer) }, [source])
      //       Solid: onCleanup(() => clearTimeout(timer))  — called inside the effect
      //       Solid's pattern reads more naturally: setup → onCleanup is co-located.
      // ────────────────────────────────────────────────────────────────────────
      onCleanup(() => clearTimeout(timer))
    },
    { defer: true }   // Don't fire on mount — initial value is already set above
  ))

  return debounced
}