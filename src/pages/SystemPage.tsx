// ─── pages/SystemPage.tsx ─────────────────────────────────────────────────────

import { SystemMetricsWidget, NetworkMetricsWidget } from '@/components/widgets/SystemMetricsWidget'

export function SystemPage() {
  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <SystemMetricsWidget />
      <NetworkMetricsWidget />
    </div>
  )
}