// ─── components/layout/Sidebar.tsx ───────────────────────────────────────────
//
// SOLID ROUTER APIS DEMONSTRATED HERE:
//   A           — reactive link component (replaces <a href>)
//   useLocation — read current URL / pathname
//
// ─────────────────────────────────────────────────────────────────────────────

import { For } from 'solid-js'
import { A, useLocation } from '@solidjs/router'

// ─── SOLID ROUTER LESSON: <A> vs <a> ────────────────────────────────────────
//
//  <A href="/path"> is @solidjs/router's link component.
//  Use it instead of <a href> for internal navigation so that:
//    1. Navigation is client-side (no full page reload).
//    2. Active state is tracked automatically.
//
//  KEY PROPS:
//    activeClass   — CSS class applied when href matches the current URL.
//    inactiveClass — CSS class when href does NOT match.
//    end           — when true, only marks active on EXACT match.
//                    Without `end`, href="/" would be "active" on every page
//                    because every URL starts with "/".
//
//  ⚠️  REACT COMPARISON:
//       React Router: <Link to="/path"> (no built-in active class)
//                     <NavLink to="/path" className={({ isActive }) => ...}>
//       Solid Router: <A href="/path" activeClass="active"> — built-in, no callback
//
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/',        label: 'Dashboard', icon: '⊞', end: true  },
  { href: '/system',  label: 'System',    icon: '⚙', end: false },
  { href: '/crypto',  label: 'Crypto',    icon: '₿', end: false },
  { href: '/sensors', label: 'Sensors',   icon: '⊕', end: false },
]

// ─── SOLID ROUTER LESSON: useLocation ───────────────────────────────────────
//
//  useLocation() returns a reactive Location object:
//    location.pathname  — current path (e.g. "/sensors")
//    location.search    — query string (e.g. "?tab=temp")
//    location.hash      — hash fragment
//    location.state     — navigation state passed via navigate()
//
//  Reading location.pathname inside JSX or a memo creates a subscription —
//  the component re-renders whenever the URL changes.
//
//  Here we use it to derive a human-readable section label shown at the
//  top of the sidebar, independent of the <A> active classes.
//
//  ⚠️  useLocation must be called inside a component that is rendered
//      inside <Router> (or its root layout). Calling it outside throws.
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const location = useLocation()

  const currentLabel = () =>
    NAV_LINKS.find(l => l.end
      ? location.pathname === l.href
      : location.pathname.startsWith(l.href)
    )?.label ?? 'App'

  return (
    <aside class="flex w-14 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:w-48">

      {/* Logo / app name */}
      <div class="flex h-14 items-center justify-center border-b border-gray-200 px-3 dark:border-gray-800 sm:justify-start">
        <span class="text-lg font-bold text-indigo-500">◈</span>
        <span class="ml-2 hidden text-sm font-semibold text-gray-900 dark:text-white sm:block">
          SolidPulse
        </span>
      </div>

      {/* Nav links */}
      <nav class="flex flex-col gap-1 p-2">
        <For each={NAV_LINKS}>
          {(link) => (
            // <A> with activeClass/inactiveClass — no manual isActive check needed.
            // Solid Router tracks the current location reactively and applies
            // the right class on every navigation.
            <A
              href={link.href}
              end={link.end}
              activeClass="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
              inactiveClass="text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              class="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors"
            >
              <span class="text-base">{link.icon}</span>
              <span class="hidden sm:block">{link.label}</span>
            </A>
          )}
        </For>
      </nav>

      {/* Current section label — driven by useLocation() */}
      <div class="mt-auto border-t border-gray-200 p-3 dark:border-gray-800">
        <p class="hidden text-center text-xs text-gray-400 sm:block">{currentLabel()}</p>
      </div>

    </aside>
  )
}