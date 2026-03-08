// ─── services/simulators/iotSensors.ts ───────────────────────────────────────
// Pure functions — no Solid imports.

import type { Sensor } from '@/types/iot'

function drift(current: number, delta: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, current + (Math.random() - 0.5) * 2 * delta))
}

export const INITIAL_SENSORS: Sensor[] = [
  { id: 's1', name: 'Server Room A', type: 'temperature', value: 22,   unit: '°C',  min: 18, max: 27 },
  { id: 's2', name: 'Server Room B', type: 'temperature', value: 24,   unit: '°C',  min: 18, max: 27 },
  { id: 's3', name: 'Warehouse',     type: 'temperature', value: 18,   unit: '°C',  min: 10, max: 30 },
  { id: 's4', name: 'Office Floor',  type: 'humidity',    value: 45,   unit: '%',   min: 30, max: 60 },
  { id: 's5', name: 'Data Center',   type: 'humidity',    value: 55,   unit: '%',   min: 40, max: 70 },
  { id: 's6', name: 'Roof Station',  type: 'pressure',    value: 1013, unit: ' hPa', min: 990, max: 1030 },
]

// Returns a new array with updated sensor values.
// Called in the context's batch() update — only changed sensors re-render
// thanks to createSelector optimizations in SensorGrid.
export function nextSensorValues(sensors: Sensor[]): Sensor[] {
  return sensors.map(s => ({
    ...s,
    value: drift(s.value, s.type === 'pressure' ? 2 : 1, s.min - 5, s.max + 5),
  }))
}