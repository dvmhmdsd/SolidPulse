// ─── components/widgets/SystemMetricsWidget.tsx ──────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createMemo   — memoized/derived reactive values (like useMemo in React)
//   Show         — conditional rendering with a reactive condition
//   For          — keyed list rendering (like .map() but reactive and efficient)
//   useContext   — (via our custom hook) consuming context
//
// ─────────────────────────────────────────────────────────────────────────────

import { createMemo, Show, For } from 'solid-js'
import { useRealtimeData } from '@/contexts/RealtimeDataContext'
import type { MetricStatus, MetricRow } from '@/types/metrics'

// ─── SOLID LESSON: createMemo ─────────────────────────────────────────────────
//
//  createMemo(() => derived value) is Solid's memoized computation.
//  It re-runs ONLY when its reactive dependencies change.
//  The result is cached — multiple reads don't re-compute.
//
//  Use it for:
//    - Expensive transformations of reactive data
//    - Deriving values you reference in multiple places
//    - Preventing unnecessary recalculations
//
//  ⚠️  ANTI-PATTERN — don't do this:
//       const status = () => cpu > 90 ? 'critical' : 'normal'
//       This is a plain function — it re-runs on EVERY render.
//       createMemo caches the result and only recalculates when cpu changes.
//
//  ⚠️  REACT COMPARISON:
//       React: const status = useMemo(() => ..., [cpu])
//              You must manually list dependencies in the array.
//       Solid: const status = createMemo(() => ...)
//              Dependencies are AUTOMATICALLY tracked — no array needed.
//              Solid's compiler/runtime tracks which signals are read.
// ─────────────────────────────────────────────────────────────────────────────

function cpuStatus(cpu: number): MetricStatus {
  if (cpu >= 90) return 'critical'
  if (cpu >= 70) return 'warning'
  return 'normal'
}

function memStatus(memory: number): MetricStatus {
  if (memory >= 85) return 'critical'
  if (memory >= 70) return 'warning'
  return 'normal'
}

const STATUS_COLORS: Record<MetricStatus, string> = {
  normal:   'bg-emerald-500',
  warning:  'bg-amber-500',
  critical: 'bg-red-500',
}

const STATUS_TEXT: Record<MetricStatus, string> = {
  normal:   'text-emerald-400',
  warning:  'text-amber-400',
  critical: 'text-red-400',
}

// ─── MetricBar — a single metric row ─────────────────────────────────────────
// This is a small "dumb" component that receives props and renders a bar.
// It does NOT access context — data flows in via props, which is ideal for
// leaf components that are easy to test in isolation.
interface MetricBarProps {
  label: string
  value: number   // 0–100
  unit: string
  status: MetricStatus
}

