// ─── pages/CryptoPage.tsx ────────────────────────────────────────────────────

import { Suspense, lazy } from 'solid-js'
import { Skeleton } from '@/components/ui/Skeleton'

const CryptoWidget = lazy(() =>
  import('@/components/widgets/CryptoWidget').then(m => ({ default: m.CryptoWidget }))
)

export function CryptoPage() {
  return (
    <div class="max-w-md">
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