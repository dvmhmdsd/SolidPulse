// ─── types/iot.ts ─────────────────────────────────────────────────────────────

export type SensorType = 'temperature' | 'humidity' | 'pressure'

export interface Sensor {
  id:    string
  name:  string
  type:  SensorType
  value: number
  unit:  string
  min:   number   // normal range min
  max:   number   // normal range max
}