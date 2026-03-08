// ─── contexts/RealtimeDataContext.tsx ────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createSignal   — primitive reactive values
//   createStore    — structured reactive state (nested objects / arrays)
//   batch()        — group multiple updates into one reactive flush
//   createContext  — share state across the component tree
//   useContext     — consume that shared state
//   onMount        — run code after the component mounts to the DOM
//   onCleanup      — tear down timers / subscriptions when component unmounts
//
// WHY A CONTEXT?
//   Multiple widgets will consume the same live data. Instead of prop-drilling
//   (passing data down through every parent), we put it in a context so any
//   descendant can read it directly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  createSignal,
  batch,
  onMount,
  onCleanup,
  type ParentComponent,
} from 'solid-js'
// createStore lives in a separate sub-package — a key Solid detail.
// solid-js/store contains: createStore, produce, reconcile (covered in Phase 4)
import { createStore } from 'solid-js/store'
import type { SystemMetrics, NetworkMetrics } from '@/types/metrics'
import type { Sensor } from '@/types/iot'
import {
  initialSystemMetrics,
  initialNetworkMetrics,
  nextSystemMetrics,
  nextNetworkMetrics,
} from '@/services/simulators/systemMetrics'
import { INITIAL_SENSORS, nextSensorValues } from '@/services/simulators/iotSensors'

// ─── SOLID LESSON: createSignal vs createStore ───────────────────────────────
//
//  createSignal  → for a SINGLE primitive value (number, string, boolean).
//                  Getter/setter returned as a tuple: [get, set].
//                  Reading get() inside JSX or effects creates a subscription.
//
//  createStore   → for OBJECTS with multiple properties you want to update
//                  independently. Under the hood Solid wraps it in a Proxy,
//                  so reading store.cpu only subscribes to `cpu`, not the
//                  whole object. This is the key to fine-grained reactivity.
//
//  ⚠️  REACT MINDSET TRAP: In React you'd write
//       const [metrics, setMetrics] = useState({ cpu: 0, memory: 0 })
//       setMetrics(prev => ({ ...prev, cpu: 50 }))   // whole object replaced
//       → every consumer of `metrics` re-renders even if only cpu changed.
//
//  ✅  In Solid with createStore:
//       setSystem('cpu', 50)  // only components reading system.cpu re-render
// ─────────────────────────────────────────────────────────────────────────────

// We use createSignal for `updateCount` — it's a single number used for
// debugging. We use createStore for system/network — they're objects where
// properties should be independently reactive.

// ─── Context value type ───────────────────────────────────────────────────────
interface RealtimeDataContextValue {
  system:      SystemMetrics
  network:     NetworkMetrics
  sensors:     Sensor[]        // Store array — createSelector in SensorGrid tracks this
  updateCount: () => number
}

// createContext() takes an optional default value used when no Provider is
// found above in the tree. We use `undefined` here so we can throw a helpful
// error if someone uses the hook outside the provider.
const RealtimeDataContext = createContext<RealtimeDataContextValue>()

// ─── Provider component ───────────────────────────────────────────────────────
// ParentComponent is a Solid type that adds `children` to props automatically.
export const RealtimeDataProvider: ParentComponent = (props) => {

  // createStore returns [store, setter].
  // `store` is a Proxy — reading store.cpu subscribes only to `cpu`.
  const [system, setSystem] = createStore<SystemMetrics>(initialSystemMetrics)
  const [network, setNetwork] = createStore<NetworkMetrics>(initialNetworkMetrics)
  // Sensors stored as an array in a store — reconcile() will update it efficiently.
  // createSelector in SensorGrid will ensure only changed rows re-render.
  const [sensors, setSensors] = createStore<Sensor[]>(INITIAL_SENSORS)

  const [updateCount, setUpdateCount] = createSignal(0)

  // ─── SOLID LESSON: batch() ─────────────────────────────────────────────────
  //
  //  Solid, like React, normally re-runs effects/computations immediately
  //  when a signal/store changes. Without batch(), updating cpu then memory
  //  would trigger two separate reactive flushes.
  //
  //  batch() defers all updates inside the callback until the end, then
  //  flushes them all at once — one reactive pass, not N.
  //
  //  This is critical in high-frequency loops (250ms) where we update
  //  many values simultaneously.
  //
  //  ⚠️  REACT COMPARISON: React's useState batches inside event handlers
  //       automatically (React 18+) but NOT inside async callbacks / timers.
  //       Solid's batch() gives you explicit control anywhere.
  // ──────────────────────────────────────────────────────────────────────────
  function tick() {
    batch(() => {
      // Store path-based setters:  setStore('property', newValue)
      // OR pass a partial object:  setStore({ cpu: 50, memory: 60 })
      // OR use produce() for complex nested mutations (covered in Phase 4)
      setSystem(nextSystemMetrics(system))
      setNetwork(nextNetworkMetrics(network))
      setSensors(nextSensorValues(sensors))
      setUpdateCount(n => n + 1)
    })
  }

  // ─── SOLID LESSON: onMount + onCleanup ────────────────────────────────────
  //
  //  onMount  → runs once after the component's DOM is inserted.
  //             Equivalent to useEffect(() => { ... }, []) in React.
  //             But in Solid it's a named function — clearer intent.
  //
  //  onCleanup → runs when the component (or reactive scope) is destroyed.
  //              In Solid, cleanup is *always* co-located with the setup code
  //              that needs cleaning. You call onCleanup() INSIDE the same
  //              scope as the setup (inside onMount, inside createEffect, etc.)
  //              This is much less error-prone than React's cleanup return.
  //
  //  ⚠️  REACT COMPARISON:
  //       React:  useEffect(() => { const id = setInterval(...); return () => clearInterval(id) }, [])
  //       Solid:  onMount(() => { const id = setInterval(...); onCleanup(() => clearInterval(id)) })
  //               The cleanup is *inside* the setup — reads naturally.
  // ──────────────────────────────────────────────────────────────────────────
  onMount(() => {
    const id = setInterval(tick, 250) // Update every 250ms
    onCleanup(() => clearInterval(id))
  })

  const value: RealtimeDataContextValue = {
    system,
    network,
    sensors,
    updateCount,
  }

  return (
    <RealtimeDataContext.Provider value={value}>
      {props.children}
    </RealtimeDataContext.Provider>
  )
}

// ─── Custom hook ──────────────────────────────────────────────────────────────
// Wrapping useContext in a custom hook is the standard Solid pattern.
// It lets us validate the context was used inside the provider.
export function useRealtimeData(): RealtimeDataContextValue {
  const ctx = useContext(RealtimeDataContext)
  if (!ctx) {
    throw new Error('useRealtimeData must be used inside <RealtimeDataProvider>')
  }
  return ctx
}