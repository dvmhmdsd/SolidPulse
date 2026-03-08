// ─── components/layout/Header.tsx ────────────────────────────────────────────
//
// Consumes AppStateContext to:
//   - Show a theme toggle button (dark ↔ light)
//   - Show widget visibility toggles
//
// SOLID APIS USED:
//   For    — render the widget toggle buttons
//   Show   — conditionally show a checkmark on visible widgets
// ─────────────────────────────────────────────────────────────────────────────

import { For, Show } from 'solid-js'
import { useAppState } from '@/contexts/AppStateContext'

export function Header() {
  const { state, toggleTheme, toggleWidget } = useAppState()

  return (
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

      {/* Title block */}
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          SolidJS Dashboard
        </h1>
      </div>

      {/* Controls */}
      <div class="flex flex-wrap items-center gap-2">

        {/* Widget visibility toggles */}
        <For each={state.widgets}>
          {(widget) => (
            <button
              onClick={() => toggleWidget(widget.id)}
              class={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                widget.visible
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                  : 'border-gray-700 bg-gray-800/50 text-gray-500 hover:border-gray-600 hover:text-gray-400'
              }`}
            >
              {/* Show is perfect here: a small conditional inside a larger render */}
              <Show when={widget.visible}>
                <span>✓</span>
              </Show>
              {widget.label}
            </button>
          )}
        </For>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          class="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs font-medium text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
          title="Toggle theme"
        >
          {/* Reading state.theme subscribes this expression to re-render on change.
              No memo needed here — it's a single cheap read in JSX. */}
          {state.theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>

      </div>
    </header>
  )
}