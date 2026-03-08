// ─── App.tsx ─────────────────────────────────────────────────────────────────
//
// Root component. Its job is to:
//   1. Wrap the tree in context providers (data available to all descendants)
//   2. Compose the page layout
//
// As we add phases, more providers and widgets will be added here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Component } from 'solid-js'
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext'
import { SystemMetricsWidget } from '@/components/widgets/SystemMetricsWidget'

const App: Component = () => {
  return (
    // RealtimeDataProvider owns the interval and shared state.
    // Everything inside it can call useRealtimeData().
    <RealtimeDataProvider>
      <div class="min-h-screen bg-gray-950 text-gray-100 p-6">

        <header class="mb-8">
          <h1 class="text-3xl font-bold text-white">SolidJS Dashboard</h1>
          <p class="text-gray-400 mt-1">
            Phase 2 — createSignal · createStore · createMemo · batch · Show · For
          </p>
        </header>

        <main class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SystemMetricsWidget />
          {/* More widgets will be added in later phases */}
        </main>

      </div>
    </RealtimeDataProvider>
  )
}

export default App