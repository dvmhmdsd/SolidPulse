// ─── pages/SensorDetailPage.tsx ──────────────────────────────────────────────
//
// SOLID ROUTER APIS DEMONSTRATED HERE:
//   useParams    — read dynamic route params (e.g. :id from /sensors/:id)
//   useNavigate  — programmatic navigation (back button)
//
// ─────────────────────────────────────────────────────────────────────────────

import { createMemo, createSignal, createEffect, on, Show } from 'solid-js'
import { useParams, useNavigate } from '@solidjs/router'
import { useRealtimeData } from '@/contexts/RealtimeDataContext'

// ─── SOLID ROUTER LESSON: useParams ─────────────────────────────────────────
//
//  useParams() returns a REACTIVE object whose properties match the dynamic
//  segments defined in the route path.
//
//  Route definition:  <Route path="/sensors/:id" component={SensorDetailPage} />
//  URL visited:       /sensors/s3
//  Result:            useParams().id === "s3"
//
//  The returned object is a Solid store proxy — reading params.id inside JSX
//  or a memo creates a reactive subscription. If the URL changes (e.g. via
//  navigate('/sensors/s4')), params.id updates and dependent computations re-run.
//
//  ⚠️  REACT COMPARISON:
//       React Router: const { id } = useParams()  — plain object, NOT reactive
//       Solid Router: const params = useParams()  — store proxy, IS reactive
//       In React you'd need useEffect([id]) to react to param changes.
//       In Solid, reading params.id IS the subscription — no extra step.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── SOLID ROUTER LESSON: useNavigate ───────────────────────────────────────
//
//  useNavigate() returns a function: navigate(path, options?)
//
//  Options:
//    replace: true   — replace current history entry instead of pushing
//    state: {}       — attach state to the history entry (readable via useLocation().state)
//    scroll: false   — don't scroll to top on navigation
//
//  navigate(-1)   — go back (equivalent to history.back())
//  navigate('/path') — go to a URL
//
//  ⚠️  REACT COMPARISON:
//       React Router v6: const navigate = useNavigate(); navigate('/path')
//       Solid Router:    const navigate = useNavigate(); navigate('/path')
//       API is nearly identical.
//
// ─────────────────────────────────────────────────────────────────────────────

function isOutOfRange(value: number, min: number, max: number) {
  return value < min || value > max
}

const MAX_HISTORY = 30

export function SensorDetailPage() {
  const params   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sensors } = useRealtimeData()

  // Look up the sensor reactively.
  // sensors is a store array — reading sensors.find(...) here in a memo creates
  // a subscription to the matching sensor's properties.
  const sensor = createMemo(() => sensors.find(s => s.id === params.id))

  // History of values for sparkline — same pattern as SystemMetricsWidget.
  const [history, setHistory] = createSignal<number[]>([])

  // Re-run only when sensor().value changes. If params.id changes (navigating
  // from /sensors/s1 to /sensors/s2), sensor() changes, clearing the history.
  createEffect(on(
    () => sensor()?.value,
    (value) => {
      if (value === undefined) return
      setHistory(h => [...h.slice(-(MAX_HISTORY - 1)), value])
    },
    { defer: true }
  ))

  return (
    // Show renders nothing if sensor() is undefined (invalid ID in URL).
    // The fallback shows a "not found" message.
    <Show
      when={sensor()}
      fallback={
        <div class="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p class="text-gray-500">Sensor <code class="font-mono">{params.id}</code> not found.</p>
          <button
            onClick={() => navigate('/sensors')}
            class="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-600"
          >
            ← Back to sensors
          </button>
        </div>
      }
    >
      {(s) => {
        const alert = () => isOutOfRange(s().value, s().min, s().max)

        return (
          <div class="max-w-md space-y-4">

            {/* Back button — useNavigate(-1) goes to previous history entry */}
            <button
              onClick={() => navigate(-1)}
              class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← Back
            </button>

            <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-5">

              {/* Header */}
              <div class="flex items-start justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{s().name}</h2>
                  <p class="mt-0.5 text-sm capitalize text-gray-500 dark:text-gray-400">{s().type}</p>
                </div>
                <Show when={alert()}>
                  <span class="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                    Out of range
                  </span>
                </Show>
              </div>

              {/* Live value */}
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p class="text-xs text-gray-500 dark:text-gray-400">Current value</p>
                <p class={`mt-1 font-mono text-3xl font-bold ${alert() ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                  {s().value.toFixed(s().type === 'pressure' ? 0 : 1)}
                  <span class="ml-1 text-lg font-normal text-gray-500">{s().unit}</span>
                </p>
              </div>

              {/* Range */}
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Min safe</p>
                  <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {s().min}{s().unit}
                  </p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Max safe</p>
                  <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {s().max}{s().unit}
                  </p>
                </div>
              </div>

              {/* History sparkline */}
              <Show when={history().length > 1}>
                <div class="border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p class="mb-2 text-xs text-gray-400">Value trend ({history().length} samples)</p>
                  <svg class="h-12 w-full" viewBox={`0 0 ${MAX_HISTORY - 1} 100`} preserveAspectRatio="none">
                    {/* Safe range band */}
                    <rect
                      x="0" y={100 - s().max} width={MAX_HISTORY - 1}
                      height={s().max - s().min}
                      fill="rgba(99,102,241,0.08)"
                    />
                    {/* Value line */}
                    <polyline
                      fill="none"
                      stroke={alert() ? '#ef4444' : '#6366f1'}
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      points={history().map((v, i) => {
                        // Normalize value to 0–100 SVG units based on sensor range
                        const range = (s().max + 5) - (s().min - 5)
                        const y = 100 - ((v - (s().min - 5)) / range) * 100
                        return `${i},${Math.max(0, Math.min(100, y))}`
                      }).join(' ')}
                    />
                  </svg>
                  <div class="mt-1 flex justify-between text-xs text-gray-400">
                    <span>older</span>
                    <span>now</span>
                  </div>
                </div>
              </Show>

              {/* Sensor ID — from useParams */}
              <p class="text-xs text-gray-400">
                ID: <code class="font-mono">{params.id}</code>
                {' · '}
                <span class="italic">live via useParams + store subscription</span>
              </p>

            </div>
          </div>
        )
      }}
    </Show>
  )
}