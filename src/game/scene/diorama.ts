// Imperative three.js diorama — a VIEW, never an input surface (docs/03 §3-4).
// Render-on-demand only: we render on state change, camera move, and short
// cosmetic bursts (turbine spin); no free-running 60fps loop. syncScene(state)
// is idempotent; Plan B (SVG panorama) would swap in behind the same interface.

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { seasonOf } from '../../engine/engine'
import { regionById } from '../../engine/data'
import type { GameState, Season } from '../../engine/types'
import {
  MAT,
  SLOT_POS,
  makeBattery,
  makeDam,
  makeGasPeaker,
  makeHouse,
  makePylon,
  makeSlotMarker,
  makeSolarArray,
  makeTerrain,
  makeTurbine,
  terrainHeight,
} from './assets'
import { seedFromString, rngNext } from '../../engine/rng'

const SKY: Record<Season, number> = {
  spring: 0x8fb8c9,
  summer: 0x9cc4d4,
  autumn: 0xc9a98f,
  winter: 0x9aa5b5,
}
const SKY_BLACKOUT = 0x1a1423

export class Diorama {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private container: HTMLElement
  private terrainGroup: THREE.Group | null = null
  private plantGroup = new THREE.Group()
  private villageGroup = new THREE.Group()
  private markerGroup = new THREE.Group()
  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private blades: THREE.Group[] = []
  private signature = ''
  private terrainRegion = ''
  private renderQueued = false
  private animUntil = 0
  private raf = 0
  private disposed = false
  private lastState: GameState | null = null
  private resizeObs: ResizeObserver
  private onVisibility = () => {
    if (document.visibilityState === 'visible') this.requestRender()
    else cancelAnimationFrame(this.raf)
  }

