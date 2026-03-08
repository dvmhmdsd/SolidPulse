// ─── components/widgets/SensorGrid.tsx ───────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createSelector  — optimized selection state for lists
//   For             — reactive list rendering
//   Index           — static-length list rendering (tab bar)
//   Show            — conditional alert badge
//   createMemo      — derived alert count
//   createSignal    — selected sensor id + active filter tab
//   Portal          — render a toast outside the widget's DOM parent
//
// ─────────────────────────────────────────────────────────────────────────────

import { createSignal, createMemo, createSelector, For, Index, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { useRealtimeData } from '@/contexts/RealtimeDataContext'
import type { Sensor, SensorType } from '@/types/iot'

// ─── SOLID LESSON: createSelector ────────────────────────────────────────────
//
//  Problem: you have a list of 100 sensors and a "selected" signal.
//  When the user clicks sensor #42, the selection changes.
//
//  NAIVE approach — pass isSelected to each row:
//    <For each={sensors}>
//      {(s) => <Row selected={selectedId() === s.id} />}
//    </For>
//
//  What happens on selection change:
//    selectedId() changes → the expression `selectedId() === s.id` is
//    re-evaluated for EVERY row → all 100 rows re-render.
//    Only 2 actually changed (old selected → deselected, new → selected).
//
//  OPTIMIZED approach — createSelector:
//    const isSelected = createSelector(selectedId)
//    <For each={sensors}>
//      {(s) => <Row selected={isSelected(s.id)} />}
//    </For>
//
//  createSelector(sourceSignal) returns a function `isSelected(value)`.
//  Each call to isSelected(s.id) creates a SEPARATE subscription that only
//  re-runs when:
//    a) s.id === old selectedId  (just got deselected)
//    b) s.id === new selectedId  (just got selected)
//
//  Result: only 2 rows re-render instead of 100.
//  This is Solid's answer to the "selected item in a list" performance problem.
//
//  ⚠️  REACT COMPARISON:
//       React has no built-in equivalent. You'd use memo() + a context trick,
//       or a state management library. Solid solves this natively.
// ─────────────────────────────────────────────────────────────────────────────

// ─── SOLID LESSON: Index vs For ──────────────────────────────────────────────
//
//  For   — keyed by IDENTITY. When the array changes, Solid diffs by item
//           identity. Items that move/change get re-rendered; stable items
//           keep their DOM. Best for dynamic arrays (add/remove/reorder).
//           Render fn: (item: T, index: Accessor<number>) => JSX
//           `item` is the VALUE (not reactive on its own)
//           `index` is a Signal<number> (reactive)
//
//  Index — keyed by INDEX position. Each slot is stable; only the VALUE
//           at that slot changes. Best for fixed-length arrays.
//           Render fn: (item: Accessor<T>, index: number) => JSX
//           `item` is a SIGNAL (reactive accessor)
//           `index` is a plain number (not reactive)
//
//  Here we use Index for the filter tabs (fixed set: All, Temp, Humidity, Pressure)
//  and For for the sensor cards (dynamic filtered list).
// ─────────────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | SensorType

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',         label: 'All'         },
  { id: 'temperature', label: 'Temperature' },
  { id: 'humidity',    label: 'Humidity'    },
  { id: 'pressure',    label: 'Pressure'    },
]

function isOutOfRange(sensor: Sensor): boolean {
  return sensor.value < sensor.min || sensor.value > sensor.max
}

function formatValue(sensor: Sensor): string {
  return sensor.value.toFixed(sensor.type === 'pressure' ? 0 : 1) + sensor.unit
}

// ─── Single sensor card ───────────────────────────────────────────────────────
interface SensorCardProps {
  sensor:   Sensor
  selected: boolean          // driven by createSelector — only re-renders on change
  onSelect: () => void
}

