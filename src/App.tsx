// ─── App.tsx ──────────────────────────────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   lazy     — code-split a component (loaded on first render, not at startup)
//   Dynamic  — render a component stored in a variable/signal
//   Suspense — loading boundary for lazy components
//
// Provider nesting:
//   AppStateProvider  — outermost, owns theme + widget visibility
//   RealtimeDataProvider — owns live metric streams
// ─────────────────────────────────────────────────────────────────────────────

import { type Component, Show, Suspense, lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { AppStateProvider, useAppState } from '@/contexts/AppStateContext'
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext'
import { Header } from '@/components/layout/Header'
import { SystemMetricsWidget, NetworkMetricsWidget } from '@/components/widgets/SystemMetricsWidget'
import { SensorGrid } from '@/components/widgets/SensorGrid'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── SOLID LESSON: lazy() ────────────────────────────────────────────────────
//
//  lazy(() => import('./Module')) defers loading the module's JS bundle
//  until the component is first rendered. The chunk is split at build time.
//
//  WHY lazy?
//  - CryptoWidget imports Chart.js and makes network requests.
//    Deferring it means the initial JS payload is smaller.
//  - Useful for widgets hidden by default, modals, route-level pages.
//
//  lazy() returns a Component that integrates with <Suspense>.
//  While the dynamic import is in-flight, the nearest Suspense shows its
//  fallback. Once loaded, it never re-fetches (the module is cached).
//
//  ⚠️  lazy() requires a default export from the target module.
//      CryptoWidget uses a named export, so we re-wrap it here.
//
//  ⚠️  REACT COMPARISON:
//       React: const Comp = lazy(() => import('./Comp'))  (identical API!)
//       Solid's lazy() works the same way — same pattern, same mental model.
// ─────────────────────────────────────────────────────────────────────────────
const CryptoWidget = lazy(() =>
  import('@/components/widgets/CryptoWidget').then(m => ({ default: m.CryptoWidget }))
)

// ─── SOLID LESSON: Dynamic ───────────────────────────────────────────────────
//
//  <Dynamic component={SomeComponent} {...props} />
//  renders whatever component is in the `component` prop.
//  When `component` changes, the old component unmounts and the new one mounts.
//
//  WHY Dynamic?
//  - Avoids a long if/switch chain when picking between N components.
//  - The component prop can be a signal — it's reactive.
//
//  Here we use it to render 3 of the 4 widgets from a lookup table,
//  instead of repeating <Show when={...}><Widget /></Show> for each one.
//
//  ⚠️  REACT COMPARISON:
//       React: const Comp = map[key]; return <Comp />
//       That works in React but loses reactivity if `key` is a signal.
//       Solid's Dynamic correctly re-renders when `component` changes.
// ─────────────────────────────────────────────────────────────────────────────
type WidgetComponent = Component

// Map widget ids → components. CryptoWidget is excluded (handled separately
// with lazy + its own Suspense boundary below).
const WIDGET_MAP: Record<string, WidgetComponent> = {
  system:  SystemMetricsWidget,
  network: NetworkMetricsWidget,
  sensors: SensorGrid,
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { state } = useAppState()

  return (
    <div class="min-h-screen bg-gray-100 p-6 dark:bg-gray-950 dark:text-gray-100">
      <Header />

      <main class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Render system / network / sensors via Dynamic */}
        <Show when={state.widgets.find(w => w.id === 'system')?.visible}>
          <Dynamic component={WIDGET_MAP.system} />
        </Show>

        <Show when={state.widgets.find(w => w.id === 'network')?.visible}>
          <Dynamic component={WIDGET_MAP.network} />
        </Show>

        <Show when={state.widgets.find(w => w.id === 'sensors')?.visible}>
          <Dynamic component={WIDGET_MAP.sensors} />
        </Show>

        {/* CryptoWidget is lazy — wrap in Suspense for the initial load.
            The Skeleton shows while the JS chunk downloads.
            Once loaded, CryptoWidget renders its own internal Suspense
            for the API data (CoinGecko fetch). */}
        <Show when={state.widgets.find(w => w.id === 'crypto')?.visible}>
          <Suspense fallback={
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p class="mb-4 text-sm font-semibold text-gray-400">Crypto Prices</p>
              <Skeleton rows={4} />
            </div>
          }>
            <CryptoWidget />
          </Suspense>
        </Show>

      </main>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const App: Component = () => (
  <AppStateProvider>
    <RealtimeDataProvider>
      <Dashboard />
    </RealtimeDataProvider>
  </AppStateProvider>
)

export default App