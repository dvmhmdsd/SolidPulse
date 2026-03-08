// ─── types/metrics.ts ────────────────────────────────────────────────────────
// Plain TypeScript types — no Solid-specific code here.
// Keeping types separate makes them reusable across contexts, widgets, tests.

export type MetricStatus = 'normal' | 'warning' | 'critical'

// Each numeric metric is 0–100 (a percentage).
export interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
}

export interface NetworkMetrics {
  download: number // Mbps
  upload: number   // Mbps
  latency: number  // ms
}

// Used by the widget to render a list of metrics with For.
export interface MetricRow {
  label: string
  value: number   // 0–100
  unit: string
}