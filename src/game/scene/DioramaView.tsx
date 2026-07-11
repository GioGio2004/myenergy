import { useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { Diorama } from './diorama'
import { buildRejection } from '../../engine/engine'

// React bridge for the imperative living-world scene. The engine remains the
// authority; raycasted plot/asset clicks are translated into normal actions.
export function DioramaView() {
  const ref = useRef<HTMLDivElement>(null)
  const fxHigh = useStore((s) => s.fxHigh)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const diorama = new Diorama(el, fxHigh, {
      onSlotSelect(slot) {
        const store = useStore.getState()
        if (!store.state || !store.placement) return
        const { buildable, region } = store.placement
        if (buildRejection(store.state, buildable, region, slot)) return
        store.dispatch({ type: 'build', buildable, region, slot })
        store.cancelPlacement()
      },
      onPlantSelect(plantId) {
        const store = useStore.getState()
        store.setPanel(null)
        store.selectPlant(plantId)
      },
    })
    const sync = (store: ReturnType<typeof useStore.getState>) => {
      if (!store.state) return
      diorama.sync(store.state, {
        region: store.viewRegion ?? store.state.regions[0],
        placement: store.placement,
        selectedPlantId: store.selectedPlantId,
      })
    }
    sync(useStore.getState())
    const unsub = useStore.subscribe((s) => {
      sync(s)
    })
    return () => {
      unsub()
      diorama.dispose()
    }
  }, [fxHigh])

  return <div className="diorama" ref={ref} />
}