function MetricBar(props: MetricBarProps) {
  // ⚠️  CRITICAL SOLID GOTCHA: Object Destructuring KILLS Reactivity!
  //
  //  In React you'd write:  const { label, value } = props
  //  DO NOT do this in Solid. Destructuring breaks the Proxy that
  //  makes props reactive. You'd capture a static snapshot.
  //
  //  ✅  CORRECT: always access props.value, props.label directly.
  //      Solid's Babel transform ensures props.X re-reads the live value.
  //
  //  This is probably the #1 mistake newcomers make coming from React.

  return (
    <div class="space-y-1">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500 dark:text-gray-400">{props.label}</span>
        <span class={`font-mono font-semibold ${STATUS_TEXT[props.status]}`}>
          {props.value.toFixed(1)}{props.unit}
        </span>
      </div>
      <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class={`h-2 rounded-full transition-all duration-200 ${STATUS_COLORS[props.status]}`}
          style={{ width: `${Math.min(100, props.value)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Shared card shell ────────────────────────────────────────────────────────
interface CardProps {
  title: string
  badge?: string
  children: any
}

function MetricCard(props: CardProps) {
  return (
    <div class="rounded-xl border border-gray-200 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{props.title}</h2>
        <Show when={props.badge}>
          <span class="font-mono text-xs text-gray-600">{props.badge}</span>
        </Show>
      </div>
      {props.children}
    </div>
  )
}

// ─── SystemMetricsWidget ──────────────────────────────────────────────────────
export function SystemMetricsWidget() {
  const { system, updateCount } = useRealtimeData()

  // ─── SOLID LESSON: createMemo for derived state ──────────────────────────
  //
  //  Each memo reads from the store (system.cpu etc.) and computes a result.
  //  When system.cpu changes, only cpuStat() re-runs — not memStat, diskStat.
  //  This is fine-grained reactivity in action.
  //
  //  Notice: we call createMemo at the TOP LEVEL of the component (like hooks).
  //  ⚠️  Never call createMemo inside conditions or loops — same rule as React hooks.
  // ──────────────────────────────────────────────────────────────────────────
  const cpuStat    = createMemo(() => cpuStatus(system.cpu))
  const memoryStat = createMemo(() => memStatus(system.memory))

  // A memo that derives a boolean — drives the Show below.
  const hasCritical = createMemo(() =>
    cpuStat() === 'critical' || memoryStat() === 'critical'
  )

  // A memo that builds the rows array for the <For> loop.
  const rows = createMemo<MetricRow[]>(() => [
    { label: 'CPU',    value: system.cpu,    unit: '%' },
    { label: 'Memory', value: system.memory, unit: '%' },
    { label: 'Disk',   value: system.disk,   unit: '%' },
  ])

  return (
    <MetricCard title="System" badge={`tick #${updateCount()}`}>

      {/* ─── SOLID LESSON: Show ─────────────────────────────────────────────
          Show renders its children only when `when` is truthy.
          It is Solid's preferred way to do conditional rendering.

          WHY NOT use a ternary { hasCritical() ? <div>...</div> : null }?
          You CAN use ternaries — they work. But Show is clearer for "optional"
          blocks, and it also supports a `fallback` prop for the else branch.

          The `when` prop accepts a reactive expression (a function call or
          a signal). Show re-evaluates it reactively.

          ⚠️  REACT COMPARISON: In React: { hasCritical && <Alert /> }
              In Solid: <Show when={hasCritical()}>...</Show>
              The () matters — you must CALL the signal/memo to read its value.
      ──────────────────────────────────────────────────────────────────────── */}
      <Show when={hasCritical()}>
        <div class="flex items-center gap-2 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
          <span>⚠</span>
          <span>Critical threshold exceeded</span>
        </div>
      </Show>

      <div class="space-y-3">
        {/* ─── SOLID LESSON: For ──────────────────────────────────────────────
            For is Solid's efficient list renderer.

            HOW IT WORKS:
            - Takes an `each` prop (a reactive array) and a render function.
            - When the array changes, Solid diffs it and only re-renders
              items that actually changed — not the whole list.

            ⚠️  WHY NOT use .map() directly?
                You CAN write: {rows().map(row => <MetricBar ... />)}
                But this re-creates all DOM nodes every time rows() changes.
                For short lists it's fine; For is better for longer lists
                because it reconciles by identity/index.

            ⚠️  REACT COMPARISON:
                React: items.map(item => <Item key={item.id} ... />)
                Solid: <For each={items()}>{(item) => <Item ... />}</For>
                Note: For's child is a FUNCTION (render prop), not JSX directly.
        ──────────────────────────────────────────────────────────────────────── */}
        <For each={rows()}>
          {(row) => (
            <MetricBar
              label={row.label}
              value={row.value}
              unit={row.unit}
              status={row.label === 'CPU' ? cpuStat() : row.label === 'Memory' ? memoryStat() : 'normal'}
            />
          )}
        </For>
      </div>
    </MetricCard>
  )
}

// ─── NetworkMetricsWidget ─────────────────────────────────────────────────────
export function NetworkMetricsWidget() {
  const { network, updateCount } = useRealtimeData()

  const rows = createMemo<MetricRow[]>(() => [
    { label: 'Download', value: (network.download / 200) * 100, unit: ` ${network.download.toFixed(0)} Mbps` },
    { label: 'Upload',   value: (network.upload / 100) * 100,   unit: ` ${network.upload.toFixed(0)} Mbps` },
    { label: 'Latency',  value: Math.min(100, (network.latency / 200) * 100), unit: ` ${network.latency.toFixed(0)} ms` },
  ])

  return (
    <MetricCard title="Network" badge={`tick #${updateCount()}`}>
      <div class="space-y-3">
        <For each={rows()}>
          {(row) => (
            <MetricBar label={row.label} value={row.value} unit={row.unit} status="normal" />
          )}
        </For>
      </div>
    </MetricCard>
  )
}