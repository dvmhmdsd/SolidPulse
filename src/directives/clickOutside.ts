// ─── directives/clickOutside.ts ──────────────────────────────────────────────
//
// SOLID LESSON: Custom Directives
//
//  A directive is a function applied to a DOM element via `use:name` syntax.
//  It's Solid's way to encapsulate reusable DOM side effects (focus, drag,
//  click-outside, intersection observer, etc.) without wrapping JSX.
//
//  SIGNATURE:  function myDirective(el: Element, accessor: () => Value)
//    el        — the raw DOM element the directive is applied to
//    accessor  — a FUNCTION that returns the current prop value.
//                Call accessor() inside effects to stay reactive.
//                ⚠️  Don't destructure: accessor is a getter, not a value.
//
//  USAGE IN JSX:
//    <div use:clickOutside={() => setOpen(false)}>...</div>
//
//  ⚠️  IMPORT RULE: The directive function MUST be imported in every file
//      that uses it, even if you never call it directly. Solid's compiler
//      transforms `use:clickOutside` into a call to the imported function.
//      Forgetting the import silently does nothing.
//
//  ⚠️  REACT COMPARISON:
//       React devs typically use a useEffect + ref to detect outside clicks.
//       Solid directives are cleaner — the logic is co-located in one file
//       and applied declaratively with `use:`.
//
//  onCleanup inside a directive runs when the element is removed from the DOM.
// ─────────────────────────────────────────────────────────────────────────────

import { onCleanup } from 'solid-js'

export function clickOutside(el: Element, accessor: () => () => void) {
  function handler(e: MouseEvent) {
    if (!el.contains(e.target as Node)) {
      accessor()()   // call the callback: accessor() returns the fn, then we call it
    }
  }
  // Use mousedown so the click registers before any blur events
  document.addEventListener('mousedown', handler)
  onCleanup(() => document.removeEventListener('mousedown', handler))
}

// TypeScript declaration — tells Solid's JSX checker that `use:clickOutside`
// accepts a `() => void` value. Without this, TypeScript will error.
declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      clickOutside: () => void
    }
  }
}