  constructor(container: HTMLElement, fxHigh: boolean) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    const mobile = Math.min(window.innerWidth, window.innerHeight) < 700
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2))
    this.renderer.shadowMap.enabled = fxHigh // no shadow maps on mobile (dev rules §6)
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    this.camera.position.set(9.5, 8.5, 11.5)
    this.camera.lookAt(0, 0, 0)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.minDistance = 8
    this.controls.maxDistance = 24
    this.controls.minPolarAngle = 0.5
    this.controls.maxPolarAngle = 1.35
    this.controls.enableDamping = false // damping needs a free loop — forbidden
    this.controls.addEventListener('change', () => this.requestRender())

    this.hemi = new THREE.HemisphereLight(0xfff4e0, 0x54452e, 1.15)
    this.sun = new THREE.DirectionalLight(0xffe6b3, 1.6)
    this.sun.position.set(6, 10, 4)
    if (fxHigh) this.sun.castShadow = true
    this.scene.add(this.hemi, this.sun, this.plantGroup, this.villageGroup, this.markerGroup)

    // context loss: rebuild the whole scene from state (scene = f(state), trivial)
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.signature = ''
      this.terrainRegion = ''
      if (this.lastState) this.sync(this.lastState)
    })

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(container)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
  }

  private resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  /** Idempotent: rebuilds only when the state-derived signature changes. */
  sync(state: GameState) {
    this.lastState = state
    const home = state.regions[0]
    const rdef = regionById(home)
    const rs = state.regionState[home]!
    const season = seasonOf(state.turn)
    const blackout = Boolean(state.lastReport?.blackoutRegions.includes(home))
    const plantsSig = state.plants
      .filter((p) => p.region === home)
      .map((p) => `${p.type}:${p.slot}:${p.turnsLeft > 0 ? 'c' : 'b'}`)
      .join(',')
    const sig = `${home}|${plantsSig}|${rs.prosperity}|${blackout ? 'dark' : 'lit'}|${season}`
    if (sig === this.signature) return
    this.signature = sig

    if (this.terrainRegion !== home) {
      if (this.terrainGroup) this.disposeGroup(this.terrainGroup)
      this.terrainGroup = makeTerrain(rdef)
      this.scene.add(this.terrainGroup)
      this.terrainRegion = home
    }

    const phase = rngNext(seedFromString(home)).value * Math.PI * 2
    const ground = (x: number, z: number) => terrainHeight(x, z, rdef.coast, phase)

    // sky + light mood: seasons tint the day; a blackout makes the diorama GO DARK
    this.scene.background = new THREE.Color(blackout ? SKY_BLACKOUT : SKY[season])
    this.hemi.intensity = blackout ? 0.25 : season === 'winter' ? 0.9 : 1.15
    this.sun.intensity = blackout ? 0.15 : season === 'winter' ? 1.0 : 1.6

    // ---- village: prosperity adds houses; windows die in a blackout ----
    this.disposeChildren(this.villageGroup)
    const houses = 3 + rs.prosperity * 2
    let word = seedFromString(`${home}-village`)
    for (let i = 0; i < houses; i++) {
      const a = rngNext(word)
      const b = rngNext(a.next)
      word = b.next
      const ang = (i / houses) * Math.PI * 2 + a.value
      const rad = 0.7 + b.value * 1.1
      const x = -0.4 + Math.cos(ang) * rad
      const z = -0.2 + Math.sin(ang) * rad * 0.8
      const house = makeHouse(true)
      const win = house.getObjectByName('window') as THREE.Mesh | null
      if (win) win.material = blackout ? MAT.windowOff : MAT.windowOn
      house.position.set(x, ground(x, z), z)
      house.rotation.y = a.value * Math.PI * 2
      this.villageGroup.add(house)
    }

    // ---- plants on their slots ----
    this.disposeChildren(this.plantGroup)
    this.blades = []
    let rooftops = 0
    let villageExtras = 0
    for (const p of state.plants) {
      if (p.region !== home) continue
      let mesh: THREE.Group | null = null
      let pos: [number, number]
      if (p.slot !== null) {
        pos = SLOT_POS[p.slot] ?? [0, 0]
      } else {
        // village-dwelling builds (rooftop, gaspeaker, battery, translink…)
        pos = [1.6 + (villageExtras % 3) * 0.9, 1.9 + Math.floor(villageExtras / 3) * 0.9]
        villageExtras++
      }
      switch (p.type) {
        case 'rooftop': {
          // a panel on a village house roof instead of its own footprint
          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.24), MAT.panel)
          const host = this.villageGroup.children[rooftops % Math.max(this.villageGroup.children.length, 1)]
          if (host) {
            panel.position.set(host.position.x, host.position.y + 0.52, host.position.z + 0.12)
            panel.rotation.x = -0.5
            this.plantGroup.add(panel)
          }
          rooftops++
          villageExtras--
          continue
        }
        case 'commsolar':
          mesh = makeSolarArray(2, 3)
          break
        case 'solarfarm':
          mesh = makeSolarArray(4, 5)
          break
        case 'turbine':
          mesh = makeTurbine(1)
          break
        case 'windfarm': {
          mesh = new THREE.Group()
          for (let i = 0; i < 3; i++) {
            const t = makeTurbine(0.85)
            t.position.set((i - 1) * 0.9, 0, (i % 2) * 0.5)
            mesh.add(t)
          }
          break
        }
        case 'offshore': {
          mesh = new THREE.Group()
          for (let i = 0; i < 2; i++) {
            const t = makeTurbine(1.1)
            t.position.set((i - 0.5) * 1.4, -0.35, 0)
            mesh.add(t)
          }
          break
        }
        case 'hpp':
          mesh = makeDam(true)
          break
        case 'pumpedhydro':
          mesh = makeDam(false)
          break
        case 'gaspeaker':
          mesh = makeGasPeaker()
          break
        case 'battery':
          mesh = makeBattery()
          break
        case 'translink':
        case 'cableshare': {
          mesh = new THREE.Group()
          for (let i = 0; i < 3; i++) {
            const py = makePylon()
            const x = pos[0] + i * 1.6
            const z = pos[1] - i * 1.2
            py.position.set(x - pos[0], ground(x, z) - ground(pos[0], pos[1]), z - pos[1])
            mesh.add(py)
          }
          break
        }
        default:
          continue // gig has no physical form
      }
      if (!mesh) continue
      const y = p.type === 'offshore' ? -0.16 : ground(pos[0], pos[1])
      mesh.position.set(pos[0], y, pos[1])
      if (p.turnsLeft > 0) {
        // under construction: ghosted
        mesh.traverse((o) => {
          if (o instanceof THREE.Mesh) o.material = MAT.ghost
        })
      } else {
        mesh.traverse((o) => {
          if (o.name === 'blades') this.blades.push(o as THREE.Group)
        })
      }
      this.plantGroup.add(mesh)
    }

    // ---- free-slot markers (decorative: the world reads as buildable) ----
    this.disposeChildren(this.markerGroup)
    const occupied = new Set(state.plants.filter((p) => p.region === home && p.slot !== null).map((p) => p.slot))
    rdef.slots.forEach((_, i) => {
      if (occupied.has(i)) return
      const [x, z] = SLOT_POS[i] ?? [0, 0]
      const m = makeSlotMarker()
      m.position.set(x, ground(x, z) + 0.04, z)
      this.markerGroup.add(m)
    })

    this.animate(1800) // short cosmetic burst: blades spin, then the loop STOPS
  }

  /** Renders once on the next frame (deduped). */
  requestRender() {
    if (this.renderQueued || this.disposed) return
    this.renderQueued = true
    requestAnimationFrame(() => {
      this.renderQueued = false
      if (!this.disposed) this.renderer.render(this.scene, this.camera)
    })
  }

  /** Bounded animation window — never a free-running loop. */
  private animate(ms: number) {
    this.animUntil = performance.now() + ms
    cancelAnimationFrame(this.raf)
    const tick = (t: number) => {
      if (this.disposed) return
      for (const b of this.blades) b.rotation.z = t * 0.004
      this.renderer.render(this.scene, this.camera)
      if (t < this.animUntil && document.visibilityState === 'visible') this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private disposeChildren(group: THREE.Group) {
    for (const child of [...group.children]) {
      group.remove(child)
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose() // materials are shared — keep
      })
    }
  }

  private disposeGroup(group: THREE.Group) {
    this.scene.remove(group)
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        if (o.name === 'terrain') (o.material as THREE.Material).dispose()
      }
    })
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.controls.dispose()
    if (this.terrainGroup) this.disposeGroup(this.terrainGroup)
    this.disposeChildren(this.plantGroup)
    this.disposeChildren(this.villageGroup)
    this.disposeChildren(this.markerGroup)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
