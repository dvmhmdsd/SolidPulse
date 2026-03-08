// ─── App.tsx ──────────────────────────────────────────────────────────────────
//
// SOLID ROUTER APIS DEMONSTRATED HERE:
//   Router   — root provider; manages browser history and location state
//   Route    — declares a URL pattern → component mapping
//   Outlet   — (via props.children in root) renders the matched child route
//
// ─────────────────────────────────────────────────────────────────────────────

import { type ParentComponent, Suspense } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardPage } from '@/pages/DashboardPage'
import { SystemPage } from '@/pages/SystemPage'
import { CryptoPage } from '@/pages/CryptoPage'
import { SensorsPage } from '@/pages/SensorsPage'
import { SensorDetailPage } from '@/pages/SensorDetailPage'

// ─── SOLID ROUTER LESSON: Router + Route ─────────────────────────────────────
//
//  <Router root={Layout}>
//    <Route path="/path" component={Page} />
//  </Router>
//
//  `root` — a layout component rendered for EVERY route. It receives the
//  matched page as `props.children` (or use <Outlet /> from @solidjs/router).
//  This replaces wrapping everything in a <Route path="/*"> parent.
//
//  Route matching:
//    - "/sensors"    matches only the exact path (no trailing segment)
//    - "/sensors/:id" matches "/sensors/s1", "/sensors/s2", etc.
//    - Solid Router uses specificity — more specific patterns win.
//
//  `component=` receives a reference, not JSX. Solid only calls it when the
//  route is active — non-matching routes render nothing (zero wasted work).
//
//  ⚠️  REACT COMPARISON:
//       React Router v6: <Route path="/" element={<Page />} />
//       Solid Router:    <Route path="/" component={Page} />
//       `element` passes instantiated JSX; `component` passes the class/fn.
//       Solid's approach is more efficient — the component is never called
//       for routes that don't match.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── AppLayout — persistent shell rendered on every route ─────────────────────
//
//  Providers live here (inside Router) so all pages can use
//  useLocation / useNavigate / useParams from @solidjs/router.
//
//  When `root=` is used, the Router injects matched page content
//  as `props.children`. Rendering {props.children} is equivalent to <Outlet />.
// ─────────────────────────────────────────────────────────────────────────────
const AppLayout: ParentComponent = (props) => (
  <AppStateProvider>
    <RealtimeDataProvider>
      <div class="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">

        {/* Sidebar — present on every route, uses <A> for navigation */}
        <Sidebar />

        <div class="flex flex-1 flex-col overflow-hidden">
          {/* Header — uses useLocation() to show the current page title */}
          <Header />

          {/* Main content area — renders the matched page component.
              Suspense catches any lazy-loaded chunks within pages. */}
          <main class="flex-1 overflow-auto p-6">
            <Suspense>{props.children}</Suspense>
          </main>
        </div>

      </div>
    </RealtimeDataProvider>
  </AppStateProvider>
)

// ─── Route tree ───────────────────────────────────────────────────────────────
const App = () => (
  <Router root={AppLayout} base="/SolidPulse">
    <Route path="/"            component={DashboardPage}    />
    <Route path="/system"      component={SystemPage}        />
    <Route path="/crypto"      component={CryptoPage}        />
    <Route path="/sensors"     component={SensorsPage}       />
    {/* :id is a dynamic segment — read via useParams().id in SensorDetailPage */}
    <Route path="/sensors/:id" component={SensorDetailPage}  />
  </Router>
)

export default App