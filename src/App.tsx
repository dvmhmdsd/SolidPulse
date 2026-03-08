// App.tsx — Root component
// Phase 1: Minimal shell. Providers and widgets will be added incrementally.
import type { Component } from 'solid-js'

const App: Component = () => {
  return (
    <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white">SolidJS Dashboard</h1>
        <p class="text-gray-400 mt-1">Learning SolidJS fine-grained reactivity</p>
      </header>

      <main class="grid gap-4">
        {/* Widgets will be added here in later phases */}
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-500">
          Phase 1 complete — foundation is ready. Next: add contexts &amp; widgets.
        </div>
      </main>
    </div>
  )
}

export default App