function SensorCard(props: SensorCardProps) {
  const alert = () => isOutOfRange(props.sensor)

  return (
    <button
      onClick={props.onSelect}
      class={`w-full text-left rounded-lg border p-3 transition-colors ${
        props.selected
          ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600'
      }`}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
            {props.sensor.name}
          </p>
          <p class={`mt-0.5 font-mono text-lg font-semibold ${
            alert() ? 'text-red-500' : 'text-gray-900 dark:text-white'
          }`}>
            {formatValue(props.sensor)}
          </p>
        </div>
        {/* Show renders the alert badge only when the sensor is out of range.
            It re-renders independently of the parent card. */}
        <Show when={alert()}>
          <span class="mt-0.5 shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-500">
            !</span>
        </Show>
      </div>
      <p class="mt-1 text-xs text-gray-400 capitalize">{props.sensor.type}</p>
    </button>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export function SensorGrid() {
  const { sensors } = useRealtimeData()

  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [activeTab, setActiveTab]   = createSignal<FilterTab>('all')

  // createSelector — the key optimization for list selection.
  // isSelected(id) returns true only for the currently selected id.
  // Each SensorCard subscribes only to changes that affect its own id.
  const isSelected = createSelector(selectedId)

  // Derived memo: filter sensors by active tab.
  // Re-runs only when activeTab() changes or sensors array changes.
  const visibleSensors = createMemo(() => {
    const tab = activeTab()
    return tab === 'all' ? sensors : sensors.filter(s => s.type === tab)
  })

  // Derived memo: count out-of-range sensors for the badge.
  const alertCount = createMemo(() =>
    sensors.filter(isOutOfRange).length
  )

  return (
    <div class="rounded-xl border border-gray-200 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900">

      {/* Header */}
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">IoT Sensors</h2>
        <Show when={alertCount() > 0}>
          <span class="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
            {alertCount()} alert{alertCount() > 1 ? 's' : ''}
          </span>
        </Show>
      </div>

      {/* ─── SOLID LESSON: Index for the tab bar ───────────────────────────
          TABS is a plain array constant — it never changes length or order.
          Index is appropriate here: each slot is permanently bound to one tab.

          Notice the render fn signature difference vs For:
            For:   (item: Tab,            index: Accessor<number>) => JSX
            Index: (item: Accessor<Tab>,  index: number)           => JSX

          With Index, `item` is a SIGNAL (you call item() to read the value).
          This lets Solid update only the content of a slot when it changes,
          without re-creating the DOM node for that slot.

          For our static tab list, both For and Index would work identically —
          the distinction matters when slot VALUES change without the array
          length changing (e.g., live-updating scores in a fixed leaderboard).
      ─────────────────────────────────────────────────────────────────────── */}
      <div class="flex gap-1">
        <Index each={TABS}>
          {(tab, _i) => (
            <button
              onClick={() => setActiveTab(tab().id)}
              class={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab() === tab().id
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab().label}
            </button>
          )}
        </Index>
      </div>

      {/* ─── SOLID LESSON: For + createSelector ────────────────────────────
          visibleSensors() is the filtered array (a memo).
          For re-renders only rows whose identity changed after a filter switch.
          isSelected(s.id) is optimized via createSelector — only 2 rows
          re-render per selection change, not the whole list.
      ─────────────────────────────────────────────────────────────────────── */}
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <For each={visibleSensors()}>
          {(sensor) => (
            <SensorCard
              sensor={sensor}
              selected={isSelected(sensor.id)}
              onSelect={() => setSelectedId(id => id === sensor.id ? null : sensor.id)}
            />
          )}
        </For>
      </div>

      {/* ─── SOLID LESSON: Portal ──────────────────────────────────────────────
          Portal renders its children into a DIFFERENT DOM node than its
          position in the component tree. By default it mounts into document.body.

          WHY USE Portal?
          - The toast needs to be fixed to the viewport corner (position:fixed).
          - CSS stacking contexts (overflow:hidden, transform, etc.) on ancestor
            elements can trap fixed/absolute children. Portal escapes this.
          - The toast is logically "owned" by SensorGrid (it reacts to alertCount)
            but must live outside the widget card in the DOM.

          ⚠️  REACT COMPARISON:
               React: ReactDOM.createPortal(<Toast />, document.body)
               Solid: <Portal mount={document.body}>...</Portal>
               Solid's Portal is declarative JSX — no imperative DOM call needed.

          The Portal's children ARE still part of Solid's reactive tree —
          signals, context, effects all work normally inside it.
      ──────────────────────────────────────────────────────────────────────── */}
      <Show when={alertCount() > 0}>
        <Portal mount={document.body}>
          <div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-red-800 bg-red-950 px-4 py-2.5 shadow-lg">
            <span class="text-red-400">⚠</span>
            <p class="text-sm text-red-300">
              {alertCount()} sensor{alertCount() > 1 ? 's' : ''} out of range
            </p>
          </div>
        </Portal>
      </Show>

    </div>
  )
}