// ─── components/widgets/CryptoWidget.tsx ─────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createResource   — async data fetching with built-in loading/error states
//   createSignal     — refetch trigger (source signal pattern)
//   Suspense         — declarative loading boundary
//   ErrorBoundary    — declarative error boundary
//   Switch / Match   — multiple conditional branches (price trend arrows)
//   For              — rendering the coin list
//   Show             — conditional stale-data indicator
//   onMount          — start auto-refresh interval
//   onCleanup        — clear interval on unmount
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  createResource,
  createSignal,
  Suspense,
  ErrorBoundary,
  Switch,
  Match,
  For,
  Show,
  onMount,
  onCleanup,
} from 'solid-js'
import { fetchCryptoPrices } from '@/services/api/cryptoApi'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import type { CoinPrice } from '@/types/crypto'

// ─── SOLID LESSON: createResource ────────────────────────────────────────────
//
//  createResource is Solid's primitive for async data.
//  It wraps a Promise-returning function and gives you:
//    - data()         — the resolved value (undefined while loading)
//    - data.loading   — true while the fetch is in-flight
//    - data.error     — the thrown error (if any)
//    - refetch()      — manually re-run the fetcher
//    - mutate(val)    — optimistically update the cached value
//
//  TWO SIGNATURES:
//
//  1. No source (runs once on mount, re-runs only when refetch() is called):
//       const [data, { refetch }] = createResource(fetcher)
//
//  2. With a reactive source signal (re-runs automatically when source changes):
//       const [data] = createResource(sourceSignal, fetcher)
//       When sourceSignal() changes, fetcher(newSourceValue) is called.
//       This is the idiomatic pattern for auto-refresh.
//
//  We use approach #2 here: a "tick" signal increments every 30s.
//  When tick changes → createResource calls the fetcher again automatically.
//
//  ⚠️  REACT COMPARISON:
//       React: useEffect(() => { fetch(...).then(setData) }, [tick])
//              You manually manage loading/error state with useState.
//       Solid: createResource does all of this for you, AND integrates
//              with Suspense/ErrorBoundary automatically.
//
//  ⚠️  HOW SUSPENSE WORKS WITH createResource:
//       While data is loading, reading data() THROWS a Promise internally.
//       The nearest <Suspense> boundary catches that throw and shows
//       its `fallback` prop until the promise resolves.
//       You never see this throw — it's transparent to you.
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30_000 // 30 seconds (CoinGecko free tier rate limit)

// ─── Inner widget (rendered inside Suspense + ErrorBoundary) ─────────────────
// Kept separate so the Suspense/ErrorBoundary wrappers are clean at the top.
function CryptoList() {
  // The "refresh tick" — incrementing it triggers a new fetch.
  const [tick, setTick] = createSignal(0)

  // createResource(source, fetcher):
  //   - source = tick (reactive)  →  when tick() changes, fetcher runs again
  //   - fetcher receives the source value but we ignore it here
  //   - returns [resource, { refetch, mutate }]
  const [coins, { refetch }] = createResource(tick, fetchCryptoPrices)

  // Auto-refresh: increment tick every 30s → triggers a new fetch.
  // onCleanup ensures the interval is cleared when the component unmounts.
  onMount(() => {
    const id = setInterval(() => setTick(n => n + 1), REFRESH_INTERVAL_MS)
    onCleanup(() => clearInterval(id))
  })

  return (
    <div class="space-y-1">

      {/* Stale indicator: show a subtle banner when a background refetch
          is in-flight but we already have data from a previous fetch.
          data.loading is true, but data() still holds the old value —
          so we can keep showing content instead of a blank skeleton. */}
      <Show when={coins.loading && coins()}>
        <p class="text-xs text-amber-500/70 text-right pb-1">Refreshing…</p>
      </Show>

      {/* Column headers */}
      <div class="grid grid-cols-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
        <span>Coin</span>
        <span class="text-right">Price</span>
        <span class="text-right">24h</span>
      </div>

      {/* ─── SOLID LESSON: For over the coins array ───────────────────────
          coins() returns CoinPrice[] once the resource resolves.
          Each item is rendered by the render-prop function.
          Solid keys by identity — when the array reference changes on
          refetch, only rows whose data actually changed re-render.
      ──────────────────────────────────────────────────────────────────── */}
      <For each={coins()}>
        {(coin: CoinPrice) => <CoinRow coin={coin} />}
      </For>

      {/* Manual refresh button — calls refetch() from the resource */}
      <button
        onClick={refetch}
        class="mt-3 w-full rounded-lg border border-gray-200 py-1.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors dark:border-gray-800 dark:text-gray-500 dark:hover:border-gray-600 dark:hover:text-gray-300"
      >
        Refresh now
      </button>
    </div>
  )
}

