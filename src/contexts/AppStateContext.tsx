// ─── contexts/AppStateContext.tsx ────────────────────────────────────────────
//
// SOLID APIS DEMONSTRATED HERE:
//   createStore    — nested UI state (theme, widget visibility)
//   produce()      — immer-style mutations on nested store state
//   createMemo     — derived values from the store
//   createEffect   — DOM side effect: sync theme → document class
//   createContext  — share state across the tree
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  createMemo,
  createEffect,
  type ParentComponent,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'

// ─── State shape ──────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'

export interface WidgetConfig {
  id:      string
  label:   string
  visible: boolean
}

interface AppState {
  theme:   Theme
  widgets: WidgetConfig[]
}

// ─── SOLID LESSON: produce() ─────────────────────────────────────────────────
//
//  produce() lets you mutate nested store state using regular imperative code,
//  like Immer in the React world. Under the hood Solid tracks what changed
//  and applies fine-grained updates — only the affected paths re-render.
//
//  WITHOUT produce — path-based setter (fine for shallow updates):
//    setState('theme', 'light')
//    setState('widgets', 0, 'visible', false)    // index-based, brittle
//
//  WITH produce — imperative mutation (better for nested/conditional updates):
//    setState(produce(draft => {
//      const w = draft.widgets.find(w => w.id === 'crypto')
//      if (w) w.visible = !w.visible
//    }))
//
//  ⚠️  The draft inside produce() is a plain mutable object.
//      You mutate it directly — no spread, no return needed.
//      Solid generates the minimal set of reactive updates from your mutations.
//
//  ⚠️  REACT COMPARISON:
//       React + Immer: setState(produce(draft => { draft.x = 1 }))  (same API!)
//       Solid's produce() is intentionally Immer-compatible in feel.
//       The difference: Solid's store is already a Proxy — produce() is just
//       a convenience layer that collects mutations and applies them atomically.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Context value type ───────────────────────────────────────────────────────
interface AppStateContextValue {
  state:          AppState
  toggleTheme:    () => void
  toggleWidget:   (id: string) => void
  visibleWidgets: () => WidgetConfig[]    // derived memo
}

const AppStateContext = createContext<AppStateContextValue>()

// Default widget list — each widget has an id matching what App.tsx renders.
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'system',  label: 'System Metrics', visible: true },
  { id: 'network', label: 'Network',        visible: true },
  { id: 'crypto',  label: 'Crypto Prices',  visible: true },
]

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AppStateProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AppState>({
    theme:   'dark',
    widgets: DEFAULT_WIDGETS,
  })

  // ─── SOLID LESSON: createEffect for DOM side effects ─────────────────────
  //
  //  createEffect runs after the DOM is ready and re-runs whenever its
  //  reactive dependencies change. Here it syncs state.theme → the 'dark'
  //  class on <html>, which is how Tailwind's darkMode: 'class' works.
  //
  //  This is the right use case for createEffect:
  //    → you need to reach OUTSIDE the reactive tree (touch the real DOM)
  //    → it's a side effect, not a derived value
  //
  //  ⚠️  createEffect vs createMemo:
  //       createMemo  → compute a VALUE from reactive data (pure)
  //       createEffect → run a SIDE EFFECT when reactive data changes (impure)
  //       Never use createEffect just to derive a value — use createMemo.
  //
  //  ⚠️  REACT COMPARISON:
  //       React: useEffect(() => { document.documentElement.classList... }, [theme])
  //       Solid: createEffect(() => { document.documentElement.classList... })
  //              No dependency array — Solid auto-tracks state.theme.
  // ──────────────────────────────────────────────────────────────────────────
  createEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  })

  // Toggle between dark and light.
  // We also update the DOM class synchronously here — belt-and-suspenders.
  // createEffect is the "right" reactive pattern, but for a DOM side effect
  // that must happen immediately on interaction, doing it eagerly is safer.
  function toggleTheme() {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    setState('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  // Toggle a widget's visibility by id — uses produce() for the nested mutation.
  function toggleWidget(id: string) {
    setState(produce(draft => {
      const widget = draft.widgets.find(w => w.id === id)
      if (widget) widget.visible = !widget.visible
    }))
  }

  // Derived memo: the list of currently visible widgets.
  // Re-computes only when a widget's visible flag changes.
  const visibleWidgets = createMemo(() =>
    state.widgets.filter(w => w.visible)
  )

  return (
    <AppStateContext.Provider value={{ state, toggleTheme, toggleWidget, visibleWidgets }}>
      {props.children}
    </AppStateContext.Provider>
  )
}

// ─── Custom hook ──────────────────────────────────────────────────────────────
export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>')
  return ctx
}