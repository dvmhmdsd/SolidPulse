// ─── components/layout/Header.tsx ────────────────────────────────────────────
//
// SOLID ROUTER APIS DEMONSTRATED HERE:
//   useLocation — reactive access to the current URL pathname
//
// OTHER SOLID APIS:
//   use:tooltip — custom directive for hover tooltips
//
// ─────────────────────────────────────────────────────────────────────────────

import { useLocation } from '@solidjs/router'
import { useAppState } from '@/contexts/AppStateContext'
// @ts-ignore
import { tooltip } from '@/directives/tooltip'

// ─── SOLID ROUTER LESSON: useLocation ───────────────────────────────────────
//
//  useLocation() returns a reactive Location object with:
//    pathname  — path portion of the URL (e.g. "/sensors/s3")
//    search    — query string (e.g. "?tab=temperature")
//    hash      — hash fragment
//    state     — state passed via navigate(path, { state })
//    key       — unique key for this history entry
//
//  All properties are reactive. Reading location.pathname inside JSX
//  subscribes to URL changes — no useEffect needed.
//
//  Here we derive the page title from the URL and display it in the header.
//  The title updates automatically on every navigation.
//
//  ⚠️  REACT COMPARISON:
//       React Router: const { pathname } = useLocation() — NOT reactive
//                     You need useEffect([pathname]) to respond to changes.
//       Solid Router: reading location.pathname IS the subscription.
//
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  '/':        'Dashboard',
  '/system':  'System Metrics',
  '/crypto':  'Crypto Prices',
  '/sensors': 'IoT Sensors',
}

function getTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/sensors/')) return 'Sensor Detail'
  return 'SolidJS Dashboard'
}

export function Header() {
  const { state, toggleTheme } = useAppState()
  const location = useLocation()

  return (
    <header class="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">

      {/* Page title — derived from location.pathname (reactive, no effect needed) */}
      <h1 class="text-sm font-semibold text-gray-900 dark:text-white">
        {getTitle(location.pathname)}
      </h1>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        use:tooltip={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-gray-600"
      >
        {state.theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>

    </header>
  )
}