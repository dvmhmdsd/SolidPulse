// ─── pages/DashboardPage.tsx ──────────────────────────────────────────────────

import { Suspense } from 'solid-js'
import { lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { SystemMetricsWidget, NetworkMetricsWidget } from '@/components/widgets/SystemMetricsWidget'
import { SensorGrid } from '@/components/widgets/SensorGrid'
import { Skeleton } from '@/components/ui/Skeleton'

const CryptoWidget = lazy(() =>
  import('@/components/widgets/CryptoWidget').then(m => ({ default: m.CryptoWidget }))
)

type WidgetComponent = () => any
const WIDGET_MAP: Record<string, WidgetComponent> = {
  system:  SystemMetricsWidget,
  network: NetworkMetricsWidget,
  sensors: SensorGrid,
}

export function DashboardPage() {
  return (
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Dynamic component={WIDGET_MAP.system} />
      <Dynamic component={WIDGET_MAP.network} />
      <Dynamic component={WIDGET_MAP.sensors} />

      <Suspense fallback={
        <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p class="mb-4 text-sm font-semibold text-gray-400">Crypto Prices</p>
          <Skeleton rows={4} />
        </div>
      }>
        <CryptoWidget />
      </Suspense>
    </div>
  )
}