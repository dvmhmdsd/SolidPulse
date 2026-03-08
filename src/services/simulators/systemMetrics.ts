// ─── services/simulators/systemMetrics.ts ────────────────────────────────────
// Pure functions — no Solid imports, no side effects.
// Simulates realistic OS metrics with gradual drift + occasional spikes.

import type { SystemMetrics, NetworkMetrics } from '@/types/metrics'

// Gradually nudges a value by ±delta, clamped to [min, max].
// This produces a realistic "random walk" instead of pure noise.
function drift(current: number, delta = 5, min = 0, max = 100): number {
  const change = (Math.random() - 0.5) * 2 * delta
  return Math.min(max, Math.max(min, current + change))
}

// Occasionally spikes — models a process suddenly consuming CPU/memory.
function maybeSpikeOrDrop(value: number, spikeChance = 0.05): number {
  if (Math.random() < spikeChance) {
    // Jump toward 95 (CPU spike) or 20 (idle drop)
    return Math.random() > 0.5 ? 85 + Math.random() * 10 : 10 + Math.random() * 15
  }
  return value
}

export function nextSystemMetrics(prev: SystemMetrics): SystemMetrics {
  return {
    cpu: maybeSpikeOrDrop(drift(prev.cpu, 8)),
    memory: drift(prev.memory, 3),   // memory changes more slowly
    disk: drift(prev.disk, 0.5),     // disk barely changes in real life
  }
}

export function nextNetworkMetrics(prev: NetworkMetrics): NetworkMetrics {
  return {
    download: Math.max(0, drift(prev.download, 10, 0, 200)),
    upload: Math.max(0, drift(prev.upload, 5, 0, 100)),
    latency: Math.max(1, drift(prev.latency, 5, 1, 200)),
  }
}

// Initial values — realistic starting point.
export const initialSystemMetrics: SystemMetrics = {
  cpu: 25,
  memory: 60,
  disk: 45,
}

export const initialNetworkMetrics: NetworkMetrics = {
  download: 50,
  upload: 20,
  latency: 12,
}