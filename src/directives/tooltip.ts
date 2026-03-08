// ─── directives/tooltip.ts ───────────────────────────────────────────────────
//
// Another directive example — shows a floating tooltip on hover.
// Demonstrates:
//   - Managing external DOM nodes (the tip div) inside a directive
//   - onCleanup to remove both event listeners AND the tip node
//   - accessor() is called on each mousemove to stay reactive
//     (if the tooltip text were a signal, it would update live)
// ─────────────────────────────────────────────────────────────────────────────

import { onCleanup } from 'solid-js'

export function tooltip(el: Element, accessor: () => string) {
  const tip = document.createElement('div')
  tip.className = [
    'pointer-events-none fixed z-50 rounded-md px-2 py-1',
    'bg-gray-900 text-xs text-white shadow-lg',
    'dark:bg-gray-700',
  ].join(' ')

  function show(e: MouseEvent) {
    tip.textContent = accessor()   // reactive: re-reads the latest value
    document.body.appendChild(tip)
    position(e)
  }

  function position(e: MouseEvent) {
    tip.style.left = `${e.clientX + 12}px`
    tip.style.top  = `${e.clientY}px`
  }

  function hide() { tip.remove() }

  el.addEventListener('mouseenter', show  as EventListener)
  el.addEventListener('mousemove',  position as EventListener)
  el.addEventListener('mouseleave', hide)

  onCleanup(() => {
    el.removeEventListener('mouseenter', show  as EventListener)
    el.removeEventListener('mousemove',  position as EventListener)
    el.removeEventListener('mouseleave', hide)
    tip.remove()
  })
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      tooltip: string
    }
  }
}