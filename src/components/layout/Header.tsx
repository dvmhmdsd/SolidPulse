// ─── components/layout/Header.tsx ────────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   use:clickOutside  — custom directive to close dropdown on outside click
//   use:tooltip       — custom directive for hover tooltip
//   Show              — conditional dropdown panel
//   For               — widget toggle buttons
//
// ─────────────────────────────────────────────────────────────────────────────

import { createSignal, For, Show } from 'solid-js'
import { useAppState } from '@/contexts/AppStateContext'

// ⚠️  IMPORT RULE: directives MUST be imported even if never called directly.
//     Solid's compiler transforms `use:clickOutside` to a clickOutside(el, ...)
//     call — it needs the import to exist in scope.
// ⚠️  Directive imports MUST exist even though TypeScript can't see them used.
//     Solid's Vite plugin transforms `use:clickOutside` → clickOutside(el, ...)
//     at build time, AFTER TypeScript's static analysis runs.
//     noUnusedLocals fires here because TS never sees the `use:` JSX syntax.
//     @ts-ignore is the standard Solid community workaround for this.
// @ts-ignore
import { clickOutside } from '@/directives/clickOutside'
// @ts-ignore
import { tooltip } from '@/directives/tooltip'


export function Header() {
  const { state, toggleTheme, toggleWidget } = useAppState()

  // Controls the widget-visibility dropdown
  const [dropdownOpen, setDropdownOpen] = createSignal(false)

  return (
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          SolidJS Dashboard
        </h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          Phase 6 — directives · Portal · lazy · Dynamic
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">

        {/* ─── SOLID LESSON: use:clickOutside ──────────────────────────────
            `use:clickOutside={handler}` wires the directive to this div.
            When the user clicks anywhere outside, handler() is called.

            The compiler transforms this to:
              clickOutside(divElement, () => handler)

            Note: the value is wrapped in an accessor () => handler
            so the directive can re-read it reactively if it were a signal.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          class="relative"
          use:clickOutside={() => setDropdownOpen(false)}
        >
          {/* ─── use:tooltip — hover tooltip directive ─────────────────────
              The string value is read by the directive on each mouseenter.
              If this were a signal: use:tooltip={mySignal()} it would
              reactively update the tooltip text.
          ──────────────────────────────────────────────────────────────────── */}
          <button
            onClick={() => setDropdownOpen(o => !o)}
            use:tooltip={'Toggle widget visibility'}
            class={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              dropdownOpen()
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-gray-600'
            }`}
          >
            Widgets ▾
          </button>

          <Show when={dropdownOpen()}>
            <div class="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <For each={state.widgets}>
                {(widget) => (
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    class={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      widget.visible
                        ? 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                        : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span class={`h-1.5 w-1.5 rounded-full ${widget.visible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    {widget.label}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          use:tooltip={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 transition-colors dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-gray-600"
        >
          {state.theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>

      </div>
    </header>
  )
}