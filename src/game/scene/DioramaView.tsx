import { useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { Diorama } from './diorama'

// React mount for the imperative diorama. One-way: store → syncScene(state).
// The diorama is a view — all input stays in the DOM HUD (docs/03 §4).
export function DioramaView() {
  const ref = useRef<HTMLDivElement>(null)
  const fxHigh = useStore((s) => s.fxHigh)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const diorama = new Diorama(el, fxHigh)
    const initial = useStore.getState().state
    if (initial) diorama.sync(initial)
    const unsub = useStore.subscribe((s) => {
      if (s.state) diorama.sync(s.state)
    })
    return () => {
      unsub()
      diorama.dispose()
    }
  }, [fxHigh])

  return <div className="diorama" ref={ref} />
}
