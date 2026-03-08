// ─── components/ui/Skeleton.tsx ──────────────────────────────────────────────
// Used as the fallback prop for <Suspense>.
// Shown while createResource is loading (before the first successful fetch).

import type { Component } from 'solid-js'
import { For } from 'solid-js'

// ⚠️  SOLID TYPING LESSON: use Component<Props> to declare typed components.
//     Without it, Solid's JSX checker treats the function as having no props
//     and rejects any attributes you try to pass at the call site.
interface SkeletonProps {
  rows?: number
}

export const Skeleton: Component<SkeletonProps> = (props) => {
  // For vs Index:
  //   For   → dynamic arrays where items are added/removed/reordered
  //   Index → static-length arrays where only values change (or never do)
  // The skeleton row count is fixed, so For is fine here — either works for
  // static arrays; the distinction matters more for long, frequently-mutated lists.
  return (
    <div class="space-y-3 animate-pulse">
      <For each={Array.from({ length: props.rows ?? 4 })}>
        {() => (
          <div class="flex items-center justify-between gap-4">
            <div class="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        )}
      </For>
    </div>
  )
}