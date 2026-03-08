// ─── components/ui/ErrorDisplay.tsx ──────────────────────────────────────────
// Fallback UI passed to <ErrorBoundary>.
// ErrorBoundary calls this with the caught error when a child throws.

interface ErrorDisplayProps {
  error: Error
  reset: () => void   // Solid passes a reset function to re-try rendering
}

export function ErrorDisplay(props: ErrorDisplayProps) {
  return (
    <div class="rounded-xl border border-red-800 bg-red-950/50 p-5 space-y-3">
      <div class="flex items-center gap-2 text-red-400">
        <span class="text-lg">✕</span>
        <span class="font-semibold">Failed to load data</span>
      </div>
      <p class="text-sm text-red-300/70 font-mono">
        {props.error.message}
      </p>
      <button
        onClick={props.reset}
        class="text-sm text-red-400 underline hover:text-red-300"
      >
        Try again
      </button>
    </div>
  )
}