// ─── Single coin row ──────────────────────────────────────────────────────────
function CoinRow(props: { coin: CoinPrice }) {
  return (
    <div class="grid grid-cols-3 items-center rounded-lg px-1 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">

      {/* Coin name + symbol */}
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">{props.coin.symbol}</p>
        <p class="text-xs text-gray-500">{props.coin.name}</p>
      </div>

      {/* Price */}
      <p class="text-right font-mono text-sm text-gray-900 dark:text-white">
        ${props.coin.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </p>

      {/* ─── SOLID LESSON: Switch / Match ──────────────────────────────────
          Switch evaluates its Match children in order and renders the
          first one whose `when` condition is truthy.
          The `fallback` prop is rendered if no Match matches.

          USE SWITCH WHEN you have 3+ mutually exclusive conditions.
          For 2 conditions a ternary or Show with fallback is fine.

          ⚠️  REACT COMPARISON:
               React doesn't have Switch/Match — you chain ternaries or
               use if/else in a helper function.
               Solid's Switch/Match reads as declarative markup.

          Here we classify the 24h change into: up / down / neutral.
      ──────────────────────────────────────────────────────────────────── */}
      <div class="text-right">
        <Switch
          fallback={
            <span class="text-xs text-gray-500">
              {props.coin.usd_24h_change.toFixed(2)}%
            </span>
          }
        >
          <Match when={props.coin.usd_24h_change > 1}>
            <span class="text-xs font-semibold text-emerald-400">
              ↑ {props.coin.usd_24h_change.toFixed(2)}%
            </span>
          </Match>
          <Match when={props.coin.usd_24h_change < -1}>
            <span class="text-xs font-semibold text-red-400">
              ↓ {Math.abs(props.coin.usd_24h_change).toFixed(2)}%
            </span>
          </Match>
        </Switch>
      </div>

    </div>
  )
}

// ─── Public export: full widget with Suspense + ErrorBoundary ─────────────────
//
// ─── SOLID LESSON: Suspense ──────────────────────────────────────────────────
//
//  <Suspense fallback={<Loading />}>
//    <ComponentThatUsesCreateResource />
//  </Suspense>
//
//  Any createResource read inside the Suspense boundary that is still
//  loading will cause Suspense to show the `fallback` instead of the children.
//  Once ALL resources inside resolve, the real children are shown.
//
//  ⚠️  KEY DIFFERENCE FROM REACT SUSPENSE:
//       React Suspense works with lazy() and some data-fetching libraries.
//       Solid Suspense works with createResource natively — no library needed.
//
// ─── SOLID LESSON: ErrorBoundary ─────────────────────────────────────────────
//
//  <ErrorBoundary fallback={(err, reset) => <ErrorDisplay error={err} reset={reset} />}>
//    <ChildThatMightThrow />
//  </ErrorBoundary>
//
//  If any synchronous throw OR rejected promise inside createResource
//  goes uncaught, ErrorBoundary catches it and renders the fallback.
//  `reset` re-mounts the subtree, giving users a "try again" button.
//
//  ErrorBoundary + Suspense composition:
//    - Put ErrorBoundary OUTSIDE Suspense so errors in the fetcher are caught.
//    - If they're swapped, a throw during loading might not be caught cleanly.
// ─────────────────────────────────────────────────────────────────────────────
export function CryptoWidget() {
  return (
    <div class="rounded-xl border border-gray-200 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Crypto Prices</h2>

      <ErrorBoundary fallback={(err, reset) => (
        <ErrorDisplay error={err as Error} reset={reset} />
      )}>
        <Suspense fallback={<Skeleton rows={4} />}>
          <CryptoList />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}