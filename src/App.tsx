// ─── App.tsx ──────────────────────────────────────────────────────────────────
//
// Provider nesting order matters:
//   AppStateProvider  — outermost, owns theme + widget visibility
//   RealtimeDataProvider — owns live metric streams
//
// Both are available to all descendants via their custom hooks.
// ─────────────────────────────────────────────────────────────────────────────

import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { AppStateProvider, useAppState } from '@/contexts/AppStateContext'
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext'
import { Header } from '@/components/layout/Header'
import { SystemMetricsWidget, NetworkMetricsWidget } from '@/components/widgets/SystemMetricsWidget'
import { CryptoWidget } from '@/components/widgets/CryptoWidget'

// ─── Dashboard — inner component (has access to both contexts) ────────────────
// Separated from App so we can call useAppState() inside the provider tree.
function Dashboard() {
  const { state } = useAppState()

  // ─── SOLID LESSON: reading store in JSX ───────────────────────────────────
  //
  //  state.theme is a store property — reading it in JSX creates a subscription.
  //  When toggleTheme() calls setState('theme', ...), only the JSX expressions
  //  that read state.theme re-render, not the whole Dashboard.
  //
  //  The `dark` class on the wrapper div combined with Tailwind's darkMode:'class'
  //  config means every `dark:` variant inside this tree activates when the
  //  class is present. The createEffect in AppStateContext toggles it on <html>.
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div class="min-h-screen bg-gray-100 p-6 dark:bg-gray-950 dark:text-gray-100">
      <Header />

      <main class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* ─── SOLID LESSON: Show for widget visibility ──────────────────────
            Each Show reads state.widgets[n].visible from the store.
            Because the store is a Proxy, only the Show for the toggled widget
            re-evaluates — the others are unaffected.

            We look up the widget config by id to keep the condition
            co-located with the component it guards.
        ──────────────────────────────────────────────────────────────────── */}
        <Show when={state.widgets.find(w => w.id === 'system')?.visible}>
          <SystemMetricsWidget />
        </Show>

        <Show when={state.widgets.find(w => w.id === 'network')?.visible}>
          <NetworkMetricsWidget />
        </Show>

        <Show when={state.widgets.find(w => w.id === 'crypto')?.visible}>
          <CryptoWidget />
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